const express = require("express");
const Notice = require("../models/Notice");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Create notice (Forum Admin & College Admin)
router.post("/", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
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
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notices",
      error: error.message,
    });
  }
});

// DELETE NOTICE (Forum Admin & College Admin)
router.delete("/:id", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
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

// UPDATE NOTICE (Forum Admin & College Admin)
router.put("/:id", verifyToken, requireRole("forum-admin", "college-admin"), async (req, res) => {
  try {
    const updatedNotice = await Notice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Notice updated successfully",
      notice: updatedNotice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notice",
      error: error.message,
    });
  }
});

module.exports = router;