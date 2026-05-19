const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const { protect, adminOnly } = require("../middleware/auth");

// ── POST /api/bookings ── book an event
router.post("/", protect, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found." });

    if (event.bookedSeats >= event.totalSeats)
      return res.status(409).json({ message: "This event is fully booked." });

    // Check duplicate
    const existing = await Booking.findOne({ userId, eventId, status: { $ne: "cancelled" } });
    if (existing) return res.status(409).json({ message: "You have already booked this event." });

    const booking = await Booking.create({ userId, eventId, status: "confirmed" });

    // Increment booked seats atomically
    await Event.findByIdAndUpdate(eventId, { $inc: { bookedSeats: 1 } });

    res.status(201).json({ message: "Event booked successfully!", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/bookings/my ── current user's bookings
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("eventId")
      .sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/bookings ── ALL bookings (admin)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("eventId", "title date city category speaker")
      .populate("userId", "name email city")
      .sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/bookings/:id/cancel ── cancel booking
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    const isOwner = booking.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorised." });

    if (booking.status === "cancelled")
      return res.status(400).json({ message: "Booking is already cancelled." });

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    // Free up seat
    await Event.findByIdAndUpdate(booking.eventId, { $inc: { bookedSeats: -1 } });

    res.json({ message: "Booking cancelled." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;