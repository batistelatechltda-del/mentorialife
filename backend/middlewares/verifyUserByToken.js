const verifyAndDecodeToken = require("../utils/verifyDecodeToken");

const verifyUserByToken = (req, res, next) => {
  console.log("\n🧩 Middleware verifyUserByToken executado");
  console.log("📨 Authorization Header:", req.headers.authorization);

  const { authorization: token } = req.headers;
  if (!token) {
    console.log("❌ Nenhum token foi enviado");
    return res.status(400).json({ message: "Token not provided." });
  }

  const { tokenValid, decodedData } = verifyAndDecodeToken(token);
  console.log("🔍 Verificação:", { tokenValid, decodedData });

  if (!tokenValid) {
    console.log("❌ Token inválido");
    return res.status(403).json({ message: "Invalid token." });
  }

  console.log("✅ Token válido, user decodificado:", decodedData);
  req.user = decodedData;
  next();
};

module.exports = verifyUserByToken;