const responses = require("../../../constants/responses");
const { prisma } = require("../../../configs/prisma");

// Create
async function create(req, res) {
  try {
    const { userId } = req.user;
    const { title, description, start_time, end_time } = req.body;

    const event = await prisma.calendar_event.create({
      data: {
        user_id: userId,
        title,
        description,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : null,
      },
    });

    return res
      .status(201)
      .json(responses.createSuccessResponse(event, "Event created successfully."));
  } catch (error) {
    console.error("Create Calendar Event Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to create event."));
  }
}

// Get All
async function getAll(req, res) {
  try {
    const { userId } = req.user;

    const events = await prisma.calendar_event.findMany({
      where: { user_id: userId },
      orderBy: { start_time: "asc" },
    });

    return res
      .status(200)
      .json(responses.okResponse(events, "Events fetched successfully."));
  } catch (error) {
    console.error("Fetch Events Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch events."));
  }
}

// Get One
async function getOne(req, res) {
  try {
    const { id } = req.params;

    const event = await prisma.calendar_event.findUnique({
      where: { id },
    });

    if (!event) {
      return res
        .status(404)
        .json(responses.badRequestResponse("Event not found."));
    }

    return res
      .status(200)
      .json(responses.okResponse(event, "Event fetched successfully."));
  } catch (error) {
    console.error("Get Event Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to fetch event."));
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;

    const event = await prisma.calendar_event.update({
      where: { id },
      data: req.body
    });

    return res
      .status(200)
      .json(responses.updateSuccessResponse(event, "Event updated successfully."));
  } catch (error) {
    next(error)
  }
}

// Delete
async function remove(req, res) {
  try {
    const { id } = req.params;

    await prisma.calendar_event.delete({
      where: { id },
    });

    return res
      .status(200)
      .json(responses.deleteSuccessResponse(null, "Event deleted successfully."));
  } catch (error) {
    console.error("Delete Event Error:", error);
    return res
      .status(500)
      .json(responses.serverErrorResponse("Failed to delete event."));
  }
}

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
