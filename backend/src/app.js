import dotenv from "dotenv";
// Load environment variables from backend .env file
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import logger from "./config/logger.js";
import db from "./models/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

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

// Database connection and table sync
const connectAndSyncDB = async () => {
  try {
    // The { alter: true } option checks the current state of the table in the database
    // and then performs the necessary changes in the table to make it match the model.
    await db.sequelize.sync({ alter: true });
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
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
};

startServer();

export default app;
