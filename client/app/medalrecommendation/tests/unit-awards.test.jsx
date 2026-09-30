import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedalRecommendationPage from "../page";
import {
  getCitationText,
  makeRecipientRoster,
  renderClient,
  selectAward,
  selectComboboxOption,
  submitRecommendation,
} from "./test-helpers";
import {
  UNIT_AWARD_CASES,
  UNIT_OPERATION_INPUTS,
  UNIT_SERVICE_INPUTS,
  UNIT_NARRATIVE,
  UNIT_CONTINUATION,
} from "./unit-award-cases";

import { OPERATION_MEDAL_CASES } from "./operation-medal-cases";
import { SERVICE_CATALOG_CASES } from "./service-medal-cases";

const [avua, muc, jmua, sua] = UNIT_AWARD_CASES;
const minimumError = "At least 4 recipients are required for this Unit Award.";
const identityWarning =
  /Recipient mentions?:|\d+ of \d+ recipients (?:is|are) not referenced/;
function enter(label, value) {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  });
}
function expectValues(values) {
  for (const [label, value] of Object.entries(values))
    expect(screen.getByLabelText(label, { exact: true })).toHaveValue(value);
}
function expectSelectedRecipients(count) {
  const inputs = screen.getAllByRole("textbox", {
    name: /^Recipient(?: \d+)?$/,
  });
  expect(inputs).toHaveLength(count);
  expect(inputs.map((input) => input.value)).toEqual(
    expect.arrayContaining(
      makeRecipientRoster(count).map((member) => member.user.username),
    ),
  );
}
async function open(award, count = award.minimumRecipients) {
  const user = userEvent.setup();
  renderClient({
    medalFamily: award.family,
    roster: makeRecipientRoster(count),
  });
  await selectAward(user, award.name);
  return user;
}
async function openBulk(user) {
  await user.click(
    screen.getByRole("button", {
      name: /^(Bulk Add Recipients|View\/Edit Recipients)$/,
    }),
  );
  return screen.getByRole("dialog", { name: "Bulk Recipient Selection" });
}
async function selectAll(user) {
  await openBulk(user);
  await user.click(screen.getByRole("button", { name: "Select All Shown" }));
  await user.click(screen.getByRole("button", { name: "Confirm Recipients" }));
}
async function fillContext(user, award, overrides = {}) {
  if (award.family === "operation") {
    const values = { ...UNIT_OPERATION_INPUTS, ...overrides };
    if (award === muc)
      await selectComboboxOption(user, "Skillful / Heroic", "Skillful");
    enter("Combat Unit", values.combatUnit);
    enter("Operation Title", values.operationTitle);
    enter("Location", values.location);
    enter("Operation Date", values.operationDate);
    enter("Narrative", values.narrative);
  } else {
    const values = { ...UNIT_SERVICE_INPUTS, ...overrides };
    enter("Benefitted Unit", values.benefittedUnit);
    enter("Awarded Department / Unit", values.awardedUnit);
    await selectComboboxOption(user, "Service / Contributions", "Service");
    enter("Narrative", values.narrative);
  }
}

describe("Unit award worksheets", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 27, 12));
  });
  afterEach(() => vi.useRealTimers());

  test("Unit awards use the two existing family links without a third navigation route", () => {
    render(<MedalRecommendationPage />);
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual([
      "/medalrecommendation/operation",
      "/medalrecommendation/service",
    ]);
  });

  test.each(["operation", "service"])(
    "%s visibly groups every existing Individual award and its two Unit awards",
    async (family) => {
      const user = userEvent.setup();
      renderClient({ medalFamily: family });
      await user.click(screen.getByRole("combobox", { name: "Award" }));
      const individual = screen.getByRole("group", { name: "Individual" });
      const unit = screen.getByRole("group", { name: "Unit" });
      for (const group of [individual, unit]) expect(group).toBeVisible();
      expect(
        within(individual)
          .getAllByRole("option")
          .map((option) => option.textContent),
      ).toEqual(
        (family === "operation"
          ? OPERATION_MEDAL_CASES
          : SERVICE_CATALOG_CASES
        ).map(({ name }) => name),
      );
      expect(
        within(unit)
          .getAllByRole("option")
          .map((option) => option.textContent),
      ).toEqual(
        UNIT_AWARD_CASES.filter((award) => award.family === family).map(
          ({ name }) => name,
        ),
      );
      for (const name of ["Individual", "Unit"])
        expect(
          screen.queryByRole("option", { name, exact: true }),
        ).not.toBeInTheDocument();
      await user.keyboard("{End}{Enter}");
      expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
        family === "operation" ? muc.name : sua.name,
      );
      expect(screen.getByRole("combobox", { name: "Award" })).toHaveFocus();
    },
  );

  test.each(UNIT_AWARD_CASES)(
    "$abbreviation displays the SOP guidance with award and detail headings and no worksheet ribbon",
    async (award) => {
      await open(award);
      const guidance = screen.getByRole("region", { name: "Award Guidance" });
      expect(
        within(guidance).getByRole("heading", {
          name: "Award Guidance",
          level: 3,
        }),
      ).toBeVisible();
      expect(
        within(guidance).getByRole("heading", {
          name: award.name,
          exact: true,
          level: 4,
        }),
      ).toBeVisible();
      expect(within(guidance).queryByRole("img")).not.toBeInTheDocument();
      for (const heading of [
        "Criteria",
        "Narrative Guidance",
        "Eligibility Guidance",
      ])
        expect(
          within(guidance).getByRole("heading", {
            name: heading,
            exact: true,
            level: 5,
          }),
        ).toBeVisible();
      expect(
        within(guidance).getByText(award.criteria, { exact: true }),
      ).toBeVisible();
      expect(
        within(guidance).getByText(award.narrativeGuidance, { exact: true }),
      ).toBeVisible();
      const notes = within(guidance).getAllByRole("listitem");
      expect(notes.map((note) => note.textContent)).toEqual(
        award.eligibilityNotes,
      );
      for (const note of notes) expect(note).toBeVisible();
      for (const field of award.fields)
        expect(screen.getByLabelText(field, { exact: true })).toBeVisible();
      expect(
        screen.queryByRole("img", { name: `${award.name} ribbon` }),
      ).not.toBeInTheDocument();
      if (award.family === "operation")
        expect(
          screen.getByLabelText("Combat Unit", { exact: true }),
        ).toHaveAttribute("placeholder", "Alpha Squad");
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      for (const field of [
        "Combat Element",
        "Unit",
        "Service Start",
        "Service End",
        "Role",
        "Airframe",
      ])
        expect(
          screen.queryByLabelText(field, { exact: true }),
        ).not.toBeInTheDocument();
    },
  );

  // Exactly four complete literal oracles: fixed AVUA, Skillful MUC, and
  // Service + Distinguished for JMUA/SUA. Alternate choices use narrow checks.
  test.each(UNIT_AWARD_CASES)(
    "$abbreviation generates one shared recommendation matching its full literal citation",
    async (award) => {
      const user = await open(award);
      await fillContext(
        user,
        award,
        award === avua ? { operationTitle: "  oPeRaTiOn Overlord  " } : {},
      );
      if (award.family === "operation")
        expect(
          within(screen.getByRole("region", { name: "Recipients" })).getByRole(
            "status",
          ),
        ).toHaveTextContent(minimumError);
      else expect(screen.queryByText(minimumError)).not.toBeInTheDocument();
      await submitRecommendation(user);
      expect(
        screen.queryByLabelText("Citation Narrative"),
      ).not.toBeInTheDocument();
      if (award.family === "operation") {
        expect(
          within(screen.getByRole("region", { name: "Recipients" })).getByText(
            minimumError,
          ),
        ).toBeVisible();
      } else {
        expect(screen.queryByText(minimumError)).not.toBeInTheDocument();
        expect(
          screen.getByRole("textbox", { name: "Recipient", exact: true }),
        ).toHaveAttribute("aria-invalid", "true");
      }
      await selectAll(user);
      expect(screen.queryByText(minimumError)).not.toBeInTheDocument();
      await submitRecommendation(user);
      expect(getCitationText()).toBe(award.citation);
      const preview = screen.getByRole("region", {
        name: "Recommendation Preview",
      });
      expect(
        within(preview).getByRole("img", { name: `${award.name} ribbon` }),
      ).toHaveAttribute("src", award.ribbonUrl);
      expect(screen.getAllByLabelText("Citation Narrative")).toHaveLength(1);
      expect(
        within(preview).getByRole("heading", { name: award.name, exact: true }),
      ).toBeVisible();
      expect(
        within(preview).getByLabelText("Citation Narrative"),
      ).toBeVisible();
      expect(
        within(
          within(preview).getByRole("list", {
            name: "Recommendation recipients",
          }),
        ).getAllByRole("listitem"),
      ).toHaveLength(award.minimumRecipients);
    },
  );

  // The shared generation handler owns prefix removal, so exercise the real
  // input-to-citation boundary without copying its normalization into a test.
  test.each([avua, muc])(
    "$abbreviation renders Operation once for bare and prefixed titles without rewriting input",
    async (award) => {
      const user = await open(award);
      await selectAll(user);
      await fillContext(user, award);
      for (const operationTitle of ["Overlord", "Operation Overlord"]) {
        enter("Operation Title", operationTitle);
        await submitRecommendation(user);
        expect(getCitationText()).toContain(
          "during combat in Operation Overlord near Omaha Beach on 11 August 2026.",
        );
        expect(getCitationText()).not.toContain("Operation Operation Overlord");
        expectValues({
          "Operation Title": operationTitle,
          Narrative: UNIT_NARRATIVE,
        });
      }
    },
  );

  test("ARCOM with Valor -> AVUA -> ARCOM with Valor restores identity feedback and one-recipient generation", async () => {
    const individual = {
      family: "operation",
      name: "Army Commendation Medal With Valor",
    };
    const user = await open(individual, 1);
    await selectAll(user);
    enter("Combat Element", "a rifleman");
    enter("Narrative", UNIT_NARRATIVE);
    expect(screen.getByLabelText("Combat Element")).toBeVisible();
    expect(screen.queryByLabelText("Combat Unit")).not.toBeInTheDocument();
    expect(screen.getByText(identityWarning)).toBeVisible();

    await selectAward(user, avua.name);
    await fillContext(user, avua, {
      combatUnit: "Sentinel Alpha Squad",
      location: "Normandy",
    });
    expect(screen.getByLabelText("Combat Unit")).toBeVisible();
    expectValues({ "Combat Unit": "Sentinel Alpha Squad" });
    expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();

    await selectAward(user, individual.name);
    expect(screen.queryByLabelText("Combat Unit")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Combat Element")).toBeVisible();
    expectSelectedRecipients(1);
    expectValues({ Narrative: UNIT_NARRATIVE });
    expect(screen.getByText(identityWarning)).toBeVisible();
    enter("Combat Element", "a rifleman");
    await submitRecommendation(user);
    expect(screen.queryByText(minimumError)).not.toBeInTheDocument();
    expect(getCitationText()).toContain("while serving as a rifleman");
    expect(getCitationText()).toContain(
      "Specialist Test Member1's heroism and skill",
    );
    expect(getCitationText()).not.toContain("Sentinel Alpha Squad");
    expect(screen.getByText(identityWarning)).toBeVisible();
  });

  test("AAM -> JMUA -> AAM restores the named Individual starter and excludes Unit-only context", async () => {
    const individual = { family: "service", name: "Army Achievement Medal" };
    const user = await open(individual, 1);
    await selectAll(user);
    enter("Affected Area of the Cav", "S7 Individual Training");
    enter("Narrative", UNIT_CONTINUATION);
    expect(screen.getByLabelText("Affected Area of the Cav")).toBeVisible();
    expect(
      screen.queryByLabelText("Awarded Department / Unit"),
    ).not.toBeInTheDocument();
    // Individual Service medals supply recipient identity through their starter.
    expect(
      screen.getByText("Specialist Test Member1 distinguished themselves by", {
        exact: true,
      }),
    ).toBeVisible();

    await selectAward(user, jmua.name);
    await fillContext(user, jmua, {
      awardedUnit: "Sentinel S6 Development",
      benefittedUnit: "Sentinel 2/B/2-7",
    });
    expect(screen.getByLabelText("Awarded Department / Unit")).toBeVisible();
    await selectComboboxOption(
      user,
      "Service / Contributions",
      "Contributions",
    );
    await selectComboboxOption(user, "Narrative Opening", "Contributed");
    expect(
      screen.getByText("Sentinel S6 Development contributed themselves by", {
        exact: true,
      }),
    ).toBeVisible();

    await selectAward(user, individual.name);
    for (const field of [
      "Achievement / Contribution",
      "Benefitted Unit",
      "Awarded Department / Unit",
      "Service / Contributions",
      "Narrative Opening",
    ])
      expect(
        screen.queryByLabelText(field, { exact: true }),
      ).not.toBeInTheDocument();
    expectValues({
      "Affected Area of the Cav": "S7 Individual Training",
      Narrative: UNIT_CONTINUATION,
    });
    expectSelectedRecipients(1);
    expect(
      screen.getByText("Specialist Test Member1 distinguished themselves by", {
        exact: true,
      }),
    ).toBeVisible();
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "For contributions in S7 Individual Training.",
    );
    expect(getCitationText()).toContain(
      "Specialist Test Member1 distinguished themselves by coordinating training across departments.",
    );
    expect(getCitationText()).toContain(
      "Specialist Test Member1's dedication to duty",
    );
    expect(getCitationText()).not.toMatch(
      /sentinel|contributed themselves by/i,
    );
    expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
  });

  test("MUC Heroic updates both clauses while AVUA/MUC round trips preserve Operation context and recipients", async () => {
    const user = await open(avua);
    await selectAll(user);
    await fillContext(user, avua);
    for (const awardName of [muc.name, avua.name, muc.name]) {
      await selectAward(user, awardName);
      expectValues({
        "Combat Unit": "1st Squad, Alpha Company",
        "Operation Title": "Overlord",
        Location: "Omaha Beach",
        "Operation Date": "2026-08-11",
        Narrative: UNIT_NARRATIVE,
      });
      expectSelectedRecipients(4);
      if (awardName === muc.name) {
        expect(
          screen.getByRole("combobox", { name: "Skillful / Heroic" }),
        ).toHaveTextContent("Select action character");
        await submitRecommendation(user);
        expect(
          screen.queryByLabelText("Citation Narrative"),
        ).not.toBeInTheDocument();
        await selectComboboxOption(user, "Skillful / Heroic", "Skillful");
      } else {
        await submitRecommendation(user);
        expect(getCitationText()).not.toMatch(
          /skillful actions|heroic actions/,
        );
      }
    }
    await selectComboboxOption(user, "Skillful / Heroic", "Heroic");
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "For heroic actions over an entire operation while serving as 1st Squad, Alpha Company in the 7th Cavalry Regiment during combat in Operation Overlord near Omaha Beach on 11 August 2026.",
    );
    expect(getCitationText()).toContain(
      "Their heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
    expect(getCitationText()).not.toContain("skillful");
    expectValues({ Narrative: UNIT_NARRATIVE });
  });

  test("JMUA keeps its fixed opening when choices change and updates only its benefitted unit", async () => {
    const user = await open(jmua);
    expect(
      screen.queryByLabelText("Achievement / Contribution"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Narrative Opening" }),
    ).toHaveTextContent("Distinguished");
    await selectAll(user);
    await fillContext(user, jmua);
    await submitRecommendation(user);
    const opening =
      "For exceptionally meritorious performance and distinguished contributions to S3 Operations.";
    const before = getCitationText();
    expect(before.startsWith(opening)).toBe(true);
    expect(before.split(opening)).toHaveLength(2);
    await selectComboboxOption(
      user,
      "Service / Contributions",
      "Contributions",
    );
    expectValues({
      "Benefitted Unit": "S3 Operations",
      "Awarded Department / Unit": "S3 ARMA Operations staff",
      Narrative: UNIT_CONTINUATION,
    });
    expect(
      screen.getByRole("combobox", { name: "Narrative Opening" }),
    ).toHaveTextContent("Distinguished");
    await submitRecommendation(user);
    const serviceClosing =
      "Their dedication to duty and exceptionally meritorious service are in great credit to themselves, S3 Operations, and the 7th Cavalry Gaming Regiment.";
    const contributionsClosing =
      "Their dedication to duty and exceptionally meritorious contributions are in great credit to themselves, S3 Operations, and the 7th Cavalry Gaming Regiment.";
    expect(before.endsWith(serviceClosing)).toBe(true);
    expect(getCitationText().endsWith(contributionsClosing)).toBe(true);
    expect(getCitationText().slice(0, -contributionsClosing.length)).toBe(
      before.slice(0, -serviceClosing.length),
    );
    await selectComboboxOption(user, "Narrative Opening", "Contributed");
    expect(
      screen.getByText("S3 ARMA Operations staff contributed themselves by", {
        exact: true,
      }),
    ).toBeVisible();
    expectValues({ Narrative: UNIT_CONTINUATION });
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "S3 ARMA Operations staff contributed themselves by coordinating training across departments.",
    );
    expect(getCitationText().startsWith(opening)).toBe(true);
    expect(getCitationText().split(opening)).toHaveLength(2);
    enter("Benefitted Unit", "S6");
    await submitRecommendation(user);
    expect(
      getCitationText().startsWith(
        "For exceptionally meritorious performance and distinguished contributions to S6.",
      ),
    ).toBe(true);
    expect(getCitationText()).not.toContain("S3 Operations");
    expect(
      getCitationText().match(
        /For exceptionally meritorious performance and distinguished contributions to/g,
      ),
    ).toHaveLength(1);
  });

  test("SUA Contributions updates opening and closing together; Contributed preserves the literal SOP starter", async () => {
    const user = await open(sua);
    await selectAll(user);
    await fillContext(user, sua);
    await selectComboboxOption(
      user,
      "Service / Contributions",
      "Contributions",
    );
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "For exceptionally meritorious contributions to S3 Operations.",
    );
    expect(getCitationText()).toContain(
      "Their dedication to duty and exceptionally meritorious contributions are in great credit to themselves, S3 Operations, and the 7th Cavalry Gaming Regiment.",
    );
    expect(getCitationText()).not.toContain("meritorious service");
    expectValues({
      "Benefitted Unit": "S3 Operations",
      "Awarded Department / Unit": "S3 ARMA Operations staff",
      Narrative: UNIT_CONTINUATION,
    });
    await selectComboboxOption(user, "Narrative Opening", "Contributed");
    expect(
      screen.getByText("S3 ARMA Operations staff contributed themselves by", {
        exact: true,
      }),
    ).toBeVisible();
    expectValues({ Narrative: UNIT_CONTINUATION });
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "S3 ARMA Operations staff contributed themselves by coordinating training across departments.",
    );
  });

  test("JMUA/SUA round trips keep distinct organizations, continuation and recipients while resetting choices", async () => {
    const user = await open(jmua);
    await fillContext(user, jmua);
    expect(
      screen.getByText("S3 ARMA Operations staff distinguished themselves by", {
        exact: true,
      }),
    ).toBeVisible();
    await selectAll(user);
    enter("Benefitted Unit", "S7 Training");
    enter("Awarded Department / Unit", "Technical Support staff");
    await selectComboboxOption(user, "Narrative Opening", "Contributed");
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "For exceptionally meritorious performance and distinguished contributions to S7 Training.",
    );
    expect(getCitationText()).toContain(
      "Technical Support staff contributed themselves by",
    );
    expect(getCitationText()).toContain("themselves, S7 Training, and");
    await selectAward(user, sua.name);
    expect(
      screen.getByRole("combobox", { name: "Narrative Opening" }),
    ).toHaveTextContent("Distinguished");
    for (const awardName of [sua.name, jmua.name]) {
      if (awardName === jmua.name) await selectAward(user, jmua.name);
      expectValues({
        "Benefitted Unit": "S7 Training",
        "Awarded Department / Unit": "Technical Support staff",
        Narrative: UNIT_CONTINUATION,
      });
      expectSelectedRecipients(1);
      expect(
        screen.getByRole("combobox", { name: "Service / Contributions" }),
      ).toHaveTextContent("Select service or contributions");
      await submitRecommendation(user);
      expect(
        screen.queryByLabelText("Citation Narrative"),
      ).not.toBeInTheDocument();
      await selectComboboxOption(user, "Service / Contributions", "Service");
      if (awardName === jmua.name) {
        expect(
          screen.getByRole("combobox", { name: "Narrative Opening" }),
        ).toHaveTextContent("Distinguished");
      }
      await submitRecommendation(user);
      expect(getCitationText()).toContain(
        "Technical Support staff distinguished themselves by",
      );
      if (awardName === sua.name) {
        expect(getCitationText()).toContain(
          "For exceptionally meritorious service to S7 Training.",
        );
      }
    }
  });

  test.each(UNIT_AWARD_CASES)(
    "$abbreviation keeps sentence counts advisory and excludes fixed citation framing",
    async (award) => {
      const user = await open(award);
      await selectAll(user);
      const sentences = (
        award.family === "operation" ? UNIT_NARRATIVE : UNIT_CONTINUATION
      ).split(/(?<=\.) /);
      await fillContext(user, award, {
        narrative: sentences.slice(0, award.minimumSentences - 1).join(" "),
      });
      expect(screen.getByText(/Sentence count:/)).toBeVisible();
      await submitRecommendation(user);
      expect(screen.getByLabelText("Citation Narrative")).toBeVisible();
      expect(screen.getByText(/Sentence count:/)).toBeVisible();
      expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
      enter("Narrative", sentences.slice(0, award.minimumSentences).join(" "));
      expect(screen.queryByText(/Sentence count:/)).not.toBeInTheDocument();
      enter("Narrative", "");
      await submitRecommendation(user);
      expect(
        screen.queryByLabelText("Citation Narrative"),
      ).not.toBeInTheDocument();
    },
  );

  test.each([avua, muc])(
    "$abbreviation permits Bulk confirmation below four, then enforces the three/four generation boundary",
    async (award) => {
      const user = await open(award);
      await fillContext(user, award);
      const dialog = await openBulk(user);
      expect(
        within(dialog).queryByText(/At least 4|required to generate/i),
      ).not.toBeInTheDocument();
      for (const member of makeRecipientRoster(3))
        await user.click(
          within(dialog).getByRole("checkbox", {
            name: `Specialist ${member.realName}`,
            exact: true,
          }),
        );
      expect(
        within(dialog).getByRole("button", { name: "Confirm Recipients" }),
      ).toBeEnabled();
      await user.click(
        within(dialog).getByRole("button", { name: "Confirm Recipients" }),
      );
      expectSelectedRecipients(3);
      const recipients = screen.getByRole("region", { name: "Recipients" });
      const hint = within(recipients).getByRole("status");
      expect(hint.textContent).toBe(minimumError);
      expect(screen.getAllByText(minimumError, { exact: true })).toHaveLength(
        1,
      );
      expect(recipients).toHaveAccessibleDescription(minimumError);
      await submitRecommendation(user);
      const error = within(recipients).getByRole("alert");
      expect(error).toBe(hint);
      expect(within(recipients).queryByRole("status")).not.toBeInTheDocument();
      expect(error.textContent).toBe(minimumError);
      expect(screen.getAllByText(minimumError, { exact: true })).toHaveLength(
        1,
      );
      expect(recipients).toHaveAccessibleDescription(minimumError);
      expect(
        screen.queryByLabelText("Citation Narrative"),
      ).not.toBeInTheDocument();
      await selectAll(user);
      expect(screen.queryByText(minimumError)).not.toBeInTheDocument();
      await submitRecommendation(user);
      expect(screen.getByLabelText("Citation Narrative")).toBeVisible();
      await user.click(
        screen.getByRole("button", { name: "Remove Recipient" }),
      );
      expect(
        screen.queryByLabelText("Citation Narrative"),
      ).not.toBeInTheDocument();
      expect(within(recipients).getByRole("status").textContent).toBe(
        minimumError,
      );
      expect(screen.getAllByText(minimumError, { exact: true })).toHaveLength(
        1,
      );
      await submitRecommendation(user);
      expect(within(recipients).getByRole("alert").textContent).toBe(
        minimumError,
      );
      expect(
        screen.queryByLabelText("Citation Narrative"),
      ).not.toBeInTheDocument();
    },
  );

  test.each([6, 7, 8, 9])(
    "AVUA retains all %i recipients without names or individual collective wording in its citation",
    async (count) => {
      const user = await open(avua, count);
      await selectAll(user);
      await fillContext(user, avua);
      if (count === 9) {
        expect(
          screen.getByRole("button", { name: "View/Edit Recipients" }),
        ).toBeVisible();
        const confirmed = screen.getByRole("list", {
          name: "Confirmed recipients",
        });
        expect(within(confirmed).getAllByRole("listitem")).toHaveLength(8);
        await user.click(screen.getByRole("button", { name: "+ 1 more" }));
        expect(within(confirmed).getAllByRole("listitem")).toHaveLength(9);
      } else {
        expect(
          screen.queryByRole("button", { name: "View/Edit Recipients" }),
        ).not.toBeInTheDocument();
        expect(
          screen.getAllByRole("textbox", { name: /^Recipient \d+$/ }),
        ).toHaveLength(count);
      }
      await submitRecommendation(user);
      expect(screen.getAllByLabelText("Citation Narrative")).toHaveLength(1);
      expect(getCitationText()).not.toMatch(
        /Test Member|Member\.\d|The recipients/,
      );
      expect(getCitationText()).toContain(
        "while serving as 1st Squad, Alpha Company",
      );
      expect(getCitationText()).toContain(
        "Their heroism, skill and devotion to duty reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
      );
      const names = within(
        screen.getByRole("list", { name: "Recommendation recipients" }),
      )
        .getAllByRole("listitem")
        .map((item) => item.textContent);
      expect(names).toHaveLength(count);
      expect(names).toEqual(
        expect.arrayContaining(
          makeRecipientRoster(count).map(
            (member) => `Specialist ${member.realName}`,
          ),
        ),
      );
    },
  );

  test("Individual Service opening and live warnings wait for complete recipients when worksheet flags are omitted", async () => {
    const user = await open(
      { family: "service", name: "Army Achievement Medal" },
      1,
    );
    enter("Affected Area of the Cav", "S7 Training");
    await user.type(
      screen.getByRole("textbox", { name: "Narrative" }),
      "The the team improved readiness.",
    );
    expect(
      screen.getByRole("textbox", { name: "Recipient", exact: true }),
    ).toHaveValue("");
    expect(
      screen.queryByText(/distinguished themselves by/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Narrative Warnings" }),
    ).not.toBeInTheDocument();
    await selectAll(user);
    expect(
      screen.getByText("Specialist Test Member1 distinguished themselves by", {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent("Possible duplicate:");
  });

  test.each([jmua, sua])(
    "$abbreviation shows its group starter and live prose warnings with no confirmed recipient",
    async (award) => {
      const user = await open(award);
      await fillContext(user, award, { narrative: "" });
      await user.type(
        screen.getByRole("textbox", { name: "Narrative" }),
        "The the group improved readiness.",
      );
      expect(
        screen.getByRole("textbox", { name: "Recipient", exact: true }),
      ).toHaveValue("");
      expect(
        screen.getByText(
          "S3 ARMA Operations staff distinguished themselves by",
          { exact: true },
        ),
      ).toBeVisible();
      expect(
        screen.getByRole("status", { name: "Narrative Warnings" }),
      ).toHaveTextContent("Possible duplicate:");
      expect(
        screen.queryByLabelText("Citation Narrative"),
      ).not.toBeInTheDocument();
    },
  );

  test("AVUA prose warnings appear before four recipients are selected, while Individual warnings still wait for recipient identity", async () => {
    const individual = { family: "operation", name: "Army Commendation Medal" };
    const user = await open(individual, 1);
    await user.type(
      screen.getByRole("textbox", { name: "Narrative" }),
      "The the team advanced.",
    );
    expect(screen.queryByText(/Possible duplicate:/)).not.toBeInTheDocument();
    await selectAll(user);
    expect(screen.getByText(/Possible duplicate:/)).toBeVisible();

    await selectAward(user, avua.name);
    expectSelectedRecipients(1);
    enter("Narrative", "");
    await user.type(
      screen.getByRole("textbox", { name: "Narrative" }),
      "The the unit advanced.",
    );
    expect(screen.getByText(/Possible duplicate:/)).toBeVisible();
    expect(
      within(
        screen.getByRole("region", { name: "Status", exact: true }),
      ).getByRole("status"),
    ).toHaveTextContent("Complete the worksheet");
    expect(
      screen.queryByLabelText("Citation Narrative"),
    ).not.toBeInTheDocument();
  });

  test.each([avua, jmua])(
    "$abbreviation omits recipient-identity warnings while retaining prose warnings and precise highlights",
    async (award) => {
      const user = await open(award);
      await selectAll(user);
      await fillContext(user, award, {
        narrative:
          "supporting the the SPC team!! The group completed the task. The group completed the task.",
      });
      await submitRecommendation(user);
      for (const warning of [
        /Possible duplicate:/,
        /Possible punctuation error:/,
        /Possible rank usage:/,
        /Possible duplicate sentence:/,
      ])
        expect(screen.getByText(warning)).toBeVisible();
      expect(screen.queryByText(identityWarning)).not.toBeInTheDocument();
      const highlighted = [
        ...screen.getByLabelText("Citation Narrative").querySelectorAll("mark"),
      ].map((node) => node.textContent);
      expect(highlighted).toEqual(
        expect.arrayContaining([
          "the the",
          "SPC",
          "!!",
          "The group completed the task.",
        ]),
      );
    },
  );
});
