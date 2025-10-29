const { Router } = require("express");
const router = Router();
const { registerToken, removeToken } = require("../../../controllers/client/push/push.controller");
const verifyUserByToken = require("../../../middlewares/verifyUserByToken");

// Require auth middleware
router.post("/register", verifyUserByToken, registerToken);
router.post("/remove", verifyUserByToken, removeToken);




module.exports = router;
