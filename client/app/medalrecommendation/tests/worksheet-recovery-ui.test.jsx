import { StrictMode, useRef, useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import MedalRecommendationClient from "../MedalRecommendationClient";
import useWorksheetRecovery from "../useWorksheetRecovery";
import * as storage from "../lib/worksheet-recovery-store";
import { MAX_DRAFT_BYTES, serializeDraft } from "../lib/recommendation-drafts";
import {
  enterWorksheetField,
  makeRecipient,
  makeRecipientRoster,
  openBulkRecipientDialog,
  renderClient,
  selectAward,
  selectComboboxOption,
  submitRecommendation,
} from "./test-helpers";

const member = makeRecipient({
  profileId: "4637",
  user: { userId: "9397", username: "Kenton.W" },
  realName: "Wade Kenton",
});
function state(family = "operation", overrides = {}) {
  return {
    medalFamily: family,
    medalId:
      family === "operation"
        ? "army-commendation-medal"
        : "army-achievement-medal",
    entries: [{ member, query: member.user.username }],
    values:
      family === "operation"
        ? {
            actionCharacter: "skillful",
            combatElement: "a rifleman",
            operationTitle: "Overlord",
            location: "Normandy",
            operationDate: "2025-01-01",
            narrative:
              "Specialist Wade Kenton held the line. The squad advanced. The objective was secured.",
          }
        : {
            affectedArea: "S7 Training",
            narrative:
              "improving instruction. The team delivered lessons. Training standards improved.",
          },
    ...overrides,
  };
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function lockQueue() {
  const queues = new Map();
  return {
    request(name, _options, callback) {
      const task = (queues.get(name) ?? Promise.resolve()).then(callback);
      queues.set(
        name,
        task.catch(() => {}),
      );
      return task;
    },
  };
}

let factory;
let observer;
let downloaded;
beforeEach(() => {
  factory = new IDBFactory();
  vi.stubGlobal("indexedDB", factory);
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: lockQueue(),
  });
  observer = storage.createRecoveryStore();
  downloaded = undefined;
  const OriginalURL = globalThis.URL;
  vi.stubGlobal(
    "URL",
    class extends OriginalURL {
      static createObjectURL(blob) {
        downloaded = blob;
        return "blob:download";
      }
      static revokeObjectURL() {}
    },
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(async () => {
  cleanup();
  // Drain genuine edits/cleanup flushes through the same family queues before
  // discarding this test's isolated database and lock manager.
  if (navigator.locks)
    await Promise.all(
      ["operation", "service"].map((family) =>
        navigator.locks.request(
          `cavapps-medal-recovery:${family}`,
          {},
          () => {},
        ),
      ),
    );
  observer.close();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete navigator.locks;
  vi.useRealTimers();
});
async function seed(draft = state()) {
  const token = await observer.register(
    draft.medalFamily,
    await observer.readHead(draft.medalFamily),
  );
  await observer.commit(token, serializeDraft(draft));
  return token;
}
const feedback = () => screen.getByLabelText("Worksheet Recovery");
const preview = () =>
  screen.queryByRole("region", { name: "Recommendation Preview" });
async function recovered(label, expected) {
  await waitFor(() =>
    expect(screen.getByLabelText(label, { exact: true })).toHaveValue(expected),
  );
}
async function stored(family, field, expected) {
  await waitFor(async () =>
    expect((await observer.read(family)).draft.values[field]).toBe(expected),
  );
}
async function upload(user, draft) {
  await user.click(screen.getByRole("button", { name: "Load", exact: true }));
  await user.upload(
    screen.getByLabelText("Draft file"),
    new File([draft], "draft.json", { type: "application/json" }),
  );
}
async function clear(user) {
  await user.click(
    screen.getByRole("button", { name: "Clear Worksheet", exact: true }),
  );
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Clear Worksheet",
      exact: true,
    }),
  );
}
function holdHydration() {
  const release = deferred();
  const read = deferred();
  const original = storage.createRecoveryStore;
  vi.spyOn(storage, "createRecoveryStore").mockImplementation((options) => {
    const store = original(options);
    return {
      ...store,
      async read(family) {
        const result = await store.read(family);
        read.resolve();
        await release.promise;
        return result;
      },
    };
  });
  return { release, read };
}

// Separate rendered controllers model independent tabs without duplicating the
// full worksheet's HTML IDs in a single jsdom document. Storage is real IDB.
function RecoveryTab({ name, family = "operation" }) {
  const [draft, setDraft] = useState(() =>
    state(family, { medalId: "", values: {} }),
  );
  const editable = useRef(draft);
  const recovery = useWorksheetRecovery({
    medalFamily: family,
    roster: [member],
    onRestore(prepared) {
      const next = { medalFamily: family, ...prepared };
      editable.current = next;
      setDraft(next);
    },
  });
  return (
    <section aria-label={name}>
      <textarea
        aria-label={`${name} Narrative`}
        value={draft.values.narrative ?? ""}
        onChange={(event) => {
          const next = {
            ...editable.current,
            values: {
              ...editable.current.values,
              narrative: event.target.value,
            },
          };
          editable.current = next;
          setDraft(next);
          recovery.recordEdit(next, { debounce: true });
        }}
      />
      <p aria-label={`${name} Recovery`} aria-live="polite">
        {recovery.status.message}
      </p>
    </section>
  );
}

describe("Automatic worksheet recovery", () => {
  test("recovery checking, restored work, pending edits and completed saves have visible live feedback", async () => {
    await seed();
    const pending = holdHydration();
    renderClient({ roster: [member] });
    await pending.read.promise;
    const status = screen.getByLabelText("Worksheet Recovery");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(within(status).getByText(/checking/i)).toBeVisible();
    await act(async () => pending.release.resolve());
    await recovered("Operation Title", "Overlord");
    expect(within(status).getByText(/recovered/i)).toBeVisible();
    enterWorksheetField("Narrative", "A new local edit awaiting recovery.");
    expect(within(status).getByText(/not saved yet/i)).toBeVisible();
    fireEvent(window, new Event("pagehide"));
    await stored(
      "operation",
      "narrative",
      "A new local edit awaiting recovery.",
    );
    await waitFor(() =>
      expect(within(status).getByText(/saved in this browser/i)).toBeVisible(),
    );
    expect(screen.getAllByLabelText("Worksheet Recovery")).toHaveLength(1);
  });

  test("a stale tab cannot replace another tab's fully completed additional sentence", async () => {
    await seed();
    render(<RecoveryTab name="Tab A" />);
    render(<RecoveryTab name="Tab B" />);
    const original = state().values.narrative;
    await recovered("Tab A Narrative", original);
    await recovered("Tab B Narrative", original);
    const newer = `${original} Tab B secured the extraction point.`;
    fireEvent.change(screen.getByLabelText("Tab B Narrative"), {
      target: { value: newer },
    });
    fireEvent(window, new Event("pagehide"));
    await stored("operation", "narrative", newer);
    const completed = await observer.read("operation");
    expect(completed.head.revision).toBe(2);

    // B's payload is fully committed before A edits its older worksheet.
    const firstLocal = `${original} Tab A added an older account.`;
    fireEvent.change(screen.getByLabelText("Tab A Narrative"), {
      target: { value: firstLocal },
    });
    // A second edit is already queued before the first conflict is delivered.
    const local = `${firstLocal} Another queued stale edit.`;
    fireEvent.change(screen.getByLabelText("Tab A Narrative"), {
      target: { value: local },
    });
    fireEvent(window, new Event("pagehide"));
    await waitFor(() =>
      expect(screen.getByLabelText("Tab A Recovery")).toHaveTextContent(
        /another tab/i,
      ),
    );
    expect(screen.getByLabelText("Tab A Narrative")).toHaveValue(local);
    expect(await observer.read("operation")).toEqual(completed);
    fireEvent.change(screen.getByLabelText("Tab A Narrative"), {
      target: { value: `${local} More unsaved typing.` },
    });
    fireEvent(window, new Event("pagehide"));
    expect(screen.getByLabelText("Tab A Recovery")).toHaveTextContent(
      /another tab.*Download/i,
    );
    expect(await observer.read("operation")).toEqual(completed);
    render(<RecoveryTab name="Tab C" />);
    await recovered("Tab C Narrative", newer);
  });

  test("rapid edits retain immediate queue admission and focus waits for their acknowledged base", async () => {
    const base = await seed();
    renderClient({ roster: [member] });
    await recovered("Operation Title", "Overlord");
    const barrier = deferred();
    const holding = navigator.locks.request(
      "cavapps-medal-recovery:operation",
      {},
      () => barrier.promise,
    );
    enterWorksheetField("Operation Title", "First local edit");
    // This stale competitor joins between genuine local edits. If registration
    // admission were deferred until its predecessor resolved, it could win.
    const competitor = observer.register("operation", base);
    const rejected = expect(competitor).rejects.toBeInstanceOf(
      storage.RecoveryConflictError,
    );
    fireEvent(window, new Event("focus"));
    enterWorksheetField("Operation Title", "Second local edit");
    enterWorksheetField("Operation Title", "Third local edit");
    fireEvent(window, new Event("pagehide"));
    await act(async () => {
      barrier.resolve();
      await holding;
      await rejected;
    });
    await stored("operation", "operationTitle", "Third local edit");
    await waitFor(() =>
      expect(feedback()).toHaveTextContent(/saved in this browser/i),
    );
    expect((await observer.readHead("operation")).revision).toBe(4);
    expect(feedback()).not.toHaveTextContent(/another tab/i);
  });

  test.each(["focus", "visible"])(
    "%s freshness invalidates saved feedback without replacing local fields or advancing recovery",
    async (event) => {
      await seed();
      renderClient({ roster: [member] });
      await recovered("Operation Title", "Overlord");
      enterWorksheetField("Operation Title", "My completed work");
      fireEvent(window, new Event("pagehide"));
      await stored("operation", "operationTitle", "My completed work");
      await waitFor(() =>
        expect(feedback()).toHaveTextContent(/saved in this browser/i),
      );
      await seed(
        state("operation", {
          values: { operationTitle: "Other tab's newer work" },
        }),
      );
      const newer = await observer.read("operation");
      if (event === "focus") fireEvent(window, new Event("focus"));
      else {
        vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
        fireEvent(document, new Event("visibilitychange"));
      }
      await waitFor(() => expect(feedback()).toHaveTextContent(/another tab/i));
      const status = screen.getByLabelText("Worksheet Recovery");
      expect(within(status).getByText(/another tab/i)).toBeVisible();
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(
        screen.getByLabelText("Operation Title", { exact: true }),
      ).toHaveValue("My completed work");
      expect(await observer.read("operation")).toEqual(newer);
    },
  );

  test.each(["Clear", "Load"])(
    "stale %s preserves the local result and Download without replacing newer recovery",
    async (action) => {
      const user = userEvent.setup();
      await seed();
      await seed(state("service"));
      const service = await observer.read("service");
      renderClient({ roster: [member] });
      await recovered("Operation Title", "Overlord");
      await seed(
        state("operation", {
          values: { operationTitle: "Other tab's completed work" },
        }),
      );
      const newer = await observer.read("operation");
      if (action === "Clear") await clear(user);
      else {
        await upload(
          user,
          serializeDraft(
            state("operation", {
              values: { operationTitle: "Imported local work" },
            }),
          ),
        );
        await user.click(
          within(screen.getByRole("dialog")).getByRole("button", {
            name: "Replace Worksheet",
          }),
        );
      }
      await waitFor(() =>
        expect(feedback()).toHaveTextContent(/another tab.*Download/i),
      );
      expect(
        screen.getByLabelText("Operation Title", { exact: true }),
      ).toHaveValue(action === "Clear" ? "" : "Imported local work");
      if (action === "Clear")
        expect(feedback()).toHaveTextContent(/another tab/i);
      await user.click(screen.getByRole("button", { name: "Download" }));
      expect(downloaded).toBeInstanceOf(Blob);
      enterWorksheetField("Operation Title", "Still local after conflict");
      fireEvent(window, new Event("pagehide"));
      expect(feedback()).toHaveTextContent(/another tab/i);
      expect(await observer.read("operation")).toEqual(newer);
      expect(await observer.read("service")).toEqual(service);
    },
  );

  test("a conflict in Operation does not prevent a mounted Service worksheet from saving", async () => {
    await seed();
    await seed(state("service"));
    render(<RecoveryTab name="Operation" />);
    render(<RecoveryTab name="Service" family="service" />);
    await recovered("Operation Narrative", state().values.narrative);
    await recovered("Service Narrative", state("service").values.narrative);
    await seed(
      state("operation", { values: { narrative: "Newer Operation work." } }),
    );
    const operation = await observer.read("operation");
    fireEvent(window, new Event("focus"));
    await waitFor(() =>
      expect(screen.getByLabelText("Operation Recovery")).toHaveTextContent(
        /another tab/i,
      ),
    );
    fireEvent.change(screen.getByLabelText("Service Narrative"), {
      target: { value: "Independent Service edit." },
    });
    fireEvent(window, new Event("pagehide"));
    await stored("service", "narrative", "Independent Service edit.");
    await waitFor(() =>
      expect(screen.getByLabelText("Service Recovery")).toHaveTextContent(
        /saved in this browser/i,
      ),
    );
    expect(await observer.read("operation")).toEqual(operation);
  });
  test.each([
    ["operation", "Operation Title", "operationTitle", "Fury"],
    ["service", "Affected Area of the Cav", "affectedArea", "S6 Development"],
  ])(
    "%s edits survive remount without generated output; Generate creates fresh output",
    async (family, label, field, updated) => {
      const user = userEvent.setup();
      await seed(state(family));
      const view = renderClient({ medalFamily: family, roster: [member] });
      await recovered(label, state(family).values[field]);
      await submitRecommendation(user);
      expect(preview()).toBeVisible();
      enterWorksheetField(label, updated);
      fireEvent(window, new Event("pagehide"));
      await stored(family, field, updated);
      await waitFor(() =>
        expect(feedback()).toHaveTextContent(/saved in this browser/i),
      );
      const saved = await observer.read(family);
      view.unmount();
      renderClient({ medalFamily: family, roster: [member] });
      await recovered(label, updated);
      expect(preview()).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Copy Body" }),
      ).not.toBeInTheDocument();
      await submitRecommendation(user);
      expect(preview()).toHaveTextContent(updated);
      expect(await observer.read(family)).toEqual(saved);
      expect(Object.keys(JSON.parse(saved.snapshot.draftJSON)).sort()).toEqual([
        "format",
        "medalFamily",
        "medalId",
        "recipients",
        "values",
        "version",
      ]);
    },
  );

  test("Operation and Service retain independent worksheets across navigation", async () => {
    await seed();
    await seed(state("service"));
    let view = renderClient({ roster: [member] });
    await recovered("Operation Title", "Overlord");
    enterWorksheetField("Operation Title", "Fury");
    view.unmount();
    await stored("operation", "operationTitle", "Fury");
    view = renderClient({ medalFamily: "service", roster: [member] });
    await recovered("Affected Area of the Cav", "S7 Training");
    view.unmount();
    renderClient({ roster: [member] });
    await recovered("Operation Title", "Fury");
  });

  test("partial Service dates and inactive conditional values survive subsequent recovery", async () => {
    const user = userEvent.setup();
    await seed(
      state("service", {
        medalId: "defense-superior-service-medal",
        values: {
          leadershipArea: "secondary",
          secondaryRole: "a clerk",
          secondaryBillet: "S1",
          operationsLeadership: "AO Lead",
          operationsAO: "Vietnam",
          serviceStart: "20-05",
          serviceEnd: "2026-",
        },
      }),
    );
    const view = renderClient({ medalFamily: "service", roster: [member] });
    await recovered("Service Start Year", "20");
    expect(screen.getByLabelText("Service Start Month")).toHaveTextContent(
      "May",
    );
    expect(screen.getByLabelText("Service End Year")).toHaveValue("2026");
    await selectComboboxOption(
      user,
      "Leadership Area",
      "Operations Leadership",
    );
    expect(
      screen.getByLabelText("Operations Leadership", { exact: true }),
    ).toHaveValue("AO Lead");
    await stored("service", "leadershipArea", "operations");
    view.unmount();
    renderClient({ medalFamily: "service", roster: [member] });
    await recovered("Operations AO", "Vietnam");
    expect(screen.getByLabelText("Service Start Year")).toHaveValue("20");
  });

  test("current roster names, ranks and recreated MILPACS profiles are authoritative without rewriting the save", async () => {
    await seed();
    const before = await observer.read("operation");
    const promoted = makeRecipient({
      ...member,
      profileId: "new-profile",
      user: { ...member.user, username: "Renamed.W" },
      rank: { rankId: "17", rankFull: "Staff Sergeant", rankShort: "SSG" },
    });
    renderClient({ roster: [promoted] });
    await recovered("Recipient", "Renamed.W");
    await submitRecommendation(userEvent.setup());
    expect(preview()).toHaveTextContent("Staff Sergeant");
    expect(
      within(preview()).getByRole("link", {
        name: "Staff Sergeant Wade Kenton",
      }),
    ).toHaveAttribute("href", "https://7cav.us/rosters/profile/new-profile/");
    expect(await observer.read("operation")).toEqual(before);
  });

  test("compact recovery retains unresolved recipients and unfinished searches in working order", async () => {
    const user = userEvent.setup();
    const roster = makeRecipientRoster(10);
    await seed(
      state("operation", {
        name: "Working draft",
        entries: [
          { member: roster[3], query: roster[3].user.username },
          { member, query: "Kenton.W" },
          { member: null, query: "unfinished" },
          ...[0, 1, 2, 4, 5, 6, 7].map((i) => ({
            member: roster[i],
            query: roster[i].user.username,
          })),
        ],
      }),
    );
    renderClient({ roster });
    await recovered("Recipient 3", "unfinished");
    expect(
      screen.getByText("Recipient Not Found", { exact: true }),
    ).toBeVisible();
    expect(
      screen.getByText("8 recipients selected", { exact: true }),
    ).toBeVisible();
    const dialog = await openBulkRecipientDialog(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Select All Shown" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm Recipients" }),
    );
    await waitFor(async () =>
      expect((await observer.read("operation")).draft.recipients).toHaveLength(
        12,
      ),
    );
    expect(screen.getByLabelText("Recipient 3", { exact: true })).toHaveValue(
      "unfinished",
    );
    const result = await observer.read("operation");
    expect(result.draft.name).toBe("Working draft");
    expect(
      result.draft.recipients
        .slice(0, 3)
        .map((entry) =>
          entry.kind === "search" ? entry.query : entry.identity.userId,
        ),
    ).toEqual(["4", "9397", "unfinished"]);
  });

  test("initial Strict Mode rendering, hydration and UI-only actions do not register edits", async () => {
    const user = userEvent.setup();
    const empty = render(
      <StrictMode>
        <MedalRecommendationClient
          medalFamily="operation"
          recipientRoster={[member]}
        />
      </StrictMode>,
    );
    await waitFor(() => expect(feedback()).toHaveTextContent(/^$/));
    expect(screen.getByLabelText("Worksheet Recovery")).toBeEmptyDOMElement();
    expect((await observer.read("operation")).head).toBeUndefined();
    empty.unmount();
    await seed();
    const before = await observer.read("operation");
    const view = render(
      <StrictMode>
        <MedalRecommendationClient
          medalFamily="operation"
          recipientRoster={[member]}
        />
      </StrictMode>,
    );
    await recovered("Operation Title", "Overlord");
    view.rerender(
      <StrictMode>
        <MedalRecommendationClient
          medalFamily="operation"
          recipientRoster={[member]}
        />
      </StrictMode>,
    );
    await submitRecommendation(user);
    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(downloaded).toBeInstanceOf(Blob);
    await user.click(
      screen.getByRole("button", { name: "Clear Worksheet", exact: true }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    const dialog = await openBulkRecipientDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(await observer.read("operation")).toEqual(before);
  });

  test("Clear preserves the medal, clears name metadata, and defeats older cross-tab work", async () => {
    const user = userEvent.setup();
    const base = await seed(state("operation", { name: "Imported name" }));
    await seed(state("service"));
    const service = await observer.read("service");
    const old = await observer.register("operation", base);
    const view = renderClient({ roster: [member] });
    await recovered("Operation Title", "Overlord");
    enterWorksheetField("Operation Title", "Pending typing");
    await clear(user);
    await stored("operation", "operationTitle", "");
    expect(await observer.commit(old, serializeDraft(state()))).toBe(false);
    fireEvent(window, new Event("pagehide"));
    view.unmount();
    renderClient({ roster: [member] });
    await recovered("Operation Title", "");
    expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
      "Army Commendation Medal",
    );
    expect(screen.getByLabelText("Recipient", { exact: true })).toHaveValue("");
    expect((await observer.read("operation")).draft.name).toBeUndefined();
    expect(await observer.read("service")).toEqual(service);
  });

  test("an accepted file Load becomes recoverable without changing its Download format", async () => {
    const user = userEvent.setup();
    const view = renderClient({ roster: [member] });
    await upload(
      user,
      serializeDraft(state("operation", { name: "Imported" })),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await stored("operation", "operationTitle", "Overlord");
    view.unmount();
    renderClient({ roster: [member] });
    await recovered("Operation Title", "Overlord");
    expect((await observer.read("operation")).draft.name).toBe("Imported");
    await user.click(screen.getByRole("button", { name: "Download" }));
    const json = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(JSON.parse(reader.result));
      reader.readAsText(downloaded);
    });
    expect(json.name).toBe("Imported");
    expect(json).not.toHaveProperty("revision");
    expect(json).not.toHaveProperty("editId");
  });

  test.each(["cancel", "invalid", "accept"])(
    "manual Load %s supersedes pending hydration without an unintended revision",
    async (action) => {
      await seed();
      const before = await observer.read("operation");
      const pending = holdHydration();
      const user = userEvent.setup();
      renderClient({ roster: [member] });
      await pending.read.promise;
      await user.click(
        screen.getByRole("button", { name: "Load", exact: true }),
      );
      await act(async () => pending.release.resolve());
      expect(
        screen.queryByLabelText("Operation Title", { exact: true }),
      ).not.toBeInTheDocument();
      if (action === "cancel") {
        await user.click(
          within(screen.getByRole("dialog")).getByRole("button", {
            name: "Cancel",
          }),
        );
      } else {
        const draft =
          action === "invalid"
            ? "{broken"
            : serializeDraft(
                state("operation", {
                  values: { operationTitle: "Manual Fury" },
                }),
              );
        await user.upload(
          screen.getByLabelText("Draft file"),
          new File([draft], "draft.json", { type: "application/json" }),
        );
        if (action === "invalid")
          expect(await screen.findByRole("alert")).toBeVisible();
        else {
          await recovered("Operation Title", "Manual Fury");
          await waitFor(() =>
            expect(feedback()).toHaveTextContent(/another tab/i),
          );
        }
      }
      expect(await observer.read("operation")).toEqual(before);
    },
  );

  test.each([true, false])(
    "edits before hydration retain local values and cannot adopt an unread base (existing recovery: %s)",
    async (prior) => {
      if (prior) await seed();
      const before = await observer.read("operation");
      const pending = holdHydration();
      renderClient({ roster: [member] });
      await pending.read.promise;
      await selectAward(userEvent.setup(), "Bronze Star Medal");
      enterWorksheetField("Operation Title", "New work");
      await act(async () => pending.release.resolve());
      expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
        "Bronze Star Medal",
      );
      expect(
        screen.getByLabelText("Operation Title", { exact: true }),
      ).toHaveValue("New work");
      fireEvent(window, new Event("pagehide"));
      if (prior) {
        await waitFor(() =>
          expect(feedback()).toHaveTextContent(/another tab/i),
        );
        expect(await observer.read("operation")).toEqual(before);
      } else {
        await stored("operation", "operationTitle", "New work");
        enterWorksheetField("Operation Title", "More new work");
        fireEvent(window, new Event("pagehide"));
        await stored("operation", "operationTitle", "More new work");
        await waitFor(() =>
          expect(feedback()).toHaveTextContent(/saved in this browser/i),
        );
      }
    },
  );

  test.each([true, false])(
    "interrupted recovery warns and restores only completed work (prior save: %s)",
    async (prior) => {
      const base = prior ? await seed() : null;
      const pending = await observer.register("operation", base);
      renderClient({ roster: [member] });
      await waitFor(() =>
        expect(feedback()).toHaveTextContent(/unsaved|not saved/i),
      );
      if (prior) await recovered("Operation Title", "Overlord");
      else
        expect(
          screen.queryByLabelText("Operation Title", { exact: true }),
        ).not.toBeInTheDocument();
      expect(preview()).not.toBeInTheDocument();
      if (!prior)
        await selectAward(userEvent.setup(), "Army Commendation Medal");
      enterWorksheetField(
        "Operation Title",
        "Edited after interrupted recovery",
      );
      fireEvent(window, new Event("pagehide"));
      await stored(
        "operation",
        "operationTitle",
        "Edited after interrupted recovery",
      );
      expect((await observer.readHead("operation")).revision).toBeGreaterThan(
        pending.revision,
      );
    },
  );

  test("an older lifecycle flush cannot replace another tab's newer edit or claim saved", async () => {
    await seed();
    renderClient({ roster: [member] });
    await recovered("Operation Title", "Overlord");
    enterWorksheetField("Operation Title", "Older local work");
    await navigator.locks.request(
      "cavapps-medal-recovery:operation",
      {},
      () => {},
    );
    const newer = await observer.register(
      "operation",
      await observer.readHead("operation"),
    );
    await observer.commit(
      newer,
      serializeDraft(
        state("operation", { values: { operationTitle: "Newer tab" } }),
      ),
    );
    fireEvent(window, new Event("pagehide"));
    await waitFor(() => expect(feedback()).toHaveTextContent(/another tab/i));
    expect((await observer.read("operation")).draft.values.operationTitle).toBe(
      "Newer tab",
    );
  });

  test("storage errors preserve editable content, keep Download available, and never claim saved", async () => {
    await seed();
    renderClient({ roster: [member] });
    await recovered("Operation Title", "Overlord");
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
      throw new DOMException("Quota exhausted", "QuotaExceededError");
    });
    enterWorksheetField("Operation Title", "Still editable");
    fireEvent(window, new Event("pagehide"));
    await waitFor(() =>
      expect(feedback()).toHaveTextContent(/not saved.*quota/i),
    );
    expect(
      screen.getByLabelText("Operation Title", { exact: true }),
    ).toHaveValue("Still editable");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Download" }));
    expect(downloaded).toBeInstanceOf(Blob);
  });

  test("failed Clear warns that previous recovery can remain while the visible worksheet is cleared", async () => {
    await seed();
    renderClient({ roster: [member] });
    await recovered("Operation Title", "Overlord");
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
      throw new Error("Storage denied");
    });
    await clear(userEvent.setup());
    await waitFor(() =>
      expect(feedback()).toHaveTextContent(
        /previous browser recovery may still be present/i,
      ),
    );
    expect(
      screen.getByLabelText("Operation Title", { exact: true }),
    ).toHaveValue("");
    expect((await observer.read("operation")).draft.values.operationTitle).toBe(
      "Overlord",
    );
  });

  test("oversized work remains intact with a visible failure and no partial snapshot", async () => {
    await seed();
    renderClient({ roster: [member] });
    await recovered("Operation Title", "Overlord");
    const oversized = "é".repeat(MAX_DRAFT_BYTES);
    enterWorksheetField("Operation Title", oversized);
    fireEvent(window, new Event("pagehide"));
    await waitFor(() => expect(feedback()).toHaveTextContent(/1 MiB/i));
    expect(
      screen.getByLabelText("Operation Title", { exact: true }),
    ).toHaveValue(oversized);
    expect((await observer.read("operation")).draft.values.operationTitle).toBe(
      "Overlord",
    );
  });

  test.each(["inactivity", "maximum wait"])(
    "typing reserves edits immediately and commits at the %s boundary",
    async (boundary) => {
      await seed();
      renderClient({ roster: [member] });
      await recovered("Operation Title", "Overlord");
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      enterWorksheetField("Operation Title", "Typed 0");
      await navigator.locks.request(
        "cavapps-medal-recovery:operation",
        {},
        () => {},
      );
      const waiting = await observer.read("operation");
      expect(waiting.head.revision).toBeGreaterThan(waiting.snapshot.revision);
      expect(waiting.draft.values.operationTitle).toBe("Overlord");
      let expected = "Typed 0";
      if (boundary === "maximum wait") {
        for (let i = 1; i <= 4; i++) {
          await act(async () => {
            vi.advanceTimersByTime(400);
          });
          expected = `Typed ${i}`;
          enterWorksheetField("Operation Title", expected);
        }
        await navigator.locks.request(
          "cavapps-medal-recovery:operation",
          {},
          () => {},
        );
        expect(
          (await observer.read("operation")).draft.values.operationTitle,
        ).toBe("Overlord");
        await act(async () => {
          vi.advanceTimersByTime(400);
        });
      } else {
        await act(async () => {
          vi.advanceTimersByTime(499);
        });
        expect(
          (await observer.read("operation")).draft.values.operationTitle,
        ).toBe("Overlord");
        await act(async () => {
          vi.advanceTimersByTime(1);
        });
      }
      vi.useRealTimers();
      await stored("operation", "operationTitle", expected);
    },
  );

  test.each(["IndexedDB", "Web Locks", "denied storage"])(
    "%s unavailability leaves Load, editing, Generate and Download functional",
    async (missing) => {
      if (missing === "IndexedDB") vi.stubGlobal("indexedDB", undefined);
      else if (missing === "Web Locks")
        Object.defineProperty(navigator, "locks", {
          configurable: true,
          value: undefined,
        });
      else
        vi.spyOn(factory, "open").mockImplementation(() => {
          throw new DOMException("Storage denied", "SecurityError");
        });
      const user = userEvent.setup();
      renderClient({ roster: [member] });
      await waitFor(() =>
        expect(feedback()).toHaveTextContent(/unavailable|denied/i),
      );
      await upload(user, serializeDraft(state()));
      await recovered("Operation Title", "Overlord");
      enterWorksheetField("Operation Title", "Manual work");
      await submitRecommendation(user);
      expect(preview()).toHaveTextContent("Manual work");
      await user.click(screen.getByRole("button", { name: "Download" }));
      expect(downloaded).toBeInstanceOf(Blob);
    },
  );

  test("a pending old controller cannot restore into a remounted worksheet", async () => {
    await seed();
    const pending = holdHydration();
    const old = renderClient({ roster: [member] });
    await pending.read.promise;
    old.unmount();
    renderClient({ medalFamily: "service", roster: [member] });
    await selectAward(userEvent.setup(), "Army Achievement Medal");
    enterWorksheetField("Affected Area of the Cav", "Current Service work");
    await act(async () => pending.release.resolve());
    expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
      "Army Achievement Medal",
    );
    expect(
      screen.getByLabelText("Affected Area of the Cav", { exact: true }),
    ).toHaveValue("Current Service work");
  });
});
