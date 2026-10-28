"use strict";

const assert = require("assert");
const { filterRetiredRoster } = require("./rosterFilters");

const pastMembersResponse = {
  profiles: {
    1001: {
      user: {
        userId: "1001",
        username: "Retired.R",
      },
      rank: {
        rankShort: "SGT",
        rankFull: "Sergeant",
      },
      realName: "Robert Retired",
      roster: "ROSTER_TYPE_PAST_MEMBERS",
      primary: {
        positionTitle: "Retired",
      },
    },

    1002: {
      user: {
        userId: "1002",
        username: "Discharged.D",
      },
      rank: {
        rankShort: "CPL",
        rankFull: "Corporal",
      },
      realName: "Daniel Discharged",
      roster: "ROSTER_TYPE_PAST_MEMBERS",
      primary: {
        positionTitle: "Discharged",
      },
    },

    1003: {
      user: {
        userId: "1003",
        username: "Dishonorable.D",
      },
      rank: {
        rankShort: "PVT",
        rankFull: "Private",
      },
      realName: "Donald Dishonorable",
      roster: "ROSTER_TYPE_PAST_MEMBERS",
      primary: {
        positionTitle: "Dishonorably Discharged",
      },
    },

    1004: {
      user: {
        userId: "1004",
        username: "WrongRoster.R",
      },
      rank: {
        rankShort: "SPC",
        rankFull: "Specialist",
      },
      realName: "Walter Wrongroster",
      roster: "ROSTER_TYPE_COMBAT",
      primary: {
        positionTitle: "Retired",
      },
    },
  },
};

const result = filterRetiredRoster(pastMembersResponse);

assert.deepStrictEqual(
  Object.keys(result.profiles),
  ["1001"],
  "expected only Retired Past Members to remain",
);

assert.strictEqual(
  result.profiles["1001"].user.username,
  "Retired.R",
  "expected the retired member to be preserved",
);

assert.strictEqual(
  result.profiles["1001"].roster,
  "ROSTER_TYPE_PAST_MEMBERS",
  "expected the original roster type to be preserved",
);

assert.strictEqual(
  result.profiles["1001"].primary.positionTitle,
  "Retired",
  "expected the Retired primary position to be preserved",
);

console.log("rosterFilters: only Retired Past Members are included — OK");
