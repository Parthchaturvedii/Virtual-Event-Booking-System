const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const { protect, adminOnly } = require("../middleware/auth");

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ── GET /api/admin/stats ── dashboard overview
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalBookings,
      activeBookings,
      cancelledBookings,
      events,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Event.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Event.find().select("title totalSeats bookedSeats category"),
    ]);

    const totalSeats = events.reduce((s, e) => s + (e.totalSeats || 0), 0);
    const usedSeats = events.reduce((s, e) => s + (e.bookedSeats || 0), 0);
    const availableSeats = totalSeats - usedSeats;

    // Bookings by category
    const bookingsByCategory = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
      { $unwind: "$event" },
      { $group: { _id: "$event.category", count: { $sum: 1 } } },
    ]);

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentBookings = await Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      totalUsers,
      totalEvents,
      totalBookings,
      activeBookings,
      cancelledBookings,
      totalSeats,
      availableSeats,
      bookingsByCategory,
      recentUsers,
      recentBookings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/users ── all users with booking counts
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    // Get booking counts per user
    const bookingCounts = await Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    bookingCounts.forEach(b => { countMap[b._id.toString()] = b.count; });

    const usersWithCounts = users.map(u => ({
      ...u.toSafeObject(),
      bookingCount: countMap[u._id.toString()] || 0,
    }));

    res.json(usersWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/users/:id/enrollments ── user's enrolled events
router.get("/users/:id/enrollments", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.id })
      .populate("eventId", "title date city category speaker totalSeats bookedSeats")
      .sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/role ── toggle user role
router.patch("/users/:id/role", async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "Cannot change your own role." });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.role = user.role === "admin" ? "user" : "admin";
    await user.save({ validateBeforeSave: false });
    res.json({ message: `Role updated to ${user.role}.`, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/status ── activate / deactivate
router.patch("/users/:id/status", async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "Cannot deactivate yourself." });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ message: `User ${user.isActive ? "activated" : "deactivated"}.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;