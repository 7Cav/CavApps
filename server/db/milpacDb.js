const mysql = require("mysql2/promise");

// rank_id → abbreviated rank short (mirrors what the 7Cav API returns)
const RANK_SHORT = {
  1: "GA", // General of the Army
  2: "GEN",
  3: "LTG",
  4: "MG",
  5: "BG",
  6: "COL",
  7: "LTC",
  8: "MAJ",
  9: "CPT",
  10: "1LT",
  11: "2LT",
  12: "CSM",
  13: "SGM",
  14: "1SG",
  15: "MSG",
  16: "SFC",
  17: "SSG",
  18: "SGT",
  19: "CPL",
  20: "SPC",
  21: "PFC",
  22: "PVT",
  23: "RCT",
  26: "CW5",
  27: "CW4",
  28: "CW3",
  29: "CW2",
  30: "WO1",
  31: "AR",
  32: "TST",
};

// Mirrors the Go ImageURL() method:
// https://7cav.us/data/roster_ranks/{floor(rank_id/1000)}/{rank_id}.jpg?{rank_image}
function rankImageUrl(rankId, rankImage) {
  const group = Math.floor(rankId / 1000);
  return `https://7cav.us/data/roster_ranks/${group}/${rankId}.jpg?${rankImage}`;
}

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.XENFORO_DB_HOST || "localhost",
      port: parseInt(process.env.XENFORO_DB_PORT || "3306", 10),
      user: process.env.XENFORO_DB_USER,
      password: process.env.XENFORO_DB_PASSWORD,
      database: process.env.XENFORO_DB_NAME || "xenforo",
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

async function fetchRosterProfiles(rosterId) {
  const db = getPool();

  // Base query: users with rank, position, and realName field value
  const [users] = await db.query(
    `
    SELECT
      u.relation_id,
      u.user_id,
      u.username,
      u.rank_id,
      rk.title        AS rank_title,
      rk.rank_image   AS rank_image,
      u.position_id,
      p.position_title,
      fv.field_value  AS real_name
    FROM xf_nf_rosters_user u
    LEFT JOIN xf_nf_rosters_rank     rk ON rk.rank_id     = u.rank_id
    LEFT JOIN xf_nf_rosters_position p  ON p.position_id  = u.position_id
    LEFT JOIN xf_nf_rosters_field_value fv
      ON fv.relation_id = u.relation_id AND fv.field_id = 'realName'
    WHERE u.roster_id = ?
  `,
    [rosterId],
  );

  if (!users.length) return {};

  const relationIds = users.map((u) => u.relation_id);

  // Service records
  const [records] = await db.query(
    `
    SELECT sr.record_id, sr.relation_id, rt.title AS record_type,
           sr.details, sr.record_date
    FROM xf_nf_rosters_service_record sr
    LEFT JOIN xf_nf_rosters_record_type rt ON rt.record_type_id = sr.record_type_id
    WHERE sr.relation_id IN (?)
  `,
    [relationIds],
  );

  // Awards
  const [awards] = await db.query(
    `
    SELECT ua.record_id, ua.relation_id, a.title AS award_name,
           ua.details, ua.award_date
    FROM xf_nf_rosters_user_award ua
    LEFT JOIN xf_nf_rosters_award a ON a.award_id = ua.award_id
    WHERE ua.relation_id IN (?)
  `,
    [relationIds],
  );

  // Group records and awards by relation_id
  const recordsByRelation = {};
  for (const r of records) {
    (recordsByRelation[r.relation_id] ??= []).push(r);
  }
  const awardsByRelation = {};
  for (const a of awards) {
    (awardsByRelation[a.relation_id] ??= []).push(a);
  }

  // Build profiles map keyed by user_id (string) to match computeDiff expectations
  const profiles = {};
  for (const u of users) {
    const rid = u.rank_id;
    profiles[String(u.user_id)] = {
      rank: {
        rankId: rid,
        rankShort: RANK_SHORT[rid] ?? u.rank_title ?? "",
        rankFull: u.rank_title ?? "",
        rankImageUrl:
          rid && u.rank_image ? rankImageUrl(rid, u.rank_image) : "",
      },
      primary: {
        positionId: u.position_id,
        positionTitle: u.position_title ?? "",
      },
      realName: u.real_name ?? "",
      user: { username: u.username ?? "" },
      records: (recordsByRelation[u.relation_id] ?? []).map((r) => ({
        recordUid: String(r.record_id),
        recordType: r.record_type ?? "",
        recordDate: r.record_date
          ? new Date(r.record_date * 1000).toISOString().slice(0, 10)
          : "",
        recordDetails: r.details ?? "",
      })),
      awards: (awardsByRelation[u.relation_id] ?? []).map((a) => ({
        awardUid: String(a.record_id),
        awardName: a.award_name ?? "",
        awardDate: a.award_date
          ? new Date(a.award_date * 1000).toISOString().slice(0, 10)
          : "",
        awardDetails: a.details ?? "",
      })),
    };
  }

  return profiles;
}

async function fetchUsernames() {
  const mariaDB = getPool();

  // Every account with a roster row, on any roster. The 7Cav API loads a
  // profile by username through this same join, so these are exactly the
  // members whose uniform the Uniform Builder can load.
  try {
    const [usernames] = await mariaDB.query(
      `
      SELECT DISTINCT xu.username
      FROM xf_nf_rosters_user AS u
      JOIN xf_user AS xu ON xu.user_id = u.user_id
    `,
    );

    console.log(`userCache: Fetched ${usernames.length} valid members.`);

    return usernames;
  } catch (error) {
    console.error(`userCache fetch error: `, error.message);
    // Re-throw so the genuine MariaDB error surfaces to makeUserCache's
    // .catch(), rather than falling off the end and returning undefined
    // (which would trigger a misleading downstream TypeError in writeUserTable).
    throw error;
  }
}

module.exports = { fetchRosterProfiles, fetchUsernames, RANK_SHORT };
