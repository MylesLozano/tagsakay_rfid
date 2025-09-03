import express from "express";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  updateApiKey,
} from "../controllers/apiKeyController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

// All these routes require authentication and admin role
router.use(authenticateToken, authorizeRole(["admin"]));

// API key management routes
router.post("/", createApiKey);
router.get("/", listApiKeys);
router.put("/:id", updateApiKey);
router.delete("/:id", revokeApiKey);

export default router;
