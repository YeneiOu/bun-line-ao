import { Elysia, t } from "elysia";
import { exchangeToken, verifyIdToken } from "../services/line";
import { success, error } from "../utils/response";

export const authRoute = (app: Elysia) =>
  app.get(
    "/callback",
    async ({ query }) => {
      const { code } = query;
      if (!code) {
        return error(400, "Missing code");
      }
      try {
        const tokenData = await exchangeToken(code as string);
        const profile = await verifyIdToken(tokenData.id_token);

        const responseData = success(200, "Login success", {
          token: tokenData,
          profile,
        });

        return responseData;
      } catch (err: unknown) {
        return error(500, err instanceof Error ? err.message : "Unknown error");
      }
    },
    {
      query: t.Object({
        code: t.String(),
        state: t.Optional(t.String()),
      }),
    },
  );

// export const authRoute = (app: Elysia) =>
//   app.get(
//     "/callback",
//     async ({ query, set }) => {
//       console.log("callback", query);
//       const { code } = query;
//       console.log("code", code);

//       if (!code) {
//         set.status = 400;
//         return "Missing code";
//       }

//       try {
//         const tokenData = await exchangeToken(code as string);
//         const profile = await verifyIdToken(tokenData.id_token);

//         // แต่ในตัวอย่างนี้ผมจะส่งผ่าน query params กลับหน้า HTML
//         const profileEncoded = encodeURIComponent(JSON.stringify(profile));
//         const tokenEncoded = encodeURIComponent(JSON.stringify(tokenData));

//         set.status = 302; // redirect
//         set.headers["Location"] = `/index.html?profile=${profileEncoded}&token=${tokenEncoded}`;
//         return "";
//       } catch (err: unknown) {
//         set.status = 500;
//         return err instanceof Error ? err.message : "Unknown error";
//       }
//     },
//     {
//       query: t.Object({
//         code: t.String(),
//         state: t.Optional(t.String()),
//       }),
//     }
//   );

// export const authRoute = (app: Elysia) =>
//   app.get("/callback", async ({ query, set }) => {
//     const { code, state } = query;

//     if (!code) {
//       set.status = 400;
//       return { message: "Missing code" };
//     }

//     try {
//       const tokenData = await exchangeToken(code as string);
//       const profile = await verifyIdToken(tokenData.id_token);

//       // ส่งข้อมูลกลับไป frontend (serialize เป็น query param)
//       const redirectUrl =
//         `https://ski-reservation-five.vercel.app/` +
//         `?token=${encodeURIComponent(JSON.stringify(tokenData))}` +
//         `&profile=${encodeURIComponent(JSON.stringify(profile))}`;

//       set.status = 302;
//       set.headers["Location"] = redirectUrl;
//       return;
//     } catch (err) {
//       set.status = 500;
//       return { message: "Login failed", error: err };
//     }
//   });
