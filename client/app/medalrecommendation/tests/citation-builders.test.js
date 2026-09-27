import { combineNarrative } from "../lib/citation-builders.js";
import { OPERATION_MEDALS } from "../lib/medal-definitions.js";
import { SERVICE_MEDALS } from "../lib/service-medal-definitions.js";
import { resolveRecommendationRecipientSubject } from "../lib/recipient-utils.js";
import {
  applyAwardChange,
  getActiveWorksheetValues,
  resolveMedalWorksheet,
} from "../lib/worksheet-profiles.js";
import { makeRecipient } from "./test-helpers.js";
import { SERVICE_CITATION_CASES } from "./service-medal-cases.js";

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
  test.each([
    ["Army Commendation Medal", "skillful actions"],
    ["Army Commendation Medal With Valor", "heroism and skill"],
    ["Air Medal", "skillful actions"],
    ["Purple Heart", "heroism and sacrifice"],
    ["Bronze Star Medal", "skillful actions"],
    ["Bronze Star Medal With Valor", "skills and heroic actions"],
    ["Distinguished Flying Cross", "skills and heroic actions"],
    ["Silver Star", "heroism, skill and devotion to duty"],
    ["Distinguished Service Cross", "heroism, skill and devotion to duty"],
  ])(
    "%s retains its award-specific closing for explicit and large groups",
    (name, action) => {
      const medal = OPERATION_MEDALS.find((entry) => entry.name === name);
      for (const [members, , possessive] of subjectCases) {
        expect(
          medal.buildClosing({
            recipientSubject: resolveRecommendationRecipientSubject(members),
            actionCharacter: "skillful",
          }),
        ).toBe(
          `${possessive} ${action} reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.`,
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
        expect(medal.buildClosing(context)).toBe(
          closing
            .replace(/^Corporal John Smith['’]s/, possessive)
            .replace(/\bthemself\b/g, "themselves"),
        );
      }
    },
  );
});
