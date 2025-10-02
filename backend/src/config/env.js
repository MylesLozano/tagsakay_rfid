/**
 * Centralized Environment Configuration
 * This file standardizes all environment variable access across the application
 * Import this file instead of using process.env directly
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
}

// Server Configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
};

// Database Configuration
export const DB_CONFIG = {
  HOST: process.env.DB_HOST,
  PORT: parseInt(process.env.DB_PORT),
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  NAME: process.env.DB_NAME,
  DIALECT: "postgres",
};

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || "1d",
};

// API Configuration
export const API_CONFIG = {
  URL: process.env.API_URL || `http://localhost:${SERVER_CONFIG.PORT}/api`,
};

// Export all configurations as a single object for convenience
export const CONFIG = {
  SERVER: SERVER_CONFIG,
  DB: DB_CONFIG,
  JWT: JWT_CONFIG,
  API: API_CONFIG,
};

export default CONFIG;
