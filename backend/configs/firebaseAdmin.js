const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "firebaseServiceAccount.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("FIREBASE SERVICE ACCOUNT not configured. Push notifications will not work.");
} else {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized successfully");
}

module.exports = admin;
