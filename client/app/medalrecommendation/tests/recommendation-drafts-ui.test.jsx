import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MAX_DRAFT_BYTES } from "../lib/recommendation-drafts";
import {
  enterWorksheetField,
  fillOperationWorksheet,
  makeRecipient,
  makeRecipientRoster,
  openBulkRecipientDialog,
  renderClient,
  selectAward,
  selectComboboxOption,
  selectRecipient,
  submitRecommendation,
} from "./test-helpers";

const current = makeRecipient({
  profileId: "4637",
  user: { userId: "9397", username: "Kenton.W" },
  rank: { rankId: "17", rankFull: "Staff Sergeant", rankShort: "SSG" },
  realName: "Wade Kenton",
});
const operationValues = {
  actionCharacter: "skillful",
  combatElement: "a rifleman",
  operationTitle: "Overlord",
  location: "Normandy",
  operationDate: "2025-01-01",
  narrative:
    "Staff Sergeant Wade Kenton held the line. The squad advanced. The objective was secured.",
};
const serviceValues = {
  affectedArea: "S7 Training",
  narrative:
    "improving instruction. The team delivered lessons. Training standards improved.",
};

function selected(member = current) {
  return {
    kind: "selected",
    query: member.user.username,
    identity: { userId: member.user.userId },
    snapshot: {
      username: member.user.username,
      rankFull: member.rank.rankFull,
      realName: member.realName,
    },
  };
}
function draft(family = "operation", overrides = {}) {
  return {
    format: "cavapps.medal-recommendation.draft",
    version: 1,
    medalFamily: family,
    medalId:
      family === "operation"
        ? "army-commendation-medal"
        : "army-achievement-medal",
    recipients: [selected()],
    values:
      family === "operation" ? { ...operationValues } : { ...serviceValues },
    ...overrides,
  };
}
const preview = () =>
  screen.queryByRole("region", { name: "Recommendation Preview" });
const file = (value) =>
  new File(
    [typeof value === "string" ? value : JSON.stringify(value)],
    "draft.json",
    { type: "application/json" },
  );
async function upload(user, value) {
  if (!screen.queryByRole("dialog"))
    await user.click(screen.getByRole("button", { name: "Load", exact: true }));
  await user.upload(
    screen.getByLabelText("Draft file"),
    value instanceof File ? value : file(value),
  );
}
async function confirm(user) {
  await user.click(
    await screen.findByRole("button", { name: "Replace Worksheet" }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}
async function loadEmpty(user, value) {
  await upload(user, value);
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}
async function generateCurrent(user, family) {
  await selectAward(
    user,
    family === "operation"
      ? "Army Commendation Medal"
      : "Army Achievement Medal",
  );
  await selectRecipient(user, "Kenton", "Kenton.W");
  if (family === "operation")
    await fillOperationWorksheet(user, {
      ...operationValues,
      actionCharacter: "Skillful",
    });
  else {
    enterWorksheetField("Affected Area of the Cav", serviceValues.affectedArea);
    enterWorksheetField("Narrative", serviceValues.narrative);
  }
  await submitRecommendation(user);
  expect(preview()).toBeVisible();
}
function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

let downloaded;
let filename;
beforeEach(() => {
  downloaded = null;
  filename = null;
  const OriginalURL = globalThis.URL;
  vi.stubGlobal(
    "URL",
    class extends OriginalURL {
      static createObjectURL(blob) {
        downloaded = blob;
        return "blob:draft-download";
      }
      static revokeObjectURL() {}
    },
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
    function () {
      filename = this.download;
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Worksheet draft files", () => {
  test("a long unfinished narrative loads intact and retains the ordinary sentence warning", async () => {
    const user = userEvent.setup();
    renderClient({ roster: [current] });
    const narrative = "x".repeat(200_000);
    await loadEmpty(
      user,
      draft("operation", { values: { ...operationValues, narrative } }),
    );
    expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
      narrative,
    );
    expect(
      screen.getByRole("status", { name: "Narrative Warnings" }),
    ).toHaveTextContent(/Sentence count/);
    expect(preview()).not.toBeInTheDocument();
  });

  test("invalid UTF-8 is rejected without replacing the worksheet", async () => {
    const user = userEvent.setup();
    renderClient({ roster: [current] });
    await selectAward(user);
    enterWorksheetField("Operation Title", "Keep this work");
    await upload(
      user,
      new File([new Uint8Array([0xc3, 0x28])], "bad.json", {
        type: "application/json",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/UTF-8/);
    await user.click(
      screen.getByRole("button", { name: "Cancel", exact: true }),
    );
    expect(
      screen.getByLabelText("Operation Title", { exact: true }),
    ).toHaveValue("Keep this work");
  });

  test("loading a Unit award restores its own recipient minimum and group worksheet", async () => {
    const user = userEvent.setup();
    const roster = [current, ...makeRecipientRoster(3)];
    renderClient({ roster });
    await selectAward(user);
    const values = {
      combatUnit: "Alpha Squad",
      operationTitle: "Overlord",
      location: "Normandy",
      operationDate: "2025-01-01",
      narrative:
        "The squad advanced. The objective was secured. The squad returned.",
    };
    await upload(
      user,
      draft("operation", {
        medalId: "army-valorous-unit-award",
        recipients: roster.slice(0, 3).map(selected),
        values,
      }),
    );
    await confirm(user);
    expect(
      screen.queryByLabelText("Combat Element", { exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Combat Unit", { exact: true })).toHaveValue(
      "Alpha Squad",
    );
    await submitRecommendation(user);
    expect(preview()).not.toBeInTheDocument();
    const dialog = await openBulkRecipientDialog(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Select All Shown" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm Recipients" }),
    );
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
  });

  test.each(["operation", "service"])(
    "%s downloads incomplete work, then restores the actual downloaded file",
    async (family) => {
      const user = userEvent.setup();
      renderClient({ medalFamily: family, roster: [current] });
      expect(
        screen.getByRole("heading", { name: "Recommendation Worksheet" }),
      ).toBeVisible();
      const load = screen.getByRole("button", { name: "Load", exact: true });
      const download = screen.getByRole("button", {
        name: "Download",
        exact: true,
      });
      expect(load).toBeVisible();
      expect(load).toHaveAccessibleName("Load");
      expect(load).toBeEnabled();
      expect(download).toBeVisible();
      expect(download).toHaveAccessibleName("Download");
      expect(download).toBeDisabled();
      await selectAward(
        user,
        family === "operation"
          ? "Army Commendation Medal"
          : "Army Achievement Medal",
      );
      expect(download).toBeEnabled();
      await user.type(
        screen.getByRole("textbox", { name: "Recipient", exact: true }),
        "  unfinished  ",
      );
      enterWorksheetField("Narrative", "  draft with é and 李\nunfinished  ");
      await user.click(screen.getByRole("button", { name: "Download" }));
      expect(filename).toBe(
        family === "operation" ? "Draft - ARCOM.json" : "Draft - AAM.json",
      );
      const text = await readBlob(downloaded);
      const payload = JSON.parse(text);
      expect(payload.values.narrative).toBe(
        "  draft with é and 李\nunfinished  ",
      );
      expect(payload.recipients).toEqual([
        { kind: "search", query: "  unfinished  " },
      ]);
      expect(Object.keys(payload).sort()).toEqual([
        "format",
        "medalFamily",
        "medalId",
        "recipients",
        "values",
        "version",
      ]);
      cleanup();
      renderClient({ medalFamily: family, roster: [current] });
      await loadEmpty(user, text);
      expect(
        screen.getByRole("textbox", { name: "Recipient", exact: true }),
      ).toHaveValue("  unfinished  ");
      expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
        "  draft with é and 李\nunfinished  ",
      );
      await submitRecommendation(user);
      expect(preview()).not.toBeInTheDocument();
    },
  );

  test.each(["operation", "service"])(
    "%s complete download excludes output; replacement requires regeneration",
    async (family) => {
      const user = userEvent.setup();
      renderClient({ medalFamily: family, roster: [current] });
      await generateCurrent(user, family);
      const priorCitation =
        screen.getByLabelText("Citation Narrative").textContent;
      await user.click(screen.getByRole("button", { name: "Download" }));
      const text = await readBlob(downloaded);
      const payload = JSON.parse(text);
      expect(Object.keys(payload).sort()).toEqual([
        "format",
        "medalFamily",
        "medalId",
        "recipients",
        "values",
        "version",
      ]);
      expect(payload.values).toMatchObject(
        family === "operation" ? operationValues : serviceValues,
      );
      expect(text).not.toContain("[CENTER]");
      expect(text).not.toContain(priorCitation);
      await upload(user, text);
      await confirm(user);
      expect(preview()).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Copy Title" }),
      ).not.toBeInTheDocument();
      await submitRecommendation(user);
      expect(screen.getByLabelText("Citation Narrative").textContent).toBe(
        priorCitation,
      );
    },
  );

  test.each(["operation", "service"])(
    "%s restores a recreated profile with current rank, username and Reserves status without changing authored prose",
    async (family) => {
      const user = userEvent.setup();
      const promoted = makeRecipient({
        ...current,
        profileId: "9999",
        user: { ...current.user, username: "Renamed.W" },
        rank: {
          rankId: "16",
          rankFull: "Sergeant First Class",
          rankShort: "SFC",
        },
        realName: "William Renamed",
        roster: "ROSTER_TYPE_RESERVE",
        primary: { positionId: "new", positionTitle: "New billet" },
      });
      renderClient({ medalFamily: family, roster: [promoted] });
      await loadEmpty(user, draft(family));
      expect(
        screen.getByRole("textbox", { name: "Recipient", exact: true }),
      ).toHaveValue("Renamed.W");
      expect(
        screen.getByText("Sergeant First Class William Renamed", {
          exact: true,
        }),
      ).toBeVisible();
      expect(screen.getByText(/not an active member/)).toBeVisible();
      expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
        family === "operation"
          ? operationValues.narrative
          : serviceValues.narrative,
      );
      if (family === "operation")
        expect(
          screen.getByRole("status", { name: "Narrative Warnings" }),
        ).toHaveTextContent(/Recipient mention/);
      await submitRecommendation(user);
      expect(preview()).toBeVisible();
      expect(
        within(preview()).getByRole("link", {
          name: "Sergeant First Class William Renamed",
        }),
      ).toHaveAttribute("href", "https://7cav.us/rosters/profile/9999/");
    },
  );

  test.each(["operation", "service"])(
    "%s missing identity remains visible until explicitly corrected",
    async (family) => {
      const user = userEvent.setup();
      renderClient({ medalFamily: family, roster: [current] });
      const missing = selected();
      missing.identity = { userId: "gone" };
      await loadEmpty(user, draft(family, { recipients: [missing] }));
      expect(
        screen.getByText("Recipient Not Found", { exact: true }),
      ).toBeVisible();
      expect(
        within(
          screen.getByRole("region", { name: "Recipients", exact: true }),
        ).getByText(/Staff Sergeant Wade Kenton/),
      ).toBeVisible();
      await submitRecommendation(user);
      expect(preview()).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Download" }));
      expect(JSON.parse(await readBlob(downloaded)).recipients).toEqual([
        missing,
      ]);
      const input = screen.getByRole("textbox", {
        name: "Recipient",
        exact: true,
      });
      await user.clear(input);
      await user.type(input, "Kent");
      expect(
        screen.getByText("Recipient Not Found", { exact: true }),
      ).toBeVisible();
      await user.click(
        screen.getByRole("button", { name: "Kenton.W", exact: true }),
      );
      expect(
        screen.queryByText("Recipient Not Found", { exact: true }),
      ).not.toBeInTheDocument();
      await submitRecommendation(user);
      expect(preview()).toBeVisible();
    },
  );

  test("compact mode retains working order, unresolved identities, and searches through Bulk confirmation and re-download", async () => {
    const user = userEvent.setup();
    const roster = makeRecipientRoster(10);
    renderClient({ roster });
    const missing = selected(current);
    const recipients = [
      selected(roster[3]),
      missing,
      { kind: "search", query: "unfinished" },
      ...[0, 1, 2, 4, 5, 6, 7].map((i) => selected(roster[i])),
    ];
    await loadEmpty(user, draft("operation", { recipients }));
    expect(
      screen.getByText("8 recipients selected", { exact: true }),
    ).toBeVisible();
    expect(
      screen.getByRole("group", { name: "Recipients needing attention" }),
    ).toHaveTextContent("2 recipient entries need attention");
    expect(
      screen.queryByRole("button", { name: /more$/ }),
    ).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole("list", { name: "Confirmed recipients" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(8);
    expect(screen.getByLabelText("Recipient 2", { exact: true })).toHaveValue(
      "Kenton.W",
    );
    expect(screen.getByLabelText("Recipient 3", { exact: true })).toHaveValue(
      "unfinished",
    );
    const dialog = await openBulkRecipientDialog(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Select All Shown" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm Recipients" }),
    );
    expect(
      screen.getByText("Recipient Not Found", { exact: true }),
    ).toBeVisible();
    expect(screen.getByLabelText("Recipient 3", { exact: true })).toHaveValue(
      "unfinished",
    );
    expect(
      screen.getByText("10 recipients selected", { exact: true }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "+ 2 more", exact: true }),
    );
    expect(
      within(
        screen.getByRole("list", { name: "Confirmed recipients" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(10);
    await user.click(screen.getByRole("button", { name: "Download" }));
    const saved = JSON.parse(await readBlob(downloaded));
    expect(saved.recipients.slice(0, recipients.length)).toEqual(recipients);
    expect(saved.recipients).toHaveLength(12);
    await submitRecommendation(user);
    expect(preview()).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Remove recipient 3", exact: true }),
    );
    const input = screen.getByLabelText("Recipient 2", { exact: true });
    await user.clear(input);
    // All ten available members are already selected; explicit removal is
    // still possible and never silently substitutes a same-named person.
    await user.click(
      screen.getByRole("button", { name: "Remove recipient 2", exact: true }),
    );
    await submitRecommendation(user);
    expect(preview()).toBeVisible();
  });

  test("compact unresolved entries can be corrected, including beyond the first displayed group", async () => {
    const user = userEvent.setup();
    const roster = makeRecipientRoster(10);
    renderClient({ roster });
    const recipients = roster.map((r, i) => ({
      ...selected(r),
      query: "",
      identity: { userId: `missing-${i}` },
    }));
    await loadEmpty(user, draft("operation", { recipients }));
    expect(
      screen.getByText("0 recipients selected", { exact: true }),
    ).toBeVisible();
    expect(
      screen.getAllByText("Recipient Not Found", { exact: true }),
    ).toHaveLength(8);
    expect(
      screen.queryByRole("button", { name: /\+ -/ }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show more pending recipients" }),
    );
    const last = screen.getByLabelText("Recipient 10", { exact: true });
    await user.clear(last);
    await user.type(last, "Member.10");
    await user.click(
      screen.getByRole("button", { name: "Member.10", exact: true }),
    );
    expect(
      screen.getByText("1 recipient selected", { exact: true }),
    ).toBeVisible();
    expect(
      screen.getAllByText("Recipient Not Found", { exact: true }),
    ).toHaveLength(9);
    await user.type(
      screen.getByLabelText("Recipient 9", { exact: true }),
      "Member.9",
    );
    await user.click(
      screen.getByRole("button", { name: "Member.9", exact: true }),
    );
    expect(
      screen.getByText("2 recipients selected", { exact: true }),
    ).toBeVisible();
    expect(
      screen.getAllByText("Recipient Not Found", { exact: true }),
    ).toHaveLength(8);
    await submitRecommendation(user);
    expect(preview()).not.toBeInTheDocument();
  });

  test("Service conditional values and partial dates restore, remain incomplete, and clear normally", async () => {
    const user = userEvent.setup();
    renderClient({ medalFamily: "service", roster: [current] });
    await loadEmpty(
      user,
      draft("service", {
        medalId: "defense-superior-service-medal",
        values: {
          leadershipArea: "secondary",
          secondaryRole: "a clerk",
          secondaryBillet: "S1",
          operationsLeadership: "AO Lead",
          operationsAO: "Vietnam",
          serviceStart: "20-05",
          serviceEnd: "2026-",
          narrative: serviceValues.narrative,
        },
      }),
    );
    expect(screen.getByLabelText("Service Start Year")).toHaveValue("20");
    expect(screen.getByLabelText("Service Start Month")).toHaveTextContent(
      "May",
    );
    expect(screen.getByLabelText("Service End Year")).toHaveValue("2026");
    await submitRecommendation(user);
    expect(preview()).not.toBeInTheDocument();
    expect(screen.getByLabelText("Service Start Year")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await selectComboboxOption(
      user,
      "Leadership Area",
      "Operations Leadership",
    );
    expect(
      screen.getByLabelText("Operations Leadership", { exact: true }),
    ).toHaveValue("AO Lead");
    expect(screen.getByLabelText("Operations AO", { exact: true })).toHaveValue(
      "Vietnam",
    );
    await user.click(
      screen.getByRole("button", { name: "Clear Worksheet", exact: true }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Clear Worksheet",
        exact: true,
      }),
    );
    expect(screen.getByLabelText("Service Start Year")).toHaveValue("");
    expect(screen.getByLabelText("Service Start Month")).toHaveTextContent(
      "Month",
    );
  });

  test.each([
    ["invalid JSON", "{broken"],
    ["wrong family", draft("service")],
    ["unknown medal", draft("operation", { medalId: "missing" })],
    ["unknown version", draft("operation", { version: 88 })],
    ["unknown field", draft("operation", { values: { invented: "value" } })],
    ["wrong primitive", draft("operation", { values: { narrative: [] } })],
    [
      "duplicate identity",
      draft("operation", { recipients: [selected(), selected()] }),
    ],
    [
      "earlier dual-ID identity",
      draft("operation", {
        recipients: [
          { ...selected(), identity: { userId: "9397", profileId: "4637" } },
        ],
      }),
    ],
    [
      "prototype property",
      JSON.stringify(draft()).replace(
        '"values":{',
        '"values":{"__proto__":{"polluted":true},',
      ),
    ],
  ])(
    "%s cannot partially replace existing fields, recipients, medal, or output",
    async (_, content) => {
      const user = userEvent.setup();
      renderClient({ roster: [current] });
      await generateCurrent(user, "operation");
      const citation = screen.getByLabelText("Citation Narrative").textContent;
      await upload(user, content);
      expect(await screen.findByRole("alert")).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Replace Worksheet" }),
      ).not.toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Cancel", exact: true }),
      );
      expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
        "Army Commendation Medal",
      );
      expect(
        screen.getByLabelText("Operation Title", { exact: true }),
      ).toHaveValue("Overlord");
      expect(screen.getByLabelText("Recipient", { exact: true })).toHaveValue(
        "Kenton.W",
      );
      expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
        operationValues.narrative,
      );
      expect(screen.getByLabelText("Citation Narrative").textContent).toBe(
        citation,
      );
    },
  );

  test.each(["Cancel", "Escape", "Close dialog"])(
    "%s cancels a valid replacement without losing generated work",
    async (action) => {
      const user = userEvent.setup();
      renderClient({ roster: [current] });
      await generateCurrent(user, "operation");
      const citation = screen.getByLabelText("Citation Narrative").textContent;
      await upload(
        user,
        draft("operation", {
          values: { ...operationValues, operationTitle: "Fury" },
        }),
      );
      await screen.findByRole("button", { name: "Replace Worksheet" });
      if (action === "Escape") await user.keyboard("{Escape}");
      else
        await user.click(
          screen.getByRole("button", { name: action, exact: true }),
        );
      expect(
        screen.getByLabelText("Operation Title", { exact: true }),
      ).toHaveValue("Overlord");
      expect(screen.getByLabelText("Citation Narrative").textContent).toBe(
        citation,
      );
      expect(
        screen.getByRole("button", { name: "Load", exact: true }),
      ).toHaveFocus();
    },
  );

  test("oversized input is rejected before reading and oversized output is not truncated or downloaded", async () => {
    const user = userEvent.setup();
    renderClient({ roster: [current] });
    await generateCurrent(user, "operation");
    const prior = screen.getByLabelText("Citation Narrative").textContent;
    const read = vi.spyOn(FileReader.prototype, "readAsArrayBuffer");
    await upload(
      user,
      new File(["x".repeat(MAX_DRAFT_BYTES + 1)], "large.json", {
        type: "application/json",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(/1 MiB/);
    expect(read).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Cancel", exact: true }),
    );
    expect(screen.getByLabelText("Citation Narrative").textContent).toBe(prior);
    const oversizedLocation = "😀".repeat(270000);
    enterWorksheetField("Location", oversizedLocation);
    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/1 MiB/);
    expect(downloaded).toBeNull();
    expect(screen.getByLabelText("Location", { exact: true })).toHaveValue(
      oversizedLocation,
    );
  });

  test.each([
    ["replacement", "resolve"],
    ["replacement", "reject"],
    ["close", "resolve"],
    ["close", "reject"],
  ])(
    "a superseded file read cannot overwrite work after %s and late %s",
    async (action, completion) => {
      const user = userEvent.setup();
      renderClient({ roster: [current] });
      await generateCurrent(user, "operation");
      const prior = screen.getByLabelText("Citation Narrative").textContent;
      const reads = [];
      vi.spyOn(FileReader.prototype, "readAsArrayBuffer").mockImplementation(
        function () {
          reads.push(this);
        },
      );
      await upload(
        user,
        draft("operation", {
          values: { ...operationValues, operationTitle: "Late file" },
        }),
      );
      const complete = async (reader, value) => {
        await act(async () => {
          Object.defineProperty(reader, "result", {
            value: new TextEncoder().encode(JSON.stringify(value)).buffer,
            configurable: true,
          });
          reader.onload();
        });
      };
      if (action === "replacement") {
        await upload(
          user,
          draft("operation", {
            values: { ...operationValues, operationTitle: "Fury" },
          }),
        );
        await complete(
          reads[1],
          draft("operation", {
            values: { ...operationValues, operationTitle: "Fury" },
          }),
        );
        await confirm(user);
      } else
        await user.click(
          screen.getByRole("button", { name: "Cancel", exact: true }),
        );
      if (completion === "reject") await act(async () => reads[0].onerror());
      else
        await complete(
          reads[0],
          draft("operation", {
            values: { ...operationValues, operationTitle: "Late file" },
          }),
        );
      expect(
        screen.getByLabelText("Operation Title", { exact: true }),
      ).toHaveValue(action === "replacement" ? "Fury" : "Overlord");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      if (action === "close")
        expect(screen.getByLabelText("Citation Narrative").textContent).toBe(
          prior,
        );
      else expect(preview()).not.toBeInTheDocument();
    },
  );
});
