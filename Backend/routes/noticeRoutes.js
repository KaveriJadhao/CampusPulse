const express = require("express");
const Notice = require("../models/Notice");
console.log("Notice Routes Loaded");
const router = express.Router();

// Create notice
router.post("/", async (req, res) => {
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

// Get all notices
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
// DELETE NOTICE
router.delete("/:id", async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);

    res.json({
      message: "Notice deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});
module.exports = router;