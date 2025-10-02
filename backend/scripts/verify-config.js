/**
 * Configuration verification script
 * Run this to ensure all environment variables are properly configured
 */

import { CONFIG } from "../src/config/env.js";
import logger from "../src/config/logger.js";

function verifyConfiguration() {
  logger.info("🔍 Verifying environment configuration...");

  try {
    // Test server config
    logger.info(`✅ Server PORT: ${CONFIG.SERVER.PORT}`);
    logger.info(`✅ Node Environment: ${CONFIG.SERVER.NODE_ENV}`);

    // Test database config
    logger.info(`✅ Database Host: ${CONFIG.DB.HOST}`);
    logger.info(`✅ Database Port: ${CONFIG.DB.PORT}`);
    logger.info(`✅ Database Name: ${CONFIG.DB.NAME}`);
    logger.info(`✅ Database User: ${CONFIG.DB.USER}`);
    logger.info(
      `✅ Database Password: ${"*".repeat(CONFIG.DB.PASSWORD.length)}`
    );

    // Test JWT config
    logger.info(`✅ JWT Secret: ${"*".repeat(CONFIG.JWT.SECRET.length)}`);
    logger.info(`✅ JWT Expires In: ${CONFIG.JWT.EXPIRES_IN}`);

    // Test API config
    logger.info(`✅ API URL: ${CONFIG.API.URL}`);

    logger.info("🎉 All configurations loaded successfully!");
  } catch (error) {
    logger.error(`❌ Configuration error: ${error.message}`);
    process.exit(1);
  }
}

verifyConfiguration();
