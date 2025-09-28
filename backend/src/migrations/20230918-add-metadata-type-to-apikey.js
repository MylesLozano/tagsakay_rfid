"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if metadata column exists
      const [metadataResults] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ApiKeys' AND column_name = 'metadata'
      `);

      if (metadataResults.length === 0) {
        await queryInterface.addColumn("ApiKeys", "metadata", {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {},
        });
      }

      // Check if type column exists
      const [typeResults] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ApiKeys' AND column_name = 'type'
      `);

      if (typeResults.length === 0) {
        await queryInterface.addColumn("ApiKeys", "type", {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "device",
        });
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Migration failed:", error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn("ApiKeys", "metadata");
      await queryInterface.removeColumn("ApiKeys", "type");
      return Promise.resolve();
    } catch (error) {
      console.error("Migration rollback failed:", error);
      return Promise.reject(error);
    }
  },
};
