"use strict";

const assert = require("assert");
const dns = require("dns");
const http = require("http");
const net = require("net");
const tls = require("tls");

const SENTINEL = "SENTINEL-MEDAL-RECIPIENT-TOKEN";

// cacheManager reads API_TOKEN when it is first required.
process.env.API_TOKEN = SENTINEL;

const cacheManager = require("./cacheManager");

const rosterResponses = {
  "/api/v1/roster/1/lite": {
    profiles: {
      1001: {
        user: {
          userId: "1001",
          username: "Combat.C",
        },
        rank: {
          rankShort: "SPC",
          rankFull: "Specialist",
        },
        realName: "Casey Combat",
        roster: "ROSTER_TYPE_COMBAT",
        primary: {
          positionTitle: "Trooper",
        },
      },
    },
  },

  "/api/v1/roster/2/lite": {
    profiles: {
      1002: {
        user: {
          userId: "1002",
          username: "Reserve.R",
        },
        rank: {
          rankShort: "SGT",
          rankFull: "Sergeant",
        },
        realName: "Riley Reserve",
        roster: "ROSTER_TYPE_RESERVE",
        primary: {
          positionTitle: "Reservist",
        },
      },
    },
  },

  "/api/v1/roster/3/lite": {
    profiles: {
      1003: {
        user: {
          userId: "1003",
          username: "Eloa.E",
        },
        rank: {
          rankShort: "CPL",
          rankFull: "Corporal",
        },
        realName: "Elliot Eloa",
        roster: "ROSTER_TYPE_ELOA",
        primary: {
          positionTitle: "ELOA",
        },
      },
    },
  },

  "/api/v1/roster/4/lite": {
    profiles: {
      1004: {
        user: {
          userId: "1004",
          username: "Honor.H",
        },
        rank: {
          rankShort: "1SG",
          rankFull: "First Sergeant",
        },
        realName: "Harper Honor",
        roster: "ROSTER_TYPE_WALL_OF_HONOR",
        primary: {
          positionTitle: "Wall of Honor",
        },
      },
    },
  },

  "/api/v1/roster/6/lite": {
    profiles: {
      1005: {
        user: {
          userId: "1005",
          username: "Retired.R",
        },
        rank: {
          rankShort: "MAJ",
          rankFull: "Major",
        },
        realName: "Robin Retired",
        roster: "ROSTER_TYPE_PAST_MEMBERS",
        primary: {
          positionTitle: "Retired",
        },
      },

      1006: {
        user: {
          userId: "1006",
          username: "Discharged.D",
        },
        rank: {
          rankShort: "CPL",
          rankFull: "Corporal",
        },
        realName: "Dana Discharged",
        roster: "ROSTER_TYPE_PAST_MEMBERS",
        primary: {
          positionTitle: "Discharged",
        },
      },

      1007: {
        user: {
          userId: "1007",
          username: "Dishonorable.D",
        },
        rank: {
          rankShort: "PVT",
          rankFull: "Private",
        },
        realName: "Drew Dishonorable",
        roster: "ROSTER_TYPE_PAST_MEMBERS",
        primary: {
          positionTitle: "Dishonorably Discharged",
        },
      },
    },
  },
};

const startStub = async () => {
  const requestsSeen = [];
  const authHeadersSeen = [];

  const server = http.createServer((req, res) => {
    requestsSeen.push(req.url);
    authHeadersSeen.push(req.headers.authorization);

    const response = rosterResponses[req.url];

    if (!response) {
      res.writeHead(404, {
        "Content-Type": "application/json",
      });

      res.end('{"error":"not found"}');
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(JSON.stringify(response));
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  return {
    server,
    port: server.address().port,
    requestsSeen,
    authHeadersSeen,
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
  const { server, port, requestsSeen, authHeadersSeen } = await startStub();

  const restoreNetwork = redirectUpstreamTo(port);

  try {
    await cacheManager.updateMedalRecipientRosterCache();

    const result = cacheManager.getCachedMedalRecipientRoster();

    assert.ok(
      result,
      "expected a cached Medal Recommendation recipient roster",
    );

    assert.deepStrictEqual(
      [...requestsSeen].sort(),
      [
        "/api/v1/roster/1/lite",
        "/api/v1/roster/2/lite",
        "/api/v1/roster/3/lite",
        "/api/v1/roster/4/lite",
        "/api/v1/roster/6/lite",
      ],
      "expected all five required lite rosters to be fetched",
    );

    assert.ok(
      authHeadersSeen.every((header) => header === `Bearer ${SENTINEL}`),
      "expected every roster request to use the configured API token",
    );

    assert.deepStrictEqual(
      Object.keys(result.profiles).sort(),
      ["1001", "1002", "1003", "1004", "1005"],
      "expected Combat, Reserve, ELOA, Wall of Honor, and Retired recipients only",
    );

    assert.strictEqual(
      result.profiles["1001"].roster,
      "ROSTER_TYPE_COMBAT",
      "expected Combat roster status to be preserved",
    );

    assert.strictEqual(
      result.profiles["1002"].roster,
      "ROSTER_TYPE_RESERVE",
      "expected Reserve roster status to be preserved",
    );

    assert.strictEqual(
      result.profiles["1003"].roster,
      "ROSTER_TYPE_ELOA",
      "expected ELOA roster status to be preserved",
    );

    assert.strictEqual(
      result.profiles["1004"].roster,
      "ROSTER_TYPE_WALL_OF_HONOR",
      "expected Wall of Honor roster status to be preserved",
    );

    assert.strictEqual(
      result.profiles["1005"].roster,
      "ROSTER_TYPE_PAST_MEMBERS",
      "expected Retired members to preserve the Past Members roster status",
    );

    assert.strictEqual(
      result.profiles["1005"].primary.positionTitle,
      "Retired",
      "expected the Retired classification to be preserved",
    );

    assert.ok(
      !result.profiles["1006"],
      "expected Discharged Past Members to be excluded",
    );

    assert.ok(
      !result.profiles["1007"],
      "expected Dishonorably Discharged Past Members to be excluded",
    );

    console.log(
      "cacheManager: Medal recipient roster includes supported recipient pools only — OK",
    );
  } finally {
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
