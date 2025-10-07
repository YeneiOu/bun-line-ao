import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoute } from "./routes/auth";
import { firebaseRoutes } from "./routes/firebase";
import { adminRoutes } from "./routes/admin";
import { responsePlugin } from "./plugins/response";
import { ResponseSuccess } from "./utils/response";
import { swaggerConfig } from "./config/swagger";
import { env, validateEnv } from "./utils/env";

// Validate environment variables on startup
try {
  validateEnv();
} catch (error) {
  console.error("❌ Environment validation failed:", error);
  process.exit(1);
}

const app = new Elysia();

// Add CORS support
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Add Swagger documentation
app.use(swaggerConfig);

// Add response plugin
app.use(responsePlugin);

// Register routes
app.use(authRoute);
app.use(firebaseRoutes);
app.use(adminRoutes);

app.get(
  "/",
  () =>
    ResponseSuccess(
      200,
      {
        code: 0,
        message: "Welcome to Ski Academy Management System API",
      },
      {
        msg: "Welcome to Ski Academy Management System API",
        version: "1.0.0",
        documentation: "/swagger",
        endpoints: {
          health: "/api/health",
          reservations: "/api/reservations",
          coaches: "/api/coaches",
          prices: "/api/prices",
          settings: "/api/settings",
          upload: "/api/upload",
          admin: "/api/admin",
          auth: "/api/auth",
        },
        features: [
          "Reservation Management",
          "Coach Management",
          "Dynamic Pricing",
          "Admin Dashboard",
          "File Upload",
          "JWT Authentication",
          "Firebase Integration",
        ],
      }
    ),
  {
    detail: {
      tags: ["Health"],
      summary: "API Information",
      description: "Get basic API information and available endpoints",
    },
  }
);

app.listen(env.port);

console.log(`
🚀 Ski Academy API Server Started Successfully!

📍 Server: http://${app.server?.hostname}:${app.server?.port}
📚 Documentation: http://${app.server?.hostname}:${app.server?.port}/swagger
🌍 Environment: ${env.nodeEnv}

✅ Environment validation passed
${
  env.firebase.serviceAccountKey
    ? "✅ Firebase Admin SDK configured"
    : "⚠️  Firebase Admin SDK not configured"
}

📊 Available Endpoints:
   • GET  /                     - API Information
   • GET  /api/health           - Health Check
   • GET  /swagger              - API Documentation
   • POST /api/reservations     - Create Reservation
   • GET  /api/coaches          - List Coaches
   • GET  /api/admin/stats      - Admin Statistics
`);
