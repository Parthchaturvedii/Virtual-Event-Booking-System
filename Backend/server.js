require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes    = require("./routes/authRoutes");
const eventRoutes   = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes   = require("./routes/adminRoutes");

const app = express();

// ── Connect MongoDB ──────────────────────────────────
connectDB();

// ── Middleware ───────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:5500", "*"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/events",   eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin",    adminRoutes);

// ── Health Check ─────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

// ── 404 ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ─────────────────────────────
app.use((err, req, res, _next) => {
  console.error("❌", err.stack);
  res.status(err.status || 500).json({ message: err.message || "Internal server error." });
});

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Eventify API running → http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
});