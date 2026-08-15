const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const noticeRoutes = require("./routes/noticeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.send("CampusPulse API Running");
});

const connectDB = async () => {
  // 1. Try Primary MongoDB URI (Atlas)
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("✅ MongoDB Atlas Connected Successfully");
    return;
  } catch (err) {
    console.warn("⚠️ Atlas connection failed (Whitelisted IP issue or offline). Trying local MongoDB...");
  }

  // 2. Try Local MongoDB Instance
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/campuspulse", {
      serverSelectionTimeoutMS: 2000,
    });
    console.log("✅ Local MongoDB Connected Successfully");
    return;
  } catch (err) {
    console.warn("⚠️ Local MongoDB not found. Spinning up in-memory MongoDB server...");
  }

  // 3. Fallback to In-Memory MongoDB Server
  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log("✅ In-Memory MongoDB Fallback Connected Successfully:", mongoUri);
  } catch (fallbackErr) {
    console.error("❌ Database Connection Failed:", fallbackErr.message);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running on Port ${PORT}`);
});