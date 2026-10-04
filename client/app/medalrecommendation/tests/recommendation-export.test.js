import { generateRecommendation } from "../lib/recommendation-generation";
import {
  buildRecommendationTitle,
  buildRecommendationBody,
  buildMilpacsUrl,
} from "../lib/recommendation-export";
import { getMedalFamily } from "../lib/medal-families";
import { resolveMedalWorksheet } from "../lib/worksheet-profiles";
import { validateWorksheet } from "../lib/worksheet-validation";
import { makeRecipient, makeRecipientRoster } from "./test-helpers";
import {
  UNIT_AWARD_CASES,
  UNIT_OPERATION_INPUTS,
  UNIT_SERVICE_INPUTS,
} from "./unit-award-cases";

// Independent title/body/header oracles from Awards and Decorations,
// pinned revision: https://wiki.7cav.us/wiki/Awards_and_Decorations?oldid=17782
// Keep expected strings independent of production definitions and serializers.
const operationCases = [
  ["army-commendation-medal", "ARCOM", 1],
  ["army-commendation-medal-with-valor", "ARCOMV", 1],
  ["air-medal", "AM", 1],
  ["purple-heart", "PH", 1],
  ["bronze-star-medal", "BS", 1],
  ["bronze-star-medal-with-valor", "BSV", 1],
  ["distinguished-flying-cross", "DFC", 1],
  ["silver-star", "SS", 1],
  ["distinguished-service-cross", "DSC", 1],
  ["army-valorous-unit-award", "AVUA", 4],
  ["meritorious-unit-commendation", "MUC", 4],
];
// Independent mapping oracles. Sentinels differ even where field labels look similar.
const serviceCases = [
  [
    "outstanding-volunteer-service-medal",
    "secondary",
    "S1 Volunteer",
    "Medal Recommendation - S1 Volunteer - OVSM - SPC.Smith.J",
  ],
  [
    "humanitarian-service-medal",
    "secondary",
    null,
    "Medal Recommendation - HSM - SPC.Smith.J",
  ],
  [
    "army-achievement-medal",
    "secondary",
    "S7 Affected",
    "Medal Recommendation - S7 Affected - AAM - SPC.Smith.J",
  ],
  [
    "joint-service-achievement-medal",
    "secondary",
    "2/B/2-7",
    "Medal Recommendation - 2/B/2-7 - JSAM - SPC.Smith.J",
  ],
  [
    "army-commendation-medal",
    "secondary",
    "2/B/2-7",
    "Medal Recommendation - 2/B/2-7 - ARCOM - SPC.Smith.J",
  ],
  [
    "joint-service-commendation-medal",
    "secondary",
    "B/2-7 Benefitted",
    "Medal Recommendation - B/2-7 Benefitted - JSCM - SPC.Smith.J",
  ],
  [
    "meritorious-service-medal",
    "secondary",
    "2/B/2-7",
    "Medal Recommendation - 2/B/2-7 - MSM - SPC.Smith.J",
  ],
  [
    "defense-meritorious-service-medal",
    "secondary",
    "2/B/2-7",
    "Medal Recommendation - 2/B/2-7 - DMSM - SPC.Smith.J",
  ],
  [
    "soldiers-medal",
    "secondary",
    "2/B/2-7",
    "Medal Recommendation - 2/B/2-7 - SM - SPC.Smith.J",
  ],
  [
    "legion-of-merit",
    "secondary",
    "Military Police",
    "Medal Recommendation - Military Police - LOM - SPC.Smith.J",
  ],
  [
    "defense-superior-service-medal",
    "secondary",
    "Military Police",
    "Medal Recommendation - Military Police - DSSM - SPC.Smith.J",
  ],
  [
    "defense-superior-service-medal",
    "operations",
    "Vietnam AO",
    "Medal Recommendation - Vietnam AO - DSSM - SPC.Smith.J",
  ],
  [
    "distinguished-service-medal",
    "secondary",
    "B/2-7 Element",
    "Medal Recommendation - B/2-7 Element - DSM - SPC.Smith.J",
  ],
  [
    "defense-distinguished-service-medal",
    "secondary",
    "B/2-7 Element",
    "Medal Recommendation - B/2-7 Element - DDSM - SPC.Smith.J",
  ],
  [
    "joint-meritorious-unit-award",
    "secondary",
    "S3 Benefitted",
    "Medal Recommendation - S3 Benefitted - JMUA - SPC.Smith.J",
  ],
  [
    "superior-unit-award",
    "secondary",
    "S3 Benefitted",
    "Medal Recommendation - S3 Benefitted - SUA - SPC.Smith.J",
  ],
];
const values = {
  actionCharacter: "skillful",
  combatElement: "a rifleman",
  combatUnit: "Alpha Squad",
  operationTitle: "Overlord",
  location: "Normandy",
  operationDate: "2026-08-11",
  narrative:
    "The squad advanced. It secured the objective. The mission succeeded.",
  nonCombatDepartment: "S1 Volunteer",
  affectedArea: "S7 Affected",
  unit: "2/B/2-7",
  benefittedCompany: "B/2-7 Benefitted",
  assignedCompany: "C/1-7 Assigned",
  secondaryBillet: "Military Police",
  secondaryRole: "1IC",
  operationsAO: "Vietnam AO",
  operationsLeadership: "AO Lead",
  leadershipArea: "secondary",
  role: "a clerk",
  element: "B/2-7 Element",
  serviceStart: "2025-01",
  serviceEnd: "2026-01",
  serviceType: "service",
  narrativeOpening: "distinguished",
  recognitionType: "contributions",
  actionPhrase: "unused action sentinel",
  benefittedUnit: "S3 Benefitted",
  awardedUnit: "S6 Awarded",
};
function generate(family, id, overrides = {}, recipients = [makeRecipient()]) {
  const medal = getMedalFamily(family).getMedalById(id);
  const worksheet = resolveMedalWorksheet(medal);
  const input = { ...values, ...overrides };
  expect(validateWorksheet(worksheet, input).isComplete).toBe(true);
  return generateRecommendation({
    medal,
    worksheet,
    values: input,
    recipients,
  });
}
function snapshot(overrides = {}) {
  return {
    medal: {
      name: "Purple Heart",
      abbreviation: "PH",
      ribbonUrl: "https://wiki.7cav.us/images/b/b5/PH.jpg",
    },
    recipients: [makeRecipient()],
    titleContext: "Operation Fury",
    citationText: "  A citation.\n[B]User-authored text[/B] stays!  ",
    ...overrides,
  };
}

describe("Recommendation export snapshots", () => {
  test("the independent mapping matrix covers all 26 awards and both DSSM pathways", () => {
    const operationIds = getMedalFamily("operation").medals.map(({ id }) => id);
    const serviceIds = getMedalFamily("service").medals.map(({ id }) => id);
    const expectedOperationIds = new Set(operationCases.map(([id]) => id));
    const expectedServiceIds = new Set(serviceCases.map(([id]) => id));
    expect(operationCases).toHaveLength(11);
    expect(serviceCases).toHaveLength(16);
    expect(expectedOperationIds.size).toBe(11);
    expect(expectedServiceIds.size).toBe(15);
    expect(
      new Set(serviceCases.map(([id, pathway]) => `${id}/${pathway}`)).size,
    ).toBe(16);
    // Counts plus complete membership reject duplicates without pinning order.
    expect(operationIds).toHaveLength(11);
    expect(serviceIds).toHaveLength(15);
    expect(new Set(operationIds)).toEqual(expectedOperationIds);
    expect(new Set(serviceIds)).toEqual(expectedServiceIds);
  });
  test.each(operationCases)(
    "%s captures exactly one Operation prefix for bare and prefixed input",
    (id, abbreviation, count) => {
      const recipients =
        count === 1 ? [makeRecipient()] : makeRecipientRoster(count);
      for (const operationTitle of ["Overlord", "  oPeRaTiOn Overlord  "]) {
        const result = generate(
          "operation",
          id,
          { operationTitle },
          recipients,
        );
        expect(result.titleContext).toBe("Operation Overlord");
        expect(result.openingSentence).toContain(
          "in Operation Overlord near Normandy on 11 August 2026.",
        );
        expect(buildRecommendationTitle(result)).toBe(
          `Medal Recommendation - Operation Overlord - ${abbreviation} - ${count === 1 ? "SPC.Smith.J" : "Multiple"}`,
        );
      }
    },
  );
  test.each([
    ["Overlord", "Operation Overlord"],
    ["Operation Overlord", "Operation Overlord"],
    ["  oPeRaTiOn Overlord  ", "Operation Overlord"],
    ["Operation: Hammer", "Operation Hammer"],
    ["Operation - Hammer", "Operation Hammer"],
    ["Operation–Hammer", "Operation Hammer"],
    ["Operation — |:/_,; Hammer", "Operation Hammer"],
    ["Operation_Hammer", "Operation Hammer"],
    ["Operational Hammer", "Operation Operational Hammer"],
  ])(
    "Operation name %j is canonical in both title context and citation",
    (operationTitle, expected) => {
      const result = generate("operation", "purple-heart", { operationTitle });
      expect(result.titleContext).toBe(expected);
      expect(buildRecommendationTitle(result)).toBe(
        `Medal Recommendation - ${expected} - PH - SPC.Smith.J`,
      );
      expect(result.openingSentence).toContain(
        `in ${expected} near Normandy on 11 August 2026.`,
      );
    },
  );
  test.each(serviceCases)(
    "%s / %s captures the configured active Service context",
    (id, leadershipArea, context, title) => {
      const result = generate("service", id, { leadershipArea });
      expect(result.titleContext).toBe(context);
      expect(buildRecommendationTitle(result)).toBe(title);
    },
  );
  test.each(UNIT_AWARD_CASES)(
    "$abbreviation preserves its literal group citation in the export snapshot",
    (award) => {
      const result = generate(
        award.family,
        award.id,
        award.family === "operation"
          ? UNIT_OPERATION_INPUTS
          : UNIT_SERVICE_INPUTS,
        makeRecipientRoster(award.minimumRecipients),
      );
      expect(result.citationText).toBe(award.citation);
    },
  );
  test("the snapshot retains its context and exact Individual citation after its input changes", () => {
    const medal = getMedalFamily("operation").getMedalById(
      "army-commendation-medal-with-valor",
    );
    const input = { ...values };
    const result = generateRecommendation({
      medal,
      worksheet: resolveMedalWorksheet(medal),
      values: input,
      recipients: [makeRecipient()],
    });
    input.operationTitle = "Later operation";
    input.narrative = "Later narrative";
    expect(result.titleContext).toBe("Operation Overlord");
    expect(result.citationText).toBe(
      "For a single act of heroism or skill under enemy fire while serving as a rifleman in the 7th Cavalry Regiment during combat in Operation Overlord near Normandy on 11 August 2026. The squad advanced. It secured the objective. The mission succeeded. Specialist John Smith's heroism and skill reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
    expect(buildRecommendationTitle(result)).toBe(
      "Medal Recommendation - Operation Overlord - ARCOMV - SPC.Smith.J",
    );
    expect(buildRecommendationBody(result)).not.toMatch(/Later/);
  });
  test.each([
    undefined,
    { type: "unknown" },
    { type: "field", field: "missing" },
    { type: "activeField", fields: [] },
    { type: "activeField", fields: ["operationTitle", "location"] },
  ])(
    "invalid context configuration %j fails loudly during generation",
    (configuration) => {
      const original = getMedalFamily("operation").getMedalById("purple-heart");
      expect(() =>
        generateRecommendation({
          medal: original,
          worksheet: {
            ...resolveMedalWorksheet(original),
            recommendationTitleContext: configuration,
          },
          values,
          recipients: [makeRecipient()],
        }),
      ).toThrow(/Recommendation Title context/);
    },
  );
});

describe("Recommendation export serialization", () => {
  test("profile links use the MILPACS identity rather than the forum user identity", () => {
    expect(
      buildMilpacsUrl(
        makeRecipient({ profileId: "4637", user: { userId: "9397" } }),
      ),
    ).toBe("https://7cav.us/rosters/profile/4637/");
    expect(
      buildMilpacsUrl(
        makeRecipient({ profileId: "812", user: { userId: "923" } }),
      ),
    ).toBe("https://7cav.us/rosters/profile/812/");
  });
  test("a missing MILPACS identity never falls back to a forum user ID", () => {
    for (const profileId of [undefined, null, "", "  "])
      expect(() => buildMilpacsUrl(makeRecipient({ profileId }))).toThrow(
        /MILPACS profile ID is required/,
      );
  });
  test("single recipient body uses literal tags, blank lines, URL, and verbatim citation", () => {
    expect(buildRecommendationTitle(snapshot())).toBe(
      "Medal Recommendation - Operation Fury - PH - SPC.Smith.J",
    );
    expect(buildRecommendationBody(snapshot())).toBe(
      "[CENTER][B]Purple Heart[/B]\n\n[IMG]https://wiki.7cav.us/images/b/b5/PH.jpg[/IMG]\n\n[B][URL=https://7cav.us/rosters/profile/profile-1001/]Specialist John Smith[/URL][/B]\n\n  A citation.\n[B]User-authored text[/B] stays!  \n[/CENTER]",
    );
  });
  test("multiple recipients preserve snapshot order in one contiguous bold link block", () => {
    const recipients = [
      makeRecipient({
        user: { userId: "22", username: "Zulu.Z" },
        realName: "Zed Zulu",
      }),
      makeRecipient({
        user: { userId: "11", username: "Alpha.A" },
        rank: { rankId: 9, rankShort: "CPT", rankFull: "Captain" },
        realName: "Adam Alpha",
      }),
    ];
    const recommendation = snapshot({
      recipients,
      citationText: "Existing group citation.",
    });
    expect(buildRecommendationTitle(recommendation)).toBe(
      "Medal Recommendation - Operation Fury - PH - Multiple",
    );
    expect(buildRecommendationBody(recommendation)).toBe(
      "[CENTER][B]Purple Heart[/B]\n\n[IMG]https://wiki.7cav.us/images/b/b5/PH.jpg[/IMG]\n\n[B][URL=https://7cav.us/rosters/profile/profile-22/]Specialist Zed Zulu[/URL][/B]\n[B][URL=https://7cav.us/rosters/profile/profile-11/]Captain Adam Alpha[/URL][/B]\n\nExisting group citation.\n[/CENTER]",
    );
  });
  test("large snapshots keep all ordered recipients, including the final entry", () => {
    const recipients = makeRecipientRoster(30).reverse();
    const lines = buildRecommendationBody(snapshot({ recipients }))
      .split("\n")
      .filter((line) => line.startsWith("[B][URL="));
    expect(lines).toHaveLength(30);
    expect(
      lines.map((line) => line.match(/profile\/profile-(\d+)\//)[1]),
    ).toEqual([
      "30",
      "29",
      "28",
      "27",
      "26",
      "25",
      "24",
      "23",
      "22",
      "21",
      "20",
      "19",
      "18",
      "17",
      "16",
      "15",
      "14",
      "13",
      "12",
      "11",
      "10",
      "9",
      "8",
      "7",
      "6",
      "5",
      "4",
      "3",
      "2",
      "1",
    ]);
  });
  test.each([
    [{ rankId: 19, rankShort: "Cpl", rankFull: "Corporal" }, "CPL.Cameron.J"],
    [
      { rankId: 1, rankShort: "GOA", rankFull: "General of the Army" },
      "GA.Cameron.J",
    ],
  ])(
    "uses canonical Cav rank metadata and the existing username: %j",
    (rank, expected) => {
      const result = snapshot({
        recipients: [
          makeRecipient({
            rank,
            user: { username: "Cameron.J" },
            realName: "Unrelated Full Name",
          }),
        ],
      });
      expect(buildRecommendationTitle(result)).toBe(
        `Medal Recommendation - Operation Fury - PH - ${expected}`,
      );
    },
  );
  test.each([
    ["PH", 1, 149],
    ["PH", 1, 150],
    ["PH", 1, 151],
    ["DDSM", 2, 149],
    ["DDSM", 2, 150],
    ["DDSM", 2, 151],
    ["ARCOMV", 1, 900],
  ])(
    "%s / %i recipients / %i characters truncates context only",
    (abbreviation, count, length) => {
      const recipients =
        count === 1 ? [makeRecipient()] : makeRecipientRoster(count);
      const suffix = ` - ${abbreviation} - ${count === 1 ? "SPC.Smith.J" : "Multiple"}`;
      const prefix = "Medal Recommendation - ";
      const context = "é".repeat(length - prefix.length - suffix.length);
      const result = snapshot({
        medal: { ...snapshot().medal, abbreviation },
        recipients,
        titleContext: context,
      });
      const expected =
        length <= 150
          ? prefix + context + suffix
          : prefix +
            "é".repeat(150 - prefix.length - suffix.length - 1) +
            "…" +
            suffix;
      expect(buildRecommendationTitle(result)).toBe(expected);
      expect(buildRecommendationTitle(result)).toBe(expected);
      expect(buildRecommendationTitle(result).length).toBe(
        Math.min(length, 150),
      );
      expect(result.titleContext).toBe(context);
    },
  );
  test("a surrogate pair at the context cut is never split", () => {
    const budget =
      150 - "Medal Recommendation - ".length - " - PH - SPC.Smith.J".length;
    const result = snapshot({
      titleContext: "x".repeat(budget - 2) + "😀long",
    });
    expect(buildRecommendationTitle(result)).toBe(
      "Medal Recommendation - " +
        "x".repeat(budget - 2) +
        "… - PH - SPC.Smith.J",
    );
    expect(buildRecommendationTitle(result).isWellFormed()).toBe(true);
  });
  test("title serialization consumes captured context as-is without adding another Operation prefix", () => {
    expect(
      buildRecommendationTitle(
        snapshot({ titleContext: "Already captured context" }),
      ),
    ).toBe(
      "Medal Recommendation - Already captured context - PH - SPC.Smith.J",
    );
  });
  test.each([null, "context"])(
    "protected segments that cannot fit fail explicitly, including context %j",
    (titleContext) => {
      expect(() =>
        buildRecommendationTitle(
          snapshot({
            titleContext,
            recipients: [
              makeRecipient({ user: { username: "x".repeat(140) } }),
            ],
          }),
        ),
      ).toThrow(/Recommendation export:/);
    },
  );
  test("missing snapshot properties and zero recipients cannot become valid exports", () => {
    expect(() =>
      buildRecommendationTitle(snapshot({ titleContext: undefined })),
    ).toThrow(/captured title context/);
    expect(() =>
      buildRecommendationBody(snapshot({ citationText: undefined })),
    ).toThrow(/captured citation text/);
    for (const build of [buildRecommendationTitle, buildRecommendationBody])
      expect(() => build(snapshot({ recipients: [] }))).toThrow(
        /recipient list/,
      );
    expect(buildMilpacsUrl(makeRecipient())).toBe(
      "https://7cav.us/rosters/profile/profile-1001/",
    );
  });
});
