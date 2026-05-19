const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    date: { type: String, required: true },
    speaker: { type: String, required: true },
    meetingLink: { type: String, default: "" },
    category: {
      type: String,
      enum: ["tech", "design", "business", "health", "science", "arts"],
      default: "tech",
    },
    totalSeats: { type: Number, default: 100, min: 1 },
    bookedSeats: { type: Number, default: 0, min: 0 },
    city: { type: String, default: "Online" },
    lat: { type: Number, default: null },  // latitude for geo
    lng: { type: Number, default: null },  // longitude for geo
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Virtual: available seats
eventSchema.virtual("availableSeats").get(function () {
  return Math.max(0, this.totalSeats - this.bookedSeats);
});

// Virtual: isFull
eventSchema.virtual("isFull").get(function () {
  return this.bookedSeats >= this.totalSeats;
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);