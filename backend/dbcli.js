#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();

import logger from "./src/config/logger.js";
import sequelize from "./src/config/database.js";
import { seedDatabase } from "./seeders/index.js";

// Helper to print usage info
const printUsage = () => {
  console.log(`
TagSakay Database CLI Tool

Usage:
  node dbcli.js [command] [options]

Commands:
  seed              Seed the database with sample data (preserves existing data)
  seed:reset        Reset and seed the database (deletes existing data first)
  sync              Synchronize the database schema (creates tables if they don't exist)
  sync:force        Drop all tables and recreate them
  sync:alter        Modify existing tables to match the models
  check             Check database connection and content
  help              Display this help message

Options:
  --scan-count=n    Number of scan records to generate per RFID tag
  --verbose         Display more detailed output
  --help            Display help for command

Examples:
  node dbcli.js seed
  node dbcli.js seed:reset --scan-count=10
  node dbcli.js sync:alter
  `);
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const options = {
    resetData: command === "seed:reset",
    forceSync: command === "sync:force",
    alterSync: command === "sync:alter",
    scanCount: 3,
    verbose: false,
  };

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--scan-count=")) {
      options.scanCount = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "--help") {
      return { command: "help", options };
    }
  }

  return { command, options };
};

// Sync database schema
const syncDatabase = async (options) => {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connection successful!");

    const dialect = sequelize.getDialect();
    const host = sequelize.config.host;
    const database = sequelize.config.database;
    logger.info(`Connected to ${dialect} database at ${host}/${database}`);

    let syncOptions = {};
    if (options.forceSync) {
      logger.warn(
        "⚠️ Using force sync - all tables will be dropped and recreated!"
      );
      syncOptions = { force: true };
    } else if (options.alterSync) {
      logger.warn(
        "⚠️ Using alter sync - tables will be modified to match models"
      );
      syncOptions = { alter: true };
    } else {
      logger.info(
        "Using regular sync - only creating tables if they don't exist"
      );
    }

    // Ensure models are loaded
    await import("./src/models/index.js");

    // Perform the sync
    logger.info("Syncing database models...");
    await sequelize.sync(syncOptions);
    logger.info("Database sync completed successfully!");

    return true;
  } catch (error) {
    logger.error("❌ Database sync failed:", error);
    return false;
  }
};

// Check database connection and content
const checkDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connection successful!");

    const dialect = sequelize.getDialect();
    const host = sequelize.config.host;
    const database = sequelize.config.database;
    logger.info(`Connected to ${dialect} database at ${host}/${database}`);

    // Load models
    const { default: db } = await import("./src/models/index.js");

    // Count records
    const userCount = await db.User.count();
    const rfidCount = await db.Rfid.count();
    const apiKeyCount = await db.ApiKey.count();
    const scanCount = await db.RfidScan.count();

    logger.info("=== Database Content Summary ===");
    logger.info(`Users: ${userCount}`);
    logger.info(`RFID Tags: ${rfidCount}`);
    logger.info(`API Keys: ${apiKeyCount}`);
    logger.info(`RFID Scans: ${scanCount}`);

    // Get sample data for display
    if (userCount > 0) {
      const users = await db.User.findAll({ limit: 3 });
      logger.info("\nSample Users:");
      users.forEach((user) => {
        logger.info(`- ${user.name} (${user.email}), Role: ${user.role}`);
      });
    }

    if (rfidCount > 0) {
      const rfidTags = await db.Rfid.findAll({ limit: 3 });
      logger.info("\nSample RFID Tags:");
      rfidTags.forEach((tag) => {
        logger.info(
          `- Tag ID: ${tag.tagId}, User ID: ${tag.userId}, Active: ${tag.isActive}`
        );
      });
    }

    logger.info("\nDatabase check completed successfully.");
    return true;
  } catch (error) {
    logger.error("❌ Database check failed:", error);
    return false;
  }
};

// Main function
const main = async () => {
  const { command, options } = parseArgs();

  try {
    switch (command) {
      case "seed":
      case "seed:reset":
        // First sync the database
        const syncSuccess = await syncDatabase({
          forceSync: false,
          alterSync: false,
        });

        if (!syncSuccess) {
          logger.error("Database sync failed, aborting seeding");
          process.exit(1);
        }

        // Then seed it
        logger.info(`Seeding database with resetData=${options.resetData}...`);
        const result = await seedDatabase({
          resetData: options.resetData,
          scanCount: options.scanCount,
        });

        logger.info("Seeding completed successfully!");
        logger.info(
          `Created ${result.users.length} users, ${result.rfidTags.length} RFID tags, ${result.apiKeys.length} API keys, and ${result.rfidScans.length} scan records.`
        );
        break;

      case "sync":
      case "sync:force":
      case "sync:alter":
        await syncDatabase(options);
        break;

      case "check":
        await checkDatabase();
        break;

      case "help":
      default:
        printUsage();
        break;
    }

    // Close the connection
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error("Error:", error);
    // Close the connection
    try {
      await sequelize.close();
    } catch {}
    process.exit(1);
  }
};

// Run the main function
main();
