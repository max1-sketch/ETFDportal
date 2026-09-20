const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "bans.json");
const CHAT_FILE = path.join(__dirname, "chatLogs.json");
const EXPLOIT_FILE = path.join(__dirname, "exploitLogs.json");

function loadBans() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch { return {}; }
}
function saveBans(bans) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bans, null, 2));
}
function loadLogs(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return {}; }
}
function saveLogs(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── BAN ENDPOINTS ──────────────────────────────────────

app.get("/api/check", (req, res) => {
  const username = (req.query.username || "").trim();
  if (!username) return res.json({ banned: false });
  const bans = loadBans();
  const ban = bans[username.toLowerCase()];
  res.json(ban ? { banned: true, ...ban } : { banned: false });
});

app.post("/api/ban", (req, res) => {
  const { username, type, reason, duration, staff, details, userId } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });
  const bans = loadBans();
  bans[username.toLowerCase()] = {
    username, type, reason: reason || "No reason provided",
    duration: duration || "Permanent", staff: staff || "Staff Team",
    details: details || "", userId: userId || null,
    bannedAt: new Date().toISOString(),
  };
  saveBans(bans);
  res.json({ success: true });
});

app.post("/api/unban", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });
  const bans = loadBans();
  delete bans[username.toLowerCase()];
  saveBans(bans);
  res.json({ success: true });
});

app.post("/api/sync", (req, res) => {
  const { bans: banList } = req.body;
  const bans = {};
  for (const b of banList) {
    bans[b.roblox_username.toLowerCase()] = {
      username: b.roblox_username, type: b.moderation_type,
      reason: b.reason || "No reason provided", duration: b.duration || "Permanent",
      staff: b.staff_member || "Staff Team", details: b.details || "",
      bannedAt: b.moderation_date || new Date().toISOString(),
    };
  }
  saveBans(bans);
  res.json({ success: true, count: Object.keys(bans).length });
});

app.get("/api/bans", (req, res) => res.json(loadBans()));

// ── CHAT LOG ENDPOINTS (called by Roblox game) ──────────

app.post("/api/roblox/chat", (req, res) => {
  const { userId, username, msg, ageDays, time } = req.body;
  if (!username || !msg) return res.status(400).json({ error: "Missing username or msg" });
  const logs = loadLogs(CHAT_FILE);
  const key = username.toLowerCase();
  if (!logs[key]) logs[key] = [];
  logs[key].push({
    userId: userId || "", username, msg,
    ageDays: ageDays || 0, time: time || "",
    timestamp: new Date().toISOString(),
  });
  if (logs[key].length > 500) logs[key] = logs[key].slice(-500);
  saveLogs(CHAT_FILE, logs);
  res.json({ success: true });
});

// ── EXPLOIT LOG ENDPOINTS (called by Roblox game) ───────

app.post("/api/roblox/exploit", (req, res) => {
  const { userId, username, exploitType, details } = req.body;
  if (!username || !exploitType) return res.status(400).json({ error: "Missing username or exploitType" });
  const logs = loadLogs(EXPLOIT_FILE);
  const key = username.toLowerCase();
  if (!logs[key]) logs[key] = [];
  logs[key].push({
    userId: userId || "", username, exploitType,
    details: details || "", timestamp: new Date().toISOString(),
  });
  if (logs[key].length > 200) logs[key] = logs[key].slice(-200);
  saveLogs(EXPLOIT_FILE, logs);
  res.json({ success: true });
});

// ── LOG FETCH ENDPOINTS (called by Base44 app for staff review) ──

app.get("/api/logs/chat/:username", (req, res) => {
  const logs = loadLogs(CHAT_FILE);
  const key = (req.params.username || "").toLowerCase();
  res.json({ logs: logs[key] || [] });
});

app.get("/api/logs/exploits/:username", (req, res) => {
  const logs = loadLogs(EXPLOIT_FILE);
  const key = (req.params.username || "").toLowerCase();
  res.json({ logs: logs[key] || [] });
});

// ── PLAYER BAN CHECK (called by Roblox script) ─────────

app.get("/api/roblox/players/:userId", (req, res) => {
  const userId = req.params.userId;
  const bans = loadBans();
  // Look up by userId if stored, otherwise return not banned
  for (const key of Object.keys(bans)) {
    if (bans[key].userId && String(bans[key].userId) === String(userId)) {
      const b = bans[key];
      return res.json({
        banned: true,
        reason: b.reason,
        admin: b.staff,
        durationSeconds: b.duration === "Permanent" ? 0 : 0,
        bannedAt: b.bannedAt,
        caseId: b.caseId || "",
      });
    }
  }
  res.json({ banned: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Escape Tsunami server running on port ${PORT}`));