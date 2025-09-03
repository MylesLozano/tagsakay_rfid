import crypto from "crypto";
import { ApiKey } from "../models/index.js";
import logger from "../config/logger.js";

/**
 * Generate a new API key for a device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createApiKey = async (req, res) => {
  try {
    const { name, deviceId, description, permissions } = req.body;

    if (!name || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Name and deviceId are required",
      });
    }

    // Generate a secure random API key
    const apiKey = crypto.randomBytes(32).toString("hex");

    // Generate a key prefix for easier identification
    const prefix = crypto.randomBytes(3).toString("hex");

    // Create a hashed version of the API key for storage
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    // Create new API key record
    const newApiKey = await ApiKey.create({
      name,
      deviceId,
      description: description || "",
      key: hashedKey,
      prefix,
      permissions: permissions || ["scan"],
      createdBy: req.user.id,
      lastUsed: null,
    });

    // Only return the full API key once during creation
    // After this, only the hashed version is stored in the database
    return res.status(201).json({
      success: true,
      message: "API key created successfully",
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        deviceId: newApiKey.deviceId,
        prefix: newApiKey.prefix,
        apiKey: `${prefix}_${apiKey}`, // This full key will only be shown once
        permissions: newApiKey.permissions,
        createdAt: newApiKey.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error creating API key: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to create API key",
      error: error.message,
    });
  }
};

/**
 * List all API keys (returns only prefixes, not full keys)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKey.findAll({
      attributes: [
        "id",
        "name",
        "deviceId",
        "prefix",
        "permissions",
        "createdAt",
        "lastUsed",
        "isActive",
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: apiKeys.length,
      data: apiKeys,
    });
  } catch (error) {
    logger.error(`Error listing API keys: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to list API keys",
      error: error.message,
    });
  }
};

/**
 * Update an API key (name, description, permissions, active status)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isActive } = req.body;

    const apiKey = await ApiKey.findByPk(id);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    // Update fields if provided
    if (name !== undefined) apiKey.name = name;
    if (description !== undefined) apiKey.description = description;
    if (permissions !== undefined) apiKey.permissions = permissions;
    if (isActive !== undefined) apiKey.isActive = isActive;

    await apiKey.save();

    return res.status(200).json({
      success: true,
      message: "API key updated successfully",
      data: {
        id: apiKey.id,
        name: apiKey.name,
        deviceId: apiKey.deviceId,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        updatedAt: apiKey.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error updating API key: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to update API key",
      error: error.message,
    });
  }
};

/**
 * Revoke (delete) an API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findByPk(id);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    await apiKey.destroy();

    return res.status(200).json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    logger.error(`Error revoking API key: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to revoke API key",
      error: error.message,
    });
  }
};
