const { Router } = require("express");
const router = Router();

const validateRequest = require("../../../middlewares/validateRequestJoi.middleware");
const verifyUserByToken = require("../../../middlewares/verifyUserByToken");

const {
  createMessageSchema,
  updateMessageSchema,
} = require("../../../validations/client/messages");

const {
  create,
  getAll,
  getOne,
  update,
  remove,
  deleteChat,
} = require("../../../controllers/client/messages/messages.controller");

router.use(verifyUserByToken);
router.post("/create", validateRequest(createMessageSchema), create);
router.get("/user", getAll);

router.delete("/delete/:id", remove);
router.delete("/delete-all", deleteChat);

module.exports = router;
