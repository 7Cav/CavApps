import {
  buildRecipientOrganizations,
  clearShownRecipients,
  filterRecipients,
  getCitationName,
  getRecipientDisplayName,
  getRecipientIdentity,
  isValidRecipient,
  matchPastedRecipients,
  orderRecipientsForRecommendation,
  selectShownRecipients,
  uniqueRecipients,
  validateRecipientEntries,
} from "../lib/recipient-utils";
import {
  analyzeRecommendationNarrative,
  getGroupRecipientWarning,
  hasRecipientIdentity,
} from "../lib/narrative-validation";
import { resolveRecommendationRecipientSubject } from "../lib/citation-builders";
import { resolveMedalWorksheet } from "../lib/worksheet-profiles";
import { OPERATION_MEDALS } from "../lib/medal-definitions";
import { SERVICE_MEDALS } from "../lib/service-medal-definitions";
import { getMedalFamily } from "../lib/medal-families";
import { OPERATION_MEDAL_CASES } from "./operation-medal-cases";
import { SERVICE_CATALOG_CASES } from "./service-medal-cases";
import {
  developmentRecipientGroup,
  janeRecipient as jane,
  kentonRecipient,
  makeRecipient,
  makeJohnSmithRecipient,
  makeRecipientEntries,
} from "./test-helpers";

const kenton = {
  ...kentonRecipient,
  secondaries: [{ positionId: "intel", positionTitle: "Intelligence Clerk" }],
};
const otherJane = makeRecipient({
  user: { userId: "j2", username: "Doe.J2" },
  realName: "Jane Doe",
});
const roster = [kenton, jane, otherJane];
const groups = [
  { groupTitle: "Intelligence", positions: [{ positionId: "intel" }] },
  developmentRecipientGroup,
  { groupTitle: "Empty", positions: [{ positionId: "elsewhere" }] },
];
const currentPolicy = resolveMedalWorksheet(
  OPERATION_MEDALS[0],
).recipientPolicy;

describe("recommendation recipient ordering", () => {
  test("orders Cav ranks without mutating the input or recipients", () => {
    const specialist = makeRecipient({
      realName: "Aaron Aardvark",
      rank: { rankId: "20", rankFull: "Specialist" },
    });
    const captain = makeRecipient({
      realName: "Zulu Zulu",
      rank: { rankId: "9", rankFull: "Captain", rankShort: "CPT" },
    });
    const sergeant = makeRecipient({
      realName: "Aaron Aaron",
      rank: { rankId: 17, rankFull: "Staff Sergeant", rankShort: "SSG" },
    });
    const lieutenant = makeRecipient({
      realName: "Alpha Alpha",
      rank: { rankId: 10, rankFull: "First Lieutenant", rankShort: "1LT" },
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

  // Same-rank surname ordering: https://wiki.7cav.us/wiki/Awards_and_Decorations?oldid=17908
  // First/middle-name ties are application determinism, not an additional SOP rule.
  test("sorts same-rank recipients by surname before first name", () => {
    const members = [
      "Wade Kenton",
      "Eli Belmont",
      "Ryan Beauchamp",
      "Jim Rhoden",
    ].map((realName) =>
      makeRecipient({
        realName,
        rank: { rankId: "17", rankShort: "SSG", rankFull: "Staff Sergeant" },
      }),
    );
    expect(
      orderRecipientsForRecommendation(members).map(
        (member) => member.realName,
      ),
    ).toEqual(["Ryan Beauchamp", "Eli Belmont", "Wade Kenton", "Jim Rhoden"]);
  });

  test.each([
    [
      "first name",
      [makeJohnSmithRecipient(), makeRecipient({ realName: "Allen Smith" })],
      ["Allen Smith", "John Smith"],
    ],
    [
      "middle names",
      [makeJohnSmithRecipient("Robert"), makeJohnSmithRecipient("Michael")],
      ["John Michael Smith", "John Robert Smith"],
    ],
    [
      "empty middle name",
      [makeJohnSmithRecipient("Michael"), makeJohnSmithRecipient()],
      ["John Smith", "John Michael Smith"],
    ],
    [
      "all middle tokens",
      [
        makeJohnSmithRecipient("Michael Zed"),
        makeJohnSmithRecipient("Michael Allen"),
      ],
      ["John Michael Allen Smith", "John Michael Zed Smith"],
    ],
  ])(
    "breaks equal-rank surname ties by %s without rewriting roster names",
    (_label, members, expected) => {
      const names = members.map((member) => member.realName);
      for (const member of members) Object.freeze(member);
      Object.freeze(members);
      expect(
        orderRecipientsForRecommendation(members).map(
          (member) => member.realName,
        ),
      ).toEqual(expected);
      expect(members.map((member) => member.realName)).toEqual(names);
    },
  );

  test("normalizes name case and whitespace without ordering equal names by username or userId", () => {
    const members = [
      makeRecipient({
        user: { userId: "c", username: " beta.USER " },
        realName: " Jane   Doe ",
        rank: { rankId: "17", rankShort: "SSG", rankFull: "Staff Sergeant" },
      }),
      makeRecipient({
        user: { userId: "b", username: "ALPHA.User" },
        realName: "jane doe",
        rank: { rankId: 17, rankShort: "SSG", rankFull: "Staff Sergeant" },
      }),
      makeRecipient({
        user: { userId: "a", username: "  alpha.USER " },
        realName: "JANE DOE",
        rank: { rankId: "17", rankShort: "SSG", rankFull: "Staff Sergeant" },
      }),
      makeRecipient({
        user: { userId: "d", username: "Zed.Z" },
        realName: "  adam  Jarvis ",
        rank: { rankId: 17, rankShort: "SSG", rankFull: "Staff Sergeant" },
      }),
    ];
    const ordered = orderRecipientsForRecommendation(members);
    expect(ordered).toEqual(members);
    expect(orderRecipientsForRecommendation([...members].reverse())).toEqual([
      members[2],
      members[1],
      members[0],
      members[3],
    ]);
    expect(ordered[3].realName).toBe("  adam  Jarvis ");
    expect(ordered[0].user.username).toBe(" beta.USER ");
  });

  test("safely orders malformed or missing ranks last but rejects them for recommendations", () => {
    const members = [
      makeRecipient({ realName: "Zulu Missing", rank: { rankId: undefined } }),
      makeRecipient({ realName: "Beta Blank", rank: { rankId: " " } }),
      makeRecipient({
        realName: "Alpha Malformed",
        rank: { rankId: "not-a-rank" },
      }),
      makeRecipient({ realName: "Gamma Empty", rank: { rankId: "" } }),
      makeRecipient({ realName: "Zed Junior", rank: { rankId: 20 } }),
      makeRecipient({
        realName: "Zed Senior",
        rank: { rankId: "9", rankShort: "CPT", rankFull: "Captain" },
      }),
      makeRecipient({
        realName: "Delta Nonfinite",
        rank: { rankId: Infinity },
      }),
      makeRecipient({ realName: "Epsilon Null", rank: { rankId: null } }),
    ];
    expect(orderRecipientsForRecommendation(members)).toEqual([
      members[5],
      members[4],
      members[1],
      members[3],
      members[2],
      members[0],
      members[6],
      members[7],
    ]);
    for (const member of members.filter(
      (_, index) => ![4, 5].includes(index),
    )) {
      expect(
        validateRecipientEntries(makeRecipientEntries([member]), currentPolicy)
          .isComplete,
      ).toBe(false);
    }
  });

  test("places every warrant grade between Second Lieutenant and Command Sergeant Major despite their larger API IDs", () => {
    const ranks = [
      [23, "RCT", "Recruit"],
      [29, "CW2", "Chief Warrant Officer 2"],
      [12, "CSM", "Command Sergeant Major"],
      ["11", "2LT", "Second Lieutenant"],
      [30, "WO1", "Warrant Officer 1"],
      [27, "CW4", "Chief Warrant Officer 4"],
      [26, "CW5", "Chief Warrant Officer 5"],
      [28, "CW3", "Chief Warrant Officer 3"],
    ];
    const members = ranks.map(([rankId, rankShort, rankFull]) =>
      makeRecipient({
        user: { userId: String(rankId) },
        rank: { rankId, rankShort, rankFull },
      }),
    );
    expect(
      validateRecipientEntries(makeRecipientEntries(members), currentPolicy)
        .isComplete,
    ).toBe(true);
    expect(
      orderRecipientsForRecommendation(members).map(
        (member) => member.rank.rankShort,
      ),
    ).toEqual(["2LT", "CW5", "CW4", "CW3", "CW2", "WO1", "CSM", "RCT"]);
  });

  test.each(["GA", "GOA"])(
    "recognizes the current %s abbreviation for General of the Army",
    (rankShort) => {
      const generalOfTheArmy = makeRecipient({
        user: { userId: "army" },
        rank: { rankId: "1", rankShort, rankFull: "General of the Army" },
      });
      const general = makeRecipient({
        user: { userId: "general" },
        rank: { rankId: 2, rankShort: "GEN", rankFull: "General" },
      });
      expect(
        validateRecipientEntries(
          makeRecipientEntries([generalOfTheArmy]),
          currentPolicy,
        ).isComplete,
      ).toBe(true);
      expect(
        orderRecipientsForRecommendation([general, generalOfTheArmy]),
      ).toEqual([generalOfTheArmy, general]);
    },
  );
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
      const medal = SERVICE_MEDALS.find(
        (entry) => entry.name === "Humanitarian Service Medal",
      );
      expect(medal.buildClosing({ recipientSubject: resolved })).toBe(
        `${possessiveSubject} dedication to duty and commitment is in great credit to themselves and the 7th Cavalry Gaming Regiment.`,
      );
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

describe("recipient group identity warnings", () => {
  test.each([
    ["James Wayne Jackson", "Private First Class James Wayne Jackson", null],
    ["James Wayne Jackson", "Private First Class James Jackson", null],
    ["James Wayne Jackson", "PRIVATE  FIRST CLASS james\nwayne JACKSON", null],
    [
      "James Wayne Allen Jackson",
      "Private First Class James Wayne Allen Jackson",
      null,
    ],
    [
      "James Wayne Jackson",
      "Private First Class James RandomUnrelatedWord Jackson",
      "1 of 2 recipients is not referenced in the narrative. Ensure each recipient is properly cited before submitting the recommendation.",
    ],
  ])(
    "roster %s accepts only its exact full or citation identity: %s",
    (realName, identity, expected) => {
      const recipients = [
        makeRecipient({
          realName,
          rank: {
            rankId: "21",
            rankShort: "PFC",
            rankFull: "Private First Class",
          },
        }),
        makeRecipient({
          realName: "Robbie Camcrow",
          user: { userId: "camcrow", username: "Camcrow.R" },
          rank: { rankId: "22", rankShort: "PVT", rankFull: "Private" },
        }),
      ];
      const warning = getGroupRecipientWarning(
        "Both " +
          identity +
          " and Private Robbie Camcrow advanced. The team held. The mission succeeded.",
        recipients,
        {},
      );
      expect(warning?.message ?? null).toBe(expected);
    },
  );

  test("a single recipient may also use their exact full roster identity", () => {
    const member = makeRecipient({
      realName: "James Wayne Jackson",
      rank: { rankId: "21", rankShort: "PFC", rankFull: "Private First Class" },
    });
    const analysis = analyzeRecommendationNarrative(
      "Private First Class James Wayne Jackson advanced. The team held. The mission succeeded.",
      [member],
      "",
      { minimumNarrativeSentences: 3 },
      [],
      {},
    );
    expect(analysis.warnings.map((warning) => warning.key)).not.toContain(
      "recipient-mention",
    );
  });
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
      false,
      3,
      "one missing",
      "Specialist Alpha One and Specialist Bravo Two acted.",
      "1 of 3 recipients is",
    ],
    [
      false,
      4,
      "two missing",
      "Specialist Alpha One and Specialist Bravo Two acted.",
      "2 of 4 recipients are",
    ],
    [
      false,
      6,
      "one missing at the explicit-subject boundary",
      "Specialist Alpha One, Specialist Bravo Two, Specialist Charlie Three, Specialist Delta Four and Specialist Echo Five acted.",
      "1 of 6 recipients is",
    ],
    [
      false,
      3,
      "all present",
      "specialist  ALPHA ONE, Specialist Bravo Two and Specialist Charlie Three acted.",
      null,
    ],
    [false, 7, "collective subject is exempt", "The team acted.", null],
    [
      true,
      4,
      "system-owned opening supplies recipient identities",
      "The team acted.",
      null,
    ],
  ])(
    "system-owned opening %s / %i recipients / %s",
    (systemOwnedNarrativeOpening, count, _case, text, expected) => {
      const selected = members.slice(0, count);
      const warning = getGroupRecipientWarning(text, selected, {
        systemOwnedNarrativeOpening,
      });
      if (expected)
        expect(warning?.message).toBe(
          `${expected} not referenced in the narrative. Ensure each recipient is properly cited before submitting the recommendation.`,
        );
      else expect(warning).toBeNull();
    },
  );
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
    ...OPERATION_MEDAL_CASES.map(({ id, name }) => ["operation", name, id]),
    ...SERVICE_CATALOG_CASES.map(({ id, name }) => ["service", name, id]),
  ])("%s / %s requires one recipient but permits many", (family, _name, id) => {
    const medal = getMedalFamily(family).getMedalById(id);
    const policy = resolveMedalWorksheet(medal).recipientPolicy;
    expect(validateRecipientEntries([], policy).isComplete).toBe(false);
    expect(
      validateRecipientEntries(makeRecipientEntries([kenton]), policy)
        .isComplete,
    ).toBe(true);
    expect(
      validateRecipientEntries(makeRecipientEntries(roster), policy).isComplete,
    ).toBe(true);
  });

  test.each([
    ["unresolved/null recipient", null],
    ["blank userId", makeRecipient({ user: { userId: " " } })],
    ["blank full rank", makeRecipient({ rank: { rankFull: " " } })],
    ["blank real name", makeRecipient({ realName: " " })],
  ])("rejects incomplete citation identity: %s", (_condition, member) => {
    expect(
      validateRecipientEntries(
        makeRecipientEntries([kenton, member]),
        currentPolicy,
      ).isComplete,
    ).toBe(false);
  });

  test.each([
    ["missing rankId", { rankId: undefined }],
    ["unknown rankId", { rankId: 999 }],
    ["fractional rankId", { rankId: 20.5 }],
    ["missing abbreviation", { rankShort: "" }],
    ["unsupported abbreviation", { rankShort: "UNKNOWN" }],
    ["inconsistent rank ID and abbreviation", { rankId: 11, rankShort: "SPC" }],
    ["non-text abbreviation", { rankShort: {} }],
    ["non-text full rank", { rankFull: 20 }],
  ])("rejects recipient rank metadata: %s", (_condition, rank) => {
    const validation = validateRecipientEntries(
      makeRecipientEntries([makeRecipient({ rank })]),
      currentPolicy,
    );
    expect(validation.isComplete).toBe(false);
    expect(validation.errors[0]).not.toBe("");
  });

  test.each(["", "   ", undefined])(
    "rejects a missing roster username %j before recommendation generation",
    (username) => {
      const recipient = makeRecipient({ user: { username } });
      expect(isValidRecipient(recipient)).toBe(false);
      const validation = validateRecipientEntries(
        makeRecipientEntries([recipient]),
        currentPolicy,
      );
      expect(validation.isComplete).toBe(false);
      expect(validation.validCount).toBe(0);
      expect(validation.errors[0]).toMatch(/username is missing/i);
    },
  );

  test("rejects duplicate IDs even when invalid state is supplied directly", () => {
    expect(
      validateRecipientEntries(
        makeRecipientEntries([
          kenton,
          { ...kenton, realName: "Different Display" },
        ]),
        currentPolicy,
      ).isComplete,
    ).toBe(false);
    expect(
      validateRecipientEntries(
        makeRecipientEntries([jane, otherJane]),
        currentPolicy,
      ).isComplete,
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
    expect(getCitationName("  James\n Wayne\tAllen Jackson  ")).toBe(
      "James Jackson",
    );
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
      validateRecipientEntries(makeRecipientEntries(selection), currentPolicy)
        .isComplete,
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
      validateRecipientEntries(
        makeRecipientEntries(pasted.selection),
        currentPolicy,
      ).isComplete,
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
    ).toThrow(
      "Recipient list is too large. Reduce the pasted text to 100,000 characters or fewer.",
    );
  });
});
