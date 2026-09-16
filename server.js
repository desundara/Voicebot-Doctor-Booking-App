const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DOCTORS_FILE = path.join(__dirname, "data", "doctors.json");
const BOOKINGS_FILE = path.join(__dirname, "data", "bookings.json");

// Vercel's filesystem is read-only (except /tmp), so bookings cannot be written
// back into data/bookings.json in production.
const IS_SERVERLESS = !!process.env.VERCEL;

// Optional persistent store (Upstash Redis REST / Vercel KV).
// If these env vars are set on Vercel, bookings persist properly.
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const USE_KV = !!(KV_URL && KV_TOKEN);
const KV_KEY = "voicebot:bookings";

// Last-resort store for serverless runs with no KV configured.
// Survives only while the same warm instance is alive.
let memoryBookings = null;

// Weekday order used across the whole app. Saturday/Sunday are intentionally excluded.
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function loadDoctors() {
  return JSON.parse(fs.readFileSync(DOCTORS_FILE, "utf8"));
}

function readSeedBookings() {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) return [];
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));
  } catch (err) {
    console.error("Could not read bookings seed file:", err.message);
    return [];
  }
}

async function kvRequest(command) {
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`KV request failed: ${res.status}`);
  return res.json();
}

async function loadBookings() {
  if (USE_KV) {
    try {
      const data = await kvRequest(["GET", KV_KEY]);
      if (!data || !data.result) return [];
      return JSON.parse(data.result);
    } catch (err) {
      console.error("KV read failed, falling back to memory:", err.message);
    }
  }

  if (IS_SERVERLESS) {
    if (memoryBookings === null) memoryBookings = readSeedBookings();
    return memoryBookings;
  }

  return readSeedBookings();
}

async function saveBookings(bookings) {
  if (USE_KV) {
    try {
      await kvRequest(["SET", KV_KEY, JSON.stringify(bookings)]);
      return;
    } catch (err) {
      console.error("KV write failed, falling back to memory:", err.message);
    }
  }

  if (IS_SERVERLESS) {
    memoryBookings = bookings;
    return;
  }

  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

// Small helper so async route handlers never crash the function silently.
const wrap = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "server_error", message: err.message });
  });
};

// GET /api/doctors -> full doctor list (specialty is translated client-side)
app.get("/api/doctors", (req, res) => {
  res.json(loadDoctors());
});

// GET /api/availability?doctorId=1&day=monday -> free slots for that doctor on that weekday
app.get(
  "/api/availability",
  wrap(async (req, res) => {
    const doctorId = parseInt(req.query.doctorId, 10);
    const day = String(req.query.day || "").toLowerCase();

    if (!WEEKDAYS.includes(day)) {
      return res.status(400).json({ error: "invalid_day", message: "Only Monday-Friday are bookable." });
    }

    const doctor = loadDoctors().find((d) => d.id === doctorId);
    if (!doctor) return res.status(404).json({ error: "doctor_not_found" });

    const bookings = await loadBookings();
    const taken = bookings
      .filter((b) => b.doctorId === doctorId && b.day === day)
      .map((b) => b.time);

    const freeSlots = doctor.slots.filter((s) => !taken.includes(s));
    res.json({ doctorId, day, freeSlots });
  })
);

// POST /api/book { doctorId, day, time, patientName, language }
app.post(
  "/api/book",
  wrap(async (req, res) => {
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

    const bookings = await loadBookings();
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

    const updated = [...bookings, booking];
    await saveBookings(updated);

    res.json({ success: true, booking });
  })
);

// GET /api/bookings -> simple admin/debug view of everything booked so far
app.get(
  "/api/bookings",
  wrap(async (req, res) => {
    res.json(await loadBookings());
  })
);

// GET /api/health -> quick check of which storage mode is active
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    serverless: IS_SERVERLESS,
    storage: USE_KV ? "kv" : IS_SERVERLESS ? "memory (not persistent)" : "file",
  });
});

// Local dev only. On Vercel the exported app is used as a serverless handler.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Voicebot doctor booking server running at http://localhost:${PORT}`);
  });
}

module.exports = app;