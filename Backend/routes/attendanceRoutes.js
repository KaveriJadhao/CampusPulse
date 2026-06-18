const express = require("express");
const Attendance = require("../models/Attendance");

const router = express.Router();

// Mark attendance
router.post("/", async (req, res) => {
  try {
    const { eventId, studentName, email, branch, year } = req.body;

    if (!eventId || !studentName || !email || !branch || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingAttendance = await Attendance.findOne({
      eventId,
      email: email.toLowerCase(),
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance already marked",
      });
    }

    const attendance = new Attendance({
      eventId,
      studentName,
      email: email.toLowerCase(),
      branch,
      year,
      status: "Present",
    });

    await attendance.save();

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
});

// Get all attendance
router.get("/", async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("eventId")
      .sort({ createdAt: -1 });

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
});

module.exports = router;