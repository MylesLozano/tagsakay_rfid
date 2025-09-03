import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("admin", "superadmin", "driver"),
    defaultValue: "driver",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  rfidTag: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true, // Admins might not have an RFID tag
  },
});

export default User;
