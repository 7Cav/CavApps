import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedalRecommendationPage from "../page";
import {
  renderMedalRecommendationAid,
  selectAward,
  selectRecipient,
} from "./test-helpers.js";

describe("Medal Recommendation Aid - selection and guidance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("shows all supported Operation Medals in the Award selector", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();

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

  test("shows the selected medal criteria after a user chooses an award", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Purple Heart");

    expect(
      screen.getByText(
        /awarded for a single or multiple heroic actions while under enemy fire/i,
      ),
    ).toBeVisible();
  });

  test("does not show the recommendation worksheet until an award is selected", async () => {
    await renderMedalRecommendationAid();

    expect(
      screen.queryByRole("textbox", { name: "Recipient" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Generate Recommendation" }),
    ).not.toBeInTheDocument();
  });

  test("shows the recommendation worksheet after an award is selected", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user);

    expect(screen.getByRole("textbox", { name: "Recipient" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    ).toBeVisible();
  });

  test("shows Purple Heart scope instead of Action Character", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Purple Heart");

    expect(
      screen.queryByRole("combobox", { name: "Action Character" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Scope" })).toBeVisible();
  });

  test("shows Leadership Element for the Silver Star", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Silver Star");

    expect(
      screen.getByRole("textbox", { name: "Leadership Element" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "Combat Element" }),
    ).not.toBeInTheDocument();
  });

  test("shows the selected medal name in the recommendation worksheet", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Bronze Star Medal With Valor");

    expect(
      screen.getAllByRole("heading", { name: "Bronze Star Medal With Valor" }),
    ).toHaveLength(2);
  });

  test("shows narrative guidance for the selected medal", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Distinguished Flying Cross");

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
    await renderMedalRecommendationAid();
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
    await renderMedalRecommendationAid();
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
    await renderMedalRecommendationAid();
    await selectAward(user);
    await selectRecipient(user);

    expect(screen.getByText("Selected recipient: Smith.J")).toBeVisible();
    expect(screen.getByText("Specialist John Smith")).toBeVisible();
  });

  test("filters recipient suggestions to usernames matching the search", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user);

    await user.type(screen.getByRole("textbox", { name: "Recipient" }), "Smi");

    expect(
      await screen.findByRole("button", { name: "Smith.J" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Long.A" }),
    ).not.toBeInTheDocument();
  });

  test("uses the selected roster member identity without asking the user to re-enter it", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user);
    await selectRecipient(user);

    expect(screen.getByText("Specialist John Smith")).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "Recipient Rank" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Recipient Full Name" }),
    ).not.toBeInTheDocument();
  });

  test("replaces a partial recipient search with the selected username", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user);

    const recipientField = screen.getByRole("textbox", {
      name: "Recipient",
    });

    await user.type(recipientField, "Smi");

    await user.click(
      await screen.findByRole("button", {
        name: "Smith.J",
      }),
    );

    expect(recipientField).toHaveValue("Smith.J");
  });

  test("matches recipient searches regardless of case or surrounding whitespace", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user);

    await user.type(
      screen.getByRole("textbox", { name: "Recipient" }),
      "  SMITH  ",
    );

    expect(
      await screen.findByRole("button", { name: "Smith.J" }),
    ).toBeVisible();
  });

  test("shows the selected medal name in the worksheet description", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Silver Star");

    expect(
      screen.getByText("Create a Silver Star recommendation."),
    ).toBeVisible();

    expect(
      screen.queryByText("Create an Army Commendation Medal recommendation."),
    ).not.toBeInTheDocument();
  });

  test("shows Action Character options from the selected medal definition", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Air Medal");

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

  test.each([
    ["Army Commendation Medal", true, false, "Combat Element"],
    ["Army Commendation Medal With Valor", false, false, "Combat Element"],
    ["Air Medal", true, false, "Aircrew Combat Element"],
    ["Purple Heart", false, true, "Combat Element"],
    ["Bronze Star Medal", true, false, "Combat Element"],
    ["Bronze Star Medal With Valor", false, false, "Combat Element"],
    [
      "Distinguished Flying Cross",
      false,
      false,
      "Airframe",
      "an F/A-18, a Rotary-Wing, etc.",
    ],
    ["Silver Star", false, false, "Leadership Element"],
    ["Distinguished Service Cross", false, false, "Combat Element"],
  ])(
    "shows the correct medal-specific controls for %s",
    async (
      awardName,
      showsActionCharacter,
      showsScope,
      elementLabel,
      elementPlaceholder,
    ) => {
      const user = userEvent.setup();

      await renderMedalRecommendationAid();
      await selectAward(user, awardName);

      const actionCharacter = screen.queryByRole("combobox", {
        name: "Action Character",
      });

      const scope = screen.queryByRole("combobox", {
        name: "Scope",
      });

      if (showsActionCharacter) {
        expect(actionCharacter).toBeVisible();
      } else {
        expect(actionCharacter).not.toBeInTheDocument();
      }

      if (showsScope) {
        expect(scope).toBeVisible();
      } else {
        expect(scope).not.toBeInTheDocument();
      }

      expect(
        screen.getByRole("textbox", {
          name: elementLabel,
        }),
      ).toBeVisible();

      if (elementPlaceholder) {
        expect(
          screen.getByRole("textbox", { name: elementLabel }),
        ).toHaveAttribute("placeholder", elementPlaceholder);
      }
    },
  );

  test.each([
    [
      "Air Medal",
      ["The recipient must be a member of an aircrew. Pilots are eligible."],
    ],
    [
      "Purple Heart",
      [
        "The recipient must have been killed while undertaking the combat actions being cited.",
      ],
    ],
    [
      "Bronze Star Medal With Valor",
      [
        "The recipient must have survived the cited action to be eligible for this award.",
      ],
    ],
    [
      "Distinguished Flying Cross",
      [
        "The recipient must be a pilot.",
        "Air crew who are not pilots are not eligible.",
        "The pilot must possess their flight wings.",
        "The recipient must have survived the cited action.",
      ],
    ],
    [
      "Silver Star",
      [
        "The recipient must have been serving in an official leadership position.",
        "The recipient must have survived the cited action.",
      ],
    ],
    [
      "Distinguished Service Cross",
      [
        "The recipient must have survived the cited action.",
        "Against a live enemy (non-Cav) force or in an internal player-versus-player match, the cited actions must have been unquestionably responsible for the successful outcome of the mission.",
        "Against a computer opponent, the recipient must have been serving as Officer-In-Command (OIC) of the official operation and their actions must have been unquestionably responsible for the successful outcome of the mission.",
      ],
    ],
  ])(
    "shows all eligibility guidance for %s",
    async (awardName, eligibilityNotes) => {
      const user = userEvent.setup();

      await renderMedalRecommendationAid();
      await selectAward(user, awardName);

      expect(
        screen.getByRole("heading", {
          name: "Eligibility",
        }),
      ).toBeVisible();

      for (const note of eligibilityNotes) {
        expect(screen.getByText(note)).toBeVisible();
      }
    },
  );

  test.each([
    [
      "Army Commendation Medal",
      /awarded for skillful or heroic actions over an entire operation/i,
      /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    ],
    [
      "Army Commendation Medal With Valor",
      /awarded for a single act of heroism or skill under fire/i,
      /describe how the trooper demonstrated heroism and skill in a single act during the operation/i,
    ],
    [
      "Air Medal",
      /awarded to any member of an aircrew, including pilots/i,
      /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    ],
    [
      "Purple Heart",
      /awarded for a single or multiple heroic actions while under enemy fire/i,
      /describe how the trooper's one or more heroic actions while under fire resulted in their sacrifice and death/i,
    ],
    [
      "Bronze Star Medal",
      /awarded for skillful or heroic actions over the entire operation/i,
      /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    ],
    [
      "Bronze Star Medal With Valor",
      /awarded for a single act demonstrating extraordinary heroism and skill while under enemy fire/i,
      /describe how the trooper demonstrated extraordinary heroism in a single act during the operation/i,
    ],
    [
      "Distinguished Flying Cross",
      /awarded to pilots for a single act demonstrating extraordinary heroism and skill while under enemy fire/i,
      /describe how the trooper demonstrated extraordinary heroism in a single act during the operation/i,
    ],
    [
      "Silver Star",
      /awarded for actions demonstrating extraordinary heroism, skill, and leadership under fire/i,
      /describe how the trooper demonstrated extraordinary heroism and skill or leadership under fire in the operation/i,
    ],
    [
      "Distinguished Service Cross",
      /awarded for actions, or a single act, demonstrating extraordinary heroism and skill under fire/i,
      /describe how the trooper demonstrated extraordinary heroism and skill or leadership under fire in the operation/i,
    ],
  ])(
    "shows the correct criteria and narrative guidance for %s",
    async (awardName, criteriaPattern, guidancePattern) => {
      const user = userEvent.setup();

      await renderMedalRecommendationAid();
      await selectAward(user, awardName);

      expect(screen.getByText(criteriaPattern)).toBeVisible();
      expect(screen.getByText(guidancePattern)).toBeVisible();
    },
  );

  test("clears the element field when changing from Air Medal to Distinguished Flying Cross", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Air Medal");

    await user.type(
      screen.getByRole("textbox", {
        name: "Aircrew Combat Element",
      }),
      "flight crew",
    );

    await selectAward(user, "Distinguished Flying Cross");

    expect(
      screen.getByRole("textbox", {
        name: "Airframe",
      }),
    ).toHaveValue("");
  });
});
