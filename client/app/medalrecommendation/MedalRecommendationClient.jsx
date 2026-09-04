"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import {
  getOperationMedalById,
  OPERATION_MEDALS,
} from "./lib/medal-definitions";
import {
  getServiceMedalById,
  SERVICE_MEDALS,
} from "./lib/service-medal-definitions";
import {
  applyAwardChange,
  getCitationChoiceText,
  resolveMedalWorksheet,
} from "./lib/worksheet-profiles";
import { validateWorksheet } from "./lib/worksheet-validation";

const MEDAL_FAMILIES = {
  operation: {
    medals: OPERATION_MEDALS,
    getMedalById: getOperationMedalById,
    awardPlaceholder: "Select an Operation Medal",
    pageTitle: "Operation Medal Recommendation",
    pageDescription: "Prepare and review an Operation Medal recommendation.",
  },
  service: {
    medals: SERVICE_MEDALS,
    getMedalById: getServiceMedalById,
    awardPlaceholder: "Select a Service Medal",
    pageTitle: "Service Medal Recommendation",
    pageDescription: "Prepare and review a Service Medal recommendation.",
  },
};

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

function combineNarrative(requiredOpening, continuation) {
  const normalizedOpening = requiredOpening.trim();
  const normalizedContinuation = continuation.trim();

  if (!normalizedOpening) {
    return normalizedContinuation;
  }

  if (!normalizedContinuation) {
    return normalizedOpening;
  }

  return `${normalizedOpening} ${normalizedContinuation}`;
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

function getFieldControlId(fieldName) {
  return fieldName.replace(
    /[A-Z]/g,
    (character) => `-${character.toLowerCase()}`,
  );
}

function WorksheetField({
  fieldName,
  field,
  value,
  isInvalid,
  systemOwnedOpening = "",
  warnings = [],
  onChange,
}) {
  const controlId = getFieldControlId(fieldName);
  const errorId = `${controlId}-required`;
  const helperId = `${controlId}-helper`;
  const openingId = `${controlId}-system-opening`;
  const warningsId = `${controlId}-warnings`;
  const hasWarnings = warnings.length > 0;
  const describedBy = [
    systemOwnedOpening ? openingId : null,
    field.helperText ? helperId : null,
    isInvalid ? errorId : null,
    hasWarnings ? warningsId : null,
  ]
    .filter(Boolean)
    .join(" ");
  const errorMessage =
    value && field.invalidMessage ? field.invalidMessage : "Required";

  let control;

  switch (field.type) {
    case "citationChoice":
    case "scopeChoice":
      control = (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id={controlId}
            aria-invalid={isInvalid ? "true" : undefined}
            aria-describedby={describedBy || undefined}
            className={
              isInvalid
                ? "border-destructive focus:ring-destructive"
                : undefined
            }
          >
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>

          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      break;

    case "text":
    case "date":
      control = (
        <Input
          id={controlId}
          type={field.type}
          value={value}
          placeholder={field.placeholder}
          aria-invalid={isInvalid ? "true" : undefined}
          aria-describedby={describedBy || undefined}
          className={
            isInvalid
              ? "border-destructive focus-visible:ring-destructive"
              : undefined
          }
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;

    case "textarea":
      control = field.systemOwnedNarrativeOpening ? (
        <div
          className={`overflow-hidden rounded-md border bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
            isInvalid
              ? "border-destructive focus-within:ring-destructive"
              : hasWarnings
                ? "border-amber-500/50 focus-within:ring-amber-500/30"
                : "border-input"
          }`}
        >
          {systemOwnedOpening && (
            <div
              id={openingId}
              aria-live="polite"
              className="border-b border-input bg-muted/60 px-3 py-2 text-sm text-foreground"
            >
              {systemOwnedOpening}
            </div>
          )}

          <textarea
            id={controlId}
            value={value}
            placeholder={field.placeholder}
            aria-invalid={isInvalid ? "true" : undefined}
            aria-describedby={describedBy || undefined}
            onChange={(event) => onChange(event.target.value)}
            rows={field.rows}
            className="flex w-full resize-y bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden"
          />
        </div>
      ) : (
        <textarea
          id={controlId}
          value={value}
          placeholder={field.placeholder}
          aria-invalid={isInvalid ? "true" : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => onChange(event.target.value)}
          rows={field.rows}
          className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isInvalid
              ? "border-destructive focus-visible:ring-destructive"
              : hasWarnings
                ? "border-amber-500/50 focus-visible:ring-amber-500/30"
                : "border-input"
          }`}
        />
      );
      break;

    default:
      return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={controlId}
        className="pb-1 text-sm font-semibold text-foreground"
      >
        {field.label}
      </label>

      {field.helperText && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {field.helperText}
        </p>
      )}

      {control}

      {isInvalid && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      {hasWarnings && (
        <div
          id={warningsId}
          role="status"
          aria-label="Narrative Warnings"
          className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
        >
          {warnings.map((warning) => (
            <p key={warning.key}>{warning.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MedalRecommendationClient({
  recipientRoster = [],
  medalFamily = "operation",
}) {
  const family = MEDAL_FAMILIES[medalFamily] ?? MEDAL_FAMILIES.operation;

  const { medals, getMedalById, awardPlaceholder, pageTitle, pageDescription } =
    family;

  const [selectedMedalId, setSelectedMedalId] = useState("");

  const [recipientQuery, setRecipientQuery] = useState("");

  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const [worksheetValues, setWorksheetValues] = useState({});

  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);

  const [recommendation, setRecommendation] = useState(null);

  const rosterMembers = useMemo(() => recipientRoster ?? [], [recipientRoster]);

  const selectedMedal = getMedalById(selectedMedalId);

  const displayedEligibilityNotes = selectedMedal?.eligibilityNotes ?? [];

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

  const worksheetValidation = validateWorksheet(
    selectedWorksheet,
    worksheetValues,
  );

  const isComplete = recipientIsValid && worksheetValidation.isComplete;

  const recipientIsInvalid = hasAttemptedGenerate && !recipientIsValid;

  const {
    actionCharacter = "",
    scope = "",
    combatElement = "",
    operationTitle = "",
    location = "",
    operationDate = "",
    affectedArea = "",
    narrative = "",
  } = worksheetValues;

  const recipientCitationName = getCitationName(recipientRosterName);

  const requiredNarrativeOpening =
    selectedMedal?.buildNarrativeOpening && recipientIsValid
      ? selectedMedal.buildNarrativeOpening({
          recipientRank,
          recipientCitationName,
        })
      : "";

  const effectiveNarrative = selectedWorksheet?.fields.narrative
    ?.systemOwnedNarrativeOpening
    ? combineNarrative(requiredNarrativeOpening, narrative)
    : narrative;

  const liveNarrativeAnalysis = useMemo(() => {
    if (
      !selectedMedal?.showLiveNarrativeWarnings ||
      !recipientIsValid ||
      !narrative.trim()
    ) {
      return null;
    }

    return analyzeNarrative(effectiveNarrative, {
      recipientRank,
      recipientCitationName,
      rankEntries,
      minimumNarrativeSentences: selectedMedal.minimumNarrativeSentences,
    });
  }, [
    effectiveNarrative,
    narrative,
    rankEntries,
    recipientCitationName,
    recipientIsValid,
    recipientRank,
    selectedMedal,
  ]);

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

  function handleWorksheetValueChange(fieldName, value) {
    setWorksheetValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    setRecommendation(null);
  }

  function handleGenerate() {
    setHasAttemptedGenerate(true);

    if (!isComplete) {
      setRecommendation(null);
      return;
    }

    setHasAttemptedGenerate(false);

    const formattedDate = operationDate
      ? formatOperationDate(operationDate)
      : "";

    const normalizedOperationTitle = operationTitle
      .trim()
      .replace(/^operation\s+/i, "");

    const citationActionCharacter = selectedWorksheet?.fields.actionCharacter
      ? getCitationChoiceText(
          selectedWorksheet.fields.actionCharacter,
          actionCharacter,
        )
      : "";

    const narrativeAnalysis = analyzeNarrative(effectiveNarrative, {
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
      affectedArea: affectedArea.trim(),
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
    <main className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/medalrecommendation"
        className="inline-flex items-center gap-2 rounded-sm px-1 py-1 text-sm font-medium !text-muted-foreground transition-colors hover:!text-foreground hover:!no-underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
      >
        <span aria-hidden="true">←</span>
        Medal Recommendation Aid
      </Link>

      <header className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          {pageTitle}
        </h1>

        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {pageDescription}
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden border-border/70 bg-card/70 shadow-none">
          <CardHeader className="border-b border-border/70 p-5 sm:p-6">
            <h2
              id="recommendation-worksheet-heading"
              className="text-xl font-semibold text-foreground"
            >
              Recommendation Worksheet
            </h2>
          </CardHeader>

          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="award"
                className="pb-1 text-sm font-semibold text-foreground"
              >
                Award
              </label>

              <Select
                value={selectedMedalId}
                onValueChange={(value) => {
                  const nextMedal = getMedalById(value);

                  const nextWorksheet = resolveMedalWorksheet(nextMedal);

                  const nextValues = applyAwardChange(
                    selectedWorksheet,
                    nextWorksheet,
                    worksheetValues,
                  );

                  setSelectedMedalId(value);
                  setWorksheetValues(nextValues);
                  setHasAttemptedGenerate(false);
                  setRecommendation(null);
                }}
              >
                <SelectTrigger id="award">
                  <SelectValue placeholder={awardPlaceholder} />
                </SelectTrigger>

                <SelectContent>
                  {medals.map((medal) => (
                    <SelectItem key={medal.id} value={medal.id}>
                      {medal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMedal && (
              <>
                <section
                  aria-labelledby="award-guidance-heading"
                  className="space-y-5 border-l-2 border-primary/60 bg-muted/20 p-4 sm:p-5"
                >
                  <h3
                    id="award-guidance-heading"
                    className="text-xs font-semibold tracking-[0.18em] text-primary uppercase"
                  >
                    Award Guidance
                  </h3>

                  <div>
                    <h4 className="text-lg font-semibold text-foreground">
                      {selectedMedal.name}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold text-foreground">
                      {selectedMedal.criteriaHeading ?? "Criteria"}
                    </h5>

                    <p>{selectedMedal.criteria}</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold text-foreground">
                      Narrative Guidance
                    </h5>

                    <p>{selectedMedal.narrativeGuidance}</p>
                  </div>

                  {displayedEligibilityNotes.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-semibold text-foreground">
                        Eligibility Guidance
                      </h5>

                      <ul className="list-disc space-y-1 pl-5">
                        {displayedEligibilityNotes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="recipient"
                    className="pb-1 text-sm font-semibold text-foreground"
                  >
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
                        <p>
                          Selected recipient: {selectedRecipient.user.username}
                        </p>

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

                {selectedWorksheet?.fieldOrder.map((fieldName) => {
                  const field = selectedWorksheet.fields[fieldName];
                  const isInvalid =
                    hasAttemptedGenerate &&
                    !worksheetValidation.fields[fieldName];
                  const warnings =
                    field.feedback === "narrativeWarnings"
                      ? (recommendation?.narrativeWarnings ??
                        liveNarrativeAnalysis?.warnings ??
                        [])
                      : [];

                  return (
                    <WorksheetField
                      key={fieldName}
                      fieldName={fieldName}
                      field={field}
                      value={
                        worksheetValues[fieldName] ?? field.defaultValue ?? ""
                      }
                      isInvalid={isInvalid}
                      systemOwnedOpening={
                        field.systemOwnedNarrativeOpening
                          ? requiredNarrativeOpening
                          : ""
                      }
                      warnings={warnings}
                      onChange={(value) =>
                        handleWorksheetValueChange(fieldName, value)
                      }
                    />
                  );
                })}

                <Button type="button" onClick={handleGenerate}>
                  Generate Recommendation
                </Button>

                {hasAttemptedGenerate && !isComplete && (
                  <p role="alert" className="text-sm font-medium">
                    Complete all required fields before generating a
                    recommendation.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <aside className="self-start lg:sticky lg:top-6">
          <Card className="overflow-hidden border-border/70 bg-card/70 shadow-none">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Review &amp; Output
              </h2>
            </CardHeader>

            <CardContent className="space-y-6 p-5 sm:p-6">
              <section className="space-y-2" aria-labelledby="status-heading">
                <h3
                  id="status-heading"
                  className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
                >
                  Status
                </h3>

                <p
                  role="status"
                  className="text-sm leading-6 text-muted-foreground"
                >
                  {recommendation
                    ? "Recommendation generated. Review the citation below."
                    : isComplete
                      ? "The worksheet is complete. Generate the recommendation when ready."
                      : "Complete the worksheet to generate a recommendation."}
                </p>
              </section>

              <section className="space-y-4 border-t border-border/70 pt-6">
                <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Recommendation Preview
                </h3>

                {recommendation ? (
                  <section
                    role="region"
                    aria-label="Recommendation Preview"
                    className="space-y-5 rounded-lg border border-border/70 bg-background/40 p-5 text-center"
                  >
                    <h4 className="text-xl font-semibold text-foreground">
                      {selectedMedal.name}
                    </h4>

                    <img
                      src={selectedMedal.ribbonUrl}
                      alt={`${selectedMedal.name} ribbon`}
                      className="mx-auto"
                    />

                    <p className="font-medium">{recommendation.recipient}</p>

                    <p
                      aria-label="Citation Narrative"
                      className="text-left leading-7"
                    >
                      {renderCitationNarrative(recommendation)}
                    </p>
                  </section>
                ) : (
                  <p className="rounded-lg border border-dashed border-border/70 px-5 py-10 text-center text-sm text-muted-foreground">
                    Your generated recommendation will appear here.
                  </p>
                )}
              </section>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
