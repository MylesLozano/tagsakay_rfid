/**
 * Device management script for TagSakay RFID system
 * Handles device registration, configuration, and testing
 */

import { sequelize } from "../src/config/database.js";
import crypto from "crypto";
import logger from "../src/config/logger.js";

/**
 * Registers a new device in the database
 */
async function registerDevice({ macAddress, name, location }) {
  try {
    logger.info(`Registering new device: ${name} (MAC: ${macAddress})`);

    // Sanitize MAC address (remove colons if present)
    const deviceId = macAddress.replace(/:/g, "");

    // Generate API key (prefix + random string)
    const prefix = "dev";
    const apiKey = `${prefix}_${crypto.randomBytes(32).toString("hex")}`;

    // Check if device already exists
    const [existingDevice] = await sequelize.query(
      `SELECT * FROM "Devices" WHERE "deviceId" = $1 OR "macAddress" = $2`,
      {
        bind: [deviceId, macAddress],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (existingDevice) {
      logger.error(`Device already registered with MAC address: ${macAddress}`);
      return { success: false, message: "Device already registered" };
    }

    // Insert new device
    const [device] = await sequelize.query(
      `INSERT INTO "Devices" ("deviceId", "macAddress", "name", "location", "apiKey", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      {
        bind: [deviceId, macAddress, name, location, apiKey, true],
        type: sequelize.QueryTypes.INSERT,
      }
    );

    logger.info(`Device registered successfully with ID: ${deviceId}`);
    return {
      success: true,
      message: "Device registered successfully",
      device: {
        id: deviceId,
        macAddress,
        name,
        location,
        apiKey,
      },
    };
  } catch (error) {
    logger.error(`Error registering device: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Lists all devices in the database
 */
async function listDevices() {
  try {
    logger.info("Fetching all devices");

    const devices = await sequelize.query(
      `SELECT * FROM "Devices" ORDER BY "createdAt" DESC`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    logger.info(`Found ${devices.length} devices`);
    return {
      success: true,
      devices,
    };
  } catch (error) {
    logger.error(`Error fetching devices: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Enables registration mode for a device
 */
async function enableRegistrationMode(deviceId, tagId = "") {
  try {
    logger.info(`Enabling registration mode for device: ${deviceId}`);

    // Update device status
    const [result] = await sequelize.query(
      `UPDATE "Devices" 
       SET "registrationMode" = TRUE, 
           "pendingRegistrationTagId" = $1,
           "scanMode" = $2,
           "updatedAt" = NOW()
       WHERE "deviceId" = $3
       RETURNING *`,
      {
        bind: [tagId, !tagId, deviceId],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    if (!result || result.length === 0) {
      logger.error(`Device not found: ${deviceId}`);
      return { success: false, message: "Device not found" };
    }

    logger.info(`Registration mode enabled for device: ${deviceId}`);
    return {
      success: true,
      message: "Registration mode enabled",
      device: result[0],
    };
  } catch (error) {
    logger.error(`Error enabling registration mode: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Disables registration mode for a device
 */
async function disableRegistrationMode(deviceId) {
  try {
    logger.info(`Disabling registration mode for device: ${deviceId}`);

    // Update device status
    const [result] = await sequelize.query(
      `UPDATE "Devices" 
       SET "registrationMode" = FALSE, 
           "pendingRegistrationTagId" = '',
           "scanMode" = FALSE,
           "updatedAt" = NOW()
       WHERE "deviceId" = $1
       RETURNING *`,
      {
        bind: [deviceId],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    if (!result || result.length === 0) {
      logger.error(`Device not found: ${deviceId}`);
      return { success: false, message: "Device not found" };
    }

    logger.info(`Registration mode disabled for device: ${deviceId}`);
    return {
      success: true,
      message: "Registration mode disabled",
      device: result[0],
    };
  } catch (error) {
    logger.error(`Error disabling registration mode: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to execute device operations based on command line arguments
 */
async function main() {
  logger.info("📱 TagSakay Device Management");

  try {
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase() || "help";

    switch (command) {
      case "register":
        if (args.length < 4) {
          console.log("Missing required parameters for device registration");
          console.log(
            "Usage: node scripts/device-manager.js register <mac-address> <name> <location>"
          );
          process.exit(1);
        }

        const result = await registerDevice({
          macAddress: args[1],
          name: args[2],
          location: args[3],
        });

        console.log(JSON.stringify(result, null, 2));
        break;

      case "list":
        const devices = await listDevices();
        console.log(JSON.stringify(devices, null, 2));
        break;

      case "enable-reg":
        if (args.length < 2) {
          console.log("Missing device ID parameter");
          console.log(
            "Usage: node scripts/device-manager.js enable-reg <device-id> [tag-id]"
          );
          process.exit(1);
        }

        const tagId = args.length > 2 ? args[2] : "";
        const enableResult = await enableRegistrationMode(args[1], tagId);
        console.log(JSON.stringify(enableResult, null, 2));
        break;

      case "disable-reg":
        if (args.length < 2) {
          console.log("Missing device ID parameter");
          console.log(
            "Usage: node scripts/device-manager.js disable-reg <device-id>"
          );
          process.exit(1);
        }

        const disableResult = await disableRegistrationMode(args[1]);
        console.log(JSON.stringify(disableResult, null, 2));
        break;

      case "help":
      default:
        console.log(`
TagSakay Device Management Tool

Usage: node scripts/device-manager.js [command]

Commands:
  register <mac> <name> <location>  - Register a new device
  list                              - List all registered devices
  enable-reg <device-id> [tag-id]   - Enable registration mode for a device
  disable-reg <device-id>           - Disable registration mode for a device
  help                              - Show this help message

Examples:
  node scripts/device-manager.js register 00:11:22:33:44:55 "Entrance Gate" "Main Building"
  node scripts/device-manager.js list
  node scripts/device-manager.js enable-reg 001122334455
  node scripts/device-manager.js disable-reg 001122334455
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
