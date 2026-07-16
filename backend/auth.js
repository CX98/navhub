import jwt from "jsonwebtoken";

// JWT secret - should be set via env var in production
const JWT_SECRET = process.env.JWT_SECRET || "navhub-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token expires in 7 days

// Default user credentials
const DEFAULT_USER = {
  username: "cxj",
  // Password stored as hash for security
  passwordHash: null, // Will be set below
};

// Simple password hashing (using SHA-256 for simplicity)
import { createHash } from "crypto";

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

// Initialize default user password hash
DEFAULT_USER.passwordHash = hashPassword("chenxiaojun@2026");

// Allowed users (can be extended to support multiple users from DB)
const users = [DEFAULT_USER];

/**
 * Login endpoint handler
 */
export function handleLogin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const inputHash = hashPassword(password);
  if (inputHash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate JWT token
  const token = jwt.sign(
    { username: user.username, role: "admin" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    token,
    username: user.username,
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify token endpoint handler
 */
export function handleVerify(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, username: decoded.username, role: decoded.role });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Auth middleware - protects write endpoints
 * Only allows requests with valid JWT tokens
 */
export function authMiddleware(req, res, next) {
  // Skip auth for GET requests (read-only access for everyone)
  if (req.method === "GET") {
    return next();
  }

  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required. Press Ctrl+Shift+K to login." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please login again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
}
