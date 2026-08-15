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
import {
  analyzeNarrative,
  getRankEntries,
  mergeHighlightRanges,
} from "./lib/narrative-validation";

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

function getCitationName(fullName) {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length < 2) {
    return fullName.trim();
  }

  return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
}

function isOperationDateValid(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  const now = new Date();
  const localToday = [
    String(now.getFullYear()).padStart(4, "0"),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return value <= localToday;
}

function renderNarrativeWithHighlights(text, highlightRanges) {
  const ranges = mergeHighlightRanges(highlightRanges);

  if (ranges.length === 0) {
    return text;
  }

  const parts = [];
  let cursor = 0;

  for (const [index, range] of ranges.entries()) {
    if (range.start > cursor) {
      parts.push(text.slice(cursor, range.start));
    }

    parts.push(
      <mark
        key={`warning-${index}`}
        className="rounded-sm border-b border-amber-400/50 bg-amber-400/10 px-0.5 text-inherit"
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );

    cursor = range.end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

function requiresEligibilityWarning(recipient) {
  return Boolean(recipient && recipient.roster !== "ROSTER_TYPE_COMBAT");
}

function renderCitationNarrative(recommendation) {
  return (
    <>
      {recommendation.openingSentence}{" "}
      {renderNarrativeWithHighlights(
        recommendation.narrative,
        recommendation.highlightRanges,
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

  const operationDateIsValid = isOperationDateValid(operationDate);

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

  const hasNarrativeWarnings = Boolean(
    recommendation?.narrativeWarnings?.length,
  );

  const operationDateErrorMessage = operationDate
    ? "Date must be today or earlier"
    : "Required";

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

    const normalizedOperationTitle = operationTitle
      .trim()
      .replace(/^operation\s+/i, "");

    const narrativeAnalysis = analyzeNarrative(narrative, {
      recipientRank,
      recipientCitationName,
      rankEntries,
    });

    const openingSentence =
      `For ${actionCharacter} actions over an entire operation while serving as ` +
      `${combatElement.trim()} in the 7th Cavalry Regiment during combat in ` +
      `Operation ${normalizedOperationTitle} near ${location.trim()} on ${formattedDate}.`;

    const closingSentence =
      `${recipientRank} ${recipientCitationName}'s ${actionCharacter} actions ` +
      "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    setRecommendation({
      recipient: `${recipientRank} ${recipientCitationName}`,
      openingSentence,
      narrative: narrativeAnalysis.text,
      highlightRanges: narrativeAnalysis.highlightRanges,
      narrativeWarnings: narrativeAnalysis.warnings,
      closingSentence,
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
                {operationDateErrorMessage}
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
                narrativeIsInvalid
                  ? "narrative-required"
                  : hasNarrativeWarnings
                    ? "narrative-warnings"
                    : undefined
              }
              onChange={(event) => setNarrative(event.target.value)}
              rows={8}
              className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                narrativeIsInvalid
                  ? "border-destructive focus-visible:ring-destructive"
                  : hasNarrativeWarnings
                    ? "border-amber-500/50 focus-visible:ring-amber-500/30"
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

            {hasNarrativeWarnings && (
              <div
                id="narrative-warnings"
                role="status"
                aria-label="Narrative Warnings"
                className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
              >
                {recommendation.narrativeWarnings.map((warning) => (
                  <p key={warning.key}>{warning.message}</p>
                ))}
              </div>
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
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
