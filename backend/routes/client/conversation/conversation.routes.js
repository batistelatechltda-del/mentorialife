const { Router } = require("express");
const router = Router();

const validateRequest = require("../../../middlewares/validateRequestJoi.middleware");
const verifyUserByToken = require("../../../middlewares/verifyUserByToken");

const {
  createConversationSchema,
  updateConversationSchema,
} = require("../../../validations/client/conversation");

const {
  create,
  getAll,
  getOne,
  update,
  remove,
  getTodosUserId,
} = require("../../../controllers/client/conversation/conversation.controller");

router.get("/show/:id", getOne);
router.patch("/update/:id", validateRequest(updateConversationSchema), update);
router.delete("/delete/:id", remove);


router.use(verifyUserByToken);
router.post("/create", validateRequest(createConversationSchema), create);
router.get("/get/all", getAll);
router.get("/todo/get-all", getTodosUserId);

module.exports = router;
