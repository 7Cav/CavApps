import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  activeRecipient,
  eloaRecipient,
  fillOperationWorksheet,
  renderClient,
  reserveRecipient,
  retiredRecipient,
  selectAward,
  selectRecipient,
  submitRecommendation,
  wallOfHonorRecipient,
} from "./test-helpers.js";

const medalRecipientRoster = [
  activeRecipient,
  reserveRecipient,
  eloaRecipient,
  wallOfHonorRecipient,
  retiredRecipient,
];

describe("Medal Recommendation recipient roster", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("lets a user search for and select a Reserve medal recipient", async () => {
    const user = userEvent.setup();

    renderClient({ roster: medalRecipientRoster });
    await selectAward(user);

    await selectRecipient(user, "Res", "Reserve.R");

    expect(screen.getByText("Selected recipient: Reserve.R")).toBeVisible();

    expect(screen.getByText("Sergeant Riley Reserve")).toBeVisible();
  });

  test("does not warn when the selected recipient is an active Combat member", async () => {
    const user = userEvent.setup();

    renderClient({ roster: medalRecipientRoster });
    await selectAward(user);

    await selectRecipient(user, "Com", "Combat.C");

    expect(
      screen.queryByText(
        /this member is not an active member, please confirm eligibility/i,
      ),
    ).not.toBeInTheDocument();
  });

  test.each([
    ["Reserve", "Res", "Reserve.R"],
    ["ELOA", "Elo", "Eloa.E"],
    ["Wall of Honor", "Hon", "Honor.H"],
    ["Retired", "Ret", "Retired.R"],
  ])(
    "warns when the selected recipient is %s",
    async (_status, query, username) => {
      const user = userEvent.setup();

      renderClient({ roster: medalRecipientRoster });
      await selectAward(user);

      await selectRecipient(user, query, username);

      expect(
        screen.getByText(
          /this member is not an active member, please confirm eligibility/i,
        ),
      ).toBeVisible();
    },
  );

  test("allows generation for a non-active recipient after showing the eligibility warning", async () => {
    const user = userEvent.setup();

    renderClient({ roster: medalRecipientRoster });
    await selectAward(user);

    await selectRecipient(user, "Res", "Reserve.R");

    expect(
      screen.getByText(
        /this member is not an active member, please confirm eligibility/i,
      ),
    ).toBeVisible();

    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative:
        "SGT Reserve maintained the position throughout the operation.",
    });

    await submitRecommendation(user);

    expect(
      screen.getByRole("region", {
        name: "Recommendation Preview",
      }),
    ).toBeVisible();

    expect(
      screen.getByText(
        /this member is not an active member, please confirm eligibility/i,
      ),
    ).toBeVisible();
  });
});
