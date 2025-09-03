import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ApiKey = sequelize.define(
  "ApiKey",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Name of the API key (e.g., 'ESP32 Device 1')",
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Unique identifier for the device using this key",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Optional description of what this API key is used for",
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: "Hashed API key (not the actual key)",
    },
    prefix: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: "API key prefix for identification purposes",
    },
    permissions: {
      // Use JSON for cross-dialect compatibility (SQLite doesn't support ARRAY)
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ["scan"],
      comment: "Array of permissions granted to this API key",
    },
    lastUsed: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp of when this API key was last used",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Whether this API key is currently active",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID of the user who created this API key",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["key"],
      },
      {
        unique: false,
        fields: ["deviceId"],
      },
    ],
  }
);

export default ApiKey;
