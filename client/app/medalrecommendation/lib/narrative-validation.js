import { combineNarrative } from "./citation-builders";
import {
  EXPLICIT_RECIPIENT_LIMIT,
  getRecipientIdentity,
} from "./recipient-utils";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFlexiblePhrasePattern(value) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegExp)
    .join("\\s+");
}

function addWarning(warnings, key, message) {
  if (warnings.some((warning) => warning.key === key)) {
    return;
  }

  warnings.push({
    key,
    message,
  });
}

function addHighlightRange(highlightRanges, start, end) {
  if (start < 0 || end <= start) {
    return;
  }

  highlightRanges.push({
    start,
    end,
  });
}

function formatSentenceMinimum(value) {
  const numberWords = {
    3: "three",
    4: "four",
    5: "five",
  };

  return numberWords[value] ?? String(value);
}

function findSentenceRanges(text) {
  const sentenceRanges = [];
  const isEnding = (character) =>
    character === "." || character === "!" || character === "?";
  let cursor = 0;

  // Visit each character once. A regex that requires terminal punctuation
  // retries every starting position on a long, unfinished final sentence.
  while (cursor < text.length) {
    const sentenceStart = cursor;
    while (cursor < text.length && !isEnding(text[cursor])) cursor += 1;
    if (cursor === text.length) break;
    const punctuationStart = cursor;
    while (cursor < text.length && isEnding(text[cursor])) cursor += 1;
    if (sentenceStart === punctuationStart) continue;
    const rawSentence = text.slice(sentenceStart, cursor);

    const leadingWhitespaceLength = rawSentence.match(/^\s*/)?.[0].length ?? 0;

    const start = sentenceStart + leadingWhitespaceLength;
    // The extracted span ends with punctuation, never trailing whitespace.
    const end = cursor;

    if (end > start) {
      sentenceRanges.push({
        start,
        end,
        text: text.slice(start, end),
      });
    }
  }

  return sentenceRanges;
}

function* findDuplicateWordRanges(text) {
  const isWordCharacter = (character) => /\w/iu.test(character ?? "");
  // Preserve the Unicode case folding of the former /iu word pattern.
  const foldWord = (word) => word.toLowerCase().replace(/ſ/g, "s");
  let previous;
  let matchedEnd = 0;

  for (const match of text.matchAll(/[A-Za-z][A-Za-z'’\-]*/giu)) {
    const current = {
      start: match.index,
      end: match.index + match[0].length,
      word: foldWord(match[0]),
    };
    if (previous && /^\s+$/u.test(text.slice(previous.end, current.start))) {
      // A hyphen/apostrophe can begin a later word boundary within a token.
      // KMP prefix links find matching suffixes without rescanning that token
      // from every boundary (quadratic for a long "a-a-a-" chain).
      const word = current.word;
      const prefixes = new Uint32Array(word.length);
      for (let i = 1, length = 0; i < word.length; i += 1) {
        while (length && word[i] !== word[length])
          length = prefixes[length - 1];
        if (word[i] === word[length]) length += 1;
        prefixes[i] = length;
      }
      let length = 0;
      for (const character of previous.word) {
        while (length && character !== word[length])
          length = prefixes[length - 1];
        if (character === word[length]) length += 1;
      }
      // Longest suffix first preserves the earliest valid, nonoverlapping
      // match, including a second occurrence ending inside a compound word.
      while (length) {
        const start = previous.end - length;
        const end = current.start + length;
        if (
          start >= matchedEnd &&
          !isWordCharacter(text[start - 1]) &&
          isWordCharacter(text[end - 1]) !== isWordCharacter(text[end])
        ) {
          yield { start, end };
          matchedEnd = end;
          break;
        }
        length = prefixes[length - 1];
      }
    }
    previous = current;
  }
}

export function getRankEntries(rosterMembers) {
  const rankEntriesByShortName = new Map();

  for (const member of rosterMembers) {
    const rankShort =
      typeof member?.rank?.rankShort === "string"
        ? member.rank.rankShort.trim()
        : "";
    const rankFull =
      typeof member?.rank?.rankFull === "string"
        ? member.rank.rankFull.trim()
        : "";

    if (
      !rankShort ||
      !rankFull ||
      rankShort.toLowerCase() === rankFull.toLowerCase()
    ) {
      continue;
    }

    const key = rankShort.toLowerCase();

    if (!rankEntriesByShortName.has(key)) {
      rankEntriesByShortName.set(key, {
        short: rankShort,
        full: rankFull,
      });
    }
  }

  return Array.from(rankEntriesByShortName.values());
}

export function hasRecipientIdentity(
  text,
  recipientRank,
  recipientCitationName,
  recipientFullName,
) {
  return [recipientCitationName, recipientFullName]
    .filter(Boolean)
    .some((name) => {
      const fullIdentityPattern = new RegExp(
        `${buildFlexiblePhrasePattern(recipientRank)}\\s+${buildFlexiblePhrasePattern(name)}`,
        "i",
      );
      return fullIdentityPattern.test(text);
    });
}

export function getGroupRecipientWarning(
  narrative,
  recipients,
  narrativeField,
) {
  if (
    narrativeField?.recipientIdentityChecks === false ||
    narrativeField?.systemOwnedNarrativeOpening ||
    recipients.length < 2 ||
    recipients.length > EXPLICIT_RECIPIENT_LIMIT
  )
    return null;

  const missing = recipients.filter((member) => {
    const { recipientRank, recipientCitationName } =
      getRecipientIdentity(member);
    return !hasRecipientIdentity(
      narrative,
      recipientRank,
      recipientCitationName,
      member.realName,
    );
  }).length;

  return missing
    ? {
        key: "recipient-mention",
        message: `${missing} of ${recipients.length} recipients ${missing === 1 ? "is" : "are"} not referenced in the narrative. Ensure each recipient is properly cited before submitting the recommendation.`,
      }
    : null;
}

export function analyzeNarrative(
  narrative,
  {
    recipientRank,
    recipientCitationName,
    recipientFullName,
    rankEntries,
    minimumNarrativeSentences = 3,
  },
) {
  const text = narrative.trim();
  const warnings = [];
  const highlightRanges = [];

  if (recipientRank && recipientCitationName) {
    if (
      !hasRecipientIdentity(
        text,
        recipientRank,
        recipientCitationName,
        recipientFullName,
      )
    ) {
      addWarning(
        warnings,
        "recipient-mention",
        "Recipient mention: The selected recipient's Full Rank Full Name was not detected in the narrative. Verify that the recipient is identified correctly.",
      );
    }
  }

  const sentenceRanges = findSentenceRanges(text);

  if (sentenceRanges.length < minimumNarrativeSentences) {
    addWarning(
      warnings,
      "sentence-count",
      `Sentence count: This medal requires a minimum of ${formatSentenceMinimum(
        minimumNarrativeSentences,
      )} sentences. The narrative may not meet that requirement. Please verify before submitting.`,
    );
  }

  if (rankEntries.length > 0) {
    const rankPattern = rankEntries
      .map((rankEntry) => escapeRegExp(rankEntry.short))
      .join("|");

    const possibleRankPattern = new RegExp(
      `(^|[^A-Za-z0-9])((?:${rankPattern})\\.?)` + `(?=$|[^A-Za-z0-9])`,
      "gi",
    );

    for (const match of text.matchAll(possibleRankPattern)) {
      const prefix = match[1] ?? "";
      const token = match[2] ?? "";
      const start = (match.index ?? 0) + prefix.length;
      const warningKey = token.replace(/\.$/, "").toLowerCase();

      addHighlightRange(highlightRanges, start, start + token.length);

      addWarning(
        warnings,
        `rank-${warningKey}`,
        `Possible rank usage: "${token}" was detected in the narrative. Verify that this usage and any rank formatting comply with the Medal SOP.`,
      );
    }
  }

  const warnedDuplicateWords = new Set();

  for (const { start, end } of findDuplicateWordRanges(text)) {
    const duplicateText = text.slice(start, end);
    const warningKey = duplicateText.toLowerCase();

    addHighlightRange(highlightRanges, start, end);

    if (!warnedDuplicateWords.has(warningKey)) {
      warnedDuplicateWords.add(warningKey);

      addWarning(
        warnings,
        `duplicate-word-${warningKey}`,
        `Possible duplicate: "${duplicateText}" was detected in the narrative. Verify that the repetition is intentional.`,
      );
    }
  }

  const sentenceGroups = new Map();

  for (const sentence of sentenceRanges) {
    const normalizedSentence = sentence.text
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!normalizedSentence) {
      continue;
    }

    const existingRanges = sentenceGroups.get(normalizedSentence) ?? [];

    existingRanges.push(sentence);

    sentenceGroups.set(normalizedSentence, existingRanges);
  }

  let hasDuplicateSentence = false;

  for (const ranges of sentenceGroups.values()) {
    if (ranges.length < 2) {
      continue;
    }

    hasDuplicateSentence = true;

    for (const range of ranges) {
      addHighlightRange(highlightRanges, range.start, range.end);
    }
  }

  if (hasDuplicateSentence) {
    addWarning(
      warnings,
      "duplicate-sentence",
      "Possible duplicate sentence: This sentence appears more than once in the narrative. Verify that it was not duplicated accidentally.",
    );
  }

  const repeatedPunctuationPattern = /([.,;:!?])\1+/g;

  let hasRepeatedPunctuation = false;

  for (const match of text.matchAll(repeatedPunctuationPattern)) {
    if (match[0] === "...") {
      continue;
    }

    hasRepeatedPunctuation = true;

    addHighlightRange(
      highlightRanges,
      match.index ?? 0,
      (match.index ?? 0) + match[0].length,
    );
  }

  if (hasRepeatedPunctuation) {
    addWarning(
      warnings,
      "repeated-punctuation",
      "Possible punctuation error: Repeated punctuation was detected. Verify this section before submitting.",
    );
  }

  return {
    text,
    warnings,
    highlightRanges,
  };
}

export function mergeHighlightRanges(highlightRanges) {
  const sortedRanges = [...highlightRanges].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  );

  const mergedRanges = [];

  for (const range of sortedRanges) {
    const previousRange = mergedRanges[mergedRanges.length - 1];

    if (!previousRange || range.start > previousRange.end) {
      mergedRanges.push({ ...range });
      continue;
    }

    previousRange.end = Math.max(previousRange.end, range.end);
  }

  return mergedRanges;
}

export function analyzeRecommendationNarrative(
  narrative,
  recipients,
  systemOpening,
  medal,
  rankEntries,
  narrativeField,
) {
  const systemOwnedNarrativeOpening =
    narrativeField?.systemOwnedNarrativeOpening;
  const text =
    systemOwnedNarrativeOpening && systemOpening
      ? combineNarrative(systemOpening, narrative)
      : narrative;
  const analysis = analyzeNarrative(text, {
    ...(narrativeField?.recipientIdentityChecks !== false &&
    !systemOwnedNarrativeOpening &&
    recipients.length === 1
      ? {
          ...getRecipientIdentity(recipients[0]),
          recipientFullName: recipients[0].realName,
        }
      : {}),
    rankEntries,
    minimumNarrativeSentences: medal.minimumNarrativeSentences,
  });
  // User-owned identity checks inspect authored narrative, never generated prose.
  const groupWarning = getGroupRecipientWarning(
    narrative,
    recipients,
    narrativeField,
  );
  if (groupWarning) analysis.warnings.unshift(groupWarning);
  return analysis;
}
