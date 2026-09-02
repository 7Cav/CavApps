import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedalRecommendationPage from "../page";
import { OPERATION_MEDALS } from "../lib/medal-definitions.js";
import { renderClient, selectAward, selectRecipient } from "./test-helpers.js";

const MEDAL_GUIDANCE_CASES = [
  [
    "Army Commendation Medal",
    /awarded for skillful or heroic actions over an entire operation/i,
    /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    [],
  ],
  [
    "Army Commendation Medal With Valor",
    /awarded for a single act of heroism or skill under fire/i,
    /describe how the trooper demonstrated heroism and skill in a single act during the operation/i,
    [],
  ],
  [
    "Air Medal",
    /awarded to any member of an aircrew, including pilots/i,
    /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    ["The recipient must be a member of an aircrew. Pilots are eligible."],
  ],
  [
    "Purple Heart",
    /awarded for a single or multiple heroic actions while under enemy fire/i,
    /describe how the trooper's one or more heroic actions while under fire resulted in their sacrifice and death/i,
    [
      "The recipient must have been killed while undertaking the combat actions being cited.",
    ],
  ],
  [
    "Bronze Star Medal",
    /awarded for skillful or heroic actions over the entire operation/i,
    /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    [],
  ],
  [
    "Bronze Star Medal With Valor",
    /awarded for a single act demonstrating extraordinary heroism and skill while under enemy fire/i,
    /describe how the trooper demonstrated extraordinary heroism in a single act during the operation/i,
    [
      "The recipient must have survived the cited action to be eligible for this award.",
    ],
  ],
  [
    "Distinguished Flying Cross",
    /awarded to pilots for a single act demonstrating extraordinary heroism and skill while under enemy fire/i,
    /describe how the trooper demonstrated extraordinary heroism in a single act during the operation/i,
    [
      "The recipient must be a pilot.",
      "Air crew who are not pilots are not eligible.",
      "The pilot must possess their flight wings.",
      "The recipient must have survived the cited action.",
    ],
  ],
  [
    "Silver Star",
    /awarded for actions demonstrating extraordinary heroism, skill, and leadership under fire/i,
    /describe how the trooper demonstrated extraordinary heroism and skill or leadership under fire in the operation/i,
    [
      "The recipient must have been serving in an official leadership position.",
      "The recipient must have survived the cited action.",
    ],
  ],
  [
    "Distinguished Service Cross",
    /awarded for actions, or a single act, demonstrating extraordinary heroism and skill under fire/i,
    /describe how the trooper demonstrated extraordinary heroism and skill or leadership under fire in the operation/i,
    [
      "The recipient must have survived the cited action.",
      "Against a live enemy (non-Cav) force or in an internal player-versus-player match, the cited actions must have been unquestionably responsible for the successful outcome of the mission.",
      "Against a computer opponent, the recipient must have been serving as Officer-In-Command (OIC) of the official operation and their actions must have been unquestionably responsible for the successful outcome of the mission.",
    ],
  ],
];

describe("Operation Medal guidance contracts", () => {
  test.each(MEDAL_GUIDANCE_CASES)(
    "%s declares its criteria, narrative guidance, and eligibility notes",
    (awardName, criteriaPattern, guidancePattern, eligibilityNotes) => {
      const medal = OPERATION_MEDALS.find(({ name }) => name === awardName);

      expect(medal, `Missing medal definition for ${awardName}`).toBeDefined();
      expect(medal.criteria).toMatch(criteriaPattern);
      expect(medal.narrativeGuidance).toMatch(guidancePattern);
      expect(medal.eligibilityNotes).toEqual(eligibilityNotes);
    },
  );
});

describe("Medal Recommendation Aid - selection and guidance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("shows all supported Operation Medals in the Award selector", async () => {
    const user = userEvent.setup();
    renderClient();

    expect(
      screen.getByRole("heading", { name: "Medal Recommendation Aid" }),
    ).toBeVisible();

    await user.click(screen.getByRole("combobox", { name: "Award" }));

    const operationMedals = [
      "Army Commendation Medal",
      "Army Commendation Medal With Valor",
      "Air Medal",
      "Purple Heart",
      "Bronze Star Medal",
      "Bronze Star Medal With Valor",
      "Distinguished Flying Cross",
      "Silver Star",
      "Distinguished Service Cross",
    ];

    for (const medalName of operationMedals) {
      expect(screen.getByRole("option", { name: medalName })).toBeVisible();
    }
  });

  test("keeps the worksheet hidden until an award is selected", async () => {
    const user = userEvent.setup();
    renderClient();

    expect(
      screen.queryByRole("textbox", { name: "Recipient" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Generate Recommendation" }),
    ).not.toBeInTheDocument();

    await selectAward(user);

    expect(screen.getByRole("textbox", { name: "Recipient" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    ).toBeVisible();
  });

  test("shows the selected medal content in the recommendation worksheet", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user, "Distinguished Flying Cross");

    expect(
      screen.getAllByRole("heading", { name: "Distinguished Flying Cross" }),
    ).toHaveLength(2);
    expect(
      screen.getByText("Create a Distinguished Flying Cross recommendation."),
    ).toBeVisible();
    expect(
      screen.getByText(
        /awarded to pilots for a single act demonstrating extraordinary heroism and skill while under enemy fire/i,
      ),
    ).toBeVisible();

    expect(
      screen.getByRole("heading", { name: "Narrative Guidance" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        /describe how the trooper demonstrated extraordinary heroism in a single act during the operation/i,
      ),
    ).toBeVisible();
  });

  test("shows eligibility guidance for medals with eligibility requirements", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user, "Distinguished Flying Cross");

    expect(screen.getByRole("heading", { name: "Eligibility" })).toBeVisible();
    expect(screen.getByText("The recipient must be a pilot.")).toBeVisible();
    expect(
      screen.getByText("Air crew who are not pilots are not eligible."),
    ).toBeVisible();
    expect(
      screen.getByText("The pilot must possess their flight wings."),
    ).toBeVisible();
    expect(
      screen.getByText("The recipient must have survived the cited action."),
    ).toBeVisible();
  });

  test("does not show eligibility guidance when the selected medal has no eligibility requirements", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user, "Army Commendation Medal");

    expect(
      screen.queryByRole("heading", { name: "Eligibility" }),
    ).not.toBeInTheDocument();
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

    const retryLink = screen.getByRole("link", { name: "Try Again" });
    expect(retryLink).toHaveAttribute("href", "/medalrecommendation");
  });

  test("lets a user search for and select a medal recipient", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user);

    const recipientField = screen.getByRole("textbox", {
      name: "Recipient",
    });

    await user.type(recipientField, "Smi");
    await user.click(await screen.findByRole("button", { name: "Smith.J" }));

    expect(recipientField).toHaveValue("Smith.J");
    expect(screen.getByText("Selected recipient: Smith.J")).toBeVisible();
    expect(screen.getByText("Specialist John Smith")).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "Recipient Rank" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Recipient Full Name" }),
    ).not.toBeInTheDocument();
  });

  test("filters recipient suggestions to usernames matching the search", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user);

    await user.type(screen.getByRole("textbox", { name: "Recipient" }), "Smi");

    expect(
      await screen.findByRole("button", { name: "Smith.J" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Long.A" }),
    ).not.toBeInTheDocument();
  });

  test("matches recipient searches regardless of case or surrounding whitespace", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user);

    await user.type(
      screen.getByRole("textbox", { name: "Recipient" }),
      "  SMITH  ",
    );

    expect(
      await screen.findByRole("button", { name: "Smith.J" }),
    ).toBeVisible();
  });

  test("shows Action Character options from the selected medal definition", async () => {
    const user = userEvent.setup();

    renderClient();
    await selectAward(user, "Army Commendation Medal");

    expect(
      screen.getByRole("textbox", { name: "Combat Element" }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    );

    expect(
      screen.getByRole("option", {
        name: "Skillful",
      }),
    ).toBeVisible();

    expect(
      screen.getByRole("option", {
        name: "Heroic",
      }),
    ).toBeVisible();
  });

  test("shows Purple Heart Scope instead of Action Character", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user, "Purple Heart");

    expect(
      screen.queryByRole("combobox", { name: "Action Character" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Scope" })).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Combat Element" }),
    ).toBeVisible();
  });

  test("shows the Distinguished Flying Cross Airframe control", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user, "Distinguished Flying Cross");

    expect(
      screen.queryByRole("combobox", { name: "Action Character" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Scope" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Airframe" })).toHaveAttribute(
      "placeholder",
      "an F/A-18, a Rotary-Wing, etc.",
    );
  });

  test("shows Leadership Element for the Silver Star", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user, "Silver Star");

    expect(
      screen.getByRole("textbox", { name: "Leadership Element" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "Combat Element" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Action Character" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Scope" }),
    ).not.toBeInTheDocument();
  });
});
