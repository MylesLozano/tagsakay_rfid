import express from "express";
import {
  getActiveDevices,
  setRegistrationMode,
  checkRegistrationMode,
} from "../controllers/deviceController.js";
import { updateDeviceStatus } from "../controllers/deviceStatusUpdate.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { authenticateApiKey } from "../middleware/deviceAuth.js";

const router = express.Router();

// Get active RFID devices
router.get(
  "/active",
  authenticateToken,
  authorizeRole(["admin", "staff"]),
  getActiveDevices
);

// Set registration mode for a device (requires admin authentication)
router.post(
  "/registration-mode",
  authenticateToken,
  authorizeRole(["admin"]),
  setRegistrationMode
);

// Check registration mode for a device (requires device API key authentication)
router.get(
  "/registration-mode/:deviceId",
  authenticateApiKey,
  checkRegistrationMode
);

// Update device status (requires device API key authentication)
router.post("/status/:deviceId", authenticateApiKey, updateDeviceStatus);

export default router;
