import { User, Rfid, RfidScan } from "../models/index.js";
import logger from "../config/logger.js";
import { Op, Sequelize } from "sequelize";
import { sequelize } from "../config/database.js";

import { Rfid, RfidScan } from "../models/index.js";
import { User } from "../models/User.js";
import logger from "../config/logger.js";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * Get unregistered RFID cards from scan logs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUnregisteredCards = async (req, res) => {
  try {
    // Find unregistered card scans
    const unregisteredScans = await RfidScan.findAll({
      where: {
        status: "failed",
        metadata: {
          reason: "Tag not registered",
        },
      },
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("rfidTagId")), "tagId"],
        [sequelize.fn("MAX", sequelize.col("scanTime")), "lastSeen"],
        [sequelize.fn("COUNT", sequelize.col("id")), "scanCount"],
      ],
      group: ["rfidTagId"],
      raw: true,
      order: [[sequelize.fn("MAX", sequelize.col("scanTime")), "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: unregisteredScans.length,
      data: unregisteredScans,
    });
  } catch (error) {
    logger.error(`Error getting unregistered cards: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get all RFID cards (registered and unregistered)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllRfidCards = async (req, res) => {
  try {
    // Get registered cards
    const registeredCards = await Rfid.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role", "isActive"],
        },
      ],
    });

    // Find unregistered card scans
    const unregisteredScans = await RfidScan.findAll({
      where: {
        status: "failed",
        metadata: {
          reason: "Tag not registered",
        },
      },
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("rfidTagId")), "tagId"],
        [sequelize.fn("MAX", sequelize.col("scanTime")), "lastSeen"],
        [sequelize.fn("COUNT", sequelize.col("id")), "scanCount"],
      ],
      group: ["rfidTagId"],
      raw: true,
    });

    // Format unregistered cards to match the registered cards format
    const formattedUnregistered = unregisteredScans.map((scan) => ({
      tagId: scan.tagId,
      isRegistered: false,
      lastSeen: scan.lastSeen,
      scanCount: scan.scanCount,
      user: null,
      isActive: false,
    }));

    // Format registered cards
    const formattedRegistered = registeredCards.map((card) => ({
      ...card.toJSON(),
      isRegistered: true,
    }));

    // Combine both lists
    const allCards = [...formattedRegistered, ...formattedUnregistered];

    return res.status(200).json({
      success: true,
      count: allCards.length,
      data: allCards,
    });
  } catch (error) {
    logger.error(`Error getting all RFID cards: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
