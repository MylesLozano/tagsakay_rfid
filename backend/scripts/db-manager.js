/**
 * Database management script for TagSakay RFID system
 * Handles database reset, schema initialization, and seeding in one script
 */

import pg from "pg";
import { exec } from "child_process";
import { promisify } from "util";
import logger from "../src/config/logger.js";

const execPromise = promisify(exec);
const { Pool } = pg;

/**
 * Terminates all connections to the database
 */
async function terminateConnections() {
  try {
    logger.info("🔌 Terminating existing connections to database...");

    // Connect to default postgres database to perform operations
    const pool = new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      password: process.env.DB_PASSWORD || "Postgre4017",
      port: process.env.DB_PORT || 5432,
      database: "postgres", // Connect to default database
    });

    // Terminate connections
    await pool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${
        process.env.DB_NAME || "tagsakay_db"
      }' AND pid <> pg_backend_pid();
    `);

    return pool;
  } catch (error) {
    logger.error(`Error terminating connections: ${error.message}`);
    throw error;
  }
}

/**
 * Drops the existing database and creates a fresh one
 */
async function resetDatabase(pool) {
  try {
    logger.info("💥 Dropping database if it exists...");
    await pool.query(
      `DROP DATABASE IF EXISTS ${process.env.DB_NAME || "tagsakay_db"};`
    );
    logger.info("Database dropped successfully");

    logger.info("🏗️ Creating fresh database...");
    await pool.query(
      `CREATE DATABASE ${process.env.DB_NAME || "tagsakay_db"};`
    );
    logger.info("Database created successfully");

    // Close the admin connection pool
    await pool.end();
  } catch (error) {
    logger.error(`Error resetting database: ${error.message}`);
    throw error;
  }
}

/**
 * Initializes the database schema with all required tables
 */
async function initializeSchema() {
  try {
    logger.info("📝 Initializing database schema...");

    // Import sequelize after the database is created
    const { sequelize } = await import("../src/config/database.js");

    // First, create the Users table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'user',
        "isActive" BOOLEAN DEFAULT TRUE,
        "rfidTag" VARCHAR(255) UNIQUE,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      )
    `);
    logger.info("Users table created or already exists");

    // Create the ApiKeys table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ApiKeys" (
        "id" UUID PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "deviceId" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "key" VARCHAR(64) NOT NULL UNIQUE,
        "prefix" VARCHAR(10) NOT NULL,
        "permissions" TEXT NOT NULL,
        "lastUsed" TIMESTAMP,
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdBy" INTEGER NOT NULL,
        "metadata" JSONB DEFAULT '{}' NOT NULL,
        "type" VARCHAR(255) DEFAULT 'device' NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("createdBy") REFERENCES "Users"("id")
      )
    `);
    logger.info("ApiKeys table created or already exists");

    // Create the RFID table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Rfids" (
        "id" UUID PRIMARY KEY,
        "tagId" VARCHAR(255) NOT NULL UNIQUE,
        "userId" INTEGER,
        "isActive" BOOLEAN DEFAULT TRUE,
        "lastScanned" TIMESTAMP,
        "deviceId" VARCHAR(255),
        "registeredBy" INTEGER NOT NULL,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "Users"("id"),
        FOREIGN KEY ("registeredBy") REFERENCES "Users"("id")
      )
    `);
    logger.info("Rfids table created or already exists");

    // Create the RFIDScans table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "RfidScans" (
        "id" UUID PRIMARY KEY,
        "rfidTagId" VARCHAR(255) NOT NULL,
        "deviceId" VARCHAR(255) NOT NULL,
        "userId" INTEGER,
        "eventType" VARCHAR(10) NOT NULL DEFAULT 'unknown',
        "location" VARCHAR(255),
        "vehicleId" VARCHAR(255),
        "scanTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" VARCHAR(20) NOT NULL DEFAULT 'success',
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "Users"("id")
      )
    `);

    // Create ENUM types if needed
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_rfidscans_eventtype') THEN
          CREATE TYPE "enum_RfidScans_eventType" AS ENUM ('entry', 'exit', 'unknown');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_rfidscans_status') THEN
          CREATE TYPE "enum_RfidScans_status" AS ENUM ('success', 'failed', 'unauthorized');
        END IF;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    logger.info("RfidScans table created or already exists");

    // Create the Devices table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Devices" (
        "id" SERIAL PRIMARY KEY,
        "deviceId" VARCHAR(255) NOT NULL UNIQUE,
        "macAddress" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "location" VARCHAR(255) NOT NULL,
        "apiKey" VARCHAR(255) NOT NULL UNIQUE,
        "isActive" BOOLEAN DEFAULT TRUE,
        "registrationMode" BOOLEAN DEFAULT FALSE,
        "pendingRegistrationTagId" VARCHAR(255) DEFAULT '',
        "scanMode" BOOLEAN DEFAULT FALSE,
        "lastSeen" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      )
    `);
    logger.info("Devices table created or already exists");

    logger.info("All tables created successfully!");
  } catch (error) {
    logger.error(`Database schema initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Seeds the database with test data
 */
async function seedDatabase() {
  try {
    logger.info("🌱 Seeding database with initial data...");
    const { seedDatabase } = await import("../seeders/index.js");
    await seedDatabase({ resetData: true });
    logger.info("Database seeding completed successfully!");
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main function to execute database operations based on command line arguments
 */
async function main() {
  logger.info("🔄 TagSakay Database Management");

  try {
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase() || "help";

    switch (command) {
      case "reset":
        logger.info("Resetting database (drop and create)...");
        const pool = await terminateConnections();
        await resetDatabase(pool);
        logger.info("✅ Database reset complete!");
        break;

      case "init":
        logger.info("Initializing database schema...");
        await initializeSchema();
        logger.info("✅ Schema initialization complete!");
        break;

      case "seed":
        logger.info("Seeding database with test data...");
        await seedDatabase();
        logger.info("✅ Database seeding complete!");
        break;

      case "full":
        logger.info(
          "Performing full database reset, schema initialization, and seeding..."
        );
        const connPool = await terminateConnections();
        await resetDatabase(connPool);
        await initializeSchema();
        await seedDatabase();
        logger.info("✅ Full database setup complete!");
        break;

      case "help":
      default:
        console.log(`
TagSakay Database Management Tool

Usage: node scripts/db-manager.js [command]

Commands:
  reset   - Drop and recreate the database
  init    - Initialize database schema (create tables)
  seed    - Populate database with test data
  full    - Perform all operations: reset, init, and seed
  help    - Show this help message

Example:
  node scripts/db-manager.js full
        `);
        break;
    }

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Execute the main function
main();
