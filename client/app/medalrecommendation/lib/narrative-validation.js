import { combineNarrative } from "./citation-builders";
import {
  evaluateRecipientReferences,
  scanRecipientReferences,
} from "./recipient-references";
import { getRecipientDisplayName, getRecipientId } from "./recipient-utils";

const missingRecipientMessage =
  "Recipient mention: The complete recipient identity was not detected in the authored narrative. Verify the first mention uses Full Rank + Complete Roster Name.";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  rankEntries = [],
) {
  // Direct callers supply identity strings without a roster ID or username.
  for (const realName of new Set([recipientCitationName, recipientFullName])) {
    if (!realName) continue;
    const member = {
      user: { userId: "recipient" },
      realName,
      rank: { rankFull: recipientRank },
    };
    if (
      scanRecipientReferences(text, [member], { rankEntries }).references.length
    )
      return true;
  }
  return false;
}

function getRecipientMentionWarnings(
  narrative,
  recipients,
  rankEntries,
  narrativeField,
  systemOpening,
) {
  const systemOwned = narrativeField?.systemOwnedNarrativeOpening;
  // Selectable Service starters can be empty. Wait until the builder supplies
  // its opening before assigning the continuation an intermediate position.
  if (systemOwned && !systemOpening?.trim()) return [];
  const scan = scanRecipientReferences(narrative, recipients, {
    rankEntries,
    recipientIdentityChecks: narrativeField?.recipientIdentityChecks,
  });
  const findings = evaluateRecipientReferences(scan, {
    firstMention: systemOwned ? "generated" : "authored",
    finalMention: "generated",
  });

  const warnings = [];
  let missing = 0;
  for (const { kind, recipientId } of findings) {
    if (kind === "complete-not-detected") {
      missing++;
    } else if (kind === "ambiguous") {
      addWarning(
        warnings,
        "recipient-ambiguous",
        "Recipient mention: A recognized reference could refer to more than one selected recipient. Review the wording to clarify whom you mean.",
      );
    } else {
      const name = getRecipientDisplayName(
        recipients.find((member) => getRecipientId(member) === recipientId),
      );
      if (kind === "first-shortened") {
        addWarning(
          warnings,
          `recipient-first-shortened-${recipientId}`,
          `Recipient mention: The first recognized mention of ${name} appears shortened. Use Full Rank + Complete Roster Name for the first mention.`,
        );
      } else if (kind === "intermediate-complete") {
        addWarning(
          warnings,
          `recipient-intermediate-complete-${recipientId}`,
          `Recipient mention: An intermediate mention of ${name} appears to use the complete name. Use Full Rank + Complete Surname for intermediate mentions.`,
        );
      }
    }
  }
  if (missing) {
    addWarning(
      warnings,
      "recipient-mention",
      recipients.length === 1
        ? missingRecipientMessage
        : `Recipient mentions: A complete identity was not detected for ${missing} of ${recipients.length} recipients. Verify their first mentions.`,
    );
  }
  return warnings;
}

export function getGroupRecipientWarning(
  narrative,
  recipients,
  narrativeField,
) {
  if (recipients.length < 2) return null;
  return (
    getRecipientMentionWarnings(narrative, recipients, [], narrativeField).find(
      ({ key }) => key === "recipient-mention",
    ) ?? null
  );
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
        rankEntries,
      )
    ) {
      addWarning(warnings, "recipient-mention", missingRecipientMessage);
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
    rankEntries,
    minimumNarrativeSentences: medal.minimumNarrativeSentences,
  });
  analysis.warnings.unshift(
    ...getRecipientMentionWarnings(
      narrative,
      recipients,
      rankEntries,
      narrativeField,
      systemOpening,
    ),
  );
  return analysis;
}
