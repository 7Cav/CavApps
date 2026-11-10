import { parseDraft, serializeDraft } from "./recommendation-drafts";

export const RECOVERY_DATABASE = "cavapps-medal-recovery";
const DATABASE_VERSION = 1;
const ENVELOPE_VERSION = 1;
const STORES = ["recoveryHeads", "recoverySnapshots"];

export class RecoveryConflictError extends Error {
  constructor() {
    super("Another tab has newer browser recovery.");
    this.name = "RecoveryConflictError";
  }
}

export function sameRecoveryHead(left, right) {
  return (
    (left?.revision ?? null) === (right?.revision ?? null) &&
    (left?.editId ?? null) === (right?.editId ?? null)
  );
}

function checkExpectedHead(head, expected, family) {
  checkEnvelope(head, family);
  checkEnvelope(expected ?? undefined, family);
  if (!sameRecoveryHead(head, expected)) throw new RecoveryConflictError();
}

function checkFamily(family) {
  if (!["operation", "service"].includes(family))
    throw new Error("Unsupported recovery medal family.");
}

function checkEnvelope(record, family) {
  if (record === undefined) return;
  if (record?.version !== ENVELOPE_VERSION)
    throw new Error(
      "Unsupported browser recovery version. Stored work was not replaced.",
    );
  if (
    record.medalFamily !== family ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 1 ||
    typeof record.editId !== "string" ||
    !record.editId
  )
    throw new Error("Invalid browser recovery metadata.");
}

function checkPair(head, snapshot, family) {
  checkEnvelope(head, family);
  checkEnvelope(snapshot, family);
  if (
    snapshot &&
    (!head ||
      snapshot.revision > head.revision ||
      (snapshot.revision === head.revision) !==
        (snapshot.editId === head.editId))
  )
    throw new Error("Conflicting browser recovery metadata.");
}

// Browser-profile/origin storage only: roster identities do not identify the
// author. Keep this database separate from any future named-draft collection.
export function createRecoveryStore({
  indexedDB = globalThis.indexedDB,
  locks = globalThis.navigator?.locks,
  newEditId = () => globalThis.crypto.randomUUID(),
  onUnavailable = () => {},
} = {}) {
  if (!indexedDB || typeof locks?.request !== "function")
    throw new Error(
      "Automatic recovery is unavailable in this browser. Editing, Load and Download remain available.",
    );

  let connection;
  let opening;
  let closed = false;
  let unavailable;

  function open() {
    if (closed || unavailable)
      return Promise.reject(
        unavailable ?? new Error("Recovery connection is closed."),
      );
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      const request = indexedDB.open(RECOVERY_DATABASE, DATABASE_VERSION);
      const fail = (error) => {
        unavailable = error;
        onUnavailable(error);
        reject(error);
      };
      request.onupgradeneeded = () => {
        if (closed || unavailable) {
          request.transaction.abort();
          return;
        }
        for (const name of STORES) request.result.createObjectStore(name);
      };
      request.onblocked = () =>
        fail(
          new Error(
            "Browser recovery is blocked by another open page. Close older CavApps pages and reload.",
          ),
        );
      request.onerror = () =>
        fail(request.error ?? new Error("Could not open browser recovery."));
      request.onsuccess = () => {
        const db = request.result;
        if (closed || unavailable) {
          db.close();
          reject(unavailable ?? new Error("Recovery connection is closed."));
          return;
        }
        connection = db;
        db.onversionchange = () => {
          db.close();
          unavailable = new Error(
            "Browser recovery changed in another page. Reload to reconnect.",
          );
          onUnavailable(unavailable);
        };
        db.onclose = () => {
          unavailable = new Error(
            "The browser recovery connection closed unexpectedly.",
          );
          onUnavailable(unavailable);
        };
        resolve(db);
      };
    });
    return opening;
  }

  async function transaction(family, mode, action, names = STORES) {
    checkFamily(family);
    const db = await open();
    if (closed || unavailable)
      throw unavailable ?? new Error("Recovery connection is closed.");
    return new Promise((resolve, reject) => {
      const tx = db.transaction(names, mode);
      let result;
      let failure;
      const records = {};
      let remaining = names.length;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => {
        failure ??= tx.error;
      };
      tx.onabort = () =>
        reject(
          failure ??
            tx.error ??
            new Error("Browser recovery transaction was aborted."),
        );
      for (const name of names) {
        const request = tx.objectStore(name).get(family);
        request.onsuccess = () => {
          records[name] = request.result;
          if (--remaining) return;
          // All comparison and put requests are issued inside this active IDB
          // callback. Never await serialization or unrelated work in a transaction.
          try {
            result = action(
              tx,
              records.recoveryHeads,
              records.recoverySnapshots,
            );
          } catch (error) {
            failure = error;
            tx.abort();
          }
        };
      }
    });
  }

  function nextHead(head, family, editId) {
    checkEnvelope(head, family);
    if (head?.editId === editId)
      throw new Error("The browser recovery edit identifier was reused.");
    const revision = (head?.revision ?? 0) + 1;
    if (!Number.isSafeInteger(revision))
      throw new Error("Browser recovery revision limit reached.");
    return Object.freeze({
      version: ENVELOPE_VERSION,
      medalFamily: family,
      revision,
      editId,
    });
  }

  function ordered(family, action) {
    checkFamily(family);
    const editId = newEditId();
    if (typeof editId !== "string" || !editId)
      throw new Error("Could not identify the browser recovery edit.");
    // Request admission synchronously at the edit boundary, BEFORE opening the
    // database, serializing, or debouncing. Queue order is the ordering authority.
    return locks.request(
      `cavapps-medal-recovery:${family}`,
      { mode: "exclusive" },
      () => action(editId),
    );
  }

  return {
    async read(family) {
      const result = await transaction(
        family,
        "readonly",
        (_tx, head, snapshot) => {
          checkPair(head, snapshot, family);
          return { head, snapshot };
        },
      );
      const { head, snapshot } = result;
      if (snapshot && typeof snapshot.draftJSON !== "string")
        throw new Error("Invalid browser recovery payload.");
      return {
        ...result,
        draft: snapshot ? parseDraft(snapshot.draftJSON, family) : undefined,
        interrupted: Boolean(
          head && (!snapshot || head.revision > snapshot.revision),
        ),
      };
    },

    readHead(family) {
      return transaction(
        family,
        "readonly",
        (_tx, head) => {
          checkEnvelope(head, family);
          return head;
        },
        ["recoveryHeads"],
      );
    },

    register(family, expectedHead = null) {
      return ordered(family, async (editId) => {
        // Resolve this tab's preceding registration under the already-admitted
        // lock, before opening a transaction. Absence is an explicit base.
        const expected = await expectedHead;
        return transaction(
          family,
          "readwrite",
          (tx, head) => {
            checkExpectedHead(head, expected, family);
            const next = nextHead(head, family, editId);
            tx.objectStore("recoveryHeads").put(next, family);
            return next;
          },
          ["recoveryHeads"],
        );
      });
    },

    async commit(token, draftJSON) {
      const family = token.medalFamily;
      checkEnvelope(token, family);
      parseDraft(draftJSON, family);
      return transaction(family, "readwrite", (tx, head, snapshot) => {
        checkPair(head, snapshot, family);
        if (head?.revision !== token.revision || head?.editId !== token.editId)
          return false;
        if (snapshot?.editId === token.editId) {
          if (snapshot.draftJSON !== draftJSON)
            throw new Error("Conflicting payloads for the same recovery edit.");
          return true; // Retrying the identical completed payload is idempotent.
        }
        tx.objectStore("recoverySnapshots").put(
          { ...token, draftJSON },
          family,
        );
        return true;
      });
    },

    clear(state, expectedHead = null) {
      return ordered(state.medalFamily, async (editId) => {
        const expected = await expectedHead;
        const draftJSON = serializeDraft(state);
        return transaction(
          state.medalFamily,
          "readwrite",
          (tx, head, snapshot) => {
            checkPair(head, snapshot, state.medalFamily);
            checkExpectedHead(head, expected, state.medalFamily);
            const next = nextHead(head, state.medalFamily, editId);
            tx.objectStore("recoveryHeads").put(next, state.medalFamily);
            tx.objectStore("recoverySnapshots").put(
              { ...next, draftJSON },
              state.medalFamily,
            );
            return next;
          },
        );
      });
    },

    close() {
      closed = true;
      connection?.close();
    },
  };
}
