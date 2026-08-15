const express = require("express");
const Attendance = require("../models/Attendance");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { isConnected, store } = require("../middleware/dbFallback");

const router = express.Router();

// Mark attendance (Admin only)
router.post("/", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    const { eventId, studentName, email, branch, year } = req.body;

    if (!eventId || !studentName || !email || !branch || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanEmail = email.toLowerCase();

    if (!isConnected()) {
      const existing = store.attendance.find(
        (a) => (a.eventId?._id || a.eventId) === eventId && a.email === cleanEmail
      );
      if (existing) {
        return res.status(400).json({ message: "Attendance already marked" });
      }
      const eventObj = store.events.find((e) => e._id === eventId) || { _id: eventId, title: "Campus Event" };
      const newAtt = {
        _id: "att_" + Date.now(),
        eventId: eventObj,
        studentName,
        email: cleanEmail,
        branch,
        year,
        status: "Present",
        createdAt: new Date()
      };
      store.attendance.unshift(newAtt);
      return res.status(201).json({ message: "Attendance marked successfully", attendance: newAtt });
    }

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
      studentName,
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

// Get all attendance (Authenticated)
router.get("/", verifyToken, async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(200).json(store.attendance);
    }
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