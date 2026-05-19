const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

// ── POST /api/auth/register ──────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, city } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required." });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters." });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "This email is already registered. Please sign in." });

    const user = await User.create({ name, email, password, city: city || "" });
    const token = signToken(user._id, user.role);

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(404).json({ message: "No account found with this email." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password. Please try again." });

    if (!user.isActive)
      return res.status(403).json({ message: "Your account has been deactivated." });

    // Update login metadata
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id, user.role);

    res.json({
      message: "Login successful!",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/logout ────────────────────────────
// JWT is stateless so logout is handled client-side (token removal).
// This endpoint exists for future token blacklisting or audit logging.
router.post("/logout", protect, async (req, res) => {
  // Optional: log the logout event, clear refresh tokens, etc.
  res.json({ message: "Logged out successfully." });
});

// ── GET /api/auth/me ─────────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// ── PUT /api/auth/me ─ update profile ─────────────────
router.put("/me", protect, async (req, res) => {
  try {
    const { name, city } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, city },
      { new: true, runValidators: true }
    );
    res.json({ message: "Profile updated.", user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;