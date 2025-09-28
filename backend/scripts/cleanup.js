/**
 * TagSakay Legacy Script Cleanup Tool
 *
 * This script helps with cleaning up legacy scripts that have been consolidated
 * into the scripts/ directory. It creates backups of old scripts before removing them.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../src/config/logger.js";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// List of legacy scripts that are now consolidated
const legacyScripts = [
  "init-db.js",
  "init-db-schema.js",
  "run-seeders.js",
  "terminate-connections.js",
  "reset-db.js",
  "reset-db.cjs",
  "migrate.js",
  "test-endpoint.js",
];

// Create backups directory if it doesn't exist
const backupDir = path.join(rootDir, "scripts", "legacy-backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  logger.info(`Created backup directory: ${backupDir}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  // Show available legacy scripts
  if (!command || command === "list") {
    console.log("\nLegacy scripts that can be backed up and removed:\n");

    legacyScripts.forEach((script) => {
      const scriptPath = path.join(rootDir, script);
      if (fs.existsSync(scriptPath)) {
        const stats = fs.statSync(scriptPath);
        console.log(`  ✓ ${script} (${formatBytes(stats.size)})`);
      } else {
        console.log(`  ✗ ${script} (not found)`);
      }
    });

    console.log("\nCommands:");
    console.log(
      "  node scripts/cleanup.js backup - Create backups of all legacy scripts"
    );
    console.log(
      "  node scripts/cleanup.js remove - Delete all legacy scripts (after backup)"
    );

    return;
  }

  // Backup legacy scripts
  if (command === "backup") {
    console.log("\nBacking up legacy scripts...\n");

    for (const script of legacyScripts) {
      const scriptPath = path.join(rootDir, script);

      if (fs.existsSync(scriptPath)) {
        const backupPath = path.join(backupDir, script);
        fs.copyFileSync(scriptPath, backupPath);
        logger.info(
          `✓ Backed up ${script} to ${path.relative(rootDir, backupPath)}`
        );
      } else {
        logger.warn(`✗ Script ${script} not found, skipping backup`);
      }
    }

    console.log(
      "\nBackup completed! Scripts are saved in scripts/legacy-backups/"
    );
    return;
  }

  // Remove legacy scripts
  if (command === "remove") {
    console.log("\nRemoving legacy scripts...\n");

    // First check if backups exist
    let backupsExist = true;
    for (const script of legacyScripts) {
      const scriptPath = path.join(rootDir, script);
      if (fs.existsSync(scriptPath)) {
        const backupPath = path.join(backupDir, script);
        if (!fs.existsSync(backupPath)) {
          backupsExist = false;
          break;
        }
      }
    }

    if (!backupsExist) {
      console.log("⚠️  Warning: Not all scripts have been backed up.");
      console.log(
        'Run "node scripts/cleanup.js backup" first to create backups.'
      );
      return;
    }

    // Remove the scripts
    for (const script of legacyScripts) {
      const scriptPath = path.join(rootDir, script);

      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
        logger.info(`✓ Removed ${script}`);
      } else {
        logger.debug(`✗ Script ${script} not found, skipping removal`);
      }
    }

    console.log("\nRemoval completed! All legacy scripts have been removed.");
    return;
  }

  // Unknown command
  console.log(`\nUnknown command: ${command}`);
  console.log(
    'Run "node scripts/cleanup.js" without arguments to see available commands'
  );
}

/**
 * Format file size in bytes to a more readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Execute main function
main();
