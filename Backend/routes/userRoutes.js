const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Signup - only students can signup publicly
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, branch, year } = req.body;

    if (!fullName || !email || !password || !branch || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const newUser = new User({
      fullName,
      email,
      password,
      branch,
      year,
      role: "student",
    });

    await newUser.save();

    res.status(201).json({
      message: "Signup successful",
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        branch: newUser.branch,
        year: newUser.year,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        branch: user.branch,
        year: user.year,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

module.exports = router;