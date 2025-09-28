/**
 * Migration to update the Devices table with new fields for device registration
 */

export default {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if columns exist before adding them
      const tableInfo = await queryInterface.describeTable("Devices");

      // Add new columns to the Devices table if they don't exist
      if (!tableInfo.registrationMode) {
        await queryInterface.addColumn("Devices", "registrationMode", {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        });
        console.log("Added registrationMode column");
      }

      if (!tableInfo.pendingRegistrationTagId) {
        await queryInterface.addColumn("Devices", "pendingRegistrationTagId", {
          type: Sequelize.STRING,
          defaultValue: "",
          allowNull: false,
        });
        console.log("Added pendingRegistrationTagId column");
      }

      if (!tableInfo.scanMode) {
        await queryInterface.addColumn("Devices", "scanMode", {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        });
        console.log("Added scanMode column");
      }

      if (!tableInfo.lastSeen) {
        await queryInterface.addColumn("Devices", "lastSeen", {
          type: Sequelize.DATE,
          allowNull: true,
        });
        console.log("Added lastSeen column");
      }

      console.log(
        "Migration: Added device registration fields to Devices table"
      );
    } catch (error) {
      console.error("Migration error:", error.message);
      // If the table doesn't exist yet, ignore the error
      if (error.name !== "SequelizeConnectionError") {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns if rollback needed
    await queryInterface.removeColumn("Devices", "registrationMode");
    await queryInterface.removeColumn("Devices", "pendingRegistrationTagId");
    await queryInterface.removeColumn("Devices", "scanMode");
    await queryInterface.removeColumn("Devices", "lastSeen");

    console.log(
      "Migration: Removed device registration fields from Devices table"
    );
  },
};
