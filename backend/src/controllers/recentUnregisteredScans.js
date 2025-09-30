import { RfidScan, Rfid } from "../models/index.js";
import logger from "../config/logger.js";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * Get recent unregistered RFID scans
 * This is used for the front-end to detect new cards during registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRecentUnregisteredScans = async (req, res) => {
  try {
    // Look for scans in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    // Get recent scans that aren't registered
    const recentScans = await RfidScan.findAll({
      where: {
        scanTime: {
          [Op.gte]: oneMinuteAgo,
        },
        status: "failed",
      },
      order: [["scanTime", "DESC"]],
      limit: 20, // Get more results since we'll filter further
    });

    // Filter out scans of tags that are now registered
    // (in case they were registered between the scan and this check)
    const registeredTagIds = await Rfid.findAll({
      attributes: ["tagId"],
    }).then((rfids) => rfids.map((rfid) => rfid.tagId));

    // First filter by metadata reason if available
    let filteredScans = recentScans.filter((scan) => {
      try {
        // Check if scan has metadata and the reason is "Tag not registered"
        return (
          scan.metadata &&
          scan.metadata.reason &&
          scan.metadata.reason === "Tag not registered"
        );
      } catch (err) {
        // If there's an error parsing metadata, exclude this scan
        return false;
      }
    });

    // Then filter out already registered tags
    const unregisteredScans = filteredScans.filter(
      (scan) => !registeredTagIds.includes(scan.rfidTagId)
    );

    return res.status(200).json({
      success: true,
      data: unregisteredScans.map((scan) => ({
        id: scan.id,
        tagId: scan.rfidTagId,
        location: scan.location,
        deviceId: scan.deviceId,
        scanTime: scan.scanTime,
      })),
    });
  } catch (error) {
    logger.error(
      `Error retrieving recent unregistered scans: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Error retrieving recent unregistered scans",
      error: error.message,
    });
  }
};
