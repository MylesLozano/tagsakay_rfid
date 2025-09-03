import ApiKey from "../src/models/ApiKey.js";
import crypto from "crypto";
import logger from "../src/config/logger.js";

// Helper to generate API keys
const generateApiKey = () => {
  return crypto.randomBytes(24).toString("hex");
};

// Helper to generate API key prefix
const generatePrefix = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

/**
 * Seeds API keys into the database
 * @param {Array} users Array of user objects to associate with API keys
 * @param {Object} options Configuration options
 * @param {boolean} options.resetData Whether to delete existing API keys before seeding
 * @returns {Promise<Array>} Array of created API keys
 */
export const seedApiKeys = async (users, options = { resetData: false }) => {
  try {
    // Clear existing API keys if resetData is true
    if (options.resetData) {
      logger.info("Deleting existing API keys...");
      await ApiKey.destroy({ where: {}, force: true });
    }

    // Check if any API keys already exist
    const keyCount = await ApiKey.count();
    if (keyCount > 0 && !options.resetData) {
      logger.info(
        `Found ${keyCount} existing API keys, skipping API key seeding`
      );
      return await ApiKey.findAll();
    }

    const createdKeys = [];
    const adminUser = users.find((user) => user.role === "admin");

    if (!adminUser) {
      throw new Error("No admin user found for API key creation");
    }

    // Create admin API key
    const adminKey = await ApiKey.create({
      key: generateApiKey(),
      prefix: generatePrefix(),
      name: "Admin Dashboard Key",
      deviceId: "ADMIN-DASHBOARD",
      description: "API key for administrative dashboard access",
      permissions: ["read", "write", "delete", "admin"],
      createdBy: adminUser.id,
      isActive: true,
    });
    createdKeys.push(adminKey);

    // Create terminal API key
    const terminalKey = await ApiKey.create({
      key: generateApiKey(),
      prefix: generatePrefix(),
      name: "Terminal Kiosk Key",
      deviceId: "TERMINAL-KIOSK-01",
      description: "API key for terminal kiosk device",
      permissions: ["read", "write", "scan"],
      createdBy: adminUser.id,
      isActive: true,
    });
    createdKeys.push(terminalKey);

    // Create mobile app API key
    const mobileKey = await ApiKey.create({
      key: generateApiKey(),
      prefix: generatePrefix(),
      name: "Mobile App Key",
      deviceId: "MOBILE-APP",
      description: "API key for mobile application",
      permissions: ["read", "scan"],
      createdBy: adminUser.id,
      isActive: true,
    });
    createdKeys.push(mobileKey);

    return createdKeys;
  } catch (error) {
    logger.error("Error seeding API keys:", error);
    throw error;
  }
};
