import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { createDb, type Database } from "./db";

// Import routes (we'll create these next)
import authRoutes from "./routes/auth";
import rfidRoutes from "./routes/rfid";
import deviceRoutes from "./routes/device";
import userRoutes from "./routes/user";
import apiKeyRoutes from "./routes/apiKey";

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

type Variables = {
  db: Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "https://tagsakay.com",
      "https://www.tagsakay.com",
    ],
    credentials: true,
  })
);

// Inject database into context
app.use("*", async (c, next) => {
  c.set("db", createDb(c.env.DATABASE_URL));
  await next();
});

// Health check
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "TagSakay API is running on Cloudflare Workers",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c) => {
  return c.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/rfid", rfidRoutes);
app.route("/api/devices", deviceRoutes);
app.route("/api/users", userRoutes);
app.route("/api/keys", apiKeyRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json(
    {
      success: false,
      message: err.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
    500
  );
});

export default app;
