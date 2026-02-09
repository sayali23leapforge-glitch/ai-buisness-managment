const admin = require("firebase-admin");

if (!admin.apps.length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(sa)),
  });
  console.log("✅ Firebase Admin SDK initialized from env");
}

const db = admin.firestore();
module.exports = { admin, db };
