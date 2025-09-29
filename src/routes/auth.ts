
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
    }
  );
