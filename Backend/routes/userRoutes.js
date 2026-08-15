const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { isConnected, store } = require("../middleware/dbFallback");

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET || "supersecretjwtkey_campuspulse_2026",
    { expiresIn: "7d" }
  );
};

// Signup - only students can signup publicly
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, branch, year } = req.body;

    if (!fullName || !email || !password || !branch || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Fallback mode if DB is disconnected
    if (!isConnected()) {
      const existingInStore = store.users.find((u) => u.email === cleanEmail);
      if (existingInStore) {
        return res.status(400).json({ message: "User already exists" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = {
        _id: "user_" + Date.now(),
        fullName: fullName.trim(),
        email: cleanEmail,
        password: hashedPassword,
        branch,
        year,
        role: "student",
        createdAt: new Date(),
      };
      store.users.push(newUser);
      const token = generateToken(newUser);
      return res.status(201).json({
        message: "Signup successful",
        token,
        user: {
          _id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          branch: newUser.branch,
          year: newUser.year,
        },
      });
    }

    // Database Connected mode
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      branch,
      year,
      role: "student",
    });

    await newUser.save();
    const token = generateToken(newUser);

    res.status(201).json({
      message: "Signup successful",
      token,
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

    const cleanEmail = email.trim().toLowerCase();

    // Fallback mode if DB is disconnected
    if (!isConnected()) {
      const user = store.users.find((u) => u.email === cleanEmail);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      let isMatch = false;
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = user.password === password;
      }
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      const token = generateToken(user);
      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          branch: user.branch,
          year: user.year,
        },
      });
    }

    // Database Connected mode
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
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