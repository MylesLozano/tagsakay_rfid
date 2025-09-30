import Rfid from "../src/models/Rfid.js";
import logger from "../src/config/logger.js";

/**
 * Seeds RFID tags into the database
 * @param {Array} users Array of user objects to associate with RFID tags
 * @param {Array} devices Array of device objects to associate with RFID tags
 * @param {Object} options Configuration options
 * @param {boolean} options.resetData Whether to delete existing RFID tags before seeding
 * @returns {Promise<Array>} Array of created RFID tags
 */
export const seedRfidTags = async (
  users,
  devices = [],
  options = { resetData: false }
) => {
  try {
    // Clear existing RFID tags if resetData is true
    if (options.resetData) {
      logger.info("Deleting existing RFID tags...");
      await Rfid.destroy({ where: {}, force: true });
    }

    // Check if any RFID tags already exist
    const rfidCount = await Rfid.count();
    if (rfidCount > 0 && !options.resetData) {
      logger.info(
        `Found ${rfidCount} existing RFID tags, skipping RFID tag seeding`
      );
      return await Rfid.findAll();
    }

    // Filter users by role
    const adminUser = users.find((user) => user.role === "admin");
    const drivers = users.filter((user) => user.role === "driver");

    if (!adminUser) {
      throw new Error("No admin user found for RFID tag registration");
    }

    const createdTags = [];

    // Get a registration device (or default to first one)
    const registrationDevice =
      devices.find((d) => d.name.includes("Registration")) ||
      (devices.length > 0 ? devices[0] : null);
    const registrationDeviceId = registrationDevice
      ? registrationDevice.deviceId
      : "SEED-TERMINAL-01";

    // Create RFID tags for drivers (Use the tag IDs that are already set in their user records)
    for (const driver of drivers) {
      // Skip if the driver doesn't have an rfidTag
      if (!driver.rfidTag) continue;

      const tag = await Rfid.create({
        tagId: driver.rfidTag,
        userId: driver.id,
        isActive: true,
        deviceId: registrationDeviceId,
        registeredBy: adminUser.id,
        metadata: {
          vehicleType: "tricycle",
          plateNumber: `ABC-${Math.floor(Math.random() * 999)
            .toString()
            .padStart(3, "0")}`,
          seatedCapacity: 3,
        },
      });
      createdTags.push(tag);
    }

    // Create some unassigned RFID tags
    for (let i = 0; i < 3; i++) {
      const tagId = `UNASSIGNED-${(i + 1).toString().padStart(3, "0")}`;
      const tag = await Rfid.create({
        tagId: tagId,
        userId: null, // Unassigned
        isActive: true,
        deviceId: registrationDeviceId,
        registeredBy: adminUser.id,
        metadata: { status: "inventory", location: "Terminal Office" },
      });
      createdTags.push(tag);
    }

    return createdTags;
  } catch (error) {
    logger.error("Error seeding RFID tags:", error);
    throw error;
  }
};
