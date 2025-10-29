// backend/routes/client/push/push.routes.js
const express = require("express");
const router = express.Router();
const { registerPushToken, sendPushNotification } = require("../../../controllers/client/push/push.controller");

// Rota para registrar o token do navegador
router.post("/register", registerPushToken);

// (Opcional) rota para testar notificação manual
router.post("/send", sendPushNotification);

module.exports = router;