import { ApiKey } from "../models/index.js";
import logger from "../config/logger.js";
import { Op } from "sequelize";

/**
 * Get a list of active RFID devices
 * A device is considered active if it has authenticated with the API in the last 15 minutes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getActiveDevices = async (req, res) => {
  try {
    // Consider devices active if they've authenticated within the last 15 minutes
    const activeTimeWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

    const activeDevices = await ApiKey.findAll({
      where: {
        type: "device",
        lastUsed: {
          [Op.gte]: activeTimeWindow,
        },
      },
      attributes: ["id", "name", "lastUsed", "metadata"],
    });

    // Format the response
    const devices = activeDevices.map((device) => {
      // Extract location from metadata if available
      const location = device.metadata?.location || null;

      return {
        id: device.id,
        name: device.name || `Device ${device.id.substring(0, 8)}`,
        lastActive: device.lastUsed,
        status: "online",
        location,
      };
    });

    // Check for known devices that aren't currently active
    const knownInactiveDevices = await ApiKey.findAll({
      where: {
        type: "device",
        lastUsed: {
          [Op.lt]: activeTimeWindow,
          [Op.ne]: null, // Has been used before
        },
      },
      attributes: ["id", "name", "lastUsed", "metadata"],
    });

    // Add inactive devices to the response
    knownInactiveDevices.forEach((device) => {
      // Extract location from metadata if available
      const location = device.metadata?.location || null;

      devices.push({
        id: device.id,
        name: device.name || `Device ${device.id.substring(0, 8)}`,
        lastActive: device.lastUsed,
        status: "offline",
        location,
      });
    });

    return res.status(200).json(devices);
  } catch (error) {
    logger.error(`Error retrieving active devices: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Error retrieving active RFID devices",
      error: error.message,
    });
  }
};
