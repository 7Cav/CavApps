import { getMedalFamily } from "./medal-families";
import { formatOperationName } from "./citation-builders";
import {
  isWorksheetFieldActive,
  resolveMedalWorksheet,
} from "./worksheet-profiles";
import {
  getRecipientId,
  getRecipientRankAbbreviation,
  uniqueRecipients,
} from "./recipient-utils";

export const DRAFT_FORMAT = "cavapps.medal-recommendation.draft";
export const DRAFT_VERSION = 1;
export const MAX_DRAFT_BYTES = 1024 * 1024;
// A byte-budget bound, not an award recipient policy. Even the smallest
// legal entry needs this many bytes before whitespace and the envelope.
const MAX_ENTRIES = Math.floor(
  MAX_DRAFT_BYTES / '{"kind":"search","query":""}'.length,
);
const unsafeKeys = new Set(["__proto__", "constructor", "prototype"]);

function fail(message) {
  throw new Error(message);
}

export function checkDraftSize(bytes) {
  if (bytes > MAX_DRAFT_BYTES)
    fail(
      "Draft files must be 1 MiB or smaller. No worksheet content has been changed.",
    );
}

function object(value, allowed, required = allowed) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    fail("Invalid draft object structure.");
  if (
    Object.keys(value).some(
      (key) => unsafeKeys.has(key) || !allowed.includes(key),
    )
  )
    fail("The draft contains an unsupported property.");
  if (required.some((key) => !Object.hasOwn(value, key)))
    fail("The draft is missing required format information.");
}

function string(value, limit = MAX_DRAFT_BYTES) {
  if (typeof value !== "string" || value.length > limit)
    fail("The draft contains an invalid or oversized text value.");
  return value;
}

function selectedRecipient(entry) {
  object(entry, ["kind", "query", "identity", "snapshot"]);
  object(entry.identity, ["userId"]);
  const userId = string(entry.identity.userId, 128).trim();
  if (!userId) fail("A selected recipient has an empty identifier.");
  object(entry.snapshot, ["username", "rankFull", "realName"]);
  return {
    kind: "selected",
    query: string(entry.query),
    identity: { userId },
    snapshot: {
      username: string(entry.snapshot.username, 4096),
      rankFull: string(entry.snapshot.rankFull, 4096),
      realName: string(entry.snapshot.realName, 4096),
    },
  };
}

function validateDraft(input, medalFamily) {
  object(
    input,
    [
      "format",
      "version",
      "medalFamily",
      "medalId",
      "name",
      "recipients",
      "values",
    ],
    ["format", "version", "medalFamily", "medalId", "recipients", "values"],
  );
  if (input.format !== DRAFT_FORMAT)
    fail("This is not a CavApps Medal Recommendation draft.");
  if (input.version !== DRAFT_VERSION)
    fail("This draft version is not supported.");
  if (input.medalFamily !== medalFamily)
    fail(
      "This draft belongs to a different medal family. Open its matching worksheet to load it.",
    );
  const medal = getMedalFamily(medalFamily).getMedalById(
    string(input.medalId, 128),
  );
  const worksheet = resolveMedalWorksheet(medal);
  if (!worksheet)
    fail("This draft's medal is not supported in this worksheet.");
  const fieldNames = Object.keys(worksheet.fields);
  object(input.values, fieldNames, []);
  const values = {};
  for (const [name, field] of Object.entries(worksheet.fields)) {
    const value = Object.hasOwn(input.values, name)
      ? string(input.values[name])
      : (field.defaultValue ?? "");
    switch (field.type) {
      case "text":
      case "textarea":
        break;
      case "date":
        if (value && !/^\d{4,}-\d{2}-\d{2}$/.test(value))
          fail("Invalid date field structure.");
        break;
      case "monthYear":
        if (value && !/^\d{0,4}-(?:0[1-9]|1[0-2])?$/.test(value))
          fail("Invalid month/year field structure.");
        break;
      case "citationChoice":
      case "semanticChoice":
        if (value && !field.options.some((option) => option.id === value))
          fail("The draft contains an unsupported worksheet choice.");
        break;
      default:
        fail("This worksheet field type is not supported by the draft format.");
    }
    values[name] = value;
  }
  if (!Array.isArray(input.recipients) || input.recipients.length > MAX_ENTRIES)
    fail("Invalid draft recipient collection.");
  const users = new Set();
  const recipients = input.recipients.map((entry) => {
    if (entry?.kind === "search") {
      object(entry, ["kind", "query"]);
      return { kind: "search", query: string(entry.query) };
    }
    if (entry?.kind !== "selected") fail("Invalid draft recipient entry.");
    const result = selectedRecipient(entry);
    const { userId } = result.identity;
    if (users.has(userId))
      fail("The draft contains duplicate selected recipients.");
    users.add(userId);
    return result;
  });
  return {
    format: DRAFT_FORMAT,
    version: DRAFT_VERSION,
    medalFamily,
    medalId: medal.id,
    ...(Object.hasOwn(input, "name") ? { name: string(input.name, 512) } : {}),
    recipients,
    values,
  };
}

export function serializeDraft({
  medalFamily,
  medalId,
  entries,
  values,
  name,
}) {
  const worksheet = resolveMedalWorksheet(
    getMedalFamily(medalFamily).getMedalById(medalId),
  );
  if (!worksheet) fail("Select a medal before downloading a draft.");
  const recipients = entries.map((entry) => {
    if (entry.unresolvedRecipient)
      return {
        kind: "selected",
        query: entry.query,
        ...entry.unresolvedRecipient,
      };
    if (!entry.member) return { kind: "search", query: entry.query };
    const member = entry.member;
    const userId = getRecipientId(member);
    return {
      kind: "selected",
      query: entry.query,
      identity: { userId },
      snapshot: {
        username: member.user?.username ?? "",
        rankFull: member.rank?.rankFull ?? "",
        realName: member.realName ?? "",
      },
    };
  });
  const draft = validateDraft(
    {
      format: DRAFT_FORMAT,
      version: DRAFT_VERSION,
      medalFamily,
      medalId,
      ...(name !== undefined ? { name } : {}),
      recipients,
      values: Object.fromEntries(
        Object.entries(worksheet.fields).map(([key, field]) => [
          key,
          values[key] ?? field.defaultValue ?? "",
        ]),
      ),
    },
    medalFamily,
  );
  const text = JSON.stringify(draft, null, 2) + "\n";
  checkDraftSize(new TextEncoder().encode(text).byteLength);
  return text;
}

export function parseDraft(text, medalFamily) {
  checkDraftSize(new TextEncoder().encode(text).byteLength);
  let input;
  try {
    input = JSON.parse(text);
  } catch {
    fail("The selected file is not valid JSON.");
  }
  return validateDraft(input, medalFamily);
}

// Use the same forum identity and deduplication as normal recipient selection.
// Snapshots never become roster records.
export function prepareDraftRestore(draft, roster) {
  const byUser = new Map(
    uniqueRecipients(roster).map((member) => [getRecipientId(member), member]),
  );
  const resolvedIds = new Set();
  const entries = draft.recipients.map((entry, slotId) => {
    if (entry.kind === "search")
      return { slotId, query: entry.query, member: null };
    const candidate = byUser.get(entry.identity.userId);
    if (!candidate)
      return {
        slotId,
        query: entry.query,
        member: null,
        unresolvedRecipient: {
          identity: entry.identity,
          snapshot: entry.snapshot,
        },
      };
    const id = getRecipientId(candidate);
    if (resolvedIds.has(id))
      fail("The draft contains duplicate selected recipients.");
    resolvedIds.add(id);
    return { slotId, query: candidate.user.username, member: candidate };
  });
  if (!entries.length) entries.push({ slotId: 0, query: "", member: null });
  return {
    medalId: draft.medalId,
    values: draft.values,
    entries,
    name: draft.name,
  };
}

export function buildDraftFilename({ medalFamily, medalId, values, entries }) {
  const medal = getMedalFamily(medalFamily).getMedalById(medalId);
  const worksheet = resolveMedalWorksheet(medal);
  const configuration = worksheet?.recommendationTitleContext;
  let context = "";
  if (configuration?.type === "operation" && values.operationTitle?.trim())
    context = formatOperationName(values.operationTitle);
  if (configuration?.type === "field")
    context = values[configuration.field] ?? "";
  if (configuration?.type === "activeField") {
    const field = configuration.fields.find((key) =>
      isWorksheetFieldActive(worksheet.fields[key], values),
    );
    context = values[field] ?? "";
  }
  const members = entries.flatMap((entry) =>
    entry.member ? [entry.member] : [],
  );
  let recipient = members.length > 1 ? "Multiple" : "";
  if (members.length === 1 && members[0].user?.username?.trim()) {
    try {
      recipient = `${getRecipientRankAbbreviation(members[0])}.${members[0].user.username.trim()}`;
    } catch {
      /* Incomplete roster information must not prevent downloading work. */
    }
  }
  const filename = ["Draft", context, medal?.abbreviation, recipient]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" - ")
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "-");
  // Bound UTF-8 bytes, preserving whole Unicode code points and the extension.
  let safe = "";
  for (const character of filename) {
    if (new TextEncoder().encode(safe + character).byteLength > 180) break;
    safe += character;
  }
  return safe.replace(/[. ]+$/, "") + ".json";
}
