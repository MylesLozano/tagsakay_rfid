import { Sequelize } from "sequelize";
import { DB_CONFIG } from "./env.js";

const sequelize = new Sequelize(
  DB_CONFIG.NAME,
  DB_CONFIG.USER,
  DB_CONFIG.PASSWORD,
  {
    host: DB_CONFIG.HOST,
    port: DB_CONFIG.PORT,
    dialect: DB_CONFIG.DIALECT,
    logging: false,
  }
);

export { sequelize };
export default sequelize;
