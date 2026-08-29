import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  completeRecommendation,
  renderMedalRecommendationAid,
  selectAward,
  selectRecipient,
} from "./test-helpers.js";

describe("Medal Recommendation Aid - citations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("generates singular Purple Heart opening language for Single scope", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Purple Heart");

    await user.click(screen.getByRole("combobox", { name: "Scope" }));
    await user.click(screen.getByRole("option", { name: "Single" }));
    await selectRecipient(user);
    await user.type(
      screen.getByRole("textbox", { name: "Combat Element" }),
      "rifleman",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Operation Title" }),
      "Exfor",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Location" }),
      "Remagen",
    );
    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");
    const narrativeField = screen.getByRole("textbox", { name: "Narrative" });
    await user.click(narrativeField);
    await user.paste(
      "Specialist John Smith held the line under heavy fire. Specialist Smith continued fighting despite overwhelming opposition. Specialist Smith's actions allowed the remainder of the element to complete the mission.",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "For a single heroic action and skill under enemy fire resulting in their sacrifice and death while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
    );
    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "Specialist John Smith's heroism and sacrifice reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates plural Purple Heart opening language for Multiple scope", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Purple Heart");

    await user.click(screen.getByRole("combobox", { name: "Scope" }));
    await user.click(screen.getByRole("option", { name: "Multiple" }));
    await selectRecipient(user);

    await user.type(
      screen.getByRole("textbox", { name: "Combat Element" }),
      "rifleman",
    );

    await user.type(
      screen.getByRole("textbox", { name: "Operation Title" }),
      "Exfor",
    );

    await user.type(
      screen.getByRole("textbox", { name: "Location" }),
      "Remagen",
    );

    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");

    const narrativeField = screen.getByRole("textbox", { name: "Narrative" });

    await user.click(narrativeField);
    await user.paste(
      "Specialist John Smith held the line under heavy fire. Specialist Smith continued fighting despite overwhelming opposition. Specialist Smith's actions allowed the remainder of the element to complete the mission.",
    );

    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "For multiple heroic actions and skill under enemy fire resulting in their sacrifice and death while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
    );
  });

  test("shows the selected medal ribbon in the generated recommendation", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Purple Heart");

    await user.click(screen.getByRole("combobox", { name: "Scope" }));
    await user.click(screen.getByRole("option", { name: "Single" }));
    await selectRecipient(user);
    await user.type(
      screen.getByRole("textbox", { name: "Combat Element" }),
      "rifleman",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Operation Title" }),
      "Exfor",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Location" }),
      "Remagen",
    );
    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");
    const narrativeField = screen.getByRole("textbox", { name: "Narrative" });
    await user.click(narrativeField);
    await user.paste(
      "Specialist John Smith held the line under heavy fire. Specialist Smith continued fighting despite overwhelming opposition. Specialist Smith's actions allowed the remainder of the element to complete the mission.",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const ribbon = screen.getByRole("img", { name: "Purple Heart ribbon" });
    expect(ribbon).toHaveAttribute(
      "src",
      "https://wiki.7cav.us/images/b/b5/PH.jpg",
    );
  });

  test("generates a complete Army Commendation Medal recommendation", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained an effective fighting position throughout the operation. " +
      "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
      "His performance contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    expect(preview).toHaveTextContent("Army Commendation Medal");
    expect(preview).toHaveTextContent("Specialist John Smith");

    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        "Specialist John Smith maintained an effective fighting position throughout the operation. " +
        "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
        "His performance contributed directly to the successful completion of the operation. " +
        "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates Army Commendation Medal heroic citation language", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained an effective fighting position throughout the operation. " +
      "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
      "His performance contributed directly to the successful completion of the operation.";

    await completeRecommendation(user, narrative);

    await user.click(
      screen.getByRole("combobox", { name: "Action Character" }),
    );
    await user.click(screen.getByRole("option", { name: "Heroic" }));

    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "For heroic actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
    );

    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "Specialist John Smith's heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates the Army Commendation Medal With Valor citation language", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Army Commendation Medal With Valor");
    await selectRecipient(user);

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

    const narrative =
      "Specialist John Smith advanced through sustained enemy fire. " +
      "Specialist Smith destroyed the enemy position threatening the squad. " +
      "Specialist Smith's actions allowed the element to secure the objective.";

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.click(narrativeField);
    await user.paste(narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.textContent).toBe(
      "For a single act of heroism and skill under enemy fire while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        narrative +
        " Specialist John Smith's heroism and skill reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates the Air Medal citation language", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Air Medal");
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
        name: "Aircrew Combat Element",
      }),
      "rotary-wing pilot",
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

    const narrative =
      "Specialist John Smith maintained continuous air support throughout the operation. " +
      "Specialist Smith repeatedly maneuvered the aircraft under enemy fire to support friendly forces. " +
      "Specialist Smith's actions were critical to the successful completion of the mission.";

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.click(narrativeField);
    await user.paste(narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.textContent).toBe(
      "For skillful actions over an entire operation while serving as rotary-wing pilot in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        narrative +
        " Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates Air Medal heroic citation language", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Air Medal");

    await selectRecipient(user);

    await user.click(
      screen.getByRole("combobox", { name: "Action Character" }),
    );
    await user.click(screen.getByRole("option", { name: "Heroic" }));

    await user.type(
      screen.getByRole("textbox", { name: "Aircrew Combat Element" }),
      "rotary-wing pilot",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Operation Title" }),
      "Exfor",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Location" }),
      "Remagen",
    );
    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");

    const narrativeField = screen.getByRole("textbox", { name: "Narrative" });
    await user.click(narrativeField);
    await user.paste(
      "Specialist John Smith maintained control of the aircraft throughout the operation. " +
        "Specialist Smith supported friendly forces during each major engagement. " +
        "Specialist Smith's actions contributed directly to mission success.",
    );

    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "For heroic actions over an entire operation while serving as rotary-wing pilot in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
    );

    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "Specialist John Smith's heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates the Bronze Star Medal citation language", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Bronze Star Medal");
    await selectRecipient(user);

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

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "squad leader",
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

    const narrative =
      "Specialist John Smith demonstrated exceptional leadership throughout the operation. " +
      "Specialist Smith repeatedly exposed himself to enemy fire while directing the squad. " +
      "Specialist Smith's actions were critical to the successful completion of the mission.";

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.click(narrativeField);
    await user.paste(narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.textContent).toBe(
      "For heroic actions over an entire operation while serving as squad leader in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        narrative +
        " Specialist John Smith's heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates the Bronze Star Medal With Valor citation language", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Bronze Star Medal With Valor");
    await selectRecipient(user);

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "squad leader",
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

    const narrative =
      "Specialist John Smith advanced through intense enemy fire to reach the isolated element. " +
      "Specialist Smith destroyed the enemy position preventing the squad from maneuvering. " +
      "Specialist Smith's actions were critical to the successful completion of the mission.";

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.click(narrativeField);
    await user.paste(narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.textContent).toBe(
      "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as squad leader in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        narrative +
        " Specialist John Smith's skills and heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates the Distinguished Flying Cross citation language", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Distinguished Flying Cross");
    await selectRecipient(user);

    await user.type(
      screen.getByRole("textbox", {
        name: "Airframe",
      }),
      "an F/A-18",
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

    const narrative =
      "Specialist John Smith flew directly into intense enemy fire to extract the isolated element. " +
      "Specialist Smith maneuvered the aircraft through the engagement while maintaining control under sustained fire. " +
      "Specialist Smith's actions were critical to the successful completion of the mission.";

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.click(narrativeField);
    await user.paste(narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.textContent).toBe(
      "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as an F/A-18 pilot in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        narrative +
        " Specialist John Smith's skills and heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates the Silver Star citation language", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Silver Star");
    await selectRecipient(user);

    await user.type(
      screen.getByRole("textbox", {
        name: "Leadership Element",
      }),
      "platoon leader",
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

    const narrative =
      "Specialist John Smith led the platoon through sustained enemy fire. " +
      "Specialist Smith reorganized the element after the initial assault stalled. " +
      "Specialist Smith personally directed the attack against the enemy position. " +
      "Specialist Smith's leadership enabled the platoon to secure the objective and complete the mission.";

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.click(narrativeField);
    await user.paste(narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.textContent).toBe(
      "For conspicuous gallantry and intrepidity under direct enemy fire while serving as platoon leader in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        narrative +
        " Specialist John Smith's heroism, skill and devotion to duty reflects great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("generates the Distinguished Service Cross citation language", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Distinguished Service Cross");
    await selectRecipient(user);

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "company commander",
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

    const narrative =
      "Specialist John Smith led the company through overwhelming enemy resistance. " +
      "Specialist Smith reorganized the assault after the initial attack was halted. " +
      "Specialist Smith personally directed the advance against the fortified enemy position. " +
      "Specialist Smith's actions broke the enemy defense and secured the objective. " +
      "Specialist Smith's leadership was unquestionably responsible for the successful completion of the mission.";

    const narrativeField = screen.getByRole("textbox", {
      name: "Narrative",
    });

    await user.click(narrativeField);
    await user.paste(narrative);

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    const citation = screen.getByLabelText("Citation Narrative");

    expect(citation.textContent).toBe(
      "For conspicuous gallantry and intrepidity under direct enemy fire while serving as company commander in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        narrative +
        " Specialist John Smith's heroism, skill and devotion to duty reflects great credit upon themselves and the 7th Cavalry Gaming Regiment.",
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
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const citation = screen.getByLabelText("Citation Narrative");
    expect(citation).toHaveTextContent(
      "during combat in Operation Exfor near Remagen",
    );
    expect(citation).not.toHaveTextContent("Operation Operation Exfor");
  });

  test("shows the generated recipient identity independently from the citation", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "Specialist John Smith maintained the position throughout the operation.",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const paragraphs = screen
      .getByRole("region", { name: "Recommendation Preview" })
      .querySelectorAll("p");
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
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    expect(screen.getByLabelText("Citation Narrative")).toBeVisible();
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
      screen.getByRole("button", { name: "Generate Recommendation" }),
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

  test.each([
    ["Army Commendation Medal", "https://wiki.7cav.us/images/d/dc/ARCOM.jpg"],
    [
      "Army Commendation Medal With Valor",
      "https://wiki.7cav.us/images/0/0f/ARCOMV.jpg",
    ],
    ["Air Medal", "https://wiki.7cav.us/images/3/3f/AM.jpg"],
    ["Purple Heart", "https://wiki.7cav.us/images/b/b5/PH.jpg"],
    ["Bronze Star Medal", "https://wiki.7cav.us/images/5/5e/BS.jpg"],
    [
      "Bronze Star Medal With Valor",
      "https://wiki.7cav.us/images/8/88/BSV.jpg",
    ],
    ["Distinguished Flying Cross", "https://wiki.7cav.us/images/7/74/DFC.jpg"],
    ["Silver Star", "https://wiki.7cav.us/images/8/8f/SS.jpg"],
    ["Distinguished Service Cross", "https://wiki.7cav.us/images/d/d3/DSC.jpg"],
  ])(
    "shows the correct preview title and ribbon for %s",
    async (awardName, ribbonUrl) => {
      const user = userEvent.setup();

      await renderMedalRecommendationAid();
      await selectAward(user, awardName);
      await selectRecipient(user);

      const actionCharacter = screen.queryByRole("combobox", {
        name: "Action Character",
      });

      if (actionCharacter) {
        await user.click(actionCharacter);

        await user.click(
          screen.getByRole("option", {
            name: "Skillful",
          }),
        );
      }

      const scope = screen.queryByRole("combobox", {
        name: "Scope",
      });

      if (scope) {
        await user.click(scope);

        await user.click(
          screen.getByRole("option", {
            name: "Single",
          }),
        );
      }

      const elementField =
        screen.queryByRole("textbox", {
          name: "Aircrew Combat Element",
        }) ??
        screen.queryByRole("textbox", {
          name: "Leadership Element",
        }) ??
        screen.queryByRole("textbox", {
          name: "Airframe",
        }) ??
        screen.getByRole("textbox", {
          name: "Combat Element",
        });

      await user.type(elementField, "rifleman");

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
      await user.paste(
        "Specialist John Smith performed exceptionally during the operation. " +
          "Specialist Smith supported the element throughout the engagement. " +
          "Specialist Smith's actions contributed to mission success. " +
          "Specialist Smith continued leading the element under fire. " +
          "Specialist Smith's actions secured the objective.",
      );

      await user.click(
        screen.getByRole("button", {
          name: "Generate Recommendation",
        }),
      );

      const preview = screen.getByRole("region", {
        name: "Recommendation Preview",
      });

      expect(
        within(preview).getByRole("heading", {
          name: awardName,
        }),
      ).toBeVisible();

      expect(
        screen.getByRole("img", {
          name: `${awardName} ribbon`,
        }),
      ).toHaveAttribute("src", ribbonUrl);
    },
  );
});
