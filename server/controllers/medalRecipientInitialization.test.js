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
  const pendingMedalResponses = [];

  let resolveMedalRequestStarted;
  const medalRequestStarted = new Promise((resolve) => {
    resolveMedalRequestStarted = resolve;
  });

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

    // Medal-specific roster requests deliberately remain pending.
    // initializeCache must be able to finish without waiting for them.
    if (
      req.url === "/api/v1/roster/1/lite" ||
      req.url === "/api/v1/roster/2/lite" ||
      req.url === "/api/v1/roster/3/lite" ||
      req.url === "/api/v1/roster/4/lite" ||
      req.url === "/api/v1/roster/6/lite"
    ) {
      resolveMedalRequestStarted();
      pendingMedalResponses.push(res);
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
    medalRequestStarted,
    releaseMedalRequests() {
      for (const res of pendingMedalResponses.splice(0)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end('{"error":"medal recipient source unavailable"}');
      }
    },
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
  const {
    server,
    port,
    requestsSeen,
    medalRequestStarted,
    releaseMedalRequests,
  } = await startStub();

  const restoreNetwork = redirectUpstreamTo(port);

  // initializeCache normally schedules future refreshes. Suppress the real
  // timers so this test can finish immediately.
  const realSetTimeout = global.setTimeout;
  global.setTimeout = () => 1;

  // A Medal cache problem must not reach process.exit.
  const realExit = process.exit;
  let exitCalled = false;

  process.exit = () => {
    exitCalled = true;
    throw new Error(
      "process.exit must not be called for a Medal recipient cache problem",
    );
  };

  // Require after API_TOKEN and test seams are configured.
  const cacheManager = require("./cacheManager");

  let initializationPromise;

  try {
    initializationPromise = cacheManager.initializeCache();

    // Startup-critical cache initialization must finish even though the
    // Medal recipient requests are still pending.
    await Promise.race([
      initializationPromise,
      new Promise((_, reject) => {
        realSetTimeout(() => {
          reject(
            new Error(
              "initializeCache waited for the Medal recipient cache to finish",
            ),
          );
        }, 1000);
      }),
    ]);

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

    // The initial Medal refresh should still be started; it simply must not
    // block the startup-critical initialization path.
    await Promise.race([
      medalRequestStarted,
      new Promise((_, reject) => {
        realSetTimeout(() => {
          reject(
            new Error(
              "expected initialization to start the Medal recipient cache refresh",
            ),
          );
        }, 500);
      }),
    ]);

    assert.strictEqual(
      exitCalled,
      false,
      "expected a pending Medal recipient cache not to terminate CavApps",
    );

    assert.strictEqual(
      cacheManager.getCachedMedalRecipientRoster(),
      undefined,
      "expected initializeCache to finish while the Medal recipient cache is still pending",
    );

    console.log(
      "cacheManager: Medal recipient initialization does not block startup - OK",
    );
  } finally {
    // Release any deliberately hanging requests before restoring the real
    // timers/network so the test does not leave open sockets behind.
    releaseMedalRequests();

    if (initializationPromise) {
      try {
        await initializationPromise;
      } catch {
        // Cleanup only. Any meaningful failure is reported by the assertions
        // above or by initializeCache's own fatal path.
      }
    }

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
