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
import { OPERATION_MEDALS } from "./lib/medal-definitions";
import {
  applyAwardChange,
  getCitationChoiceText,
  resolveMedalWorksheet,
} from "./lib/worksheet-profiles";
import { validateWorksheet } from "./lib/worksheet-validation";

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
  const [selectedMedalId, setSelectedMedalId] = useState("");

  const [recipientQuery, setRecipientQuery] = useState("");

  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const [actionCharacter, setActionCharacter] = useState("");

  const [scope, setScope] = useState("");

  const [combatElement, setCombatElement] = useState("");

  const [operationTitle, setOperationTitle] = useState("");

  const [location, setLocation] = useState("");

  const [operationDate, setOperationDate] = useState("");

  const [narrative, setNarrative] = useState("");

  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);

  const [recommendation, setRecommendation] = useState(null);

  const rosterMembers = useMemo(() => recipientRoster ?? [], [recipientRoster]);

  const selectedMedal =
    OPERATION_MEDALS.find((medal) => medal.id === selectedMedalId) ?? null;

  const selectedWorksheet = resolveMedalWorksheet(selectedMedal);

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

  const worksheetValidation = validateWorksheet(selectedWorksheet, {
    actionCharacter,
    scope,
    combatElement,
    operationTitle,
    location,
    operationDate,
    narrative,
  });

  const actionCharacterIsValid =
    worksheetValidation.fields.actionCharacter ?? true;

  const scopeIsValid = worksheetValidation.fields.scope ?? true;

  const combatElementIsValid =
    worksheetValidation.fields.combatElement ?? false;

  const operationTitleIsValid =
    worksheetValidation.fields.operationTitle ?? false;

  const locationIsValid = worksheetValidation.fields.location ?? false;

  const operationDateIsValid =
    worksheetValidation.fields.operationDate ?? false;

  const narrativeIsValid = worksheetValidation.fields.narrative ?? false;

  const isComplete = recipientIsValid && worksheetValidation.isComplete;

  const recipientIsInvalid = hasAttemptedGenerate && !recipientIsValid;

  const actionCharacterIsInvalid =
    hasAttemptedGenerate &&
    Boolean(selectedWorksheet?.fields.actionCharacter) &&
    !actionCharacterIsValid;

  const scopeIsInvalid =
    hasAttemptedGenerate &&
    Boolean(selectedWorksheet?.fields.scope) &&
    !scopeIsValid;

  const combatElementIsInvalid =
    hasAttemptedGenerate &&
    Boolean(selectedWorksheet?.fields.combatElement) &&
    !combatElementIsValid;

  const operationTitleIsInvalid =
    hasAttemptedGenerate &&
    Boolean(selectedWorksheet?.fields.operationTitle) &&
    !operationTitleIsValid;

  const locationIsInvalid =
    hasAttemptedGenerate &&
    Boolean(selectedWorksheet?.fields.location) &&
    !locationIsValid;

  const operationDateIsInvalid =
    hasAttemptedGenerate &&
    Boolean(selectedWorksheet?.fields.operationDate) &&
    !operationDateIsValid;

  const narrativeIsInvalid =
    hasAttemptedGenerate &&
    Boolean(selectedWorksheet?.fields.narrative) &&
    !narrativeIsValid;

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

    const citationActionCharacter = selectedWorksheet?.fields.actionCharacter
      ? getCitationChoiceText(
          selectedWorksheet.fields.actionCharacter,
          actionCharacter,
        )
      : "";

    const narrativeAnalysis = analyzeNarrative(narrative, {
      recipientRank,
      recipientCitationName,
      rankEntries,
      minimumNarrativeSentences: selectedMedal.minimumNarrativeSentences,
    });

    if (!selectedMedal?.buildOpening || !selectedMedal?.buildClosing) {
      setRecommendation(null);
      return;
    }

    const citationContext = {
      actionCharacter: citationActionCharacter,
      scope,
      combatElement: combatElement.trim(),
      operationTitle: normalizedOperationTitle,
      location: location.trim(),
      date: formattedDate,
      recipientRank,
      recipientCitationName,
    };

    const openingSentence = selectedMedal.buildOpening(citationContext);

    const closingSentence = selectedMedal.buildClosing(citationContext);

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
      <h1 className="mb-6 text-3xl font-bold text-primary">
        Medal Recommendation Aid
      </h1>

      <div className="mb-6 flex flex-col gap-2">
        <label
          htmlFor="award"
          className="pb-1 text-sm font-medium text-foreground"
        >
          Award
        </label>

        <Select
          value={selectedMedalId}
          onValueChange={(value) => {
            const nextMedal =
              OPERATION_MEDALS.find((medal) => medal.id === value) ?? null;

            const nextWorksheet = resolveMedalWorksheet(nextMedal);

            const nextValues = applyAwardChange(
              selectedWorksheet,
              nextWorksheet,
              {
                actionCharacter,
                scope,
                combatElement,
                operationTitle,
                location,
                operationDate,
                narrative,
              },
            );

            setSelectedMedalId(value);
            setActionCharacter(nextValues.actionCharacter ?? "");
            setScope(nextValues.scope ?? "");
            setCombatElement(nextValues.combatElement ?? "");
            setOperationTitle(nextValues.operationTitle ?? "");
            setLocation(nextValues.location ?? "");
            setOperationDate(nextValues.operationDate ?? "");
            setNarrative(nextValues.narrative ?? "");
            setHasAttemptedGenerate(false);
            setRecommendation(null);
          }}
        >
          <SelectTrigger id="award">
            <SelectValue placeholder="Select an Operation Medal" />
          </SelectTrigger>

          <SelectContent>
            {OPERATION_MEDALS.map((medal) => (
              <SelectItem key={medal.id} value={medal.id}>
                {medal.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMedal && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-semibold text-primary">
              {selectedMedal.name}
            </h2>
          </CardHeader>

          <CardContent className="space-y-4">
            <p>{selectedMedal.criteria}</p>

            <div className="space-y-2">
              <h3 className="font-semibold text-primary">Narrative Guidance</h3>
              <p>{selectedMedal.narrativeGuidance}</p>
            </div>

            {selectedMedal.eligibilityNotes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Eligibility</h3>

                <ul className="list-disc space-y-1 pl-5">
                  {selectedMedal.eligibilityNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedMedal && (
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-primary">
              {selectedMedal.name}
            </h2>
          </CardHeader>

          <CardContent className="space-y-6">
            <p>
              Create {/^[aeiou]/i.test(selectedMedal.name) ? "an" : "a"}{" "}
              {selectedMedal.name} recommendation.
            </p>

            <div className="flex flex-col gap-2">
              <label htmlFor="recipient" className="pb-1 text-sm font-medium">
                Recipient
              </label>

              <Input
                id="recipient"
                type="text"
                value={recipientQuery}
                autoComplete="off"
                placeholder="Start typing a last name"
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

            {selectedWorksheet?.fields.actionCharacter && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="action-character"
                  className="pb-1 text-sm font-medium"
                >
                  Action Character
                </label>

                <Select
                  value={actionCharacter}
                  onValueChange={(value) => {
                    setActionCharacter(value);
                    setRecommendation(null);
                  }}
                >
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
                    {selectedWorksheet.fields.actionCharacter.options.map(
                      (option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ),
                    )}
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
            )}

            {selectedWorksheet?.fields.scope && (
              <div className="flex flex-col gap-2">
                <label htmlFor="scope" className="pb-1 text-sm font-medium">
                  Scope
                </label>

                <Select
                  value={scope}
                  onValueChange={(value) => {
                    setScope(value);
                    setRecommendation(null);
                  }}
                >
                  <SelectTrigger
                    id="scope"
                    aria-invalid={scopeIsInvalid ? "true" : undefined}
                    aria-describedby={
                      scopeIsInvalid ? "scope-required" : undefined
                    }
                    className={
                      scopeIsInvalid
                        ? "border-destructive focus:ring-destructive"
                        : undefined
                    }
                  >
                    <SelectValue placeholder="Select action scope" />
                  </SelectTrigger>

                  <SelectContent>
                    {selectedWorksheet.fields.scope.options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {scopeIsInvalid && (
                  <p
                    id="scope-required"
                    className="text-sm font-medium text-destructive"
                  >
                    Required
                  </p>
                )}
              </div>
            )}

            {selectedWorksheet?.fields.combatElement && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="combat-element"
                  className="pb-1 text-sm font-medium"
                >
                  {selectedWorksheet.fields.combatElement.label}
                </label>

                <Input
                  id="combat-element"
                  type="text"
                  value={combatElement}
                  placeholder={
                    selectedWorksheet.fields.combatElement.placeholder
                  }
                  aria-invalid={combatElementIsInvalid ? "true" : undefined}
                  aria-describedby={
                    combatElementIsInvalid
                      ? "combat-element-required"
                      : undefined
                  }
                  className={
                    combatElementIsInvalid
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                  onChange={(event) => {
                    setCombatElement(event.target.value);
                    setRecommendation(null);
                  }}
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
            )}

            {selectedWorksheet?.fields.operationTitle && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="operation-title"
                  className="pb-1 text-sm font-medium"
                >
                  {selectedWorksheet.fields.operationTitle.label}
                </label>

                <Input
                  id="operation-title"
                  type="text"
                  value={operationTitle}
                  placeholder={
                    selectedWorksheet.fields.operationTitle.placeholder
                  }
                  aria-invalid={operationTitleIsInvalid ? "true" : undefined}
                  aria-describedby={
                    operationTitleIsInvalid
                      ? "operation-title-required"
                      : undefined
                  }
                  className={
                    operationTitleIsInvalid
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                  onChange={(event) => {
                    setOperationTitle(event.target.value);
                    setRecommendation(null);
                  }}
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
            )}

            {selectedWorksheet?.fields.location && (
              <div className="flex flex-col gap-2">
                <label htmlFor="location" className="pb-1 text-sm font-medium">
                  {selectedWorksheet.fields.location.label}
                </label>

                <Input
                  id="location"
                  type="text"
                  value={location}
                  placeholder={selectedWorksheet.fields.location.placeholder}
                  aria-invalid={locationIsInvalid ? "true" : undefined}
                  aria-describedby={
                    locationIsInvalid ? "location-required" : undefined
                  }
                  className={
                    locationIsInvalid
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setRecommendation(null);
                  }}
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
            )}

            {selectedWorksheet?.fields.operationDate && (
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="operation-date"
                  className="pb-1 text-sm font-medium"
                >
                  {selectedWorksheet.fields.operationDate.label}
                </label>

                <Input
                  id="operation-date"
                  type="date"
                  value={operationDate}
                  aria-invalid={operationDateIsInvalid ? "true" : undefined}
                  aria-describedby={
                    operationDateIsInvalid
                      ? "operation-date-required"
                      : undefined
                  }
                  className={
                    operationDateIsInvalid
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                  onChange={(event) => {
                    setOperationDate(event.target.value);
                    setRecommendation(null);
                  }}
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
            )}

            {selectedWorksheet?.fields.narrative && (
              <div className="flex flex-col gap-2">
                <label htmlFor="narrative" className="pb-1 text-sm font-medium">
                  {selectedWorksheet.fields.narrative.label}
                </label>

                <textarea
                  id="narrative"
                  value={narrative}
                  placeholder={selectedWorksheet.fields.narrative.placeholder}
                  aria-invalid={narrativeIsInvalid ? "true" : undefined}
                  aria-describedby={
                    narrativeIsInvalid
                      ? "narrative-required"
                      : hasNarrativeWarnings
                        ? "narrative-warnings"
                        : undefined
                  }
                  onChange={(event) => {
                    setNarrative(event.target.value);
                    setRecommendation(null);
                  }}
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
            )}

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
                className="space-y-4 rounded-lg border p-4 text-center"
              >
                <h3 className="text-xl font-semibold">{selectedMedal.name}</h3>

                <img
                  src={selectedMedal.ribbonUrl}
                  alt={`${selectedMedal.name} ribbon`}
                  className="mx-auto"
                />

                <p>{recommendation.recipient}</p>

                <p aria-label="Citation Narrative">
                  {renderCitationNarrative(recommendation)}
                </p>
              </section>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
