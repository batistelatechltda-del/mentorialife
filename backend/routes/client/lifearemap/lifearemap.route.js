const { Router } = require("express");
const router = Router();
const verifyUserByToken = require("../../../middlewares/verifyUserByToken");
const { getAll } = require("../../../controllers/client/lifeareamap/lifeareamap.controller");

router.use(verifyUserByToken)
router.get("/get-all", getAll);

module.exports = router;
