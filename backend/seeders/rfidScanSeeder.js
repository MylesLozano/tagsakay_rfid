import RfidScan from "../src/models/RfidScan.js";
import logger from "../src/config/logger.js";

/**
 * Seeds RFID scan events into the database
 * @param {Array} rfidTags Array of RFID tag objects
 * @param {Object} options Configuration options
 * @param {boolean} options.resetData Whether to delete existing scan records before seeding
 * @param {number} options.scanCount Number of scans to generate per tag
 * @returns {Promise<Array>} Array of created scan records
 */
export const seedRfidScans = async (
  rfidTags,
  options = { resetData: false, scanCount: 5 }
) => {
  try {
    // Clear existing scan records if resetData is true
    if (options.resetData) {
      logger.info("Deleting existing RFID scan records...");
      await RfidScan.destroy({ where: {}, force: true });
    }

    // Check if any scan records already exist
    const scanCount = await RfidScan.count();
    if (scanCount > 0 && !options.resetData) {
      logger.info(
        `Found ${scanCount} existing scan records, skipping scan seeding`
      );
      return await RfidScan.findAll();
    }

    const createdScans = [];
    const deviceIds = ["TERMINAL-01", "TERMINAL-02", "MOBILE-APP"];
    const eventTypes = ["entry", "exit", "unknown"];
    const statuses = ["success", "failed", "unauthorized"];
    const locations = [
      "Main Terminal",
      "North Gate",
      "South Gate",
      "East Terminal",
    ];
    const vehicleIds = ["TRI-001", "TRI-002", "TRI-003", null];

    // Only create scans for tags associated with a user
    const tagsWithUsers = rfidTags.filter((tag) => tag.userId);

    for (const tag of tagsWithUsers) {
      // Generate multiple scan events per tag, with timestamps going back in time
      const now = new Date();

      for (let i = 0; i < options.scanCount; i++) {
        // Create timestamp going back progressively (oldest first)
        const scanTime = new Date(
          now.getTime() - (options.scanCount - i) * 24 * 60 * 60 * 1000
        );

        // Pick random scan properties
        const deviceId =
          deviceIds[Math.floor(Math.random() * deviceIds.length)];
        const eventType =
          eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const location =
          locations[Math.floor(Math.random() * locations.length)];
        const vehicleId =
          vehicleIds[Math.floor(Math.random() * vehicleIds.length)];

        // Generate metadata based on event type
        let metadata = {};

        if (eventType === "entry") {
          metadata = {
            queuePosition: Math.floor(Math.random() * 10) + 1,
            terminal: location,
            fareAmount: Math.floor(Math.random() * 50) + 10,
          };
        } else if (eventType === "exit") {
          metadata = {
            terminal: location,
            tripDuration: Math.floor(Math.random() * 60) + 5, // minutes
          };
        } else {
          metadata = {
            note: "Routine scan",
            scannedBy: "System",
          };
        }

        const scan = await RfidScan.create({
          rfidTagId: tag.tagId,
          userId: tag.userId,
          deviceId,
          eventType,
          location,
          vehicleId,
          scanTime,
          status,
          metadata,
        });

        createdScans.push(scan);
      }
    }

    return createdScans;
  } catch (error) {
    logger.error("Error seeding RFID scans:", error);
    throw error;
  }
};
