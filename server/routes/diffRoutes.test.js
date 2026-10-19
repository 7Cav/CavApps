"use strict";

/**
 * The diff routes' answers to impossible dates and to a database that is down.
 * No test framework. Run with `npm test` from server/, or via the repo-root
 * `npm test`.
 *
 * The seam is the server's Express app over HTTP. It runs in a child process,
 * so the test reads the server's real stderr no matter what writes to it. The
 * child loads server.js without starting it, points the database module at a
 * stub Postgres in this process, and serves the app on a free port.
 *
 * The stub speaks just enough of the Postgres wire protocol to keep the real
 * pg driver in the path. It runs in one of two modes:
 *   - empty: accepts every connection and answers every query with no rows.
 *   - down: refuses every connection with a FATAL error whose message is
 *     DB_DOWN_SENTINEL, so the test can tell that error from anything else in
 *     a response body or the log.
 *
 * initDatabase() is the only way to point the database module at a server,
 * and it can't finish against the stub, because the migrations need a real
 * Postgres. It builds its pool before its first query, though, so the pool is
 * left aimed at the stub once it rejects. Production never serves in that
 * state, because `node server.js` exits instead. If initDatabase() stops
 * leaving a pool behind, the child exits before it listens and the test fails
 * at setup, saying so.
 */

const assert = require("assert");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const CLIENT_TOKEN = "test-client-token";
const DB_DOWN_SENTINEL = "SENTINEL-DB-DOWN";
const READY_MARKER = "diffRoutes.test: listening on port";
const NO_POOL_MARKER = "diffRoutes.test: initDatabase() left no pool";

// --- stub Postgres ----------------------------------------------------------

// A backend message: a type byte, then a length that counts itself.
const message = (type, body = Buffer.alloc(0)) => {
  const length = Buffer.alloc(4);
  length.writeInt32BE(body.length + 4);
  return Buffer.concat([Buffer.from(type), length, body]);
};
const cstring = (text) => Buffer.from(`${text}\0`);

const READY_FOR_QUERY = message("Z", Buffer.from("I"));
const NO_ROWS = message("C", cstring("SELECT 0"));

// What the empty stub sends back for each frontend message type pg uses.
const EMPTY_REPLIES = {
  Q: Buffer.concat([NO_ROWS, READY_FOR_QUERY]), // simple query
  P: message("1"), // Parse -> ParseComplete
  B: message("2"), // Bind -> BindComplete
  D: message("n"), // Describe -> NoData
  E: NO_ROWS, // Execute -> CommandComplete
  S: READY_FOR_QUERY, // Sync
};

const REFUSAL = message(
  "E",
  Buffer.concat([
    cstring("SFATAL"),
    cstring("C08006"),
    cstring(`M${DB_DOWN_SENTINEL}`),
    Buffer.from("\0"),
  ]),
);

const startPgStub = async (mode) => {
  const server = net.createServer((socket) => {
    socket.on("error", () => {});
    let pending = Buffer.alloc(0);
    let started = false;
    socket.on("data", (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      for (;;) {
        // The startup message has no type byte. Every later message has one.
        const header = started ? 5 : 4;
        if (pending.length < header) return;
        const total = pending.readInt32BE(header - 4) + header - 4;
        if (pending.length < total) return;
        const type = started ? String.fromCharCode(pending[0]) : null;
        pending = pending.subarray(total);

        if (!started) {
          started = true;
          if (mode === "down") return socket.end(REFUSAL);
          // AuthenticationOk, then ready.
          socket.write(
            Buffer.concat([message("R", Buffer.alloc(4)), READY_FOR_QUERY]),
          );
        } else if (type === "X") {
          return socket.end();
        } else if (EMPTY_REPLIES[type]) {
          socket.write(EMPTY_REPLIES[type]);
        }
      }
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `postgres://test:test@127.0.0.1:${server.address().port}/test`,
    stop: () => server.close(),
  };
};

// --- the app, in a child process --------------------------------------------

const HARNESS = `
const app = require("./server");
const db = require("./db/database");
db.initDatabase()
  .catch(() => {})
  .then(() => {
    if (!db.getPool()) {
      console.error(${JSON.stringify(NO_POOL_MARKER)});
      process.exit(2);
    }
    const listener = app.listen(0, "127.0.0.1", () => {
      console.error(${JSON.stringify(READY_MARKER)} + " " + listener.address().port);
    });
  });
`;

const startApp = async (databaseUrl) => {
  // A developer's PG* settings, PGSSLMODE among them, would change how pg
  // talks to the stub, so the child gets none of them.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("PG")),
  );
  const child = spawn(process.execPath, ["-e", HARNESS], {
    cwd: path.join(__dirname, ".."),
    env: { ...env, CLIENT_TOKEN, DATABASE_URL: databaseUrl },
    stdio: ["ignore", "ignore", "pipe"],
  });

  let stderr = "";
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener());
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
    notify();
  });
  child.on("exit", notify);

  // Resolves true once predicate() holds, or false after ms.
  const until = (predicate, ms) =>
    new Promise((resolve) => {
      const finish = (result) => {
        listeners.delete(check);
        clearTimeout(timer);
        resolve(result);
      };
      const check = () => predicate() && finish(true);
      const timer = setTimeout(() => finish(predicate()), ms);
      listeners.add(check);
      check();
    });

  const readyLine = new RegExp(`${READY_MARKER} (\\d+)\\n`);
  await until(() => readyLine.test(stderr) || child.exitCode !== null, 15000);
  const ready = readyLine.exec(stderr);
  if (!ready) {
    child.kill();
    throw new Error(`the app did not start. Its stderr:\n${stderr}`);
  }
  const port = ready[1];
  const logStart = ready.index + ready[0].length;

  // Only what the app logged after it started serving.
  const sentinelsLogged = () =>
    stderr.slice(logStart).split(DB_DOWN_SENTINEL).length - 1;

  return {
    get: async (pathname) => {
      const res = await fetch(`http://127.0.0.1:${port}${pathname}`, {
        headers: { Authorization: CLIENT_TOKEN },
      });
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      return { status: res.status, body };
    },
    sentinelsLogged,
    // Resolves true once the app has logged more than `count` sentinels.
    logsSentinelBeyond: (count, ms) =>
      until(() => sentinelsLogged() > count, ms),
    stop: () => child.kill(),
  };
};

// --- slices -----------------------------------------------------------------

const slices = [];
const slice = (name, run) => slices.push({ name, run });

slice("a month past 12 gets the bad-date 400", async ({ empty }) => {
  assert.deepStrictEqual(await empty.get("/diffs/2026-13-45"), {
    status: 400,
    body: { error: "date must be YYYY-MM-DD" },
  });
});

slice(
  "a day past the end of its month gets the bad-date 400",
  async ({ empty }) => {
    for (const date of ["2026-02-30", "2026-04-31", "2025-02-29"]) {
      assert.deepStrictEqual(
        await empty.get(`/diffs/${date}`),
        { status: 400, body: { error: "date must be YYYY-MM-DD" } },
        date,
      );
    }
  },
);

slice("a leap day is served like any other day", async ({ empty }) => {
  const { status, body } = await empty.get("/diffs/2024-02-29");
  assert.strictEqual(status, 200);
  assert.strictEqual(body.date, "2024-02-29");
});

slice(
  "a range ending on an impossible day gets the bad-to 400",
  async ({ empty }) => {
    assert.deepStrictEqual(await empty.get("/diffs/range?to=2026-02-30"), {
      status: 400,
      body: { error: "to must be YYYY-MM-DD" },
    });
  },
);

slice(
  "a range starting in month 00 gets the bad-from 400",
  async ({ empty }) => {
    assert.deepStrictEqual(
      await empty.get("/diffs/range?from=2026-00-01&to=2026-03-01"),
      { status: 400, body: { error: "from must be YYYY-MM-DD" } },
    );
  },
);

const DB_ROUTES = [
  "/diffs",
  "/diffs/2026-03-02",
  "/diffs/range?to=2026-03-02",
  "/admin/runs",
  "/userSearch?q=abc",
];

slice(
  "with the database down, each route answers a bare 500",
  async ({ down }) => {
    for (const route of DB_ROUTES) {
      assert.deepStrictEqual(
        await down.get(route),
        { status: 500, body: { error: "internal error" } },
        route,
      );
    }
  },
);

// Each request's log line must arrive before the next request goes out, so a
// late line from one route can't be credited to the next.
slice(
  "with the database down, each route logs the database error",
  async ({ down }) => {
    for (const route of DB_ROUTES) {
      const before = down.sentinelsLogged();
      await down.get(route);
      assert.ok(
        await down.logsSentinelBeyond(before, 2000),
        `${route}: the database error never reached stderr`,
      );
    }
  },
);

// --- runner -----------------------------------------------------------------

const main = async () => {
  const emptyDb = await startPgStub("empty");
  const downDb = await startPgStub("down");
  const apps = {};
  let failures = 0;
  try {
    apps.empty = await startApp(emptyDb.url);
    apps.down = await startApp(downDb.url);
    for (const { name, run } of slices) {
      try {
        await run(apps);
        console.log(`ok - diffRoutes: ${name}`);
      } catch (error) {
        failures++;
        console.log(`not ok - diffRoutes: ${name}\n${error.stack || error}`);
      }
    }
  } finally {
    Object.values(apps).forEach((app) => app.stop());
    emptyDb.stop();
    downDb.stop();
  }
  if (failures) {
    console.error(`diffRoutes: ${failures} of ${slices.length} failed`);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
