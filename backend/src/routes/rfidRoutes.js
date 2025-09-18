import express from "express";
import {
  scanRfid,
  registerRfid,
  getRfidInfo,
  updateRfidStatus,
  getWeeklyStats,
  getMonthlyStats,
} from "../controllers/rfidController.js";
import { authenticateApiKey, rfidRateLimit } from "../middleware/deviceAuth.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

// Public RFID routes for ESP32 devices (API key auth)
router.post("/scan", authenticateApiKey, rfidRateLimit, scanRfid);

// Protected RFID management routes (JWT auth)
router.post(
  "/register",
  authenticateToken,
  authorizeRole(["admin"]),
  registerRfid
);
router.get("/:id", authenticateToken, authorizeRole(["admin"]), getRfidInfo);
router.put(
  "/:id/status",
  authenticateToken,
  authorizeRole(["admin"]),
  updateRfidStatus
);

// RFID Statistics routes
router.get(
  "/stats/weekly",
  authenticateToken,
  authorizeRole(["admin", "staff"]),
  getWeeklyStats
);
router.get(
  "/stats/monthly",
  authenticateToken,
  authorizeRole(["admin", "staff"]),
  getMonthlyStats
);

export default router;
