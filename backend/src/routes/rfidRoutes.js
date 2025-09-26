import express from "express";
import {
  scanRfid,
  registerRfid,
  getRfidInfo,
  updateRfidStatus,
  getWeeklyStats,
  getMonthlyStats,
  getRecentScans,
} from "../controllers/rfidController.js";
import { checkRecentTagScan } from "../controllers/tagScanChecker.js";
import { getRecentUnregisteredScans } from "../controllers/recentUnregisteredScans.js";
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

// Get recent unregistered scans (for new card detection)
// Use /scans/unregistered to avoid confusion with /:id pattern
router.get(
  "/scans/unregistered",
  authenticateToken,
  authorizeRole(["admin"]),
  getRecentUnregisteredScans
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

// RFID Scans routes
router.get(
  "/scans/recent",
  authenticateToken,
  authorizeRole(["admin", "staff"]),
  getRecentScans
);

// Add route to check for recent scan of a specific tag
router.get(
  "/check-recent-scan/:tagId",
  authenticateToken,
  authorizeRole(["admin"]),
  checkRecentTagScan
);

export default router;
