import { User, Rfid, RfidScan } from "../models/index.js";
import logger from "../config/logger.js";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import moment from "moment";

/**
 * Handle RFID scan from ESP32 device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const scanRfid = async (req, res) => {
  try {
    const { tagId, location, vehicleId } = req.body;

    if (!tagId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: tagId is required",
      });
    }

    // Log the scan attempt
    logger.info(`RFID scan attempt: ${tagId} from device ${req.device.id}`);

    // Check if RFID exists and is active
    const rfidTag = await Rfid.findOne({
      where: { tagId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role", "isActive"],
        },
      ],
    });

    if (!rfidTag) {
      logger.warn(`Unregistered RFID: ${tagId}`);

      // Record failed scan attempt
      await RfidScan.create({
        rfidTagId: tagId,
        deviceId: req.device.id,
        location: location || null,
        vehicleId: vehicleId || null,
        status: "failed",
        eventType: "unknown",
        metadata: { reason: "Tag not registered" },
      });

      return res.status(404).json({
        success: false,
        message: "RFID tag not registered",
      });
    }

    // Check if RFID is active
    if (!rfidTag.isActive) {
      logger.warn(
        `Inactive RFID: ${tagId} for user ${rfidTag.user?.name || "unknown"}`
      );

      // Record unauthorized scan attempt
      await RfidScan.create({
        rfidTagId: tagId,
        deviceId: req.device.id,
        userId: rfidTag.userId,
        location: location || null,
        vehicleId: vehicleId || null,
        status: "unauthorized",
        eventType: "unknown",
        metadata: { reason: "Inactive tag" },
      });

      return res.status(403).json({
        success: false,
        message: "RFID tag is inactive",
      });
    }

    // Check if user account is active (if tag is associated with a user)
    if (rfidTag.userId && rfidTag.user && !rfidTag.user.isActive) {
      logger.warn(
        `RFID scan with inactive account: ${tagId} for user ${rfidTag.user.name}`
      );

      // Record unauthorized scan attempt
      await RfidScan.create({
        rfidTagId: tagId,
        deviceId: req.device.id,
        userId: rfidTag.userId,
        location: location || null,
        vehicleId: vehicleId || null,
        status: "unauthorized",
        eventType: "unknown",
        metadata: { reason: "Inactive user account" },
      });

      return res.status(403).json({
        success: false,
        message: "User account is not active",
      });
    }

    // Update the last scanned timestamp
    rfidTag.lastScanned = new Date();
    rfidTag.deviceId = req.device.id;
    await rfidTag.save();

    // Determine if this is an entry or exit scan based on previous scans
    const eventType = await determineEntryOrExit(rfidTag.userId, location);

    // Record the successful scan
    const scanRecord = await RfidScan.create({
      rfidTagId: tagId,
      deviceId: req.device.id,
      userId: rfidTag.userId,
      location: location || null,
      vehicleId: vehicleId || null,
      eventType,
      status: "success",
      metadata: req.body.metadata || {},
    });

    // Return successful scan data
    return res.status(200).json({
      success: true,
      message: "RFID scan successful",
      data: {
        scanId: scanRecord.id,
        scanTime: scanRecord.scanTime,
        eventType: scanRecord.eventType,
        user: rfidTag.user
          ? {
              id: rfidTag.user.id,
              name: rfidTag.user.name,
              role: rfidTag.user.role,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error(`RFID scan error: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Error processing RFID scan",
      error: error.message,
    });
  }
};

/**
 * Register a new RFID tag for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const registerRfid = async (req, res) => {
  try {
    const { userId, tagId, metadata } = req.body;

    if (!tagId) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: tagId is required",
      });
    }

    // Check if user exists (if userId is provided)
    let user = null;
    if (userId) {
      user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    }

    // Check if RFID is already registered
    const existingTag = await Rfid.findOne({ where: { tagId } });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        message: "RFID tag is already registered",
      });
    }

    // Register the RFID tag
    const newRfidTag = await Rfid.create({
      tagId,
      userId: userId || null,
      registeredBy: req.user.id,
      isActive: true,
      metadata: metadata || {},
    });

    // Log the registration
    logger.info(
      `RFID tag ${tagId} registered ${
        userId ? `for user ${user.name}` : "without user"
      } by admin ${req.user.name} (${req.user.id})`
    );

    return res.status(201).json({
      success: true,
      message: "RFID tag registered successfully",
      data: {
        id: newRfidTag.id,
        tagId: newRfidTag.tagId,
        userId: newRfidTag.userId,
        isActive: newRfidTag.isActive,
        createdAt: newRfidTag.createdAt,
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error(`RFID registration error: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Error registering RFID tag",
      error: error.message,
    });
  }
};

/**
 * Get information about an RFID tag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRfidInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const rfidTag = await Rfid.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: RfidScan,
          as: "scanEvents",
          limit: 10,
          order: [["scanTime", "DESC"]],
        },
      ],
    });

    if (!rfidTag) {
      return res.status(404).json({
        success: false,
        message: "RFID tag not found",
      });
    }

    // Format the response
    const response = {
      id: rfidTag.id,
      tagId: rfidTag.tagId,
      isActive: rfidTag.isActive,
      lastScanned: rfidTag.lastScanned,
      createdAt: rfidTag.createdAt,
      metadata: rfidTag.metadata,
      user: rfidTag.user
        ? {
            id: rfidTag.user.id,
            name: rfidTag.user.name,
            email: rfidTag.user.email,
            role: rfidTag.user.role,
          }
        : null,
      recentScans: rfidTag.scanEvents,
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error(`Error retrieving RFID info: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Error retrieving RFID information",
      error: error.message,
    });
  }
};

/**
 * Update the status of an RFID tag (activate/deactivate)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateRfidStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Missing required field: isActive must be a boolean",
      });
    }

    // Check if RFID exists
    const rfidTag = await Rfid.findByPk(id);

    if (!rfidTag) {
      return res.status(404).json({
        success: false,
        message: "RFID tag not found",
      });
    }

    // Update the status
    rfidTag.isActive = isActive;

    // Update the metadata with reason if provided
    if (reason) {
      rfidTag.metadata = {
        ...rfidTag.metadata,
        statusChangeReason: reason,
        statusChangedBy: req.user.id,
        statusChangedAt: new Date(),
      };
    }

    await rfidTag.save();

    // Log the status change
    const action = isActive ? "activated" : "deactivated";
    const reasonText = reason ? ` Reason: ${reason}` : "";
    logger.info(
      `RFID tag ${rfidTag.tagId} ${action} by admin ${req.user.name} (${req.user.id}).${reasonText}`
    );

    return res.status(200).json({
      success: true,
      message: `RFID tag ${action} successfully`,
      data: {
        id: rfidTag.id,
        tagId: rfidTag.tagId,
        isActive: rfidTag.isActive,
        updatedAt: rfidTag.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`RFID status update error: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Error updating RFID status",
      error: error.message,
    });
  }
};

/**
 * Get weekly RFID scan statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getWeeklyStats = async (req, res) => {
  try {
    // Get the start of the week (7 days ago)
    const startDate = moment().subtract(6, "days").startOf("day").toDate();

    // Query for daily scan counts for the past 7 days
    const stats = await RfidScan.findAll({
      attributes: [
        [sequelize.fn("date_trunc", "day", sequelize.col("scanTime")), "day"],
        [sequelize.fn("count", sequelize.col("id")), "count"],
      ],
      where: {
        scanTime: {
          [Op.gte]: startDate,
        },
        status: "success",
      },
      group: [sequelize.fn("date_trunc", "day", sequelize.col("scanTime"))],
      order: [
        [sequelize.fn("date_trunc", "day", sequelize.col("scanTime")), "ASC"],
      ],
    });

    // Create a map to ensure we have entries for all days, even with zero count
    const daysMap = {};

    // Initialize with all days in the past week
    for (let i = 0; i < 7; i++) {
      const day = moment().subtract(6 - i, "days");
      daysMap[day.format("YYYY-MM-DD")] = {
        label: day.format("dddd"), // Day name
        count: 0,
      };
    }

    // Fill in actual counts
    stats.forEach((stat) => {
      const day = moment(stat.dataValues.day).format("YYYY-MM-DD");
      if (daysMap[day]) {
        daysMap[day].count = parseInt(stat.dataValues.count, 10);
      }
    });

    // Convert map to array
    const result = Object.values(daysMap);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error retrieving weekly RFID stats: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Error retrieving weekly RFID statistics",
      error: error.message,
    });
  }
};

/**
 * Get monthly RFID scan statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMonthlyStats = async (req, res) => {
  try {
    // Get the start of 6 months ago
    const startDate = moment().subtract(5, "months").startOf("month").toDate();

    // Query for monthly scan counts for the past 6 months
    const stats = await RfidScan.findAll({
      attributes: [
        [
          sequelize.fn("date_trunc", "month", sequelize.col("scanTime")),
          "month",
        ],
        [sequelize.fn("count", sequelize.col("id")), "count"],
      ],
      where: {
        scanTime: {
          [Op.gte]: startDate,
        },
        status: "success",
      },
      group: [sequelize.fn("date_trunc", "month", sequelize.col("scanTime"))],
      order: [
        [sequelize.fn("date_trunc", "month", sequelize.col("scanTime")), "ASC"],
      ],
    });

    // Create a map to ensure we have entries for all months, even with zero count
    const monthsMap = {};

    // Initialize with all months in the past 6 months
    for (let i = 0; i < 6; i++) {
      const month = moment().subtract(5 - i, "months");
      monthsMap[month.format("YYYY-MM")] = {
        label: month.format("MMMM"), // Month name
        count: 0,
      };
    }

    // Fill in actual counts
    stats.forEach((stat) => {
      const month = moment(stat.dataValues.month).format("YYYY-MM");
      if (monthsMap[month]) {
        monthsMap[month].count = parseInt(stat.dataValues.count, 10);
      }
    });

    // Convert map to array
    const result = Object.values(monthsMap);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error retrieving monthly RFID stats: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Error retrieving monthly RFID statistics",
      error: error.message,
    });
  }
};

/**
 * Get recent RFID scans
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRecentScans = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent RFID scans with user information
    const recentScans = await RfidScan.findAll({
      limit,
      order: [["scanTime", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: recentScans.length,
      data: recentScans,
    });
  } catch (error) {
    logger.error(`Error retrieving recent RFID scans: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Error retrieving recent RFID scans",
      error: error.message,
    });
  }
};

/**
 * Helper function to determine if a scan is an entry or exit
 * @param {string} userId - User ID
 * @param {string} location - Location name
 * @returns {string} 'entry', 'exit', or 'unknown'
 */
async function determineEntryOrExit(userId, location) {
  try {
    // If no user association, default to unknown
    if (!userId) {
      return "unknown";
    }

    // Get the last scan for this user
    const lastScan = await RfidScan.findOne({
      where: { userId },
      order: [["scanTime", "DESC"]],
    });

    // If no previous scan, default to entry
    if (!lastScan) {
      return "entry";
    }

    // If at the same location, toggle the event type
    if (lastScan.location === location) {
      return lastScan.eventType === "entry" ? "exit" : "entry";
    }

    // Simple logic for entry/exit based on location naming
    // This can be customized based on specific business rules
    if (location) {
      const locationLower = location.toLowerCase();
      if (
        locationLower.includes("entrance") ||
        locationLower.includes("entry")
      ) {
        return "entry";
      } else if (locationLower.includes("exit")) {
        return "exit";
      }
    }

    // Default to alternate between entry and exit
    return lastScan.eventType === "entry" ? "exit" : "entry";
  } catch (error) {
    logger.error(`Error determining entry/exit: ${error.message}`, { error });
    // Default to unknown in case of error
    return "unknown";
  }
}
