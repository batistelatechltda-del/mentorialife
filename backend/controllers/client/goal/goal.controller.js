const responses = require("../../../constants/responses");
const { prisma } = require("../../../configs/prisma");

async function create(req, res) {
  try {
    const { category, title, description, due_date } = req.body;
    const { userId } = req.user;

    // Verificar se a categoria é válida
    const validCategories = [
      "Health", "Bem-estar", "Saúde Mental", "Saúde", "Desenvolvimento"
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json(responses.badRequestResponse("Invalid category."));
    }

    const goal = await prisma.goal.create({
      data: {
        user_id: userId,
        title,
        description,
        due_date,
        category, // Adiciona a categoria ao banco de dados
      },
    });

    return res.status(201).json(
      responses.createSuccessResponse(goal, "Goal created successfully.")
    );
  } catch (error) {
    console.error("Create Goal Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to create goal."));
  }
}

async function getAll(req, res) {
  try {
    const { userId } = req.user;

    const goals = await prisma.goal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json(
      responses.okResponse(goals, "Goals fetched successfully.")
    );
  } catch (error) {
    console.error("Fetch Goals Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch goals."));
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return res
        .status(404)
        .json(responses.badRequestResponse("Goal not found."));
    }

    return res.status(200).json(
      responses.okResponse(goal, "Goal fetched successfully.")
    );
  } catch (error) {
    console.error("Get Goal Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch goal."));
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.update({
      where: { id },
      data: req.body
    });

    return res.status(200).json(
      responses.updateSuccessResponse(goal, "Goal updated successfully.")
    );
  } catch (error) {
    console.error("Update Goal Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to update goal."));
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    await prisma.goal.delete({
      where: { id },
    });

    return res.status(200).json(
      responses.deleteSuccessResponse(null, "Goal deleted successfully.")
    );
  } catch (error) {
    console.error("Delete Goal Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to delete goal."));
  }
}

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
