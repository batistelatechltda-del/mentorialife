const responses = require("../../../constants/responses");
const { prisma } = require("../../../configs/prisma");
const dayjs = require("dayjs");
async function create(req, res) {
  try {
    const { title } = req.body;
    const { userId } = req.user;

    const conversation = await prisma.conversation.create({
      data: {
        user_id: userId,
        title: title || "New Chat",
      },
    });

    return res.status(201).json(
      responses.createSuccessResponse(conversation, "Conversation created successfully.")
    );
  } catch (error) {
    console.error("Create Conversation Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to create conversation."));
  }
}

async function getAll(req, res) {
  try {
    const { userId } = req.user;

    const conversations = await prisma.conversation.findMany({
      where: {
        user_id: userId
      }
    });

    return res.status(200).json(
      responses.okResponse(conversations, "Conversations fetched successfully.")
    );
  } catch (error) {
    console.error("Fetch Conversations Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch conversations."));
  }
}

async function getOne(req, res) {
  try {
    const { id } = req.params;

    const conversation = await prisma.chat_message.findMany({
      where: { conversation_id: id },
    });

    if (!conversation) {
      return res
        .status(404)
        .json(responses.badRequestResponse("Conversation not found."));
    }

    return res.status(200).json(
      responses.okResponse(conversation, "Conversation fetched successfully.")
    );
  } catch (error) {
    console.error("Get Conversation Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch conversation."));
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { title },
    });

    return res.status(200).json(
      responses.updateSuccessResponse(conversation, "Conversation updated successfully.")
    );
  } catch (error) {
    console.error("Update Conversation Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to update conversation."));
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    await prisma.conversation.delete({
      where: { id },
    });

    return res.status(200).json(
      responses.deleteSuccessResponse(null, "Conversation deleted successfully.")
    );
  } catch (error) {
    console.error("Delete Conversation Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to delete conversation."));
  }
}


const getTodosUserId = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const now = dayjs().toDate();

    const goals = await prisma.goal.findMany({
      where: {
        user_id: userId,
        is_completed: false,
        due_date: {
          gte: now,
        },
      },
      orderBy: { due_date: 'asc' },
    });

    const journals = await prisma.journal.findMany({
      where: {
        user_id: userId,
        is_completed: false,

      },
      orderBy: { created_at: 'desc' },
    });

    const reminders = await prisma.reminder.findMany({
      where: {
        user_id: userId,
        is_completed: false,
        remind_at: {
          gte: now,
        },
      },
      orderBy: { remind_at: 'asc' },
    });

    const calendarEvents = await prisma.calendar_event.findMany({
      where: {
        user_id: userId,
        is_completed: false,
        start_time: {
          gte: now,
        },
      },
      orderBy: { start_time: 'asc' },
    });

    const formattedData = {
      goals,
      journals,
      reminders,
      calendarEvents, 
    };

    const response = responses.okResponse(formattedData);
    return res.status(response.status.code).json(response);
  } catch (error) {
    next(error);
  }
};







module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  getTodosUserId,
};
