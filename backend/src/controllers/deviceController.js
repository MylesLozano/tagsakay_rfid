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

    // First check the Device model for devices
    const deviceRecords = await Device.findAll({
      attributes: [
        "id",
        "deviceId",
        "macAddress",
        "name",
        "location",
        "isActive",
        "registrationMode",
        "pendingRegistrationTagId",
        "scanMode",
        "lastSeen",
        "createdAt",
        "updatedAt",
      ],
    });

    // Format devices from Device model
    const devices = deviceRecords.map((device) => {
      const isOnline =
        device.lastSeen && new Date(device.lastSeen) >= activeTimeWindow;

      return {
        id: device.deviceId, // Use deviceId as the frontend expects
        deviceId: device.deviceId,
        macAddress: device.macAddress,
        name: device.name,
        location: device.location,
        isActive: device.isActive,
        registrationMode: device.registrationMode,
        pendingRegistrationTagId: device.pendingRegistrationTagId,
        scanMode: device.scanMode,
        lastSeen: device.lastSeen,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
        status: isOnline ? "online" : "offline",
      };
    });

    // If no devices found in Device model, check for legacy devices in ApiKey
    if (devices.length === 0) {
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
      activeDevices.forEach((device) => {
        // Extract location from metadata if available
        const location = device.metadata?.location || null;

        devices.push({
          id: device.id,
          deviceId: device.id,
          name: device.name || `Device ${device.id.substring(0, 8)}`,
          lastSeen: device.lastUsed,
          status: "online",
          location,
          isActive: true,
          registrationMode: false,
        });
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
          deviceId: device.id,
          name: device.name || `Device ${device.id.substring(0, 8)}`,
          lastSeen: device.lastUsed,
          status: "offline",
          location,
          isActive: false,
          registrationMode: false,
        });
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active devices retrieved successfully",
      data: devices,
    });
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
    const deviceId = macAddress.replace(/:/g, "").toUpperCase();

    // Format MAC address for display (with colons)
    const formattedMacAddress = macAddress.includes(":")
      ? macAddress.toUpperCase()
      : macAddress.replace(/(.{2})(?=.)/g, "$1:").toUpperCase();

    // Check if device already exists
    const existingDevice = await Device.findOne({
      where: {
        [Op.or]: [{ deviceId }, { macAddress: formattedMacAddress }],
      },
    });

    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: "Device already registered",
      });
    }

    // Generate API key for the device
    const apiKeyValue = crypto.randomBytes(32).toString("hex");
    const prefix = crypto.randomBytes(3).toString("hex");
    const hashedKey = crypto
      .createHash("sha256")
      .update(apiKeyValue)
      .digest("hex");

    // Create API key record
    const apiKeyRecord = await ApiKey.create({
      name,
      deviceId,
      description: `API key for device at ${location}`,
      key: hashedKey,
      prefix,
      permissions: ["scan"],
      createdBy: req.user.id,
      metadata: {
        macAddress: formattedMacAddress,
        location,
      },
      type: "device",
    });

    // Create new device
    const device = await Device.create({
      deviceId,
      macAddress: formattedMacAddress, // Store original MAC with colons for display
      location,
      name,
      apiKey: `${prefix}_${apiKeyValue}`, // Store full API key in device record
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Device registered successfully",
      data: {
        device,
        apiKey: {
          id: apiKeyRecord.id,
          prefix: apiKeyRecord.prefix,
          fullKey: `${prefix}_${apiKeyValue}`, // This is only shown once during creation
          permissions: apiKeyRecord.permissions,
        },
      },
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
    // Consider devices active if they've authenticated within the last 15 minutes
    const activeTimeWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

    const devices = await Device.findAll({
      attributes: [
        "id",
        "deviceId",
        "macAddress",
        "name",
        "location",
        "isActive",
        "registrationMode",
        "pendingRegistrationTagId",
        "scanMode",
        "lastSeen",
        "createdAt",
        "updatedAt",
      ],
    });

    // Format devices from Device model with online status
    const formattedDevices = devices.map((device) => {
      const isOnline =
        device.lastSeen && new Date(device.lastSeen) >= activeTimeWindow;

      return {
        id: device.id,
        deviceId: device.deviceId,
        macAddress: device.macAddress,
        name: device.name,
        location: device.location,
        isActive: device.isActive,
        registrationMode: device.registrationMode,
        pendingRegistrationTagId: device.pendingRegistrationTagId,
        scanMode: device.scanMode,
        lastSeen: device.lastSeen,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
        status: isOnline ? "online" : "offline",
      };
    });

    res.json({
      success: true,
      data: { devices: formattedDevices },
    });
  } catch (error) {
    logger.error(`Error retrieving all devices: ${error.message}`, { error });
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
    logger.error(`Error checking registration mode: ${error.message}`, {
      error,
    });
    res.status(500).json({
      success: false,
      message: "Error checking registration mode",
      error: error.message,
    });
  }
};

/**
 * Enable registration mode for a device
 * This is used by the frontend to put a device in registration mode
 * for a specific tag ID or for any new tag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const enableRegistrationMode = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { tagId } = req.body;

    const device = await Device.findOne({ where: { deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Update device fields
    device.registrationMode = true;
    device.pendingRegistrationTagId = tagId || "";
    device.scanMode = !tagId; // If no tagId provided, we're in scan mode for any new tag

    device.lastSeen = new Date();
    await device.save();

    logger.info(`Device ${deviceId} set to registration mode`, {
      tagId: tagId || "new",
      scanMode: !tagId,
    });

    return res.status(200).json({
      success: true,
      message: `Registration mode enabled for device ${deviceId}`,
      data: { device },
    });
  } catch (error) {
    logger.error(`Error enabling registration mode: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Error enabling registration mode",
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
    // Handle both numeric ID and string deviceId
    const paramId = req.params.id || req.params.deviceId;
    const {
      registrationMode,
      pendingRegistrationTagId,
      scanMode,
      enabled,
      tagId,
      isActive,
    } = req.body;

    // Find device by numeric ID or deviceId string
    let device;
    if (req.params.id && !isNaN(parseInt(req.params.id))) {
      // If numeric ID is provided
      device = await Device.findByPk(parseInt(req.params.id));
    } else {
      // Otherwise try to find by deviceId string
      device = await Device.findOne({ where: { deviceId: paramId } });
    }

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Update device fields
    if (registrationMode !== undefined) {
      device.registrationMode = registrationMode;
    }

    // Handle alternative parameter names from frontend
    if (enabled !== undefined) {
      device.registrationMode = enabled;
    }

    if (pendingRegistrationTagId !== undefined) {
      device.pendingRegistrationTagId = pendingRegistrationTagId;
    }

    if (tagId !== undefined) {
      device.pendingRegistrationTagId = tagId;
    }

    if (scanMode !== undefined) {
      device.scanMode = scanMode;
    }

    if (isActive !== undefined) {
      device.isActive = isActive;
    }

    device.lastSeen = new Date();
    await device.save();

    // Log the status change
    logger.info(`Device ${deviceId} status updated:`, {
      registrationMode: device.registrationMode,
      pendingRegistrationTagId: device.pendingRegistrationTagId,
      scanMode: device.scanMode,
      isActive: device.isActive,
    });

    res.json({
      success: true,
      message: "Device status updated",
      data: { device },
    });
  } catch (error) {
    logger.error(`Error updating device status: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Error updating device status",
      error: error.message,
    });
  }
};

/**
 * Update device heartbeat - record that device is online
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDeviceHeartbeat = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Find device by deviceId
    let device = await Device.findOne({ where: { deviceId } });

    // If device not found, it might be unauthenticated or unregistered
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Update lastSeen timestamp
    device.lastSeen = new Date();
    await device.save();

    // Return current device status
    return res.status(200).json({
      success: true,
      message: "Heartbeat recorded",
      data: {
        deviceId: device.deviceId,
        isActive: device.isActive,
        registrationMode: device.registrationMode,
        pendingRegistrationTagId: device.pendingRegistrationTagId,
        scanMode: device.scanMode,
      },
    });
  } catch (error) {
    logger.error(`Error updating device heartbeat: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Error updating device heartbeat",
      error: error.message,
    });
  }
};

/**
 * Delete a device and its associated API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the device
    const device = await Device.findByPk(id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Get the device's API key
    const apiKey = await ApiKey.findOne({
      where: { deviceId: device.deviceId },
    });

    // First delete the API key if it exists
    if (apiKey) {
      await apiKey.destroy();
      logger.info(`API key for device ${device.deviceId} deleted`);
    }

    // Then delete the device
    await device.destroy();
    logger.info(`Device ${id} (${device.name}) deleted`);

    return res.status(200).json({
      success: true,
      message: "Device deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting device: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Error deleting device",
      error: error.message,
    });
  }
};
