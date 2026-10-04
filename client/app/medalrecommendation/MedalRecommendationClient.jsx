"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  analyzeRecommendationNarrative,
  getRankEntries,
  mergeHighlightRanges,
} from "./lib/narrative-validation";
import { resolveRecommendationRecipientSubject } from "./lib/citation-builders";
import {
  getMedalFamily,
  groupMedalsByAwardCategory,
} from "./lib/medal-families";
import {
  applyAwardChange,
  getActiveWorksheetValues,
  isWorksheetFieldActive,
  resolveMedalWorksheet,
} from "./lib/worksheet-profiles";
import { validateWorksheet } from "./lib/worksheet-validation";
import { generateRecommendation } from "./lib/recommendation-generation";
import { buildMilpacsUrl } from "./lib/recommendation-export";
import RecommendationSubmission from "./RecommendationSubmission";
import ServiceMonthYearField from "./ServiceMonthYearField";
import RecipientManager from "./RecipientManager";
import {
  RECIPIENT_INLINE_LIMIT,
  RECIPIENT_SELECTION_POLICY,
  buildRecipientOrganizations,
  getRecipientDisplayName,
  getRecipientId,
  orderRecipientsForRecommendation,
  uniqueRecipients,
  validateRecipientEntries,
} from "./lib/recipient-utils";

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
  validationError,
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
    validationError ??
    (value && field.invalidMessage ? field.invalidMessage : "Required");

  let control;

  switch (field.type) {
    case "citationChoice":
    case "semanticChoice":
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

    case "monthYear":
      control = (
        <ServiceMonthYearField
          id={controlId}
          label={field.label}
          value={value}
          isInvalid={isInvalid}
          describedBy={describedBy}
          onChange={onChange}
        />
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
          aria-label={`${field.label} Warnings`}
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
  rosterGroups = [],
  medalFamily,
}) {
  const family = getMedalFamily(medalFamily);

  const { medals, getMedalById, awardPlaceholder, pageTitle, pageDescription } =
    family;
  const awardGroups = useMemo(
    () => groupMedalsByAwardCategory(medals),
    [medals],
  );

  const [selectedMedalId, setSelectedMedalId] = useState("");

  const [recipientEntries, setRecipientEntries] = useState([
    { slotId: 0, query: "", member: null },
  ]);
  const nextSlotId = useRef(1);

  const [worksheetValues, setWorksheetValues] = useState({});

  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);

  const [recommendation, setRecommendation] = useState(null);
  const generationId = useRef(0);

  const rosterMembers = useMemo(
    () => uniqueRecipients(recipientRoster ?? []),
    [recipientRoster],
  );
  const organizations = useMemo(
    () => buildRecipientOrganizations(rosterMembers, rosterGroups),
    [rosterMembers, rosterGroups],
  );
  const recipients = useMemo(
    () => uniqueRecipients(recipientEntries.map((entry) => entry.member)),
    [recipientEntries],
  );
  const recommendationRecipients = useMemo(
    () => orderRecipientsForRecommendation(recipients),
    [recipients],
  );

  const selectedMedal = getMedalById(selectedMedalId);

  const displayedEligibilityNotes = selectedMedal?.eligibilityNotes ?? [];

  const selectedWorksheet = useMemo(
    () => resolveMedalWorksheet(selectedMedal),
    [selectedMedal],
  );
  const recipientPolicy = selectedWorksheet?.recipientPolicy;

  const narrativeField = selectedWorksheet?.fields?.narrative;

  const supportsLiveNarrativeWarnings =
    narrativeField?.feedback === "narrativeWarnings";

  const rankEntries = useMemo(
    () => getRankEntries(rosterMembers),
    [rosterMembers],
  );

  const recipientValidation = recipientPolicy
    ? validateRecipientEntries(recipientEntries, recipientPolicy)
    : { isComplete: false, errors: [] };

  const worksheetValidation = validateWorksheet(
    selectedWorksheet,
    worksheetValues,
  );

  const isComplete =
    recipientValidation.isComplete && worksheetValidation.isComplete;

  const activeWorksheetValues = useMemo(
    () => getActiveWorksheetValues(selectedWorksheet, worksheetValues),
    [selectedWorksheet, worksheetValues],
  );

  const narrative = worksheetValues.narrative ?? "";

  const requiredNarrativeOpening = useMemo(() => {
    if (!selectedMedal?.buildNarrativeOpening) return "";
    if (
      narrativeField?.systemOpeningRequiresCompleteRecipients !== false &&
      !recipientValidation.isComplete
    )
      return "";
    return selectedMedal.buildNarrativeOpening({
      ...activeWorksheetValues,
      recipientSubject: recommendationRecipients.length
        ? resolveRecommendationRecipientSubject(recommendationRecipients)
        : undefined,
    });
  }, [
    activeWorksheetValues,
    narrativeField,
    recommendationRecipients,
    recipientValidation.isComplete,
    selectedMedal,
  ]);

  const liveNarrativeAnalysis = useMemo(() => {
    if (
      !supportsLiveNarrativeWarnings ||
      (narrativeField?.liveWarningsRequireCompleteRecipients !== false &&
        !recipientValidation.isComplete) ||
      !narrative.trim()
    )
      return null;
    return analyzeRecommendationNarrative(
      narrative,
      recommendationRecipients,
      requiredNarrativeOpening,
      selectedMedal,
      rankEntries,
      narrativeField,
    );
  }, [
    narrative,
    recommendationRecipients,
    requiredNarrativeOpening,
    selectedMedal,
    rankEntries,
    recipientValidation.isComplete,
    supportsLiveNarrativeWarnings,
    narrativeField,
  ]);

  function updateRecipientEntries(entries) {
    setRecipientEntries(entries);
    setRecommendation(null);
  }

  function selectRecipient(slotId, member) {
    if (
      recipientEntries.some(
        (entry) =>
          entry.slotId !== slotId &&
          getRecipientId(entry.member) === getRecipientId(member),
      )
    )
      return;
    updateRecipientEntries(
      recipientEntries.map((entry) =>
        entry.slotId === slotId
          ? { ...entry, member, query: member.user.username }
          : entry,
      ),
    );
  }

  function confirmRecipients(members) {
    const unique = uniqueRecipients(members);
    if (
      !validateRecipientEntries(
        unique.map((member) => ({ member })),
        RECIPIENT_SELECTION_POLICY,
      ).isComplete
    )
      return;
    if (
      unique.length === recipientEntries.length &&
      unique.every(
        (member, index) =>
          getRecipientId(member) ===
          getRecipientId(recipientEntries[index].member),
      )
    )
      return;
    const slots = new Map(
      recipientEntries
        .filter((entry) => entry.member)
        .map((entry) => [getRecipientId(entry.member), entry.slotId]),
    );
    updateRecipientEntries(
      unique.map((member) => ({
        slotId: slots.get(getRecipientId(member)) ?? nextSlotId.current++,
        member,
        query: member.user.username,
      })),
    );
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

    if (!selectedMedal?.buildOpening || !selectedMedal?.buildClosing) {
      setRecommendation(null);
      return;
    }

    generationId.current += 1;
    setRecommendation(
      generateRecommendation({
        medal: selectedMedal,
        worksheet: selectedWorksheet,
        values: worksheetValues,
        recipients: recommendationRecipients,
        rankEntries,
      }),
    );
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
                  {awardGroups.map((category) => (
                    <SelectGroup key={category.id}>
                      <SelectLabel>{category.label}</SelectLabel>
                      {category.medals.map((medal) => (
                        <SelectItem
                          key={medal.id}
                          value={medal.id}
                          className="pl-12"
                        >
                          {medal.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
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

                  <h4 className="text-lg font-semibold text-foreground">
                    {selectedMedal.name}
                  </h4>

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

                <RecipientManager
                  entries={recipientEntries}
                  selected={recipients}
                  recommendationRecipients={recommendationRecipients}
                  roster={rosterMembers}
                  organizations={organizations}
                  minimumError={recipientValidation.minimumError}
                  hasAttemptedGenerate={hasAttemptedGenerate}
                  errors={
                    hasAttemptedGenerate ? recipientValidation.errors : []
                  }
                  onAdd={() => {
                    if (recipientEntries.length < RECIPIENT_INLINE_LIMIT) {
                      updateRecipientEntries([
                        ...recipientEntries,
                        {
                          slotId: nextSlotId.current++,
                          query: "",
                          member: null,
                        },
                      ]);
                    }
                  }}
                  onRemove={() => {
                    if (
                      recipientEntries.length >
                      RECIPIENT_SELECTION_POLICY.minimum
                    )
                      updateRecipientEntries(recipientEntries.slice(0, -1));
                  }}
                  onQueryChange={(slotId, query) =>
                    updateRecipientEntries(
                      recipientEntries.map((entry) =>
                        entry.slotId === slotId
                          ? { ...entry, query, member: null }
                          : entry,
                      ),
                    )
                  }
                  onSelect={selectRecipient}
                  onConfirm={confirmRecipients}
                />

                {selectedWorksheet?.fieldOrder.map((fieldName) => {
                  const field = selectedWorksheet.fields[fieldName];
                  if (!isWorksheetFieldActive(field, worksheetValues)) {
                    return null;
                  }
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
                      validationError={worksheetValidation.errors?.[fieldName]}
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
                    ? recommendation.recipients.length > 1
                      ? `Recommendation generated for ${recommendation.recipients.length} recipients. Review the shared citation below.`
                      : "Recommendation generated. Review the citation below."
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <section
                          role="region"
                          aria-label="Recommendation Preview"
                          tabIndex={0}
                          className="relative space-y-5 rounded-lg border border-border/70 bg-background/40 p-5 text-center text-secondary-foreground transition-colors hover:border-destructive/60 hover:bg-destructive/10 focus-within:border-destructive/60 focus-within:bg-destructive/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <h4 className="text-xl font-bold">
                            {recommendation.medal.name}
                          </h4>

                          <img
                            src={recommendation.medal.ribbonUrl}
                            alt={`${recommendation.medal.name} ribbon`}
                            className="mx-auto"
                          />

                          <ul
                            aria-label="Recommendation recipients"
                            className="space-y-1 font-bold"
                          >
                            {recommendation.recipients.map((member) => (
                              <li key={getRecipientId(member)}>
                                <a
                                  href={buildMilpacsUrl(member)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary"
                                >
                                  {getRecipientDisplayName(member)}
                                </a>
                              </li>
                            ))}
                          </ul>

                          <p
                            aria-label="Citation Narrative"
                            className="whitespace-pre-wrap text-center leading-7"
                          >
                            {renderCitationNarrative(recommendation)}
                          </p>
                        </section>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        Do not copy from this preview. Use the Recommendation
                        Title and Recommendation Body copy buttons below to
                        preserve formatting and the ribbon image.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <p className="rounded-lg border border-dashed border-border/70 px-5 py-10 text-center text-sm text-muted-foreground">
                    Your generated recommendation will appear here.
                  </p>
                )}
              </section>
              {recommendation && (
                <RecommendationSubmission
                  key={generationId.current}
                  recommendation={recommendation}
                />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
