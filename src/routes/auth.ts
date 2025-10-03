import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { exchangeToken, verifyIdToken, getLineProfile } from "../services/line";
import { ResponseError, ResponseSuccess } from "../utils/response";
import { SignJWT, jwtVerify } from "jose";

const privateKey = await crypto.subtle.importKey(
  "pkcs8",
  Buffer.from(process.env.JWT_PRIVATE_KEY!, "base64"), // Railway env should be base64
  { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
  true,
  ["sign"],
);

const publicKey = await crypto.subtle.importKey(
  "spki",
  Buffer.from(process.env.JWT_PUBLIC_KEY!, "base64"),
  { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
  true,
  ["verify"],
);
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-key",
);

export const authRoute = (app: Elysia) =>
  app
    .use(cookie()) // Use the cookie plugin
    .get(
      "/api/callback",
      async ({ query, set }) => {
        const { code, state } = query;

        if (!code || !state) {
          set.status = 400;
          return ResponseError(400, "Missing authorization code or state");
        }
        try {
          // 1. Exchange code for access token
          const tokenData = await exchangeToken(code);

          // 2. Get user profile with LINE access token
          const profile = await getLineProfile(tokenData.access_token);

          // 3. Issue our own JWT
          const jwt = await new SignJWT({
            sub: profile.userId,
            name: profile.displayName,
            picture: profile.pictureUrl,
          })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(privateKey);

          // 4. Return JWT + profile to frontend
          return ResponseSuccess(200, "Login success", {
            token: jwt,
            profile,
          });
          // const frontendUrl = process.env.FRONTEND_URL;
          // set.status = 302;
          // set.headers["Location"] = `${frontendUrl}/callback`;
          // return;
        } catch (err: unknown) {
          console.error("LINE Login Failed:", err);
          set.status = 500;
          return ResponseError(500, "Login failed due to an internal error.");
        }
      },
      {
        query: t.Object({
          code: t.String(),
          state: t.String(),
        }),
      },
    )
    .get("/api/member", async ({ request, set }) => {
      const authHeader = request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return ResponseError(401, "Unauthorized");
      }

      const token = authHeader.split(" ")[1];

      try {
        const { payload } = await jwtVerify(token, publicKey);
        return ResponseSuccess(200, "User profile", payload);
      } catch (e) {
        set.status = 401;
        return ResponseError(401, "Invalid or expired token");
      }
    });

// export const authRoute = (app: Elysia) =>
//   app.get(
//     "/callback",
//     async ({ query }) => {
//       const { code } = query;
//       if (!code) {
//         return error(400, "Missing code");
//       }
//       try {
//         const tokenData = await exchangeToken(code as string);
//         const profile = await verifyIdToken(tokenData.id_token);

//         const responseData = success(200, "Login success", {
//           token: tokenData,
//           profile,
//         });

//         return responseData;
//       } catch (err: unknown) {
//         return error(500, err instanceof Error ? err.message : "Unknown error");
//       }
//     },
//     {
//       query: t.Object({
//         code: t.String(),
//         state: t.Optional(t.String()),
//       }),
//     },
//   );
