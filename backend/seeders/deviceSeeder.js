import Device from "../src/models/Device.js";
import crypto from "crypto";
import logger from "../src/config/logger.js";

/**
 * Generate a random API key for devices
 * @returns {string} Generated API key
 */
const generateDeviceApiKey = () => {
  const prefix = "dev_";
  const key = crypto.randomBytes(32).toString("hex");
  return prefix + key;
};

/**
 * Format MAC address to remove colons for device ID
 * @param {string} macAddress MAC address with colons
 * @returns {string} MAC address without colons
 */
const formatDeviceId = (macAddress) => {
  return macAddress.replace(/:/g, "");
};

// Sample device data
const sampleDevices = [
  {
    macAddress: "00:11:22:33:44:55",
    name: "Entrance Gate Scanner",
    location: "Main Terminal",
  },
  {
    macAddress: "AA:BB:CC:DD:EE:FF",
    name: "Exit Gate Scanner",
    location: "Main Terminal",
  },
  {
    macAddress: "01:23:45:67:89:AB",
    name: "Registration Kiosk",
    location: "Admin Office",
  },
  {
    macAddress: "CD:EF:01:23:45:67",
    name: "Mobile Scanner Unit",
    location: "Variable",
  },
];

/**
 * Seeds devices into the database
 * @param {Object} options Configuration options
 * @param {boolean} options.resetData Whether to delete existing devices before seeding
 * @returns {Promise<Array>} Array of created devices
 */
export const seedDevices = async (options = { resetData: false }) => {
  try {
    // Clear existing devices if resetData is true
    if (options.resetData) {
      logger.info("Deleting existing devices...");
      // Using raw query since Device is not a Sequelize model with destroy method
      const sequelize = await import("../src/config/database.js");
      await sequelize.default.query('DELETE FROM "Devices"');
    }

    // Check if any devices already exist
    const deviceCount = await Device.count();
    if (deviceCount > 0 && !options.resetData) {
      logger.info(
        `Found ${deviceCount} existing devices, skipping device seeding`
      );
      return await Device.findAll();
    }

    // Create devices
    const createdDevices = [];
    for (const deviceData of sampleDevices) {
      // Generate API key and format device ID from MAC
      const apiKey = generateDeviceApiKey();
      const deviceId = formatDeviceId(deviceData.macAddress);

      // Create the device
      const device = await Device.create({
        deviceId,
        macAddress: deviceData.macAddress,
        name: deviceData.name,
        location: deviceData.location,
        apiKey,
        isActive: true,
        registrationMode: false,
        scanMode: false,
        lastSeen: new Date(),
      });

      createdDevices.push(device);
    }

    return createdDevices;
  } catch (error) {
    logger.error("Error seeding devices:", error);
    throw error;
  }
};
