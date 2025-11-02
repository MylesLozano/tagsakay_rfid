import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { SERVER_CONFIG } from "./config/env.js";
import logger from "./config/logger.js";
import db from "./models/index.js";
import authRoutes from "./routes/authRoutes.js";
import rfidRoutes from "./routes/rfidRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = SERVER_CONFIG.PORT;

// Configure trust proxy settings
if (process.env.NODE_ENV === "production") {
  // In production, trust first proxy
  app.set("trust proxy", 1);
} else {
  // In development, trust all proxies (for VS Code port forwarding)
  app.set("trust proxy", true);
}

// Setup morgan to stream to winston
const stream = {
  // Use the http level from winston
  write: (message) => logger.http(message.trim()),
};

const morganMiddleware = morgan(
  // Define message format string.
  ":method :url :status :res[content-length] - :response-time ms",
  // Options: in this case, stream to winston
  { stream }
);

// Middleware
app.use(morganMiddleware);
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "TagSakay API is running." });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rfid", rfidRoutes);
app.use("/api/apiKeys", apiKeyRoutes);
app.use("/api/devices", deviceRoutes);

// Database connection and table sync
const connectAndSyncDB = async () => {
  try {
    // Use non-destructive sync - won't try to alter existing tables/columns
    // For major schema changes, use migrations instead of sync
    await db.sequelize.sync();
    logger.info(
      "Database connection has been established and models were synchronized."
    );
  } catch (error) {
    logger.error("Unable to connect to or sync the database:", error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectAndSyncDB();
  const server = app.listen(PORT, () => {
    try {
      const address = server.address();
      const actualPort = address ? address.port : PORT;
      logger.info(`Server is running on port ${actualPort}`);
    } catch (error) {
      logger.error(`Error getting server port: ${error.message}`);
      logger.info(`Server is running on configured port ${PORT}`);
    }
  });
  return server;
};

startServer();

export { app, startServer, connectAndSyncDB };
