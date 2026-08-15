const express = require("express");
const Registration = require("../models/Registration");
const { verifyToken } = require("../middleware/authMiddleware");
const { isConnected, store } = require("../middleware/dbFallback");

const router = express.Router();

// Register student for event
router.post("/", verifyToken, async (req, res) => {
  try {
    const { eventId, studentName, email, branch, year } = req.body;

    if (!eventId || !studentName || !email || !branch || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isConnected()) {
      const existing = store.registrations.find(
        (r) => (r.eventId?._id || r.eventId) === eventId && r.email === cleanEmail
      );
      if (existing) {
        return res.status(400).json({ message: "You are already registered for this event" });
      }
      const eventObj = store.events.find((e) => e._id === eventId) || { _id: eventId, title: "Campus Event" };
      const newReg = {
        _id: "reg_" + Date.now(),
        eventId: eventObj,
        studentName: studentName.trim(),
        email: cleanEmail,
        branch,
        year,
        paymentStatus: "Paid",
        createdAt: new Date()
      };
      store.registrations.unshift(newReg);
      return res.status(201).json({ message: "Registration successful", registration: newReg });
    }

    const existingRegistration = await Registration.findOne({
      eventId,
      email: cleanEmail,
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "You are already registered for this event",
      });
    }

    const newRegistration = new Registration({
      eventId,
      studentName: studentName.trim(),
      email: cleanEmail,
      branch,
      year,
      paymentStatus: "Paid",
    });

    await newRegistration.save();

    res.status(201).json({
      message: "Registration successful",
      registration: newRegistration,
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

// Get all registrations (Authenticated)
router.get("/", verifyToken, async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(200).json(store.registrations);
    }
    const registrations = await Registration.find()
      .populate("eventId")
      .sort({ createdAt: -1 });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch registrations",
      error: error.message,
    });
  }
});

module.exports = router;