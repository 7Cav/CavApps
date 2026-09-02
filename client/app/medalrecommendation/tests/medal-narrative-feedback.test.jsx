import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  analyzeNarrative,
  getRankEntries,
  mergeHighlightRanges,
} from "../lib/narrative-validation.js";
import {
  fillOperationWorksheet,
  getCitationText,
  getHighlightTexts,
  renderClient,
  selectAward,
  selectRecipient,
  submitRecommendation,
} from "./test-helpers.js";

const compliantNarrative =
  "Specialist John Smith maintained the defensive position throughout the operation. " +
  "He repeatedly engaged enemy forces during each major contact. " +
  "His actions contributed directly to the successful completion of the operation.";

const defaultAnalysisOptions = {
  recipientRank: "Specialist",
  recipientCitationName: "John Smith",
  rankEntries: [
    { short: "SPC", full: "Specialist" },
    { short: "CPL", full: "Corporal" },
    { short: "MG", full: "Major General" },
  ],
};

function analyze(narrative, overrides = {}) {
  return analyzeNarrative(narrative, {
    ...defaultAnalysisOptions,
    ...overrides,
  });
}

describe("narrative validation utilities", () => {
  describe("getRankEntries", () => {
    test("trims rank values and deduplicates short names case-insensitively", () => {
      expect(
        getRankEntries([
          { rank: { rankShort: " SPC ", rankFull: " Specialist " } },
          { rank: { rankShort: "spc", rankFull: "Duplicate Specialist" } },
          { rank: { rankShort: " CPL ", rankFull: " Corporal " } },
        ]),
      ).toEqual([
        { short: "SPC", full: "Specialist" },
        { short: "CPL", full: "Corporal" },
      ]);
    });

    test("ignores malformed members and ranks whose short and full names match", () => {
      expect(
        getRankEntries([
          null,
          {},
          { rank: null },
          { rank: {} },
          { rank: { rankShort: "", rankFull: "Specialist" } },
          { rank: { rankShort: "SPC", rankFull: "   " } },
          { rank: { rankShort: " Cadet ", rankFull: "cadet" } },
          { rank: { rankShort: "SGT", rankFull: "Sergeant" } },
        ]),
      ).toEqual([{ short: "SGT", full: "Sergeant" }]);
    });
  });

  describe("analyzeNarrative", () => {
    test("trims the narrative and accepts flexible recipient identity whitespace", () => {
      const result = analyze(
        "  Specialist   John Smith led the first action. He held the line. He secured the objective.  ",
      );

      expect(result.text).toBe(
        "Specialist   John Smith led the first action. He held the line. He secured the objective.",
      );
      expect(result.warnings).toEqual([]);
      expect(result.highlightRanges).toEqual([]);
    });

    test("warns when the full recipient identity is missing", () => {
      const result = analyze(
        "Specialist Smith led the first action. He held the line. He secured the objective.",
      );

      expect(result.warnings).toContainEqual({
        key: "recipient-mention",
        message:
          "Recipient mention: The selected recipient's Full Rank Full Name was not detected in the narrative. Verify that the recipient is identified correctly.",
      });
      expect(result.highlightRanges).toEqual([]);
    });

    test.each([
      [3, 2, "three"],
      [4, 3, "four"],
      [5, 4, "five"],
      [6, 5, "6"],
    ])(
      "uses the %i-sentence minimum and its formatted warning",
      (minimumNarrativeSentences, sentenceCount, formattedMinimum) => {
        const sentences = [
          "Specialist John Smith led the first action.",
          "He held the line.",
          "He secured the objective.",
          "He reorganized the element.",
          "He completed the mission.",
        ];
        const narrative = sentences.slice(0, sentenceCount).join(" ");

        expect(
          analyze(narrative, { minimumNarrativeSentences }).warnings,
        ).toContainEqual({
          key: "sentence-count",
          message: `Sentence count: This medal requires a minimum of ${formattedMinimum} sentences. The narrative may not meet that requirement. Please verify before submitting.`,
        });
      },
    );

    test.each(["SPC.", "CPL.", "MG."])(
      "captures the full punctuated rank token %s",
      (rankToken) => {
        const narrative = `${compliantNarrative} ${rankToken}`;
        const result = analyze(narrative);
        const start = result.text.lastIndexOf(rankToken);

        expect(result.highlightRanges).toContainEqual({
          start,
          end: start + rankToken.length,
        });
        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            key: `rank-${rankToken.slice(0, -1).toLowerCase()}`,
            message: expect.stringContaining(`"${rankToken}"`),
          }),
        );
      },
    );

    test("deduplicates a rank warning while retaining every matched token", () => {
      const narrative = `${compliantNarrative} MG Kenton advanced. MG. Kenton halted.`;
      const result = analyze(narrative);
      const rankWarnings = result.warnings.filter(
        ({ key }) => key === "rank-mg",
      );

      expect(rankWarnings).toHaveLength(1);
      expect(
        result.highlightRanges.map(({ start, end }) =>
          result.text.slice(start, end),
        ),
      ).toEqual(["MG", "MG."]);
    });

    test("creates separate warnings for different rank abbreviations", () => {
      const result = analyze(`${compliantNarrative} MG Kenton met CPL Adams.`);

      expect(result.warnings.map(({ key }) => key)).toEqual(
        expect.arrayContaining(["rank-mg", "rank-cpl"]),
      );
    });

    test("does not detect a rank abbreviation inside a larger alphanumeric token", () => {
      const result = analyze(
        `${compliantNarrative} The team captured an MG42 emplacement.`,
      );

      expect(result.warnings).not.toContainEqual(
        expect.objectContaining({ key: "rank-mg" }),
      );
      expect(
        result.highlightRanges.map(({ start, end }) =>
          result.text.slice(start, end),
        ),
      ).not.toContain("MG");
    });

    test("detects the full recipient identity case-insensitively", () => {
      const result = analyze(
        compliantNarrative.replace(
          "Specialist John Smith",
          "specialist john smith",
        ),
      );

      expect(result.warnings).not.toContainEqual(
        expect.objectContaining({ key: "recipient-mention" }),
      );
    });

    test("deduplicates repeated duplicate-word warnings while highlighting every occurrence", () => {
      const narrative =
        "Specialist John Smith held the the line. He crossed THE THE field. He secured the objective.";
      const result = analyze(narrative);

      expect(
        result.warnings.filter(({ key }) => key.startsWith("duplicate-word-")),
      ).toEqual([
        {
          key: "duplicate-word-the the",
          message:
            'Possible duplicate: "the the" was detected in the narrative. Verify that the repetition is intentional.',
        },
      ]);
      expect(
        result.highlightRanges.map(({ start, end }) =>
          result.text.slice(start, end),
        ),
      ).toEqual(["the the", "THE THE"]);
    });

    test("detects duplicate words separated by multiple spaces", () => {
      const narrative =
        "Specialist John Smith held the   the position. He secured the objective. He completed the mission.";
      const result = analyze(narrative);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({ key: "duplicate-word-the   the" }),
      );
      expect(
        result.highlightRanges.map(({ start, end }) =>
          result.text.slice(start, end),
        ),
      ).toContain("the   the");
    });

    test("normalizes duplicate sentences and highlights every copy", () => {
      const narrative =
        "Specialist John Smith secured the position.  SPECIALIST JOHN SMITH secured the position. He completed the mission.";
      const result = analyze(narrative);
      const duplicateRanges = result.highlightRanges.filter(
        ({ start, end }) =>
          result.text.slice(start, end).toLowerCase() ===
          "specialist john smith secured the position.",
      );

      expect(result.warnings).toContainEqual({
        key: "duplicate-sentence",
        message:
          "Possible duplicate sentence: This sentence appears more than once in the narrative. Verify that it was not duplicated accidentally.",
      });
      expect(duplicateRanges).toHaveLength(2);
    });

    test("treats sentences with different internal whitespace as duplicates", () => {
      const result = analyze("Alpha beta. Alpha   beta.", {
        minimumNarrativeSentences: 2,
        rankEntries: [],
        recipientRank: "",
        recipientCitationName: "",
      });

      expect(result.warnings).toContainEqual(
        expect.objectContaining({ key: "duplicate-sentence" }),
      );
      expect(
        result.highlightRanges.map(({ start, end }) =>
          result.text.slice(start, end),
        ),
      ).toEqual(["Alpha beta.", "Alpha   beta."]);
    });

    test("preserves word boundaries when comparing sentences", () => {
      const result = analyze("Alpha beta. Alphabeta.", {
        minimumNarrativeSentences: 2,
        rankEntries: [],
        recipientRank: "",
        recipientCitationName: "",
      });

      expect(result.warnings).not.toContainEqual(
        expect.objectContaining({ key: "duplicate-sentence" }),
      );
    });

    test("warns once for repeated punctuation while highlighting each non-ellipsis run", () => {
      const narrative =
        "Specialist John Smith paused... then advanced,, under fire. He held the line!! He secured the objective.";
      const result = analyze(narrative);

      expect(
        result.warnings.filter(({ key }) => key === "repeated-punctuation"),
      ).toEqual([
        {
          key: "repeated-punctuation",
          message:
            "Possible punctuation error: Repeated punctuation was detected. Verify this section before submitting.",
        },
      ]);
      expect(
        result.highlightRanges.map(({ start, end }) =>
          result.text.slice(start, end),
        ),
      ).toEqual([",,", "!!"]);
    });

    test("returns no warnings or highlights for a compliant narrative", () => {
      expect(analyze(compliantNarrative)).toEqual({
        text: compliantNarrative,
        warnings: [],
        highlightRanges: [],
      });
    });
  });

  describe("mergeHighlightRanges", () => {
    test("sorts ranges and merges touching, overlapping, and contained ranges", () => {
      expect(
        mergeHighlightRanges([
          { start: 20, end: 24 },
          { start: 4, end: 8 },
          { start: 0, end: 4 },
          { start: 6, end: 12 },
          { start: 7, end: 9 },
          { start: 18, end: 22 },
        ]),
      ).toEqual([
        { start: 0, end: 12 },
        { start: 18, end: 24 },
      ]);
    });

    test("does not mutate the input ranges", () => {
      const ranges = [
        { start: 5, end: 9 },
        { start: 1, end: 3 },
      ];

      expect(mergeHighlightRanges(ranges)).toEqual([
        { start: 1, end: 3 },
        { start: 5, end: 9 },
      ]);
      expect(ranges).toEqual([
        { start: 5, end: 9 },
        { start: 1, end: 3 },
      ]);
    });
  });
});

describe("Medal Recommendation Aid - narrative feedback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("preserves citation text exactly when highlight ranges overlap", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "The MG jammed. " +
      "The MG jammed. " +
      "Specialist John Smith cleared it.";

    await selectAward(user);
    await selectRecipient(user);
    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative,
    });
    await submitRecommendation(user);

    const expectedCitation =
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
      narrative +
      " Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    expect(getCitationText()).toBe(expectedCitation);
    const highlights = getHighlightTexts();

    expect(highlights).toEqual(["The MG jammed.", "The MG jammed."]);
  });

  test("warns about a possible rank abbreviation without rewriting the narrative", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist John Smith dodged MG Fire while advancing toward the objective. " +
      "He maintained the defensive position throughout the engagement. " +
      "His actions contributed directly to the successful completion of the operation.";

    await selectAward(user);
    await selectRecipient(user);
    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative,
    });
    await submitRecommendation(user);

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    const citation = screen.getByLabelText("Citation Narrative");
    expect(preview).toBeVisible();
    expect(citation).toHaveTextContent(narrative);
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(
      'Possible rank usage: "MG" was detected in the narrative. Verify that this usage and any rank formatting comply with the Medal SOP.',
    );

    const highlights = Array.from(citation.querySelectorAll("mark"));
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent(/^MG$/);
    expect(citation).toHaveTextContent("dodged MG Fire");
    expect(citation).not.toHaveTextContent("dodged Major General Fire");
  });

  test("accepts the citation name format when a roster name contains a middle name or initial", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist Taylor Smith maintained the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
      "His actions contributed directly to the successful completion of the operation.";

    await selectAward(user);
    await selectRecipient(user, "Smith.TJ", "Smith.TJ");
    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative,
    });
    await submitRecommendation(user);

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    expect(preview).toBeVisible();
    expect(preview).toHaveTextContent("Specialist Taylor Smith");
    expect(
      screen.queryByText(
        /the selected recipient's full rank full name was not detected in the narrative/i,
      ),
    ).not.toBeInTheDocument();
  });

  test("uses the Silver Star four-sentence minimum for narrative warnings", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user, "Silver Star");
    await selectRecipient(user);

    await fillOperationWorksheet(user, {
      leadershipElement: "platoon leader",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative:
        "Specialist John Smith led the element under heavy enemy fire. Specialist Smith reorganized the defensive position. Specialist Smith's leadership allowed the mission to continue.",
    });
    await submitRecommendation(user);

    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(
      "Sentence count: This medal requires a minimum of four sentences. The narrative may not meet that requirement. Please verify before submitting.",
    );
  });

  test("clears narrative warnings when the user corrects the narrative and regenerates", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user);
    await selectRecipient(user);
    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative:
        "Specialist John Smith maintained the the defensive position throughout the operation. " +
        "He repeatedly engaged enemy forces during each major contact. " +
        "His actions contributed directly to the successful completion of the operation.",
    });
    await submitRecommendation(user);

    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toBeVisible();

    const narrativeField = screen.getByRole("textbox", { name: "Narrative" });
    const correctedNarrative = compliantNarrative;

    await user.clear(narrativeField);
    await user.click(narrativeField);
    await user.paste(correctedNarrative);
    await submitRecommendation(user);

    expect(
      screen.queryByRole("status", { name: "Narrative Warnings" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Citation Narrative").querySelector("mark"),
    ).not.toBeInTheDocument();
  });

  test("shows no narrative warnings for compliant narrative text", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user);
    await selectRecipient(user);
    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative: compliantNarrative,
    });
    await submitRecommendation(user);

    expect(
      screen.queryByRole("status", { name: "Narrative Warnings" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Citation Narrative").querySelector("mark"),
    ).not.toBeInTheDocument();
  });
});
