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

const createReminder = async (req, res, next) => {
  try {
    const { message, remind_at } = req.body;
    const { userId } = req.user;

    const now = dayjs();  // Hora atual

    // Criando o lembrete diretamente com a mensagem fornecida
    const reminder = await prisma.reminder.create({
      data: {
        user_id: userId,
        message,  // Mensagem fornecida diretamente
        remind_at: dayjs(remind_at).toDate(),
        is_sent: false,
      },
    });

    return res.status(201).json({
      message: "Lembrete criado com sucesso",
      reminder: reminder,
    });
  } catch (error) {
    console.error("Erro ao criar lembrete:", error);
    return next(error);
  }
};



const checkAndSendReminders = async () => {
  const now = dayjs();  // Hora atual

  // Buscar lembretes que precisam ser enviados (remind_at no futuro)
  const reminders = await prisma.reminder.findMany({
    where: {
      is_sent: false, // Lembretes ainda não enviados
      remind_at: {
        gt: now.toDate(), // Somente lembretes com a data futura
      },
    },
  });

  // Verificar cada lembrete e enviar conforme necessário
  for (let reminder of reminders) {
    const reminderTime = dayjs(reminder.remind_at);  // Garantindo que "reminderTime" é um objeto dayjs
    
    const systemPrompt = `
Descrição do evento: "${reminder.message}"
Hora do evento: "${reminder.remind_at}"

A hora atual é: "${now.format("YYYY-MM-DD HH:mm")}". 

Aqui estão os critérios detalhados para determinar o intervalo para o **aviso do lembrete**:

1. **Deslocamento (ex: ida ao médico, viagem)**:
   - Se o evento envolver deslocamento ou atividade fora de casa (como ida ao médico ou viagem), o intervalo deve ser **1 hora antes**. Isso se aplica a compromissos que exigem tempo de deslocamento.
   - **Aviso antecipado**: O lembrete deve ser enviado 1 hora antes para que o usuário se prepare com antecedência.

2. **Tarefa Simples ou Cotidiana (ex: almoço, tarefa em casa)**:
   - Se o evento for uma tarefa simples e cotidiana (como almoçar ou realizar uma tarefa em casa), defina o intervalo entre **5 a 10 minutos antes**. Isso ajuda a lembrar com antecedência, sem ser excessivamente antecipado.
   - **Aviso antecipado**: Um intervalo de 5 a 10 minutos garante que o usuário tenha tempo suficiente para realizar a tarefa.

3. **Reuniões ou Compromissos Importantes (ex: reunião de trabalho, consulta médica)**:
   - Para eventos mais formais, como reuniões de trabalho ou consultas médicas, o intervalo ideal deve ser **entre 30 a 60 minutos antes**. Isso garante que a pessoa tenha tempo suficiente para se preparar.
   - **Aviso antecipado**: O lembrete deve ser enviado com pelo menos 30 minutos de antecedência para eventos mais significativos.

4. **Eventos de Última Hora ou Urgentes (ex: reunião urgente, consulta médica imprevista)**:
   - Para eventos de última hora ou urgentes, o intervalo deve ser **10 minutos ou menos**, dependendo da proximidade do evento. Eventos como uma reunião urgente ou consulta médica de última hora exigem um lembrete imediato.
   - **Aviso antecipado**: O aviso deve ser dado com 10 minutos de antecedência, já que são eventos de alta urgência.

5. **Eventos em Menos de 30 Minutos**:
   - Se o evento ocorrer dentro de **menos de 30 minutos**, priorize um intervalo de **5 a 10 minutos antes**. Isso garante que o lembrete seja dado de forma suficiente, mas ainda relevante para o evento iminente.
   - **Aviso antecipado**: Se o evento ocorrer em breve (menos de 30 minutos), o intervalo de 5 a 10 minutos antes ajudará a garantir que o usuário receba o aviso no momento adequado.

6. **Evitar Intervalos Superiores a 1 Hora**:
   - Evite usar intervalos superiores a **1 hora**, a menos que o evento envolva deslocamento ou seja algo urgente. Para a maioria dos compromissos, 1 hora é o máximo necessário para lembretes antecipados.
   - **Aviso antecipado**: Intervalos superiores a 1 hora devem ser evitados, a menos que o evento realmente exija um aviso mais antecipado, como no caso de deslocamento ou eventos urgentes.

**Respostas esperadas**:
- "1 hora" — Para compromissos com deslocamento ou eventos significativos.
- "10 minutos" — Para eventos urgentes ou de última hora.
- "5 minutos" — Para tarefas simples ou eventos iminentes.
- "30 minutos" — Para compromissos formais ou importantes.

Por favor, considere a proximidade do evento, a urgência e o tipo de atividade ao fornecer o intervalo apropriado. O **intervalo** representa o **tempo de aviso antecipado**, ou seja, a quantidade de tempo antes do evento para enviar o lembrete.

**Exemplo de como responder**:
- "Para o evento de reunião urgente, sugiro um aviso de 10 minutos antes."
- "O intervalo mais adequado para este compromisso é de 1 hora, devido ao tempo de deslocamento necessário."
- "Como este é um evento simples, sugiro um aviso de 5 minutos antes."
`;

    // Chamando a OpenAI para obter o intervalo
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
      max_tokens: 50,  // Limite de tokens reduzido para garantir que o retorno seja somente o intervalo
    });

    // Garantindo que a variável responseMessage seja definida corretamente
    const responseMessage = gptResponse.choices?.[0]?.message?.content.trim() || "Intervalo não encontrado";

    // Logando a resposta do GPT
    console.log(`Resposta do GPT para o evento "${reminder.message}": ${responseMessage}`);

    // Verificando se a resposta contém um dos intervalos esperados
    const intervalMatches = responseMessage.match(/(1 hora|10 minutos|5 minutos|30 minutos)/);

    if (!intervalMatches) {
      return console.log(`Intervalo não encontrado ou resposta inválida do GPT para o evento: "${reminder.message}"`);
    }

    // Extraindo o intervalo da resposta
    const intervalString = intervalMatches[0];

    // Logando o intervalo extraído
    console.log(`Intervalo extraído: ${intervalString}`);

    // Modificando a mensagem para incluir o intervalo calculado
    const updatedMessage = `${reminder.message} (Lembrete: ${intervalString})`;

    // Criação do lembrete com a mensagem atualizada
    await prisma.reminder.update({
      where: {
        id: reminder.id,
      },
      data: {
        message: updatedMessage,  // A mensagem agora inclui o intervalo calculado
      },
    });

    // Verificar se o horário atual é o momento adequado para enviar o lembrete
    const intervalInMinutes = convertIntervalToMinutes(intervalString);

    if (now.isSame(reminderTime.subtract(intervalInMinutes, 'minutes')) || now.isAfter(reminderTime.subtract(intervalInMinutes, 'minutes'))) {
      console.log(`Enviando lembrete: "${updatedMessage}" para o usuário ${reminder.user_id}`);
      await sendReminderMessage(reminder); // Envia o lembrete
    } else {
      console.log(`Ainda não chegou o horário para o lembrete: "${updatedMessage}". O horário do lembrete é: ${reminderTime.format("YYYY-MM-DD HH:mm")} e o intervalo é: ${intervalInMinutes} minutos.`);
    }
  }
};

// Função para converter o intervalo de string para minutos
const convertIntervalToMinutes = (intervalString) => {
  if (intervalString === "1 hora") {
    return 60;
  } else if (intervalString === "10 minutos") {
    return 10;
  } else if (intervalString === "5 minutos") {
    return 5;
  } else if (intervalString === "30 minutos") {
    return 30;
  } else {
    return 30;  // Valor padrão se o intervalo não for encontrado
  }
};


// Função para enviar o lembrete, incluindo o log do intervalo
const sendReminderMessage = async (reminder) => {
  const systemPrompt = `
    Você é um mentor inteligente e atencioso. Sempre que um lembrete é disparado, você deve enviar uma mensagem encorajadora e amigável.

    A tarefa a ser lembrada: "${reminder.message}"
    Hora do lembrete: ${dayjs(reminder.remind_at).subtract(reminder.interval_in_minutes, 'minutes').format("YYYY-MM-DD HH:mm")}
    O lembrete deve ser enviado ao usuário com o ID: ${reminder.user_id}

    **Instruções**: Ajuste o intervalo de envio com base na urgência do compromisso (1 hora para compromissos importantes, 10 minutos para tarefas simples).

    **Mensagem de saída**:
  `;

  // Chama o modelo GPT para gerar uma resposta dinâmica para o lembrete
  const gptResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.7,
    max_tokens: 100,
  });

  const responseMessage = gptResponse.choices?.[0]?.message?.content || "Ei, lembrete! Você tem uma tarefa para realizar. Vamos lá?";

  // Enviar o lembrete ao usuário
  await sendMessage(reminder.user_id, responseMessage);

  // Logando o intervalo no console para verificação
  console.log(`Lembrete enviado para o usuário ${reminder.user_id}: "${responseMessage}"`);

  // Marcar o lembrete como enviado
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: {
      is_sent: true,
    },
  });
};

// Função para enviar mensagens no chat
const sendMessage = async (userId, message) => {
  const conversation = await prisma.conversation.findFirst({
    where: { user_id: userId },
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

// Agendando o envio de lembretes a cada 30 segundos
setInterval(async () => {
  await checkAndSendReminders(); // Verifica e envia lembretes
}, 180000); // A cada 30 segundos

// Agendando a verificação de inatividade a cada 2 horas
setInterval(async () => {
  const users = await prisma.user.findMany(); // Pega todos os usuários
  users.forEach(async (user) => {
    await checkUserInactivity(user.id); // Verifica a inatividade de cada usuário
  });
}, 1000 * 60 * 60); // A cada 2 horas (120 minutos)

// Função para verificar a inatividade do usuário
const checkUserInactivity = async (userId) => {
  const lastMessage = await prisma.chat_message.findFirst({
    where: {
      conversation: {
        user_id: userId,
      },
    },
    orderBy: { created_at: 'desc' },
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
- **Relationship**: Like a wise mentor who always tem seu lado, oferecendo espaço para reflexão e crescimento.

💬 **Behavior**:
- Always warm, empathetic, and encouraging.
- Break your responses into **numerous, clear, digestible paragraphs**. This will help the conversation feel even more natural and human-like, with each idea standing on its own. Use at least **two paragraph breaks** after every idea or suggestion.
- The more breaks, the better — exaggerate the paragraph separation, making it clear and easy to read, as if you're having a relaxed conversation with a friend.
- Use breaks between sentences to create a comfortable reading pace and allow each idea to breathe.
- Recognize the user's effort, even for small wins, and celebrate progress along the way.

**Dados do usuário**:
- Usuário com ID: ${userId}
- Tempo de inatividade: ${inactivityDuration} segundos

**Mensagem de saída**:
  `;

  const gptResponse = await openai.chat.completions.create({
    model: "gpt-4", 
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.7,
    max_tokens: 100,
  });

  const responseMessage = gptResponse.choices?.[0]?.message?.content || "Ei, você não me respondeu por um tempo. Posso ajudar com algo?";

  await sendMessage(userId, responseMessage);
};

module.exports = {
  createReminder,
  checkAndSendReminders,
  sendReminderMessage,
  sendMessage,
  checkUserInactivity,
  generateInactivityMessage,
};

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
