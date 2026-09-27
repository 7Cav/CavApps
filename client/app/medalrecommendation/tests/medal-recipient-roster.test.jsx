import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  activeRecipient,
  eloaRecipient,
  fillOperationWorksheet,
  makeRecipient,
  renderClient,
  renderPageWithRoster,
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

  test("maps loaded roster profiles into searchable recipients and a rank-ordered recommendation list", async () => {
    const user = userEvent.setup();

    const senior = makeRecipient({
      user: { userId: "senior", username: "Captain.Z" },
      realName: "Zara Captain",
      rank: { rankId: "9", rankShort: "CPT", rankFull: "Captain" },
    });
    await renderPageWithRoster([
      { ...reserveRecipient, rank: { ...reserveRecipient.rank, rankId: 18 } },
      senior,
    ]);

    expect(
      screen.getByRole("heading", { name: "Operation Medal Recommendation" }),
    ).toBeVisible();

    await selectAward(user);

    await selectRecipient(user, "Res", "Reserve.R");

    expect(
      screen.getByRole("textbox", { name: "Recipient", exact: true }),
    ).toHaveValue("Reserve.R");

    expect(screen.getByText("Sergeant Riley Reserve")).toBeVisible();
    expect(
      screen.getByText(
        /this member is not an active member, please confirm eligibility/i,
      ),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Bulk Add Recipients" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Captain Zara Captain" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative:
        "The element held the position. The team supported the advance. The department secured the objective.",
    });
    await submitRecommendation(user);
    const recipients = screen.getByRole("list", {
      name: "Recommendation recipients",
    });
    expect(
      within(recipients)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Captain Zara Captain", "Sergeant Riley Reserve"]);
    expect(screen.getByLabelText("Citation Narrative")).toHaveTextContent(
      "Captain Zara Captain",
    );
  });

  test("page-sourced organizations include primary and secondary members but omit empty groups", async () => {
    const user = userEvent.setup();
    const member = makeRecipient({
      secondaries: [{ positionId: "secondary", positionTitle: "Developer" }],
    });
    await renderPageWithRoster([member, reserveRecipient], {
      groups: [
        { groupTitle: "Developers", positions: [{ positionId: "secondary" }] },
        { groupTitle: "Troopers", positions: [{ positionId: "100" }] },
        {
          groupTitle: "No eligible members",
          positions: [{ positionId: "missing" }],
        },
      ],
    });
    await selectAward(user);
    await user.click(
      screen.getByRole("button", { name: "Bulk Add Recipients" }),
    );
    const organization = screen.getByRole("combobox", {
      name: "Organization",
    });
    expect(
      within(organization)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All organizations", "Developers", "Troopers"]);
    for (const name of ["Developers", "Troopers"]) {
      await user.selectOptions(organization, name);
      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
      expect(
        screen.getByRole("checkbox", { name: "Specialist John Smith" }),
      ).toBeVisible();
    }
    const search = screen.getByRole("textbox", { name: "Search Roster" });
    await user.type(search, "Developer");
    const match = screen.getByRole("checkbox", {
      name: "Specialist John Smith",
    });
    expect(match).toHaveAccessibleDescription("Smith.J · Trooper");
    await user.clear(search);
    await user.type(search, "SPC");
    expect(match).toBeVisible();
  });

  test("failed organization metadata leaves primary and secondary billet text search usable", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const secondaryMember = {
      ...activeRecipient,
      secondaries: [{ positionId: "secondary", positionTitle: "Signal Watch" }],
    };
    await renderPageWithRoster([secondaryMember, reserveRecipient], {
      groupError: new Error("Groups unavailable"),
    });
    expect(
      screen.queryByRole("heading", {
        name: "Unable to load Medal Recommendation Aid",
      }),
    ).not.toBeInTheDocument();
    await selectAward(user);
    await selectRecipient(user, "Com", "Combat.C");
    await user.click(
      screen.getByRole("button", { name: "Bulk Add Recipients" }),
    );
    const organization = screen.getByRole("combobox", {
      name: "Organization",
    });
    expect(
      within(organization)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["All organizations"]);
    expect(organization).toHaveDisplayValue("All organizations");
    const search = screen.getByRole("textbox", { name: "Search Roster" });
    await user.type(search, "signal");
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      screen.getByRole("checkbox", { name: "Specialist Casey Combat" }),
    ).toBeChecked();
    await user.clear(search);
    await user.type(search, "reservist");
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      screen.getByRole("checkbox", { name: "Sergeant Riley Reserve" }),
    ).toBeVisible();
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
