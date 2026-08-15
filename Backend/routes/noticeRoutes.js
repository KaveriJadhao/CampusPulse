const express = require("express");
const Notice = require("../models/Notice");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { isConnected, store } = require("../middleware/dbFallback");

const router = express.Router();

// Create notice (Admin only)
router.post("/", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    if (!isConnected()) {
      const newNot = { _id: "not_" + Date.now(), ...req.body, createdAt: new Date() };
      store.notices.unshift(newNot);
      return res.status(201).json({ message: "Notice created successfully", notice: newNot });
    }

    const newNotice = new Notice(req.body);
    await newNotice.save();

    res.status(201).json({
      message: "Notice created successfully",
      notice: newNotice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create notice",
      error: error.message,
    });
  }
});

// Get all notices (Public)
router.get("/", async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(200).json(store.notices);
    }
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notices",
      error: error.message,
    });
  }
});

// DELETE NOTICE (Admin only)
router.delete("/:id", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    if (!isConnected()) {
      store.notices = store.notices.filter((n) => n._id !== req.params.id);
      return res.json({ message: "Notice deleted successfully" });
    }
    await Notice.findByIdAndDelete(req.params.id);

    res.json({
      message: "Notice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete notice",
      error: error.message,
    });
  }
});

module.exports = router;