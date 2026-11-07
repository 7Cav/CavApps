import { IDBFactory, IDBObjectStore, forceCloseDatabase } from "fake-indexeddb";
import {
  createRecoveryStore,
  RECOVERY_DATABASE,
} from "../lib/worksheet-recovery-store";
import { MAX_DRAFT_BYTES, serializeDraft } from "../lib/recommendation-drafts";

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
      const result = (queues.get(name) ?? Promise.resolve()).then(callback);
      queues.set(
        name,
        result.catch(() => {}),
      );
      return result;
    },
  };
}

function state(family = "operation", title = "Overlord") {
  return {
    medalFamily: family,
    medalId:
      family === "operation"
        ? "army-commendation-medal"
        : "army-achievement-medal",
    entries: [{ query: "unfinished", member: null }],
    values:
      family === "operation"
        ? { operationTitle: title }
        : { affectedArea: title },
  };
}

let factory;
let locks;
let stores;
let databases;
beforeEach(() => {
  factory = new IDBFactory();
  locks = lockQueue();
  stores = [];
  databases = [];
});
afterEach(() => {
  stores.forEach((store) => store.close());
  databases.forEach((db) => db.close());
  vi.restoreAllMocks();
});
function client(options = {}) {
  const store = createRecoveryStore({ indexedDB: factory, locks, ...options });
  stores.push(store);
  return store;
}
async function raw(name, family, value) {
  const db = await new Promise((resolve, reject) => {
    const request = factory.open(RECOVERY_DATABASE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  databases.push(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      name,
      value === undefined ? "readonly" : "readwrite",
    );
    const request =
      value === undefined
        ? tx.objectStore(name).get(family)
        : tx.objectStore(name).put(value, family);
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error);
  });
}
async function save(store, draft = state()) {
  const token = await store.register(draft.medalFamily);
  await store.commit(token, serializeDraft(draft));
  return token;
}

describe("Browser worksheet recovery storage", () => {
  test("an aborted registration leaves the head unchanged and releases the edit queue", async () => {
    const store = client();
    const saved = await save(store);
    const original = IDBObjectStore.prototype.put;
    const failing = vi
      .spyOn(IDBObjectStore.prototype, "put")
      .mockImplementation(function (...args) {
        const request = original.apply(this, args);
        request.addEventListener("success", () => this.transaction.abort());
        return request;
      });
    await expect(store.register("operation")).rejects.toThrow(/abort/i);
    expect((await store.read("operation")).head).toEqual(saved);
    failing.mockRestore();
    expect((await store.register("operation")).revision).toBe(
      saved.revision + 1,
    );
  });

  test("unexpected connection closure reports unavailability without losing saved work", async () => {
    let connection;
    const open = factory.open.bind(factory);
    vi.spyOn(factory, "open").mockImplementation((...args) => {
      const request = open(...args);
      request.addEventListener("success", () => {
        connection = request.result;
      });
      return request;
    });
    const unavailable = deferred();
    const store = client({ onUnavailable: unavailable.resolve });
    await save(store);
    forceCloseDatabase(connection);
    expect((await unavailable.promise).message).toMatch(/closed unexpectedly/i);
    await expect(store.register("operation")).rejects.toThrow(/closed/i);
    expect((await client().read("operation")).draft.values.operationTitle).toBe(
      "Overlord",
    );
  });

  test("version changes close the old connection so an upgrade can finish without replacing work", async () => {
    const unavailable = deferred();
    const store = client({ onUnavailable: unavailable.resolve });
    await save(store);
    const upgrade = factory.open(RECOVERY_DATABASE, 2);
    const upgraded = new Promise((resolve, reject) => {
      upgrade.onsuccess = () => resolve(upgrade.result);
      upgrade.onerror = () => reject(upgrade.error);
    });
    expect((await unavailable.promise).message).toMatch(/changed.*reload/i);
    const db = await upgraded;
    db.close();
    await expect(store.register("operation")).rejects.toThrow(/reload/i);
    expect(
      JSON.parse((await raw("recoverySnapshots", "operation")).draftJSON).values
        .operationTitle,
    ).toBe("Overlord");
  });

  test("initialization creates empty family slots; reads create no revisions", async () => {
    const store = client();
    expect(await store.read("operation")).toMatchObject({
      head: undefined,
      snapshot: undefined,
      interrupted: false,
    });
    expect(await store.read("service")).toMatchObject({
      head: undefined,
      snapshot: undefined,
    });
    expect(await raw("recoveryHeads", "operation")).toBeUndefined();
  });

  test("two connections assign distinct ordered revisions and reject delayed older payloads", async () => {
    const first = client();
    const second = client();
    const barrier = deferred();
    const holding = locks.request(
      "cavapps-medal-recovery:operation",
      {},
      () => barrier.promise,
    );
    const old = first.register("operation");
    const newer = second.register("operation");
    barrier.resolve();
    await holding;
    const [a, b] = await Promise.all([old, newer]);
    expect([a.revision, b.revision]).toEqual([1, 2]);
    expect(a.editId).not.toBe(b.editId);
    await second.commit(b, serializeDraft(state("operation", "Fury")));
    expect(await first.commit(a, serializeDraft(state()))).toBe(false);
    expect((await first.read("operation")).draft.values.operationTitle).toBe(
      "Fury",
    );
  });

  test("edit admission precedes a delayed database open", async () => {
    const opened = deferred();
    const release = deferred();
    const first = client({
      indexedDB: {
        open(...args) {
          const request = factory.open(...args);
          return new Proxy(request, {
            set(target, key, value) {
              target[key] =
                key === "onsuccess"
                  ? (event) => {
                      opened.resolve();
                      void release.promise.then(() => value(event));
                    }
                  : value;
              return true;
            },
          });
        },
      },
    });
    const second = client();
    await second.read("operation");
    const old = first.register("operation");
    await opened.promise;
    const newer = second.register("operation");
    release.resolve();
    expect((await old).revision).toBe(1);
    expect((await newer).revision).toBe(2);
  });

  test("clock ties and reversal do not affect ordering or the other family", async () => {
    const store = client();
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    const a = await save(store);
    const service = await save(store, state("service", "Training"));
    const b = await save(store, state("operation", "Fury"));
    clock.mockReturnValue(1);
    const c = await save(store, state("operation", "Torch"));
    expect([a.revision, b.revision, c.revision, service.revision]).toEqual([
      1, 2, 3, 1,
    ]);
    expect((await store.read("service")).draft.values.affectedArea).toBe(
      "Training",
    );
  });

  test("a registered but interrupted edit retains the last completed snapshot", async () => {
    const first = client();
    const saved = await save(first);
    const pending = await first.register("operation");
    first.close();
    const result = await client().read("operation");
    expect(result.head.revision).toBe(pending.revision);
    expect(result.snapshot.revision).toBe(saved.revision);
    expect(result.draft.values.operationTitle).toBe("Overlord");
    expect(result.interrupted).toBe(true);
  });

  test("a first interrupted edit retains its head without inventing an empty payload", async () => {
    const store = client();
    const token = await store.register("service");
    expect(await store.read("service")).toMatchObject({
      head: token,
      snapshot: undefined,
      draft: undefined,
      interrupted: true,
    });
  });

  test("duplicate identifiers and conflicting retries cannot change completed work", async () => {
    const store = client({ newEditId: () => "same-edit" });
    const token = await save(store);
    expect(await store.commit(token, serializeDraft(state()))).toBe(true);
    await expect(store.register("operation")).rejects.toThrow(/identifier/i);
    await expect(
      store.commit(token, serializeDraft(state("operation", "Changed"))),
    ).rejects.toThrow(/conflicting/i);
    expect((await store.read("operation")).draft.values.operationTitle).toBe(
      "Overlord",
    );
  });

  test.each(["recoveryHeads", "recoverySnapshots"])(
    "unknown versions in %s remain untouched",
    async (name) => {
      const store = client();
      await save(store);
      const original = await raw(name, "operation");
      const unknown = { ...original, version: 99 };
      await raw(name, "operation", unknown);
      await expect(store.read("operation")).rejects.toThrow(/version/i);
      await expect(store.clear(state())).rejects.toThrow(/version/i);
      expect(await raw(name, "operation")).toEqual(unknown);
    },
  );

  test.each([
    { draftJSON: "{" },
    { draftJSON: "{}" },
    { editId: "conflicting-id" },
    { revision: 9 },
  ])("rejects malformed or inconsistent stored recovery: %j", async (patch) => {
    const store = client();
    await save(store);
    const saved = await raw("recoverySnapshots", "operation");
    await raw("recoverySnapshots", "operation", { ...saved, ...patch });
    await expect(store.read("operation")).rejects.toThrow();
    expect(await raw("recoverySnapshots", "operation")).toEqual({
      ...saved,
      ...patch,
    });
  });

  test("request success followed by transaction abort does not replace a completed snapshot", async () => {
    const store = client();
    await save(store);
    const token = await store.register("operation");
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
      ...args
    ) {
      const request = original.apply(this, args);
      request.addEventListener("success", () => this.transaction.abort());
      return request;
    });
    await expect(
      store.commit(token, serializeDraft(state("operation", "Fury"))),
    ).rejects.toThrow(/abort/i);
    expect((await store.read("operation")).draft.values.operationTitle).toBe(
      "Overlord",
    );
    expect((await store.read("operation")).interrupted).toBe(true);
  });

  test("a failed Clear leaves both prior head and snapshot intact", async () => {
    const store = client();
    await save(store);
    const before = await store.read("operation");
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
      ...args
    ) {
      const request = original.apply(this, args);
      if (this.name === "recoverySnapshots")
        request.addEventListener("success", () => this.transaction.abort());
      return request;
    });
    await expect(
      store.clear({ ...state(), values: {}, entries: [] }),
    ).rejects.toThrow();
    expect(await store.read("operation")).toEqual(before);
  });

  test("Clear is an atomic ordering barrier; later genuine edits remain allowed", async () => {
    const a = client();
    const b = client();
    await save(a);
    await save(a, state("service", "Training"));
    const old = await a.register("operation");
    const clear = await b.clear({
      ...state(),
      values: {},
      entries: [{ query: "", member: null }],
    });
    expect(await a.commit(old, serializeDraft(state()))).toBe(false);
    const result = await a.read("operation");
    expect(result.head).toEqual(clear);
    expect(result.snapshot.revision).toBe(clear.revision);
    expect(result.draft.medalId).toBe("army-commendation-medal");
    expect(result.draft.values.operationTitle).toBe("");
    expect(result.interrupted).toBe(false);
    expect((await a.read("service")).draft.values.affectedArea).toBe(
      "Training",
    );
    await save(a, state("operation", "New deliberate edit"));
    expect((await b.read("operation")).draft.values.operationTitle).toBe(
      "New deliberate edit",
    );
  });

  test("quota and size failures retain completed work without truncation", async () => {
    const store = client();
    await save(store);
    const token = await store.register("operation");
    await expect(
      store.commit(token, "é".repeat(MAX_DRAFT_BYTES)),
    ).rejects.toThrow(/1 MiB/i);
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
      throw new DOMException("Quota exhausted", "QuotaExceededError");
    });
    await expect(
      store.commit(token, serializeDraft(state("operation", "Fury"))),
    ).rejects.toThrow(/quota/i);
    expect((await store.read("operation")).draft.values.operationTitle).toBe(
      "Overlord",
    );
  });

  test("unavailable APIs and denied database opens fail explicitly", async () => {
    expect(() => client({ locks: undefined })).toThrow(/unavailable/i);
    const denied = client({
      indexedDB: {
        open() {
          throw new DOMException("Denied", "SecurityError");
        },
      },
    });
    await expect(denied.read("operation")).rejects.toThrow(/denied/i);
  });

  test("a newer database version is not downgraded", async () => {
    const request = factory.open(RECOVERY_DATABASE, 2);
    const db = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    await expect(client().read("operation")).rejects.toThrow();
    const reopened = factory.open(RECOVERY_DATABASE);
    await new Promise((resolve) => {
      reopened.onsuccess = resolve;
    });
    expect(reopened.result.version).toBe(2);
    reopened.result.close();
  });

  test("a blocked open reports failure and closes a late successful connection", async () => {
    const pending = {};
    const close = vi.fn();
    const store = client({ indexedDB: { open: () => pending } });
    const reading = store.read("operation");
    pending.onblocked();
    await expect(reading).rejects.toThrow(/blocked/i);
    pending.result = { close };
    pending.onsuccess();
    expect(close).toHaveBeenCalled();
    await expect(store.register("operation")).rejects.toThrow(/blocked/i);
  });
});
