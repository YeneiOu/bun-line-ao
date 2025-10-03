import { Elysia, t } from "elysia";
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
  const privatePem = decodeBase64Pem(process.env.JWT_PRIVATE_KEY!, "private");
  const publicPem = decodeBase64Pem(process.env.JWT_PUBLIC_KEY!, "public");

  privateKey = await importPKCS8(privatePem, "RS256");
  publicKey = await importSPKI(publicPem, "RS256");
})();

export const authRoute = (app: Elysia) =>
  app
    .get(
      "/callback",
      async ({ query, set }) => {
        const { code, state } = query;

        if (!code || !state) {
          set.status = 400;
          return ResponseError(400, "Missing authorization code or state");
        }

        try {
          // 1. Exchange code for access token
          const tokenData = await exchangeToken(code);

          // 2. Get LINE profile
          const profile = await getLineProfile(tokenData.access_token);

          // 3. Sign JWT with RS256
          const jwt = await new SignJWT({
            sub: profile.userId,
            name: profile.displayName,
            picture: profile.pictureUrl,
          })
            .setProtectedHeader({ alg: "RS256" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(privateKey);

          // 4. Return JWT + profile to frontend
          // return ResponseSuccess(200, "Login success", {
          //   token: jwt,
          //   profile,
          // });
          const frontendUrl = process.env.FRONTEND_URL;
          const redirectUrl =
            `${frontendUrl}/` +
            `?token=${encodeURIComponent(JSON.stringify(jwt))}` +
            `&profile=${encodeURIComponent(JSON.stringify(profile))}`;

          set.status = 302;
          set.headers["Location"] = redirectUrl;
        } catch (err) {
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
