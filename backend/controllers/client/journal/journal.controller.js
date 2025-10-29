const responses = require("../../../constants/responses");
const { prisma } = require("../../../configs/prisma");
const dayjs = require("dayjs");
const openai = require("../../../configs/openAi");


async function create(req, res) {
  try {
    const { content, is_auto } = req.body;
    const { userId } = req.user
    const journal = await prisma.journal.create({
      data: {
        user_id: userId,
        content,
        is_auto: is_auto ?? false,
      },
    });

    return res.status(201).json(
      responses.createSuccessResponse(journal, "Journal created successfully.")
    );
  } catch (error) {
    console.error("Create Journal Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to create journal."));
  }
}

async function getAll(req, res) {
  try {
    const { userId } = req.user

    const journals = await prisma.journal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });


    return res.status(200).json(
      responses.okResponse(journals, "Journals fetched successfully.")
    );
  } catch (error) {
    console.error("Fetch Journals Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch journals."));
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!journal) {
      return res
        .status(404)
        .json(responses.badRequestResponse("Journal not found."));
    }

    return res.status(200).json(
      responses.okResponse(journal, "Journal fetched successfully.")
    );
  } catch (error) {
    console.error("Get Journal Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch journal."));
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { content, is_auto } = req.body;

    const journal = await prisma.journal.update({
      where: { id },
      data: {
        content,
        is_auto: is_auto ?? false,
      },
    });

    return res.status(200).json(
      responses.updateSuccessResponse(journal, "Journal updated successfully.")
    );
  } catch (error) {
    console.error("Update Journal Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to update journal."));
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;


    await prisma.journal.delete({
      where: { id },
    });

    return res.status(200).json(
      responses.deleteSuccessResponse(null, "Journal deleted successfully.")
    );
  } catch (error) {
    console.error("Delete Journal Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to delete journal."));
  }
}

/**
 * Alterna o estado de favorito
 */
async function toggleFavorite(req, res) {
  try {
    const { id } = req.params;
    const journal = await prisma.journal.update({
      where: { id },
      data: { favorite: { set: prisma.raw("NOT favorite") } },
    });

    return res.status(200).json(
      responses.updateSuccessResponse(journal, "Favorite toggled successfully.")
    );
  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to toggle favorite."));
  }
}

/**
 * Retorna estatísticas do diário: total e sequência de dias seguidos
 */
async function getStats(req, res) {
  try {
    const { userId } = req.user;
    const journals = await prisma.journal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    const total = journals.length;

    // cálculo de streak (dias consecutivos)
    let streak = 0;
    let lastDate = null;
    journals.forEach((j) => {
      const current = dayjs(j.created_at).startOf("day");
      if (!lastDate || lastDate.diff(current, "day") === 1) {
        streak++;
        lastDate = current;
      }
    });

    return res
      .status(200)
      .json(responses.okResponse({ total, streak }, "Stats fetched successfully."));
  } catch (error) {
    console.error("Get Stats Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch stats."));
  }
}

async function getReflection(req, res) {
  try {
    const { userId } = req.user;
    const recent = await prisma.journal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 7,
    });

    const prompt = `
Você é o Jarvis, um assistente reflexivo.
Aqui estão as últimas anotações do usuário:
${recent.map((j) => `- ${j.content}`).join("\n")}

Crie uma reflexão motivadora curta (1 parágrafo), como:
"Ei, há uma semana você escreveu sobre começar sua rotina de academia. Olha até onde chegou."
`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const message = aiResponse.choices[0].message.content;

    return res
      .status(200)
      .json(responses.okResponse({ reflection: message }, "Reflection generated."));
  } catch (error) {
    console.error("Get Reflection Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to generate reflection."));
  }
}

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  toggleFavorite,
  getStats,
  getReflection,
};