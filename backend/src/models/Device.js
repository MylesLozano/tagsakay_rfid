// Device.js - Updated with ES Module syntax
import { DataTypes } from "sequelize";

const DeviceModel = (sequelize) => {
  const Device = sequelize.define(
    "Device",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        // This will store the MAC without colons
      },
      macAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        // This will store the MAC with colons for display
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      apiKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      registrationMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      pendingRegistrationTagId: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      scanMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastSeen: {
        type: DataTypes.DATE,
      },
    },
    {
      timestamps: true,
    }
  );

  Device.associate = function (models) {
    // Define associations here
    Device.hasMany(models.RfidScan, {
      foreignKey: "deviceId",
      sourceKey: "deviceId", // Use deviceId instead of id for the association
      as: "scans",
      constraints: false, // Disable constraints to avoid type mismatch errors
    });
  };

  return Device;
};

export default DeviceModel;
