const { Router } = require("express");
const router = Router();
const validateRequest = require("../../../middlewares/validateRequestJoi.middleware");

const {
  createReminderSchema,
  updateReminderSchema,
} = require("../../../validations/client/reminder");

const {
  create,
  getAll,
  getOne,
  update,
  remove,
} = require("../../../controllers/client/reminder/reminder.controller");

const verifyUserByToken = require("../../../middlewares/verifyUserByToken");

router.get("/get/:id", getOne);
router.patch("/update/:id", validateRequest(updateReminderSchema), update);
router.delete("/delete/:id", remove);

router.use(verifyUserByToken);
router.post("/create", validateRequest(createReminderSchema), create);
router.get("/get-all", getAll);

module.exports = router;
