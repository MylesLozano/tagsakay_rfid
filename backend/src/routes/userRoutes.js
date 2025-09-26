import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

// User management routes (All require admin role)
router.get(
  "/",
  authenticateToken,
  authorizeRole(["admin", "superadmin"]),
  getAllUsers
);
router.get(
  "/:id",
  authenticateToken,
  authorizeRole(["admin", "superadmin"]),
  getUserById
);
router.post(
  "/",
  authenticateToken,
  authorizeRole(["admin", "superadmin"]),
  createUser
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin", "superadmin"]),
  updateUser
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin", "superadmin"]),
  deleteUser
);

export default router;
