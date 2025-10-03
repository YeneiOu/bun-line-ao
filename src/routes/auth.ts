import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { exchangeToken, verifyIdToken, getLineProfile } from "../services/line";
import { ResponseError, ResponseSuccess } from "../utils/response";

export const authRoute = (app: Elysia) =>
  app
    .use(cookie()) // Use the cookie plugin
    .get(
      "/callback",
      async ({ query, cookie, set }) => {
        const { code, state } = query;
        const savedState = cookie.lineLoginState; // นี่คือ Cookie Object

        // 1. CRITICAL: Validate the state parameter
        // 🔽 FIX: เทียบกับ .value ที่อยู่ข้างใน cookie
        if (!state || !savedState || state !== savedState.value) {
          set.status = 403; // Forbidden
          return { message: "Invalid state. CSRF attack detected." };
        }

        if (!code) {
          set.status = 400;
          return { message: "Missing authorization code" };
        }

        try {
          const tokenData = await exchangeToken(code);

          set.cookie = {
            accessToken: {
              value: tokenData.access_token,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: tokenData.expires_in,
            },
            lineLoginState: {
              value: "",
              maxAge: -1,
              path: "/",
            },
          };

          const frontendUrl = process.env.FRONTEND_URL;
          set.status = 302;
          set.headers["Location"] = `${frontendUrl}/callback`;
          return;
        } catch (err: unknown) {
          console.error("LINE Login Failed:", err);
          set.status = 500;
          return { message: "Login failed due to an internal error." };
        }
      },
      {
        query: t.Object({
          code: t.String(),
          state: t.String(),
        }),
      },
    )
    .get("/api/member", async ({ cookie, set }) => {
      const accessTokenCookie = cookie.accessToken; // นี่คือ Cookie Object

      if (!accessTokenCookie || typeof accessTokenCookie.value !== "string") {
        set.status = 401; // Unauthorized
        return ResponseError(401, "Not authenticated or token is invalid");
      }
      try {
        // 🔽 FIX: ใช้ accessTokenCookie.value เพื่อส่งค่า string เข้าไปในฟังก์ชัน
        // และเปลี่ยนไปใช้ getLineProfile เพราะ verifyIdToken ใช้กับ id_token
        // ไม่ใช่ access_token
        const profile = await getLineProfile(accessTokenCookie.value);

        const responseData = ResponseSuccess(200, "Login success", profile);
        return responseData;
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        set.status = 500;
        return ResponseError(500, "Failed to fetch user profile");
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
