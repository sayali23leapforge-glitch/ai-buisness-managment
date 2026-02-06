const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to use service account from environment variable first (for Render/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK initialized with service account from environment");
    }
    // Try to use service account file (for local development)
    else if (require("fs").existsSync("./firebase-service-account.json")) {
      const serviceAccount = require("./firebase-service-account.json");
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK initialized with service account file");
    }
    // Fall back to default credentials
    else {
      console.warn("⚠️ Firebase service account not found, using default credentials");
      admin.initializeApp();
    }
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error.message);
    console.warn("⚠️ Falling back to default credentials");
    admin.initializeApp();
  }
}

const db = admin.firestore();

module.exports = { admin, db };
