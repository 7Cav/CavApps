import { generateRecommendation } from "../lib/recommendation-generation.js";
import {
  combineNarrative,
  resolveRecommendationRecipientSubject,
} from "../lib/citation-builders.js";
import { OPERATION_MEDALS } from "../lib/medal-definitions.js";
import { SERVICE_MEDALS } from "../lib/service-medal-definitions.js";
import {
  applyAwardChange,
  getActiveWorksheetValues,
  resolveMedalWorksheet,
} from "../lib/worksheet-profiles.js";
import { makeRecipient } from "./test-helpers.js";
import { SERVICE_CITATION_CASES } from "./service-medal-cases.js";
import { OPERATION_MEDAL_CASES } from "./operation-medal-cases.js";

describe("Narrative composition", () => {
  test.each([
    ["Opening", "Continuation.", "Opening Continuation."],
    ["  Opening  ", "", "Opening"],
    ["", "  Continuation.  ", "Continuation."],
    ["  Opening  ", "  Continuation.  ", "Opening Continuation."],
  ])(
    "combines %j and %j with normalized boundary whitespace",
    (opening, continuation, expected) => {
      expect(combineNarrative(opening, continuation)).toBe(expected);
    },
  );
});

describe("required recipient citation subject", () => {
  test.each([
    ["missing subject", {}],
    [
      "legacy identity fields only",
      { recipientRank: "Specialist", recipientCitationName: "John Smith" },
    ],
    ["blank subject", { recipientSubject: { subject: " " } }],
  ])("rejects %s instead of manufacturing citation text", (_label, context) => {
    const medal = SERVICE_MEDALS.find(
      (entry) => entry.name === "Humanitarian Service Medal",
    );
    expect(() => medal.buildNarrativeOpening(context)).toThrow(
      "Missing recipient citation subject",
    );
    expect(() => medal.buildClosing(context)).toThrow(
      "Missing recipient citation subject",
    );
  });

  test("does not resolve an empty recipient collection into a citation subject", () => {
    expect(() => resolveRecommendationRecipientSubject([])).toThrow(
      "Missing recipient citation subject",
    );
  });
});

const subjectCases = [
  [
    [
      makeRecipient({ realName: "Alpha One" }),
      makeRecipient({ realName: "Beta Two", user: { userId: "other" } }),
    ],
    "Specialist Alpha One and Specialist Beta Two",
    "Specialist Alpha One and Specialist Beta Two's",
  ],
  [
    Array.from({ length: 7 }, (_, index) =>
      makeRecipient({
        realName: `Member Number${index}`,
        user: { userId: String(index) },
      }),
    ),
    "The recipients",
    "The recipients'",
  ],
];

describe("collective award wording", () => {
  test.each(OPERATION_MEDAL_CASES)(
    "$name retains its award-specific closing for explicit and large groups",
    ({ name, groupClosingAction }) => {
      const medal = OPERATION_MEDALS.find((entry) => entry.name === name);
      for (const [members, , possessive] of subjectCases) {
        expect(
          medal.buildClosing({
            recipientSubject: resolveRecommendationRecipientSubject(members),
            actionCharacter: "skillful",
          }),
        ).toBe(
          `${possessive} ${groupClosingAction} reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.`,
        );
      }
    },
  );

  test.each([
    ...SERVICE_CITATION_CASES,
    {
      name: "Army Achievement Medal",
      path: "affected area",
      inputs: { "Affected Area of the Cav": "S6" },
      opening: "For contributions in S6.",
      closing:
        "Corporal John Smith's dedication to duty and commitment is in great credit to themselves, S6 and the 7th Cavalry Gaming Regiment.",
    },
  ])(
    "$name / $path uses one subject policy for its opening, starter and closing",
    ({
      name,
      choices = {},
      inputs,
      opening,
      closing,
      narrativeVerb = "distinguished",
    }) => {
      const medal = SERVICE_MEDALS.find((entry) => entry.name === name);
      const worksheet = resolveMedalWorksheet(medal);
      const values = applyAwardChange(null, worksheet, {});
      for (const [label, value] of Object.entries({ ...choices, ...inputs })) {
        const [key, field] = Object.entries(worksheet.fields).find(
          ([, field]) => field.label === label,
        );
        values[key] = field.options
          ? field.options.find((option) => option.label === value).id
          : value;
      }
      for (const [members, subject, possessive] of subjectCases) {
        const context = {
          ...getActiveWorksheetValues(worksheet, values),
          recipientSubject: resolveRecommendationRecipientSubject(members),
        };
        expect(medal.buildOpening(context)).toBe(opening);
        expect(medal.buildNarrativeOpening(context)).toBe(
          `${subject} ${narrativeVerb} themselves by`,
        );
        // The independent single-recipient oracle supplies only the unchanged award wording.
        const apostrophe = closing.match(/^Corporal John Smith(['’])s/)[1];
        expect(medal.buildClosing(context)).toBe(
          closing
            .replace(
              /^Corporal John Smith['’]s/,
              possessive.replace("'", apostrophe),
            )
            .replace(/\bthemself\b/g, "themselves"),
        );
      }
    },
  );
});

describe("recommendation generation", () => {
  test("resolves all active citation choices by their field definitions and excludes inactive choices", () => {
    const worksheet = {
      recommendationTitleContext: { type: "none" },
      fields: {
        recognition: {
          type: "citationChoice",
          options: [{ id: "first", citationText: "distinguished service" }],
        },
        credit: {
          type: "citationChoice",
          options: [{ id: "second", citationText: "exceptional dedication" }],
        },
        inactive: {
          type: "citationChoice",
          when: { field: "pathway", equals: "other" },
          options: [{ id: "unused", citationText: "inactive prose" }],
        },
        narrative: { type: "textarea" },
      },
    };
    const medal = {
      minimumNarrativeSentences: 1,
      buildOpening: ({ recognition, inactive }) =>
        inactive === undefined
          ? `For ${recognition}.`
          : "Leaked inactive choice.",
      buildClosing: ({ credit }) => `Their ${credit} brought credit.`,
    };
    const recommendation = generateRecommendation({
      medal,
      worksheet,
      values: {
        recognition: "first",
        credit: "second",
        inactive: "unsupported",
        narrative: "Specialist John Smith completed the task.",
      },
      recipients: [makeRecipient()],
    });
    expect(recommendation.openingSentence).toBe("For distinguished service.");
    expect(recommendation.narrative).toBe(
      "Specialist John Smith completed the task.",
    );
    expect(recommendation.closingSentence).toBe(
      "Their exceptional dedication brought credit.",
    );
  });
});
