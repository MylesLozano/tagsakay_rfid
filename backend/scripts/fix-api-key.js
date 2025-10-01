// Script to fix corrupted API key permissions
import { ApiKey } from "../src/models/index.js";
import logger from "../src/config/logger.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fixApiKey() {
  try {
    // Find the specific API key with the given prefix
    const prefix = "87d1be"; // The prefix from your error message

    console.log(`Looking for API key with prefix: ${prefix}`);

    const apiKey = await ApiKey.findOne({
      where: {
        prefix: prefix,
      },
    });

    if (!apiKey) {
      console.log(`No API key found with prefix ${prefix}`);
      return;
    }

    console.log("Found API key:");
    console.log(`ID: ${apiKey.id}`);
    console.log(`Name: ${apiKey.name}`);
    console.log(`Type: ${apiKey.type}`);
    console.log(`Current permissions: ${JSON.stringify(apiKey.permissions)}`);

    // Fix the permissions
    let fixedPermissions;

    // Handle various corrupted formats
    if (typeof apiKey.permissions === "string") {
      try {
        // Try to parse if it's a stringified JSON
        const parsed = JSON.parse(apiKey.permissions);
        fixedPermissions = Array.isArray(parsed) ? parsed : ["scan"];
      } catch (e) {
        // If parsing fails, use the string as a permission
        fixedPermissions = [apiKey.permissions];
      }
    } else if (Array.isArray(apiKey.permissions)) {
      if (
        apiKey.permissions.length === 1 &&
        typeof apiKey.permissions[0] === "string"
      ) {
        // Handle case of ["[\"scan\"]"]
        try {
          const innerContent = JSON.parse(apiKey.permissions[0]);
          fixedPermissions = Array.isArray(innerContent)
            ? innerContent
            : ["scan"];
        } catch (e) {
          // Keep as is if can't parse
          fixedPermissions = apiKey.permissions;
        }
      } else if (apiKey.permissions.every((p) => p.length === 1)) {
        // Handle case of ['s','c','a','n']
        fixedPermissions = [apiKey.permissions.join("")];
      } else {
        fixedPermissions = apiKey.permissions;
      }
    } else {
      // Default to scan permission
      fixedPermissions = ["scan"];
    }

    console.log(`Fixed permissions: ${JSON.stringify(fixedPermissions)}`);

    // Update the API key
    apiKey.permissions = fixedPermissions;
    await apiKey.save();

    console.log("API key permissions updated successfully!");
  } catch (error) {
    console.error("Error fixing API key:", error);
  } finally {
    process.exit(0);
  }
}

fixApiKey();
