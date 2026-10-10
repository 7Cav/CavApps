"use strict";

/**
 * Regression test for the server exiting when Postgres closes an idle pooled
 * connection (#281). No test framework. Run it with `npm test` from server/ or
 * with the repo-root `npm test`.
 *
 * Postgres can end a connection that sits idle in the pool through a restart,
 * a failover, pg_terminate_backend, or a network drop. pg-pool then emits
 * 'error' on the pool. Before the fix nothing listened, so Node exited and
 * every route went down with it.
 *
 * The seam is the database module as the server uses it: initDatabase() at
 * startup, then listDiffs(), the query behind GET /diffs. CI has no Postgres,
 * so a fake that speaks just enough of the wire protocol stands in for it at
 * the network boundary. The fake doesn't parse SQL, and every query completes
 * with zero rows. It ends its connections the way pg_terminate_backend does,
 * with a FATAL 57P01 ErrorResponse followed by a close.
 *
 * initDatabase() also runs node-pg-migrate against the same URL, and the fake
 * has no schema to migrate, so the migrator is swapped for a no-op through the
 * module cache. The swap relies on the database module reaching the migrator
 * with require("node-pg-migrate") and its named `runner`. If that changes, the
 * real migrator runs against the fake and initDatabase() rejects. Answering
 * node-pg-migrate's own SQL from the fake would pin a third-party library's
 * query text instead.
 *
 * The test checks no log wording beyond the error's own message, and it reads
 * stdout and stderr at the stream level, so moving the log line between
 * console methods or streams leaves it green.
 */

const assert = require("assert");
const net = require("net");

// Unique to this test, so finding it in the log proves the pool reported the
// error the fake sent.
const TERMINATION_MESSAGE =
  "terminating connection due to administrator command (database.test)";

// Must precede the database module require below.
const migratorPath = require.resolve("node-pg-migrate", { paths: [__dirname] });
require.cache[migratorPath] = {
  id: migratorPath,
  filename: migratorPath,
  loaded: true,
  exports: { runner: async () => [] },
};

const db = require("./database");

const message = (type, body = Buffer.alloc(0)) => {
  const header = Buffer.alloc(5);
  header.write(type, 0, "latin1");
  header.writeInt32BE(4 + body.length, 1);
  return Buffer.concat([header, body]);
};
const cString = (s) => Buffer.from(`${s}\0`, "utf8");
const AUTHENTICATION_OK = message("R", Buffer.alloc(4));
const READY_FOR_QUERY = message("Z", Buffer.from("I"));
const COMMAND_COMPLETE = message("C", cString("SELECT 0"));

// Replies to each frontend message by type. Unlisted types get no reply.
const REPLIES = {
  Q: Buffer.concat([COMMAND_COMPLETE, READY_FOR_QUERY]), // simple query
  P: message("1"), // Parse → ParseComplete
  B: message("2"), // Bind → BindComplete
  D: message("n"), // Describe → NoData
  E: COMMAND_COMPLETE, // Execute
  S: READY_FOR_QUERY, // Sync
};

const startFakePostgres = async () => {
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});

    let pending = Buffer.alloc(0);
    let started = false;
    socket.on("data", (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      for (;;) {
        // The startup message has no type byte, only a length.
        const headerLength = started ? 5 : 4;
        if (pending.length < headerLength) return;
        const length = pending.readInt32BE(headerLength - 4);
        const total = headerLength - 4 + length;
        if (pending.length < total) return;
        const type = started ? String.fromCharCode(pending[0]) : null;
        pending = pending.subarray(total);

        if (!started) {
          started = true;
          socket.write(Buffer.concat([AUTHENTICATION_OK, READY_FOR_QUERY]));
        } else if (type === "X") {
          socket.end();
        } else if (REPLIES[type]) {
          socket.write(REPLIES[type]);
        }
      }
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  // What pg_terminate_backend does to each connection.
  const terminateAll = (text) => {
    const fields = Buffer.concat([
      Buffer.from("S"),
      cString("FATAL"),
      Buffer.from("V"),
      cString("FATAL"),
      Buffer.from("C"),
      cString("57P01"),
      Buffer.from("M"),
      cString(text),
      Buffer.from([0]),
    ]);
    const count = sockets.size;
    for (const socket of sockets) socket.end(message("E", fields));
    return count;
  };

  const close = () => new Promise((resolve) => server.close(resolve));

  return {
    url: `postgres://test@127.0.0.1:${server.address().port}/test`,
    terminateAll,
    close,
  };
};

// Replacing write with a synchronous append puts everything logged into the
// buffer the moment it's written, on either stream.
const captureOutput = () => {
  const realStdout = process.stdout.write;
  const realStderr = process.stderr.write;
  let captured = "";
  const append = (chunk) => {
    captured += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    return true;
  };
  process.stdout.write = append;
  process.stderr.write = append;
  return {
    read: () => captured,
    stop: () => {
      process.stdout.write = realStdout;
      process.stderr.write = realStderr;
      return captured;
    },
  };
};

const waitFor = async (condition, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return true;
};

const main = async () => {
  const fake = await startFakePostgres();
  process.env.DATABASE_URL = fake.url;
  const output = captureOutput();

  let terminated;
  let logged;
  let laterQuery;
  try {
    await db.initDatabase();
    // Leaves a client idle in the pool.
    await db.listDiffs();

    terminated = fake.terminateAll(TERMINATION_MESSAGE);
    logged = await waitFor(
      () => output.read().includes(TERMINATION_MESSAGE),
      5000,
    );

    laterQuery = await db.listDiffs().then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error }),
    );
  } finally {
    output.stop();
    // Rejects if the pool was already ended. The assertions below report that.
    await db
      .getPool()
      ?.end()
      .catch(() => {});
    await fake.close();
  }

  // --- control: without this, the rest passes for free ---------------------
  assert.ok(
    terminated > 0,
    "expected an idle pooled connection for the fake to terminate",
  );

  // --- the assertions -------------------------------------------------------
  assert.ok(
    logged,
    "expected the terminated connection's error message to be logged",
  );
  assert.ok(
    laterQuery.ok,
    `expected a query after the termination to succeed, it rejected with: ${laterQuery.error?.message}`,
  );

  console.log(
    "database: OK, queries keep working after Postgres terminates an idle pooled connection",
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
