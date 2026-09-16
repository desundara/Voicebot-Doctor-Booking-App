const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DOCTORS_FILE = path.join(__dirname, "data", "doctors.json");
const BOOKINGS_FILE = path.join(__dirname, "data", "bookings.json");

// Weekday order used across the whole app. Saturday/Sunday are intentionally excluded.
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function loadDoctors() {
  return JSON.parse(fs.readFileSync(DOCTORS_FILE, "utf8"));
}

function loadBookings() {
  if (!fs.existsSync(BOOKINGS_FILE)) return [];
  return JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));
}

function saveBookings(bookings) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

// GET /api/doctors -> full doctor list (specialty is translated client-side)
app.get("/api/doctors", (req, res) => {
  res.json(loadDoctors());
});

// GET /api/availability?doctorId=1&day=monday -> free slots for that doctor on that weekday
app.get("/api/availability", (req, res) => {
  const doctorId = parseInt(req.query.doctorId, 10);
  const day = String(req.query.day || "").toLowerCase();

  if (!WEEKDAYS.includes(day)) {
    return res.status(400).json({ error: "invalid_day", message: "Only Monday-Friday are bookable." });
  }

  const doctor = loadDoctors().find((d) => d.id === doctorId);
  if (!doctor) return res.status(404).json({ error: "doctor_not_found" });

  const bookings = loadBookings();
  const taken = bookings
    .filter((b) => b.doctorId === doctorId && b.day === day)
    .map((b) => b.time);

  const freeSlots = doctor.slots.filter((s) => !taken.includes(s));
  res.json({ doctorId, day, freeSlots });
});

// POST /api/book { doctorId, day, time, patientName, language }
app.post("/api/book", (req, res) => {
  const { doctorId, day, time, patientName, language } = req.body || {};
  const dayLower = String(day || "").toLowerCase();

  if (!WEEKDAYS.includes(dayLower)) {
    return res.status(400).json({ error: "invalid_day", message: "Bookings are only accepted Monday to Friday." });
  }

  const doctor = loadDoctors().find((d) => d.id === parseInt(doctorId, 10));
  if (!doctor) return res.status(404).json({ error: "doctor_not_found" });

  if (!doctor.slots.includes(time)) {
    return res.status(400).json({ error: "invalid_time", message: "That time slot does not exist for this doctor." });
  }

  if (!patientName || !String(patientName).trim()) {
    return res.status(400).json({ error: "missing_name" });
  }

  const bookings = loadBookings();
  const clash = bookings.find((b) => b.doctorId === doctor.id && b.day === dayLower && b.time === time);
  if (clash) {
    return res.status(409).json({ error: "slot_taken", message: "That slot was just booked by someone else." });
  }

  const booking = {
    id: "BK" + Date.now().toString(36).toUpperCase(),
    doctorId: doctor.id,
    doctorName: doctor.name,
    day: dayLower,
    time,
    patientName: String(patientName).trim(),
    language: language || "en",
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  saveBookings(bookings);

  res.json({ success: true, booking });
});

// GET /api/bookings -> simple admin/debug view of everything booked so far
app.get("/api/bookings", (req, res) => {
  res.json(loadBookings());
});

app.listen(PORT, () => {
  console.log(`Voicebot doctor booking server running at http://localhost:${PORT}`);
});
