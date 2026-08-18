import { fireEvent, render, screen } from "@testing-library/react";
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
  1010: {
    user: {
      userId: "1010",
      username: "General.M",
    },
    rank: {
      rankShort: "MG",
      rankFull: "Major General",
      rankId: "12",
    },
    realName: "Morgan General",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "109",
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

  test("shows a graceful unavailable state when the medal recipient roster cannot be loaded", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("fetch failed"),
    );

    render(await MedalRecommendationPage());

    expect(
      screen.getByRole("heading", {
        name: "Unable to load Medal Recommendation Aid",
      }),
    ).toBeVisible();

    expect(
      screen.getByText(/the medal recipient roster could not be loaded/i),
    ).toBeVisible();

    const retryLink = screen.getByRole("link", {
      name: "Try Again",
    });

    expect(retryLink).toHaveAttribute("href", "/medalrecommendation");
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
      "Specialist John Smith maintained an effective fighting position throughout the operation. " +
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

  test("clears the generated preview when the narrative changes", async () => {
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

    expect(
      screen.getByRole("region", {
        name: "Recommendation Preview",
      }),
    ).toBeVisible();

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.type(narrativeField, " Additional text.");

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test.each([
    [
      "Action Character",
      async (user) => {
        await user.click(
          screen.getByRole("combobox", {
            name: "Action Character",
          }),
        );

        await user.click(
          screen.getByRole("option", {
            name: "Heroic",
          }),
        );
      },
    ],
    [
      "Combat Element",
      async (user) => {
        const field = screen.getByRole("textbox", {
          name: "Combat Element",
        });

        await user.clear(field);
        await user.type(field, "squad leader");
      },
    ],
    [
      "Operation Title",
      async (user) => {
        const field = screen.getByRole("textbox", {
          name: "Operation Title",
        });

        await user.clear(field);
        await user.type(field, "Operation Market Garden");
      },
    ],
    [
      "Location",
      async (user) => {
        const field = screen.getByRole("textbox", {
          name: "Location",
        });

        await user.clear(field);
        await user.type(field, "Arnhem");
      },
    ],
    [
      "Operation Date",
      async (user) => {
        const field = screen.getByLabelText("Operation Date");

        await user.clear(field);
        await user.type(field, "2026-08-10");
      },
    ],
  ])(
    "clears the generated preview when %s changes",
    async (_field, changeField) => {
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

      expect(
        screen.getByRole("region", {
          name: "Recommendation Preview",
        }),
      ).toBeVisible();

      await changeField(user);

      expect(
        screen.queryByRole("region", {
          name: "Recommendation Preview",
        }),
      ).not.toBeInTheDocument();
    },
  );

  test("generates a complete Army Commendation Medal recommendation", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained an effective fighting position throughout the operation. " +
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

  test("does not duplicate Operation when the Operation Title already includes it", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith maintained an effective fighting position throughout the operation. " +
      "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
      "His performance contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    const operationTitle = screen.getByRole("textbox", {
      name: "Operation Title",
    });

    await user.clear(operationTitle);
    await user.type(operationTitle, "Operation Exfor");

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "during combat in Operation Exfor near Remagen",
    );

    expect(citation).not.toHaveTextContent("Operation Operation Exfor");
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

  test.each(["SPC.", "CPL.", "MG."])(
    "highlights the full abbreviated rank including the period for %s",
    async (rankToken) => {
      const user = userEvent.setup();

      await renderMedalRecommendationAid();

      const narrative =
        "Specialist John Smith maintained the defensive position during the opening engagement. " +
        `The ${rankToken} Kenton moved forward to reinforce the squad. ` +
        "The unit maintained control of the objective through the final contact.";

      await completeRecommendation(user, narrative);

      await user.click(
        screen.getByRole("button", {
          name: "Generate Recommendation",
        }),
      );

      const citation = screen.getByLabelText("Citation Narrative");

      const highlights = Array.from(citation.querySelectorAll("mark")).map(
        (highlight) => highlight.textContent,
      );

      expect(highlights).toContain(rankToken);
    },
  );

  test("preserves citation text exactly when highlight ranges overlap", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "The MG jammed. " +
      "The MG jammed. " +
      "Specialist John Smith cleared it.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    const expectedCitation =
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
      narrative +
      " Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    expect(citation.textContent).toBe(expectedCitation);
  });

  test("shows one rank warning when the same abbreviation appears with and without a period", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained the defensive position during the opening engagement. " +
      "MG Kenton coordinated the supporting element during the assault. " +
      "MG. Kenton continued directing the element through the final contact.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const warnings = screen.getByRole("status", {
      name: "Narrative Warnings",
    });

    const rankWarnings = Array.from(warnings.querySelectorAll("p")).filter(
      (warning) => warning.textContent.startsWith("Possible rank usage:"),
    );

    expect(rankWarnings).toHaveLength(1);

    const citation = screen.getByLabelText("Citation Narrative");

    const rankHighlights = Array.from(citation.querySelectorAll("mark"))
      .map((highlight) => highlight.textContent)
      .filter((text) => text === "MG" || text === "MG.");

    expect(rankHighlights).toEqual(["MG", "MG."]);
  });

  test("warns about a possible rank abbreviation without rewriting the narrative", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith dodged MG Fire while advancing toward the objective. " +
      "He maintained the defensive position throughout the engagement. " +
      "His actions contributed directly to the successful completion of the operation.";

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

    expect(preview).toBeVisible();
    expect(citation).toHaveTextContent(narrative);

    expect(
      screen.getByRole("status", {
        name: "Narrative Warnings",
      }),
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

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist Smith maintained the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
      "His actions contributed directly to the successful completion of the operation.";

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

    expect(preview).toBeVisible();

    expect(
      screen.getByRole("status", {
        name: "Narrative Warnings",
      }),
    ).toHaveTextContent(
      "Recipient mention: The selected recipient's Full Rank Full Name was not detected in the narrative. Verify that the recipient is identified correctly.",
    );

    expect(citation.querySelector("mark")).not.toBeInTheDocument();
  });

  test("does not show a recipient-mention warning when Full Rank Full Name is present", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
      "His actions contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.queryByText(
        /the selected recipient's full rank full name was not detected in the narrative/i,
      ),
    ).not.toBeInTheDocument();
  });

  test("accepts the citation name format when a roster name contains a middle name or initial", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist Taylor Smith maintained the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
      "His actions contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative, {
      recipientQuery: "Smith.TJ",
      recipientUsername: "Smith.TJ",
    });

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

    expect(
      screen.getByRole("region", {
        name: "Recommendation Preview",
      }),
    ).toHaveTextContent("Specialist Taylor Smith");

    expect(
      screen.queryByText(
        /the selected recipient's full rank full name was not detected in the narrative/i,
      ),
    ).not.toBeInTheDocument();
  });

  test("shows a soft sentence-count warning without blocking generation", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "Specialist John Smith maintained the defensive position throughout the operation.",
    );

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

    expect(
      screen.getByRole("status", {
        name: "Narrative Warnings",
      }),
    ).toHaveTextContent(
      "Sentence count: This medal requires a minimum of three sentences. The narrative may not meet that requirement. Please verify before submitting.",
    );
  });

  test("warns about a consecutive duplicate word and highlights only the duplicated words", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained the the defensive position throughout the operation. " +
      "He repeatedly engaged enemy forces during each major contact. " +
      "His actions contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(
      screen.getByRole("status", {
        name: "Narrative Warnings",
      }),
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

    await renderMedalRecommendationAid();

    const duplicatedSentence =
      "Specialist John Smith secured the defensive position.";

    const narrative =
      `${duplicatedSentence} ${duplicatedSentence} ` +
      "His actions contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(
      screen.getByRole("status", {
        name: "Narrative Warnings",
      }),
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

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained the defensive position,, while the squad advanced. " +
      "He repeatedly engaged enemy forces during each major contact. " +
      "His actions contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(
      screen.getByRole("status", {
        name: "Narrative Warnings",
      }),
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

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained the defensive position... despite sustained enemy fire. " +
      "He repeatedly supported his squad during each major contact. " +
      "His actions contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(
      screen.queryByText(/possible punctuation error/i),
    ).not.toBeInTheDocument();

    expect(citation).toHaveTextContent("position... despite");
    expect(citation).toHaveTextContent(narrative);
  });

  test("clears narrative warnings when the user corrects the narrative and regenerates", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "Specialist John Smith maintained the the defensive position throughout the operation. " +
        "He repeatedly engaged enemy forces during each major contact. " +
        "His actions contributed directly to the successful completion of the operation.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.getByRole("status", {
        name: "Narrative Warnings",
      }),
    ).toBeVisible();

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.clear(narrativeField);
    await user.type(
      narrativeField,
      "Specialist John Smith maintained the defensive position throughout the operation. " +
        "He repeatedly engaged enemy forces during each major contact. " +
        "His actions contributed directly to the successful completion of the operation.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.queryByRole("status", {
        name: "Narrative Warnings",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByLabelText("Citation Narrative").querySelector("mark"),
    ).not.toBeInTheDocument();
  });

  test("shows no narrative warnings for compliant narrative text", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "Specialist John Smith maintained the defensive position throughout the operation. " +
        "He repeatedly engaged enemy forces during each major contact. " +
        "His actions contributed directly to the successful completion of the operation.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.queryByRole("status", {
        name: "Narrative Warnings",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByLabelText("Citation Narrative").querySelector("mark"),
    ).not.toBeInTheDocument();
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
      "Specialist John Smith maintained the position throughout the operation.",
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
      "Specialist John Smith maintained the position throughout the operation.",
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
      "Specialist John Smith maintained the position throughout the operation.",
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
      "Specialist John Smith maintained the position throughout the operation.",
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

  test("prevents generation when Operation Date is in the future", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await completeRecommendation(
      user,
      "Specialist John Smith maintained the defensive position throughout the operation. " +
        "He repeatedly engaged enemy forces during each major contact. " +
        "His actions contributed directly to the successful completion of the operation.",
      {
        omit: "operationDate",
      },
    );

    await user.type(screen.getByLabelText("Operation Date"), "2099-01-01");

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByLabelText("Operation Date")).toHaveAttribute(
      "aria-invalid",
      "true",
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

  test("treats tomorrow in the user's local timezone as a future Operation Date", async () => {
    const originalTimezone = process.env.TZ;
    const user = userEvent.setup();

    process.env.TZ = "America/Los_Angeles";

    try {
      await renderMedalRecommendationAid();

      await completeRecommendation(
        user,
        "Specialist John Smith maintained the defensive position throughout the operation. " +
          "He repeatedly engaged enemy forces during each major contact. " +
          "His actions contributed directly to the successful completion of the operation.",
        {
          omit: "operationDate",
        },
      );

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-15T03:30:00.000Z"));

      fireEvent.change(screen.getByLabelText("Operation Date"), {
        target: { value: "2026-08-15" },
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Generate Recommendation",
        }),
      );

      expect(screen.getByLabelText("Operation Date")).toHaveAttribute(
        "aria-invalid",
        "true",
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        /complete all required fields before generating a recommendation/i,
      );

      expect(
        screen.queryByRole("region", {
          name: "Recommendation Preview",
        }),
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();

      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    }
  });

  test("allows generation when Operation Date is today in the user's local timezone", async () => {
    const originalTimezone = process.env.TZ;
    const user = userEvent.setup();

    process.env.TZ = "America/Los_Angeles";

    try {
      await renderMedalRecommendationAid();

      await completeRecommendation(
        user,
        "Specialist John Smith maintained the defensive position throughout the operation. " +
          "He repeatedly engaged enemy forces during each major contact. " +
          "His actions contributed directly to the successful completion of the operation.",
        {
          omit: "operationDate",
        },
      );

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-15T03:30:00.000Z"));

      fireEvent.change(screen.getByLabelText("Operation Date"), {
        target: { value: "2026-08-14" },
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Generate Recommendation",
        }),
      );

      expect(screen.getByLabelText("Operation Date")).not.toHaveAttribute(
        "aria-invalid",
      );

      expect(
        screen.getByRole("region", {
          name: "Recommendation Preview",
        }),
      ).toBeVisible();

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();

      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    }
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
      "  Specialist John Smith maintained the position throughout the operation.  ",
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
      "Specialist John Smith maintained the position throughout the operation.",
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
      "Specialist John Smith maintained an effective fighting position throughout the operation. " +
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
      "Specialist John Smith maintained an effective fighting position throughout the operation. " +
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
