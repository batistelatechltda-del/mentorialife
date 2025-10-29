router.post("/register", async (req, res) => {
  const { userId, token } = req.body;
  try {
    await prisma.push_token.upsert({
      where: { token },
      update: { user_id: userId },
      create: { user_id: userId, token },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar token" });
  }
});