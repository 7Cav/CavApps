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

function findSentenceRanges(text) {
  const sentenceRanges = [];
  const sentencePattern = /[^.!?]+[.!?]+/g;

  for (const match of text.matchAll(sentencePattern)) {
    const rawSentence = match[0];

    const leadingWhitespaceLength = rawSentence.match(/^\s*/)?.[0].length ?? 0;

    const trailingWhitespaceLength = rawSentence.match(/\s*$/)?.[0].length ?? 0;

    const start = (match.index ?? 0) + leadingWhitespaceLength;

    const end =
      (match.index ?? 0) + rawSentence.length - trailingWhitespaceLength;

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

export function getRankEntries(rosterMembers) {
  const rankEntriesByShortName = new Map();

  for (const member of rosterMembers) {
    const rankShort = member?.rank?.rankShort?.trim() ?? "";
    const rankFull = member?.rank?.rankFull?.trim() ?? "";

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

  return Array.from(rankEntriesByShortName.values()).sort(
    (a, b) => b.short.length - a.short.length,
  );
}

export function analyzeNarrative(
  narrative,
  { recipientRank, recipientCitationName, rankEntries },
) {
  const text = narrative.trim();
  const warnings = [];
  const highlightRanges = [];

  if (recipientRank && recipientCitationName) {
    const fullIdentityPattern = new RegExp(
      `${buildFlexiblePhrasePattern(
        recipientRank,
      )}\\s+${buildFlexiblePhrasePattern(recipientCitationName)}`,
      "i",
    );

    if (!fullIdentityPattern.test(text)) {
      addWarning(
        warnings,
        "recipient-mention",
        "Recipient mention: The selected recipient's Full Rank Full Name was not detected in the narrative. Verify that the recipient is identified correctly.",
      );
    }
  }

  const sentenceRanges = findSentenceRanges(text);

  if (sentenceRanges.length < 3) {
    addWarning(
      warnings,
      "sentence-count",
      "Sentence count: This medal requires a minimum of three sentences. The narrative may not meet that requirement. Please verify before submitting.",
    );
  }

  if (rankEntries.length > 0) {
    const rankPattern = rankEntries
      .map((rankEntry) => escapeRegExp(rankEntry.short))
      .join("|");

    const possibleRankPattern = new RegExp(
      `(^|[^A-Za-z0-9])(${rankPattern}\\.?)` + `(?=$|[^A-Za-z0-9])`,
      "gi",
    );

    const warnedRankTokens = new Set();

    for (const match of text.matchAll(possibleRankPattern)) {
      const prefix = match[1] ?? "";
      const token = match[2] ?? "";
      const start = (match.index ?? 0) + prefix.length;
      const warningKey = token.toLowerCase();

      addHighlightRange(highlightRanges, start, start + token.length);

      if (!warnedRankTokens.has(warningKey)) {
        warnedRankTokens.add(warningKey);

        addWarning(
          warnings,
          `rank-${warningKey}`,
          `Possible rank usage: "${token}" was detected in the narrative. Verify that this usage and any rank formatting comply with the Medal SOP.`,
        );
      }
    }
  }

  const duplicateWordPattern = /\b([A-Za-z][A-Za-z'’\-]*)\s+\1\b/giu;

  const warnedDuplicateWords = new Set();

  for (const match of text.matchAll(duplicateWordPattern)) {
    const duplicateText = match[0];
    const warningKey = duplicateText.toLowerCase();

    addHighlightRange(
      highlightRanges,
      match.index ?? 0,
      (match.index ?? 0) + duplicateText.length,
    );

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
