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
    const {
      name,
      deviceId,
      macAddress,
      description,
      permissions,
      metadata,
      type,
    } = req.body;

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

    // Prepare metadata with MAC address if provided
    const metadataWithMAC = {
      ...(metadata || {}),
      ...(macAddress ? { macAddress } : {}),
    };

    // Ensure permissions are properly formatted (not individual characters)
    let formattedPermissions = [];

    if (permissions) {
      // If permissions were provided, ensure they're proper strings
      if (Array.isArray(permissions)) {
        // Check if it's a character array that needs to be joined
        if (
          permissions.length > 2 &&
          permissions.every((p) => p.length === 1)
        ) {
          // It's probably a character array, join it
          formattedPermissions = [permissions.join("")];
        } else {
          // It's a normal array of permission strings
          formattedPermissions = permissions;
        }
      } else if (typeof permissions === "string") {
        // If it's a single string, wrap in array
        formattedPermissions = [permissions];
      }
    } else {
      // Default permissions
      formattedPermissions = ["scan"];
    }

    // Create new API key record
    const newApiKey = await ApiKey.create({
      name,
      deviceId,
      description: description || "",
      key: hashedKey,
      prefix,
      permissions: formattedPermissions,
      createdBy: req.user.id,
      lastUsed: null,
      metadata: metadataWithMAC,
      type: type || "device",
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
        metadata: newApiKey.metadata,
        macAddress: macAddress || null, // Include MAC address in response
        type: newApiKey.type,
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
        "metadata",
        "type",
      ],
      order: [["createdAt", "DESC"]],
    });

    // Map the results to include macAddress from metadata
    const formattedApiKeys = apiKeys.map((key) => {
      const plainKey = key.get({ plain: true });
      return {
        ...plainKey,
        macAddress: plainKey.metadata?.macAddress || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedApiKeys.length,
      data: formattedApiKeys,
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
    const { name, description, permissions, isActive, metadata } = req.body;

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
    if (metadata !== undefined) {
      // Merge metadata rather than replacing completely
      apiKey.metadata = { ...apiKey.metadata, ...metadata };
    }

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
        metadata: apiKey.metadata,
        type: apiKey.type,
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
