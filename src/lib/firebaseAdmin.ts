import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminDb: any = null;

if (typeof window === "undefined" && serviceAccountKey) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    adminDb = getFirestore();
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error instanceof Error ? error.message : String(error));
  }
}

export { adminDb };
