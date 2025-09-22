import express from "express";
import { getActiveDevices } from "../controllers/deviceController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

// Get active RFID devices
router.get(
  "/active",
  authenticateToken,
  authorizeRole(["admin", "staff"]),
  getActiveDevices
);

export default router;
