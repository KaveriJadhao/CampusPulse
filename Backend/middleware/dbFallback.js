const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// In-Memory dataset fallback when database is disconnected
const store = {
  users: [],
  events: [
    {
      _id: "evt_1",
      title: "Annual Tech Symposium 2026",
      category: "Technical",
      organizer: "Computer Science Dept",
      date: "2026-09-15",
      time: "10:00 AM",
      venue: "Main Auditorium",
      fee: 0,
      description: "Join us for exciting keynote sessions, coding hackathons, and tech exhibitions.",
      createdAt: new Date()
    },
    {
      _id: "evt_2",
      title: "Cultural Night & Talent Hunt",
      category: "Cultural",
      organizer: "Student Activity Council",
      date: "2026-09-20",
      time: "05:00 PM",
      venue: "Open Air Theatre",
      fee: 0,
      description: "Showcase your music, dance, and drama skills live on stage.",
      createdAt: new Date()
    }
  ],
  notices: [
    {
      _id: "not_1",
      title: "Mid-Semester Examination Schedule",
      category: "Academic",
      department: "All Departments",
      description: "Mid-semester exams will commence from Sept 25, 2026. Detailed timetable attached.",
      important: true,
      createdAt: new Date()
    }
  ],
  registrations: [],
  attendance: []
};

// Check if database is connected
const isConnected = () => mongoose.connection.readyState === 1;

module.exports = {
  store,
  isConnected
};
