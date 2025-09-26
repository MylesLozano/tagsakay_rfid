/**
 * Initialize database and create tables
 */
import { sequelize } from "./src/config/database.js";
import { User, ApiKey, Rfid, RfidScan } from "./src/models/index.js";
import logger from "./src/config/logger.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const initializeDatabase = async () => {
  try {
    logger.info("Connecting to database...");
    await sequelize.authenticate();
    logger.info("Database connection established successfully.");

    logger.info("Synchronizing models with database...");
    // Force: true will drop existing tables - be careful in production!
    await sequelize.sync({ force: true });
    logger.info("Database tables created successfully.");

    // Create an initial admin user with hashed password
    logger.info("Creating initial admin user...");
    // Hash the password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword, // Password is now correctly hashed
      role: "admin",
      isActive: true,
    });
    logger.info(`Admin user created with id: ${adminUser.id}`);

    // Create an initial API key for testing
    logger.info("Creating initial API key...");

    // Generate a secure random API key
    const apiKey = crypto.randomBytes(32).toString("hex");
    // Generate a key prefix for easier identification
    const prefix = crypto.randomBytes(3).toString("hex");
    // Create a hashed version of the API key for storage
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    const initialApiKey = await ApiKey.create({
      name: "Test ESP32 Device",
      deviceId: "ESP32-TEST",
      description: "Initial API key for testing",
      key: hashedKey,
      prefix,
      permissions: ["scan", "manage"],
      createdBy: adminUser.id,
      lastUsed: null,
      metadata: { location: "Test Location" },
      type: "device",
    });

    logger.info(`Initial API key created with id: ${initialApiKey.id}`);
    logger.info(`API Key for your ESP32: ${prefix}_${apiKey}`);
    logger.info("IMPORTANT: Save this API key as it won't be shown again!");

    logger.info("Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`, { error });
    process.exit(1);
  }
};

initializeDatabase();
