const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { protect, adminOnly } = require("../middleware/auth");

// ── GET /api/events ── list with search, filter, sort, pagination
router.get("/", async (req, res) => {
  try {
    const { search, category, city, sort = "date", page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { speaker: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "all") query.category = category;
    if (city && city !== "all") query.city = { $regex: city, $options: "i" };

    const sortMap = {
      date: { date: 1 },
      "-date": { date: -1 },
      seats: { availableSeats: -1 },
      title: { title: 1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort(sortMap[sort] || { date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ events, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/events/nearby?city=Delhi ── events by city
router.get("/nearby", async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ message: "City is required." });
    const events = await Event.find({ city: { $regex: city, $options: "i" } }).sort({ date: 1 });
    res.json({ events, count: events.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/events/featured ── featured events
router.get("/featured", async (req, res) => {
  try {
    const events = await Event.find({ isFeatured: true }).limit(6).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/events/:id ── single event
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("createdBy", "name");
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/events ── create event (admin)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ message: "Event created.", event });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/events/:id ── update event (admin)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ message: "Event updated.", event });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PATCH /api/events/:id/seats ── adjust seat capacity (admin)
router.patch("/:id/seats", protect, adminOnly, async (req, res) => {
  try {
    const { delta } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    const newTotal = Math.max((event.totalSeats || 100) + delta, event.bookedSeats);
    event.totalSeats = newTotal;
    await event.save();
    res.json({ message: "Seats updated.", totalSeats: newTotal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/events/:id ── delete event (admin)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    // Also delete bookings for this event
    const Booking = require("../models/Booking");
    await Booking.deleteMany({ eventId: req.params.id });
    res.json({ message: "Event deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;