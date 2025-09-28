import { sequelize } from "./src/config/database.js";
import logger from "./src/config/logger.js";

const initializeDatabase = async () => {
  try {
    logger.info("Initializing database schema...");

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
    process.exit(0);
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`, { error });
    process.exit(1);
  }
};

initializeDatabase();
