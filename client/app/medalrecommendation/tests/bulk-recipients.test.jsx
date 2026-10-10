import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  developmentRecipientGroup,
  janeRecipient,
  kentonRecipient as kenton,
  fillOperationWorksheet,
  getCitationText,
  makeRecipient,
  renderClient,
  renderServiceClient,
  selectAward,
  selectComboboxOption,
  selectRecipient,
  submitRecommendation,
} from "./test-helpers";

const smith = makeRecipient({
  primary: { positionId: "support", positionTitle: "Support Clerk" },
  secondaries: [{ positionId: "dev", positionTitle: "Development Tester" }],
});
const jane = {
  ...janeRecipient,
  rank: { rankShort: "CPL", rankFull: "Corporal", rankId: "19" },
  primary: { positionId: "air", positionTitle: "Pilot" },
};
const roster = [smith, kenton, jane];
const recommendationRoster = [
  ["Rhone.T", "Tim Rhone", "20", "Specialist", "SPC"],
  ["Swanson.B", "Brent Swanson", "9", "Captain", "CPT"],
  ["Kenton.W", "Wade Kenton", 17, "Staff Sergeant", "SSG"],
  ["Hazen.D", "Darek Hazen", 10, "First Lieutenant", "1LT"],
  ["Beauchamp.R", "Ryan Beauchamp", "17", "Staff Sergeant", "SSG"],
  ["Jarvis.A", "Adam Jarvis", "4", "Major General", "MG"],
  ["Rhoden.J", "Jim Rhoden", "17", "Staff Sergeant", "SSG"],
  ["Hansel.R", "Ruby Hansel", "14", "First Sergeant", "1SG"],
  ["Belmont.E", "Eli Belmont", 17, "Staff Sergeant", "SSG"],
  ["DAmico.J", "John D'Amico", "10", "First Lieutenant", "1LT"],
].map(([username, realName, rankId, rankFull, rankShort]) =>
  makeRecipient({
    user: { userId: username, username },
    realName,
    rank: { rankId, rankFull, rankShort },
  }),
);
const groups = [
  developmentRecipientGroup,
  { groupTitle: "Aviation", positions: [{ positionId: "air" }] },
];
const identityWarning =
  /Recipient mentions?:|\d+ of \d+ recipients (?:is|are) not referenced/;
const narrative =
  "The element  held the position. The team supported the advance. The department secured the objective.";
const operationValues = {
  actionCharacter: "Skillful",
  combatElement: "rifleman",
  operationTitle: "Exfor",
  location: "Remagen",
  operationDate: "2026-08-11",
  narrative,
};

function syntheticRoster(count) {
  return Array.from({ length: count }, (_, index) =>
    makeRecipient({
      user: { userId: String(index + 1), username: `Member.${index + 1}` },
      realName: `Test Member${index + 1}`,
      roster: index < 3 ? "ROSTER_TYPE_RESERVE" : "ROSTER_TYPE_COMBAT",
    }),
  );
}

async function setup(members = roster, service = false) {
  const user = userEvent.setup();
  (service ? renderServiceClient : renderClient)({
    roster: members,
    rosterGroups: groups,
  });
  await selectAward(
    user,
    service ? "Army Achievement Medal" : "Army Commendation Medal",
  );
  return user;
}

async function openBulk(user, name = "Bulk Add Recipients") {
  await user.click(screen.getByRole("button", { name }));
  return screen.getByRole("dialog", { name: "Bulk Recipient Selection" });
}

async function confirmAll(user) {
  await openBulk(user);
  await user.click(screen.getByRole("button", { name: "Select All Shown" }));
  await user.click(screen.getByRole("button", { name: "Confirm Recipients" }));
}

function recipientFields() {
  return screen.queryAllByRole("textbox", { name: /^Recipient(?: \d+)?$/ });
}

async function replaceText(user, label, text) {
  const field = screen.getByRole("textbox", { name: label });
  await user.clear(field);
  await user.click(field);
  await user.paste(text);
}

describe("inline and compact recipients", () => {
  test.each([
    ["real name", "Wade Kenton", "Kenton.W"],
    ["full rank", "Staff Sergeant", "Kenton.W"],
    ["rank abbreviation", "SSG", "Kenton.W"],
    ["primary billet", "Development Lead", "Kenton.W"],
    ["secondary billet", "Development Tester", "Smith.J"],
  ])(
    "inline search matches %s and preserves the selected username",
    async (_field, query, username) => {
      const user = await setup();
      await selectRecipient(user, query, username);
      expect(screen.getByRole("textbox", { name: "Recipient" })).toHaveValue(
        username,
      );
      expect(
        screen.queryByRole("button", { name: username }),
      ).not.toBeInTheDocument();
    },
  );

  test("manual fields keep working order when a more senior recipient is selected later", async () => {
    const user = await setup(recommendationRoster);
    await selectRecipient(user, "Rho", "Rhone.T");
    await user.click(screen.getByRole("button", { name: "Add Recipient" }));
    await user.type(
      screen.getByRole("textbox", { name: "Recipient 2" }),
      "Swa",
    );
    await user.click(screen.getByRole("button", { name: "Swanson.B" }));
    await user.click(screen.getByRole("button", { name: "Add Recipient" }));
    await user.type(
      screen.getByRole("textbox", { name: "Recipient 3" }),
      "unfinished",
    );
    expect(recipientFields().map((field) => field.value)).toEqual([
      "Rhone.T",
      "Swanson.B",
      "unfinished",
    ]);
  });

  test("compact and expanded summaries use S1 rank then surname order while bulk retains working order", async () => {
    const user = await setup(recommendationRoster);
    await confirmAll(user);
    const names = screen.getByRole("list", { name: "Confirmed recipients" });
    const orderedNames = [
      "Major General Adam Jarvis",
      "Captain Brent Swanson",
      "First Lieutenant John D'Amico",
      "First Lieutenant Darek Hazen",
      "First Sergeant Ruby Hansel",
      "Staff Sergeant Ryan Beauchamp",
      "Staff Sergeant Eli Belmont",
      "Staff Sergeant Wade Kenton",
      "Staff Sergeant Jim Rhoden",
      "Specialist Tim Rhone",
    ];
    expect(
      within(names)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(orderedNames.slice(0, 8));
    await user.click(screen.getByRole("button", { name: "+ 2 more" }));
    expect(
      within(names)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(orderedNames);
    await user.click(screen.getByRole("button", { name: "Show less" }));
    expect(
      within(names)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(orderedNames.slice(0, 8));
    await openBulk(user, "View/Edit Recipients");
    const draft = screen.getByRole("list", { name: "Draft recipients" });
    expect(
      within(draft)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(
      recommendationRoster.map(
        (member) =>
          `Remove ${member.rank.rankFull} ${member.realName} (${member.user.username})`,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      within(names)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(orderedNames.slice(0, 8));
  });

  test("adds numbered slots, preserves the first selection and worksheet, and removes only the last slot", async () => {
    const user = await setup();
    expect(recipientFields()).toHaveLength(1);
    expect(
      screen.getByRole("textbox", { name: "Recipient", exact: true }),
    ).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Remove Recipient" }),
    ).toBeDisabled();
    await selectRecipient(user);
    await fillOperationWorksheet(user, operationValues);
    await user.click(screen.getByRole("button", { name: "Add Recipient" }));
    expect(screen.getByRole("textbox", { name: "Recipient 1" })).toHaveValue(
      "Smith.J",
    );
    expect(screen.getByRole("textbox", { name: "Recipient 2" })).toHaveValue(
      "",
    );
    await submitRecommendation(user);
    expect(
      screen.getByRole("textbox", { name: "Recipient 2" }),
    ).toHaveAttribute("aria-invalid", "true");
    await user.type(
      screen.getByRole("textbox", { name: "Recipient 2" }),
      "Ken",
    );
    await user.clear(screen.getByRole("textbox", { name: "Recipient 1" }));
    await user.type(
      screen.getByRole("textbox", { name: "Recipient 1" }),
      "Smi",
    );
    await user.click(screen.getByRole("button", { name: "Smith.J" }));
    expect(screen.getByRole("textbox", { name: "Recipient 1" })).toHaveValue(
      "Smith.J",
    );
    expect(screen.getByRole("textbox", { name: "Recipient 2" })).toHaveValue(
      "Ken",
    );
    await user.click(screen.getByRole("button", { name: "Kenton.W" }));
    await user.click(screen.getByRole("button", { name: "Remove Recipient" }));
    expect(screen.getByRole("textbox", { name: "Recipient" })).toHaveValue(
      "Smith.J",
    );
    expect(
      screen.getByRole("button", { name: "Remove Recipient" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveValue(
      narrative,
    );
    expect(
      screen.getByRole("textbox", { name: "Operation Title" }),
    ).toHaveValue("Exfor");
  });

  test("excludes selected IDs from other suggestions and releases an identity when its query is edited", async () => {
    const user = await setup();
    await selectRecipient(user);
    await user.click(screen.getByRole("button", { name: "Add Recipient" }));
    await user.type(
      screen.getByRole("textbox", { name: "Recipient 2" }),
      "Smi",
    );
    expect(
      screen.queryByRole("button", { name: "Smith.J" }),
    ).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Recipient 1" }));
    await user.click(screen.getByRole("button", { name: "Smith.J" }));
    expect(screen.getByRole("textbox", { name: "Recipient 2" })).toHaveValue(
      "Smith.J",
    );
    expect(screen.getByRole("textbox", { name: "Recipient 1" })).toHaveValue(
      "",
    );
  });

  test("the eighth Add opens bulk without a ninth input; cancellation preserves unresolved drafts", async () => {
    const user = await setup(syntheticRoster(9));
    await selectRecipient(user, "Member.1", "Member.1");
    for (let index = 1; index < 8; index++)
      await user.click(screen.getByRole("button", { name: "Add Recipient" }));
    for (let number = 2; number <= 8; number++) {
      await user.type(
        screen.getByRole("textbox", {
          name: `Recipient ${number}`,
          exact: true,
        }),
        `unfinished ${number}`,
      );
    }
    expect(recipientFields()).toHaveLength(8);
    await openBulk(user, "Add Recipient");
    expect(screen.getByText("1 recipients selected")).toBeVisible();
    expect(
      within(
        screen.getByRole("list", { name: "Draft recipients" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(recipientFields()).toHaveLength(8);
    expect(
      screen.queryByRole("textbox", { name: "Recipient 9", exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Recipient 1", exact: true }),
    ).toHaveValue("Member.1");
    for (let number = 2; number <= 8; number++) {
      expect(
        screen.getByRole("textbox", {
          name: `Recipient ${number}`,
          exact: true,
        }),
      ).toHaveValue(`unfinished ${number}`);
    }
  });

  test("nine confirmed recipients show recommendation order and return to eight inputs in established working order", async () => {
    const members = syntheticRoster(9).map((member) => ({
      ...member,
      roster: "ROSTER_TYPE_COMBAT",
    }));
    const user = await setup(members);
    await selectRecipient(user, "Member.5", "Member.5");
    await confirmAll(user);
    expect(recipientFields()).toHaveLength(0);
    expect(screen.getByText("9 recipients selected")).toBeVisible();
    expect(
      screen.queryByText(/selected recipients are not active members/),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Confirmed recipients" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((id) => `Specialist Test Member${id}`),
    ]);
    expect(screen.getByRole("button", { name: "+ 1 more" })).toBeVisible();
    for (const name of [
      "Add Recipient",
      "Remove Recipient",
      "Bulk Add Recipients",
    ])
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    await openBulk(user, "View/Edit Recipients");
    await user.click(
      screen.getByRole("checkbox", { name: "Specialist Test Member9" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(recipientFields().map((field) => field.value)).toEqual([
      "Member.5",
      "Member.1",
      "Member.2",
      "Member.3",
      "Member.4",
      "Member.6",
      "Member.7",
      "Member.8",
    ]);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Bulk Add Recipients" }),
      ).toHaveFocus(),
    );
    expect(
      screen.queryByRole("button", { name: "View/Edit Recipients" }),
    ).not.toBeInTheDocument();
  });

  test("51 recipients retain compact editing, aggregate eligibility and one citation with the complete ordered output list", async () => {
    const user = await setup(syntheticRoster(51));
    await confirmAll(user);
    expect(screen.getByText("51 recipients selected")).toBeVisible();
    expect(
      screen.getByText(
        "3 selected recipients are not active members. Please confirm eligibility.",
      ),
    ).toBeVisible();
    const names = screen.getByRole("list", { name: "Confirmed recipients" });
    expect(within(names).getAllByRole("listitem")).toHaveLength(8);
    await user.click(screen.getByRole("button", { name: "+ 43 more" }));
    expect(within(names).getAllByRole("listitem")).toHaveLength(51);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(recipientFields()).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Show less" }));
    expect(within(names).getAllByRole("listitem")).toHaveLength(8);
    await fillOperationWorksheet(user, operationValues);
    await submitRecommendation(user);
    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    const outputNames = within(preview).getByRole("list", {
      name: "Recommendation recipients",
    });
    expect(
      within(outputNames)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(
      syntheticRoster(51)
        .map((member) => `Specialist ${member.realName}`)
        .sort((a, b) => a.localeCompare(b, "en")),
    );
    expect(screen.getAllByLabelText("Citation Narrative")).toHaveLength(1);
    expect(getCitationText()).toContain("The recipients' skillful actions");
    expect(getCitationText()).not.toMatch(/Test Member\d/);
    expect(
      screen.queryByRole("combobox", { name: "Preview Recipient" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ 43 more" }));
    expect(preview).toBeInTheDocument();
    await openBulk(user, "View/Edit Recipients");
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(51);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await selectAward(user, "Purple Heart");
    expect(screen.getByText("51 recipients selected")).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });
});

describe("transactional bulk selection", () => {
  test.each(["Cancel", "Close bulk recipient selection", "Escape"])(
    "%s discards draft changes and restores focus without clearing the preview",
    async (close) => {
      const user = await setup();
      await selectRecipient(user);
      await fillOperationWorksheet(user, operationValues);
      await submitRecommendation(user);
      const preview = getCitationText();
      const field = screen.getByRole("textbox", { name: "Recipient" });
      const dialog = await openBulk(user);
      expect(field).toHaveValue("Smith.J");
      await user.type(
        screen.getByRole("textbox", { name: "Search Roster" }),
        "Kenton",
      );
      await user.click(
        screen.getByRole("button", { name: "Select All Shown" }),
      );
      expect(screen.getByText("2 recipients selected")).toBeVisible();
      expect(field).toHaveValue("Smith.J");
      expect(
        screen.queryByRole("button", { name: "Generate Recommendation" }),
      ).not.toBeInTheDocument();
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      if (close === "Escape") await user.keyboard("{Escape}");
      else await user.click(screen.getByRole("button", { name: close }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(recipientFields()).toHaveLength(1);
      expect(field).toHaveValue("Smith.J");
      expect(getCitationText()).toBe(preview);
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Bulk Add Recipients" }),
        ).toHaveFocus(),
      );
      await openBulk(user);
      expect(screen.getByText("1 recipients selected")).toBeVisible();
    },
  );

  test.each([
    ["missing full rank", { rankFull: " " }],
    ["missing rank ID", { rankId: undefined }],
  ])(
    "a selected recipient with %s cannot be confirmed; a valid replacement can",
    async (_condition, rank) => {
      const malformed = makeRecipient({
        user: { userId: "malformed", username: "Malformed.M" },
        rank,
        realName: "Malformed Recipient",
      });
      const user = await setup([malformed, smith]);
      const recipient = screen.getByRole("textbox", {
        name: "Recipient",
        exact: true,
      });
      const dialog = await openBulk(user);
      await user.click(
        within(dialog).getByRole("checkbox", {
          name: /Malformed Recipient$/,
          exact: true,
        }),
      );
      expect(within(dialog).getByText("1 recipients selected")).toBeVisible();
      const confirm = within(dialog).getByRole("button", {
        name: "Confirm Recipients",
      });
      expect(confirm).toBeDisabled();
      await user.click(confirm);
      expect(dialog).toBeVisible();
      expect(recipient).toHaveValue("");
      await user.click(
        within(dialog).getByRole("checkbox", {
          name: /Malformed Recipient$/,
          exact: true,
        }),
      );
      await user.click(
        within(dialog).getByRole("checkbox", {
          name: "Specialist John Smith",
          exact: true,
        }),
      );
      expect(confirm).toBeEnabled();
      await user.click(confirm);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: "Recipient", exact: true }),
      ).toHaveValue("Smith.J");
    },
  );

  test("organization and billet text search intersect while preserving hidden selections and ordering", async () => {
    const members = [
      {
        ...smith,
        secondaries: [{ positionId: "signal", positionTitle: "Signal Watch" }],
      },
      {
        ...kenton,
        primary: { positionId: "dev", positionTitle: "Signal Watch" },
      },
      jane,
      makeRecipient({
        user: { userId: "outside", username: "Kenton.A" },
        realName: "Alex Kenton",
        primary: { positionId: "remote", positionTitle: "Signal Watch" },
      }),
      makeRecipient({
        user: { userId: "other-billet", username: "Kenton.B" },
        realName: "Blair Kenton",
        primary: { positionId: "desk", positionTitle: "Office Clerk" },
      }),
    ];
    const user = userEvent.setup();
    renderClient({
      roster: members,
      rosterGroups: [
        {
          groupTitle: "Development",
          positions: [
            { positionId: "support" },
            { positionId: "dev" },
            { positionId: "desk" },
          ],
        },
        groups[1],
      ],
    });
    await selectAward(user);
    await openBulk(user);
    const organization = screen.getByRole("combobox", { name: "Organization" });
    const search = screen.getByRole("textbox", { name: "Search Roster" });
    expect(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("checkbox", { name: "Corporal Jane Doe" }),
    );
    organization.focus();
    await user.keyboard("{Enter}{ArrowDown}{Enter}");
    expect(organization).toHaveTextContent("Development");
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    await user.type(search, "signal");
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(
      screen.getByRole("checkbox", { name: "Specialist John Smith" }),
    ).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "Staff Sergeant Wade Kenton" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Select All Shown" }));
    await user.click(screen.getByRole("button", { name: "Select All Shown" }));
    expect(screen.getByText("3 recipients selected")).toBeVisible();
    await selectComboboxOption(user, "Organization", "All organizations");
    expect(search).toHaveValue("signal");
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(
      screen.getByRole("checkbox", { name: "Specialist Alex Kenton" }),
    ).toBeVisible();
    await selectComboboxOption(user, "Organization", "Development");
    await user.click(screen.getByRole("button", { name: "Clear Shown" }));
    expect(screen.getByText("1 recipients selected")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove Corporal Jane Doe (Doe.J)" }),
    ).toBeVisible();
    await user.clear(search);
    expect(organization).toHaveTextContent("Development");
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    await selectComboboxOption(user, "Organization", "All organizations");
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(
      screen.getByRole("checkbox", { name: "Corporal Jane Doe" }),
    ).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Select All Shown" }));
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(recipientFields().map((field) => field.value)).toEqual([
      "Doe.J",
      "Smith.J",
      "Kenton.W",
      "Kenton.A",
      "Kenton.B",
    ]);
  });

  test("renders, selects and clears all 35 search matches while retaining outside selections in order", async () => {
    const matching = syntheticRoster(35).map((member, index) => ({
      ...member,
      primary: {
        positionId: String(index),
        positionTitle: index < 17 ? "Beacon Watch" : "Field Team",
      },
      secondaries:
        index < 17
          ? []
          : [{ positionId: "beacon", positionTitle: "Beacon Watch" }],
    }));
    const user = await setup([...matching, jane, kenton]);
    await openBulk(user);
    const search = screen.getByRole("textbox", { name: "Search Roster" });
    await replaceText(user, "Search Roster", "Beacon Watch");
    expect(screen.getAllByRole("checkbox")).toHaveLength(35);
    expect(
      screen.getByRole("checkbox", { name: "Specialist Test Member35" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Select All Shown" }));
    expect(screen.getByText("35 recipients selected")).toBeVisible();
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(35);
    await user.clear(search);
    expect(screen.getByText("35 recipients selected")).toBeVisible();
    await user.click(
      screen.getByRole("checkbox", { name: "Corporal Jane Doe" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Staff Sergeant Wade Kenton" }),
    );
    await replaceText(user, "Search Roster", "Beacon Watch");
    expect(screen.getByText("37 recipients selected")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear Shown" }));
    expect(screen.getByText("2 recipients selected")).toBeVisible();
    expect(screen.queryAllByRole("checkbox", { checked: true })).toHaveLength(
      0,
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(recipientFields().map((field) => field.value)).toEqual([
      "Doe.J",
      "Kenton.W",
    ]);
  });

  test("bulk search finds recipients by Wade Kenton", async () => {
    const user = await setup();
    await openBulk(user);
    await replaceText(user, "Search Roster", "Wade Kenton");
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      screen.getByRole("checkbox", { name: "Staff Sergeant Wade Kenton" }),
    ).toBeVisible();
  });

  test("one-character S search immediately filters and exposes username and position context", async () => {
    const user = await setup();
    await openBulk(user);
    await replaceText(user, "Search Roster", "S");
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    const match = screen.getByRole("checkbox", {
      name: "Staff Sergeant Wade Kenton",
    });
    expect(match).toBeVisible();
    expect(match).toHaveAccessibleDescription("Kenton.W · Development Lead");
  });

  test("rejects an oversized clipboard alias without changing text or selecting a different recipient", async () => {
    const smith2 = makeRecipient({
      user: { userId: "1004", username: "Smith.J2" },
      realName: "James Smith",
    });
    const user = await setup([...roster, smith2]);
    await selectRecipient(user, "Ken", "Kenton.W");
    const confirmedField = screen.getByRole("textbox", { name: "Recipient" });
    await openBulk(user);
    await user.click(
      screen.getByRole("checkbox", { name: "Corporal Jane Doe" }),
    );
    await replaceText(user, "Paste a Recipient List", "Kenton.W");
    const paste = screen.getByRole("textbox", {
      name: "Paste a Recipient List",
    });
    paste.setSelectionRange(0, paste.value.length);
    // At the old native limit, the final alias became the different user Smith.J.
    await user.paste("\n".repeat(99_993) + "Smith.J2");
    expect(paste).toHaveValue("Kenton.W");
    expect(paste).toHaveAttribute("aria-invalid", "true");
    expect(paste).toHaveAccessibleDescription(/100,000 characters or fewer/);
    expect(screen.getByRole("alert").textContent).toBe(
      "Recipient list is too large. Reduce the pasted text to 100,000 characters or fewer.",
    );
    const match = screen.getByRole("button", { name: "Match Pasted Names" });
    expect(match).toBeDisabled();
    await user.click(match);
    expect(screen.getByRole("alert")).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "Specialist John Smith" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Specialist James Smith" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Staff Sergeant Wade Kenton" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Corporal Jane Doe" }),
    ).toBeChecked();
    expect(
      within(
        screen.getByRole("list", { name: "Paste match results" }),
      ).queryAllByRole("listitem"),
    ).toHaveLength(0);
    expect(confirmedField).toHaveValue("Kenton.W");
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(recipientFields().map((field) => field.value)).toEqual([
      "Kenton.W",
      "Doe.J",
    ]);
  });

  test("rejects an oversized input edit and accepts a replacement at the character boundary", async () => {
    const user = await setup();
    await openBulk(user);
    await user.click(
      screen.getByRole("checkbox", { name: "Staff Sergeant Wade Kenton" }),
    );
    await replaceText(user, "Paste a Recipient List", "Kenton.W");
    const paste = screen.getByRole("textbox", {
      name: "Paste a Recipient List",
    });
    fireEvent.change(paste, { target: { value: " ".repeat(100_001) } });
    expect(paste).toHaveValue("Kenton.W");
    expect(screen.getByRole("alert").textContent).toBe(
      "Recipient list is too large. Reduce the pasted text to 100,000 characters or fewer.",
    );
    expect(
      screen.getByRole("checkbox", { name: "Staff Sergeant Wade Kenton" }),
    ).toBeChecked();
    const accepted = " ".repeat(99_993) + "Smith.J";
    fireEvent.change(paste, { target: { value: accepted } });
    expect(paste).toHaveValue(accepted);
    expect(paste).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // Pasting over the selection must measure the replacement, not append its length.
    await user.click(paste);
    paste.setSelectionRange(0, paste.value.length);
    await user.paste("Smith.J");
    expect(paste).toHaveValue("Smith.J");
    await user.click(
      screen.getByRole("button", { name: "Match Pasted Names" }),
    );
    expect(
      screen.getByRole("checkbox", { name: "Specialist John Smith" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Staff Sergeant Wade Kenton" }),
    ).toBeChecked();
  });

  test("distinguishes equal-name recipients and removes only the intended username", async () => {
    const smith2 = makeRecipient({
      user: { userId: "1004", username: "Smith.J2" },
    });
    const user = await setup([smith, smith2]);
    await openBulk(user);
    await user.click(screen.getByRole("button", { name: "Select All Shown" }));
    const draft = screen.getByRole("list", { name: "Draft recipients" });
    expect(within(draft).getByText("Smith.J")).toBeVisible();
    expect(within(draft).getByText("Smith.J2")).toBeVisible();
    expect(
      within(draft).getByRole("button", {
        name: "Remove Specialist John Smith (Smith.J)",
      }),
    ).toBeVisible();
    await user.click(
      within(draft).getByRole("button", {
        name: "Remove Specialist John Smith (Smith.J2)",
      }),
    );
    expect(within(draft).queryByText("Smith.J2")).not.toBeInTheDocument();
    expect(within(draft).getByText("Smith.J")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(screen.getByRole("textbox", { name: "Recipient" })).toHaveValue(
      "Smith.J",
    );
    // Reopening verifies the committed identity through the roster checkboxes.
    await openBulk(user);
    const choices = within(
      screen.getByRole("list", { name: "Roster matches" }),
    );
    expect(
      choices.getByRole("checkbox", {
        name: "Specialist John Smith",
        description: "Smith.J · Support Clerk",
      }),
    ).toBeChecked();
    expect(
      choices.getByRole("checkbox", {
        name: "Specialist John Smith",
        description: "Smith.J2 · Trooper",
      }),
    ).not.toBeChecked();
  });

  test("pasted aliases are exact, ambiguity is not guessed, and successful matches are draft-only", async () => {
    const otherJane = makeRecipient({
      user: { userId: "other", username: "Doe.J2" },
      realName: "Jane Doe",
    });
    const user = await setup([...roster, otherJane]);
    await selectRecipient(user);
    const confirmedRecipients = screen.getByRole("region", {
      name: "Recipients",
    });
    await openBulk(user);
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(1);
    await replaceText(
      user,
      "Paste a Recipient List",
      "Staff Sergeant Wade Kenton\nSmith.J\nJane Doe\nKenton",
    );
    await user.click(
      screen.getByRole("button", { name: "Match Pasted Names" }),
    );
    expect(
      screen.getByText("Staff Sergeant Wade Kenton: Matched"),
    ).toBeVisible();
    expect(screen.getByText("Smith.J: Already selected")).toBeVisible();
    expect(screen.getByText("Jane Doe: Ambiguous")).toBeVisible();
    expect(screen.getByText("Kenton: Not found")).toBeVisible();
    expect(screen.getByText("2 recipients selected")).toBeVisible();
    // The modal hides the worksheet from accessibility queries, but its inputs remain mounted.
    expect(
      within(confirmedRecipients)
        .getAllByRole("textbox", { hidden: true })
        .map((field) => field.value),
    ).toEqual(["Smith.J"]);
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(recipientFields().map((field) => field.value)).toEqual([
      "Smith.J",
      "Kenton.W",
    ]);
  });

  test("confirming an unchanged selection preserves output; a changed selection invalidates it", async () => {
    const user = await setup();
    await selectRecipient(user);
    await fillOperationWorksheet(user, operationValues);
    await submitRecommendation(user);
    const citation = getCitationText();
    await openBulk(user);
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(getCitationText()).toBe(citation);
    await openBulk(user);
    await user.click(
      screen.getByRole("checkbox", { name: "Staff Sergeant Wade Kenton" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveValue(
      narrative,
    );
  });
});

describe("one shared recommendation", () => {
  function generatedNames() {
    return within(
      screen.getByRole("list", { name: "Recommendation recipients" }),
    )
      .getAllByRole("listitem")
      .map((item) => item.textContent);
  }

  function expectOneCitation() {
    expect(screen.getAllByLabelText("Citation Narrative")).toHaveLength(1);
    expect(
      screen.queryByRole("combobox", { name: "Preview Recipient" }),
    ).not.toBeInTheDocument();
  }

  const continuation =
    "providing support to a fellow trooper. Their efforts helped the member recover.";
  const hsmOpening = "For providing aid to a fellow trooper.";
  const hsmClosing =
    "dedication to duty and commitment is in great credit to themselves and the 7th Cavalry Gaming Regiment.";

  test("Service Generate displays one shared citation for 30 recipients", async () => {
    const user = await setup(syntheticRoster(30), true);
    await confirmAll(user);
    await replaceText(user, "Affected Area of the Cav", "S6");
    await replaceText(user, "Narrative", continuation);
    await submitRecommendation(user);
    expectOneCitation();
    expect(generatedNames()).toHaveLength(30);
    expect(getCitationText()).toContain("The recipients'");
  });

  test("Operation groups warn once for missing identities while retaining prose feedback; one recipient restores the individual warning", async () => {
    const user = await setup([smith, kenton]);
    await confirmAll(user);
    await fillOperationWorksheet(user, {
      ...operationValues,
      narrative: "The the team acted!!",
    });
    expect(screen.getAllByText(identityWarning)).toHaveLength(1);
    expect(screen.getByText(identityWarning)).toHaveTextContent(
      "2 of 2 recipients are not referenced",
    );
    expect(screen.getAllByText(/Sentence count:/)).toHaveLength(1);
    expect(screen.getAllByText(/Possible duplicate:/)).toHaveLength(1);
    expect(screen.getAllByText(/Possible punctuation error:/)).toHaveLength(1);
    await submitRecommendation(user);
    expectOneCitation();
    expect(screen.getAllByText(identityWarning)).toHaveLength(1);
    expect(screen.getByText(identityWarning)).toHaveTextContent(
      "2 of 2 recipients are not referenced",
    );
    expect(screen.getAllByText(/Sentence count:/)).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Remove Recipient" }));
    expect(screen.getByText(/Recipient mention:/)).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test.each([
    [
      3,
      [
        "Captain Brent Swanson",
        "Staff Sergeant Wade Kenton",
        "Specialist Tim Rhone",
      ],
      "Captain Brent Swanson, Staff Sergeant Wade Kenton, and Specialist Tim Rhone's",
    ],
    [
      7,
      [
        "Major General Adam Jarvis",
        "Captain Brent Swanson",
        "First Lieutenant Darek Hazen",
        "Staff Sergeant Ryan Beauchamp",
        "Staff Sergeant Wade Kenton",
        "Staff Sergeant Jim Rhoden",
        "Specialist Tim Rhone",
      ],
      "The recipients'",
    ],
  ])(
    "Operation with %i recipients has one opening, shared narrative and scaled closing",
    async (count, orderedNames, possessive) => {
      const members = recommendationRoster.slice(0, count);
      const user = await setup(members);
      await confirmAll(user);
      await fillOperationWorksheet(user, operationValues);
      await submitRecommendation(user);
      expectOneCitation();
      expect(generatedNames()).toEqual(orderedNames);
      expect(getCitationText()).toBe(
        count === 3
          ? "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. The element  held the position. The team supported the advance. The department secured the objective. Captain Brent Swanson, Staff Sergeant Wade Kenton, and Specialist Tim Rhone's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
          : `For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. ${narrative} ${possessive} skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.`,
      );
      expect(recipientFields().map((field) => field.value)).toEqual(
        members.map((member) => member.user.username),
      );
    },
  );

  test("HSM four-person recommendation displays every ordered identity once with one medal, ribbon and shared explicit-subject citation", async () => {
    const user = await setup(recommendationRoster.slice(0, 4), true);
    await selectAward(user, "Humanitarian Service Medal");
    await confirmAll(user);
    const subject =
      "Captain Brent Swanson, First Lieutenant Darek Hazen, Staff Sergeant Wade Kenton, and Specialist Tim Rhone";
    expect(
      screen.getByText(`${subject} distinguished themselves by`, {
        exact: true,
      }),
    ).toBeVisible();
    await replaceText(user, "Narrative", continuation);
    await submitRecommendation(user);
    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    expect(
      within(preview).getAllByRole("heading", {
        name: "Humanitarian Service Medal",
      }),
    ).toHaveLength(1);
    expect(
      within(preview).getAllByRole("img", {
        name: "Humanitarian Service Medal ribbon",
      }),
    ).toHaveLength(1);
    expect(generatedNames()).toEqual([
      "Captain Brent Swanson",
      "First Lieutenant Darek Hazen",
      "Staff Sergeant Wade Kenton",
      "Specialist Tim Rhone",
    ]);
    expectOneCitation();
    expect(getCitationText()).toBe(
      `${hsmOpening} ${subject} distinguished themselves by ${continuation} ${subject}'s ${hsmClosing}`,
    );
    expect(recipientFields().map((field) => field.value)).toEqual([
      "Rhone.T",
      "Swanson.B",
      "Kenton.W",
      "Hazen.D",
    ]);
    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveValue(
      continuation,
    );
  });

  test("HSM starter preserves the individual form and updates to two identities in SOP order", async () => {
    const user = await setup(recommendationRoster.slice(0, 2), true);
    await selectAward(user, "Humanitarian Service Medal");
    await selectRecipient(user, "Rho", "Rhone.T");
    expect(
      screen.getByText("Specialist Tim Rhone distinguished themselves by", {
        exact: true,
      }),
    ).toBeVisible();
    await confirmAll(user);
    const subject = "Captain Brent Swanson and Specialist Tim Rhone";
    expect(
      screen.getByText(`${subject} distinguished themselves by`, {
        exact: true,
      }),
    ).toBeVisible();
    await replaceText(user, "Narrative", continuation);
    await submitRecommendation(user);
    expectOneCitation();
    expect(getCitationText()).toBe(
      `${hsmOpening} ${subject} distinguished themselves by ${continuation} ${subject}'s ${hsmClosing}`,
    );
    await selectAward(user, "Army Achievement Medal");
    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveValue(
      continuation,
    );
    expect(recipientFields().map((field) => field.value)).toEqual([
      "Rhone.T",
      "Swanson.B",
    ]);
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("HSM six to seven to six recipients updates the starter live and regenerates matching prose without moving fields", async () => {
    const members = recommendationRoster.slice(0, 7);
    const user = await setup(members, true);
    await selectAward(user, "Humanitarian Service Medal");
    await openBulk(user);
    await user.click(screen.getByRole("button", { name: "Select All Shown" }));
    await user.click(
      screen.getByRole("button", {
        name: "Remove Staff Sergeant Jim Rhoden (Rhoden.J)",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    const sixNames = [
      "Major General Adam Jarvis",
      "Captain Brent Swanson",
      "First Lieutenant Darek Hazen",
      "Staff Sergeant Ryan Beauchamp",
      "Staff Sergeant Wade Kenton",
      "Specialist Tim Rhone",
    ];
    const sixSubject =
      "Major General Adam Jarvis, Captain Brent Swanson, First Lieutenant Darek Hazen, Staff Sergeant Ryan Beauchamp, Staff Sergeant Wade Kenton, and Specialist Tim Rhone";
    await replaceText(user, "Narrative", continuation);
    expect(
      screen.getByText(`${sixSubject} distinguished themselves by`, {
        exact: true,
      }),
    ).toBeVisible();
    await submitRecommendation(user);
    expect(generatedNames()).toEqual(sixNames);
    expect(getCitationText()).toBe(
      `${hsmOpening} ${sixSubject} distinguished themselves by ${continuation} ${sixSubject}'s ${hsmClosing}`,
    );
    await user.click(screen.getByRole("button", { name: "Add Recipient" }));
    await user.type(
      screen.getByRole("textbox", { name: "Recipient 7" }),
      "Rhoden",
    );
    await user.click(
      screen.getByRole("button", { name: "Rhoden.J", exact: true }),
    );
    expect(
      screen.getByText("The recipients distinguished themselves by", {
        exact: true,
      }),
    ).toBeVisible();
    expect(recipientFields().map((field) => field.value)).toEqual(
      members.map((member) => member.user.username),
    );
    await submitRecommendation(user);
    expectOneCitation();
    expect(generatedNames()).toEqual([
      ...sixNames.slice(0, 5),
      "Staff Sergeant Jim Rhoden",
      ...sixNames.slice(5),
    ]);
    expect(getCitationText()).toBe(
      `${hsmOpening} The recipients distinguished themselves by ${continuation} The recipients' ${hsmClosing}`,
    );
    await user.click(screen.getByRole("button", { name: "Remove Recipient" }));
    expect(
      screen.getByText(`${sixSubject} distinguished themselves by`, {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      screen.queryByText("The recipients distinguished themselves by", {
        exact: true,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
    await submitRecommendation(user);
    expectOneCitation();
    expect(generatedNames()).toEqual(sixNames);
    expect(getCitationText()).toBe(
      `${hsmOpening} ${sixSubject} distinguished themselves by ${continuation} ${sixSubject}'s ${hsmClosing}`,
    );
    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveValue(
      continuation,
    );
  });

  test("selectable Service wording changes the shared starter while preserving the explicit recipient subject", async () => {
    const user = await setup(recommendationRoster.slice(0, 2), true);
    await selectAward(user, "Joint Service Commendation Medal");
    await confirmAll(user);
    const subject = "Captain Brent Swanson and Specialist Tim Rhone";
    await selectComboboxOption(user, "Narrative Opening", "Contributed");
    expect(
      screen.getByText(`${subject} contributed themselves by`, { exact: true }),
    ).toBeVisible();
    await selectComboboxOption(user, "Narrative Opening", "Distinguished");
    expect(
      screen.getByText(`${subject} distinguished themselves by`, {
        exact: true,
      }),
    ).toBeVisible();
  });
});

describe("worksheet-owned narrative identity warnings", () => {
  test("Operation three-recipient warning counts only missing user references and stays soft after generated identities appear", async () => {
    const user = await setup();
    await confirmAll(user);
    const text =
      "Specialist John Smith secured the objective. Staff Sergeant Wade Kenton supported the advance. The team completed the mission.";
    await fillOperationWorksheet(user, { ...operationValues, narrative: text });
    const warning =
      "1 of 3 recipients is not referenced in the narrative. Ensure each recipient is properly cited before submitting the recommendation.";
    expect(screen.getAllByText(identityWarning)).toHaveLength(1);
    expect(screen.getByText(warning)).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Narrative" }),
    ).not.toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("button", { name: "Generate Recommendation" }),
    ).toBeEnabled();
    await submitRecommendation(user);
    expect(screen.getAllByLabelText("Citation Narrative")).toHaveLength(1);
    expect(getCitationText()).toContain("Corporal Jane Doe");
    expect(screen.getAllByText(identityWarning)).toHaveLength(1);
    expect(screen.getByText(warning)).toBeVisible();
    await replaceText(
      user,
      "Narrative",
      text + " Corporal Jane Doe maintained communications.",
    );
    expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
  });

  test("Operation six to seven to six recipients removes and restores the aggregate warning live", async () => {
    const user = await setup(recommendationRoster.slice(0, 7));
    await openBulk(user);
    await user.click(screen.getByRole("button", { name: "Select All Shown" }));
    await user.click(
      screen.getByRole("button", {
        name: "Remove Staff Sergeant Jim Rhoden (Rhoden.J)",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm Recipients" }),
    );
    const text =
      "Specialist Tim Rhone secured the objective. Captain Brent Swanson directed the advance. Staff Sergeant Wade Kenton covered the crossing. First Lieutenant Darek Hazen coordinated the support. Staff Sergeant Ryan Beauchamp maintained communications.";
    await fillOperationWorksheet(user, { ...operationValues, narrative: text });
    const warning =
      "1 of 6 recipients is not referenced in the narrative. Ensure each recipient is properly cited before submitting the recommendation.";
    expect(screen.getAllByText(identityWarning)).toHaveLength(1);
    expect(screen.getByText(warning)).toBeVisible();
    await submitRecommendation(user);
    expect(screen.getByText(warning)).toBeVisible();
    expect(screen.getAllByLabelText("Citation Narrative")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Add Recipient" }));
    await user.type(
      screen.getByRole("textbox", { name: "Recipient 7" }),
      "Rhoden",
    );
    await user.click(
      screen.getByRole("button", { name: "Rhoden.J", exact: true }),
    );
    expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
    expect(getCitationText()).toContain("The recipients' skillful actions");
    expect(
      within(
        screen.getByRole("list", { name: "Recommendation recipients" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(7);
    await user.click(screen.getByRole("button", { name: "Remove Recipient" }));
    expect(screen.getAllByText(identityWarning)).toHaveLength(1);
    expect(screen.getByText(warning)).toBeVisible();
    await submitRecommendation(user);
    expect(screen.getByText(warning)).toBeVisible();
  });

  test.each([
    [1, "Staff Sergeant Wade Kenton"],
    [
      4,
      "Captain Brent Swanson, First Lieutenant Darek Hazen, Staff Sergeant Wade Kenton, and Specialist Tim Rhone",
    ],
    [7, "The recipients"],
  ])(
    "Service with %i recipients has no identity warning while preserving its starter and general prose feedback",
    async (count, subject) => {
      const user = await setup(
        count === 1 ? [kenton] : recommendationRoster.slice(0, count),
        true,
      );
      await selectAward(user, "Humanitarian Service Medal");
      await confirmAll(user);
      await replaceText(user, "Narrative", "providing the the support!!");
      expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
      expect(
        screen.getByText(`${subject} distinguished themselves by`, {
          exact: true,
        }),
      ).toBeVisible();
      for (const feedback of [
        /Sentence count:/,
        /Possible duplicate:/,
        /Possible punctuation error:/,
      ])
        expect(screen.getAllByText(feedback)).toHaveLength(1);
      await submitRecommendation(user);
      expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
      expect(screen.getAllByLabelText("Citation Narrative")).toHaveLength(1);
      expect(getCitationText()).toContain(
        `${subject} distinguished themselves by providing the the support!!`,
      );
      for (const feedback of [
        /Sentence count:/,
        /Possible duplicate:/,
        /Possible punctuation error:/,
      ])
        expect(screen.getAllByText(feedback)).toHaveLength(1);
    },
  );
});
