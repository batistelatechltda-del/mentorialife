const express = require("express");
const router = express.Router();
const { prisma } = require("../configs/prisma");

router.post("/register", async (req, res) => {
  const { userId, token } = req.body;

  // Validação adicional
  if (!userId || !token) {
    return res.status(400).json({ error: "userId e token são obrigatórios" });
  }

  // Verifique se o usuário existe
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(400).json({ error: "Usuário não encontrado" });
  }

  try {
    await prisma.push_token.upsert({
      where: { token },
      update: { user_id: userId },
      create: { user_id: userId, token },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao registrar token:", err);  // Registro detalhado do erro
    res.status(500).json({ error: "Erro ao registrar token" });
  }
});

module.exports = router;  // Exportando o router
