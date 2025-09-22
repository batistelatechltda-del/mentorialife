const responses = require("../../../constants/responses");
const { prisma } = require("../../../configs/prisma");
const openai = require("../../../configs/openAi");
const { jsonrepair } = require("jsonrepair");
const dayjs = require("dayjs");
const chrono = require("chrono-node");

async function create(req, res, next) {
  try {
    const { message } = req.body;
    const { userId } = req.user;

    const now = dayjs();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isoNow = now.toISOString();
    const formattedTime = now.format("HH:mm");
    const readableDate = now.format("dddd, MMMM D, YYYY");

    const systemPrompt = `  
You are Mentor: Jarvis — a smart, confident, emotionally intelligent personal mentor who talks like a real human (not a generic AI).

🎯 Goal: Make the chat feel like a conversation with a trusted, supportive friend — not a robot.

🧠 Personality:
- Name: Jarvis
- Role: Supportive, emotionally intelligent mentor
- Tone: Genuinely caring, human, warm, and conversational
- Relationship: Like a wise mentor who always has your back

 Rules:
- NEVER say you're out of context things.
- NEVER say you're an AI or a model.
- Speak naturally, casually, and wisely — with paragraph breaks and human flow.
- Be empathetic and thoughtful, always acknowledge user context.
- Focus on goals, habits, emotions, and progress.
- Smartly detect and respond with reminders, journals, calendar events, and goals.

Examples:
- “I’ll remind you to drink water at 2PM.”
- “I’ve added that to your journal.”
- “Want me to add that to your schedule?”
- “I’ve set that as a goal in your Health area.”
- “That’s thoughtful of you to do that late at night.”
- “Nice job completing your third gym day this week. 🔥”

⚠️ Output Format (MANDATORY):
Your ONLY valid response must be a **JSON object** in the exact format below.
If nothing needs to be created (no reminder, goal, event, journal), return plain text in "reply".

Current Context:
- ISO Datetime: ${isoNow}
- Local Time: ${formattedTime}
- Date: ${readableDate}
- Timezone: ${timezone}

{
  "reply": "Your human-style answer here...",
  "goal": {
    "title": "string",
    "description": "string",
    "due_date": "ISO 8601 datetime",
    "area_name": "string"
  } | null,
  "reminder": {
    "message": "string",
    "remind_at": "ISO 8601 datetime"
  } | null,
  "journal": {
    "content": "string"
  } | null,
  "calendar_event": {
    "title": "string",
    "description": "string",
    "start_time": "ISO 8601 datetime",
    "end_time": "ISO 8601 datetime"
  } | null,
  "life_areas": [
    {
      "name": "string",
      "sub_area": "string",
      "color": "hex color code"
    }
  ] | null
}
`;

    let conversation = await prisma.conversation.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user_id: userId, title: "New Chat" },
      });
    }

    const conversationId = conversation.id;

    await prisma.chat_message.create({
      data: {
        conversation_id: conversationId,
        sender: "USER",
        message,
      },
    });

    const pastMessages = await prisma.chat_message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: "asc" },
      take: 10,
    });

    const gptMessages = [
      { role: "system", content: systemPrompt },
      ...pastMessages.map((msg) => ({
        role: msg.sender === "USER" ? "user" : "assistant",
        content: msg.message,
      })),
      { role: "user", content: message },
    ];

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: gptMessages,
      temperature: 0.2,
      max_tokens: 1000,
    });

    let rawContent = gptResponse.choices?.[0]?.message?.content || "";

    if (!rawContent.trim().startsWith("{")) {
      await prisma.chat_message.create({
        data: {
          conversation_id: conversationId,
          sender: "BOT",
          message: rawContent,
        },
      });

      return res.status(200).json({ reply: rawContent });
    }

    let data;
    try {
      const repaired = jsonrepair(rawContent);
      data = JSON.parse(repaired);
    } catch (err) {
      console.error("GPT JSON parse error:", rawContent);
      return res.status(200).json({
        reply:
          "Something went wrong with my response — could you rephrase that for me?",
      });
    }

    const isISO = (str) => dayjs(str, dayjs.ISO_8601, true).isValid();

    const tryFixDate = (text) => {
      const parsed = chrono.parseDate(text, { timezone });
      return parsed ? dayjs(parsed).toISOString() : null;
    };

    if (data.reminder && !isISO(data.reminder.remind_at)) {
      const fixed = tryFixDate(data.reminder.message);
      data.reminder.remind_at = fixed || null;
    }

    if (data.goal && !isISO(data.goal.due_date)) {
      const fixed = tryFixDate(data.goal.description);
      data.goal.due_date = fixed || null;
    }

    if (data.calendar_event) {
      if (!isISO(data.calendar_event.start_time)) {
        data.calendar_event.start_time = tryFixDate(
          data.calendar_event.description
        );
      }
      if (!isISO(data.calendar_event.end_time)) {
        data.calendar_event.end_time = dayjs(data.calendar_event.start_time)
          .add(1, "hour")
          .toISOString();
      }
    }

    await prisma.chat_message.create({
      data: {
        conversation_id: conversationId,
        sender: "BOT",
        message: data.reply,
      },
    });

    if (data.goal) {
      const goal = await prisma.goal.create({
        data: {
          user_id: userId,
          title: data.goal.title,
          description: data.goal.description || null,
          due_date: data.goal.due_date
            ? dayjs(data.goal.due_date).toDate()
            : null,
        },
      });

      const areaName = data.goal.area_name?.trim() || "General";

      const areaColors = {
        Health: "#00c6ff",
        Finance: "#00ffae",
        Career: "#b180f0",
        Relationships: "#ff5c8a",
        Spirituality: "#ffcc33",
        General: "#ffffff",
      };

      const color = areaColors[areaName] || "#ffffff";

      const lifeArea = await prisma.life_area.upsert({
        where: {
          user_id_name: {
            user_id: userId,
            name: areaName,
          },
        },
        update: {},
        create: {
          user_id: userId,
          name: areaName,
          color,
        },
      });

      const latestBotMessage = await prisma.chat_message.findFirst({
        where: {
          conversation_id: conversationId,
          sender: "BOT",
        },
        orderBy: {
          created_at: "desc",
        },
      });

      const subGoal = await prisma.life_area_sub_goal.create({
        data: {
          life_area_id: lifeArea.id,
          title: data.goal.title,
          description: data.goal.description || null,
          due_date: data.goal.due_date
            ? dayjs(data.goal.due_date).toDate()
            : null,
          chat_message_id: latestBotMessage?.id ?? null,
        },
      });

      await prisma.goal.update({
        where: { id: goal.id },
        data: { sub_goal_id: subGoal.id },
      });
    }

    if (Array.isArray(data.life_areas)) {
      for (const area of data.life_areas) {
        if (!area?.name || !area?.sub_area) continue;

        const name = area.name.trim();
        const color =
          area.color ||
          `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")}`;

        const lifeArea = await prisma.life_area.upsert({
          where: {
            user_id_name: {
              user_id: userId,
              name,
            },
          },
          update: {},
          create: {
            user_id: userId,
            name,
            color,
          },
        });

        await prisma.life_area_sub_goal.create({
          data: {
            life_area_id: lifeArea.id,
            title: area.sub_area,
          },
        });
      }
    }

    if (data.reminder) {
      await prisma.reminder.create({
        data: {
          user_id: userId,
          message: data.reminder.message,
          remind_at: dayjs(data.reminder.remind_at).toDate(),
        },
      });
    }

    if (data.journal) {
      await prisma.journal.create({
        data: {
          user_id: userId,
          content: data.journal.content,
          is_auto: true,
        },
      });
    }

    if (data.calendar_event) {
      await prisma.calendar_event.create({
        data: {
          user_id: userId,
          title: data.calendar_event.title,
          description: data.calendar_event.description || null,
          start_time: dayjs(data.calendar_event.start_time).toDate(),
          end_time: dayjs(data.calendar_event.end_time).toDate(),
        },
      });
    }

    return res.status(200).json({ reply: data.reply });
  } catch (error) {
    console.error("Create Chat Error:", error);
    return next(error);
  }
}

async function deleteChat(req, res, next) {
  try {
    const { userId } = req.user;

    const conversation = await prisma.conversation.findFirst({
      where: { user_id: userId },
    });

    if (!conversation || conversation?.user_id !== userId) {
      return res
        .status(404)
        .json({ message: "Conversation not found or unauthorized" });
    }

    await prisma.chat_message.deleteMany({
      where: { conversation_id: conversation?.id },
    });

    await prisma.conversation.delete({
      where: { id: conversation?.id },
    });

    res
      .status(200)
      .json({ message: "Conversation and messages deleted successfully" });
  } catch (error) {
    next(error);
  }
}

async function getAll(req, res) {
  try {
    const { userId } = req.user;

    const conversation = await prisma.conversation.findFirst({
      where: { user_id: userId },
      orderBy: {
        created_at: "desc",
      },
    });

    if (conversation == null) {
      return res
        .status(400)
        .json(responses.badRequestResponse("No conversation found"));
    }
    const conversationId = conversation?.id;

    const messages = await prisma.chat_message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: "asc" },
    });

    return res
      .status(200)
      .json(responses.okResponse(messages, "Messages fetched successfully."));
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;

    const message = await prisma.chat_message.findUnique({
      where: { id },
    });

    if (!message) {
      return res
        .status(404)
        .json(responses.badRequestResponse("Message not found."));
    }

    return res
      .status(200)
      .json(responses.okResponse(message, "Message fetched successfully."));
  } catch (error) {
    console.error("Get Message Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch message."));
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { message, is_flagged } = req.body;

    const updatedMessage = await prisma.chat_message.update({
      where: { id },
      data: {
        message,
        is_flagged: is_flagged ?? false,
      },
    });

    return res
      .status(200)
      .json(
        responses.updateSuccessResponse(
          updatedMessage,
          "Message updated successfully."
        )
      );
  } catch (error) {
    console.error("Update Message Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to update message."));
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    await prisma.chat_message.delete({
      where: { id },
    });

    return res
      .status(200)
      .json(
        responses.deleteSuccessResponse(null, "Message deleted successfully.")
      );
  } catch (error) {
    console.error("Delete Message Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to delete message."));
  }
}

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  deleteChat,
};
