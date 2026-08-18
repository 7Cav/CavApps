"use strict";

const assert = require("assert");

const cacheManager = require("../controllers/cacheManager");

const expectedRoster = {
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
};

cacheManager.getCachedMedalRecipientRoster = () => expectedRoster;

const router = require("./index");

const routeLayer = router.stack.find(
  (layer) =>
    layer.route &&
    layer.route.path === "/medal-recipients" &&
    layer.route.methods.get,
);

assert.ok(routeLayer, "expected GET /medal-recipients to be registered");

const handler = routeLayer.route.stack[0].handle;

let statusCode = 200;
let responseBody;

const req = {};

const res = {
  status(code) {
    statusCode = code;
    return this;
  },

  send(body) {
    responseBody = body;
    return this;
  },
};

const main = async () => {
  await handler(req, res);

  assert.strictEqual(
    statusCode,
    200,
    "expected the Medal recipient endpoint to return HTTP 200",
  );

  assert.deepStrictEqual(
    responseBody,
    expectedRoster,
    "expected the Medal recipient endpoint to return the cached recipient roster",
  );

  // An unavailable cache must fail clearly instead of returning an
  // empty-looking roster that could be mistaken for valid data.
  cacheManager.getCachedMedalRecipientRoster = () => undefined;

  statusCode = 200;
  responseBody = undefined;

  await handler(req, res);

  assert.strictEqual(
    statusCode,
    503,
    "expected an unavailable Medal recipient cache to return HTTP 503",
  );

  assert.strictEqual(
    responseBody,
    "Cache is empty",
    "expected the unavailable cache response to match the existing roster endpoint behavior",
  );

  console.log(
    "routes: GET /medal-recipients returns cached data and reports unavailable cache — OK",
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
