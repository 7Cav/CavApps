import { MEDAL_FAMILY_IDS } from "./medal-families";
import { hasRecipientIdentity } from "./narrative-validation";

// Browser input protection, not a limit on the number of award recipients.
export const PASTE_CHARACTER_LIMIT = 100_000;
export const RECIPIENT_INLINE_LIMIT = 8;

function normalize(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";
}

export function getRecipientId(member) {
  return String(member?.user?.userId ?? "").trim();
}

function getRankOrder(member) {
  const value = member?.rank?.rankId;
  const rankId =
    typeof value === "number" || (typeof value === "string" && value.trim())
      ? Number(value)
      : NaN;
  return Number.isInteger(rankId) && rankId > 0 ? rankId : Infinity;
}

// Recommendation order is separate from the user's editable selection order.
export function orderRecipientsForRecommendation(recipients) {
  return [...recipients].sort(
    (left, right) =>
      getRankOrder(left) - getRankOrder(right) ||
      normalize(left.realName).localeCompare(normalize(right.realName), "en") ||
      normalize(left.user?.username).localeCompare(
        normalize(right.user?.username),
        "en",
      ) ||
      getRecipientId(left).localeCompare(getRecipientId(right), "en"),
  );
}

export function getCitationName(fullName) {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  return nameParts.length < 2
    ? fullName.trim()
    : `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
}

export function getRecipientIdentity(member) {
  return {
    recipientRank: member?.rank?.rankFull?.trim() ?? "",
    recipientCitationName: getCitationName(member?.realName ?? ""),
  };
}

export function getOperationGroupRecipientWarning(
  narrative,
  recipients,
  medalFamily,
) {
  if (
    medalFamily !== MEDAL_FAMILY_IDS.OPERATION ||
    recipients.length < 2 ||
    recipients.length > 6
  )
    return null;

  const missing = recipients.filter((member) => {
    const { recipientRank, recipientCitationName } =
      getRecipientIdentity(member);
    return !hasRecipientIdentity(
      narrative,
      recipientRank,
      recipientCitationName,
    );
  }).length;

  return missing
    ? {
        key: "recipient-mention",
        message: `${missing} of ${recipients.length} recipients ${missing === 1 ? "is" : "are"} not referenced in the narrative. Ensure each recipient is properly cited before submitting the recommendation.`,
      }
    : null;
}

// Recipients arrive in recommendation order; editing collections stay untouched.
export function resolveRecommendationRecipientSubject(recipients) {
  const isPlural = recipients.length > 1;
  if (recipients.length >= 7) {
    return {
      subject: "The recipients",
      possessiveSubject: "The recipients'",
      isPlural,
    };
  }
  const names = recipients.map((member) => {
    const { recipientRank, recipientCitationName } =
      getRecipientIdentity(member);
    return `${recipientRank} ${recipientCitationName}`;
  });
  const subject =
    names.length < 2
      ? (names[0] ?? "")
      : names.length === 2
        ? names.join(" and ")
        : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
  return { subject, possessiveSubject: `${subject}'s`, isPlural };
}

export function getRecipientDisplayName(member) {
  return `${member.rank?.rankFull?.trim() ?? ""} ${member.realName?.trim() ?? ""}`.trim();
}

export function isValidRecipient(member) {
  return Boolean(
    getRecipientId(member) &&
    member?.rank?.rankFull?.trim() &&
    member?.realName?.trim(),
  );
}

export function uniqueRecipients(members) {
  const byId = new Map();
  for (const member of members) {
    const id = getRecipientId(member);
    if (id && !byId.has(id)) byId.set(id, member);
  }
  return [...byId.values()];
}

export function validateRecipientEntries(entries, policy) {
  const counts = new Map();
  for (const { member } of entries) {
    const id = getRecipientId(member);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const errors = entries.map(({ member }) => {
    if (!isValidRecipient(member)) return "Required";
    return counts.get(getRecipientId(member)) > 1
      ? "Select each recipient only once."
      : "";
  });
  return {
    errors,
    isComplete:
      entries.length >= policy.minimum &&
      (policy.allowMultiple || entries.length === 1) &&
      errors.every((error) => !error),
  };
}

function getPositionId(position) {
  const id = position?.positionId;
  if (typeof id === "string") return id.trim();
  return typeof id === "number" && Number.isFinite(id) ? String(id) : "";
}

export function buildRecipientOrganizations(roster, groups) {
  const membersByPosition = new Map();
  for (const member of roster) {
    for (const position of [member.primary, ...(member.secondaries ?? [])]) {
      const positionId = getPositionId(position);
      if (!positionId) continue;
      if (!membersByPosition.has(positionId)) {
        membersByPosition.set(positionId, new Set());
      }
      membersByPosition.get(positionId).add(getRecipientId(member));
    }
  }

  return groups
    .map((group, index) => ({
      id: String(index),
      label: group.groupTitle,
      memberIds: new Set(
        Object.values(group.positions ?? {}).flatMap((position) => [
          ...(membersByPosition.get(getPositionId(position)) ?? []),
        ]),
      ),
    }))
    .filter((group) => group.memberIds.size > 0);
}

export function filterRecipients(roster, query, organization) {
  const normalizedQuery = normalize(query);
  return roster.filter((member) => {
    if (organization && !organization.memberIds.has(getRecipientId(member))) {
      return false;
    }
    return [
      member.user?.username,
      member.realName,
      member.rank?.rankFull,
      member.rank?.rankShort,
      member.primary?.positionTitle,
      ...(member.secondaries ?? []).map((position) => position?.positionTitle),
    ].some((value) => normalize(value).includes(normalizedQuery));
  });
}

export function selectShownRecipients(selected, shown) {
  return uniqueRecipients([...selected, ...shown]);
}

export function clearShownRecipients(selected, shown) {
  const shownIds = new Set(shown.map(getRecipientId));
  return selected.filter((member) => !shownIds.has(getRecipientId(member)));
}

export function matchPastedRecipients(text, roster, selected) {
  if (text.length > PASTE_CHARACTER_LIMIT) {
    throw new Error(
      "Paste is too large. Please use 100,000 characters or fewer.",
    );
  }
  const aliases = new Map();
  for (const member of uniqueRecipients(roster)) {
    const fullName = member.realName;
    const rankFull = member.rank?.rankFull;
    const rankShort = member.rank?.rankShort;
    const username = member.user?.username;
    const names = [fullName, username];
    if (rankFull && fullName) names.push(`${rankFull} ${fullName}`);
    if (rankShort && fullName) names.push(`${rankShort} ${fullName}`);
    if (rankShort && username) {
      names.push(`${rankShort} ${username}`, `${rankShort}.${username}`);
    }
    for (const alias of new Set(names.map(normalize).filter(Boolean))) {
      if (!aliases.has(alias)) aliases.set(alias, []);
      aliases.get(alias).push(member);
    }
  }
  const selection = uniqueRecipients(selected);
  const selectedIds = new Set(selection.map(getRecipientId));
  const results = text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const matches = aliases.get(normalize(line)) ?? [];
      let outcome;
      if (matches.length === 0) outcome = "Not found";
      else if (matches.length > 1) outcome = "Ambiguous";
      else {
        const member = matches[0];
        const id = getRecipientId(member);
        outcome = selectedIds.has(id) ? "Already selected" : "Matched";
        if (!selectedIds.has(id)) {
          selectedIds.add(id);
          selection.push(member);
        }
      }
      return { line: line.trim(), outcome };
    });
  return { selection, results };
}

export function requiresEligibilityWarning(member) {
  return member.roster !== "ROSTER_TYPE_COMBAT";
}
