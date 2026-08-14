import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedalRecommendationPage from "../page";

const combatRoster = {
  1001: {
    user: {
      userId: "1001",
      username: "Smith.J",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "Specialist",
      rankId: "5",
    },
    realName: "John Smith",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "100",
    },
    secondaries: [],
  },
  1002: {
    user: {
      userId: "1002",
      username: "Long.A",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "Specialist",
      rankId: "5",
    },
    realName: "Adam Long",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "101",
    },
    secondaries: [],
  },
  1003: {
    user: {
      userId: "1003",
      username: "Smith.TM",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "Specialist",
      rankId: "5",
    },
    realName: "Taylor Morgan Smith",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "102",
    },
    secondaries: [],
  },
  1004: {
    user: {
      userId: "1004",
      username: "Rankless.T",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "",
      rankId: "5",
    },
    realName: "Test Rankless",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "103",
    },
    secondaries: [],
  },
  1005: {
    user: {
      userId: "1005",
      username: "Nameless.T",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "Specialist",
      rankId: "5",
    },
    realName: "",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "104",
    },
    secondaries: [],
  },
  1006: {
    user: {
      userId: "1006",
      username: "Rankspace.T",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "   ",
      rankId: "5",
    },
    realName: "Test Rankspace",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "105",
    },
    secondaries: [],
  },
  1007: {
    user: {
      userId: "1007",
      username: "Namespace.T",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "Specialist",
      rankId: "5",
    },
    realName: "   ",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "106",
    },
    secondaries: [],
  },
  1008: {
    user: {
      userId: "1008",
      username: "Smith.TJ",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "Specialist",
      rankId: "5",
    },
    realName: "Taylor J. Smith",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "107",
    },
    secondaries: [],
  },
  1009: {
    user: {
      userId: "1009",
      username: "Kenton.W",
    },
    rank: {
      rankShort: "Cpl",
      rankFull: "Corporal",
      rankId: "6",
    },
    realName: "Wade Kenton",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "108",
    },
    secondaries: [],
  },
};

async function renderMedalRecommendationAid() {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      profiles: combatRoster,
    }),
  });

  render(await MedalRecommendationPage());
}

async function selectRecipient(user, query = "Smi", username = "Smith.J") {
  await user.type(
    screen.getByRole("textbox", {
      name: "Recipient",
    }),
    query,
  );

  await user.click(
    await screen.findByRole("button", {
      name: username,
    }),
  );
}

async function completeRecommendation(
  user,
  narrative,
  { omit, recipientQuery = "Smi", recipientUsername = "Smith.J" } = {},
) {
  await selectRecipient(user, recipientQuery, recipientUsername);

  if (omit !== "actionCharacter") {
    await user.click(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "Skillful",
      }),
    );
  }

  if (omit !== "combatElement") {
    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "rifleman",
    );
  }

  if (omit !== "operationTitle") {
    await user.type(
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
      "Exfor",
    );
  }

  if (omit !== "location") {
    await user.type(
      screen.getByRole("textbox", {
        name: "Location",
      }),
      "Remagen",
    );
  }

  if (omit !== "operationDate") {
    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");
  }

  if (omit !== "narrative") {
    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.click(narrativeField);
    await user.paste(narrative);
  }
}

describe("Medal Recommendation Aid", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("shows the supported medal when a user opens the aid", async () => {
    await renderMedalRecommendationAid();

    expect(
      screen.getByRole("heading", {
        name: "Medal Recommendation Aid",
      }),
    ).toBeVisible();

    expect(screen.getByText("Army Commendation Medal")).toBeVisible();
  });

  test("does not show required-field errors before generation is attempted", async () => {
    await renderMedalRecommendationAid();

    expect(
      screen.getByRole("textbox", {
        name: "Recipient",
      }),
    ).not.toHaveAttribute("aria-invalid", "true");

    expect(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    ).not.toHaveAttribute("aria-invalid", "true");

    expect(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
    ).not.toHaveAttribute("aria-invalid", "true");

    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("lets a user search for and select a medal recipient", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await selectRecipient(user);

    expect(screen.getByText("Selected recipient: Smith.J")).toBeVisible();

    expect(screen.getByText("Specialist John Smith")).toBeVisible();
  });

  test("filters recipient suggestions to usernames matching the search", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await user.type(
      screen.getByRole("textbox", {
        name: "Recipient",
      }),
      "Smi",
    );

    expect(
      await screen.findByRole("button", {
        name: "Smith.J",
      }),
    ).toBeVisible();

    expect(
      screen.queryByRole("button", {
        name: "Long.A",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Action Character is missing", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      {
        omit: "actionCharacter",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Combat Element is missing", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      {
        omit: "combatElement",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Operation Title is missing", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      {
        omit: "operationTitle",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Location is missing", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      {
        omit: "location",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Operation Date is missing", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      {
        omit: "operationDate",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Narrative is missing", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(user, "", {
      omit: "narrative",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("marks a missing required field as invalid after generation is attempted", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      {
        omit: "combatElement",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const combatElement = screen.getByRole("textbox", {
      name: "Combat Element",
    });

    expect(combatElement).toHaveAttribute("aria-invalid", "true");
    expect(combatElement).toHaveAccessibleDescription("Required");
    expect(combatElement).toHaveClass("border-destructive");

    expect(screen.getByText("Required")).toBeVisible();

    expect(
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
    ).not.toHaveAttribute("aria-invalid", "true");
  });

  test("clears a required field error immediately when the user fixes the field", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      {
        omit: "combatElement",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const combatElement = screen.getByRole("textbox", {
      name: "Combat Element",
    });

    expect(combatElement).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Required")).toBeVisible();

    await user.type(combatElement, "rifleman");

    expect(combatElement).not.toHaveAttribute("aria-invalid", "true");

    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  test("clears attempted validation state after a successful generation", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      {
        omit: "combatElement",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const combatElement = screen.getByRole("textbox", {
      name: "Combat Element",
    });

    expect(combatElement).toHaveAttribute("aria-invalid", "true");

    await user.type(combatElement, "rifleman");

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.getByRole("region", {
        name: "Recommendation Preview",
      }),
    ).toBeVisible();

    await user.clear(combatElement);

    expect(combatElement).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("marks every missing required control when an empty recommendation is submitted", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const requiredControls = [
      screen.getByRole("textbox", {
        name: "Recipient",
      }),
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
      screen.getByRole("textbox", {
        name: "Location",
      }),
      screen.getByLabelText("Operation Date"),
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
    ];

    for (const control of requiredControls) {
      expect(control).toHaveAttribute("aria-invalid", "true");
      expect(control).toHaveAccessibleDescription("Required");
      expect(control).toHaveClass("border-destructive");
    }

    expect(screen.getAllByText("Required")).toHaveLength(7);

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("clears the previous recommendation when regeneration fails", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith maintained an effective fighting position throughout the operation. " +
      "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
      "His performance contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });

    expect(preview).toBeVisible();
    expect(preview).toHaveTextContent("Operation Exfor");

    const operationTitle = screen.getByRole("textbox", {
      name: "Operation Title",
    });

    await user.clear(operationTitle);
    await user.type(operationTitle, "Changed Operation");

    await user.clear(
      screen.getByRole("textbox", {
        name: "Location",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("generates a complete Army Commendation Medal recommendation", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith maintained an effective fighting position throughout the operation. " +
      "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
      "His performance contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });

    expect(preview).toHaveTextContent("Army Commendation Medal");
    expect(preview).toHaveTextContent("Specialist John Smith");

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        "Specialist John Smith maintained an effective fighting position throughout the operation. " +
        "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
        "His performance contributed directly to the successful completion of the operation. " +
        "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("uses the selected roster member identity without asking the user to re-enter it", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await selectRecipient(user);

    expect(screen.getByText("Specialist John Smith")).toBeVisible();

    expect(
      screen.queryByRole("textbox", {
        name: "Recipient Rank",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("textbox", {
        name: "Recipient Full Name",
      }),
    ).not.toBeInTheDocument();
  });

  test("normalizes selected-recipient references throughout the narrative body", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith maintained an effective fighting position throughout the operation. " +
      "Smith continued to support the squad during each major contact. " +
      "John Smith completed the operation while maintaining control of the position.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        "Specialist John Smith maintained an effective fighting position throughout the operation. " +
        "Specialist Smith continued to support the squad during each major contact. " +
        "Specialist Smith completed the operation while maintaining control of the position. " +
        "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("expands an abbreviated rank for another Trooper in the narrative", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith maintained the defensive position during the opening engagement. " +
      "SPC Perrier moved forward to reinforce the squad.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "Specialist John Smith maintained the defensive position during the opening engagement. " +
        "Specialist Perrier moved forward to reinforce the squad.",
    );

    expect(citation).not.toHaveTextContent("SPC Perrier");
  });

  test("shows a soft formatting notice when the generator changes narrative text", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained the defensive position during the opening engagement.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.getByRole("status", {
        name: "Formatting Adjustments",
      }),
    ).toHaveTextContent(
      "Formatting adjustments were applied automatically. Review the highlighted changes before submitting.",
    );
  });

  test("softly highlights only references automatically changed inside the narrative", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Cpl Kenton helped SPC Perrier during the engagement. " +
      "Cpl Kenton won the engagement.";

    await completeRecommendation(user, narrative, {
      recipientQuery: "Ken",
      recipientUsername: "Kenton.W",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");
    const highlights = Array.from(citation.querySelectorAll("mark"));

    expect(highlights).toHaveLength(3);
    expect(highlights[0]).toHaveTextContent(/^Corporal Wade Kenton$/);
    expect(highlights[1]).toHaveTextContent(/^Specialist Perrier$/);
    expect(highlights[2]).toHaveTextContent(/^Corporal Kenton$/);

    for (const highlight of highlights) {
      expect(highlight).toHaveClass("bg-amber-400/10");
      expect(highlight).toHaveClass("text-inherit");
      expect(highlight).not.toHaveClass("bg-amber-300");
      expect(highlight).not.toHaveClass("text-black");
    }
  });

  test("does not mark generated opening or closing language as a formatting adjustment", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "Cpl Kenton helped SPC Perrier during the engagement.",
      {
        recipientQuery: "Ken",
        recipientUsername: "Kenton.W",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");
    const highlights = Array.from(citation.querySelectorAll("mark"));

    expect(highlights).toHaveLength(2);

    expect(
      highlights.some((highlight) =>
        highlight.textContent.includes(
          "For skillful actions over an entire operation",
        ),
      ),
    ).toBe(false);

    expect(
      highlights.some((highlight) =>
        highlight.textContent.includes("reflect great credit upon themselves"),
      ),
    ).toBe(false);
  });

  test("normalizes abbreviated ranks without requiring matching capitalization", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "spc smith maintained the defensive position during the opening engagement. " +
      "cpl Kenton moved forward to reinforce the squad.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "Specialist John Smith maintained the defensive position during the opening engagement. " +
        "Corporal Kenton moved forward to reinforce the squad.",
    );

    expect(citation).not.toHaveTextContent("spc smith");
    expect(citation).not.toHaveTextContent("cpl Kenton");
  });

  test("does not show formatting adjustments when the narrative already follows the rank and name format", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained the defensive position during the opening engagement. " +
      "Specialist Smith continued to support the squad throughout the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.queryByRole("status", {
        name: "Formatting Adjustments",
      }),
    ).not.toBeInTheDocument();

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.querySelector("mark")).not.toBeInTheDocument();
  });

  test("recomputes formatting adjustments when the user corrects the narrative and regenerates", async () => {
    const user = userEvent.setup();

    const originalNarrative =
      "Cpl Kenton helped SPC Perrier during the engagement. " +
      "Cpl Kenton won the engagement.";

    await renderMedalRecommendationAid();

    await completeRecommendation(user, originalNarrative, {
      recipientQuery: "Ken",
      recipientUsername: "Kenton.W",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.getByRole("status", {
        name: "Formatting Adjustments",
      }),
    ).toBeVisible();

    const narrative = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.clear(narrative);
    await user.type(
      narrative,
      "Corporal Wade Kenton helped Specialist Perrier during the engagement. " +
        "Corporal Kenton won the engagement.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.queryByRole("status", {
        name: "Formatting Adjustments",
      }),
    ).not.toBeInTheDocument();

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.querySelector("mark")).not.toBeInTheDocument();
  });

  test("keeps the worksheet narrative unchanged while normalizing the generated citation", async () => {
    const user = userEvent.setup();

    const originalNarrative =
      "Cpl Kenton helped SPC Perrier during the engagement. " +
      "Cpl Kenton won the engagement.";

    await renderMedalRecommendationAid();

    await completeRecommendation(user, originalNarrative, {
      recipientQuery: "Ken",
      recipientUsername: "Kenton.W",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
    ).toHaveValue(originalNarrative);

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "Corporal Wade Kenton helped Specialist Perrier during the engagement. " +
        "Corporal Kenton won the engagement.",
    );
  });

  test("normalizes selected-recipient references without changing ordinary common-word surname text", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Long secured the position during the opening engagement. " +
      "It was a long night, but SPC Long continued to hold the line. " +
      "Adam Long completed the operation after the final enemy attack.";

    await completeRecommendation(user, narrative, {
      recipientQuery: "Lon",
      recipientUsername: "Long.A",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        "Specialist Adam Long secured the position during the opening engagement. " +
        "It was a long night, but Specialist Long continued to hold the line. " +
        "Specialist Long completed the operation after the final enemy attack. " +
        "Specialist Adam Long's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("removes middle names and normalizes later selected-recipient references", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith established the defensive position before the main engagement. " +
      "Smith continued to support the squad during each major contact. " +
      "Taylor Smith maintained control of the position through the final attack.";

    await completeRecommendation(user, narrative, {
      recipientQuery: "Smi",
      recipientUsername: "Smith.TM",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });

    expect(preview).toHaveTextContent("Specialist Taylor Smith");
    expect(preview).not.toHaveTextContent("Taylor Morgan Smith");

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        "Specialist Taylor Smith established the defensive position before the main engagement. " +
        "Specialist Smith continued to support the squad during each major contact. " +
        "Specialist Smith maintained control of the position through the final attack. " +
        "Specialist Taylor Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("prevents generation when no recipient is selected", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await user.click(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "Skillful",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "rifleman",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
      "Exfor",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Location",
      }),
      "Remagen",
    );

    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");

    await user.type(
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
      "SPC Smith maintained the position throughout the operation.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when the selected recipient has no full rank", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Rankless maintained the position throughout the operation.",
      {
        recipientQuery: "Ran",
        recipientUsername: "Rankless.T",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when the selected recipient has no real name", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Nameless maintained the position throughout the operation.",
      {
        recipientQuery: "Nam",
        recipientUsername: "Nameless.T",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when the selected recipient rank is whitespace only", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Rankspace maintained the position throughout the operation.",
      {
        recipientQuery: "Ranks",
        recipientUsername: "Rankspace.T",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when the selected recipient real name is whitespace only", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Namespace maintained the position throughout the operation.",
      {
        recipientQuery: "Names",
        recipientUsername: "Namespace.T",
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("rejects a whitespace-only Combat Element", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained the position throughout the operation.",
      {
        omit: "combatElement",
      },
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "   ",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("rejects a whitespace-only Operation Title", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained the position throughout the operation.",
      {
        omit: "operationTitle",
      },
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
      "   ",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("rejects a whitespace-only Location", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained the position throughout the operation.",
      {
        omit: "location",
      },
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Location",
      }),
      "   ",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("rejects a whitespace-only Narrative", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(user, "", {
      omit: "narrative",
    });

    await user.type(
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
      "   ",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("normalizes an explicit full-rank full-roster-name first mention and later references", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist Taylor Morgan Smith established the defensive position. " +
      "Taylor Smith maintained control through the final engagement.";

    await completeRecommendation(user, narrative, {
      recipientQuery: "Smi",
      recipientUsername: "Smith.TM",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    const expectedCitation =
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
      "Specialist Taylor Smith established the defensive position. " +
      "Specialist Smith maintained control through the final engagement. " +
      "Specialist Taylor Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    expect(citation.textContent).toBe(expectedCitation);
  });

  test("normalizes the first recipient mention without requiring matching capitalization", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "spc smith maintained the defensive position. " +
      "Smith continued to support the squad.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    const expectedCitation =
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
      "Specialist John Smith maintained the defensive position. " +
      "Specialist Smith continued to support the squad. " +
      "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    expect(citation.textContent).toBe(expectedCitation);
  });

  test("does not treat regex characters in a roster name as wildcard matches", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist Taylor JX Smith maintained the defensive position throughout the operation.";

    await completeRecommendation(user, narrative, {
      recipientQuery: "Smi",
      recipientUsername: "Smith.TJ",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    const expectedCitation =
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
      "Specialist Taylor JX Smith maintained the defensive position throughout the operation. " +
      "Specialist Taylor Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    expect(citation.textContent).toBe(expectedCitation);
    expect(citation.querySelector("mark")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("status", {
        name: "Formatting Adjustments",
      }),
    ).not.toBeInTheDocument();
  });

  test("normalizes a first mention containing regex characters in the roster name", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist Taylor J. Smith maintained the defensive position throughout the operation. " +
      "Taylor Smith continued to support the squad.";

    await completeRecommendation(user, narrative, {
      recipientQuery: "Smi",
      recipientUsername: "Smith.TJ",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    const expectedCitation =
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
      "Specialist Taylor Smith maintained the defensive position throughout the operation. " +
      "Specialist Smith continued to support the squad. " +
      "Specialist Taylor Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    expect(citation.textContent).toBe(expectedCitation);
  });

  test("trims valid text fields before generating the citation", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await selectRecipient(user);

    await user.click(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "Skillful",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "  rifleman  ",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
      "  Exfor  ",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Location",
      }),
      "  Remagen  ",
    );

    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");

    await user.type(
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
      "  SPC Smith maintained the position throughout the operation.  ",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    const expectedCitation =
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
      "Specialist John Smith maintained the position throughout the operation. " +
      "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    expect(citation.textContent).toBe(expectedCitation);
  });

  test("shows the generated recipient identity independently from the citation", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "SPC Smith maintained the position throughout the operation.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });

    const paragraphs = preview.querySelectorAll("p");

    expect(paragraphs[0]).toHaveTextContent(/^Specialist John Smith$/);
  });

  test("renders the citation as one continuous narrative block", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith maintained an effective fighting position throughout the operation. " +
      "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
      "His performance contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toBeVisible();

    expect(preview.querySelectorAll("p")).toHaveLength(2);
  });

  test("shows the Army Commendation Medal ribbon in the generated recommendation", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith maintained an effective fighting position throughout the operation. " +
      "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
      "His performance contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const ribbon = screen.getByRole("img", {
      name: "Army Commendation Medal ribbon",
    });

    expect(ribbon).toBeVisible();

    expect(ribbon).toHaveAttribute(
      "src",
      "https://wiki.7cav.us/images/d/dc/ARCOM.jpg",
    );
  });
});
