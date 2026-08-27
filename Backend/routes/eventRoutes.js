const express = require("express");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Attendance = require("../models/Attendance");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Create event (Forum Admin & College Admin)
router.post("/", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create event",
      error: error.message,
    });
  }
});

// Get all events (Public)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch events",
      error: error.message,
    });
  }
});

// Get single event by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch event",
      error: error.message,
    });
  }
});

// Delete Event & cascade clean related records (Forum Admin & College Admin)
router.delete("/:id", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    // Cleanup related registrations & attendance records
    await Registration.deleteMany({ eventId: req.params.id });
    await Attendance.deleteMany({ eventId: req.params.id });

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete event",
      error: error.message,
    });
  }
});

// Update Event (Forum Admin & College Admin)
router.put("/:id", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update event",
      error: error.message,
    });
  }
});

module.exports = router;