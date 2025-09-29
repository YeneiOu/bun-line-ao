import { Elysia } from "elysia";
import { authRoute } from "./routes/auth";
import { responsePlugin } from "./plugins/response";
import { success } from "./utils/response";

const app = new Elysia();

// ใช้ plugin ทั่วทั้ง app
app.use(responsePlugin);

app.get("/", () => success(0, "Hello Elysia", { msg: "Hello Elysia" }));

authRoute(app);

app.listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
