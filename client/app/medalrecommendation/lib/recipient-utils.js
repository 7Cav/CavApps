// Browser input protection, not a limit on the number of award recipients.
export const PASTE_CHARACTER_LIMIT = 100_000;
export const PASTE_CHARACTER_LIMIT_MESSAGE =
  "Recipient list is too large. Reduce the pasted text to 100,000 characters or fewer.";
export const RECIPIENT_INLINE_LIMIT = 8;
// Editing a nonempty selection is allowed before an award's generation minimum.
export const RECIPIENT_SELECTION_POLICY = Object.freeze({ minimum: 1 });
// S1-approved explicit citation boundary, shared with identity warnings.
export const EXPLICIT_RECIPIENT_LIMIT = 6;

// API IDs identify ranks; their numeric order does not describe seniority.
const RECOMMENDATION_RANK_PRECEDENCE = [
  [1, "GA"],
  [2, "GEN"],
  [3, "LTG"],
  [4, "MG"],
  [5, "BG"],
  [6, "COL"],
  [7, "LTC"],
  [8, "MAJ"],
  [9, "CPT"],
  [10, "1LT"],
  [11, "2LT"],
  [26, "CW5"],
  [27, "CW4"],
  [28, "CW3"],
  [29, "CW2"],
  [30, "WO1"],
  [12, "CSM"],
  [13, "SGM"],
  [14, "1SG"],
  [15, "MSG"],
  [16, "SFC"],
  [17, "SSG"],
  [18, "SGT"],
  [19, "CPL"],
  [20, "SPC"],
  [21, "PFC"],
  [22, "PVT"],
  [23, "RCT"],
  [31, "AR"],
];
const recommendationRanks = new Map(
  RECOMMENDATION_RANK_PRECEDENCE.map(([id, abbreviation], order) => [
    id,
    { abbreviation, order },
  ]),
);

function normalize(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";
}

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getRecipientId(member) {
  return String(member?.user?.userId ?? "").trim();
}

function getRecommendationRank(member) {
  const value = member?.rank?.rankId;
  const rankId =
    typeof value === "number" ||
    (typeof value === "string" && /^\d+$/.test(value.trim()))
      ? Number(value)
      : NaN;
  const rank = recommendationRanks.get(rankId);
  const abbreviation = normalize(member?.rank?.rankShort).toUpperCase();
  // CavApps uses GA; the roster API spells the same rank GOA.
  const canonicalAbbreviation = abbreviation === "GOA" ? "GA" : abbreviation;
  return rank?.abbreviation === canonicalAbbreviation ? rank : undefined;
}

function getRankOrder(member) {
  return getRecommendationRank(member)?.order ?? Infinity;
}

export function getRecipientRankAbbreviation(member) {
  const rank = getRecommendationRank(member);
  if (!rank) throw new Error("Unsupported recipient rank abbreviation");
  return rank.abbreviation;
}

function parseRecipientName(fullName) {
  const tokens = trimText(fullName).split(/\s+/).filter(Boolean);
  return {
    surname: tokens.at(-1) ?? "",
    first: tokens.length > 1 ? tokens[0] : "",
    middleNames: tokens.slice(1, -1).join(" "),
  };
}

// Recommendation order is separate from the user's editable selection order.
export function orderRecipientsForRecommendation(recipients) {
  return [...recipients].sort((left, right) => {
    const leftName = parseRecipientName(left?.realName);
    const rightName = parseRecipientName(right?.realName);
    return (
      getRankOrder(left) - getRankOrder(right) ||
      normalize(leftName.surname).localeCompare(
        normalize(rightName.surname),
        "en",
      ) ||
      normalize(leftName.first).localeCompare(
        normalize(rightName.first),
        "en",
      ) ||
      normalize(leftName.middleNames).localeCompare(
        normalize(rightName.middleNames),
        "en",
      )
    );
  });
}

export function getCitationName(fullName) {
  const { first, surname } = parseRecipientName(fullName);
  return [first, surname].filter(Boolean).join(" ");
}

export function getRecipientIdentity(member) {
  return {
    recipientRank: trimText(member?.rank?.rankFull),
    recipientCitationName: getCitationName(member?.realName ?? ""),
  };
}

export function getRecipientDisplayName(member) {
  return `${trimText(member?.rank?.rankFull)} ${trimText(member?.realName)}`.trim();
}

export function isValidRecipient(member) {
  return Boolean(
    getRecipientId(member) &&
    trimText(member?.user?.username) &&
    trimText(member?.rank?.rankFull) &&
    trimText(member?.realName) &&
    getRankOrder(member) !== Infinity,
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
    if (!isValidRecipient(member))
      return member && getRankOrder(member) === Infinity
        ? "Recipient rank information is missing or unsupported."
        : member && !trimText(member.user?.username)
          ? "Recipient username is missing. Select a recipient with a roster username."
          : "Required";
    return counts.get(getRecipientId(member)) > 1
      ? "Select each recipient only once."
      : "";
  });
  const validCount = uniqueRecipients(
    entries.map(({ member }) => member),
  ).filter(isValidRecipient).length;
  const meetsMinimum = validCount >= policy.minimum;
  return {
    errors,
    validCount,
    meetsMinimum,
    minimumError: meetsMinimum
      ? undefined
      : policy.minimumMessage?.(policy.minimum),
    isComplete: meetsMinimum && errors.every((error) => !error),
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

export function getRecipientPasteError(characterCount) {
  return characterCount > PASTE_CHARACTER_LIMIT
    ? PASTE_CHARACTER_LIMIT_MESSAGE
    : "";
}

export function matchPastedRecipients(text, roster, selected) {
  const error = getRecipientPasteError(text.length);
  if (error) throw new Error(error);
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
