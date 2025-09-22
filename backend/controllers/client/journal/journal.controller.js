const responses = require("../../../constants/responses");
const { prisma } = require("../../../configs/prisma");


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

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
