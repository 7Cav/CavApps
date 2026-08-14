"use strict";

const assert = require("assert");
const dns = require("dns");
const http = require("http");
const net = require("net");
const tls = require("tls");

const SENTINEL = "SENTINEL-MEDAL-INIT-TOKEN";

// cacheManager reads API_TOKEN when the module is loaded.
process.env.API_TOKEN = SENTINEL;

const startStub = async () => {
  const requestsSeen = [];

  const server = http.createServer((req, res) => {
    requestsSeen.push(req.url);

    // Existing startup-critical caches succeed.
    if (req.url === "/api/v1/roster/1") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"profiles":{}}');
      return;
    }

    if (req.url === "/api/v1/roster/2") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"profiles":{}}');
      return;
    }

    if (req.url === "/api/v1/milpacs/position/groups") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"groups":[]}');
      return;
    }

    // The Medal-specific roster calls deliberately fail.
    // This simulates the Medal recipient source being unavailable while
    // the rest of CavApps' required cache sources remain healthy.
    if (
      req.url === "/api/v1/roster/1/lite" ||
      req.url === "/api/v1/roster/2/lite" ||
      req.url === "/api/v1/roster/3/lite" ||
      req.url === "/api/v1/roster/4/lite" ||
      req.url === "/api/v1/roster/6/lite"
    ) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end('{"error":"medal recipient source unavailable"}');
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end('{"error":"not found"}');
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  return {
    server,
    port: server.address().port,
    requestsSeen,
  };
};

const redirectUpstreamTo = (port) => {
  const realLookup = dns.lookup;
  const realConnect = tls.connect;

  dns.lookup = function (hostname, options, callback) {
    if (hostname !== "api.7cav.us") {
      return realLookup.apply(this, arguments);
    }

    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    return options && options.all
      ? callback(null, [
          {
            address: "127.0.0.1",
            family: 4,
          },
        ])
      : callback(null, "127.0.0.1", 4);
  };

  tls.connect = function (options, callback) {
    if (!options || Number(options.port) !== 443) {
      return realConnect.call(this, options, callback);
    }

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

    if (typeof callback === "function") {
      socket.once("secureConnect", callback);
    }

    return socket;
  };

  return () => {
    dns.lookup = realLookup;
    tls.connect = realConnect;
  };
};

const main = async () => {
  const { server, port, requestsSeen } = await startStub();

  const restoreNetwork = redirectUpstreamTo(port);

  // initializeCache normally schedules future refreshes. Suppress the real
  // timers so this test can finish immediately.
  const realSetTimeout = global.setTimeout;
  global.setTimeout = () => 1;

  // A Medal cache failure must not reach process.exit.
  const realExit = process.exit;
  let exitCalled = false;

  process.exit = () => {
    exitCalled = true;
    throw new Error(
      "process.exit must not be called for a Medal recipient cache failure",
    );
  };

  // Require after API_TOKEN and test seams are configured.
  const cacheManager = require("./cacheManager");

  try {
    await cacheManager.initializeCache();

    assert.ok(
      requestsSeen.includes("/api/v1/roster/1"),
      "expected the existing Combat cache to initialize",
    );

    assert.ok(
      requestsSeen.includes("/api/v1/roster/2"),
      "expected the existing Reserve cache to initialize",
    );

    assert.ok(
      requestsSeen.includes("/api/v1/milpacs/position/groups"),
      "expected the existing Groups cache to initialize",
    );

    assert.ok(
      requestsSeen.includes("/api/v1/roster/1/lite"),
      "expected initialization to attempt the Medal recipient cache",
    );

    assert.strictEqual(
      exitCalled,
      false,
      "expected a Medal recipient cache failure not to terminate CavApps",
    );

    assert.strictEqual(
      cacheManager.getCachedMedalRecipientRoster(),
      undefined,
      "expected the unavailable Medal recipient cache to remain unavailable",
    );

    console.log(
      "cacheManager: Medal recipient initialization failure is non-fatal — OK",
    );
  } finally {
    process.exit = realExit;
    global.setTimeout = realSetTimeout;
    restoreNetwork();

    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
