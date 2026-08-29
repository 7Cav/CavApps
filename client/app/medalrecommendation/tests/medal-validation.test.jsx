import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  completeRecommendation,
  renderMedalRecommendationAid,
  selectAward,
  selectRecipient,
} from "./test-helpers.js";

describe("Medal Recommendation Aid - validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("does not show required-field errors before generation is attempted", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user);

    expect(
      screen.getByRole("textbox", { name: "Recipient" }),
    ).not.toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("combobox", { name: "Action Character" }),
    ).not.toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("textbox", { name: "Combat Element" }),
    ).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("prevents Purple Heart generation when Scope is missing", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user, "Purple Heart");
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

    const scope = screen.getByRole("combobox", { name: "Scope" });

    expect(scope).toHaveAttribute("aria-invalid", "true");
    expect(scope).toHaveAccessibleDescription("Required");
    expect(scope).toHaveClass("border-destructive");

    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Action Character is missing", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      { omit: "actionCharacter" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Combat Element is missing", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      { omit: "combatElement" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Operation Title is missing", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      { omit: "operationTitle" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Location is missing", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      { omit: "location" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Operation Date is missing", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      { omit: "operationDate" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when Narrative is missing", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(user, "", { omit: "narrative" });
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("marks a missing required field as invalid after generation is attempted", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      { omit: "combatElement" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const combatElement = screen.getByRole("textbox", {
      name: "Combat Element",
    });
    expect(combatElement).toHaveAttribute("aria-invalid", "true");
    expect(combatElement).toHaveAccessibleDescription("Required");
    expect(combatElement).toHaveClass("border-destructive");
    expect(screen.getByText("Required")).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Operation Title" }),
    ).not.toHaveAttribute("aria-invalid", "true");
  });

  test("clears a required field error immediately when the user fixes the field", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Smith maintained an effective fighting position throughout the operation.",
      { omit: "combatElement" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
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
      { omit: "combatElement" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const combatElement = screen.getByRole("textbox", {
      name: "Combat Element",
    });
    expect(combatElement).toHaveAttribute("aria-invalid", "true");

    await user.type(combatElement, "rifleman");
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();

    await user.clear(combatElement);
    expect(combatElement).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("marks every missing required control when an empty recommendation is submitted", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user);
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const requiredControls = [
      screen.getByRole("textbox", { name: "Recipient" }),
      screen.getByRole("combobox", { name: "Action Character" }),
      screen.getByRole("textbox", { name: "Combat Element" }),
      screen.getByRole("textbox", { name: "Operation Title" }),
      screen.getByRole("textbox", { name: "Location" }),
      screen.getByLabelText("Operation Date"),
      screen.getByRole("textbox", { name: "Narrative" }),
    ];

    for (const control of requiredControls) {
      expect(control).toHaveAttribute("aria-invalid", "true");
      expect(control).toHaveAccessibleDescription("Required");
      expect(control).toHaveClass("border-destructive");
    }

    expect(screen.getAllByText("Required")).toHaveLength(7);
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
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
      screen.getByRole("button", { name: "Generate Recommendation" }),
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
    await user.clear(screen.getByRole("textbox", { name: "Location" }));
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
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
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();

    await user.type(
      screen.getByRole("textbox", { name: "Narrative" }),
      " Additional text.",
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test.each([
    [
      "Action Character",
      async (user) => {
        await user.click(
          screen.getByRole("combobox", { name: "Action Character" }),
        );
        await user.click(screen.getByRole("option", { name: "Heroic" }));
      },
    ],
    [
      "Combat Element",
      async (user) => {
        const field = screen.getByRole("textbox", { name: "Combat Element" });
        await user.clear(field);
        await user.type(field, "squad leader");
      },
    ],
    [
      "Operation Title",
      async (user) => {
        const field = screen.getByRole("textbox", { name: "Operation Title" });
        await user.clear(field);
        await user.type(field, "Operation Market Garden");
      },
    ],
    [
      "Location",
      async (user) => {
        const field = screen.getByRole("textbox", { name: "Location" });
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
        screen.getByRole("button", { name: "Generate Recommendation" }),
      );
      expect(
        screen.getByRole("region", { name: "Recommendation Preview" }),
      ).toBeVisible();

      await changeField(user);
      expect(
        screen.queryByRole("region", { name: "Recommendation Preview" }),
      ).not.toBeInTheDocument();
    },
  );

  test("prevents generation when no recipient is selected", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await selectAward(user);

    await user.click(
      screen.getByRole("combobox", { name: "Action Character" }),
    );
    await user.click(screen.getByRole("option", { name: "Skillful" }));
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
    await user.type(
      screen.getByRole("textbox", { name: "Narrative" }),
      "Specialist John Smith maintained the position throughout the operation.",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when the selected recipient has no full rank", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Rankless maintained the position throughout the operation.",
      { recipientQuery: "Ran", recipientUsername: "Rankless.T" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when the selected recipient has no real name", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Nameless maintained the position throughout the operation.",
      { recipientQuery: "Nam", recipientUsername: "Nameless.T" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when the selected recipient rank is whitespace only", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Rankspace maintained the position throughout the operation.",
      { recipientQuery: "Ranks", recipientUsername: "Rankspace.T" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("prevents generation when the selected recipient real name is whitespace only", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "SPC Namespace maintained the position throughout the operation.",
      { recipientQuery: "Names", recipientUsername: "Namespace.T" },
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("rejects a whitespace-only Combat Element", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "Specialist John Smith maintained the position throughout the operation.",
      { omit: "combatElement" },
    );
    await user.type(
      screen.getByRole("textbox", { name: "Combat Element" }),
      "   ",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("rejects a whitespace-only Operation Title", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "Specialist John Smith maintained the position throughout the operation.",
      { omit: "operationTitle" },
    );
    await user.type(
      screen.getByRole("textbox", { name: "Operation Title" }),
      "   ",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("rejects a whitespace-only Location", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(
      user,
      "Specialist John Smith maintained the position throughout the operation.",
      { omit: "location" },
    );
    await user.type(screen.getByRole("textbox", { name: "Location" }), "   ");
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("rejects a whitespace-only Narrative", async () => {
    const user = userEvent.setup();
    await renderMedalRecommendationAid();
    await completeRecommendation(user, "", { omit: "narrative" });
    await user.type(screen.getByRole("textbox", { name: "Narrative" }), "   ");
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
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
      { omit: "operationDate" },
    );
    await user.type(screen.getByLabelText("Operation Date"), "2099-01-01");
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(screen.getByLabelText("Operation Date")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    expect(screen.getByText("Date must be today or earlier")).toBeVisible();

    expect(screen.getByRole("alert")).toHaveTextContent(
      /complete all required fields before generating a recommendation/i,
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
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
        { omit: "operationDate" },
      );

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-15T03:30:00.000Z"));
      fireEvent.change(screen.getByLabelText("Operation Date"), {
        target: { value: "2026-08-15" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Generate Recommendation" }),
      );

      expect(screen.getByLabelText("Operation Date")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByRole("alert")).toHaveTextContent(
        /complete all required fields before generating a recommendation/i,
      );
      expect(
        screen.queryByRole("region", { name: "Recommendation Preview" }),
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
        { omit: "operationDate" },
      );

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-15T03:30:00.000Z"));
      fireEvent.change(screen.getByLabelText("Operation Date"), {
        target: { value: "2026-08-14" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Generate Recommendation" }),
      );

      expect(screen.getByLabelText("Operation Date")).not.toHaveAttribute(
        "aria-invalid",
      );
      expect(
        screen.getByRole("region", { name: "Recommendation Preview" }),
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
    await selectAward(user);
    await selectRecipient(user);

    await user.click(
      screen.getByRole("combobox", { name: "Action Character" }),
    );
    await user.click(screen.getByRole("option", { name: "Skillful" }));
    await user.type(
      screen.getByRole("textbox", { name: "Combat Element" }),
      "  rifleman  ",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Operation Title" }),
      "  Exfor  ",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Location" }),
      "  Remagen  ",
    );
    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");
    await user.type(
      screen.getByRole("textbox", { name: "Narrative" }),
      "  Specialist John Smith maintained the position throughout the operation.  ",
    );
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    const expectedCitation =
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
      "Specialist John Smith maintained the position throughout the operation. " +
      "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    expect(screen.getByLabelText("Citation Narrative").textContent).toBe(
      expectedCitation,
    );
  });

  test("clears medal-specific field state when the selected award changes", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Army Commendation Medal");

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

    await selectAward(user, "Purple Heart");

    expect(
      screen.getByRole("combobox", {
        name: "Scope",
      }),
    ).toHaveTextContent("Select action scope");

    await user.click(
      screen.getByRole("combobox", {
        name: "Scope",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "Single",
      }),
    );

    await selectAward(user, "Army Commendation Medal");

    expect(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    ).toHaveTextContent("Select action character");

    await selectAward(user, "Purple Heart");

    expect(
      screen.getByRole("combobox", {
        name: "Scope",
      }),
    ).toHaveTextContent("Select action scope");
  });

  test("clears required-field validation state when the selected award changes", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Army Commendation Medal");

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    ).toHaveAttribute("aria-invalid", "true");

    await selectAward(user, "Purple Heart");

    expect(
      screen.getByRole("combobox", {
        name: "Scope",
      }),
    ).not.toHaveAttribute("aria-invalid", "true");

    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("preserves shared worksheet fields when the selected award changes", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Army Commendation Medal");
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
      "Specialist John Smith maintained the defensive position throughout the operation.";

    await user.type(
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
      narrative,
    );

    await selectAward(user, "Purple Heart");

    expect(screen.getByText("Selected recipient: Smith.J")).toBeVisible();

    expect(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
    ).toHaveValue("rifleman");

    expect(
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
    ).toHaveValue("Exfor");

    expect(
      screen.getByRole("textbox", {
        name: "Location",
      }),
    ).toHaveValue("Remagen");

    expect(screen.getByLabelText("Operation Date")).toHaveValue("2026-08-11");

    expect(
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
    ).toHaveValue(narrative);
  });

  test("clears the element field when changing to an award with a different element type", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Army Commendation Medal");

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "rifleman",
    );

    await selectAward(user, "Silver Star");

    expect(
      screen.getByRole("textbox", {
        name: "Leadership Element",
      }),
    ).toHaveValue("");
  });

  test("preserves the element field when changing to an award with the same element type", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, "Army Commendation Medal");

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "rifleman",
    );

    await selectAward(user, "Purple Heart");

    expect(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
    ).toHaveValue("rifleman");
  });

  test.each([
    ["Army Commendation Medal", "Action Character"],
    ["Air Medal", "Action Character"],
    ["Bronze Star Medal", "Action Character"],
    ["Purple Heart", "Scope"],
  ])(
    "requires %s medal-specific input before generation",
    async (awardName, requiredControl) => {
      const user = userEvent.setup();

      await renderMedalRecommendationAid();
      await selectAward(user, awardName);

      await user.click(
        screen.getByRole("button", {
          name: "Generate Recommendation",
        }),
      );

      expect(
        screen.getByRole("combobox", {
          name: requiredControl,
        }),
      ).toHaveAttribute("aria-invalid", "true");
    },
  );

  test.each([
    "Army Commendation Medal With Valor",
    "Bronze Star Medal With Valor",
    "Distinguished Flying Cross",
    "Silver Star",
    "Distinguished Service Cross",
  ])("does not require Action Character or Scope for %s", async (awardName) => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user, awardName);

    expect(
      screen.queryByRole("combobox", {
        name: "Action Character",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("combobox", {
        name: "Scope",
      }),
    ).not.toBeInTheDocument();
  });

  test("clears the generated preview when the selected award changes", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();

    const narrative =
      "Specialist John Smith maintained the defensive position throughout the operation. " +
      "Specialist Smith supported the element during each major engagement. " +
      "Specialist Smith's actions contributed directly to mission success.";

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

    await selectAward(user, "Purple Heart");

    expect(
      screen.queryByRole("region", {
        name: "Recommendation Preview",
      }),
    ).not.toBeInTheDocument();
  });

  test("clears the generated preview when Purple Heart Scope changes", async () => {
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
    const narrative =
      "Specialist John Smith held the line under heavy fire. " +
      "Specialist Smith continued fighting despite overwhelming opposition. " +
      "Specialist Smith's actions allowed the remainder of the element to complete the mission.";

    const narrativeField = screen.getByRole("textbox", { name: "Narrative" });

    await user.click(narrativeField);
    await user.paste(narrative);
    await user.click(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    );

    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();

    await user.click(screen.getByRole("combobox", { name: "Scope" }));
    await user.click(screen.getByRole("option", { name: "Multiple" }));

    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("clears the selected recipient and generated preview when the recipient query changes", async () => {
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

    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();

    expect(screen.getByText("Selected recipient: Smith.J")).toBeVisible();

    const recipientField = screen.getByRole("textbox", {
      name: "Recipient",
    });

    await user.clear(recipientField);
    await user.type(recipientField, "Long");

    expect(
      screen.queryByText("Selected recipient: Smith.J"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });
});
