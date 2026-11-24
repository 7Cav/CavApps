import {
  EXPLICIT_RECIPIENT_LIMIT,
  getRecipientId,
  getRecipientIdentity,
  resolveRecipientSurname,
} from "./recipient-utils";

// A longer rank consumes its entire phrase even when nobody selected holds it.
// The roster's rank entries supplement these overlapping military titles.
const overlappingRanks = [
  "Staff Sergeant",
  "Master Sergeant",
  "First Sergeant",
  "Sergeant First Class",
  "Sergeant Major",
  "Command Sergeant Major",
  "Sergeant Major of the Army",
  "Private First Class",
  "First Lieutenant",
  "Second Lieutenant",
  "Lieutenant Colonel",
  "Brigadier General",
  "Major General",
  "Lieutenant General",
  "General of the Army",
  "Chief Warrant Officer",
  "Warrant Officer",
];

function key(text) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Read one word or punctuation token at a time. Internal apostrophes, hyphens
// and dots stay in the word: Smith must not match Smith-Jones or Smith.J.
function nextToken(text, offset) {
  const pattern =
    /[\p{L}\p{M}\p{N}_]+(?:['’.\u2010\u2011-][\p{L}\p{M}\p{N}_]+)*|[^\s]/gu;
  pattern.lastIndex = offset;
  const match = pattern.exec(text);
  return (
    match && { key: key(match[0]), start: match.index, end: pattern.lastIndex }
  );
}

function phrase(text) {
  const parts = [];
  let offset = 0;
  for (let token; (token = nextToken(text, offset)); offset = token.end) {
    parts.push({ key: token.key, spaced: token.start > offset });
  }
  return parts;
}

// Return the end of the identity itself, excluding possessive or sentence punctuation.
function matchPhrase(text, first, parts, allowPossessive = false, start = 0) {
  let token = first;
  for (let i = start; i < parts.length; i++) {
    if (i > start) {
      const previousEnd = token.end;
      token = nextToken(text, previousEnd);
      if (!token) return null;
      const spaced = token.start > previousEnd;
      if (spaced !== parts[i].spaced) return null;
    }
    if (token.key !== parts[i].key) {
      if (
        allowPossessive &&
        i === parts.length - 1 &&
        token.key === parts[i].key + "'s"
      )
        return token.end - 2;
      return null;
    }
  }
  return token.end;
}

function prepareRecipients(members) {
  return members.map((member) => {
    const { recipientRank, recipientCitationName } =
      getRecipientIdentity(member);
    const surname = resolveRecipientSurname(
      member?.realName,
      member?.user?.username,
    );
    const name = key(recipientCitationName);
    const parts = phrase(name);
    const forms = [{ kind: "complete", parts, start: 0 }];
    const surnameParts = surname ? phrase(key(surname)) : [];
    if (surname) forms.push({ kind: "surname", parts: surnameParts, start: 0 });
    // A longer roster tail (e.g. Van Auken with Auken.P) may veto a
    // competing recipient's match, but cannot establish a reference itself.
    if (members.length > 1) {
      for (let start = 1; start < parts.length - surnameParts.length; start++) {
        if (parts[start].spaced)
          forms.push({ kind: "unconfirmed", parts, start });
      }
    }
    return {
      id: getRecipientId(member),
      rank: key(recipientRank),
      name,
      forms,
      hasSurnameCandidate: Boolean(surname),
    };
  });
}

function matchName(text, first, recipients) {
  let end = -1;
  let matches = [];
  for (const recipient of recipients) {
    for (const form of recipient.forms) {
      const stop = matchPhrase(text, first, form.parts, true, form.start);
      if (stop === null || stop < end) continue;
      if (stop > end) matches = [];
      matches.push({ recipient, form });
      end = stop;
    }
  }
  const supported =
    matches.find((m) => m.form.kind === "complete") ??
    matches.find((m) => m.form.kind === "surname");
  if (!supported) return null;
  const { recipient, form } = supported;
  const ids = new Set(matches.map((m) => m.recipient.id));
  return ids.size > 1
    ? { kind: "ambiguous", candidateIds: [...ids], end }
    : { kind: form.kind, recipientId: recipient.id, end };
}

function indexRanks(recipients, rankEntries) {
  const ranks = new Map();
  const vocabulary = [
    ...overlappingRanks,
    ...rankEntries.map((r) => r.full),
    ...recipients.map((r) => r.rank),
  ];
  for (const rank of new Set(vocabulary.filter(Boolean).map(key))) {
    const parts = phrase(rank);
    if (!parts.length) continue;
    const first = parts[0].key;
    if (!ranks.has(first)) ranks.set(first, []);
    ranks
      .get(first)
      .push({ parts, recipients: recipients.filter((r) => r.rank === rank) });
  }
  for (const group of ranks.values())
    group.sort((a, b) => b.parts.length - a.parts.length);
  return ranks;
}

// Offsets are UTF-16 indices into the original authored text, with an exclusive end.
export function scanRecipientReferences(
  text,
  members,
  { rankEntries = [], recipientIdentityChecks = true } = {},
) {
  const references = [];
  if (
    !recipientIdentityChecks ||
    !members.length ||
    members.length > EXPLICIT_RECIPIENT_LIMIT
  )
    return { recipients: [], references };
  const recipients = prepareRecipients(members);
  if (recipients.some((r) => !r.id || !r.rank || !r.name))
    return { recipients: [], references };
  const ranks = indexRanks(recipients, rankEntries);
  let previousKey;
  for (let offset = 0, token; (token = nextToken(text, offset)); ) {
    const articleLed =
      previousKey === "the" || previousKey === "a" || previousKey === "an";
    previousKey = token.key;
    offset = token.end;
    for (const rank of ranks.get(token.key) ?? []) {
      const end = matchPhrase(text, token, rank.parts);
      if (end === null) continue;
      offset = end;
      const first = nextToken(text, end);
      if (first && first.start > end) {
        const match = matchName(text, first, rank.recipients);
        // "The sergeant may continue" is insufficient evidence for Sergeant May.
        if (match && (!articleLed || match.kind === "complete")) {
          references.push({
            ...match,
            start: token.start,
            text: text.slice(token.start, match.end),
          });
          offset = match.end;
        }
      }
      break;
    }
  }
  return {
    recipients: recipients.map(({ id, hasSurnameCandidate }) => ({
      id,
      hasSurnameCandidate,
    })),
    references,
  };
}

// Only assess known citation structures. Both supported families generate the
// final complete identity; Service also generates the first one.
export function evaluateRecipientReferences(
  { recipients, references },
  { firstMention, finalMention } = {},
) {
  const findings = [];
  if (
    finalMention !== "generated" ||
    !["authored", "generated"].includes(firstMention)
  )
    return findings;
  const seen = new Set();
  const possiblySeen = new Set();
  const surnameCandidates = new Set(
    recipients.filter((r) => r.hasSurnameCandidate).map((r) => r.id),
  );
  const reportedIntermediate = new Set();
  let reportedAmbiguity = false;
  for (const ref of references) {
    if (ref.kind === "ambiguous") {
      for (const id of ref.candidateIds) possiblySeen.add(id);
      if (!reportedAmbiguity) {
        findings.push({ kind: "ambiguous", start: ref.start });
        reportedAmbiguity = true;
      }
      continue;
    }
    const id = ref.recipientId;
    const intermediate = firstMention === "generated" || seen.has(id);
    if (!intermediate && !possiblySeen.has(id) && ref.kind === "surname")
      findings.push({
        kind: "first-shortened",
        recipientId: id,
        start: ref.start,
      });
    if (
      intermediate &&
      ref.kind === "complete" &&
      surnameCandidates.has(id) &&
      !reportedIntermediate.has(id)
    ) {
      findings.push({
        kind: "intermediate-complete",
        recipientId: id,
        start: ref.start,
      });
      reportedIntermediate.add(id);
    }
    seen.add(id);
  }
  if (firstMention === "authored") {
    for (const { id } of recipients) {
      if (!seen.has(id) && !possiblySeen.has(id))
        findings.push({ kind: "complete-not-detected", recipientId: id });
    }
  }
  return findings;
}
