import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OperationMedalRecommendationPage from "../operation/page";
import { OPERATION_MEDALS } from "../lib/medal-definitions.js";
import {
  makeRecipient,
  renderClient,
  selectAward,
  selectRecipient,
} from "./test-helpers.js";
import { OPERATION_MEDAL_CASES } from "./operation-medal-cases.js";

describe("Medal Recommendation Aid - selection and guidance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("shows all supported Operation Medals in the Award selector", async () => {
    const user = userEvent.setup();
    renderClient();

    await user.click(screen.getByRole("combobox", { name: "Award" }));

    for (const { name: medalName } of OPERATION_MEDAL_CASES) {
      expect(screen.getByRole("option", { name: medalName })).toBeVisible();
    }
  });

  test("the rendered medal cases cover every Operation Medal exactly once", () => {
    const caseIdentities = OPERATION_MEDAL_CASES.map(({ id, name }) => ({
      id,
      name,
    }));

    expect(caseIdentities).toEqual(
      OPERATION_MEDALS.map(({ id, name }) => ({ id, name })),
    );
    expect(new Set(caseIdentities.map(({ id }) => id)).size).toBe(
      caseIdentities.length,
    );
    expect(new Set(caseIdentities.map(({ name }) => name)).size).toBe(
      caseIdentities.length,
    );
  });

  test("every Operation Medal has a non-empty abbreviation", () => {
    for (const medal of OPERATION_MEDALS) {
      expect(medal.abbreviation).toEqual(expect.any(String));
      expect(medal.abbreviation.trim()).not.toBe("");
    }
  });

  test("keeps recipient selection and generation hidden until an award is selected", async () => {
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

  test("renders worksheet metadata with the correct semantic controls", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user);

    const combatElement = screen.getByLabelText("Combat Element");
    const operationDate = screen.getByLabelText("Operation Date");
    const narrative = screen.getByLabelText("Narrative");

    expect(combatElement.tagName).toBe("INPUT");
    expect(combatElement).toHaveAttribute("type", "text");
    expect(operationDate.tagName).toBe("INPUT");
    expect(operationDate).toHaveAttribute("type", "date");
    expect(narrative.tagName).toBe("TEXTAREA");
  });

  test.each(OPERATION_MEDAL_CASES)(
    "$name renders its guidance and medal-specific controls",
    async ({
      name,
      criteriaPattern,
      guidancePattern,
      eligibilityNotes,
      showsActionCharacter,
      showsScope,
      elementLabel,
      elementPlaceholder,
    }) => {
      const user = userEvent.setup();
      renderClient();
      await selectAward(user, name);

      expect(screen.getAllByRole("heading", { name })[0]).toBeVisible();
      expect(screen.getByText(criteriaPattern)).toBeVisible();
      expect(screen.getByText(guidancePattern)).toBeVisible();

      if (eligibilityNotes.length > 0) {
        expect(
          screen.getByRole("heading", { name: "Eligibility Guidance" }),
        ).toBeVisible();

        for (const note of eligibilityNotes) {
          expect(screen.getByText(note)).toBeVisible();
        }
      } else {
        expect(
          screen.queryByRole("heading", { name: "Eligibility Guidance" }),
        ).not.toBeInTheDocument();
      }

      const actionCharacter = screen.queryByRole("combobox", {
        name: "Action Character",
      });
      const scope = screen.queryByRole("combobox", { name: "Scope" });

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
        screen.getByRole("textbox", { name: elementLabel }),
      ).toHaveAttribute("placeholder", elementPlaceholder);
    },
  );

  test("shows a graceful unavailable state when the medal recipient roster cannot be loaded", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("fetch failed"),
    );

    render(await OperationMedalRecommendationPage());

    expect(
      screen.getByRole("heading", {
        name: "Unable to load Medal Recommendation Aid",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/the medal recipient roster could not be loaded/i),
    ).toBeVisible();

    const retryLink = screen.getByRole("link", { name: "Try Again" });
    expect(retryLink).toHaveAttribute("href", "/medalrecommendation/operation");
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

  test("does not show recipient suggestions before three normalized characters", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user);

    await user.type(screen.getByRole("textbox", { name: "Recipient" }), "Sm");

    expect(
      screen.queryByRole("button", { name: "Smith.J" }),
    ).not.toBeInTheDocument();
  });

  test("does not re-offer the selected recipient", async () => {
    const user = userEvent.setup();
    renderClient();
    await selectAward(user);
    await selectRecipient(user);

    expect(screen.getByRole("textbox", { name: "Recipient" })).toHaveValue(
      "Smith.J",
    );
    expect(
      screen.queryByRole("button", { name: "Smith.J" }),
    ).not.toBeInTheDocument();
  });

  test("limits recipient suggestions to ten results", async () => {
    const user = userEvent.setup();
    const roster = Array.from({ length: 12 }, (_, index) => {
      const suffix = String(index + 1).padStart(2, "0");

      return makeRecipient({
        user: { userId: `30${suffix}`, username: `Smith.${suffix}` },
        realName: `Recipient ${suffix}`,
        primary: { positionId: `40${suffix}` },
      });
    });

    renderClient({ roster });
    await selectAward(user);
    await user.type(screen.getByRole("textbox", { name: "Recipient" }), "Smi");

    expect(
      await screen.findAllByRole("button", { name: /^Smith\.\d+$/ }),
    ).toHaveLength(10);
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
});
