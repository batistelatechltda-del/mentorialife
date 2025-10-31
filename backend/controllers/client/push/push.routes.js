// backend/routes/client/push/push.routes.js
const { Router } = require("express");
const router = Router();
const { registerPushToken, removeToken } = require("../../../controllers/client/push/push.controller");
const verifyUserByToken = require("../../../middlewares/verifyUserByToken");

// Registrar o token (POST /api/push/register)
router.post("/register", verifyUserByToken, registerPushToken);
// Remover token (POST /api/push/remove)
router.post("/remove", verifyUserByToken, removeToken);

module.exports = router;