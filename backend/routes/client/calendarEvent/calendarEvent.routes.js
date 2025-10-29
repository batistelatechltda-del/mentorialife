const { Router } = require("express");
const router = Router();

const validateRequest = require("../../../middlewares/validateRequestJoi.middleware");
const verifyUserByToken = require("../../../middlewares/verifyUserByToken");

const {
  createCalendarEventSchema,
  updateCalendarEventSchema,
} = require("../../../validations/client/calendarEvent");

const {
  create,
  getAll,
  getOne,
  update,
  remove,
} = require("../../../controllers/client/calendarEvent/calendarEvent.controller");

router.get("/get/:id", getOne);
router.patch("/update/:id", validateRequest(updateCalendarEventSchema), update);
router.delete("/delete/:id", remove);

router.use(verifyUserByToken);
router.post("/create", validateRequest(createCalendarEventSchema), create);
router.get("/get-all", getAll);

module.exports = router;
