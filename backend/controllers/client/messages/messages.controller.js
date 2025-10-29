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

"Behavior examples": [
    "I’ve added that to your journal, it’ll be there for you to review later.",
    "That was really thoughtful of you to do that so late at night.",
    "Nice job completing your third gym day this week. 🔥",
    "Congrats on finishing that task, I know you worked hard for it.",
    "I see it’s been a while since our last meeting, let’s go over your plans?",
    "Glad you were able to finish that! Keep going at this pace.",
    "I know it was tough, but you’re doing really well, every step counts.",
    "If you need help, I can suggest a practical next step."
  ]
}

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

    // Criando o lembrete diretamente com a mensagem fornecida (sem incluir o intervalo na mensagem)
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
  // Função delay para aguardar um tempo em milissegundos
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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
    try {
      const reminderTime = dayjs(reminder.remind_at);  // Garantindo que "reminderTime" é um objeto dayjs

      // Definir o sistema de critérios para o intervalo com base na lógica
      const systemPrompt = `
Você é um assistente inteligente encarregado de calcular o intervalo ideal para enviar lembretes com base nas informações do evento. 
O objetivo é calcular o tempo necessário entre o momento atual e o evento, para garantir que o lembrete seja enviado no momento correto.

Descrição do evento: "${reminder.message}"
Hora do evento: "${reminder.remind_at}"

A hora atual é: "${now.format("YYYY-MM-DD HH:mm")}". 

### **Objetivo**: 
Determinar o intervalo de tempo para o lembrete, com base no tipo de evento que está sendo descrito, para garantir que o lembrete seja enviado na hora certa.

Critérios para determinar o intervalo:

Eventos com deslocamento (requiring travel):
- Intervalo recomendado: "1 hora".
- Exemplos: "Reunião de trabalho em um local distante", "Consulta médica em outro bairro", "Voo de avião para outra cidade".
- Justificativa: Eventos que exigem deslocamento demandam mais tempo para o usuário se organizar e chegar a tempo.

Eventos simples e cotidianos (tarefas rápidas ou de curto prazo):
- Intervalo recomendado: "5 a 10 minutos".
- Exemplos: "Almoçar em casa", "Fazer uma tarefa doméstica", "Organizar a mesa de trabalho".
- Justificativa: Para eventos simples que não exigem preparação, o intervalo pode ser muito curto, entre 5 a 10 minutos antes.

Compromissos importantes ou formais (requiring preparation):
- Intervalo recomendado: "30 a 60 minutos".
- Exemplos: "Reunião de trabalho com cliente", "Consulta médica", "Entrevista de emprego", "Reunião de negócios com apresentação".
- Justificativa: Eventos mais formais, que exigem algum nível de preparação ou deslocamento, precisam de lembrete antecipado de 30 a 60 minutos.

Eventos urgentes ou de última hora (immediate action required):
- Intervalo recomendado: "10 minutos" ou "menos de 10 minutos".
- Exemplos: "Reunião urgente", "Consulta médica de última hora", "Entrevista urgente", "Mudança de planos de última hora".
- Justificativa: Para eventos urgentes ou imprevistos, o intervalo precisa ser o mais próximo possível do evento, normalmente 10 minutos ou menos.

Eventos imediatos ou próximos (within 30 minutes or less):
- Intervalo recomendado: "5 a 10 minutos".
- Exemplos: "Chamada de vídeo em 15 minutos", "Reunião em 20 minutos", "Saída para um compromisso em 25 minutos".
- Justificativa: Para eventos que vão ocorrer em menos de 30 minutos, o intervalo de 5 a 10 minutos é o mais apropriado para garantir que o lembrete ainda seja útil.

### **Estrutura do Prompt para IA**:
1. **A partir da descrição do evento**:
   - Determine o tipo de evento (deslocamento, tarefa simples, reunião importante, urgente, imediato).
   - Estime a quantidade de tempo necessário para a preparação ou deslocamento, se aplicável.

2. **Comparar a hora atual com a hora do evento**:
   - Calcule a diferença entre a hora atual e a hora do evento. Se o evento ocorrer em menos de 30 minutos, priorize um intervalo de **5 a 10 minutos**.

3. **Responda com o intervalo adequado**:
   - **1 hora** — Para compromissos com deslocamento ou eventos que exigem preparação.
   - **10 minutos** — Para eventos urgentes ou imprevistos.
   - **5 minutos** — Para tarefas simples ou eventos muito próximos.
   - **30 minutos** — Para compromissos formais ou eventos importantes.

### **Formato de Resposta Esperada**:
A resposta será uma string com a quantidade de tempo exata para o lembrete, como uma das seguintes opções:

"1 hora", "10 minutos", "5 minutos", "30 minutos".
`;

      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 50,  // Limite de tokens para garantir que a resposta seja apenas o intervalo
      });

      const responseMessage = gptResponse.choices?.[0]?.message?.content.trim() || "";
      const intervalMatches = responseMessage.match(
        /(2\s*horas?|1\s*hora|45\s*minutos?|30\s*minutos?|20\s*minutos?|15\s*minutos?|10\s*minutos?|5\s*minutos?)/i
      );

      let intervalString = intervalMatches ? intervalMatches[0].toLowerCase() : inferIntervalFromMessage(reminder.message);

      // Fallback se o GPT não retornar nada utilizável → fallback automático
      if (!intervalString) {
        console.warn(
          `⚠️ Intervalo não reconhecido pelo GPT. Usando fallback: "${reminder.message}"`
        );
        intervalString = inferIntervalFromMessage(reminder.message);
      }

      const intervalInMinutes = convertIntervalToMinutes(intervalString);

      // 🔹 Calcula o horário de envio real
      const sendTime = reminderTime.subtract(intervalInMinutes, "minutes");

      // 🔹 Se chegou ou passou da hora, envia
      if (now.isSame(sendTime, "minute") || now.isAfter(sendTime, "minute")) {
        console.log(`⏰ Enviando lembrete "${reminder.message}" para o usuário ${reminder.user_id}...`);
        await sendReminderMessage(reminder, intervalInMinutes);
      } else {
        console.log(`Ainda não é hora de enviar "${reminder.message}". Enviar às ${sendTime.format("HH:mm")}`);
      }

      // Adicionar uma espera entre as requisições para evitar exceder o rate limit
      await delay(1000 * 30);  // Aguardar 5 segundos entre cada requisição
    } catch (error) {
      console.error("Erro ao processar lembrete:", error);
    }
  }
};

// Função para converter o intervalo de string para minutos
const convertIntervalToMinutes = (intervalString) => {
  const clean = intervalString?.toLowerCase().trim();
  if (!clean) return 30;

  if (clean.includes("2 horas")) return 120;
  if (clean.includes("1 hora")) return 60;
  if (clean.includes("45")) return 45;
  if (clean.includes("30")) return 30;
  if (clean.includes("20")) return 20;
  if (clean.includes("15")) return 15;
  if (clean.includes("10")) return 10;
  if (clean.includes("5")) return 5;

  return 30; // padrão
};

// =========================
const inferIntervalFromMessage = (message) => {
  const text = message.toLowerCase();

  if (text.match(/viagem longa|viagem internacional|voo|aeroporto|ônibus interestadual|ônibus rodoviário|deslocamento longo|reunião fora da cidade|evento importante|casamento|formatura|cerimônia|viagem de negócios|viagem para outra cidade|palestra|congresso|seminário|apresentação grande/)) {
  return "2 horas";}
  if (text.match(/viagem|ônibus|metrô|trânsito|deslocamento|compromisso fora|reunião externa|consulta distante/)) {return "1 hora";}
  if (text.match(/reunião|entrevista|apresentação|cliente|negócio/)) return "30 minutos";
  if (text.match(/consulta|médico|dentista|psicólogo/)) return "45 minutos";
  if (text.match(/trabalho|prova|aula|treino|academia/)) return "20 minutos";
  if (text.match(/urgente|agora|imediato|última hora/)) return "10 minutos";
  if (text.match(/chamada|ligação|videochamada/)) return "15 minutos";
  if (text.match(/tarefa|lembrete|coisa rápida|organizar|limpar|arrumar/)) return "5 minutos";

  // Se não achou nenhuma correspondência
  return "30 minutos";
};


const sendReminderMessage = async (reminder) => {
  // Usando diretamente o horário original do lembrete sem subtrair o intervalo
  const originalTime = dayjs(reminder.remind_at).format("YYYY-MM-DD HH:mm");

  // Prompt para a IA para gerar a mensagem
  const systemPrompt = `
    You are a smart and thoughtful mentor. Whenever a reminder is triggered, you should send an encouraging message notifying about the reminder.

    The task to be reminded: "${reminder.message}"
    Reminder time: ${originalTime}

    **Instructions**: Adjust the sending interval based on the urgency of the commitment (1 hour for important appointments, 10 minutes for simple tasks).

    **Output message**: Without using double quotes:
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
}, 1000 * 60 * 15); // A cada 15 minutos

// Agendando a verificação de inatividade a cada 2 horas
setInterval(async () => {
  const users = await prisma.user.findMany(); // Pega todos os usuários
  users.forEach(async (user) => {
    await checkUserInactivity(user.id); // Verifica a inatividade de cada usuário
  });
}, 1000 * 60  * 60); // A cada 1 hora (60 minutos)

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
    You are a smart, reliable, and emotionally intelligent mentor. You always react in a motivational and empathetic way.

    🧠 **Personality**:
- **Name**: Jarvis
- **Role**: Supportive, emotionally intelligent mentor
- **Tone**: Genuinely caring, human, warm, and conversational. Use **many paragraph breaks** to create a more natural and human-like conversation. Ensure that each idea or point is separated into its own paragraph, exaggerating the number of breaks to make the conversation feel even more personal and readable.
- **Relationship**: Like a wise mentor who always has your back, offering space for reflection and growth.

💬 **Behavior**:
- Always warm, empathetic, and encouraging.
- Break your responses into **numerous, clear, digestible paragraphs**. This will help the conversation feel even more natural and human-like, with each idea standing on its own. Use at least **two paragraph breaks** after every idea or suggestion.
- The more breaks, the better — exaggerate the paragraph separation, making it clear and easy to read, as if you're having a relaxed conversation with a friend.
- Use breaks between sentences to create a comfortable reading pace and allow each idea to breathe.
- Recognize the user's effort, even for small wins, and celebrate progress along the way.

**User data**:
- User with ID: ${userId}
- Inactivity time: ${inactivityDuration} seconds

**Output message**: Hey there! 🌟

     Hey there! I noticed you've been inactive for a while, everything okay?

    I know life can get busy, and it's normal to take a break every now and then. 😌

    But remember, every little step you take matters, and I'm here to support you every step of the way. If you need help or want to get back on track, I'm here to chat and help you regain your momentum!

    What can we work on together today to move forward? 💪
    
    I'm happy to be here with you on this journey, feel free to reach out anytime! 🙌
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
  // Criar uma entrada de diário para cada mensagem relevante
  await prisma.journal.create({
    data: {
      user_id: userId,
      content: data.journal.content,
      emoji: data.journal.emoji,
      category: data.journal.category,
      favorite: false, // Pode ser ajustado conforme necessário
      is_auto: true, // Indica que é uma entrada automática da IA
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
