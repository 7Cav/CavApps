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

// Require the first given name and the entire surname. Any retained middle
// components must occur in roster order; never enumerate their combinations.
function matchOmittedMiddle(text, first, { givenNames, parts }) {
  let token = first;
  let retained = 0;
  let best = null;
  for (const given of givenNames) {
    const end = matchPhrase(text, token, given);
    if (end === null) {
      if (!retained) break;
      continue;
    }
    retained++;
    token = nextToken(text, end);
    if (!token || token.start === end) break;
    if (retained < givenNames.length)
      best = matchPhrase(text, token, parts, true) ?? best;
  }
  return best;
}

function prepareRecipients(members) {
  return members.map((member) => {
    const { recipientRank, recipientCitationName } =
      getRecipientIdentity(member);
    const surname = key(
      resolveRecipientSurname(member?.realName, member?.user?.username) ?? "",
    );
    const name = key(recipientCitationName);
    const parts = phrase(name);
    const forms = [{ kind: "complete", parts, start: 0 }];
    const surnameParts = phrase(surname);
    const words = name.split(" ");
    const surnameLength = surname ? surname.split(" ").length : 0;
    function addMiddleOmission(kind, givenNames, ending) {
      if (givenNames.length > 1)
        forms.push({ kind, givenNames: givenNames.map(phrase), parts: ending });
    }
    if (surname) {
      forms.push({ kind: "surname", parts: surnameParts, start: 0 });
      addMiddleOmission(
        "incomplete",
        words.slice(0, -surnameLength),
        surnameParts,
      );
      // Only whole trailing components of a corroborated compound surname.
      for (let start = 1; start < surnameParts.length; start++) {
        if (surnameParts[start].spaced)
          forms.push({ kind: "incomplete", parts: surnameParts, start });
      }
    }
    // A longer roster tail (e.g. Van Auken with Auken.P) may veto a
    // competing recipient's match, but cannot establish a reference itself.
    if (members.length > 1) {
      // A shared first and last word can also hide a compound or unresolved
      // surname. This alternative only vetoes another recipient's attribution.
      if (surnameLength !== 1)
        addMiddleOmission(
          "unconfirmed",
          words.slice(0, -1),
          phrase(words.at(-1)),
        );
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
      surname,
    };
  });
}

function matchName(text, first, recipients) {
  let end = -1;
  let matches = [];
  for (const recipient of recipients) {
    for (const form of recipient.forms) {
      const stop = form.givenNames
        ? matchOmittedMiddle(text, first, form)
        : matchPhrase(text, first, form.parts, true, form.start);
      if (stop === null || stop < end) continue;
      if (stop > end) matches = [];
      matches.push({ recipient, form });
      end = stop;
    }
  }
  const supported =
    matches.find((m) => m.form.kind === "complete") ??
    matches.find((m) => m.form.kind === "surname") ??
    matches.find((m) => m.form.kind === "incomplete");
  if (!supported) return null;
  const { recipient, form } = supported;
  // An exact roster name outranks an inferred omission on the same span.
  // Corroborated surnames and unconfirmed compound surnames can still veto attribution.
  const candidates =
    form.kind === "complete"
      ? matches.filter((m) => m.form.kind !== "incomplete")
      : matches;
  const ids = new Set(candidates.map((m) => m.recipient.id));
  return ids.size > 1
    ? { kind: "ambiguous", candidateIds: [...ids], end }
    : { kind: form.kind, recipientId: recipient.id, end };
}

// Test the very shorthand we would recommend, including competing complete,
// incomplete or unconfirmed forms. A collision affects only this rank/name.
function surnameIsAmbiguous({ id, rank, surname }, recipients) {
  if (!surname || recipients.length === 1) return false;
  const sameRank = recipients.filter((other) => other.rank === rank);
  return (
    matchName(surname, nextToken(surname, 0), sameRank)?.recipientId !== id
  );
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
    recipients: recipients.map((recipient) => ({
      id: recipient.id,
      hasSurnameCandidate: Boolean(recipient.surname),
      surnameIsAmbiguous: surnameIsAmbiguous(recipient, recipients),
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
  const distinctSurnames = new Set(
    recipients
      .filter((r) => r.hasSurnameCandidate && !r.surnameIsAmbiguous)
      .map((r) => r.id),
  );
  const reportedIntermediate = new Set();
  const reportedIncomplete = new Set();
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
    if (ref.kind === "incomplete") {
      let expectedForm = "complete";
      if (distinctSurnames.has(id)) {
        if (intermediate) expectedForm = "surname";
        else if (possiblySeen.has(id)) expectedForm = "review";
      }
      const key = `${id}-${expectedForm}`;
      if (!reportedIncomplete.has(key)) {
        findings.push({
          kind: "incomplete",
          recipientId: id,
          expectedForm,
          start: ref.start,
        });
        reportedIncomplete.add(key);
      }
    }
    if (!intermediate && !possiblySeen.has(id) && ref.kind === "surname")
      findings.push({
        kind: "first-shortened",
        recipientId: id,
        start: ref.start,
      });
    if (
      intermediate &&
      ref.kind === "complete" &&
      distinctSurnames.has(id) &&
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
