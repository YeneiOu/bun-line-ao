import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeApp as initializeAdminApp,
  cert,
  getApps,
} from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { env, validateFirebaseEnv } from "../utils/env";

// Validate Firebase environment variables
const isFirebaseConfigured = validateFirebaseEnv();

// Client-side Firebase config
const firebaseConfig = {
  apiKey: env.firebase.apiKey || "AIzaSyAdR_Nx-xkvjRa-cRpnP35vzf0ZR0J1k8I",
  authDomain: env.firebase.authDomain || "ski-academy-2c7df.firebaseapp.com",
  projectId: env.firebase.projectId || "ski-academy-2c7df",
  storageBucket:
    env.firebase.storageBucket || "ski-academy-2c7df.firebasestorage.app",
  messagingSenderId: env.firebase.messagingSenderId || "894408491617",
  appId: env.firebase.appId || "1:894408491617:web:53c278605d61c2a55c6020",
  measurementId: env.firebase.measurementId || "G-SKQK20VMRL",
};

// Initialize client Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const appId = firebaseConfig.projectId;

// Initialize Firebase Admin (for server-side operations)
let adminApp;
let adminDb: any = null;
let adminAuth: any = null;

try {
  if (getApps().length === 0) {
    const serviceAccountKey = env.firebase.serviceAccountKey;

    if (serviceAccountKey && isFirebaseConfigured) {
      let serviceAccount;
      
      try {
        // Try to parse as JSON string first
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (parseError) {
        console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
        console.warn("Expected format: JSON string of service account key");
        console.warn("Example: '{\"type\":\"service_account\",\"project_id\":\"...\", ...}'");
        throw parseError;
      }

      // Validate required fields
      if (!serviceAccount.type || !serviceAccount.project_id || !serviceAccount.private_key) {
        throw new Error("Invalid service account: missing required fields (type, project_id, private_key)");
      }

      adminApp = initializeAdminApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
        databaseURL: `https://${firebaseConfig.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`
      });

      adminDb = getAdminFirestore(adminApp);
      adminAuth = getAdminAuth(adminApp);
      console.log("✅ Firebase Admin SDK initialized successfully");
      console.log(`📧 Service Account: ${serviceAccount.client_email}`);
    } else {
      console.warn(
        "⚠️  Firebase Admin SDK not initialized: FIREBASE_SERVICE_ACCOUNT_KEY not provided"
      );
      console.warn("Admin features will not be available");
      console.warn("To enable admin features:");
      console.warn("1. Go to Firebase Console > Project Settings > Service Accounts");
      console.warn("2. Generate new private key");
      console.warn("3. Add the JSON content to FIREBASE_SERVICE_ACCOUNT_KEY in .env");
    }
  } else {
    adminApp = getApps()[0];
    adminDb = getAdminFirestore(adminApp);
    adminAuth = getAdminAuth(adminApp);
  }
} catch (error) {
  console.warn("❌ Firebase Admin SDK initialization failed:", error);
  console.warn("Admin features will not be available");
  
  if (error instanceof Error) {
    console.warn("Error details:", error.message);
  }
}

export { adminDb, adminAuth };

export default app;
