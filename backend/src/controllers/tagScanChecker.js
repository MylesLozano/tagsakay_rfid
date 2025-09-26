import { RfidScan } from "../models/index.js";
import logger from "../config/logger.js";
import { Op } from "sequelize";

// This function will check if there's a recent scan of a specific tag
// Used for the two-step registration process
export const checkRecentTagScan = async (req, res) => {
  try {
    const { tagId } = req.params;

    if (!tagId) {
      return res.status(400).json({
        success: false,
        message: "Tag ID is required",
      });
    }

    // Look for scans in the last 30 seconds
    const thirtySecondsAgo = new Date();
    thirtySecondsAgo.setSeconds(thirtySecondsAgo.getSeconds() - 30);

    const recentScan = await RfidScan.findOne({
      where: {
        rfidTagId: tagId,
        scanTime: {
          [Op.gte]: thirtySecondsAgo,
        },
      },
      order: [["scanTime", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      found: !!recentScan,
      data: recentScan,
    });
  } catch (error) {
    logger.error(`Error checking for recent tag scan: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
