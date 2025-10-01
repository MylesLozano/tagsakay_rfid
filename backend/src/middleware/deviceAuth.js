import crypto from "crypto";
import { ApiKey, Device } from "../models/index.js";
import logger from "../config/logger.js";

/**
 * Middleware to authenticate API key for hardware devices like ESP32 RFID readers
 * Uses a simpler authentication mechanism compared to JWT to reduce overhead
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKeyHeader = req.headers["x-api-key"];

    if (!apiKeyHeader) {
      logger.warn("API key authentication failed: No API key provided");
      return res.status(401).json({
        success: false,
        message: "API key is required",
      });
    }

    // Split the API key into prefix and key
    const [prefix, key] = apiKeyHeader.split("_");

    if (!prefix || !key) {
      logger.warn("API key authentication failed: Invalid API key format");
      return res.status(401).json({
        success: false,
        message: "Invalid API key format",
      });
    }

    // Hash the provided key for comparison
    const hashedKey = crypto.createHash("sha256").update(key).digest("hex");

    // Find the API key in the database
    const apiKey = await ApiKey.findOne({
      where: {
        prefix: prefix,
        key: hashedKey,
        isActive: true,
      },
    });

    if (!apiKey) {
      logger.warn(`API key authentication failed: Invalid or inactive API key`);
      return res.status(403).json({
        success: false,
        message: "Invalid or inactive API key",
      });
    }

    // Check if the API key has the required permission
    // Fix for /api/rfid/scan endpoint
    const requiredPermission =
      req.originalUrl.includes("/rfid/scan") ||
      req.originalUrl.includes("/scan")
        ? "scan"
        : "manage";

    // Debug the URL and required permission
    logger.info(
      `Request URL: ${req.originalUrl}, Required permission: ${requiredPermission}`
    );

    // Fix potentially corrupted permissions
    let perms = [];

    try {
      if (typeof apiKey.permissions === "string") {
        // If it's a string, try to parse it as JSON first
        try {
          const parsed = JSON.parse(apiKey.permissions);
          if (Array.isArray(parsed)) {
            perms = parsed;
          } else {
            perms = [apiKey.permissions];
          }
        } catch (e) {
          // If parsing fails, use the string as a permission
          perms = [apiKey.permissions];
        }
      } else if (Array.isArray(apiKey.permissions)) {
        // Handle nested JSON strings - common when permissions are double serialized
        if (
          apiKey.permissions.length === 1 &&
          typeof apiKey.permissions[0] === "string"
        ) {
          try {
            const innerContent = JSON.parse(apiKey.permissions[0]);
            if (Array.isArray(innerContent)) {
              perms = innerContent;
            } else {
              perms = apiKey.permissions;
            }
          } catch (e) {
            // Keep as is if can't parse
            perms = apiKey.permissions;
          }
        } else if (
          apiKey.permissions.length > 2 &&
          apiKey.permissions.every(
            (p) => typeof p === "string" && p.length === 1
          ) &&
          (apiKey.permissions.join("") === "scan" ||
            apiKey.permissions.join("") === "manage")
        ) {
          // Handle character array case ['s','c','a','n']
          perms = [apiKey.permissions.join("")];
        } else {
          perms = apiKey.permissions;
        }
      }
    } catch (err) {
      logger.error(
        `Error processing permissions for API key ${apiKey.id}:`,
        err
      );
      // Default to the original permissions
      perms = Array.isArray(apiKey.permissions) ? apiKey.permissions : [];
    }

    // If permissions array is empty or undefined, and this is a device API key,
    // default to scan permission for backward compatibility
    if (perms.length === 0 && apiKey.type === "device") {
      perms = ["scan"];
      logger.info(
        `Using default scan permission for device API key ${apiKey.id}`
      );
    }

    // If this is a device type API key, ensure it has scan permission
    if (apiKey.type === "device" && !perms.includes("scan")) {
      perms.push("scan");
      logger.info(
        `Added missing scan permission to device API key ${apiKey.id}`
      );
    }

    // Save any fixed permissions back to database
    if (JSON.stringify(perms) !== JSON.stringify(apiKey.permissions)) {
      apiKey.permissions = perms;
      await apiKey.save();
      logger.info(
        `Updated permissions for API key ${apiKey.id}: ${JSON.stringify(perms)}`
      );
    }

    // Debug logging to understand permission issues
    logger.info(`Required permission: ${requiredPermission}`);
    logger.info(`API key permissions: ${JSON.stringify(perms)}`);
    logger.info(
      `Permission check result: ${perms.includes(requiredPermission)}`
    );

    if (!perms.includes(requiredPermission)) {
      logger.warn(
        `API key authentication failed: Insufficient permissions for ${requiredPermission}. API key has: ${JSON.stringify(
          perms
        )}`
      );
      return res.status(403).json({
        success: false,
        message: `API key does not have ${requiredPermission} permission`,
      });
    }

    // Update last used timestamp
    apiKey.lastUsed = new Date();
    await apiKey.save();

    // Add device info to request object
    req.device = {
      id: apiKey.deviceId,
      name: apiKey.name,
      apiKeyId: apiKey.id,
    };

    // Log the successful authentication
    logger.info(
      `API key authentication successful for device: ${req.device.name}`
    );

    next();
  } catch (error) {
    logger.error(`API key authentication error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

/**
 * Rate limiting middleware specifically for RFID endpoints
 * Uses a more lenient rate limit compared to web endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const rfidRateLimit = (req, res, next) => {
  // Implement a simple in-memory rate limiting for RFID requests
  // This would be replaced with Redis or another solution in production
  const deviceId = req.device?.id || req.ip;
  const now = Date.now();

  // Initialize global request store if not exists
  global.rfidRequests = global.rfidRequests || {};

  // Initialize device request counter if not exists
  global.rfidRequests[deviceId] = global.rfidRequests[deviceId] || {
    count: 0,
    resetTime: now + 60000, // 1 minute window
  };

  // Check if window has expired and reset if needed
  if (now > global.rfidRequests[deviceId].resetTime) {
    global.rfidRequests[deviceId] = {
      count: 0,
      resetTime: now + 60000, // 1 minute window
    };
  }

  // Check if rate limit exceeded (300 requests per minute)
  if (global.rfidRequests[deviceId].count >= 300) {
    logger.warn(`Rate limit exceeded for device ID: ${deviceId}`);
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  // Increment request counter
  global.rfidRequests[deviceId].count++;

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", 300);
  res.setHeader(
    "X-RateLimit-Remaining",
    300 - global.rfidRequests[deviceId].count
  );
  res.setHeader(
    "X-RateLimit-Reset",
    Math.ceil(global.rfidRequests[deviceId].resetTime / 1000)
  );

  next();
};

/**
 * Middleware to authenticate device using API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateDevice = async (req, res, next) => {
  try {
    const apiKey = req.header("X-API-Key");

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: No API key provided",
      });
    }

    // Try to find by API key first
    const device = await Device.findOne({ where: { apiKey } });

    if (device) {
      // Found device by API key
      req.device = device;
      next();
      return;
    }

    // If no device found by API key, try to find an API key entry
    const [prefix, key] = apiKey.split("_");
    if (prefix && key) {
      const hashedKey = crypto.createHash("sha256").update(key).digest("hex");
      const apiKeyEntry = await ApiKey.findOne({
        where: {
          prefix: prefix,
          key: hashedKey,
          isActive: true,
        },
      });

      if (apiKeyEntry) {
        // If we found an API key entry, check if it has macAddress in metadata
        const macAddress = apiKeyEntry.metadata?.macAddress;

        if (macAddress) {
          // Try to find a device with this MAC address
          const deviceByMac = await Device.findOne({
            where: {
              macAddress: macAddress.replace(/:/g, "").toUpperCase(),
            },
          });

          if (deviceByMac) {
            req.device = deviceByMac;
            next();
            return;
          }
        }

        // No device found but valid API key - create minimal device object
        req.device = {
          id: apiKeyEntry.deviceId,
          name: apiKeyEntry.name,
          apiKeyId: apiKeyEntry.id,
        };
        next();
        return;
      }
    }

    // No device or API key found
    return res.status(401).json({
      success: false,
      message: "Authentication failed: Invalid API key",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
};
