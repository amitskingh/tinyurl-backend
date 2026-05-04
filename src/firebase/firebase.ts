import admin, { ServiceAccount } from "firebase-admin";
import { config } from "../config";

let firebaseEnabled = false;

function parseServiceAccount(): ServiceAccount | null {
  const raw = config.FIREBASE_SERVICE_ACCOUNT;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as ServiceAccount;
  } catch {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT (expected base64 JSON)");
    return null;
  }
}

const credential = parseServiceAccount();

if (credential) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(credential),
    });
    firebaseEnabled = true;
    console.log("Firebase admin initialized");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
  }
} else {
  console.warn(
    "FIREBASE_SERVICE_ACCOUNT not set; optional auth (appendUserId) and /analytics are disabled for token verification."
  );
}

export { admin };
export { firebaseEnabled };
