const { Router } = require("express");
const router = Router();
const validateRequest = require("../../../middlewares/validateRequestJoi.middleware");

const {
  createJournalSchema,
  updateJournalSchema,
} = require("../../../validations/client/journal");

const {
  create,
  getAll,
  getOne,
  update,
  remove,
} = require("../../../controllers/client/journal/journal.controller");
const verifyUserByToken = require("../../../middlewares/verifyUserByToken");

router.get("/get/:id", getOne);
router.put("/update/:id", validateRequest(updateJournalSchema), update);
router.delete("/delete/:id", remove);



router.use(verifyUserByToken)
router.post("/create", validateRequest(createJournalSchema), create);
router.get("/get-all", getAll);

module.exports = router;
