import express from "express";
const router = express.Router();
import * as deviceController from "../controllers/deviceController.js";
import { authenticateToken as authenticateJWT } from "../middleware/auth.js";
import { authenticateDevice } from "../middleware/deviceAuth.js";

// Admin routes (require JWT authentication)
router.post("/register", authenticateJWT, deviceController.registerDevice);
router.get("/", authenticateJWT, deviceController.getAllDevices);
router.get("/active", authenticateJWT, deviceController.getActiveDevices);
router.delete("/:id", authenticateJWT, deviceController.deleteDevice);
router.put("/:id/status", authenticateJWT, deviceController.updateDeviceStatus);

// Device routes (require API key authentication)
router.post(
  "/status/:deviceId",
  authenticateDevice,
  deviceController.updateDeviceStatus
);

// Routes for device registration mode
router.post(
  "/:deviceId/registration-mode",
  authenticateJWT,
  deviceController.enableRegistrationMode
);
router.get(
  "/registration-mode/:deviceId",
  authenticateDevice,
  deviceController.getRegistrationMode
);
router.post(
  "/:deviceId/enable-registration",
  authenticateJWT,
  deviceController.enableRegistrationMode
);

// Device heartbeat endpoint (no authentication required for easier integration with ESP32)
router.post("/:deviceId/heartbeat", deviceController.updateDeviceHeartbeat);

export default router;
