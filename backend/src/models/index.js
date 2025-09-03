import sequelize from "../config/database.js";
import User from "./User.js";
import ApiKey from "./ApiKey.js";
import Rfid from "./Rfid.js";
import RfidScan from "./RfidScan.js";

const db = {};

db.Sequelize = sequelize.Sequelize;
db.sequelize = sequelize;

// Add models here
db.User = User;
db.ApiKey = ApiKey;
db.Rfid = Rfid;
db.RfidScan = RfidScan;

// Add associations here
db.User.hasMany(ApiKey, { foreignKey: "createdBy", as: "apiKeys" });
ApiKey.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

db.User.hasMany(Rfid, { foreignKey: "userId", as: "rfidTags" });
Rfid.belongsTo(User, { foreignKey: "userId", as: "user" });

db.User.hasMany(Rfid, { foreignKey: "registeredBy", as: "registeredTags" });
Rfid.belongsTo(User, { foreignKey: "registeredBy", as: "registeredBy" });

db.User.hasMany(RfidScan, { foreignKey: "userId", as: "rfidScans" });
RfidScan.belongsTo(User, { foreignKey: "userId", as: "user" });

// Each RFID tag can have many scan events
Rfid.hasMany(RfidScan, {
  foreignKey: "rfidTagId",
  sourceKey: "tagId",
  as: "scanEvents",
});
RfidScan.belongsTo(Rfid, {
  foreignKey: "rfidTagId",
  targetKey: "tagId",
  as: "rfidTag",
});

export default db;
export { User, ApiKey, Rfid, RfidScan };
