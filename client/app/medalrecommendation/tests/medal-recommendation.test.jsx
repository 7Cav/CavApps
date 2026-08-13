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

  test("lets a user search for and select a medal recipient", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await selectRecipient(user);

    expect(screen.getByText("Selected recipient: Smith.J")).toBeVisible();

    expect(screen.getByText("Specialist John Smith")).toBeVisible();
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

  test("normalizes only the first recipient mention and leaves later narrative mentions unchanged", async () => {
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
        "Smith continued to support the squad during each major contact. " +
        "John Smith completed the operation while maintaining control of the position. " +
        "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("leaves later common-word surname text unchanged", async () => {
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
        "It was a long night, but SPC Long continued to hold the line. " +
        "Adam Long completed the operation after the final enemy attack. " +
        "Specialist Adam Long's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("removes middle names from generated recipient text and leaves later mentions unchanged", async () => {
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
        "Smith continued to support the squad during each major contact. " +
        "Taylor Smith maintained control of the position through the final attack. " +
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

  test("normalizes an explicit full-rank full-roster-name first mention", async () => {
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
      "Taylor Smith maintained control through the final engagement. " +
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
      "Smith continued to support the squad. " +
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
      "Taylor Smith continued to support the squad. " +
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
