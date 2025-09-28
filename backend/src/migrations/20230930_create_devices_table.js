"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Devices", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deviceId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      macAddress: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      apiKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      registrationMode: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      pendingRegistrationTagId: {
        type: Sequelize.STRING,
        defaultValue: "",
      },
      scanMode: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      lastSeen: {
        type: Sequelize.DATE,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Devices");
  },
};
