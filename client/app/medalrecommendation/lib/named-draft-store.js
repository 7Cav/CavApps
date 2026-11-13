import {
  draftNameKey,
  normalizeDraftName,
  parseDraft,
  withDraftName,
} from "./recommendation-drafts";

export const NAMED_DRAFT_DATABASE = "cavapps-medal-drafts";
const STORE = "drafts";

export class NamedDraftError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "NamedDraftError";
    this.code = code;
  }
}

function checkFamily(family) {
  if (!["operation", "service"].includes(family))
    throw new Error("Unsupported medal family.");
}

function checkRecord(record, family, id = record?.id) {
  if (!record)
    throw new NamedDraftError(
      "missing",
      "This saved draft no longer exists. Save your worksheet as a separate copy.",
    );
  if (record.schemaVersion !== 1)
    throw new NamedDraftError(
      "unsupported",
      "This saved draft uses an unsupported storage version.",
    );
  if (
    typeof record.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      record.id,
    ) ||
    record.id !== id ||
    record.medalFamily !== family ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 1 ||
    !Number.isSafeInteger(record.createdAt) ||
    record.createdAt < 0 ||
    !Number.isSafeInteger(record.modifiedAt) ||
    record.modifiedAt < 0 ||
    normalizeDraftName(record.name) !== record.name ||
    draftNameKey(record.name) !== record.nameKey
  )
    throw new NamedDraftError(
      "invalid",
      "This saved draft has invalid storage metadata.",
    );
}

function checkRevision(record, revision) {
  if (record.revision !== revision)
    throw new NamedDraftError(
      "conflict",
      "This saved draft changed in another tab. Reload it or save your local worksheet as a separate copy.",
    );
}

function content(record) {
  if (typeof record.draftJSON !== "string")
    throw new Error("This saved draft has an invalid payload.");
  const draft = parseDraft(record.draftJSON, record.medalFamily);
  if (draft.name !== record.name)
    throw new Error("The saved draft's name does not match its contents.");
  return draft;
}

function storageError(error) {
  if (error?.name === "ConstraintError")
    return new NamedDraftError(
      "duplicate",
      "A draft with this name already exists in this medal family. Choose another name.",
    );
  return (
    error ??
    new Error("Browser draft storage failed. Your worksheet has not changed.")
  );
}

export function createNamedDraftStore({
  indexedDB = globalThis.indexedDB,
  newId = () => globalThis.crypto.randomUUID(),
  now = () => Date.now(),
} = {}) {
  let opening;
  let connection;
  let closed = false;
  let unavailable;

  function open() {
    if (closed || unavailable)
      return Promise.reject(
        unavailable ?? new Error("Named draft storage is closed."),
      );
    if (!indexedDB)
      return Promise.reject(
        new Error(
          "Saved browser drafts are unavailable. File Import and Download remain available.",
        ),
      );
    opening ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(NAMED_DRAFT_DATABASE, 1);
      const fail = (error) => {
        unavailable = error;
        reject(error);
      };
      request.onupgradeneeded = () => {
        if (closed || unavailable) {
          request.transaction.abort();
          return;
        }
        const store = request.result.createObjectStore(STORE, {
          keyPath: "id",
        });
        store.createIndex("familyName", ["medalFamily", "nameKey"], {
          unique: true,
        });
        store.createIndex("familyModified", ["medalFamily", "modifiedAt"]);
      };
      request.onblocked = () =>
        fail(
          new Error(
            "Saved draft storage is blocked by another open page. Close older CavApps pages and try again.",
          ),
        );
      request.onerror = () => fail(storageError(request.error));
      request.onsuccess = () => {
        const db = request.result;
        if (closed || unavailable) {
          db.close();
          reject(unavailable ?? new Error("Named draft storage is closed."));
          return;
        }
        connection = db;
        db.onversionchange = () => {
          db.close();
          unavailable = new Error(
            "Saved draft storage changed in another page. Reload to reconnect.",
          );
        };
        db.onclose = () => {
          unavailable = new Error(
            "Saved draft storage closed unexpectedly. Reload to reconnect.",
          );
        };
        resolve(db);
      };
    });
    return opening;
  }

  async function transaction(mode, action) {
    const db = await open();
    if (closed || unavailable)
      throw unavailable ?? new Error("Named draft storage is closed.");
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      let result;
      let failure;
      tx.oncomplete = () => resolve(result);
      tx.onerror = (event) => {
        failure ??= event.target.error ?? tx.error;
      };
      tx.onabort = () => reject(storageError(failure ?? tx.error));
      const guard =
        (callback) =>
        (...args) => {
          try {
            callback(...args);
          } catch (error) {
            failure = error;
            tx.abort();
          }
        };
      guard(() =>
        action(
          tx.objectStore(STORE),
          (value) => {
            result = value;
          },
          guard,
        ),
      )();
    });
  }

  function update(
    family,
    id,
    expectedRevision,
    change,
    validatePayload = true,
  ) {
    checkFamily(family);
    return transaction("readwrite", (store, done, guard) => {
      const request = store.get(id);
      request.onsuccess = guard(() => {
        const record = request.result;
        checkRecord(record, family, id);
        checkRevision(record, expectedRevision);
        if (validatePayload) content(record);
        const next = change(record);
        if (next === null) {
          store.delete(id);
          done(record);
          return;
        }
        if (!Number.isSafeInteger(record.revision + 1))
          throw new Error("Saved draft revision limit reached.");
        const updated = {
          ...next,
          revision: record.revision + 1,
          modifiedAt: now(),
        };
        checkRecord(updated, family, id);
        content(updated);
        store.put(updated);
        done(updated);
      });
    });
  }

  return {
    async list(family) {
      checkFamily(family);
      return transaction("readonly", (store, done, guard) => {
        const rows = [];
        let scans = 2;
        const finish = () => {
          if (--scans === 0) {
            rows.sort(
              (a, b) =>
                b.modifiedAt - a.modifiedAt ||
                (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
            );
            done(rows);
          }
        };
        const append = (record, key) => {
          if (
            record?.medalFamily === family ||
            !["operation", "service"].includes(record?.medalFamily)
          ) {
            let safe = false;
            let draft;
            let error;
            try {
              checkRecord(record, family, key);
              safe = true;
              draft = content(record);
            } catch (failure) {
              error = failure.message;
            }
            rows.push({
              id: key,
              medalFamily: family,
              revision: record?.revision,
              name:
                typeof record?.name === "string"
                  ? record.name
                  : "Unreadable draft",
              modifiedAt: Number.isSafeInteger(record?.modifiedAt)
                ? record.modifiedAt
                : 0,
              medalId: draft?.medalId,
              error,
              canDelete: safe,
            });
          }
        };
        const request = store.index("familyModified").openCursor(null, "prev");
        request.onsuccess = guard(() => {
          const cursor = request.result;
          if (!cursor) return finish();
          append(cursor.value, cursor.primaryKey);
          cursor.continue();
        });
        // IndexedDB omits malformed compound keys. Surface those records too,
        // without parsing valid payloads twice or silently repairing anything.
        const missingKeys = store.openCursor();
        missingKeys.onsuccess = guard(() => {
          const cursor = missingKeys.result;
          if (!cursor) return finish();
          const record = cursor.value;
          const key = [record?.medalFamily, record?.modifiedAt];
          try {
            indexedDB.cmp(key, key);
          } catch {
            append(record, cursor.primaryKey);
          }
          cursor.continue();
        });
      });
    },
    read(family, id, expectedRevision) {
      checkFamily(family);
      return transaction("readonly", (store, done, guard) => {
        const request = store.get(id);
        request.onsuccess = guard(() => {
          const record = request.result;
          checkRecord(record, family, id);
          if (expectedRevision !== undefined)
            checkRevision(record, expectedRevision);
          content(record);
          done(record);
        });
      });
    },
    create(family, draftJSON, name) {
      checkFamily(family);
      const normalized = normalizeDraftName(name);
      const timestamp = now();
      const record = {
        id: newId(),
        schemaVersion: 1,
        medalFamily: family,
        name: normalized,
        nameKey: draftNameKey(normalized),
        revision: 1,
        createdAt: timestamp,
        modifiedAt: timestamp,
        draftJSON: withDraftName(draftJSON, family, normalized),
      };
      checkRecord(record, family);
      return transaction("readwrite", (store, done) => {
        store.add(record);
        done(record);
      });
    },
    overwrite(family, id, expectedRevision, draftJSON, name) {
      const normalized = normalizeDraftName(name);
      const payload = withDraftName(draftJSON, family, normalized);
      return update(family, id, expectedRevision, (record) => ({
        ...record,
        name: normalized,
        nameKey: draftNameKey(normalized),
        draftJSON: payload,
      }));
    },
    rename(family, id, expectedRevision, name) {
      const normalized = normalizeDraftName(name);
      return update(family, id, expectedRevision, (record) => ({
        ...record,
        name: normalized,
        nameKey: draftNameKey(normalized),
        draftJSON: withDraftName(record.draftJSON, family, normalized),
      }));
    },
    remove(family, id, expectedRevision) {
      return update(family, id, expectedRevision, () => null, false);
    },
    close() {
      closed = true;
      connection?.close();
    },
  };
}
