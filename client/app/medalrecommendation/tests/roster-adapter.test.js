import {
  describe,
  expect,
  test,
} from "vitest";

import {
  adaptMedalRoster,
} from "../lib/roster-adapter";

function makeProfile({
  username = "Kenton.W",
  realName = "Wade Kenton",
  rankShort = "CPL",
  rankFull = "Corporal",
  roster =
    "ROSTER_TYPE_COMBAT",
  primary = "D/2/B/2-7",
  secondaries = [],
} = {}) {
  return {
    user: {
      userId: "100",
      username,
    },

    rank: {
      rankShort,
      rankFull,
      rankId: "20",
      rankImageUrl: "",
    },

    realName,
    roster,

    primary: primary
      ? {
          positionTitle:
            primary,
          positionId: "1",
        }
      : null,

    secondaries:
      secondaries.map(
        (positionTitle, index) => ({
          positionTitle,
          positionId:
            String(index + 10),
        }),
      ),
  };
}

describe(
  "Medal Recommendation Aid — roster adapter",
  () => {
    test(
      "converts an API profile into Medal roster format",
      () => {
        const roster =
          adaptMedalRoster({
            1234: makeProfile({
              secondaries: [
                "S1 Operations",
                "S3 HLL Public",
              ],
            }),
          });

        expect(roster).toHaveLength(
          1,
        );

        expect(roster[0]).toEqual(
          expect.objectContaining({
            dropdownName:
              "CPL Kenton.W",

            rankAbbreviation:
              "CPL",

            rankLong:
              "Corporal",

            firstName:
              "Wade",

            lastName:
              "Kenton",

            fullName:
              "Wade Kenton",

            rosterName:
              "Kenton.W",

            userId: "100",

            milpacId: "1234",

            milpacsUrl:
              "https://7cav.us/rosters/profile/1234/",

            primaryBillet:
              "D/2/B/2-7",

            secondaryBillets: [
              "S1 Operations",
              "S3 HLL Public",
            ],
          }),
        );
      },
    );

    test(
      "keeps primary and secondary billets available",
      () => {
        const roster =
          adaptMedalRoster({
            1234: makeProfile({
              primary:
                "D/2/B/2-7",

              secondaries: [
                "S1 Operations",
                "S1 Operations",
                "S3 HLL Public",
              ],
            }),
          });

        expect(
          roster[0].billets,
        ).toEqual([
          "D/2/B/2-7",
          "S1 Operations",
          "S3 HLL Public",
        ]);

        expect(
          roster[0]
            .combinedBillets,
        ).toBe(
          "D/2/B/2-7, S1 Operations, S3 HLL Public",
        );
      },
    );

    test(
      "maps roster status correctly",
      () => {
        const roster =
          adaptMedalRoster({
            1: makeProfile({
              username: "Active.A",
              realName:
                "Adam Active",

              roster:
                "ROSTER_TYPE_COMBAT",
            }),

            2: makeProfile({
              username:
                "Reserve.R",

              realName:
                "Robert Reserve",

              roster:
                "ROSTER_TYPE_RESERVE",
            }),

            3: makeProfile({
              username: "Leave.E",
              realName:
                "Ethan Leave",

              roster:
                "ROSTER_TYPE_ELOA",
            }),

            4: makeProfile({
              username:
                "Retired.T",

              realName:
                "Thomas Retired",

              roster:
                "ROSTER_TYPE_PAST_MEMBERS",

              primary:
                "Retired",
            }),
          });

        const statuses =
          roster.map(
            (person) =>
              person.statusLong,
          );

        expect(statuses).toContain(
          "Active Duty",
        );

        expect(statuses).toContain(
          "Reserve",
        );

        expect(statuses).toContain(
          "ELOA",
        );

        expect(statuses).toContain(
          "Retired",
        );
      },
    );

    test(
      "drops incomplete profiles instead of passing invalid recipients to the engines",
      () => {
        const roster =
          adaptMedalRoster({
            1: makeProfile(),

            2: {
              user: null,
              rank: null,
              realName: "",
              primary: null,
              secondaries: [],
            },
          });

        expect(roster).toHaveLength(
          1,
        );
      },
    );
  },
);