import admin from "firebase-admin";
const { messaging } = require("./configs/firebaseAdmin");
const env = require("dotenv");
const path = require("path");
const messaging = admin.messaging();
const cron = require("node-cron");
const app = require("./app");
const cors = require("cors");
const { logger } = require("./configs/logger");
const { createAndSendEmail } = require("./configs/email");
const { prisma } = require("./configs/prisma");
const pushRoutes = require("./routes/push");  // Importa as rotas de push
const { emailTemplateForReminder } = require("./email/emailTemplateForReminder");


const sendSMS = require("./configs/twilio");
const dayjs = require("dayjs");
const { pusher } = require("./configs/pusher");

const envFile =
  process.env.NODE_ENV == "development"
    ? ".env.development"
    : process.env.NODE_ENV == "staging"
      ? ".env.staging"
      : process.env.NODE_ENV == "test"
        ? ".env.test"
        : ".env";

env.config({ path: path.resolve(__dirname, envFile), override: true });
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "192.168.18.71";


// Configuração do CORS
const corsOptions = {
  origin: "http://localhost:3000", // Permitir requisições de localhost:3000
  methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
  allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos permitidos
};

app.use(cors(corsOptions)); // Habilitar CORS para o backend

app.use("/api/push", pushRoutes);  // Registra a rota de push no caminho '/api/push'

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server is listening at http://${HOST}:${PORT}
  🌍 Environment: ${process.env.NODE_ENV || "live"}
  ⚙️ Loaded Config from: ${envFile}
  🧪 TEST_VAR: ${process.env.TEST_VAR}`);
});

cron.schedule("*/1 * * * *", async () => {
  const currentDate = dayjs().toISOString();

  const [reminders, goals, calendarEvents] = await Promise.all([
    prisma.reminder.findMany({
      where: {
        is_email_sent: false,
        remind_at: { lte: currentDate },
      },
      include: {
        user: { include: { profile: true } },
      },
    }),
    prisma.goal.findMany({
      where: {
        is_email_sent: false,
        is_completed: false,
        due_date: { lte: currentDate },
      },
      include: {
        user: { include: { profile: true } },
      },
    }),
    prisma.calendar_event.findMany({
      where: {
        is_email_sent: false,
        is_completed: false,
        start_time: { lte: currentDate },
      },
      include: {
        user: { include: { profile: true } },
      },
    }),
  ]);

  const sendNotifications = async (items, type) => {
    const promises = items.map(async (item) => {
      const username = item?.user?.profile?.full_name;
      const phone = item?.user?.profile?.phone_number;
      const userId = item.user_id;

      let title = "";
      let description = "";

      if (type === "goal" || type === "reminder" || type === "calendar_event") {
        title = `${type === "goal" ? "Goal" : type === "reminder" ? "Reminder" : "Event"} Missed Notification`;

        if (type === "goal") {
          description = `You’ve made incredible progress! You missed your goal titled "${item.title}". How about completing it tomorrow? You’re so close to completing it! 🔥`;
        } else if (type === "reminder") {
          description = `You missed your reminder: "${item.message}". Don’t worry! Let’s get back on track tomorrow. You got this! 💪`;
        } else if (type === "calendar_event") {
          description = `You missed your event titled "${item.title}". Life happens! Want to reschedule for tomorrow or the next day? You can do it! 🌟`;
        }
      }

      const html = emailTemplateForReminder({ username, title, description });

      try {
        await createAndSendEmail({
          to: item?.user?.email,
          subject: title,
          text: description,
          html,
        });

        if (phone) {
          await sendSMS(phone, `${title}: ${description}`);
        }

        const conversation = await prisma.conversation.findFirst({
          where: { user_id: userId },
        });

        if (conversation?.id) {
          const createdMessage = await prisma.chat_message.create({
            data: {
              conversation_id: conversation.id,
              message: `${title}: ${description}`,
              sender: "BOT",
            },
          });

          await pusher.trigger(`user-${userId}`, "notification", {
            id: createdMessage.id,
            message: createdMessage.message,
            sender: createdMessage.sender,
            timestamp: createdMessage.created_at,
          });
        }

        try {
          // Buscar tokens do usuário
          const tokens = await prisma.push_token.findMany({
            where: { user_id: item.user.id },
            select: { token: true },
          });


    // ✅ Novo método compatível com firebase-admin >= 13.0.0
          const registrationTokens = tokens.map(t => t.token).filter(Boolean);
          if (registrationTokens.length) {
            const message = {
              tokens: registrationTokens,
              notification: {
                title: `${title || "Reminder"}`,
                body: `${description || item.message || "You have a reminder."}`,
              },
              data: {
                type: type,
                id: String(item.id),
              },
            };

            // Usando o sendMulticast para enviar a notificação para múltiplos tokens (Versão < 13.7.0)
            const response = await messaging.sendMulticast(message);


            // Opcional: limpar tokens inválidos
            if (response.failureCount > 0) {
              const failedTokens = [];
              response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                  failedTokens.push(registrationTokens[idx]);
                }
              });
              if (failedTokens.length) {
                await prisma.push_token.deleteMany({
                  where: { token: { in: failedTokens } },
                });
              }
            }
          }
        } catch (err) {
          console.error("FCM send error:", err);
        }

        await prisma[type].update({
          where: { id: item.id },
          data: { is_email_sent: true },
        });
      } catch (err) {
        console.error(
          `Failed ${type} notification for user ${item.user.email}:`,
          err
        );
      }
    });

    await Promise.all(promises);
  };

  await Promise.all([
    sendNotifications(reminders, "reminder"),
    sendNotifications(goals, "goal"),
    sendNotifications(calendarEvents, "calendar_event"),
  ]);
});

cron.schedule("*/30 * * * *", async () => {

  const now = dayjs();
  const cutoff = now.subtract(24, "hour").toDate();
  const todayStart = now.startOf("day").toDate();
  const todayEnd = now.endOf("day").toDate();

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { last_wakeup_email: null },
        { last_wakeup_email: { lt: cutoff } },
      ],
    },
    include: {
      profile: true,
      conversations: true,
    },
  });

  if (!users.length) {
    return;
  }

  await Promise.all(
    users.map(async (user) => {
      const { full_name, phone_number } = user.profile || {};
      const userId = user.id;

      const conversation = user.conversations[0];
      if (!conversation) {
        return;
      }

      const messageToday = await prisma.chat_message.findFirst({
        where: {
          conversation_id: conversation.id,
          created_at: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });

      if (messageToday) {
        console.log(`⏭️ Skipped ${user.email} — already has message today`);
        return;
      }

      const title = "☀️ Good Morning!";
      const description = "Hey bro, you awake? Let’s go — new day, new mission.";
      const html = emailTemplateForReminder({ username: full_name, title, description });

      try {
        await createAndSendEmail({
          to: user.email,
          subject: title,
          text: description,
          html,
        });

        if (phone_number) {
          await sendSMS(phone_number, `${title}: ${description}`);
        }

        const createdMessage = await prisma.chat_message.create({
          data: {
            conversation_id: conversation.id,
            message: `${title}: ${description}`,
            sender: "BOT",
          },
        });

        await pusher.trigger(`user-${userId}`, "notification", {
          id: createdMessage.id,
          message: createdMessage.message,
          sender: createdMessage.sender,
          timestamp: createdMessage.created_at,
        });

        await prisma.user.update({
          where: { id: userId },
          data: { last_wakeup_email: now.toDate() },
        });

        console.log(`✅ Wakeup email sent to: ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed for ${user.email}`, err.message || err);
      }
    })
  );
});

app.get("/", async (req, res) => {
  res.send("server is running");
});
