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
      "Specialist Smith maintained an effective fighting position throughout the operation.",
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
      "Specialist Smith maintained an effective fighting position throughout the operation.",
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
      "Specialist Smith maintained an effective fighting position throughout the operation.",
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
      "Specialist Smith maintained an effective fighting position throughout the operation.",
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
      "Specialist Smith maintained an effective fighting position throughout the operation.",
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
      "Specialist Smith maintained an effective fighting position throughout the operation. " +
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
      "Specialist Smith maintained an effective fighting position throughout the operation. " +
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

  test("normalizes first and later recipient mentions to the required name format", async () => {
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

  test("does not treat an ordinary word matching a recipient surname as a name mention", async () => {
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

  test("normalizes shortened and alternate first-name references for recipients with middle names", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "SPC Smith maintained an effective fighting position throughout the operation. " +
      "Smith continued to support the squad during each major contact. " +
      "Taylor Smith completed the operation while maintaining control of the position. " +
      "John Smith supported the final defensive action.";

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

    expect(citation).toHaveTextContent(
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        "Specialist Taylor Morgan Smith maintained an effective fighting position throughout the operation. " +
        "Specialist Smith continued to support the squad during each major contact. " +
        "Specialist Smith completed the operation while maintaining control of the position. " +
        "Specialist Smith supported the final defensive action. " +
        "Specialist Taylor Morgan Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("renders the citation as one continuous narrative block", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist Smith maintained an effective fighting position throughout the operation. " +
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
      "Specialist Smith maintained an effective fighting position throughout the operation. " +
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
