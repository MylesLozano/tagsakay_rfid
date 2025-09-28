import { ApiKey, Device } from "../models/index.js";
import logger from "../config/logger.js";
import { Op } from "sequelize";
import crypto from "crypto";

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

// Global state to track registration mode for each device
const deviceRegistrationMode = new Map();

/**
 * Set a device to registration mode
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const setRegistrationMode = async (req, res) => {
  try {
    const { deviceId, enabled, tagId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID is required",
      });
    }

    // Check if the device exists
    const device = await ApiKey.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Set the registration mode for the device
    deviceRegistrationMode.set(deviceId, {
      enabled: enabled === true,
      tagId: tagId === "new" ? null : tagId || null, // "new" means any tag is accepted
      scanMode: tagId === "new" ? true : false, // Special flag for scanning any new tag
      timestamp: new Date(),
    });

    logger.info(
      `Device ${deviceId} registration mode set to ${
        enabled ? "enabled" : "disabled"
      }${tagId === "new" ? " (scan mode)" : ""}`
    );

    return res.status(200).json({
      success: true,
      message: `Registration mode ${
        enabled ? "enabled" : "disabled"
      } for device ${deviceId}`,
      data: {
        deviceId,
        registrationMode: enabled,
        tagId,
      },
    });
  } catch (error) {
    logger.error(`Error setting registration mode: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Check if a device is in registration mode
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkRegistrationMode = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID is required",
      });
    }

    // Check if the device exists
    // Instead of searching by ID, search by deviceId field or API key prefix
    let device;

    // Try to find by deviceId field
    device = await ApiKey.findOne({
      where: { deviceId: deviceId },
    });

    // If not found, check if deviceId parameter is the API key prefix
    if (!device && deviceId.includes("_")) {
      const prefix = deviceId.split("_")[0];
      device = await ApiKey.findOne({
        where: { prefix: prefix },
      });
    }

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Use the actual device ID from the database for internal operations
    const actualDeviceId = device.id;

    // Check if the device is in registration mode
    const registrationMode = deviceRegistrationMode.get(actualDeviceId);

    // Auto-disable after 2 minutes of inactivity
    if (registrationMode && registrationMode.enabled) {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (registrationMode.timestamp < twoMinutesAgo) {
        deviceRegistrationMode.set(actualDeviceId, {
          ...registrationMode,
          enabled: false,
        });
        logger.info(
          `Device ${device.deviceId} registration mode auto-disabled due to timeout`
        );
      }
    }

    // Get the updated registration mode
    const updatedMode = deviceRegistrationMode.get(actualDeviceId) || {
      enabled: false,
      tagId: null,
    };

    return res.status(200).json({
      success: true,
      data: {
        deviceId: device.deviceId,
        registrationMode: updatedMode.enabled,
        tagId: updatedMode.tagId,
        scanMode: updatedMode.scanMode || false,
      },
    });
  } catch (error) {
    logger.error(`Error checking registration mode: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Helper function to generate API key
 */
const generateApiKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Create new device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const registerDevice = async (req, res) => {
  try {
    const { macAddress, location, name } = req.body;

    // Sanitize MAC address (remove colons if present)
    const deviceId = macAddress.replace(/:/g, "");

    // Check if device already exists
    const existingDevice = await Device.findOne({ where: { deviceId } });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: "Device already registered",
      });
    }

    // Create new device
    const device = await Device.create({
      deviceId,
      macAddress, // Store original MAC with colons for display
      location,
      name,
      apiKey: generateApiKey(),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Device registered successfully",
      data: { device },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering device",
      error: error.message,
    });
  }
};

/**
 * Get all devices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllDevices = async (req, res) => {
  try {
    const devices = await Device.findAll();

    res.json({
      success: true,
      data: { devices },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving devices",
      error: error.message,
    });
  }
};

/**
 * Get registration mode status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRegistrationMode = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ where: { deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    res.json({
      success: true,
      data: {
        registrationMode: device.registrationMode,
        tagId: device.pendingRegistrationTagId || "",
        scanMode: device.scanMode || false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking registration mode",
      error: error.message,
    });
  }
};

/**
 * Update device status (including registration mode)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { registrationMode, pendingRegistrationTagId, scanMode } = req.body;

    const device = await Device.findOne({ where: { deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Update device fields
    if (registrationMode !== undefined)
      device.registrationMode = registrationMode;
    if (pendingRegistrationTagId !== undefined)
      device.pendingRegistrationTagId = pendingRegistrationTagId;
    if (scanMode !== undefined) device.scanMode = scanMode;

    device.lastSeen = new Date();
    await device.save();

    res.json({
      success: true,
      message: "Device status updated",
      data: { device },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating device status",
      error: error.message,
    });
  }
};
