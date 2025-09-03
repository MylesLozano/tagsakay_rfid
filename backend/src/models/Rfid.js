import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Rfid = sequelize.define(
  "Rfid",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tagId: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique constraint is defined in indexes below
      comment: "Unique identifier from the RFID tag",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "User associated with this RFID tag (if any)",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Whether this RFID tag is currently active",
    },
    lastScanned: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Last time this RFID tag was scanned",
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID of the device that last scanned this tag",
    },
    registeredBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID of the admin user who registered this tag",
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: "Additional metadata for the RFID tag",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["tagId"],
      },
      {
        unique: false,
        fields: ["userId"],
      },
    ],
  }
);

export default Rfid;
