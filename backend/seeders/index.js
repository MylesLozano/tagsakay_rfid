import { seedUsers } from "./userSeeder.js";
import { seedRfidTags } from "./rfidSeeder.js";
import { seedApiKeys } from "./apiKeySeeder.js";
import { seedRfidScans } from "./rfidScanSeeder.js";
import logger from "../src/config/logger.js";
import sequelize from "../src/config/database.js";

/**
 * Main seeder function that orchestrates all seed operations
 * @param {Object} options Configuration options
 * @param {boolean} options.resetData Whether to delete existing data before seeding
 * @returns {Promise<Object>} Object containing all seeded data
 */
export const seedDatabase = async (options = { resetData: false }) => {
  try {
    logger.info("Starting database seeding...");

    // Order matters due to foreign key relationships
    // 1. First seed users (no dependencies)
    const users = await seedUsers(options);
    logger.info(`Seeded ${users.length} users`);

    // 2. Seed API keys (depends on users)
    const apiKeys = await seedApiKeys(users, options);
    logger.info(`Seeded ${apiKeys.length} API keys`);

    // 3. Seed RFID tags (depends on users)
    const rfidTags = await seedRfidTags(users, options);
    logger.info(`Seeded ${rfidTags.length} RFID tags`);

    // 4. Seed RFID scan events (depends on RFID tags and users)
    const scanCount = options.scanCount || 3;
    const rfidScans = await seedRfidScans(rfidTags, { ...options, scanCount });
    logger.info(`Seeded ${rfidScans.length} RFID scan records`);

    logger.info("Database seeding completed successfully");
    return { users, apiKeys, rfidTags, rfidScans };
  } catch (error) {
    logger.error("Error seeding database:", error);
    throw error;
  }
};
