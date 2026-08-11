"use strict";

/**
 * Regression test for the API_TOKEN log leak. No test framework — run with
 * `npm test` from server/, or via the repo-root `npm test`.
 *
 * The bug: passing a rejected axios error straight to console.error serialises
 * the whole error object, and that object carries the request headers. The
 * live bearer token lands in container stdout in plaintext.
 *
 * The seam is what a failed upstream call puts in the log, so the test drives
 * cacheManager's real exported functions against a stub upstream and asserts
 * on captured stderr. It deliberately does NOT assert log wording — only that
 * the token is absent — so rewording a message cannot break it.
 *
 * Redirection is done entirely from the test; no source file has a seam cut
 * into it for testability:
 *   - dns.lookup sends api.7cav.us to loopback.
 *   - tls.connect hands back a plain socket to a plain HTTP stub, faking the
 *     'secureConnect' the https Agent waits for. That keeps the real axios,
 *     axios-retry, ClientRequest and HTTP parser in the path (which is why
 *     request._header is populated at all) without this repo having to carry
 *     a TLS private key for tests.
 *
 * The token must be in process.env BEFORE cacheManager is required:
 * cacheManager.js reads API_TOKEN once, at module load. Require it earlier and
 * the token is empty and the whole suite passes for free — hence the controls
 * below, which fail if no token was ever actually sent.
 *
 * Left uncovered, deliberately: the two fatal-path handlers at
 * cacheManager.js:145 and server.js:115. Neither is reachable with an axios
 * error in production — every cache update swallows its own — so a test would
 * have to fake reachability to reach them. They were hardened anyway.
 */

const assert = require("assert");
const dns = require("dns");
const http = require("http");
const net = require("net");
const tls = require("tls");

const SENTINEL = "SENTINEL-API-TOKEN-DO-NOT-SHIP";

// Thrown by the stubbed process.exit below, and identity-checked rather than
// matched on its message, so the test pins no error string.
const PROCESS_EXIT_CALLED = new Error("process.exit called under test");

// Must precede the cacheManager require below.
process.env.API_TOKEN = SENTINEL;

const cacheManager = require("./cacheManager");

const startStub = async () => {
  const authHeadersSeen = [];
  const server = http.createServer((req, res) => {
    authHeadersSeen.push(req.headers.authorization);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end('{"error":"unauthorized"}');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, port: server.address().port, authHeadersSeen };
};

const redirectUpstreamTo = (port) => {
  const realLookup = dns.lookup;
  const realConnect = tls.connect;

  dns.lookup = function (hostname, options, callback) {
    if (hostname !== "api.7cav.us") return realLookup.apply(this, arguments);
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    return options && options.all
      ? callback(null, [{ address: "127.0.0.1", family: 4 }])
      : callback(null, "127.0.0.1", 4);
  };

  tls.connect = function (options, callback) {
    if (!options || Number(options.port) !== 443)
      return realConnect.call(this, options, callback);
    const socket = net.connect(port, "127.0.0.1");
    socket.on("connect", () => {
      socket.authorized = true;
      socket.encrypted = true;
      socket.getPeerCertificate = () => ({});
      socket.getSession = () => undefined;
      socket.getProtocol = () => "TLSv1.3";
      socket.isSessionReused = () => false;
      socket.emit("secureConnect");
    });
    if (typeof callback === "function") socket.once("secureConnect", callback);
    return socket;
  };

  return () => {
    dns.lookup = realLookup;
    tls.connect = realConnect;
  };
};

// console.error writes here; replacing write with a synchronous append means
// everything logged is in the buffer the moment an awaited call returns, so
// the assertions cannot race a pending flush.
const captureStderr = () => {
  const realWrite = process.stderr.write;
  let captured = "";
  process.stderr.write = (chunk) => {
    captured += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    return true;
  };
  return () => {
    process.stderr.write = realWrite;
    return captured;
  };
};

const main = async () => {
  const { server, port, authHeadersSeen } = await startStub();
  const restoreNetwork = redirectUpstreamTo(port);
  const stopCapture = captureStderr();

  let individualResult;
  let initializeRejection;
  let captured;

  try {
    // cacheManager.js:82
    individualResult = await cacheManager.updateCachedIndividual("nobody");

    // cacheManager.js:40, 59 and 106 are only reachable through
    // initializeCache, which calls process.exit(1) once it sees the cache is
    // unusable. Stub it to throw so the test survives to its assertions.
    // Consequence worth naming: that throw is caught by initializeCache's own
    // handler, so cacheManager.js:145 also runs here. It does not run in
    // production, where process.exit really does exit, and what it logs here
    // is a test-authored error rather than covered behaviour.
    const realExit = process.exit;
    process.exit = () => {
      throw PROCESS_EXIT_CALLED;
    };
    try {
      await cacheManager.initializeCache();
    } catch (error) {
      initializeRejection = error;
    } finally {
      process.exit = realExit;
    }
  } finally {
    captured = stopCapture();
    restoreNetwork();
    server.close();
  }

  // --- controls: without these, "no token in the log" passes for free ------
  assert.ok(
    authHeadersSeen.length > 0,
    "expected the upstream to have been called at all",
  );
  assert.ok(
    authHeadersSeen.every((header) => header === `Bearer ${SENTINEL}`),
    "expected every request to carry the sentinel bearer token",
  );
  assert.strictEqual(
    individualResult,
    null,
    "expected updateCachedIndividual to report failure by returning null",
  );
  assert.strictEqual(
    initializeRejection,
    PROCESS_EXIT_CALLED,
    "expected initializeCache to reach its process.exit, downstream of all three cache updates",
  );
  assert.ok(captured.length > 0, "expected the failures to have been logged");

  // --- the assertion -------------------------------------------------------
  assert.ok(
    !captured.includes(SENTINEL),
    `API_TOKEN leaked to stderr: the token appears ${
      captured.split(SENTINEL).length - 1
    } time(s) in ${captured.length} bytes of log output`,
  );

  console.log("cacheManager: no API_TOKEN in logs on upstream failure — OK");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
