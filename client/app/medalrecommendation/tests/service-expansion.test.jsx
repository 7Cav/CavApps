import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ServiceMonthYearField from "../ServiceMonthYearField.jsx";
import { getMedalFamily, MEDAL_FAMILY_IDS } from "../lib/medal-families.js";
import { SERVICE_MEDALS } from "../lib/service-medal-definitions.js";
import {
  fillOperationWorksheet,
  getCitationText,
  makeRecipient,
  renderClient,
  renderServiceClient,
  selectAward,
  selectComboboxOption,
  selectRecipient,
  submitRecommendation,
} from "./test-helpers.js";
import {
  SERVICE_CATALOG_CASES,
  SERVICE_CITATION_CASES,
  SERVICE_CONTINUATION,
} from "./service-medal-cases.js";

const recipient = makeRecipient({
  rank: { rankFull: "Corporal", rankShort: "CPL" },
});
const secondRecipient = makeRecipient({
  user: { userId: "2002", username: "Jones.A" },
  rank: { rankFull: "Sergeant", rankShort: "SGT" },
  realName: "Alex Jones",
});
const fixedOpening = "Corporal John Smith distinguished themselves by";
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

async function openWorksheet(name) {
  const user = userEvent.setup();
  renderServiceClient({ roster: [recipient, secondRecipient] });
  await selectAward(user, name);
  return { user };
}

async function enter(user, label, value) {
  if (label === "Service Start" || label === "Service End") {
    const [year, month] = value.split("-");
    await selectComboboxOption(
      user,
      `${label} Month`,
      monthNames[Number(month) - 1],
    );
    await enter(user, `${label} Year`, year);
    return;
  }
  const control = screen.getByLabelText(label, { exact: true });
  await user.clear(control);
  await user.click(control);
  await user.paste(value);
}

async function fillCase(user, { choices = {}, inputs }) {
  for (const [label, value] of Object.entries(choices)) {
    await selectComboboxOption(user, label, value);
  }
  for (const [label, value] of Object.entries(inputs)) {
    await enter(user, label, value);
  }
}

function preview() {
  return screen.queryByRole("region", { name: "Recommendation Preview" });
}

function expectMappedPreview(medalName) {
  expect(
    within(preview()).getByText("Corporal John Smith", { exact: true }),
  ).toBeVisible();
  expect(
    within(preview()).getByRole("heading", { name: medalName, exact: true }),
  ).toBeVisible();
  const { ribbonUrl } = SERVICE_CATALOG_CASES.find(
    ({ name }) => name === medalName,
  );
  const ribbon = within(preview()).getByRole("img", {
    name: `${medalName} ribbon`,
  });
  expect(ribbon).toBeVisible();
  expect(ribbon).toHaveAttribute("src", ribbonUrl);
}

describe("Expanded Service Medal family", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 17, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("offers exactly the thirteen mapped Service Medals", async () => {
    const user = userEvent.setup();
    renderServiceClient();
    await user.click(screen.getByRole("combobox", { name: "Award" }));
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(SERVICE_CATALOG_CASES.map(({ name }) => name));
    expect(SERVICE_MEDALS.map(({ id, name }) => ({ id, name }))).toEqual(
      SERVICE_CATALOG_CASES.map(({ id, name }) => ({ id, name })),
    );
  });

  test.each(SERVICE_CATALOG_CASES)(
    "$abbreviation shows mapped guidance, eligibility, and initial fields",
    async ({ name, fields, criteria, guidance, eligibility }) => {
      await openWorksheet(name);
      expect(screen.getByText(criteria, { exact: true })).toBeVisible();
      expect(screen.getByText(guidance, { exact: true })).toBeVisible();
      const controlLabels = ["Award", "Recipient", ...fields].flatMap(
        (label) =>
          label === "Service Start" || label === "Service End"
            ? [`${label} Month`, `${label} Year`]
            : [label],
      );
      expect([
        ...screen.getAllByRole("combobox"),
        ...screen.getAllByRole("textbox"),
      ]).toHaveLength(controlLabels.length);
      for (const label of controlLabels)
        expect(screen.getByLabelText(label, { exact: true })).toBeVisible();
      const heading = screen.queryByRole("heading", {
        name: "Eligibility Guidance",
      });
      if (eligibility.length) {
        expect(heading).toBeVisible();
        const list = heading.parentElement.querySelector("ul");
        expect(
          within(list)
            .getAllByRole("listitem")
            .map((item) => item.textContent),
        ).toEqual(eligibility);
        expect(list.textContent).not.toMatch(
          /of the quarter|of the year|EOTQ|EOTY/i,
        );
      } else {
        expect(heading).not.toBeInTheDocument();
      }
      expect(
        screen.queryByLabelText(/award basis|quarter|year selector/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("status", { name: "Narrative Warnings" }),
      ).not.toBeInTheDocument();
    },
  );

  test.each(SERVICE_CITATION_CASES)(
    "$name / $path generates the exact mapped citation with one recipient opening",
    async (testCase) => {
      const { user } = await openWorksheet(testCase.name);
      await selectRecipient(user);
      await fillCase(user, testCase);
      // Complete every contextual requirement before testing Narrative in isolation.
      await submitRecommendation(user);
      expect(
        screen.getByLabelText("Narrative", { exact: true }),
      ).toHaveAttribute("aria-invalid", "true");
      expect(preview()).not.toBeInTheDocument();
      expect(
        screen.queryByRole("status", { name: "Narrative Warnings" }),
      ).not.toBeInTheDocument();
      await enter(user, "Narrative", SERVICE_CONTINUATION);
      await submitRecommendation(user);
      expect(preview()).toBeVisible();
      const opening = `Corporal John Smith ${testCase.narrativeVerb ?? "distinguished"} themselves by`;
      expect(getCitationText()).toBe(
        `${testCase.opening} ${opening} ${SERVICE_CONTINUATION} ${testCase.closing}`,
      );
      expect(getCitationText().split(opening)).toHaveLength(2);
      expectMappedPreview(testCase.name);
    },
  );

  test.each(
    ["HSM", "MSM", "DSSM"].map((abbreviation) =>
      SERVICE_CATALOG_CASES.find(
        (medal) => medal.abbreviation === abbreviation,
      ),
    ),
  )(
    "$abbreviation counts completed sentences live at the $minimum-sentence threshold",
    async ({ name, minimum }) => {
      const { user } = await openWorksheet(name);
      await enter(user, "Narrative", "  \n ");
      await selectRecipient(user);
      expect(screen.getByText(fixedOpening, { exact: true })).toBeVisible();
      expect(
        screen.queryByRole("status", { name: "Narrative Warnings" }),
      ).not.toBeInTheDocument();
      const sentences = [
        "supporting the unit.",
        "Their work improved readiness.",
        "Their efforts strengthened the Regiment.",
        "Their service benefited every trooper.",
      ];
      await enter(user, "Narrative", sentences.slice(0, minimum - 1).join(" "));
      const warning = screen.getByRole("status", {
        name: "Narrative Warnings",
      });
      expect(warning).toHaveTextContent(
        new RegExp(
          `minimum of ${["", "", "2", "three", "four"][minimum]} sentences`,
        ),
      );
      expect(warning).not.toHaveTextContent(
        /opening.*mismatch|must begin|opening does not match/i,
      );
      await enter(user, "Narrative", sentences.slice(0, minimum).join(" "));
      await waitFor(() =>
        expect(
          screen.queryByRole("status", { name: "Narrative Warnings" }),
        ).not.toBeInTheDocument(),
      );
      expect(preview()).not.toBeInTheDocument();
    },
  );

  test.each([
    "Joint Service Commendation Medal",
    "Meritorious Service Medal",
    "Soldier’s Medal",
  ])(
    "%s preserves continuation through opening and recipient changes",
    async (name) => {
      const { user } = await openWorksheet(name);
      const openingChoice = screen.getByRole("combobox", {
        name: "Narrative Opening",
      });
      expect(openingChoice).toHaveTextContent("Distinguished");
      const continuation =
        "  supporting the unit.\nTheir work improved readiness.  ";
      await enter(user, "Narrative", continuation);
      await selectComboboxOption(user, "Narrative Opening", "Contributed");
      await selectRecipient(user);
      const resolved = screen.getByText(
        "Corporal John Smith contributed themselves by",
        { exact: true },
      );
      expect(resolved).toBeVisible();
      expect(resolved).not.toHaveAttribute("contenteditable", "true");
      expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
        continuation,
      );
      await selectComboboxOption(user, "Narrative Opening", "Distinguished");
      expect(screen.getByText(fixedOpening, { exact: true })).toBeVisible();
      await user.clear(screen.getByLabelText("Recipient", { exact: true }));
      await selectRecipient(user, "Jon", "Jones.A");
      expect(
        screen.getByText("Sergeant Alex Jones distinguished themselves by", {
          exact: true,
        }),
      ).toBeVisible();
      expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
        continuation,
      );
    },
  );

  test.each(["Meritorious Service Medal", "Soldier’s Medal"])(
    "%s requires a deliberate Service / Contributions choice and keeps it advisory to Narrative",
    async (name) => {
      const { user } = await openWorksheet(name);
      await selectRecipient(user);
      await enter(user, "Unit", "S2 Intelligence");
      await enter(user, "Narrative", "supporting the unit.");
      const choice = screen.getByRole("combobox", {
        name: "Service / Contributions",
      });
      expect(choice).toHaveTextContent("Select service or contributions");
      await submitRecommendation(user);
      expect(choice).toHaveAttribute("aria-invalid", "true");
      expect(choice).toHaveAccessibleDescription("Required");
      expect(preview()).not.toBeInTheDocument();
      await selectComboboxOption(user, "Service / Contributions", "Service");
      await submitRecommendation(user);
      expect(preview()).toBeVisible();
      expect(
        screen.getByRole("status", { name: "Narrative Warnings" }),
      ).toBeVisible();
      await selectComboboxOption(
        user,
        "Service / Contributions",
        "Contributions",
      );
      expect(preview()).not.toBeInTheDocument();
      expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
        "supporting the unit.",
      );
      await submitRecommendation(user);
      expect(getCitationText()).toContain("meritorious contributions");
      expect(getCitationText()).not.toContain("meritorious service");
      await selectComboboxOption(user, "Narrative Opening", "Contributed");
      expect(preview()).not.toBeInTheDocument();
      await submitRecommendation(user);
      expect(getCitationText()).toContain(
        "Corporal John Smith contributed themselves by supporting the unit.",
      );
    },
  );

  test("JSCM toggles Action Phrase without losing user text or leaking the hidden phrase", async () => {
    const { user } = await openWorksheet("Joint Service Commendation Medal");
    await selectRecipient(user);
    await enter(user, "Benefitted Company", "B/2-7");
    await enter(user, "Assigned Company", "B/2-7"); // Assignment eligibility remains guidance.
    await enter(user, "Narrative", SERVICE_CONTINUATION);
    expect(
      screen.getByRole("combobox", { name: "Recognition Wording" }),
    ).toHaveTextContent("Contributions");
    expect(
      screen.queryByLabelText("Actions / Contributions", { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Action Phrase", { exact: true }),
    ).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expect(getCitationText()).toContain(
      "For contributions to B/2-7 as a member of B/2-7.",
    );
    expect(getCitationText()).toContain(
      "dedication to duty and contributions are great credit",
    );
    await user.click(
      screen.getByRole("combobox", { name: "Recognition Wording" }),
    );
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Contributions", "Custom Action Phrase"]);
    await user.click(
      screen.getByRole("option", { name: "Custom Action Phrase" }),
    );
    expect(preview()).not.toBeInTheDocument();
    const phrase = screen.getByLabelText("Action Phrase", { exact: true });
    expect(phrase).toHaveAttribute("placeholder", "action phrase");
    const helperText =
      "Enter a short citation phrase, such as “outstanding support” or “inspiring dedication”. It will appear after “For” in the opening and after “dedication to duty and” in the closing. Do not enter a full sentence.";
    expect(screen.getByText(helperText, { exact: true })).toBeVisible();
    expect(phrase).toHaveAccessibleDescription(helperText);
    await submitRecommendation(user);
    expect(phrase).toHaveAttribute("aria-invalid", "true");
    expect(preview()).not.toBeInTheDocument();
    await enter(user, "Action Phrase", "extraordinary SUPPORT");
    await submitRecommendation(user);
    expect(getCitationText().match(/extraordinary SUPPORT/g)).toHaveLength(2);
    expect(getCitationText()).toContain(
      "For extraordinary SUPPORT to B/2-7 as a member of B/2-7.",
    );
    expect(getCitationText()).toContain(
      "dedication to duty and extraordinary SUPPORT are great credit",
    );
    await enter(user, "Action Phrase", "outstanding support and dedication");
    expect(preview()).not.toBeInTheDocument();
    await selectComboboxOption(user, "Recognition Wording", "Contributions");
    expect(screen.queryByLabelText("Action Phrase")).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expect(getCitationText()).not.toMatch(
      /SUPPORT|outstanding support and dedication/,
    );
    expect(getCitationText()).toContain(
      "dedication to duty and contributions are great credit",
    );
    await selectComboboxOption(
      user,
      "Recognition Wording",
      "Custom Action Phrase",
    );
    expect(screen.getByLabelText("Action Phrase", { exact: true })).toHaveValue(
      "outstanding support and dedication",
    );
    expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
      SERVICE_CONTINUATION,
    );
  });

  test("DSSM retains both leadership contexts and excludes inactive values from validation and preview", async () => {
    const { user } = await openWorksheet("Defense Superior Service Medal");
    await selectRecipient(user);
    await enter(user, "Narrative", SERVICE_CONTINUATION);
    await enter(user, "Service Start", "2025-09");
    await enter(user, "Service End", "2026-09");
    expect(
      screen.queryByLabelText("Role", { exact: true }),
    ).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(
      screen.getByRole("combobox", { name: "Leadership Area" }),
    ).toHaveAttribute("aria-invalid", "true");
    await user.click(screen.getByRole("combobox", { name: "Leadership Area" }));
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Secondary Billet", "Operations Leadership"]);
    await user.click(
      screen.getByRole("option", { name: "Secondary Billet", exact: true }),
    );
    expect(screen.getByLabelText("Role", { exact: true })).toHaveAttribute(
      "placeholder",
      "1IC, 2IC, Lead, etc.",
    );
    expect(
      screen.getByLabelText("Secondary Billet", { exact: true }),
    ).toHaveAttribute("placeholder", "Military Police, S7 ARMA CAS, etc.");
    expect(
      screen.queryByLabelText("Operations Leadership", { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Operations AO", { exact: true }),
    ).not.toBeInTheDocument();
    await enter(user, "Role", "1IC");
    await enter(user, "Secondary Billet", "Military Police");
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expect(getCitationText()).toContain(
      "For exceptionally meritorious leadership of a secondary billet while serving as 1IC, Military Police during September 2025 to September 2026.",
    );
    expect(getCitationText()).toContain(
      "great credit to themselves, the Military Police, and the 7th Cavalry Gaming Regiment.",
    );
    expect(getCitationText()).not.toContain("1IC of Military Police");
    await selectComboboxOption(
      user,
      "Leadership Area",
      "Operations Leadership",
    );
    expect(preview()).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Role", { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Secondary Billet", { exact: true }),
    ).not.toBeInTheDocument();
    const leadership = screen.getByLabelText("Operations Leadership", {
      exact: true,
    });
    const ao = screen.getByLabelText("Operations AO", { exact: true });
    expect(leadership).toHaveValue("");
    expect(ao).toHaveValue("");
    expect(leadership).toHaveAttribute(
      "placeholder",
      "AO Lead, S3 HLL Operations",
    );
    expect(ao).toHaveAttribute("placeholder", "Hell Let Loose: Vietnam AO");
    await submitRecommendation(user);
    expect(leadership).toHaveAttribute("aria-invalid", "true");
    expect(ao).toHaveAttribute("aria-invalid", "true");
    expect(preview()).not.toBeInTheDocument();
    await enter(user, "Operations Leadership", "AO Lead, S3 HLL Operations");
    await enter(user, "Operations AO", "Hell Let Loose: Vietnam AO");
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "For exceptionally meritorious leadership of operations while serving as AO Lead, S3 HLL Operations during September 2025 to September 2026.",
    );
    expect(getCitationText()).not.toMatch(/1IC|Military Police/);
    expect(getCitationText()).not.toContain("operational billet");
    await selectComboboxOption(user, "Leadership Area", "Secondary Billet");
    expect(preview()).not.toBeInTheDocument();
    expect(screen.getByLabelText("Role", { exact: true })).toHaveValue("1IC");
    expect(
      screen.getByLabelText("Secondary Billet", { exact: true }),
    ).toHaveValue("Military Police");
    expect(
      screen.queryByLabelText("Operations Leadership", { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Operations AO", { exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
      SERVICE_CONTINUATION,
    );
    expect(
      screen.getByRole("combobox", { name: "Service Start Month" }),
    ).toHaveTextContent("September");
    expect(
      screen.getByRole("textbox", { name: "Service Start Year" }),
    ).toHaveValue("2025");
    expect(
      screen.getByRole("combobox", { name: "Service End Month" }),
    ).toHaveTextContent("September");
    expect(
      screen.getByRole("textbox", { name: "Service End Year" }),
    ).toHaveValue("2026");
    await submitRecommendation(user);
    expect(getCitationText()).toContain("1IC, Military Police");
    expect(preview()).not.toHaveTextContent(/S3 HLL Operations|Hell Let Loose/);

    await selectComboboxOption(
      user,
      "Leadership Area",
      "Operations Leadership",
    );
    expect(preview()).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Operations Leadership", { exact: true }),
    ).toHaveValue("AO Lead, S3 HLL Operations");
    expect(screen.getByLabelText("Operations AO", { exact: true })).toHaveValue(
      "Hell Let Loose: Vietnam AO",
    );
    expect(
      screen.queryByLabelText("Role", { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Secondary Billet", { exact: true }),
    ).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expect(getCitationText()).toBe(
      `For exceptionally meritorious leadership of operations while serving as AO Lead, S3 HLL Operations during September 2025 to September 2026. ${fixedOpening} ${SERVICE_CONTINUATION} Corporal John Smith's exceptionally meritorious leadership is in great credit to themselves, the Hell Let Loose: Vietnam AO, and the 7th Cavalry Gaming Regiment.`,
    );
    const closing = getCitationText().split(
      "Corporal John Smith's exceptionally meritorious leadership",
    )[1];
    expect(closing.match(/\bAO\b/g)).toHaveLength(1);
    expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
      SERVICE_CONTINUATION,
    );
    expect(preview()).not.toHaveTextContent(/1IC|Military Police/);
  });

  test("Month/Year control emits canonical months, preserves partial edits, and follows external values", async () => {
    function ControlledMonth() {
      const [value, setValue] = useState("");
      return (
        <>
          <ServiceMonthYearField
            id="service-start"
            label="Service Start"
            value={value}
            onChange={setValue}
          />
          <output aria-label="Canonical service month">{value}</output>
          <button onClick={() => setValue("2024-01")}>Load saved month</button>
        </>
      );
    }
    const user = userEvent.setup();
    render(<ControlledMonth />);
    const year = screen.getByRole("textbox", { name: "Service Start Year" });
    const month = screen.getByRole("combobox", { name: "Service Start Month" });
    const canonical = screen.getByLabelText("Canonical service month");
    expect(month).toHaveTextContent("Month");
    expect(year).toHaveValue("");
    await user.type(year, "20x2");
    expect(year).toHaveValue("202");
    expect(canonical).toBeEmptyDOMElement();
    await selectComboboxOption(user, "Service Start Month", "January");
    await selectComboboxOption(user, "Service Start Month", "December");
    expect(year).toHaveValue("202");
    expect(canonical).toBeEmptyDOMElement();
    await user.type(year, "5");
    expect(canonical).toHaveTextContent(/^2025-12$/);
    await user.type(year, "9");
    expect(year).toHaveValue("2025");
    for (const [index, name] of monthNames.entries()) {
      await selectComboboxOption(user, "Service Start Month", name);
      expect(canonical.textContent).toBe(
        `2025-${String(index + 1).padStart(2, "0")}`,
      );
    }
    await user.clear(year);
    expect(month).toHaveTextContent("December");
    expect(canonical).toBeEmptyDOMElement();
    await user.type(year, "2");
    await user.click(screen.getByRole("button", { name: "Load saved month" }));
    expect(year).toHaveValue("2024");
    expect(month).toHaveTextContent("January");
    await user.clear(year);
    await user.type(year, "2023");
    expect(canonical).toHaveTextContent(/^2023-01$/);
  });

  test("Month/Year selections clear errors live and invalidate stale previews", async () => {
    const { user } = await openWorksheet("Legion of Merit");
    await selectRecipient(user);
    await enter(user, "Role", "a clerk");
    await enter(user, "Secondary Billet", "S1 MILPACS");
    await enter(user, "Narrative", SERVICE_CONTINUATION);
    const startMonth = screen.getByRole("combobox", {
      name: "Service Start Month",
    });
    const startYear = screen.getByRole("textbox", {
      name: "Service Start Year",
    });
    const endMonth = screen.getByRole("combobox", {
      name: "Service End Month",
    });
    const endYear = screen.getByRole("textbox", { name: "Service End Year" });
    await submitRecommendation(user);
    for (const control of [startMonth, startYear, endMonth, endYear]) {
      expect(control).toHaveAttribute("aria-invalid", "true");
      expect(control).toHaveAccessibleDescription("Required");
    }
    expect(preview()).not.toBeInTheDocument();

    await user.click(startMonth);
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(monthNames);
    await user.keyboard("{Escape}");
    expect(startMonth).toHaveFocus();
    await user.keyboard("{Enter}September{Enter}");
    expect(startMonth).toHaveTextContent("September");
    expect(startYear).toHaveAccessibleDescription("Required");
    await user.tab();
    expect(startYear).toHaveFocus();
    await user.type(startYear, "202");
    expect(startYear).toHaveValue("202");
    expect(startYear).toHaveAccessibleDescription("Required");
    await user.type(startYear, "x");
    expect(startYear).toHaveValue("202");
    await user.type(startYear, "5");
    expect(startYear).toHaveValue("2025");
    expect(startYear).not.toHaveAttribute("aria-invalid", "true");
    expect(startMonth).not.toHaveAccessibleDescription();
    expect(endYear).toHaveAccessibleDescription("Required");
    await selectComboboxOption(user, "Service End Month", "September");
    await user.type(endYear, "2026");
    for (const control of [startMonth, startYear, endMonth, endYear]) {
      expect(control).not.toHaveAttribute("aria-invalid", "true");
      expect(control).not.toHaveAccessibleDescription();
    }
    expect(
      screen.queryByText("Required", { exact: true }),
    ).not.toBeInTheDocument();
    expect(preview()).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expect(getCitationText()).toContain(
      "during September 2025 to September 2026.",
    );
    expect(getCitationText()).not.toMatch(
      /2025-09|2026-09|\b\d{1,2} September/,
    );

    await enter(user, "Service End Year", "2025");
    expect(preview()).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expect(getCitationText()).toContain(
      "during September 2025 to September 2025.",
    );
    await enter(user, "Service Start Year", "2026");
    expect(preview()).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(endYear).toHaveAccessibleDescription(
      "Service End must be the same month as or later than Service Start",
    );
    expect(preview()).not.toBeInTheDocument();
    await enter(user, "Service End Year", "2026");
    expect(endYear).not.toHaveAttribute("aria-invalid", "true");
    expect(endYear).not.toHaveAccessibleDescription();
    expect(
      screen.queryByText(
        "Service End must be the same month as or later than Service Start",
      ),
    ).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expect(getCitationText()).toContain(
      "during September 2026 to September 2026.",
    );

    await selectComboboxOption(user, "Service Start Month", "August");
    expect(preview()).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "during August 2026 to September 2026.",
    );
    await selectComboboxOption(user, "Service End Month", "August");
    expect(preview()).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(getCitationText()).toContain("during August 2026 to August 2026.");
    expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
      SERVICE_CONTINUATION,
    );
    expect(screen.getByLabelText("Role", { exact: true })).toHaveValue(
      "a clerk",
    );
    expect(
      screen.getByLabelText("Secondary Billet", { exact: true }),
    ).toHaveValue("S1 MILPACS");
  });

  test("future Service months block generation and clear their errors immediately when corrected", async () => {
    const { user } = await openWorksheet("Legion of Merit");
    await selectRecipient(user);
    await enter(user, "Role", "a clerk");
    await enter(user, "Secondary Billet", "S1 MILPACS");
    await enter(user, "Narrative", SERVICE_CONTINUATION);
    await enter(user, "Service Start", "2025-09");
    await enter(user, "Service End", "2026-10");
    const start = screen.getByRole("combobox", { name: "Service Start Month" });
    const end = screen.getByRole("combobox", { name: "Service End Month" });
    const chronology =
      "Service End must be the same month as or later than Service Start";
    await submitRecommendation(user);
    expect(preview()).not.toBeInTheDocument();
    expect(end).toHaveTextContent("October");
    expect(
      screen.getByRole("textbox", { name: "Service End Year" }),
    ).toHaveValue("2026");
    expect(end).toHaveAttribute("aria-invalid", "true");
    expect(end).toHaveAccessibleDescription(
      "Service End must be the current month or earlier",
    );
    expect(start).not.toHaveAttribute("aria-invalid", "true");

    await selectComboboxOption(user, "Service End Month", "September");
    expect(end).not.toHaveAttribute("aria-invalid", "true");
    expect(end).not.toHaveAccessibleDescription();
    expect(
      screen.queryByText("Service End must be the current month or earlier"),
    ).not.toBeInTheDocument();
    expect(preview()).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expect(getCitationText()).toContain(
      "during September 2025 to September 2026.",
    );

    await enter(user, "Service Start", "2026-10");
    expect(preview()).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(preview()).not.toBeInTheDocument();
    expect(start).toHaveAccessibleDescription(
      "Service Start must be the current month or earlier",
    );
    expect(end).not.toHaveAttribute("aria-invalid", "true");
    expect(end).not.toHaveAccessibleDescription();
    expect(screen.queryByText(chronology)).not.toBeInTheDocument();

    await selectComboboxOption(user, "Service Start Month", "November");
    await selectComboboxOption(user, "Service End Month", "October");
    await submitRecommendation(user);
    expect(preview()).not.toBeInTheDocument();
    expect(start).toHaveAccessibleDescription(
      "Service Start must be the current month or earlier",
    );
    expect(end).toHaveAccessibleDescription(
      "Service End must be the current month or earlier",
    );
    expect(screen.queryByText(chronology)).not.toBeInTheDocument();

    await selectComboboxOption(user, "Service Start Month", "September");
    expect(start).not.toHaveAttribute("aria-invalid", "true");
    expect(start).not.toHaveAccessibleDescription();
    expect(end).toHaveAccessibleDescription(
      "Service End must be the current month or earlier",
    );
    await selectComboboxOption(user, "Service End Month", "September");
    expect(end).not.toHaveAttribute("aria-invalid", "true");
    expect(end).not.toHaveAccessibleDescription();
    await submitRecommendation(user);
    expect(getCitationText()).toContain(
      "during September 2026 to September 2026.",
    );
  });

  test("changing Service awards preserves continuation and excludes fields from the previous worksheet", async () => {
    const { user } = await openWorksheet("Army Achievement Medal");
    await selectRecipient(user);
    await enter(user, "Affected Area of the Cav", "S7 HLL SOI");
    await enter(user, "Narrative", SERVICE_CONTINUATION);
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
    expectMappedPreview("Army Achievement Medal");
    await selectAward(user, "Humanitarian Service Medal");
    expect(preview()).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Affected Area of the Cav", { exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
      SERVICE_CONTINUATION,
    );
    await submitRecommendation(user);
    expect(getCitationText()).toBe(
      `For providing aid to a fellow trooper. ${fixedOpening} ${SERVICE_CONTINUATION} Corporal John Smith's dedication to duty and commitment is in great credit to themselves and the 7th Cavalry Gaming Regiment.`,
    );
    await selectAward(user, "Meritorious Service Medal");
    expect(
      screen.getByRole("combobox", { name: "Service / Contributions" }),
    ).toHaveTextContent("Select service or contributions");
    expect(
      screen.getByRole("combobox", { name: "Narrative Opening" }),
    ).toHaveTextContent("Distinguished");
    expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
      SERVICE_CONTINUATION,
    );
  });

  test("shared ARCOM identity resolves independent Operation and Service workflows", async () => {
    const operationMedal = getMedalFamily(
      MEDAL_FAMILY_IDS.OPERATION,
    ).getMedalById("army-commendation-medal");
    const serviceMedal = getMedalFamily(MEDAL_FAMILY_IDS.SERVICE).getMedalById(
      "army-commendation-medal",
    );
    expect(serviceMedal.id).toBe(operationMedal.id);
    expect(serviceMedal.name).toBe(operationMedal.name);
    expect(serviceMedal.ribbonUrl).toBe(operationMedal.ribbonUrl);
    const user = userEvent.setup();
    const operationView = renderClient({ roster: [recipient] });
    await selectAward(user, "Army Commendation Medal");
    expect(
      screen.getByText(
        "Awarded for skillful or heroic actions over an entire operation where there was no one specific instance of heroism or skill.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByLabelText("Unit", { exact: true }),
    ).not.toBeInTheDocument();
    await selectRecipient(user);
    expect(
      screen.queryByText(fixedOpening, { exact: true }),
    ).not.toBeInTheDocument();
    const rawNarrative =
      "Corporal John Smith secured the objective. Their actions protected the unit. Their work ensured success.";
    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "a rifleman",
      operationTitle: "Operation Overlord",
      location: "Omaha Beach",
      operationDate: "2025-01-11",
      narrative: rawNarrative,
    });
    const operationNarrative = screen.getByLabelText("Narrative", {
      exact: true,
    });
    for (const descriptionId of (
      operationNarrative.getAttribute("aria-describedby") ?? ""
    )
      .split(" ")
      .filter(Boolean)) {
      expect(document.getElementById(descriptionId)).toBeInTheDocument();
    }
    await submitRecommendation(user);
    expect(getCitationText()).toBe(
      `For skillful actions over an entire operation while serving as a rifleman in the 7th Cavalry Regiment during combat in Operation Overlord near Omaha Beach on 11 January 2025. ${rawNarrative} Corporal John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.`,
    );
    operationView.unmount();
    renderServiceClient({ roster: [recipient] });
    await selectAward(user, "Army Commendation Medal");
    expect(
      screen.getByText(
        "Awarded for distinguished contributions to any area of the Regiment, or being selected Enlisted or NCO of the Quarter.",
      ),
    ).toBeVisible();
    for (const label of [
      "Action Character",
      "Combat Element",
      "Operation Title",
      "Location",
      "Operation Date",
    ])
      expect(
        screen.queryByLabelText(label, { exact: true }),
      ).not.toBeInTheDocument();
    await selectRecipient(user);
    expect(screen.getByText(fixedOpening, { exact: true })).toBeVisible();
    await enter(user, "Narrative", SERVICE_CONTINUATION);
    await submitRecommendation(user);
    expect(screen.getByLabelText("Unit", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await enter(user, "Unit", "S2 Intelligence");
    await submitRecommendation(user);
    expect(getCitationText()).toBe(
      `For distinguished contributions to S2 Intelligence. ${fixedOpening} ${SERVICE_CONTINUATION} Corporal John Smith’s dedication to duty and commitment to the Regiment is in great credit to themselves, S2 Intelligence and the 7th Cavalry Gaming Regiment.`,
    );
  });
});
