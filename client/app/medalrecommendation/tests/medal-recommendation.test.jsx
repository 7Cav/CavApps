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

async function selectRecipient(user) {
  await user.type(
    screen.getByRole("textbox", {
      name: "Recipient",
    }),
    "Smi",
  );

  await user.click(
    await screen.findByRole("button", {
      name: "Smith.J",
    }),
  );
}

async function completeRecommendation(user, narrative) {
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

  const narrativeField = screen.getByRole("textbox", {
    name: "Narrative",
  });

  await user.click(narrativeField);
  await user.paste(narrative);
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

  test("prevents a user from generating an incomplete recommendation", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    await selectRecipient(user);

    expect(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    ).toBeVisible();

    expect(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
    ).toBeVisible();

    expect(
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
    ).toBeVisible();

    expect(
      screen.getByRole("textbox", {
        name: "Location",
      }),
    ).toBeVisible();

    expect(screen.getByLabelText("Operation Date")).toBeVisible();

    expect(
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
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

  test("normalizes the first recipient mention to full rank and full name", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist Smith maintained an effective fighting position throughout the operation. " +
      "Smith continued to support the squad during each major contact. " +
      "His performance contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation).toHaveTextContent(
      "Specialist John Smith maintained an effective fighting position throughout the operation.",
    );

    expect(citation).toHaveTextContent(
      "Smith continued to support the squad during each major contact.",
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
