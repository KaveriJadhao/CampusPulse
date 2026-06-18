const express = require("express");
const Registration = require("../models/Registration");

const router = express.Router();

// Register student for event
router.post("/", async (req, res) => {
  try {
    const { eventId, studentName, email, branch, year, paymentStatus } = req.body;

    if (!eventId || !studentName || !email || !branch || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

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
      paymentStatus: paymentStatus || "Pending",
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

// Get all registrations
router.get("/", async (req, res) => {
  try {
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