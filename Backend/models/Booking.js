const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "attended"],
      default: "confirmed",
    },
    bookingDate: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index: one active booking per user per event
bookingSchema.index(
  { userId: 1, eventId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: "cancelled" } },
  }
);

module.exports = mongoose.model("Booking", bookingSchema);