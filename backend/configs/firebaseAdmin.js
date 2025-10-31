const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let initialized = false;

// 1️⃣ Tenta via variável de ambiente (Render)
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log("✅ Firebase Admin initialized via environment variable");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", err);
  }
}

// 2️⃣ Caso contrário, tenta arquivo local (para dev)
if (!initialized) {
  const serviceAccountPath = path.join(__dirname, "firebaseServiceAccount.json");

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log("✅ Firebase Admin initialized via local file");
  } else {
    console.error("⚠️ FIREBASE SERVICE ACCOUNT not configured. Push notifications will not work.");
  }
}

module.exports = admin;
