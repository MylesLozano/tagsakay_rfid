/**
 * API Endpoint Test Script for TagSakay RFID system
 * Use this script to test API endpoints from the command line
 */

import axios from "axios";
import { API_CONFIG } from "../src/config/env.js";
import logger from "../src/config/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default API URL
const DEFAULT_API_URL = "http://localhost:3000/api";

/**
 * Available test endpoints
 */
const ENDPOINTS = {
  // Auth endpoints
  login: {
    method: "POST",
    path: "/auth/login",
    data: {
      email: "admin@example.com",
      password: "admin123",
    },
    description: "Login with admin credentials",
  },
  register: {
    method: "POST",
    path: "/auth/register",
    data: {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    },
    description: "Register a new user",
  },

  // User endpoints
  getUsers: {
    method: "GET",
    path: "/users",
    requiresAuth: true,
    description: "Get all users (requires authentication)",
  },

  // RFID endpoints
  getRfids: {
    method: "GET",
    path: "/rfids",
    requiresAuth: true,
    description: "Get all RFID tags (requires authentication)",
  },
  scanRfid: {
    method: "POST",
    path: "/rfid/scan",
    data: {
      tagId: "04A5B6C7",
      deviceId: "001122334455",
      macAddress: "00:11:22:33:44:55",
    },
    description: "Simulate an RFID tag scan",
  },

  // Device endpoints
  getDevices: {
    method: "GET",
    path: "/devices",
    requiresAuth: true,
    description: "Get all devices (requires authentication)",
  },
  deviceHeartbeat: {
    method: "POST",
    path: "/devices/001122334455/heartbeat",
    data: {
      macAddress: "00:11:22:33:44:55",
      statusData: {
        freeMemory: 43256,
        uptime: 3600,
        scanCount: 15,
      },
    },
    description: "Send a device heartbeat",
  },
};

/**
 * Send a request to the API
 */
async function sendRequest(endpoint, token = null, customData = null) {
  try {
    const apiUrl = API_CONFIG.URL;
    const url = `${apiUrl}${endpoint.path}`;

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
    };

    // Add token if required and available
    if (endpoint.requiresAuth && token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else if (endpoint.requiresAuth && !token) {
      logger.error(
        "This endpoint requires authentication but no token was provided"
      );
      logger.info("Try running the login endpoint first to get a token");
      return null;
    }

    // Prepare request options
    const options = {
      method: endpoint.method,
      headers: headers,
    };

    // Add body for non-GET requests
    if (endpoint.method !== "GET" && (endpoint.data || customData)) {
      options.body = JSON.stringify(customData || endpoint.data);
    }

    // Send request
    logger.info(`Sending ${endpoint.method} request to ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();

    return {
      status: response.status,
      data: data,
    };
  } catch (error) {
    logger.error(`Request failed: ${error.message}`);
    return {
      status: "error",
      error: error.message,
    };
  }
}

/**
 * Save token to file
 */
function saveToken(token) {
  const tokenFile = path.join(__dirname, ".token");
  fs.writeFileSync(tokenFile, token);
  logger.info("Token saved to .token file");
}

/**
 * Load token from file
 */
function loadToken() {
  const tokenFile = path.join(__dirname, ".token");
  if (fs.existsSync(tokenFile)) {
    return fs.readFileSync(tokenFile, "utf8");
  }
  return null;
}

/**
 * Display help information
 */
function showHelp() {
  console.log("\nTagSakay API Endpoint Test Tool\n");
  console.log(
    "Usage: node scripts/test-endpoint.js [endpoint] [customDataJson]\n"
  );
  console.log("Available endpoints:\n");

  Object.keys(ENDPOINTS).forEach((key) => {
    const endpoint = ENDPOINTS[key];
    console.log(`  ${key} - ${endpoint.description}`);
    console.log(`    ${endpoint.method} ${endpoint.path}`);
    if (endpoint.data) {
      console.log(`    Default data: ${JSON.stringify(endpoint.data)}`);
    }
    console.log("");
  });

  console.log("Examples:");
  console.log("  node scripts/test-endpoint.js login");
  console.log(
    '  node scripts/test-endpoint.js scanRfid \'{"tagId":"ABCDEF12","deviceId":"001122334455"}\''
  );
}

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const endpointName = args[0];
    const customDataStr = args[1];

    // Show help if no endpoint specified or help requested
    if (!endpointName || endpointName === "help") {
      showHelp();
      return;
    }

    // Check if endpoint exists
    if (!ENDPOINTS[endpointName]) {
      logger.error(`Unknown endpoint: ${endpointName}`);
      showHelp();
      return;
    }

    // Parse custom data if provided
    let customData = null;
    if (customDataStr) {
      try {
        customData = JSON.parse(customDataStr);
      } catch (error) {
        logger.error(`Invalid JSON data: ${error.message}`);
        return;
      }
    }

    // Get endpoint details
    const endpoint = ENDPOINTS[endpointName];

    // Load token if needed
    const token = endpoint.requiresAuth ? loadToken() : null;

    // Send request
    const result = await sendRequest(endpoint, token, customData);

    // Display result
    console.log("\nResponse:");
    console.log(JSON.stringify(result, null, 2));

    // Save token if login was successful
    if (endpointName === "login" && result?.data?.token) {
      saveToken(result.data.token);
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
  }
}

// Execute main function
main();
