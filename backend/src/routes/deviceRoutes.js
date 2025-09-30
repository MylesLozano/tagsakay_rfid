import express from "express";
const router = express.Router();
import * as deviceController from "../controllers/deviceController.js";
import { authenticateToken as authenticateJWT } from "../middleware/auth.js";
import { authenticateDevice } from "../middleware/deviceAuth.js";

// Admin routes (require JWT authentication)
router.post("/register", authenticateJWT, deviceController.registerDevice);
router.get("/", authenticateJWT, deviceController.getAllDevices);

// Device routes (require API key authentication)
router.post(
  "/status/:deviceId",
  authenticateDevice,
  deviceController.updateDeviceStatus
);

// Public routes for devices to check their status
router.get(
  "/registration-mode/:deviceId",
  authenticateDevice,
  deviceController.getRegistrationMode
);

export default router;
