import sequelize from "../config/database.js";
import User from "./User.js";
import ApiKey from "./ApiKey.js";
import Rfid from "./Rfid.js";
import RfidScan from "./RfidScan.js";
import DeviceModel from "./Device.js";

// Initialize the Device model with the sequelize instance
const Device = DeviceModel(sequelize);

const db = {};

db.Sequelize = sequelize.Sequelize;
db.sequelize = sequelize;

// Add models here
db.User = User;
db.ApiKey = ApiKey;
db.Rfid = Rfid;
db.RfidScan = RfidScan;
db.Device = Device;

// Add associations here
db.User.hasMany(ApiKey, { foreignKey: "createdBy", as: "apiKeys" });
ApiKey.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

db.User.hasMany(Rfid, { foreignKey: "userId", as: "rfidTags" });
Rfid.belongsTo(User, { foreignKey: "userId", as: "user" });

db.User.hasMany(Rfid, { foreignKey: "registeredBy", as: "registeredTags" });
Rfid.belongsTo(User, { foreignKey: "registeredBy", as: "registeredByUser" });

db.User.hasMany(RfidScan, { foreignKey: "userId", as: "rfidScans" });
RfidScan.belongsTo(User, { foreignKey: "userId", as: "user" });

// Each RFID tag can have many scan events
// For scan events, link by tagId string but don't enforce DB-level FK
// so we can record scans for unknown/unregistered tags too
Rfid.hasMany(RfidScan, {
  foreignKey: "rfidTagId",
  sourceKey: "tagId",
  as: "scanEvents",
  constraints: false,
});
RfidScan.belongsTo(Rfid, {
  foreignKey: "rfidTagId",
  targetKey: "tagId",
  as: "rfidTag",
  constraints: false,
});

// Setup Device to RfidScan association
// No need to define this association here as it's already defined in the Device.associate function
RfidScan.belongsTo(Device, {
  foreignKey: "deviceId",
  targetKey: "deviceId", // Use deviceId instead of id for the association
  as: "device",
  constraints: false, // Disable constraints to avoid type mismatch errors
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
export { User, ApiKey, Rfid, RfidScan, Device };
