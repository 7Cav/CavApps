import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import {
  createNamedDraftStore,
  NAMED_DRAFT_DATABASE,
} from "../lib/named-draft-store";
import {
  MAX_DRAFT_BYTES,
  parseDraft,
  serializeDraft,
} from "../lib/recommendation-drafts";

const payload = (family = "operation", values = {}) =>
  serializeDraft({
    medalFamily: family,
    medalId:
      family === "operation"
        ? "army-commendation-medal"
        : "army-achievement-medal",
    entries: [{ member: null, query: "unfinished search" }],
    values,
  });
let factory;
let stores;
function client(options = {}) {
  const store = createNamedDraftStore({ indexedDB: factory, ...options });
  stores.push(store);
  return store;
}
async function rawDatabase() {
  return new Promise((resolve, reject) => {
    const request = factory.open(NAMED_DRAFT_DATABASE, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function putRaw(record) {
  const db = await rawDatabase();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
      tx.objectStore("drafts").put(record);
    });
  } finally {
    db.close();
  }
}
beforeEach(() => {
  factory = new IDBFactory();
  stores = [];
});
afterEach(() => {
  stores.forEach((store) => store.close());
  vi.restoreAllMocks();
});

describe("Named browser draft storage", () => {
  test("initializes the dedicated database, UUID key and family indexes", async () => {
    const store = client();
    const record = await store.create("operation", payload(), " First draft ");
    expect(record).toMatchObject({
      schemaVersion: 1,
      name: "First draft",
      nameKey: "first draft",
      revision: 1,
    });
    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await store.read("operation", record.id)).toEqual(record);
    expect(JSON.parse(record.draftJSON).name).toBe("First draft");
    const db = await rawDatabase();
    const objectStore = db.transaction("drafts").objectStore("drafts");
    expect(db.version).toBe(1);
    expect([...db.objectStoreNames]).toEqual(["drafts"]);
    expect(objectStore.keyPath).toBe("id");
    expect(objectStore.index("familyName").keyPath).toEqual([
      "medalFamily",
      "nameKey",
    ]);
    expect(objectStore.index("familyName").unique).toBe(true);
    expect(objectStore.index("familyModified").keyPath).toEqual([
      "medalFamily",
      "modifiedAt",
    ]);
    db.close();
  });

  test("lists multiple drafts by modification time with deterministic ties and isolated families", async () => {
    let time = 10;
    const store = client({ now: () => time });
    const a = await store.create("operation", payload(), "Same name");
    const b = await store.create("operation", payload(), "Second");
    await store.create("service", payload("service"), "Same name");
    expect((await store.list("operation")).map((row) => row.id)).toEqual(
      [a.id, b.id].sort(),
    );
    time = 20;
    const renamed = await store.rename(
      "operation",
      a.id,
      a.revision,
      "Changed",
    );
    expect(renamed).toMatchObject({
      id: a.id,
      createdAt: 10,
      modifiedAt: 20,
      revision: 2,
    });
    expect((await store.list("operation")).map((row) => row.name)).toEqual([
      "Changed",
      "Second",
    ]);
    expect((await store.list("service")).map((row) => row.name)).toEqual([
      "Same name",
    ]);
    await expect(store.read("service", a.id)).rejects.toMatchObject({
      code: "invalid",
    });
  });

  test("normalized names collide atomically across independent connections", async () => {
    const a = client();
    const b = client();
    const results = await Promise.allSettled([
      a.create("operation", payload(), " Café "),
      b.create("operation", payload(), "CAFE\u0301"),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === "rejected").reason.code,
    ).toBe("duplicate");
    expect(await a.list("operation")).toHaveLength(1);
  });

  test("overwrite retains identity, increments revision and rejects competing stale writers", async () => {
    const a = client();
    const b = client();
    const saved = await a.create("operation", payload(), "Original");
    const results = await Promise.allSettled([
      a.overwrite(
        "operation",
        saved.id,
        1,
        payload("operation", { operationTitle: "Overlord" }),
        "Original",
      ),
      b.overwrite(
        "operation",
        saved.id,
        1,
        payload("operation", { operationTitle: "Fury" }),
        "Original",
      ),
    ]);
    const winners = results.filter((result) => result.status === "fulfilled");
    expect(winners).toHaveLength(1);
    expect(
      results.find((result) => result.status === "rejected").reason.code,
    ).toBe("conflict");
    const current = await a.read("operation", saved.id);
    expect(current).toEqual(winners[0].value);
    expect(current).toMatchObject({
      id: saved.id,
      revision: 2,
      createdAt: saved.createdAt,
    });
    await expect(
      b.rename("operation", saved.id, 1, "Stale rename"),
    ).rejects.toMatchObject({ code: "conflict" });
    await expect(b.remove("operation", saved.id, 1)).rejects.toMatchObject({
      code: "conflict",
    });
    await expect(b.read("operation", saved.id, 1)).rejects.toMatchObject({
      code: "conflict",
    });
    expect(await a.read("operation", saved.id)).toEqual(current);
  });

  test("rename changes only name metadata and deletion never permits stale resurrection", async () => {
    const store = client();
    const saved = await store.create(
      "operation",
      payload("operation", { narrative: "  unfinished\nprose  " }),
      "Before",
    );
    const renamed = await store.rename("operation", saved.id, 1, " After ");
    expect(JSON.parse(renamed.draftJSON)).toEqual({
      ...JSON.parse(saved.draftJSON),
      name: "After",
    });
    expect(renamed.id).toBe(saved.id);
    await expect(
      store.overwrite("operation", saved.id, 1, payload(), "Before"),
    ).rejects.toMatchObject({ code: "conflict" });
    await store.remove("operation", renamed.id, 2);
    await expect(
      store.overwrite("operation", saved.id, 2, payload(), "After"),
    ).rejects.toMatchObject({ code: "missing" });
    await expect(
      store.rename("operation", saved.id, 2, "After"),
    ).rejects.toMatchObject({ code: "missing" });
    await expect(store.remove("operation", saved.id, 2)).rejects.toMatchObject({
      code: "missing",
    });
    expect(await store.list("operation")).toEqual([]);
    const copy = await store.create("operation", payload(), "After");
    expect(copy.id).not.toBe(saved.id);
  });

  test.each(["rename", "overwrite"])(
    "%s cannot take another record's name or damage either record",
    async (method) => {
      const store = client();
      const a = await store.create("operation", payload(), "Alpha");
      const b = await store.create("operation", payload(), "Bravo");
      const args = method === "rename" ? ["BRAVO"] : [payload(), "BRAVO"];
      await expect(
        store[method]("operation", a.id, 1, ...args),
      ).rejects.toMatchObject({ code: "duplicate" });
      expect(await store.read("operation", a.id)).toEqual(a);
      expect(await store.read("operation", b.id)).toEqual(b);
    },
  );

  test.each(["abort", "quota"])(
    "a transaction %s is not reported as a committed save",
    async (failure) => {
      const store = client();
      const saved = await store.create("operation", payload(), "Safe");
      const put = IDBObjectStore.prototype.put;
      vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
        ...args
      ) {
        if (failure === "quota")
          throw new DOMException("Storage is full", "QuotaExceededError");
        const request = put.apply(this, args);
        request.addEventListener("success", () => this.transaction.abort());
        return request;
      });
      await expect(
        store.overwrite(
          "operation",
          saved.id,
          1,
          payload("operation", { narrative: "Must not survive" }),
          "Safe",
        ),
      ).rejects.toMatchObject({
        name: failure === "quota" ? "QuotaExceededError" : "Error",
      });
      expect(await store.read("operation", saved.id)).toEqual(saved);
    },
  );

  test("unavailable, denied and newer database versions report failures without fallback", async () => {
    await expect(client({ indexedDB: null }).list("operation")).rejects.toThrow(
      /unavailable/i,
    );
    await expect(
      client({
        indexedDB: {
          open() {
            throw new DOMException("Denied", "SecurityError");
          },
        },
      }).list("operation"),
    ).rejects.toThrow(/denied/i);
    const db = await new Promise((resolve) => {
      const request = factory.open(NAMED_DRAFT_DATABASE, 2);
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    await expect(client().list("operation")).rejects.toMatchObject({
      name: "VersionError",
    });
  });

  test("corrupt and unsupported records remain reported alongside valid drafts without silent repair", async () => {
    const store = client();
    const good = await store.create("operation", payload(), "Good");
    const corrupt = await store.create("operation", payload(), "Bad payload");
    const future = await store.create("operation", payload(), "Future");
    const broken = await store.create(
      "operation",
      payload(),
      "Missing index key",
    );
    await putRaw({ ...corrupt, draftJSON: "{broken" });
    await putRaw({ ...future, schemaVersion: 2 });
    await putRaw({ ...broken, modifiedAt: undefined });
    const rows = await store.list("operation");
    expect(rows).toHaveLength(4);
    expect(rows.find((row) => row.id === good.id).error).toBeUndefined();
    expect(rows.filter((row) => row.error)).toHaveLength(3);
    expect(rows.find((row) => row.id === corrupt.id).canDelete).toBe(true);
    expect(rows.find((row) => row.id === future.id).canDelete).toBe(false);
    await expect(store.read("operation", corrupt.id)).rejects.toThrow();
    await expect(
      store.overwrite("operation", corrupt.id, 1, payload(), "Bad payload"),
    ).rejects.toThrow();
    await expect(store.read("operation", future.id)).rejects.toMatchObject({
      code: "unsupported",
    });
    await expect(store.remove("operation", broken.id, 1)).rejects.toMatchObject(
      { code: "invalid" },
    );
    await store.remove("operation", corrupt.id, 1);
    expect(await store.read("operation", good.id)).toEqual(good);
    expect(await store.list("operation")).toHaveLength(3);
  });

  test("a larger name cannot bypass the encoded byte limit or damage a nearly full draft", async () => {
    const store = client();
    const empty = JSON.parse(payload());
    const base = { ...empty, name: "x" };
    const overhead = new TextEncoder().encode(
      JSON.stringify(base, null, 2) + "\n",
    ).length;
    base.values.narrative = "a".repeat(MAX_DRAFT_BYTES - overhead);
    const saved = await store.create("operation", JSON.stringify(base), "x");
    expect(new TextEncoder().encode(saved.draftJSON).length).toBe(
      MAX_DRAFT_BYTES,
    );
    await expect(store.rename("operation", saved.id, 1, "xx")).rejects.toThrow(
      /1 MiB/,
    );
    expect(await store.read("operation", saved.id)).toEqual(saved);
    expect(() => store.create("operation", saved.draftJSON, "xx")).toThrow(
      /1 MiB/,
    );
    expect(parseDraft(saved.draftJSON, "operation").values.narrative).toBe(
      base.values.narrative,
    );
  });
});
