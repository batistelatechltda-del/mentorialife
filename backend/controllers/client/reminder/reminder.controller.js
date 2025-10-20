const responses = require("../../../constants/responses");
const { prisma } = require("../../../configs/prisma");

async function create(req, res) {
  try {
    const { message, remind_at } = req.body;
    const { userId } = req.user;

    const reminder = await prisma.reminder.create({
  data: {
    user_id: userId,
    message,
    remind_at: dayjs(remind_at).toDate(),
    is_sent: false,
  },
});

    return res.status(201).json(
      responses.createSuccessResponse(reminder, "Reminder created successfully.")
    );
  } catch (error) {
    console.error("Create Reminder Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to create reminder."));
  }
}

async function getAll(req, res) {
  try {
    const { userId } = req.user;

    const reminders = await prisma.reminder.findMany({
      where: { user_id: userId },
      orderBy: { remind_at: "asc" },
    });

    return res.status(200).json(
      responses.okResponse(reminders, "Reminders fetched successfully.")
    );
  } catch (error) {
    console.error("Fetch Reminders Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch reminders."));
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      return res
        .status(404)
        .json(responses.badRequestResponse("Reminder not found."));
    }

    return res.status(200).json(
      responses.okResponse(reminder, "Reminder fetched successfully.")
    );
  } catch (error) {
    console.error("Get Reminder Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch reminder."));
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const reminder = await prisma.reminder.update({
      where: { id },
      data: req.body
    });

    return res.status(200).json(
      responses.updateSuccessResponse(reminder, "Reminder updated successfully.")
    );
  } catch (error) {
    console.error("Update Reminder Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to update reminder."));
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    await prisma.reminder.delete({
      where: { id },
    });

    return res.status(200).json(
      responses.deleteSuccessResponse(null, "Reminder deleted successfully.")
    );
  } catch (error) {
    console.error("Delete Reminder Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to delete reminder."));
  }
}

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
