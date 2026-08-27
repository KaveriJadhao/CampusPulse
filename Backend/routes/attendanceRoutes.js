const express = require("express");
const Attendance = require("../models/Attendance");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Mark attendance (Logged-in users)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { eventId, studentName, email, branch, year } = req.body;

    if (!eventId || !studentName || !email || !branch || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingAttendance = await Attendance.findOne({
      eventId,
      email: cleanEmail,
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance already marked",
      });
    }

    const attendance = new Attendance({
      eventId,
      studentName: studentName.trim(),
      email: cleanEmail,
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

// Get all attendance (Logged-in users)
router.get("/", verifyToken, async (req, res) => {
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