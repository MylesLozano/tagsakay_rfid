import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RfidScan = sequelize.define(
  "RfidScan",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    rfidTagId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "RFID tag identifier that was scanned",
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "ID of the device that performed the scan",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "User associated with the RFID tag (if any)",
    },
    eventType: {
      type: DataTypes.ENUM("entry", "exit", "unknown"),
      allowNull: false,
      defaultValue: "unknown",
      comment: "Type of scan event (entry, exit, or unknown)",
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Location where the scan occurred (if available)",
    },
    vehicleId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID of the vehicle where the scan occurred (if applicable)",
    },
    scanTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Timestamp when the scan occurred",
    },
    status: {
      type: DataTypes.ENUM("success", "failed", "unauthorized"),
      allowNull: false,
      defaultValue: "success",
      comment: "Status of the scan operation",
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: "Additional metadata for the scan event",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: false,
        fields: ["rfidTagId"],
      },
      {
        unique: false,
        fields: ["userId"],
      },
      {
        unique: false,
        fields: ["scanTime"],
      },
      {
        unique: false,
        fields: ["deviceId"],
      },
    ],
  }
);

export default RfidScan;
