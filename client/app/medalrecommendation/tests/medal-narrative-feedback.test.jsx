import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  fillOperationWorksheet,
  getCitationText,
  getHighlightTexts,
  renderClient,
  selectAward,
  selectRecipient,
  submitRecommendation,
} from "./test-helpers.js";

describe("Medal Recommendation Aid - narrative feedback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each(["SPC.", "CPL.", "MG."])(
    "highlights the full abbreviated rank including the period for %s",
    async (rankToken) => {
      const user = userEvent.setup();
      renderClient();

      const narrative =
        "Specialist John Smith maintained the defensive position during the opening engagement. " +
        `The ${rankToken} Kenton moved forward to reinforce the squad. ` +
        "The unit maintained control of the objective through the final contact.";

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

      const highlights = getHighlightTexts();

      expect(highlights).toContain(rankToken);
    },
  );

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

  test("shows one rank warning when the same abbreviation appears with and without a period", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist John Smith maintained the defensive position during the opening engagement. " +
      "MG Kenton coordinated the supporting element during the assault. " +
      "MG. Kenton continued directing the element through the final contact.";

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

    const warnings = screen.getByRole("status", { name: "Narrative Warnings" });
    const rankWarnings = Array.from(warnings.querySelectorAll("p")).filter(
      (warning) => warning.textContent.startsWith("Possible rank usage:"),
    );
    expect(rankWarnings).toHaveLength(1);

    const rankHighlights = getHighlightTexts().filter(
      (text) => text === "MG" || text === "MG.",
    );

    expect(rankHighlights).toEqual(["MG", "MG."]);
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

  test("warns when the selected recipient Full Rank Full Name is not detected without highlighting the whole citation", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist Smith maintained the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
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

    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(
      "Recipient mention: The selected recipient's Full Rank Full Name was not detected in the narrative. Verify that the recipient is identified correctly.",
    );
    expect(
      screen.getByLabelText("Citation Narrative").querySelector("mark"),
    ).not.toBeInTheDocument();
  });

  test("does not show a recipient-mention warning when Full Rank Full Name is present", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist John Smith maintained the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
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

    expect(
      screen.queryByText(
        /the selected recipient's full rank full name was not detected in the narrative/i,
      ),
    ).not.toBeInTheDocument();
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

  test("shows a soft sentence-count warning without blocking generation", async () => {
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
        "Specialist John Smith maintained the defensive position throughout the operation.",
    });
    await submitRecommendation(user);

    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(
      "Sentence count: This medal requires a minimum of three sentences. The narrative may not meet that requirement. Please verify before submitting.",
    );
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

  test("uses the Distinguished Service Cross five-sentence minimum for narrative warnings", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user, "Distinguished Service Cross");
    await selectRecipient(user);

    await fillOperationWorksheet(user, {
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative:
        "Specialist John Smith advanced under direct enemy fire. Specialist Smith reorganized the element. Specialist Smith led the assault through the enemy position. Specialist Smith's actions secured the objective.",
    });
    await submitRecommendation(user);

    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(
      "Sentence count: This medal requires a minimum of five sentences. The narrative may not meet that requirement. Please verify before submitting.",
    );
  });

  test("warns about a consecutive duplicate word and highlights only the duplicated words", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist John Smith maintained the the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
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

    const citation = screen.getByLabelText("Citation Narrative");
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(
      'Possible duplicate: "the the" was detected in the narrative. Verify that the repetition is intentional.',
    );

    const highlights = Array.from(citation.querySelectorAll("mark"));
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent(/^the the$/);
    expect(citation).toHaveTextContent(narrative);
  });

  test("warns about an exact duplicate sentence and highlights both copies", async () => {
    const user = userEvent.setup();
    renderClient();

    const duplicatedSentence =
      "Specialist John Smith secured the defensive position.";
    const narrative =
      `${duplicatedSentence} ${duplicatedSentence} ` +
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

    const citation = screen.getByLabelText("Citation Narrative");
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(
      "Possible duplicate sentence: This sentence appears more than once in the narrative. Verify that it was not duplicated accidentally.",
    );

    const duplicateHighlights = Array.from(
      citation.querySelectorAll("mark"),
    ).filter((highlight) => highlight.textContent === duplicatedSentence);
    expect(duplicateHighlights).toHaveLength(2);
    expect(citation).toHaveTextContent(narrative);
  });

  test("warns about repeated punctuation and highlights only the punctuation", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist John Smith maintained the defensive position,, while the squad advanced. " +
      "He repeatedly engaged enemy forces during each major contact. " +
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

    const citation = screen.getByLabelText("Citation Narrative");
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(
      "Possible punctuation error: Repeated punctuation was detected. Verify this section before submitting.",
    );

    const highlights = Array.from(citation.querySelectorAll("mark"));
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent(/^,,$/);
    expect(citation).toHaveTextContent(narrative);
  });

  test("does not warn about a standard three-dot ellipsis", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist John Smith maintained the defensive position... despite sustained enemy fire. " +
      "He repeatedly supported his squad during each major contact. " +
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

    const citation = screen.getByLabelText("Citation Narrative");
    expect(
      screen.queryByText(/possible punctuation error/i),
    ).not.toBeInTheDocument();
    expect(citation).toHaveTextContent("position... despite");
    expect(citation).toHaveTextContent(narrative);
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
    const correctedNarrative =
      "Specialist John Smith maintained the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
      "His actions contributed directly to the successful completion of the operation.";

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
      narrative:
        "Specialist John Smith maintained the defensive position throughout the operation. " +
        "He repeatedly engaged enemy forces during each major contact. " +
        "His actions contributed directly to the successful completion of the operation.",
    });
    await submitRecommendation(user);

    expect(
      screen.queryByRole("status", { name: "Narrative Warnings" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Citation Narrative").querySelector("mark"),
    ).not.toBeInTheDocument();
  });

  test("shows multiple different warning types without duplicating the same warning", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist Smith maintained the the defensive position. " +
      "The MG Kenton supported the element,, during the assault. " +
      "The MG Smith continued the advance.";

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

    const warnings = screen.getByRole("status", {
      name: "Narrative Warnings",
    });

    expect(warnings).toHaveTextContent(
      "Recipient mention: The selected recipient's Full Rank Full Name was not detected in the narrative.",
    );

    expect(warnings).toHaveTextContent(
      'Possible duplicate: "the the" was detected in the narrative.',
    );

    expect(warnings).toHaveTextContent(
      'Possible rank usage: "MG" was detected in the narrative.',
    );

    expect(warnings).toHaveTextContent(
      "Possible punctuation error: Repeated punctuation was detected.",
    );

    const rankWarnings = Array.from(warnings.querySelectorAll("p")).filter(
      (warning) => warning.textContent.startsWith("Possible rank usage:"),
    );

    expect(rankWarnings).toHaveLength(1);
  });

  test("shows separate warnings for different rank abbreviations", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist John Smith maintained the defensive position. " +
      "MG Kenton coordinated the supporting element. " +
      "CPL Adams reinforced the objective.";

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

    const warnings = screen.getByRole("status", {
      name: "Narrative Warnings",
    });

    const rankWarnings = Array.from(warnings.querySelectorAll("p"))
      .map((warning) => warning.textContent)
      .filter((text) => text.startsWith("Possible rank usage:"));

    expect(rankWarnings).toHaveLength(2);
    expect(rankWarnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"MG"'),
        expect.stringContaining('"CPL"'),
      ]),
    );
  });

  test("renders multiple warning highlights in narrative order", async () => {
    const user = userEvent.setup();
    renderClient();

    const narrative =
      "Specialist John Smith held the the defensive position. " +
      "The element maintained control through the engagement. " +
      "MG Kenton reinforced the final objective.";

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

    const citation = screen.getByLabelText("Citation Narrative");

    const highlights = getHighlightTexts();

    expect(highlights).toEqual(["the the", "MG"]);
    expect(citation).toHaveTextContent(narrative);
  });
});
