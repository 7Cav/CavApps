"use strict";

/**
 * Which forum usernames reach the Uniform Builder's member search (#302).
 * No test framework. Run it with `npm test` from server/ or with the
 * repo-root `npm test`.
 *
 * fetchUsernames() fills the search index. A member belongs in it when the
 * Uniform Builder can load their uniform. The 7th Cavalry API loads a profile
 * by username by joining the member's roster row to xf_user. So every username
 * with a roster row is searchable, whatever characters it holds. A forum
 * account with no roster row is not.
 *
 * The seam is fetchUsernames() against a real MariaDB. The rule lives in the
 * SQL, so only a server that runs the query can say what it returns. The test
 * creates its own database on the server and drops it afterwards. Its tables
 * hold only the XenForo columns a lookup by username reads.
 *
 * MILPAC_TEST_DB_URL names the server, e.g. mysql://root:test@127.0.0.1:3306.
 * CI sets it. Locally the test skips without it. To run it locally, start a
 * MariaDB and set the URL to match:
 *   docker run --rm -d -p 3306:3306 -e MARIADB_ROOT_PASSWORD=test mariadb:11.8
 * Point it at a throwaway server only, never at the forum's.
 */

const assert = require("assert");
const mysql = require("mysql2/promise");

const SERVER_URL = process.env.MILPAC_TEST_DB_URL;
const DATABASE = `milpacdb_test_${process.pid}`;

const ROSTER = {
  combat: 1,
  reserve: 2,
  eloa: 3,
  wallOfHonor: 4,
  arlington: 5,
  pastMembers: 6,
};

// Each entry is a forum account and the rosters it has a row on.
const seedAccounts = async (admin, accounts) => {
  await admin.query("TRUNCATE xf_user");
  await admin.query("TRUNCATE xf_nf_rosters_user");
  for (const { username, rosters = [] } of accounts) {
    const [user] = await admin.query(
      "INSERT INTO xf_user (username) VALUES (?)",
      [username],
    );
    for (const rosterId of rosters) {
      await admin.query(
        "INSERT INTO xf_nf_rosters_user (roster_id, user_id) VALUES (?, ?)",
        [rosterId, user.insertId],
      );
    }
  }
};

// --- slices -----------------------------------------------------------------

const slices = [];
const slice = (name, run) => slices.push({ name, run });

slice(
  "a member whose username has a hyphen is searchable",
  async ({ seed, searchableUsernames }) => {
    await seed([
      { username: "Lethbridge-Stewart.J", rosters: [ROSTER.combat] },
      { username: "Doe.J", rosters: [ROSTER.combat] },
    ]);
    assert.deepStrictEqual(await searchableUsernames(), [
      "Doe.J",
      "Lethbridge-Stewart.J",
    ]);
  },
);

slice(
  "members whose usernames have an apostrophe or accent are searchable",
  async ({ seed, searchableUsernames }) => {
    await seed([
      { username: "O'Neil.P", rosters: [ROSTER.reserve] },
      { username: "Müller.K", rosters: [ROSTER.combat] },
    ]);
    assert.deepStrictEqual(await searchableUsernames(), [
      "Müller.K",
      "O'Neil.P",
    ]);
  },
);

slice(
  "a member on any roster is searchable",
  async ({ seed, searchableUsernames }) => {
    const accounts = Object.entries(ROSTER).map(([name, id]) => ({
      username: `${name}.X`,
      rosters: [id],
    }));
    await seed(accounts);
    assert.deepStrictEqual(
      await searchableUsernames(),
      accounts.map((a) => a.username).sort(),
    );
  },
);

slice(
  "a forum account with no roster row is not searchable",
  async ({ seed, searchableUsernames }) => {
    await seed([
      { username: "Doe.J", rosters: [ROSTER.combat] },
      { username: "Smith.J" },
    ]);
    assert.deepStrictEqual(await searchableUsernames(), ["Doe.J"]);
  },
);

slice(
  "a member on two rosters is searchable once",
  async ({ seed, searchableUsernames }) => {
    await seed([
      { username: "Doe.J", rosters: [ROSTER.reserve, ROSTER.pastMembers] },
    ]);
    assert.deepStrictEqual(await searchableUsernames(), ["Doe.J"]);
  },
);

// --- runner -----------------------------------------------------------------

const main = async () => {
  if (!SERVER_URL) {
    if (process.env.CI) {
      console.error("milpacDb: MILPAC_TEST_DB_URL is unset, CI must set it");
      process.exit(1);
    }
    console.log("skip - milpacDb: MILPAC_TEST_DB_URL is unset");
    return;
  }

  const url = new URL(SERVER_URL);
  const server = {
    host: url.hostname,
    port: parseInt(url.port || "3306", 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
  const admin = await mysql.createConnection(server);

  let failures = 0;
  try {
    await admin.query(
      `CREATE DATABASE ${DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
    );
    await admin.query(`USE ${DATABASE}`);
    await admin.query(`
      CREATE TABLE xf_user (
        user_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        UNIQUE KEY username (username)
      )
    `);
    await admin.query(`
      CREATE TABLE xf_nf_rosters_user (
        relation_id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        roster_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL
      )
    `);

    // milpacDb reads these when it opens its pool, on the first query.
    process.env.XENFORO_DB_HOST = server.host;
    process.env.XENFORO_DB_PORT = String(server.port);
    process.env.XENFORO_DB_USER = server.user;
    process.env.XENFORO_DB_PASSWORD = server.password;
    process.env.XENFORO_DB_NAME = DATABASE;
    const { fetchUsernames } = require("./milpacDb");

    const fixtures = {
      seed: (accounts) => seedAccounts(admin, accounts),
      searchableUsernames: async () =>
        (await fetchUsernames()).map((row) => row.username).sort(),
    };
    for (const { name, run } of slices) {
      try {
        await run(fixtures);
        console.log(`ok - milpacDb: ${name}`);
      } catch (error) {
        failures++;
        console.log(`not ok - milpacDb: ${name}\n${error.stack || error}`);
      }
    }
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS ${DATABASE}`);
    await admin.end();
  }
  if (failures) {
    console.error(`milpacDb: ${failures} of ${slices.length} failed`);
    process.exit(1);
  }
  // milpacDb's pool holds connections open, so leave without waiting on it.
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
