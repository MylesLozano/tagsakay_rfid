import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from the backend .env file
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

export default sequelize;
