import jwt from "jsonwebtoken";

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object (without sensitive data like password)
 * @returns {String} JWT token
 */
export const generateToken = (user) => {
  const expiresIn =
    process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || "1h";
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to request
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/**
 * Middleware to check if user has required role
 * @param {String|Array} roles - Required role(s)
 */
export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Access denied: Insufficient permissions",
      });
    }

    next();
  };
};
