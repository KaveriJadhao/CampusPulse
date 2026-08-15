const express = require("express");
const Event = require("../models/Event");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { isConnected, store } = require("../middleware/dbFallback");

const router = express.Router();

// Create event (Admin only)
router.post("/", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    if (!isConnected()) {
      const newEvt = { _id: "evt_" + Date.now(), ...req.body, createdAt: new Date() };
      store.events.unshift(newEvt);
      return res.status(201).json({ message: "Event created successfully", event: newEvt });
    }

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
    if (!isConnected()) {
      return res.status(200).json(store.events);
    }
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
    if (!isConnected()) {
      const event = store.events.find((e) => e._id === req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      return res.status(200).json(event);
    }
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

// Delete Event (Admin only)
router.delete("/:id", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    if (!isConnected()) {
      store.events = store.events.filter((e) => e._id !== req.params.id);
      return res.status(200).json({ message: "Event deleted successfully" });
    }
    await Event.findByIdAndDelete(req.params.id);
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

// Update Event (Admin only)
router.put("/:id", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    if (!isConnected()) {
      const index = store.events.findIndex((e) => e._id === req.params.id);
      if (index !== -1) {
        store.events[index] = { ...store.events[index], ...req.body };
        return res.status(200).json({ message: "Event updated successfully", event: store.events[index] });
      }
    }
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