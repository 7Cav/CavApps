const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { runSnapshot } = require("../controllers/diffPoller");
const { RANK_SHORT } = require("../db/milpacDb");

// Build the rank-ordering payload the frontend's groupEvents.js consumes
// (Map<rankShort, rankDisplayOrder>, lower = more senior). The 7Cav rank_id
// already encodes seniority order, so we reuse it directly as the display
// order. Computed once at module load — RANK_SHORT is a static table.
const RANKS_PAYLOAD = Object.entries(RANK_SHORT).map(([rankId, rankShort]) => ({
  rankShort,
  rankDisplayOrder: parseInt(rankId, 10),
}));

const VALID_ROSTER_TYPES = new Set([
  "ROSTER_TYPE_COMBAT",
  "ROSTER_TYPE_RESERVE",
  "ROSTER_TYPE_ELOA",
  "ROSTER_TYPE_WALL_OF_HONOR",
  "ROSTER_TYPE_ARLINGTON",
  "ROSTER_TYPE_PAST_MEMBERS",
]);

// A YYYY-MM-DD string naming a day on the calendar. Date rolls 2026-02-30 over
// to 2026-03-02, so the parsed day has to print back as the same string.
function isCalendarDay(value) {
  const day = new Date(`${value}T00:00:00Z`);
  return !isNaN(day) && day.toISOString().slice(0, 10) === value;
}

function parseRosterType(query) {
  const rt = query?.roster_type;
  if (!rt) return null;
  if (!VALID_ROSTER_TYPES.has(rt)) return "INVALID";
  return rt;
}

// GET /diffs — returns all roster types; frontend filters client-side
router.get("/diffs", async (req, res) => {
  const summaries = await db.listDiffs(600);
  res.json(summaries);
});

// GET /diffs/range?from=YYYY-MM-DD&to=YYYY-MM-DD[&roster_type=X]
// MUST be registered before /diffs/:date to avoid Express capturing "range" as the date param
router.get("/diffs/range", async (req, res) => {
  const { from, to } = req.query;
  if (!to) return res.status(400).json({ error: "to query param required" });
  if (!isCalendarDay(to))
    return res.status(400).json({ error: "to must be YYYY-MM-DD" });
  if (from != null && !isCalendarDay(from))
    return res.status(400).json({ error: "from must be YYYY-MM-DD" });
  const rosterType = parseRosterType(req.query);
  if (rosterType === "INVALID")
    return res.status(400).json({ error: "invalid roster_type" });
  const result = await db.eventsForDateRange(from ?? null, to, rosterType);
  res.json(result);
});

// GET /diffs/:date[?roster_type=X]
router.get("/diffs/:date", async (req, res) => {
  const { date } = req.params;
  if (!isCalendarDay(date))
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  const rosterType = parseRosterType(req.query);
  if (rosterType === "INVALID")
    return res.status(400).json({ error: "invalid roster_type" });
  const result = await db.eventsForDate(date, rosterType);
  res.json(result);
});

// GET /ranks — rank-ordering table (rankShort + rankDisplayOrder) the frontend
// uses to sort events by seniority. Derived from the static 7Cav rank table.
router.get("/ranks", (req, res) => {
  res
    .set("Cache-Control", "public, max-age=3600")
    .json({ ranks: RANKS_PAYLOAD });
});

// POST /admin/snapshot — trigger a manual snapshot fetch for all roster types
// In-flight guard: reject concurrent requests so the endpoint can't be spammed
let snapshotRunning = false;
router.post("/admin/snapshot", (req, res) => {
  if (snapshotRunning) {
    return res.status(429).json({ error: "snapshot already in progress" });
  }
  snapshotRunning = true;
  runSnapshot()
    .catch((err) =>
      console.error("admin/snapshot: manual run failed:", err.message || err),
    )
    .finally(() => {
      snapshotRunning = false;
    });
  res.json({ status: "snapshot triggered" });
});

// GET /admin/runs?limit=N — recent snapshot runs (status, reason) for operator
// visibility into rejected/bootstrap/ok ticks. Default 50, hard cap 500.
router.get("/admin/runs", async (req, res) => {
  const raw = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 500) : 50;
  const rows = await db.recentRuns(limit);
  res.json(rows);
});

router.get("/userSearch", async (req, res) => {
  const searchTerm = req.query.q;

  // Require a plain string of at least 3 chars. Array params (?q[]=) would
  // otherwise pass the length check and then throw inside .replace().
  if (typeof searchTerm !== "string" || searchTerm.length < 3) {
    return res.json([]);
  }

  const foundUsers = await db.searchUserTable(searchTerm);
  if (!foundUsers) {
    return res.status(500).json({ error: "Search failed" });
  }
  return res.json(foundUsers);
});

module.exports = router;
