import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IDBFactory } from "fake-indexeddb";
import * as namedStorage from "../lib/named-draft-store";
import { createRecoveryStore } from "../lib/worksheet-recovery-store";
import { parseDraft, serializeDraft } from "../lib/recommendation-drafts";
import {
  enterWorksheetField,
  makeRecipient,
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
let observer;
let recovery;
let downloaded;
beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  const queues = new Map();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request(name, _options, callback) {
        const task = (queues.get(name) ?? Promise.resolve()).then(callback);
        queues.set(
          name,
          task.catch(() => {}),
        );
        return task;
      },
    },
  });
  observer = namedStorage.createNamedDraftStore();
  recovery = createRecoveryStore();
  downloaded = null;
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
  await Promise.all(
    ["operation", "service"].map((family) =>
      navigator.locks.request(`cavapps-medal-recovery:${family}`, {}, () => {}),
    ),
  );
  observer.close();
  recovery.close();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete navigator.locks;
});
const button = (name) => screen.getByRole("button", { name, exact: true });
const preview = () =>
  screen.queryByRole("region", { name: "Recommendation Preview" });
const feedback = () => screen.getByLabelText("Worksheet Recovery");
async function mount(options = {}) {
  const rendered = renderClient({ roster: [member], ...options });
  await waitFor(() => expect(feedback()).not.toHaveTextContent(/checking/i));
  return rendered;
}
const seed = (name = "Stored plan", source = state()) =>
  observer.create(source.medalFamily, serializeDraft(source), name);
async function closed() {
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}
async function openLoad(user) {
  await user.click(button("Load"));
  await waitFor(() =>
    expect(screen.queryByText("Reading saved drafts…")).not.toBeInTheDocument(),
  );
}
const row = (name) => within(screen.getByRole("listitem", { name }));
async function load(user, name, replace = false) {
  await openLoad(user);
  await user.click(row(name).getByRole("button", { name: "Load draft" }));
  if (replace)
    await user.click(
      await screen.findByRole("button", { name: "Replace Worksheet" }),
    );
  await closed();
}
async function openSave(user) {
  await user.click(button("Save"));
  await waitFor(() =>
    expect(screen.queryByText("Reading saved drafts…")).not.toBeInTheDocument(),
  );
}
function nameDraft(name) {
  enterWorksheetField("Draft name", name);
}
async function saveNew(user, name) {
  await openSave(user);
  if (name !== undefined) nameDraft(name);
  await waitFor(() => expect(button("Save new draft")).toBeEnabled());
  await user.click(button("Save new draft"));
  await closed();
}
async function overwrite(user) {
  await openSave(user);
  await user.click(button("Overwrite this draft"));
  await waitFor(() => expect(button("Confirm Overwrite")).toBeEnabled());
  await user.click(button("Confirm Overwrite"));
}
async function clear(user) {
  await user.click(button("Clear Worksheet"));
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Clear Worksheet",
      exact: true,
    }),
  );
  await closed();
}
async function importFile(user, source) {
  await openLoad(user);
  await user.upload(
    screen.getByLabelText("Draft file"),
    new File([serializeDraft(source)], "draft.json", {
      type: "application/json",
    }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Replace Worksheet" }),
  );
  await closed();
}
async function flushRecovery(family = "operation") {
  fireEvent(window, new Event("pagehide"));
  await waitFor(() =>
    expect(feedback()).toHaveTextContent(/saved in this browser/i),
  );
  return recovery.readHead(family);
}
// Delay real operations at their asynchronous boundary; successful outcomes
// still come from IndexedDB transactions, never a fake in-memory result.
function hold(method, after = false) {
  const entered = deferred();
  const release = deferred();
  const original = namedStorage.createNamedDraftStore;
  vi.spyOn(namedStorage, "createNamedDraftStore").mockImplementation(
    (...options) => {
      const store = original(...options);
      return {
        ...store,
        async [method](...args) {
          const result = after ? await store[method](...args) : undefined;
          entered.resolve();
          await release.promise;
          return after ? result : store[method](...args);
        },
      };
    },
  );
  return { entered, release };
}

describe("Named browser drafts", () => {
  test.each(["operation", "service"])(
    "Save permits an incomplete %s worksheet and preserves raw editing state",
    async (family) => {
      const user = userEvent.setup();
      await mount({ medalFamily: family });
      expect(button("Save")).toBeDisabled();
      expect(button("Download")).toBeDisabled();
      expect(button("Load")).toBeEnabled();
      await selectAward(
        user,
        family === "operation"
          ? "Army Commendation Medal"
          : "Defense Superior Service Medal",
      );
      enterWorksheetField("Recipient", "  unfinished search  ");
      enterWorksheetField("Narrative", "  unfinished\nprose  ");
      if (family === "service") {
        enterWorksheetField("Service Start Year", "20");
        await selectComboboxOption(user, "Service Start Month", "May");
        enterWorksheetField("Service End Year", "2026");
      }
      await saveNew(user, "  Café planning  ");
      const [saved] = await observer.list(family);
      const content = JSON.parse(
        (await observer.read(family, saved.id)).draftJSON,
      );
      expect(saved.name).toBe("Café planning");
      expect(content.recipients).toEqual([
        { kind: "search", query: "  unfinished search  " },
      ]);
      expect(content.values.narrative).toBe("  unfinished\nprose  ");
      if (family === "service")
        expect(content.values).toMatchObject({
          serviceStart: "20-05",
          serviceEnd: "2026-",
        });
      expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue(
        "  unfinished\nprose  ",
      );
      expect(preview()).not.toBeInTheDocument();
    },
  );

  test("Save keeps generated output, stores inputs only and does not register a recovery revision", async () => {
    const user = userEvent.setup();
    const saved = await seed();
    await mount();
    await load(user, saved.name);
    await submitRecommendation(user);
    const output = preview().textContent;
    const head = await flushRecovery();
    await openSave(user);
    expect(screen.getByLabelText("Draft name")).toHaveValue(saved.name);
    await user.click(button("Overwrite this draft"));
    expect(screen.getByText(/Overwrite saved draft/)).toHaveTextContent(
      saved.name,
    );
    await user.click(button("Cancel"));
    expect(await observer.read("operation", saved.id)).toEqual(saved);
    await overwrite(user);
    await closed();
    expect(preview()).toHaveTextContent(output);
    expect(await recovery.readHead("operation")).toEqual(head);
    const current = await observer.read("operation", saved.id);
    expect(current.revision).toBe(2);
    // Strict parsing rejects generated-output properties; saved values must
    // remain the editable worksheet inputs rather than the generated citation.
    expect(parseDraft(current.draftJSON, "operation")).toMatchObject({
      name: saved.name,
      values: state().values,
    });
    enterWorksheetField("Operation Title", "Fury");
    await overwrite(user);
    await closed();
    expect(
      JSON.parse((await observer.read("operation", saved.id)).draftJSON).values
        .operationTitle,
    ).toBe("Fury");
    expect(await observer.list("operation")).toHaveLength(1);
  });

  test("generated collision suggestions use the first numbered gap and never retry a confirmed collision", async () => {
    const user = userEvent.setup();
    const incomplete = state("operation", { entries: [], values: {} });
    for (const name of [
      "Draft - ARCOM",
      "Draft (1) - ARCOM",
      "Draft (3) - ARCOM",
    ])
      await seed(name, incomplete);
    await mount();
    await selectAward(user);
    await openSave(user);
    await waitFor(() =>
      expect(screen.getByLabelText("Draft name")).toHaveValue(
        "Draft (2) - ARCOM",
      ),
    );
    await seed("Draft (2) - ARCOM", incomplete);
    await user.click(button("Save new draft"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /already exists/i,
    );
    expect(await observer.list("operation")).toHaveLength(4);
    nameDraft("My separate plan");
    await user.click(button("Save new draft"));
    await closed();
    expect(
      (await observer.list("operation")).some(
        (draft) => draft.name === "My separate plan",
      ),
    ).toBe(true);
  });

  test("double-clicking separate copy only opens naming; explicit Save creates one independent copy", async () => {
    const user = userEvent.setup();
    const original = await seed();
    await mount();
    await load(user, original.name);
    await openSave(user);
    await waitFor(() => expect(button("Save as separate copy")).toBeEnabled());
    await user.dblClick(button("Save as separate copy"));
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByLabelText("Draft name")).toHaveValue("Stored plan (1)");
    expect(screen.getByLabelText("Draft name")).toHaveFocus();
    expect(await observer.list("operation")).toHaveLength(1);
    expect(await observer.read("operation", original.id)).toEqual(original);
    await user.click(button("Save new draft"));
    await closed();
    const records = await observer.list("operation");
    expect(records).toHaveLength(2);
    const copy = records.find((record) => record.id !== original.id);
    enterWorksheetField("Operation Title", "Copy edited");
    await overwrite(user);
    await closed();
    expect(await observer.read("operation", original.id)).toEqual(original);
    expect(
      JSON.parse((await observer.read("operation", copy.id)).draftJSON).values
        .operationTitle,
    ).toBe("Copy edited");
  });

  test("repeated Enter chooses overwrite without saving; Back preserves the draft until explicit confirmation", async () => {
    const user = userEvent.setup();
    const original = await seed();
    await mount();
    await load(user, original.name);
    enterWorksheetField("Operation Title", "Deliberately updated");
    await openSave(user);
    const chooseOverwrite = button("Overwrite this draft");
    for (
      let tab = 0;
      tab < 6 && document.activeElement !== chooseOverwrite;
      tab++
    )
      await user.tab();
    expect(chooseOverwrite).toHaveFocus();
    await user.keyboard("{Enter}{Enter}");
    expect(chooseOverwrite).not.toBeInTheDocument();
    expect(button("Confirm Overwrite")).toBeVisible();
    expect(button("Confirm Overwrite")).not.toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "Save new draft" }),
    ).not.toBeInTheDocument();
    expect(await observer.read("operation", original.id)).toEqual(original);
    await user.tab();
    expect(button("Back")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(button("Overwrite this draft")).toBeVisible();
    expect(await observer.read("operation", original.id)).toEqual(original);
    await user.click(button("Overwrite this draft"));
    await user.click(button("Confirm Overwrite"));
    await closed();
    const saved = await observer.read("operation", original.id);
    expect(saved.revision).toBe(2);
    expect(parseDraft(saved.draftJSON, "operation").values.operationTitle).toBe(
      "Deliberately updated",
    );
  });

  test("an edited copy name stays unchanged until explicit Save; Back and Cancel create nothing", async () => {
    const user = userEvent.setup();
    const original = await seed();
    await mount();
    await load(user, original.name);
    await openSave(user);
    await waitFor(() => expect(button("Save as separate copy")).toBeEnabled());
    await user.click(button("Save as separate copy"));
    await user.click(button("Back"));
    expect(await observer.list("operation")).toHaveLength(1);
    await user.click(button("Cancel"));
    await closed();
    expect(await observer.read("operation", original.id)).toEqual(original);
    await openSave(user);
    await waitFor(() => expect(button("Save as separate copy")).toBeEnabled());
    await user.click(button("Save as separate copy"));
    const name = screen.getByLabelText("Draft name");
    expect(name).toHaveFocus();
    await user.clear(name);
    await user.type(name, "Final version");
    await user.keyboard("{Enter}{Enter}");
    expect(name).toHaveValue("Final version");
    expect(
      screen.queryByRole("button", { name: "Save as separate copy" }),
    ).not.toBeInTheDocument();
    expect(await observer.list("operation")).toHaveLength(1);
    await user.click(button("Save new draft"));
    await closed();
    const records = await observer.list("operation");
    expect(records).toHaveLength(2);
    expect(records.find((record) => record.id !== original.id).name).toBe(
      "Final version",
    );
    expect(await observer.read("operation", original.id)).toEqual(original);
  });

  test("a pending overwrite cannot be submitted twice or redirected to another action", async () => {
    const original = await seed();
    const delayed = hold("overwrite");
    const user = userEvent.setup();
    await mount();
    await load(user, original.name);
    enterWorksheetField("Operation Title", "Confirmed update");
    await openSave(user);
    await user.click(button("Overwrite this draft"));
    await waitFor(() => expect(button("Confirm Overwrite")).toBeEnabled());
    await user.dblClick(button("Confirm Overwrite"));
    await delayed.entered.promise;
    expect(button("Confirm Overwrite")).toBeDisabled();
    expect(button("Back")).toBeDisabled();
    expect(screen.getByLabelText("Draft name")).toBeDisabled();
    await user.keyboard("{Enter}{Enter}");
    await user.click(button("Back"));
    expect(await observer.read("operation", original.id)).toEqual(original);
    await act(async () => delayed.release.resolve());
    await closed();
    const saved = await observer.read("operation", original.id);
    expect(saved.revision).toBe(2);
    expect(parseDraft(saved.draftJSON, "operation").values.operationTitle).toBe(
      "Confirmed update",
    );
    expect(await observer.list("operation")).toHaveLength(1);
  });

  test("confirmed current-record Rename advances its binding; cancel and Delete preserve the visible worksheet", async () => {
    const user = userEvent.setup();
    const saved = await seed();
    await mount();
    await load(user, saved.name);
    await submitRecommendation(user);
    const output = preview().textContent;
    await openLoad(user);
    await user.click(row(saved.name).getByRole("button", { name: "Rename" }));
    nameDraft("Canceled name");
    await user.click(button("Back to drafts"));
    expect(await observer.read("operation", saved.id)).toEqual(saved);
    await user.click(row(saved.name).getByRole("button", { name: "Rename" }));
    expect(screen.getByLabelText("Draft name")).toHaveFocus();
    nameDraft("Renamed plan");
    await user.click(button("Confirm Rename"));
    await screen.findByRole("listitem", { name: "Renamed plan" });
    await user.click(button("Cancel"));
    expect(preview()).toHaveTextContent(output);
    await overwrite(user);
    await closed();
    expect((await observer.read("operation", saved.id)).revision).toBe(3);
    await openLoad(user);
    await user.click(
      row("Renamed plan").getByRole("button", { name: "Delete" }),
    );
    await user.click(button("Back to drafts"));
    expect(await observer.list("operation")).toHaveLength(1);
    await user.click(
      row("Renamed plan").getByRole("button", { name: "Delete" }),
    );
    await user.click(button("Confirm Delete"));
    await screen.findByText(/No saved drafts/);
    await user.click(button("Cancel"));
    expect(preview()).toHaveTextContent(output);
    expect(screen.getByLabelText("Operation Title")).toHaveValue("Overlord");
    await openSave(user);
    expect(button("Save new draft")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Overwrite this draft" }),
    ).not.toBeInTheDocument();
  });

  test("refreshing the list and renaming a newer revision cannot authorize a stale worksheet overwrite", async () => {
    const user = userEvent.setup();
    const original = await seed();
    await mount();
    await load(user, original.name);
    const remote = await observer.overwrite(
      "operation",
      original.id,
      1,
      serializeDraft(
        state("operation", { values: { operationTitle: "Remote Fury" } }),
      ),
      "Remote plan",
    );
    await openLoad(user);
    await user.click(row(remote.name).getByRole("button", { name: "Rename" }));
    nameDraft("Renamed remote");
    await user.click(button("Confirm Rename"));
    await screen.findByRole("listitem", { name: "Renamed remote" });
    await user.click(button("Cancel"));
    await overwrite(user);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /changed in another tab/i,
    );
    const current = await observer.read("operation", original.id);
    expect(current.revision).toBe(3);
    expect(JSON.parse(current.draftJSON).values.operationTitle).toBe(
      "Remote Fury",
    );
    expect(screen.getByLabelText("Operation Title")).toHaveValue("Overlord");
  });

  test.each(["Rename", "Delete"])(
    "stale %s confirmation leaves saved content, worksheet and output intact",
    async (action) => {
      const user = userEvent.setup();
      const saved = await seed();
      await mount();
      await load(user, saved.name);
      await submitRecommendation(user);
      const output = preview().textContent;
      await openLoad(user);
      await user.click(row(saved.name).getByRole("button", { name: action }));
      const remote = await observer.rename(
        "operation",
        saved.id,
        1,
        "Remote rename",
      );
      if (action === "Rename") nameDraft("Stale rename");
      await user.click(button(`Confirm ${action}`));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        /changed in another tab/i,
      );
      await user.click(button("Cancel"));
      expect(await observer.read("operation", saved.id)).toEqual(remote);
      expect(preview()).toHaveTextContent(output);
    },
  );

  test.each(["change", "delete"])(
    "Load rechecks the selected record after a remote %s during replacement confirmation",
    async (action) => {
      const user = userEvent.setup();
      const saved = await seed();
      await mount();
      await selectAward(user);
      enterWorksheetField("Operation Title", "Local work");
      await openLoad(user);
      await user.click(
        row(saved.name).getByRole("button", { name: "Load draft" }),
      );
      await screen.findByRole("button", { name: "Replace Worksheet" });
      if (action === "change")
        await observer.rename("operation", saved.id, 1, "Changed");
      else await observer.remove("operation", saved.id, 1);
      await user.click(button("Replace Worksheet"));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        action === "change" ? /changed in another tab/i : /no longer exists/i,
      );
      expect(screen.getByLabelText("Operation Title")).toHaveValue(
        "Local work",
      );
    },
  );

  test("named loading uses the current roster and preserves missing identities and unfinished searches", async () => {
    const user = userEvent.setup();
    const missing = makeRecipient({
      user: { userId: "missing", username: "Absent.A" },
    });
    const saved = await seed(
      "Roster check",
      state("operation", {
        entries: [
          { member, query: "Old Kenton" },
          { member: missing, query: "Absent.A" },
          { member: null, query: "unfinished" },
        ],
      }),
    );
    const current = makeRecipient({
      ...member,
      profileId: "new-profile",
      user: { ...member.user, username: "Current.W" },
    });
    await mount({ roster: [current] });
    await load(user, saved.name);
    expect(screen.getByText(/Recipient Not Found/i)).toBeVisible();
    const recipients = screen.getAllByRole("textbox", {
      name: /^Recipient \d+$/,
    });
    expect(recipients.map((input) => input.value)).toEqual([
      "Current.W",
      "Absent.A",
      "unfinished",
    ]);
    await submitRecommendation(user);
    expect(preview()).not.toBeInTheDocument();
    await overwrite(user);
    await closed();
    expect(
      JSON.parse((await observer.read("operation", saved.id)).draftJSON)
        .recipients,
    ).toMatchObject([
      { identity: { userId: "9397" }, snapshot: { username: "Current.W" } },
      { identity: { userId: "missing" }, snapshot: { username: "Absent.A" } },
      { kind: "search", query: "unfinished" },
    ]);
  });

  test.each(["file import", "recovery reload"])(
    "%s restores a name without gaining browser-record overwrite authority",
    async (source) => {
      const user = userEvent.setup();
      const saved = await seed();
      const rendered = await mount();
      await load(user, saved.name);
      if (source === "file import")
        await importFile(user, { ...state(), name: saved.name });
      else {
        await flushRecovery();
        rendered.unmount();
        await mount();
        expect(screen.getByLabelText("Operation Title")).toHaveValue(
          "Overlord",
        );
      }
      await openSave(user);
      await waitFor(() =>
        expect(screen.getByLabelText("Draft name")).toHaveValue(
          "Stored plan (1)",
        ),
      );
      expect(
        screen.queryByRole("button", { name: "Overwrite this draft" }),
      ).not.toBeInTheDocument();
      await user.click(button("Save new draft"));
      await closed();
      expect(await observer.read("operation", saved.id)).toEqual(saved);
      expect(await observer.list("operation")).toHaveLength(2);
    },
  );

  test("separate Save and named Load preserve a recovery conflict, while Clear never deletes named drafts", async () => {
    const user = userEvent.setup();
    const saved = await seed();
    await mount();
    await load(user, saved.name);
    await flushRecovery();
    const token = await recovery.register(
      "operation",
      await recovery.readHead("operation"),
    );
    await recovery.commit(
      token,
      serializeDraft(
        state("operation", { values: { operationTitle: "Newer recovery" } }),
      ),
    );
    const remote = await recovery.read("operation");
    fireEvent(window, new Event("focus"));
    await waitFor(() =>
      expect(feedback()).toHaveTextContent(/another tab.*Download/i),
    );
    await openSave(user);
    await waitFor(() => expect(button("Save as separate copy")).toBeEnabled());
    await user.click(button("Save as separate copy"));
    nameDraft("Rescued local work");
    await user.click(button("Save new draft"));
    await closed();
    expect(feedback()).toHaveTextContent(/another tab/i);
    expect(button("Download")).toBeEnabled();
    await load(user, saved.name, true);
    expect(feedback()).toHaveTextContent(/another tab/i);
    expect(await recovery.read("operation")).toEqual(remote);
    await clear(user);
    expect(screen.getByLabelText("Operation Title")).toHaveValue("");
    expect(screen.getByLabelText("Recipient", { exact: true })).toHaveValue("");
    expect(await observer.list("operation")).toHaveLength(2);
    expect(await recovery.read("operation")).toEqual(remote);
    await openSave(user);
    expect(button("Save new draft")).toBeVisible();
  });

  test("repeated pending Save creates one confirmation snapshot without reverting a later ordinary edit", async () => {
    const delayed = hold("create");
    const user = userEvent.setup();
    await mount();
    await selectAward(user);
    enterWorksheetField("Operation Title", "At confirmation");
    await openSave(user);
    nameDraft("Snapshot");
    await waitFor(() => expect(button("Save new draft")).toBeEnabled());
    await user.dblClick(button("Save new draft"));
    await delayed.entered.promise;
    expect(button("Save new draft")).toBeDisabled();
    await user.keyboard("{Enter}{Enter}");
    enterWorksheetField("Operation Title", "Later edit");
    await act(async () => delayed.release.resolve());
    await closed();
    const records = await observer.list("operation");
    expect(records).toHaveLength(1);
    const [saved] = records;
    expect(
      JSON.parse((await observer.read("operation", saved.id)).draftJSON).values
        .operationTitle,
    ).toBe("At confirmation");
    expect(screen.getByLabelText("Operation Title")).toHaveValue("Later edit");
    await openSave(user);
    expect(button("Overwrite this draft")).toBeVisible();
  });

  test.each(["Clear", "file import", "named Load", "unmount"])(
    "a late Save cannot bind after %s replaces the active worksheet session",
    async (replacement) => {
      const target = await seed("Next worksheet");
      const delayed = hold("create", true);
      const user = userEvent.setup();
      const rendered = await mount();
      await selectAward(user);
      enterWorksheetField("Operation Title", "Old worksheet");
      await openSave(user);
      nameDraft("Old save");
      await waitFor(() => expect(button("Save new draft")).toBeEnabled());
      await user.click(button("Save new draft"));
      await delayed.entered.promise;
      await user.click(button("Cancel"));
      if (replacement === "Clear") {
        await clear(user);
        await selectAward(user);
      } else if (replacement === "file import")
        await importFile(
          user,
          state("operation", {
            values: { operationTitle: "Imported replacement" },
          }),
        );
      else if (replacement === "named Load")
        await load(user, target.name, true);
      else rendered.unmount();
      await act(async () => delayed.release.resolve());
      expect(await observer.list("operation")).toHaveLength(2);
      if (replacement === "unmount") {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        return;
      }
      await openSave(user);
      if (replacement === "named Load")
        expect(screen.getByLabelText("Draft name")).toHaveValue(target.name);
      else
        expect(
          screen.queryByRole("button", { name: "Overwrite this draft" }),
        ).not.toBeInTheDocument();
      expect(screen.getByLabelText("Operation Title")).not.toHaveValue(
        "Old worksheet",
      );
    },
  );

  test.each(["read", "rename", "remove"])(
    "a delayed named %s result cannot affect a subsequently imported worksheet",
    async (method) => {
      const saved = await seed();
      const delayed = hold(method, true);
      const user = userEvent.setup();
      await mount();
      await selectAward(user);
      await openLoad(user);
      await user.click(
        row(saved.name).getByRole("button", {
          name:
            method === "read"
              ? "Load draft"
              : method === "rename"
                ? "Rename"
                : "Delete",
        }),
      );
      if (method !== "read") {
        if (method === "rename") nameDraft("Late renamed");
        await user.click(
          button(method === "rename" ? "Confirm Rename" : "Confirm Delete"),
        );
      }
      await delayed.entered.promise;
      await user.click(button("Cancel"));
      await importFile(
        user,
        state("operation", {
          values: { operationTitle: "Replacement survives" },
        }),
      );
      await act(async () => delayed.release.resolve());
      expect(screen.getByLabelText("Operation Title")).toHaveValue(
        "Replacement survives",
      );
      await openSave(user);
      expect(
        screen.queryByRole("button", { name: "Overwrite this draft" }),
      ).not.toBeInTheDocument();
    },
  );

  test("invalid saved content cannot replace the worksheet; a valid replacement clears output and updates recovery", async () => {
    const user = userEvent.setup();
    const original = await seed();
    const broken = await seed("Corrupt plan");
    const valid = await seed(
      "Replacement",
      state("operation", { values: { operationTitle: "Replacement Fury" } }),
    );
    const db = await new Promise((resolve) => {
      const request = indexedDB.open(namedStorage.NAMED_DRAFT_DATABASE, 1);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
      tx.objectStore("drafts").put({ ...broken, draftJSON: "{broken" });
    });
    db.close();
    await mount();
    await load(user, original.name);
    await submitRecommendation(user);
    const output = preview().textContent;
    await openLoad(user);
    expect(
      row(broken.name).getByRole("button", { name: "Load draft" }),
    ).toBeDisabled();
    expect(
      row(broken.name).getByRole("button", { name: "Rename" }),
    ).toBeDisabled();
    expect(
      row(broken.name).getByRole("button", { name: "Delete" }),
    ).toBeEnabled();
    await user.click(button("Cancel"));
    expect(preview()).toHaveTextContent(output);
    await load(user, valid.name, true);
    expect(preview()).not.toBeInTheDocument();
    expect(screen.getByLabelText("Operation Title")).toHaveValue(
      "Replacement Fury",
    );
    await flushRecovery();
    expect((await recovery.read("operation")).draft.values.operationTitle).toBe(
      "Replacement Fury",
    );
  });

  test("unavailable named storage leaves file Import and Download functional", async () => {
    const original = indexedDB.open.bind(indexedDB);
    vi.spyOn(indexedDB, "open").mockImplementation((name, version) => {
      if (name === namedStorage.NAMED_DRAFT_DATABASE)
        throw new DOMException("Named storage denied", "SecurityError");
      return original(name, version);
    });
    const user = userEvent.setup();
    await mount();
    await selectAward(user);
    await importFile(user, state());
    expect(screen.getByLabelText("Operation Title")).toHaveValue("Overlord");
    await user.click(button("Download"));
    expect(downloaded).toBeInstanceOf(Blob);
    await openSave(user);
    await waitFor(() => expect(button("Save new draft")).toBeEnabled());
    await user.click(button("Save new draft"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/denied/i);
    expect(screen.getByLabelText("Operation Title")).toHaveValue("Overlord");
  });
});
