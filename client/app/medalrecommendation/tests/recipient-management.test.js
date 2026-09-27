import {
  buildRecipientOrganizations,
  clearShownRecipients,
  filterRecipients,
  getCitationName,
  getRecipientDisplayName,
  getRecipientIdentity,
  getOperationGroupRecipientWarning,
  matchPastedRecipients,
  orderRecipientsForRecommendation,
  resolveRecommendationRecipientSubject,
  selectShownRecipients,
  uniqueRecipients,
  validateRecipientEntries,
} from "../lib/recipient-utils";
import { hasRecipientIdentity } from "../lib/narrative-validation";
import { resolveMedalWorksheet } from "../lib/worksheet-profiles";
import { OPERATION_MEDALS } from "../lib/medal-definitions";
import { SERVICE_MEDALS } from "../lib/service-medal-definitions";
import { makeRecipient } from "./test-helpers";

const kenton = makeRecipient({
  user: { userId: "k", username: "Kenton.W" },
  rank: { rankFull: "Staff Sergeant", rankShort: "SSG" },
  realName: "Wade Kenton",
  primary: { positionId: "dev", positionTitle: "Development Lead" },
  secondaries: [{ positionId: "intel", positionTitle: "Intelligence Clerk" }],
});
const jane = makeRecipient({
  user: { userId: "j", username: "Doe.J" },
  realName: "Jane Doe",
  primary: { positionId: "intel", positionTitle: "Analyst" },
});
const otherJane = makeRecipient({
  user: { userId: "j2", username: "Doe.J2" },
  realName: "Jane Doe",
});
const roster = [kenton, jane, otherJane];
const groups = [
  { groupTitle: "Intelligence", positions: [{ positionId: "intel" }] },
  { groupTitle: "Development", positions: [{ positionId: "dev" }] },
  { groupTitle: "Empty", positions: [{ positionId: "elsewhere" }] },
];
const currentPolicy = resolveMedalWorksheet(
  OPERATION_MEDALS[0],
).recipientPolicy;
const entries = (members) => members.map((member) => ({ member }));

describe("recommendation recipient ordering", () => {
  test("orders numeric and string rank IDs by seniority without mutating the input or recipients", () => {
    const specialist = makeRecipient({
      realName: "Tim Rhone",
      rank: { rankId: "20", rankFull: "Specialist" },
    });
    const captain = makeRecipient({
      realName: "Brent Swanson",
      rank: { rankId: "9", rankFull: "Captain" },
    });
    const sergeant = makeRecipient({
      realName: "Wade Kenton",
      rank: { rankId: 17, rankFull: "Staff Sergeant" },
    });
    const lieutenant = makeRecipient({
      realName: "Darek Hazen",
      rank: { rankId: 10, rankFull: "First Lieutenant" },
    });
    const members = [specialist, captain, sergeant, lieutenant];
    for (const member of members) {
      Object.freeze(member.rank);
      Object.freeze(member);
    }
    Object.freeze(members);

    const ordered = orderRecipientsForRecommendation(members);
    expect(ordered).toEqual([captain, lieutenant, sergeant, specialist]);
    expect(ordered).not.toBe(members);
    expect(members).toEqual([specialist, captain, sergeant, lieutenant]);
    for (const member of ordered) expect(members).toContain(member);
    expect(captain.rank.rankId).toBe("9");
    expect(lieutenant.rank.rankId).toBe(10);
  });

  test("sorts the complete real name within a rank, beginning with first name rather than surname", () => {
    const members = [
      "Wade Kenton",
      "Eli Belmont",
      "Ryan Beauchamp",
      "Jim Rhoden",
    ].map((realName) => makeRecipient({ realName, rank: { rankId: "17" } }));
    expect(
      orderRecipientsForRecommendation(members).map(
        (member) => member.realName,
      ),
    ).toEqual(["Eli Belmont", "Jim Rhoden", "Ryan Beauchamp", "Wade Kenton"]);
  });

  test("normalizes case and whitespace for name and username comparison, then breaks ties by stable userId", () => {
    const members = [
      makeRecipient({
        user: { userId: "c", username: " beta.USER " },
        realName: " Jane   Doe ",
        rank: { rankId: "17" },
      }),
      makeRecipient({
        user: { userId: "b", username: "ALPHA.User" },
        realName: "jane doe",
        rank: { rankId: 17 },
      }),
      makeRecipient({
        user: { userId: "a", username: "  alpha.USER " },
        realName: "JANE DOE",
        rank: { rankId: "17" },
      }),
      makeRecipient({
        user: { userId: "d", username: "Zed.Z" },
        realName: "  adam  Jarvis ",
        rank: { rankId: 17 },
      }),
    ];
    const ordered = orderRecipientsForRecommendation(members);
    expect(ordered.map((member) => member.user.userId)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
    expect(ordered[0].realName).toBe("  adam  Jarvis ");
    expect(ordered[1].user.username).toBe("  alpha.USER ");
  });

  test("retains malformed or missing ranks after valid ranks and orders them by name", () => {
    const members = [
      makeRecipient({ realName: "Zulu Missing", rank: { rankId: undefined } }),
      makeRecipient({ realName: "Beta Blank", rank: { rankId: " " } }),
      makeRecipient({
        realName: "Alpha Malformed",
        rank: { rankId: "not-a-rank" },
      }),
      makeRecipient({ realName: "Gamma Empty", rank: { rankId: "" } }),
      makeRecipient({ realName: "Zed Junior", rank: { rankId: 20 } }),
      makeRecipient({ realName: "Zed Senior", rank: { rankId: "9" } }),
      makeRecipient({
        realName: "Delta Nonfinite",
        rank: { rankId: Infinity },
      }),
      makeRecipient({ realName: "Epsilon Null", rank: { rankId: null } }),
    ];
    expect(orderRecipientsForRecommendation(members)).toEqual([
      members[5],
      members[4],
      members[2],
      members[1],
      members[6],
      members[7],
      members[3],
      members[0],
    ]);
  });
});

describe("recommendation prose subjects", () => {
  const names = [
    "Alpha One",
    "Bravo Two",
    "Charlie Three",
    "Delta Four",
    "Echo Five",
    "Foxtrot Six",
    "Golf Seven",
  ];
  test.each([
    [1, "Specialist Alpha One", "Specialist Alpha One's"],
    [
      2,
      "Specialist Alpha One and Specialist Bravo Two",
      "Specialist Alpha One and Specialist Bravo Two's",
    ],
    [
      3,
      "Specialist Alpha One, Specialist Bravo Two, and Specialist Charlie Three",
      "Specialist Alpha One, Specialist Bravo Two, and Specialist Charlie Three's",
    ],
    [
      6,
      "Specialist Alpha One, Specialist Bravo Two, Specialist Charlie Three, Specialist Delta Four, Specialist Echo Five, and Specialist Foxtrot Six",
      "Specialist Alpha One, Specialist Bravo Two, Specialist Charlie Three, Specialist Delta Four, Specialist Echo Five, and Specialist Foxtrot Six's",
    ],
    [7, "The recipients", "The recipients'"],
    [51, "The recipients", "The recipients'"],
  ])(
    "%i recipients resolve a readable subject and possessive without mutating their supplied order",
    (count, subject, possessiveSubject) => {
      const members = Object.freeze(
        Array.from({ length: count }, (_, index) =>
          makeRecipient({
            user: { userId: String(index) },
            realName: names[index] ?? `Member Number${index}`,
          }),
        ),
      );
      const before = [...members];
      const resolved = resolveRecommendationRecipientSubject(members);
      expect(resolved.subject).toBe(subject);
      expect(resolved.possessiveSubject).toBe(possessiveSubject);
      expect(resolved.isPlural).toBe(count > 1);
      expect(members).toEqual(before);
    },
  );

  test("composes established citation names in supplied order and retains distinct IDs with the same human identity", () => {
    const members = [
      makeRecipient({
        user: { userId: "second" },
        rank: { rankFull: " Staff Sergeant " },
        realName: " Wade Middle Kenton ",
      }),
      makeRecipient({
        user: { userId: "first" },
        realName: "John Michael Smith",
      }),
      makeRecipient({
        user: { userId: "other" },
        realName: "John James Smith",
      }),
    ];
    expect(resolveRecommendationRecipientSubject(members).subject).toBe(
      "Staff Sergeant Wade Kenton, Specialist John Smith, and Specialist John Smith",
    );
    expect(members.map((member) => getRecipientDisplayName(member))).toEqual([
      "Staff Sergeant Wade Middle Kenton",
      "Specialist John Michael Smith",
      "Specialist John James Smith",
    ]);
  });
});

describe("Operation group identity warnings", () => {
  const members = [
    "Alpha One",
    "Bravo Two",
    "Charlie Three",
    "Delta Four",
    "Echo Five",
    "Foxtrot Six",
    "Golf Seven",
  ].map((realName, index) =>
    makeRecipient({ realName, user: { userId: String(index) } }),
  );
  test.each([
    [
      "operation",
      3,
      "one missing",
      "Specialist Alpha One and Specialist Bravo Two acted.",
      "1 of 3 recipients is",
    ],
    [
      "operation",
      4,
      "two missing",
      "Specialist Alpha One and Specialist Bravo Two acted.",
      "2 of 4 recipients are",
    ],
    [
      "operation",
      6,
      "one missing at the explicit-subject boundary",
      "Specialist Alpha One, Specialist Bravo Two, Specialist Charlie Three, Specialist Delta Four and Specialist Echo Five acted.",
      "1 of 6 recipients is",
    ],
    [
      "operation",
      3,
      "all present",
      "specialist  ALPHA ONE, Specialist Bravo Two and Specialist Charlie Three acted.",
      null,
    ],
    ["operation", 7, "collective subject is exempt", "The team acted.", null],
    [
      "service",
      4,
      "family is exempt within counts 2–6",
      "The team acted.",
      null,
    ],
  ])("%s / %i recipients / %s", (family, count, _case, text, expected) => {
    const selected = members.slice(0, count);
    const warning = getOperationGroupRecipientWarning(text, selected, family);
    if (expected)
      expect(warning?.message).toBe(
        `${expected} not referenced in the narrative. Ensure each recipient is properly cited before submitting the recommendation.`,
      );
    else expect(warning).toBeNull();
  });
});

describe("recipient collection and identity", () => {
  test("keeps first occurrences and order by stable ID, not similar names", () => {
    const laterJane = makeRecipient({
      user: { userId: " j ", username: "Doe.Later" },
      realName: "Later Record",
    });
    expect(uniqueRecipients([jane, kenton, laterJane, otherJane])).toEqual([
      jane,
      kenton,
      otherJane,
    ]);
    expect(
      uniqueRecipients([null, makeRecipient({ user: { userId: "" } }), kenton]),
    ).toEqual([kenton]);
    expect(
      uniqueRecipients([
        makeRecipient({ user: { userId: 1001 } }),
        makeRecipient(),
      ]),
    ).toHaveLength(1);
  });

  test.each([
    ...OPERATION_MEDALS.map((medal) => ["Operation", medal.name, medal]),
    ...SERVICE_MEDALS.map((medal) => ["Service", medal.name, medal]),
  ])(
    "%s / %s requires one recipient but permits many",
    (_family, _name, medal) => {
      const policy = resolveMedalWorksheet(medal).recipientPolicy;
      expect(validateRecipientEntries([], policy).isComplete).toBe(false);
      expect(
        validateRecipientEntries(entries([kenton]), policy).isComplete,
      ).toBe(true);
      expect(validateRecipientEntries(entries(roster), policy).isComplete).toBe(
        true,
      );
    },
  );

  test("honors a medal policy override without changing the default profile", () => {
    const policy = resolveMedalWorksheet({
      ...OPERATION_MEDALS[0],
      recipientPolicy: { minimum: 1, allowMultiple: false },
    }).recipientPolicy;
    expect(validateRecipientEntries(entries([kenton]), policy).isComplete).toBe(
      true,
    );
    expect(validateRecipientEntries(entries(roster), policy).isComplete).toBe(
      false,
    );
    expect(
      validateRecipientEntries(entries(roster), currentPolicy).isComplete,
    ).toBe(true);
  });

  test.each([
    ["complete override", { minimum: 2, allowMultiple: true }],
    ["partial override", { minimum: 2 }],
  ])(
    "requires two recipients with a %s while permitting multiple recipients",
    (_name, override) => {
      const policy = resolveMedalWorksheet({
        ...OPERATION_MEDALS[0],
        recipientPolicy: override,
      }).recipientPolicy;
      expect(
        validateRecipientEntries(entries([kenton]), policy).isComplete,
      ).toBe(false);
      expect(
        validateRecipientEntries(entries([kenton, jane]), policy).isComplete,
      ).toBe(true);
      expect(validateRecipientEntries(entries(roster), policy).isComplete).toBe(
        true,
      );
      expect(
        validateRecipientEntries(entries([kenton]), currentPolicy).isComplete,
      ).toBe(true);
    },
  );

  test.each([
    ["unresolved/null recipient", null],
    ["blank userId", makeRecipient({ user: { userId: " " } })],
    ["blank full rank", makeRecipient({ rank: { rankFull: " " } })],
    ["blank real name", makeRecipient({ realName: " " })],
  ])("rejects incomplete citation identity: %s", (_condition, member) => {
    expect(
      validateRecipientEntries(entries([kenton, member]), currentPolicy)
        .isComplete,
    ).toBe(false);
  });

  test("rejects duplicate IDs even when invalid state is supplied directly", () => {
    expect(
      validateRecipientEntries(
        entries([kenton, { ...kenton, realName: "Different Display" }]),
        currentPolicy,
      ).isComplete,
    ).toBe(false);
    expect(
      validateRecipientEntries(entries([jane, otherJane]), currentPolicy)
        .isComplete,
    ).toBe(true);
  });

  test("preserves full roster display while using first and last citation names", () => {
    const member = makeRecipient({
      realName: " Taylor Morgan Smith ",
      rank: { rankFull: " Specialist " },
    });
    expect(getRecipientDisplayName(member)).toBe(
      "Specialist Taylor Morgan Smith",
    );
    expect(getRecipientIdentity(member)).toEqual({
      recipientRank: "Specialist",
      recipientCitationName: "Taylor Smith",
    });
    expect(getCitationName("  Taylor  ")).toBe("Taylor");
    expect(getCitationName("Wade   Kenton")).toBe("Wade Kenton");
  });

  test("detects a multiword rank and identity across whitespace and newline boundaries", () => {
    expect(
      hasRecipientIdentity(
        "STAFF  SERGEANT  WADE\nKENTON acted.",
        "Staff Sergeant",
        "Wade Kenton",
      ),
    ).toBe(true);
  });
});

describe("bulk filtering and ordered selection", () => {
  test("missing billets cannot create a false organization and do not prevent name search", () => {
    const noBillet = { ...jane, primary: undefined, secondaries: undefined };
    const blankPosition = {
      ...kenton,
      primary: { positionId: "" },
      secondaries: [],
    };
    const malformed = {
      ...otherJane,
      primary: { positionId: "primary", positionTitle: "  " },
      secondaries: [
        null,
        { positionId: "empty", positionTitle: "" },
        { positionId: "numeric-title", positionTitle: 42 },
        { positionId: "object-title", positionTitle: {} },
        { positionTitle: "Missing ID" },
        { positionId: "  ", positionTitle: "Blank ID" },
        { positionId: {}, positionTitle: "Malformed ID" },
      ],
    };
    expect(
      buildRecipientOrganizations(
        [noBillet, blankPosition, malformed],
        [{ groupTitle: "Unassigned", positions: [{ positionId: "" }] }],
      ),
    ).toEqual([]);
    expect(filterRecipients([noBillet], "Jane")).toEqual([noBillet]);
    expect(filterRecipients([noBillet], "Developer")).toEqual([]);
    expect(filterRecipients([malformed], "Doe.J2")).toEqual([malformed]);
    expect(filterRecipients([malformed], "unknown")).toEqual([]);
  });

  test("uses primary and secondary positions and omits empty organizations in API order", () => {
    const organizations = buildRecipientOrganizations(roster, groups);
    expect(organizations.map((group) => group.label)).toEqual([
      "Intelligence",
      "Development",
    ]);
    expect(filterRecipients(roster, "", organizations[0])).toEqual([
      kenton,
      jane,
    ]);
    expect(filterRecipients(roster, "", organizations[1])).toEqual([kenton]);
    expect(filterRecipients(roster, "analyst", organizations[1])).toEqual([]);
    expect(filterRecipients(roster, "intelligence", organizations[0])).toEqual([
      kenton,
    ]);
  });

  test("groups use primary and every secondary position ID independently of title spelling", () => {
    const primary = makeRecipient({
      user: { userId: "primary" },
      primary: { positionId: 101, positionTitle: "Signal Watch" },
    });
    const secondary = makeRecipient({
      user: { userId: "secondary" },
      realName: "Jane Doe",
      primary: { positionId: "200", positionTitle: "Field Team" },
      secondaries: [
        { positionId: "202", positionTitle: "  SIGNAL   WATCH " },
        { positionId: "303", positionTitle: "Signal Watch" },
        { positionId: "404", positionTitle: "Auxiliary Watch" },
      ],
    });
    const sharedId = makeRecipient({
      user: { userId: "shared" },
      primary: { positionId: "303", positionTitle: "" },
    });
    const members = [primary, secondary, sharedId, otherJane];
    const options = buildRecipientOrganizations(members, [
      {
        groupTitle: "Signal Group",
        positions: [
          { positionId: "101" },
          { positionId: 202 },
          { positionId: "303" },
        ],
      },
      { groupTitle: "Auxiliary Group", positions: [{ positionId: "404" }] },
    ]);
    expect(options.map((option) => option.label)).toEqual([
      "Signal Group",
      "Auxiliary Group",
    ]);
    const target = options[0];
    expect(filterRecipients(members, "", target)).toEqual([
      primary,
      secondary,
      sharedId,
    ]);
    expect(filterRecipients(members, "Jane", target)).toEqual([secondary]);
    expect(filterRecipients(members, "", options[1])).toEqual([secondary]);
  });

  test.each([
    "kenton.w",
    "  WADE   KENTON ",
    "staff sergeant",
    "ssg",
    "Development",
    "Intelligence",
    "w",
  ])("searches names, ranks and both billets: %s", (query) => {
    expect(filterRecipients(roster, query)).toEqual([kenton]);
  });

  test("finds a recipient by a later secondary billet title and excludes unrelated members", () => {
    const member = makeRecipient({
      secondaries: [
        { positionId: "ordinary", positionTitle: "Supply Clerk" },
        { positionId: "target", positionTitle: "Cartography Instructor" },
        { positionId: "extra", positionTitle: "Training Assistant" },
      ],
    });
    expect(filterRecipients([jane, member, kenton], "cartography")).toEqual([
      member,
    ]);
  });

  test("empty search restores all candidates; non-matches return none", () => {
    expect(filterRecipients(roster, "   ")).toEqual(roster);
    expect(filterRecipients(roster, "unknown")).toEqual([]);
  });

  test("preserves existing selection order, appends new recipients in shown order, and clears only shown recipients", () => {
    const selection = selectShownRecipients(
      [otherJane, kenton],
      [kenton, jane],
    );
    expect(selection).toEqual([otherJane, kenton, jane]);
    expect(clearShownRecipients(selection, [kenton])).toEqual([
      otherJane,
      jane,
    ]);
    expect(clearShownRecipients(selection, [])).toEqual(selection);
    expect(clearShownRecipients(selection, selection)).toEqual([]);
  });

  test("selects and validates all 1,500 unique recipients without truncation", () => {
    const largeRoster = Array.from({ length: 1500 }, (_, index) =>
      makeRecipient({
        user: { userId: String(index), username: `Member.${index}` },
        realName: `Member ${index}`,
      }),
    );
    const selection = selectShownRecipients(
      [largeRoster[20]],
      [...largeRoster, ...largeRoster],
    );
    expect(selection).toHaveLength(1500);
    expect(selection[0]).toEqual(largeRoster[20]);
    expect(selection.at(-1)).toEqual(largeRoster.at(-1));
    expect(
      validateRecipientEntries(entries(selection), currentPolicy).isComplete,
    ).toBe(true);
    const pasteOrder = [...largeRoster].reverse();
    const pasted = matchPastedRecipients(
      pasteOrder.map((member) => member.user.username).join("\n"),
      largeRoster,
      [],
    );
    expect(pasted.selection).toEqual(pasteOrder);
    expect(pasted.results).toHaveLength(1500);
    expect(
      new Set(pasted.selection.map((member) => member.user.userId)).size,
    ).toBe(1500);
    expect(
      validateRecipientEntries(entries(pasted.selection), currentPolicy)
        .isComplete,
    ).toBe(true);
  });
});

describe("exact pasted-list matching", () => {
  test.each([
    "Staff Sergeant Wade Kenton",
    "SSG Wade Kenton",
    "Wade Kenton",
    "Kenton.W",
    "SSG.Kenton.W",
    "SSG Kenton.W",
    "  sTaFf   SeRGEANT Wade   Kenton  ",
  ])("matches supported alias %s", (text) => {
    expect(matchPastedRecipients(text, roster, [])).toEqual({
      selection: [kenton],
      results: [{ line: text.trim(), outcome: "Matched" }],
    });
  });

  test("does not guess ambiguous or partial names and reports repeated/existing matches", () => {
    const result = matchPastedRecipients(
      "Jane Doe\r\nKenton\nMissing\nKenton.W\nSSG.Kenton.W\nDoe.J\nWadeKenton\n\n",
      roster,
      [jane],
    );
    expect(result.selection).toEqual([jane, kenton]);
    expect(result.results.map((item) => item.outcome)).toEqual([
      "Ambiguous",
      "Not found",
      "Not found",
      "Matched",
      "Already selected",
      "Already selected",
      "Not found",
    ]);
  });

  test("appends exact matches in paste order without moving earlier selections", () => {
    expect(
      matchPastedRecipients("Doe.J2\nKenton.W\nDoe.J", roster, [kenton])
        .selection,
    ).toEqual([kenton, otherJane, jane]);
    expect(matchPastedRecipients("  \n", roster, [jane])).toEqual({
      selection: [jane],
      results: [],
    });
  });

  test("does not invent rank-only or dotted aliases from missing identity data", () => {
    const nameless = makeRecipient({
      user: { userId: "n", username: "Nameless.N" },
      realName: "",
    });
    const rankless = makeRecipient({
      user: { userId: "r", username: "Rankless.R" },
      rank: { rankShort: "", rankFull: "" },
      realName: "Robin Rankless",
    });
    const result = matchPastedRecipients(
      "Specialist\nSPC\n.Rankless.R",
      [nameless, rankless],
      [],
    );
    expect(result.selection).toEqual([]);
    expect(result.results.map((entry) => entry.outcome)).toEqual([
      "Not found",
      "Not found",
      "Not found",
    ]);
  });

  test("guards technical paste size at 100,000 characters, not recipient count", () => {
    expect(() =>
      matchPastedRecipients(" ".repeat(100_000), roster, []),
    ).not.toThrow();
    expect(() =>
      matchPastedRecipients(" ".repeat(100_001), roster, []),
    ).toThrow("100,000 characters");
  });
});
