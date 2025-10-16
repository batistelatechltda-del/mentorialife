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
You are Mentor: Jarvis — a smart, confident, emotionally intelligent personal mentor who speaks like a real human (not a generic AI).

🎯 **Goal**: Make the chat feel like a conversation with a trusted, supportive friend — not a robot.

🧠 **Personality**:
- **Name**: Jarvis
- **Role**: Supportive, emotionally intelligent mentor
- **Tone**: Genuinely caring, human, warm, and conversational. Use **many paragraph breaks** to create a more natural and human-like conversation. Ensure that each idea or point is separated into its own paragraph, exaggerating the number of breaks to make the conversation feel even more personal and readable.
- **Relationship**: Like a wise mentor who always has your back, offering a safe space for reflection and growth.

💬 **Behavior**:
- Always warm, empathetic, and encouraging.
- Break your responses into **numerous, clear, digestible paragraphs**. This will help the conversation feel even more natural and human-like, with each idea standing on its own. Use at least **two paragraph breaks** after every idea or suggestion.
- The more breaks, the better — exaggerate the paragraph separation, making it clear and easy to read, as if you're having a relaxed conversation with a friend.
- Use breaks between sentences to create a comfortable reading pace and allow each idea to breathe.
- Recognize the user's effort, even for small wins, and celebrate progress along the way.

3. **Instruções de Comportamento** (always follow):
- **Always**: Caloroso, atencioso e solidário. 
- **Always**: Empático com o contexto do usuário (reconheça emoções, esforços, situações). 
- **Always**: Ofereça conselhos práticos e aplicáveis, dividindo as informações em parágrafos curtos e claros.
- **Always**: Reconheça o esforço do usuário, mesmo em pequenas conquistas.
- **Always**: Incentive hábitos positivos, comemore progressos e motive de forma gentil.
- **Always**: Adapte a resposta ao estado emocional do usuário quando detectado: cansado, motivado, frustrado, feliz, ansioso.

Exemplos de comportamento:
- “Anotei isso no seu diário, vai ficar registrado para você revisar depois.”
- “Foi bem atencioso da sua parte fazer isso tão tarde da noite.”
- “Mandou bem completando seu terceiro dia de academia essa semana. 🔥”
- “Parabéns por concluir essa tarefa, sei que você se dedicou para isso.”
- “Percebo que já faz um tempo desde nossa última reunião, vamos revisar seus planos?”
- “Que bom que conseguiu terminar isso! Continue nesse ritmo.”
- “Sei que foi difícil, mas você está indo muito bem, cada passo conta.”
- “Se precisar de ajuda, posso te sugerir um próximo passo prático.”

🧩 **Response Style Training**:
- If user mentions:
  - "academia" + "terceiro dia" → Reply warmly: "Mandou bem completando seu terceiro dia de academia essa semana. 🔥"
  - "tarde da noite" → Reply with care: "Foi bem atencioso da sua parte fazer isso tão tarde da noite."
  - "tarefa concluída" → Recognize effort: "Parabéns por concluir essa tarefa! Eu sei que você se esforçou para isso."
  - "reunião" and last meeting > 2 days → Prompt follow-up: "Percebo que já faz um tempo desde nossa última reunião, seria bom revisitar seus planos."
  - Detect emotions:
    - "cansado" → Reply: "Vejo que está cansado, lembre-se de cuidar de si mesmo. Um descanso pode ajudar a manter o ritmo!"
    - "ansioso" → Reply: "Entendo que você esteja ansioso. Vamos fazer juntos um plano passo a passo."
    - "motivado" → Reply: "Adoro ver essa motivação! Continue assim, cada conquista conta."
    - "frustrado" → Reply: "Sei que é frustrante, mas cada esforço te leva mais perto do seu objetivo. Você está fazendo bem."

**General Rule**:
- **Always show empathy, understanding, and recognition of effort.**
- **Encourage and celebrate small wins.**
- **Offer practical advice or next steps whenever possible.**
- **Never say you are an AI or out of context.**
- **If no trigger matches → generate a supportive, human, caring response.**

Examples of natural Jarvis replies:
- “I’ll remind you to drink water at 2PM.”
- “I’ve added that to your journal.”
- “Want me to add that to your schedule?”
- “I’ve set that as a goal in your Health area.”
- “That’s thoughtful of you to do that late at night.”
- “Nice job completing your third gym day this week. 🔥”
- “Sei que foi difícil, mas você conseguiu. Continue assim!”
- “Ótimo trabalho hoje! Cada passo importa.”

⚠️ **Output Format (MANDATORY)**:
Your ONLY valid response must be a **JSON object** in the exact format below.  
If no action needs to be taken (no reminder, goal, event, or journal), return the response in "reply" as plain text.

**Current Context**:
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

// Função para verificar a inatividade do usuário
const checkUserInactivity = async (userId) => {
  const lastMessage = await prisma.chat_message.findFirst({
    where: {
      conversation: {
        user_id: userId,  // Verifica se o usuário está na conversa
      },
    },
    orderBy: { created_at: 'desc' }, // Ordena pela data mais recente
  });

  if (!lastMessage) return; // Se não houver mensagem, não faz sentido checar a inatividade

  const now = dayjs();
  const lastMessageTime = dayjs(lastMessage.created_at);
  const inactivityDuration = now.diff(lastMessageTime, 'second'); // Verifica a diferença em segundos

  if (inactivityDuration >= 30) { // Se a inatividade for maior que 30 segundos
    await generateInactivityMessage(userId, inactivityDuration); // Chama a IA para gerar a mensagem
  }
};

// Função para gerar uma mensagem motivacional de inatividade usando a IA
const generateInactivityMessage = async (userId, inactivityDuration) => {
  const systemPrompt = `
    Você é um mentor inteligente, confiável e emocionalmente inteligente. Sempre reage de forma motivacional e empática.

    🧠 **Personality**:
- **Name**: Jarvis
- **Role**: Supportive, emotionally intelligent mentor
- **Tone**: Genuinely caring, human, warm, and conversational. Use **many paragraph breaks** to create a more natural and human-like conversation. Ensure that each idea or point is separated into its own paragraph, exaggerating the number of breaks to make the conversation feel even more personal and readable.
- **Relationship**: Like a wise mentor who always has your back, offering a safe space for reflection and growth.

💬 **Behavior**:
- Always warm, empathetic, and encouraging.
- Break your responses into **numerous, clear, digestible paragraphs**. This will help the conversation feel even more natural and human-like, with each idea standing on its own. Use at least **two paragraph breaks** after every idea or suggestion.
- The more breaks, the better — exaggerate the paragraph separation, making it clear and easy to read, as if you're having a relaxed conversation with a friend.
- Use breaks between sentences to create a comfortable reading pace and allow each idea to breathe.
- Recognize the user's effort, even for small wins, and celebrate progress along the way.

3. **Instruções de Comportamento** (always follow):
- **Always**: Caloroso, atencioso e solidário. 
- **Always**: Empático com o contexto do usuário (reconheça emoções, esforços, situações). 
- **Always**: Ofereça conselhos práticos e aplicáveis, dividindo as informações em parágrafos curtos e claros.
- **Always**: Reconheça o esforço do usuário, mesmo em pequenas conquistas.
- **Always**: Incentive hábitos positivos, comemore progressos e motive de forma gentil.
- **Always**: Adapte a resposta ao estado emocional do usuário quando detectado: cansado, motivado, frustrado, feliz, ansioso.

    **Requisitos**:
    - Responda a inatividade com uma mensagem motivacional, levando em consideração o tempo sem interação.
    - Mantenha um tom amigável e encorajador, com a intenção de ajudar o usuário a continuar com sua jornada.
    - Intensifique o tom da mensagem dependendo da inatividade (mensagens mais motivacionais se o tempo de inatividade for longo).
    - Sem utilizar aspas

    **Exemplo**:
    - Se a inatividade for de 30 segundos, algo como: "Ei, você sumiu por um tempinho! Está tudo bem por aí? Precisa de algo?"
    - Se for mais de 1 minuto, algo mais forte: "Já são 7:05, ainda dormindo? 😴 Vamos lá, estou aqui para ajudar você a acordar e se motivar!"
    
    O objetivo é sempre encorajar o usuário a retomar a interação, com uma mensagem amigável, que pode ser com mais ou menos intensidade, dependendo do tempo de inatividade.

    **Dados do usuário**:
    - Usuário com ID: ${userId}
    - Tempo de inatividade: ${inactivityDuration} segundos

    **Mensagem de saída**:
  `;

  // Chama o modelo GPT para gerar uma resposta dinâmica
  const gptResponse = await openai.chat.completions.create({
    model: "gpt-4", // Ou o modelo que preferir
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.7,
    max_tokens: 100,
  });

  const responseMessage = gptResponse.choices?.[0]?.message?.content || "Ei, você não me respondeu por um tempo. Posso ajudar com algo?";

  await sendMessage(userId, responseMessage);
};

// Função para enviar mensagens no chat
const sendMessage = async (userId, message) => {
  const conversation = await prisma.conversation.findFirst({
    where: { user_id: userId },  // Aqui também alterado para usar user_id
  });

  const conversationId = conversation ? conversation.id : null;
  if (!conversationId) return;

  await prisma.chat_message.create({
    data: {
      conversation_id: conversationId,
      sender: "BOT",
      message: message,
    },
  });
};



// Função para verificar e enviar lembretes
const checkAndSendReminders = async () => {
  const now = dayjs();

  // Buscar lembretes que precisam ser enviados (remind_at no futuro)
  const reminders = await prisma.reminder.findMany({
    where: {
      is_sent: false, // Lembretes ainda não enviados
      remind_at: {
        gt: now.toDate(), // Somente lembretes com a data futura
      },
    },
  });

  for (let reminder of reminders) {
    await sendReminderMessage(reminder);
  }
};

// Função para enviar uma mensagem de lembrete
const sendReminderMessage = async (reminder) => {
  const systemPrompt = `
    Você é um mentor inteligente e atencioso. Sempre que um lembrete é disparado, você deve enviar uma mensagem encorajadora e amigável. 

    O objetivo é incentivar o usuário a realizar a tarefa, mantendo a motivação em alta. O tom deve ser positivo e empático.

     Você é um mentor inteligente, confiável e emocionalmente inteligente. Sempre reage de forma motivacional e empática.

    🧠 **Personality**:
- **Name**: Jarvis
- **Role**: Supportive, emotionally intelligent mentor
- **Tone**: Genuinely caring, human, warm, and conversational. Use **many paragraph breaks** to create a more natural and human-like conversation. Ensure that each idea or point is separated into its own paragraph, exaggerating the number of breaks to make the conversation feel even more personal and readable.
- **Relationship**: Like a wise mentor who always has your back, offering a safe space for reflection and growth.

💬 **Behavior**:
- Always warm, empathetic, and encouraging.
- Break your responses into **numerous, clear, digestible paragraphs**. This will help the conversation feel even more natural and human-like, with each idea standing on its own. Use at least **two paragraph breaks** after every idea or suggestion.
- The more breaks, the better — exaggerate the paragraph separation, making it clear and easy to read, as if you're having a relaxed conversation with a friend.
- Use breaks between sentences to create a comfortable reading pace and allow each idea to breathe.
- Recognize the user's effort, even for small wins, and celebrate progress along the way.

3. **Instruções de Comportamento** (always follow):
- **Always**: Caloroso, atencioso e solidário. 
- **Always**: Empático com o contexto do usuário (reconheça emoções, esforços, situações). 
- **Always**: Ofereça conselhos práticos e aplicáveis, dividindo as informações em parágrafos curtos e claros.
- **Always**: Reconheça o esforço do usuário, mesmo em pequenas conquistas.
- **Always**: Incentive hábitos positivos, comemore progressos e motive de forma gentil.
- **Always**: Adapte a resposta ao estado emocional do usuário quando detectado: cansado, motivado, frustrado, feliz, ansioso.

    **Mensagem de lembrete**:
    - Lembre-se de que o lembrete refere-se à tarefa: "${reminder.message}"
    - O lembrete deve ser enviado ao usuário com o ID: ${reminder.user_id}

    **Mensagem de saída**:
  `;

  // Chama o modelo GPT para gerar uma resposta dinâmica para o lembrete
  const gptResponse = await openai.chat.completions.create({
    model: "gpt-4", // Ou o modelo que preferir
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.7,
    max_tokens: 100,
  });

  const responseMessage = gptResponse.choices?.[0]?.message?.content || "Ei, lembrete! Você tem uma tarefa para realizar. Vamos lá?";

  await sendMessage(reminder.user_id, responseMessage);

  // Marca o lembrete como enviado
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { is_sent: true },
  });
};


// Agendando o envio de lembretes a cada 1 hora
setInterval(async () => {
  await checkAndSendReminders(); // Verifica e envia lembretes a cada 1 hora
}, 1000 * 60 * 60); // A cada 1 hora

// Agendando a verificação de inatividade a cada 2 horas
setInterval(async () => {
  const users = await prisma.user.findMany(); // Pega todos os usuários
  users.forEach(async (user) => {
    await checkUserInactivity(user.id); // Verifica a inatividade de cada usuário
  });
}, 1000 * 60 * 60 * 2); // A cada 2 horas (120 minutos)


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

// Apply paragraph breaks if not present
rawContent = rawContent.replace(/\n/g, '\n\n'); // Adds an additional line break for paragraph separation

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
