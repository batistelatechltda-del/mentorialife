const { Router } = require("express");
const router = Router();
const validateRequest = require("../../../middlewares/validateRequestJoi.middleware");
const verifyUserByToken = require("../../../middlewares/verifyUserByToken");

const {
  createGoalSchema,
  updateGoalSchema,
} = require("../../../validations/client/goal");

const {
  create,
  getAll,
  getOne,
  update,
  remove,
} = require("../../../controllers/client/goal/goal.controller");

router.get("/get/:id", getOne);
router.patch("/update/:id", validateRequest(updateGoalSchema), update);
router.delete("/delete/:id", remove);

router.use(verifyUserByToken);
router.post("/create", validateRequest(createGoalSchema), create);
router.get("/get-all", getAll);

module.exports = router;
