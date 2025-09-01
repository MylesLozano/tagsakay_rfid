import sequelize from "../config/database.js";
import User from "./User.js";

const db = {};

db.Sequelize = sequelize.Sequelize;
db.sequelize = sequelize;

// Add models here
db.User = User;

// Add associations here if needed in the future
// e.g., db.User.hasMany(...)

export default db;
