/**
 * Run the latest database migrations
 */
import { sequelize } from "./src/config/database.js";
import addMetadataAndTypeToApiKey from "./src/migrations/20230918_add_metadata_type_to_apikey.js";
import logger from "./src/config/logger.js";

const runMigrations = async () => {
  try {
    logger.info("Starting database migrations...");

    // Run the migration to add metadata and type fields to ApiKey
    await addMetadataAndTypeToApiKey(sequelize);

    logger.info("All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`, { error });
    process.exit(1);
  }
};

runMigrations();
