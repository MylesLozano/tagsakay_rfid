/**
 * Centralized Environment Configuration for Frontend
 * This file standardizes all environment variable access across the Vue application
 * Import this file instead of using import.meta.env directly
 */

// Validate required environment variables
const requiredEnvVars = ["VITE_API_URL"];
const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  console.warn(`Missing environment variables: ${missingVars.join(", ")}`);
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
};

// App Configuration
export const APP_CONFIG = {
  NODE_ENV: import.meta.env.MODE || "development",
  DEV: import.meta.env.DEV || false,
  PROD: import.meta.env.PROD || false,
};

// Export all configurations as a single object for convenience
export const CONFIG = {
  API: API_CONFIG,
  APP: APP_CONFIG,
};

export default CONFIG;
