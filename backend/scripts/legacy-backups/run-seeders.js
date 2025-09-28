import { seedDatabase } from "./seeders/index.js";
import logger from "./src/config/logger.js";

const runSeeders = async () => {
  try {
    logger.info("Running database seeders...");
    await seedDatabase({ resetData: true });
    logger.info("Database seeding completed!");
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`, { error });
    process.exit(1);
  }
};

runSeeders();
