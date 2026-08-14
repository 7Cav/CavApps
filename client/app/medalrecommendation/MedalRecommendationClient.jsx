"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ARCOM_RIBBON_URL = "https://wiki.7cav.us/images/d/dc/ARCOM.jpg";

function formatOperationDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCitationName(fullName) {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length < 2) {
    return fullName.trim();
  }

  return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
}

function getRankEntries(rosterMembers) {
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

function isBareLastNameInsideAnotherName(text, matchIndex) {
  const precedingText = text.slice(0, matchIndex);
  const precedingTokenMatch = precedingText.match(
    /([A-Za-z][A-Za-z.'’\-]*)\s+$/,
  );

  if (!precedingTokenMatch) {
    return false;
  }

  const precedingToken = precedingTokenMatch[1];

  return /[A-Z]/.test(precedingToken);
}

function normalizeNarrativeFormatting(narrative, recipient, rankEntries) {
  const text = narrative.trim();

  const recipientRankFull = recipient?.rank?.rankFull?.trim() ?? "";
  const recipientRankShort = recipient?.rank?.rankShort?.trim() ?? "";
  const rosterFullName = recipient?.realName?.trim() ?? "";

  if (!recipientRankFull || !rosterFullName) {
    return {
      segments: [{ text, adjusted: false }],
      hasAdjustments: false,
    };
  }

  const citationName = getCitationName(rosterFullName);
  const nameParts = citationName.split(/\s+/);
  const lastName = nameParts[nameParts.length - 1];

  if (!citationName || !lastName) {
    return {
      segments: [{ text, adjusted: false }],
      hasAdjustments: false,
    };
  }

  const possibleRecipientMentions = [
    `${escapeRegExp(recipientRankFull)}\\s+${escapeRegExp(rosterFullName)}`,
    `${escapeRegExp(recipientRankFull)}\\s+${escapeRegExp(citationName)}`,
    `${escapeRegExp(recipientRankFull)}\\s+${escapeRegExp(lastName)}`,
    recipientRankShort
      ? `${escapeRegExp(recipientRankShort)}\\.?\\s+${escapeRegExp(rosterFullName)}`
      : "",
    recipientRankShort
      ? `${escapeRegExp(recipientRankShort)}\\.?\\s+${escapeRegExp(citationName)}`
      : "",
    recipientRankShort
      ? `${escapeRegExp(recipientRankShort)}\\.?\\s+${escapeRegExp(lastName)}`
      : "",
    escapeRegExp(rosterFullName),
    escapeRegExp(citationName),
    escapeRegExp(lastName),
  ]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort((a, b) => b.length - a.length);

  const rankShortPattern = rankEntries
    .map((rankEntry) => escapeRegExp(rankEntry.short))
    .join("|");

  const otherTrooperRankPattern = rankShortPattern
    ? `(?:${rankShortPattern})\\.?\\s+(?:[A-Za-z]\\.|[A-Za-z][A-Za-z'’\\-]*)`
    : "(?!)";

  const combinedPattern = new RegExp(
    `(^|[^A-Za-z0-9])(?:(${possibleRecipientMentions.join("|")})|(${otherTrooperRankPattern}))(?=$|[^A-Za-z0-9])`,
    "gi",
  );

  const segments = [];
  let cursor = 0;
  let recipientMentionCount = 0;

  for (const match of text.matchAll(combinedPattern)) {
    const prefix = match[1] ?? "";
    const originalText = match[2] ?? match[3] ?? "";
    const matchIndex = (match.index ?? 0) + prefix.length;

    if (matchIndex > cursor) {
      segments.push({
        text: text.slice(cursor, matchIndex),
        adjusted: false,
      });
    }

    if (match[2] !== undefined) {
      const isBareLastName =
        originalText.toLowerCase() === lastName.toLowerCase();

      const shouldPreserveBareLastName =
        isBareLastName &&
        (originalText !== lastName ||
          isBareLastNameInsideAnotherName(text, matchIndex));

      if (shouldPreserveBareLastName) {
        segments.push({
          text: originalText,
          adjusted: false,
        });

        cursor = matchIndex + originalText.length;
        continue;
      }

      const replacement =
        recipientMentionCount === 0
          ? `${recipientRankFull} ${citationName}`
          : `${recipientRankFull} ${lastName}`;

      recipientMentionCount += 1;

      segments.push({
        text: replacement,
        adjusted: originalText !== replacement,
      });
    } else {
      const rankEntry = rankEntries.find((entry) => {
        const rankPrefixPattern = new RegExp(
          `^${escapeRegExp(entry.short)}\\.?\\s`,
          "i",
        );

        return rankPrefixPattern.test(originalText);
      });

      if (!rankEntry) {
        segments.push({
          text: originalText,
          adjusted: false,
        });
      } else {
        const rankPrefixPattern = new RegExp(
          `^${escapeRegExp(rankEntry.short)}\\.?`,
          "i",
        );

        const replacement = originalText.replace(
          rankPrefixPattern,
          rankEntry.full,
        );

        segments.push({
          text: replacement,
          adjusted: replacement !== originalText,
        });
      }
    }

    cursor = matchIndex + originalText.length;
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      adjusted: false,
    });
  }

  if (segments.length === 0) {
    segments.push({
      text,
      adjusted: false,
    });
  }

  return {
    segments,
    hasAdjustments: segments.some((segment) => segment.adjusted),
  };
}

function requiresEligibilityWarning(recipient) {
  return Boolean(recipient && recipient.roster !== "ROSTER_TYPE_COMBAT");
}

function renderCitationNarrative(recommendation) {
  return (
    <>
      {recommendation.openingSentence}{" "}
      {recommendation.narrativeSegments.map((segment, index) =>
        segment.adjusted ? (
          <mark
            key={`adjustment-${index}`}
            className="rounded-sm border-b border-amber-400/50 bg-amber-400/10 px-0.5 text-inherit"
          >
            {segment.text}
          </mark>
        ) : (
          segment.text
        ),
      )}{" "}
      {recommendation.closingSentence}
    </>
  );
}

export default function MedalRecommendationClient({ recipientRoster = [] }) {
  const [recipientQuery, setRecipientQuery] = useState("");

  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const [actionCharacter, setActionCharacter] = useState("");

  const [combatElement, setCombatElement] = useState("");

  const [operationTitle, setOperationTitle] = useState("");

  const [location, setLocation] = useState("");

  const [operationDate, setOperationDate] = useState("");

  const [narrative, setNarrative] = useState("");

  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);

  const [recommendation, setRecommendation] = useState(null);

  const rosterMembers = useMemo(() => recipientRoster ?? [], [recipientRoster]);

  const rankEntries = useMemo(
    () => getRankEntries(rosterMembers),
    [rosterMembers],
  );

  const suggestions = useMemo(() => {
    const query = recipientQuery.trim().toLowerCase();

    if (
      query.length < 3 ||
      selectedRecipient?.user?.username === recipientQuery
    ) {
      return [];
    }

    return rosterMembers
      .filter((member) => member?.user?.username?.toLowerCase().includes(query))
      .slice(0, 10);
  }, [recipientQuery, rosterMembers, selectedRecipient]);

  const recipientRank = selectedRecipient?.rank?.rankFull?.trim() ?? "";

  const recipientRosterName = selectedRecipient?.realName?.trim() ?? "";

  const recipientIsValid = Boolean(
    selectedRecipient && recipientRank && recipientRosterName,
  );

  const actionCharacterIsValid = Boolean(actionCharacter);

  const combatElementIsValid = Boolean(combatElement.trim());

  const operationTitleIsValid = Boolean(operationTitle.trim());

  const locationIsValid = Boolean(location.trim());

  const operationDateIsValid = Boolean(operationDate);

  const narrativeIsValid = Boolean(narrative.trim());

  const isComplete =
    recipientIsValid &&
    actionCharacterIsValid &&
    combatElementIsValid &&
    operationTitleIsValid &&
    locationIsValid &&
    operationDateIsValid &&
    narrativeIsValid;

  const recipientIsInvalid = hasAttemptedGenerate && !recipientIsValid;

  const actionCharacterIsInvalid =
    hasAttemptedGenerate && !actionCharacterIsValid;

  const combatElementIsInvalid = hasAttemptedGenerate && !combatElementIsValid;

  const operationTitleIsInvalid =
    hasAttemptedGenerate && !operationTitleIsValid;

  const locationIsInvalid = hasAttemptedGenerate && !locationIsValid;

  const operationDateIsInvalid = hasAttemptedGenerate && !operationDateIsValid;

  const narrativeIsInvalid = hasAttemptedGenerate && !narrativeIsValid;

  function selectRecipient(member) {
    setSelectedRecipient(member);
    setRecipientQuery(member.user.username);
    setRecommendation(null);
  }

  function handleRecipientQueryChange(event) {
    setRecipientQuery(event.target.value);
    setSelectedRecipient(null);
    setRecommendation(null);
  }

  function handleGenerate() {
    setHasAttemptedGenerate(true);

    if (!isComplete) {
      setRecommendation(null);
      return;
    }

    setHasAttemptedGenerate(false);

    const recipientCitationName = getCitationName(recipientRosterName);

    const formattedDate = formatOperationDate(operationDate);

    const normalizedNarrative = normalizeNarrativeFormatting(
      narrative,
      selectedRecipient,
      rankEntries,
    );

    const openingSentence =
      `For ${actionCharacter} actions over an entire operation while serving as ` +
      `${combatElement.trim()} in the 7th Cavalry Regiment during combat in ` +
      `Operation ${operationTitle.trim()} near ${location.trim()} on ${formattedDate}.`;

    const closingSentence =
      `${recipientRank} ${recipientCitationName}'s ${actionCharacter} actions ` +
      "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    setRecommendation({
      recipient: `${recipientRank} ${recipientCitationName}`,
      openingSentence,
      narrativeSegments: normalizedNarrative.segments,
      closingSentence,
      hasFormattingAdjustments: normalizedNarrative.hasAdjustments,
    });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-3xl font-bold">Medal Recommendation Aid</h1>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Army Commendation Medal</h2>
        </CardHeader>

        <CardContent className="space-y-6">
          <p>Create an Army Commendation Medal recommendation.</p>

          <div className="space-y-2">
            <label htmlFor="recipient" className="text-sm font-medium">
              Recipient
            </label>

            <Input
              id="recipient"
              type="text"
              value={recipientQuery}
              autoComplete="off"
              placeholder="Enter a 7Cav username"
              aria-invalid={recipientIsInvalid ? "true" : undefined}
              aria-describedby={
                recipientIsInvalid ? "recipient-required" : undefined
              }
              className={
                recipientIsInvalid
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
              onChange={handleRecipientQueryChange}
            />

            {recipientIsInvalid && (
              <p
                id="recipient-required"
                className="text-sm font-medium text-destructive"
              >
                Required
              </p>
            )}

            {suggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                {suggestions.map((member) => (
                  <Button
                    key={member.user.userId}
                    type="button"
                    variant="outline"
                    onClick={() => selectRecipient(member)}
                  >
                    {member.user.username}
                  </Button>
                ))}
              </div>
            )}

            {selectedRecipient && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <p>Selected recipient: {selectedRecipient.user.username}</p>

                  <p className="font-medium">
                    {selectedRecipient.rank?.rankFull}{" "}
                    {selectedRecipient.realName}
                  </p>
                </div>

                {requiresEligibilityWarning(selectedRecipient) && (
                  <div
                    role="status"
                    className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm"
                  >
                    This member is not an active member, please confirm
                    eligibility.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="action-character" className="text-sm font-medium">
              Action Character
            </label>

            <Select value={actionCharacter} onValueChange={setActionCharacter}>
              <SelectTrigger
                id="action-character"
                aria-invalid={actionCharacterIsInvalid ? "true" : undefined}
                aria-describedby={
                  actionCharacterIsInvalid
                    ? "action-character-required"
                    : undefined
                }
                className={
                  actionCharacterIsInvalid
                    ? "border-destructive focus:ring-destructive"
                    : undefined
                }
              >
                <SelectValue placeholder="Select action character" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="skillful">Skillful</SelectItem>

                <SelectItem value="heroic">Heroic</SelectItem>
              </SelectContent>
            </Select>

            {actionCharacterIsInvalid && (
              <p
                id="action-character-required"
                className="text-sm font-medium text-destructive"
              >
                Required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="combat-element" className="text-sm font-medium">
              Combat Element
            </label>

            <Input
              id="combat-element"
              type="text"
              value={combatElement}
              aria-invalid={combatElementIsInvalid ? "true" : undefined}
              aria-describedby={
                combatElementIsInvalid ? "combat-element-required" : undefined
              }
              className={
                combatElementIsInvalid
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
              onChange={(event) => setCombatElement(event.target.value)}
            />

            {combatElementIsInvalid && (
              <p
                id="combat-element-required"
                className="text-sm font-medium text-destructive"
              >
                Required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="operation-title" className="text-sm font-medium">
              Operation Title
            </label>

            <Input
              id="operation-title"
              type="text"
              value={operationTitle}
              aria-invalid={operationTitleIsInvalid ? "true" : undefined}
              aria-describedby={
                operationTitleIsInvalid ? "operation-title-required" : undefined
              }
              className={
                operationTitleIsInvalid
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
              onChange={(event) => setOperationTitle(event.target.value)}
            />

            {operationTitleIsInvalid && (
              <p
                id="operation-title-required"
                className="text-sm font-medium text-destructive"
              >
                Required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>

            <Input
              id="location"
              type="text"
              value={location}
              aria-invalid={locationIsInvalid ? "true" : undefined}
              aria-describedby={
                locationIsInvalid ? "location-required" : undefined
              }
              className={
                locationIsInvalid
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
              onChange={(event) => setLocation(event.target.value)}
            />

            {locationIsInvalid && (
              <p
                id="location-required"
                className="text-sm font-medium text-destructive"
              >
                Required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="operation-date" className="text-sm font-medium">
              Operation Date
            </label>

            <Input
              id="operation-date"
              type="date"
              value={operationDate}
              aria-invalid={operationDateIsInvalid ? "true" : undefined}
              aria-describedby={
                operationDateIsInvalid ? "operation-date-required" : undefined
              }
              className={
                operationDateIsInvalid
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
              onChange={(event) => setOperationDate(event.target.value)}
            />

            {operationDateIsInvalid && (
              <p
                id="operation-date-required"
                className="text-sm font-medium text-destructive"
              >
                Required
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="narrative" className="text-sm font-medium">
              Narrative
            </label>

            <textarea
              id="narrative"
              value={narrative}
              aria-invalid={narrativeIsInvalid ? "true" : undefined}
              aria-describedby={
                narrativeIsInvalid ? "narrative-required" : undefined
              }
              onChange={(event) => setNarrative(event.target.value)}
              rows={8}
              className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                narrativeIsInvalid
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              }`}
            />

            {narrativeIsInvalid && (
              <p
                id="narrative-required"
                className="text-sm font-medium text-destructive"
              >
                Required
              </p>
            )}
          </div>

          <Button type="button" onClick={handleGenerate}>
            Generate Recommendation
          </Button>

          {hasAttemptedGenerate && !isComplete && (
            <p role="alert" className="text-sm font-medium">
              Complete all required fields before generating a recommendation.
            </p>
          )}

          {recommendation && (
            <section
              role="region"
              aria-label="Recommendation Preview"
              className="space-y-4 rounded-lg border p-4"
            >
              <h3 className="text-xl font-semibold">Army Commendation Medal</h3>

              <img
                src={ARCOM_RIBBON_URL}
                alt="Army Commendation Medal ribbon"
                className="h-auto w-40 max-w-full"
              />

              <p>{recommendation.recipient}</p>

              <p aria-label="Citation Narrative">
                {renderCitationNarrative(recommendation)}
              </p>

              {recommendation.hasFormattingAdjustments && (
                <div
                  role="status"
                  aria-label="Formatting Adjustments"
                  className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
                >
                  Formatting adjustments were applied automatically. Review the
                  highlighted changes before submitting.
                </div>
              )}
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
