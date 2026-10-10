const { Pool } = require("pg");
const path = require("path");
const { runner: migrate } = require("node-pg-migrate");

let pool;

async function initDatabase() {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // Postgres can close a connection while it sits idle in the pool: a restart,
  // a failover, pg_terminate_backend, or a network drop. pg-pool drops that
  // client, opens a new one on the next query, and emits 'error' on the pool.
  // Unlistened, that event exits the process and takes every route with it.
  pool.on("error", (err) => {
    console.error("Postgres closed an idle pooled connection:", err.message);
  });
  await pool.query("SELECT 1"); // ping

  await migrate({
    databaseUrl: process.env.DATABASE_URL,
    migrationsTable: "pgmigrations",
    dir: path.join(__dirname, "migrations"),
    direction: "up",
    log: (msg) => console.log("[migrate]", msg),
  });

  console.log("Database ready.");
}

function getPool() {
  return pool;
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function insertSnapshotRun(
  client,
  { rosterType, profileCount, status, reason = "" },
) {
  const res = await client.query(
    `INSERT INTO snapshot_runs (roster_type, profile_count, status, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [rosterType, profileCount, status, reason],
  );
  return res.rows[0].id;
}

async function recentRuns(limit = 50) {
  const res = await pool.query(
    `SELECT id, fetched_at, roster_type, profile_count, status, reason
     FROM snapshot_runs
     ORDER BY id DESC
     LIMIT $1`,
    [limit],
  );
  return res.rows;
}

async function bulkInsertEvents(client, runId, events) {
  if (!events.length) return;

  const cols = [
    "snapshot_run_id",
    "event_type",
    "profile_id",
    "profile_name",
    "rank_short",
    "rank_image_url",
    "old_value",
    "new_value",
    "record_date",
    "detail",
    "position_title",
  ];
  const COLS_PER_ROW = cols.length;
  const CHUNK_SIZE = Math.floor(65000 / COLS_PER_ROW);

  for (let offset = 0; offset < events.length; offset += CHUNK_SIZE) {
    const chunk = events.slice(offset, offset + CHUNK_SIZE);
    const placeholders = [];
    const values = [];
    let idx = 1;

    for (const e of chunk) {
      const recordDate =
        e.record_date && e.record_date !== "" ? e.record_date : null;
      placeholders.push(
        `($${idx},$${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6},$${idx + 7},$${idx + 8},$${idx + 9},$${idx + 10})`,
      );
      values.push(
        runId,
        e.event_type,
        e.profile_id,
        e.profile_name,
        e.rank_short || "",
        e.rank_image_url || "",
        e.old_value || "",
        e.new_value || "",
        recordDate,
        e.detail || "",
        e.position_title || "",
      );
      idx += COLS_PER_ROW;
    }

    await client.query(
      `INSERT INTO diff_events (${cols.join(",")}) VALUES ${placeholders.join(",")}`,
      values,
    );
  }
}

async function listDiffs(limit = 600) {
  // One row per (run, event_type) — frontend aggregates into heatmap buckets
  // and reads only fetched_at + roster_type + counts.
  const res = await pool.query(
    `
    SELECT s.id, s.fetched_at, s.roster_type, e.event_type, COUNT(*) as cnt
    FROM snapshot_runs s
    JOIN diff_events e ON e.snapshot_run_id = s.id
    GROUP BY s.id, s.fetched_at, s.roster_type, e.event_type
    ORDER BY s.fetched_at DESC
    LIMIT $1
  `,
    [limit * 50],
  );

  const summaryMap = {};
  const order = [];

  for (const row of res.rows) {
    const sid = row.id;
    if (!summaryMap[sid]) {
      summaryMap[sid] = {
        snapshot_id: sid,
        fetched_at: row.fetched_at,
        roster_type: row.roster_type,
        counts: {},
      };
      order.push(sid);
    }
    summaryMap[sid].counts[row.event_type] =
      (summaryMap[sid].counts[row.event_type] || 0) + parseInt(row.cnt, 10);
  }

  return order.slice(0, limit).map((id) => summaryMap[id]);
}

async function eventsForDate(dateStr, rosterType = null) {
  const result = await eventsForDateRange(dateStr, dateStr, rosterType);
  return { date: dateStr, counts: result.counts, events: result.events };
}

async function eventsForDateRange(fromStr, toStr, rosterType = null) {
  const to = new Date(toStr + "T23:59:59.999Z");

  const qParams = [];
  let fromCondition = "";
  if (fromStr) {
    qParams.push(new Date(fromStr + "T00:00:00Z"));
    fromCondition = `s.fetched_at >= $${qParams.length} AND `;
  }
  qParams.push(to);
  const toCondition = `s.fetched_at <= $${qParams.length}`;

  let rosterClause = "";
  if (rosterType) {
    qParams.push(rosterType);
    rosterClause = `AND s.roster_type = $${qParams.length}`;
  }

  const res = await pool.query(
    `
    SELECT e.event_type, e.profile_id, e.profile_name, e.rank_short, e.rank_image_url,
           e.old_value, e.new_value,
           COALESCE(TO_CHAR(e.record_date, 'YYYY-MM-DD'), '') as record_date,
           e.detail, e.position_title,
           s.roster_type,
           TO_CHAR(s.fetched_at, 'YYYY-MM-DD') as snapshot_date
    FROM diff_events e
    JOIN snapshot_runs s ON s.id = e.snapshot_run_id
    WHERE ${fromCondition}${toCondition}
    ${rosterClause}
    ORDER BY s.fetched_at DESC, e.event_type, e.profile_name
  `,
    qParams,
  );

  const events = res.rows;
  const counts = {};
  for (const e of events)
    counts[e.event_type] = (counts[e.event_type] || 0) + 1;

  return { from: fromStr ?? null, to: toStr, counts, events };
}

async function writeUserTable(usernames) {
  console.log("Updating username cache...");

  if (!Array.isArray(usernames) || usernames.length === 0) {
    console.error(
      `writeUserTable: expected a non-empty array of users, got`,
      usernames,
    );
    return;
  }

  const flattenedUsers = usernames.map((u) => u.username);

  // Run the whole transaction on a single checked-out client so it stays
  // atomic — withTransaction handles BEGIN/COMMIT/ROLLBACK + release. The
  // error propagates (after rollback) for the caller's .catch() to log.
  await withTransaction(async (client) => {
    await client.query(
      `CREATE TABLE IF NOT EXISTS search_index (username TEXT)`,
    );
    await client.query(`TRUNCATE TABLE search_index`);
    await client.query(
      "INSERT INTO search_index (username) SELECT * FROM UNNEST($1::text[])",
      [flattenedUsers],
    );
  });

  console.log(`Sucessfully updated username cache`);
}

async function searchUserTable(query) {
  const db = getPool();

  // basic Postgres sanitization
  const sanitizedSearch = query
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");

  const results = await db.query(
    "SELECT username FROM search_index WHERE username ILIKE $1 ESCAPE '\\' LIMIT 11",
    [`${sanitizedSearch}%`],
  );

  let usernames = results.rows.map((row) => row.username);

  if (usernames.length >= 11) {
    usernames.pop();
    usernames.push("...");
  }

  return usernames;
}

module.exports = {
  initDatabase,
  getPool,
  withTransaction,
  insertSnapshotRun,
  recentRuns,
  bulkInsertEvents,
  listDiffs,
  eventsForDate,
  eventsForDateRange,
  writeUserTable,
  searchUserTable,
};
