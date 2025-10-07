import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { exchangeToken, getLineProfile } from "../services/line";
import { ResponseError, ResponseSuccess } from "../utils/response";
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";

if (!process.env.JWT_PRIVATE_KEY) {
  throw new Error("JWT_PRIVATE_KEY is not defined!");
}
if (!process.env.JWT_PUBLIC_KEY) {
  throw new Error("JWT_PUBLIC_KEY is not defined!");
}

/**
 * Helper to decode base64 PEM keys and wrap them correctly
 */
function decodeBase64Pem(base64: string, type: "private" | "public") {
  const header =
    type === "private"
      ? "-----BEGIN PRIVATE KEY-----"
      : "-----BEGIN PUBLIC KEY-----";
  const footer =
    type === "private"
      ? "-----END PRIVATE KEY-----"
      : "-----END PUBLIC KEY-----";
  const keyData = Buffer.from(base64, "base64").toString("utf-8");

  return `${header}\n${keyData}\n${footer}`;
}

let privateKey: CryptoKey;
let publicKey: CryptoKey;

(async () => {
  try {
    const privatePem = decodeBase64Pem(process.env.JWT_PRIVATE_KEY!, "private");
    const publicPem = decodeBase64Pem(process.env.JWT_PUBLIC_KEY!, "public");

    console.log("🔑 Initializing JWT keys...");
    console.log("Private key length:", privatePem.length);
    console.log("Public key length:", publicPem.length);

    privateKey = await importPKCS8(privatePem, "RS256");
    publicKey = await importSPKI(publicPem, "RS256");

    console.log("✅ JWT keys initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize JWT keys:", error);
  }
})();

export const authRoute = new Elysia({ prefix: "/api" }).group("/auth", (app) =>
  app
    .use(cors())
    .post(
      "/line_login",
      async ({ body, set }) => {
        const { code, state } = body;

        if (!code || !state) {
          set.status = 400;
          return ResponseError(
            400,
            { code: 1, message: "Missing authorization code or state" },
            null,
          );
        }

        try {
          // 1. Exchange code for access token
          const tokenData = await exchangeToken(code);
          console.log("exchangeToken res", tokenData);

          // 2. Get LINE profile
          const profile = await getLineProfile(tokenData.access_token);
          console.log("getLineProfile res", profile);

          // 3. Sign JWT with RS256
          const jwt = await new SignJWT({
            sub: profile.userId,
            name: profile.displayName,
            picture: profile.pictureUrl,
            statusMessage: profile.statusMessage,
            role: "customer", // Default role for LINE users
          })
            .setProtectedHeader({ alg: "RS256" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(privateKey);

          // 4. Return JWT + profile to frontend
          const frontendUrl = process.env.FRONTEND_URL;
          // console.log("Frontend URL:", frontendUrl);

          // // Option 1: Redirect with token in URL (current approach)
          // const redirectUrl =
          //   `${frontendUrl}/callback` +
          //   `?token=${encodeURIComponent(jwt)}` +
          //   `&profile=${encodeURIComponent(JSON.stringify(profile))}`;

          // set.status = 302;
          // set.headers["Location"] = redirectUrl;

          // Option 2: Return JSON response (for API-based auth)
          // Uncomment this if you want to handle auth via API calls instead of redirects
          return ResponseSuccess(
            200,
            { code: 0, message: "Login successful" },
            {
              token: jwt,
              expiresIn: "1h",
            },
          );
        } catch (err) {
          console.error("LINE Login Failed:", err);
          set.status = 500;
          return ResponseError(
            500,
            { code: 1, message: "Login failed due to an internal error." },
            null,
          );
        }
      },
      {
        body: t.Object({
          code: t.String(),
          state: t.String(),
        }),
      },
    )

    // Check if user is logged in and get profile
    .get("/is_login", async ({ request, set }) => {
      const authHeader = request.headers.get("authorization");

      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return ResponseError(
          401,
          {
            code: 1,
            message: "Unauthorized, Missing or invalid authorization header",
          },
          null,
        );
      }

      const token = authHeader.split(" ")[1];

      try {
        // Check if publicKey is initialized
        if (!publicKey) {
          set.status = 500;
          return ResponseError(
            500,
            {
              code: 1,
              message: "Server Error, Authentication service not available",
            },
            null,
          );
        }

        const { payload } = await jwtVerify(token, publicKey);
        console.log("✅ Token verified successfully:", {
          sub: payload.sub,
          name: payload.name,
          exp: payload.exp,
          iat: payload.iat,
        });

        return ResponseSuccess(
          200,
          {
            code: 0,
            message: "Login successful",
          },
          {
            user: {
              id: payload.sub,
              name: payload.name,
              picture: payload.picture,
              statusMessage: payload.statusMessage || "",
              role: payload.role || "customer",
            },
            isAuthenticated: true,
            tokenValid: true,
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("❌ Token verification failed:", errorMessage);
        console.error("Error details:", error);

        // Provide more specific error messages
        let specificMessage = "Invalid or expired token";
        if (errorMessage.includes("expired")) {
          specificMessage = "Token has expired";
        } else if (errorMessage.includes("signature")) {
          specificMessage = "Invalid token signature";
        } else if (errorMessage.includes("malformed")) {
          specificMessage = "Malformed token";
        }

        set.status = 401;
        return ResponseError(
          401,
          {
            code: 1,
            message: "Unauthorized, " + specificMessage,
          },
          null,
        );
      }
    })

    // Test token generation endpoint (development only)
    .post(
      "/test-token",
      async ({ body, set }) => {
        try {
          if (process.env.NODE_ENV === "production") {
            set.status = 403;
            return ResponseError(
              403,
              {
                code: 1,
                message: "Forbidden",
              },
              "Test tokens not available in production",
            );
          }

          const { uid, email, role = "customer" } = body;

          // Validate role
          const validRoles = ["customer", "coach", "admin"];
          if (!validRoles.includes(role)) {
            set.status = 400;
            return ResponseError(
              400,
              {
                code: 1,
                message: "Bad Request",
              },
              `Invalid role. Must be one of: ${validRoles.join(", ")}`,
            );
          }

          // Generate test token using the same method as LINE auth
          const testUid = uid || `test-user-${Date.now()}`;
          const testEmail = email || `test-${Date.now()}@example.com`;

          const jwt = await new SignJWT({
            sub: testUid,
            email: testEmail,
            name: `Test User (${role})`,
            role: role,
            test_token: true,
          })
            .setProtectedHeader({ alg: "RS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(privateKey);

          return ResponseSuccess(
            200,
            {
              code: 0,
              message: "Test token generated successfully",
            },
            {
              token: jwt,
              user: {
                uid: testUid,
                email: testEmail,
                role: role,
                name: `Test User (${role})`,
              },
              expiresIn: "24h",
              usage: {
                curl: `curl -H "Authorization: Bearer ${jwt}" http://localhost:3000/api/is_login`,
                javascript: `fetch('/api/is_login', { headers: { 'Authorization': 'Bearer ${jwt}' } })`,
                note: "Copy the token value and use it in your API requests",
              },
            },
          );
        } catch (error) {
          console.error("Test token generation failed:", error);
          set.status = 500;
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return ResponseError(
            500,
            {
              code: 1,
              message: "Internal Server Error",
            },
            message,
          );
        }
      },
      {
        body: t.Object({
          uid: t.Optional(t.String()),
          email: t.Optional(t.String()),
          role: t.Optional(
            t.Union([
              t.Literal("customer"),
              t.Literal("coach"),
              t.Literal("admin"),
            ]),
          ),
        }),
      },
    )

    // Legacy endpoint for backward compatibility
    .get("/member", async ({ request, set }) => {
      const authHeader = request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return ResponseError(
          401,
          {
            code: 1,
            message: "Unauthorized",
          },
          null,
        );
      }

      const token = authHeader.split(" ")[1];

      try {
        const { payload } = await jwtVerify(token, publicKey);
        return ResponseSuccess(
          200,
          {
            code: 0,
            message: "User profile",
          },
          payload,
        );
      } catch (e) {
        set.status = 401;
        return ResponseError(
          401,
          {
            code: 1,
            message: "Invalid or expired token",
          },
          null,
        );
      }
    })

    // Test token endpoint for development
    .post(
      "/test-token",
      async ({ body }) => {
        try {
          if (!privateKey) {
            throw new Error("Private key not initialized");
          }

          const {
            role = "admin",
            name = "Test User",
            uid = "test-user-123",
          } = body || {};

          const jwt = await new SignJWT({
            sub: uid,
            name: name,
            picture: "https://via.placeholder.com/150",
            statusMessage: "Test user",
            role: role,
            test_token: true,
          })
            .setProtectedHeader({ alg: "RS256" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(privateKey);

          return ResponseSuccess(
            200,
            { code: 0, message: "Test token generated successfully" },
            {
              token: jwt,
              expiresIn: "1h",
              user: {
                uid,
                name,
                role,
              },
            },
          );
        } catch (error) {
          console.error("Test token generation failed:", error);
          return ResponseError(
            500,
            { code: 1, message: "Internal Server Error" },
            "Failed to generate test token",
          );
        }
      },
      {
        body: t.Optional(
          t.Object({
            role: t.Optional(
              t.Union([
                t.Literal("customer"),
                t.Literal("coach"),
                t.Literal("admin"),
              ]),
            ),
            name: t.Optional(t.String()),
            uid: t.Optional(t.String()),
          }),
        ),
      },
    ),
);
