import { Elysia } from "elysia";
import { adminAuth } from "../config/firebase";
import { ResponseError } from "../utils/response";
import { jwtVerify, importSPKI } from "jose";
import { env } from "../utils/env";

// Helper to decode base64 PEM keys
function decodeBase64Pem(base64: string, type: "private" | "public") {
  const header = type === "private" 
    ? "-----BEGIN PRIVATE KEY-----" 
    : "-----BEGIN PUBLIC KEY-----";
  const footer = type === "private" 
    ? "-----END PRIVATE KEY-----" 
    : "-----END PUBLIC KEY-----";
  const keyData = Buffer.from(base64, "base64").toString("utf-8");
  return `${header}\n${keyData}\n${footer}`;
}

// Initialize public key for JWT verification
let publicKey: CryptoKey;
(async () => {
  try {
    const publicPem = decodeBase64Pem(env.jwtPublicKey, "public");
    publicKey = await importSPKI(publicPem, "RS256");
  } catch (error) {
    console.error("Failed to initialize JWT public key:", error);
  }
})();

export const authMiddleware = new Elysia({ name: "auth" })
  .derive(async ({ headers }) => {
    console.log("🔐 Auth middleware - processing request");
    console.log("Headers:", Object.keys(headers));
    const authorization = headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("No authorization header found");
      return { user: null };
    }

    const token = authorization.substring(7);
    console.log("Token found, verifying...");

    try {
      // First try to verify with our JWT system
      if (publicKey) {
        try {
          const { payload } = await jwtVerify(token, publicKey);
          console.log("JWT verification successful:", payload.sub);
          return {
            user: {
              uid: payload.sub as string,
              email: payload.email as string || `${payload.sub}@line.local`,
              role: payload.role as string || "customer",
              name: payload.name as string,
              picture: payload.picture as string,
              isTestToken: payload.test_token as boolean || false
            },
          };
        } catch (jwtError) {
          console.log("JWT verification failed, trying Firebase...");
        }
      }

      // Fallback to Firebase Admin Auth
      if (adminAuth) {
        const decodedToken = await adminAuth.verifyIdToken(token);
        console.log("Firebase verification successful:", decodedToken.uid);
        return {
          user: {
            uid: decodedToken.uid,
            email: decodedToken.email || `${decodedToken.uid}@firebase.local`,
            role: decodedToken.role || "customer",
            name: decodedToken.name || "Firebase User",
            picture: decodedToken.picture || null,
            isTestToken: false
          },
        };
      }

      console.log("No authentication service available");
      return { user: null };
    } catch (error) {
      console.error("Token verification failed:", error);
      return { user: null };
    }
  });

export const adminAuthMiddleware = new Elysia({ name: "adminAuth" })
  .use(authMiddleware)
  .derive(({ user }) => {
    if (user.role !== "admin") {
      throw ResponseError(403, "Forbidden", "Admin access required");
    }
    return { user };
  });

export const coachAuthMiddleware = new Elysia({ name: "coachAuth" })
  .use(authMiddleware)
  .derive(({ user }) => {
    if (user.role !== "coach" && user.role !== "admin") {
      throw ResponseError(403, "Forbidden", "Coach or admin access required");
    }
    return { user };
  });
