/**
 * Script to run migrations for TagSakay RFID system
 * This script runs all pending Sequelize migrations
 */

import { Sequelize } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../src/config/logger.js";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run migrations using Sequelize
 */
async function runMigrations() {
  try {
    logger.info("🚀 Running database migrations...");

    // Read configuration from config file
    const configPath = path.resolve(__dirname, "../config/config.json");
    const configFile = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configFile);

    // Get environment-specific configuration
    const env = process.env.NODE_ENV || "development";
    const dbConfig = config[env];

    // Create Sequelize instance
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: (msg) => logger.debug(msg),
      }
    );

    // Check connection
    await sequelize.authenticate();
    logger.info("Database connection established successfully");

    // Get migration files
    const migrationsPath = path.resolve(__dirname, "../migrations");
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".js"))
      .sort();

    if (migrationFiles.length === 0) {
      logger.info("No migration files found");
      return;
    }

    logger.info(`Found ${migrationFiles.length} migration files`);

    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL,
        PRIMARY KEY ("name")
      );
    `);

    // Get already executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta";'
    );
    const executedMigrationNames = executedMigrations.map((m) => m.name);

    // Run pending migrations
    let migrationsRun = 0;

    for (const file of migrationFiles) {
      if (executedMigrationNames.includes(file)) {
        logger.debug(`Migration ${file} already executed, skipping`);
        continue;
      }

      logger.info(`Running migration: ${file}`);

      // Import migration file
      const migrationPath = path.join(migrationsPath, file);
      const migration = await import(`file://${migrationPath}`);

      // Run the up function
      await migration.default.up(sequelize.queryInterface, Sequelize);

      // Add to SequelizeMeta table
      await sequelize.query(
        'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
        {
          replacements: { name: file },
          type: sequelize.QueryTypes.INSERT,
        }
      );

      migrationsRun++;
    }

    if (migrationsRun > 0) {
      logger.info(`✅ Successfully executed ${migrationsRun} migrations`);
    } else {
      logger.info("No pending migrations to run");
    }

    await sequelize.close();
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await runMigrations();
    logger.info("Migration process completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Execute main function
main();
