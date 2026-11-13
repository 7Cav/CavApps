"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { oswald } from "./lib/fonts";
import { FEATURE_HOME_LINK_CLASS_NAME } from "./lib/navigation-styles";
import RecommendationSubmission from "./RecommendationSubmission";
import ServiceMonthYearField from "./ServiceMonthYearField";
import RecipientManager from "./RecipientManager";
import DraftFileControls from "./DraftFileControls";
import useWorksheetRecovery from "./useWorksheetRecovery";
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
  const [recipientEditorKey, setRecipientEditorKey] = useState(0);

  const [worksheetValues, setWorksheetValues] = useState({});
  const [draftName, setDraftName] = useState(undefined);
  const [namedBinding, setNamedBinding] = useState(null);
  const namedBindingRef = useRef(null);
  const worksheetSession = useRef(0);
  const [sessionId, setSessionId] = useState(0);

  function bindNamedDraft(record) {
    const binding = record
      ? {
          id: record.id,
          medalFamily: record.medalFamily,
          revision: record.revision,
          name: record.name,
        }
      : null;
    namedBindingRef.current = binding;
    setNamedBinding(binding);
  }

  function replaceSession(record = null) {
    worksheetSession.current += 1;
    setSessionId(worksheetSession.current);
    bindNamedDraft(record);
  }

  function namedSaved(record, session) {
    if (session !== worksheetSession.current) return;
    bindNamedDraft(record);
    // Saving metadata does not invalidate output or register a recovery edit.
    updateEditable({ name: record.name }, {}, false);
  }

  function namedRenamed(record, expectedRevision, session) {
    const bound = namedBindingRef.current;
    if (
      session !== worksheetSession.current ||
      bound?.id !== record.id ||
      bound.medalFamily !== record.medalFamily ||
      bound.revision !== expectedRevision
    )
      return;
    namedSaved(record, session);
  }

  // Update this at the edit boundary, not during a later render/effect. Related
  // React state updates can be batched without creating a partial recovery draft.
  const editable = useRef({
    medalFamily,
    medalId: selectedMedalId,
    entries: recipientEntries,
    values: worksheetValues,
    name: draftName,
  });
  const recovery = useWorksheetRecovery({
    medalFamily,
    roster: recipientRoster ?? [],
    onRestore: (prepared) => restoreDraft(prepared, false),
  });

  function updateEditable(patch, options = {}, persist = true) {
    const next = { ...editable.current, ...patch, medalFamily };
    editable.current = next;
    setSelectedMedalId(next.medalId);
    setRecipientEntries(next.entries);
    setWorksheetValues(next.values);
    setDraftName(next.name);
    if (persist) recovery.recordEdit(next, options);
  }

  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);

  const [recommendation, setRecommendation] = useState(null);
  const generationId = useRef(0);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

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

  function updateRecipientEntries(entries, options) {
    updateEditable({ entries }, options);
    setRecommendation(null);
  }

  function selectRecipient(slotId, member) {
    const recipientEntries = editable.current.entries;
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
          ? { slotId: entry.slotId, member, query: member.user.username }
          : entry,
      ),
    );
  }

  function confirmRecipients(members) {
    const recipientEntries = editable.current.entries;
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
    const confirmed = unique.map((member) => ({
      slotId: slots.get(getRecipientId(member)) ?? nextSlotId.current++,
      member,
      query: member.user.username,
    }));
    // Keep pending work at its existing position relative to resolved slots.
    // Bulk still determines the resolved selection and its working order.
    const merged = [];
    let index = 0;
    for (const entry of recipientEntries) {
      if (!entry.member && (entry.unresolvedRecipient || entry.query))
        merged.push(entry);
      else if (entry.member && index < confirmed.length)
        merged.push(confirmed[index++]);
    }
    merged.push(...confirmed.slice(index));
    updateRecipientEntries(merged);
  }

  function handleWorksheetValueChange(fieldName, value) {
    const current = editable.current;
    const field = resolveMedalWorksheet(getMedalById(current.medalId)).fields[
      fieldName
    ];
    const debounce =
      ["text", "textarea"].includes(field.type) ||
      (field.type === "monthYear" &&
        (current.values[fieldName] ?? "").split("-")[0] !==
          value.split("-")[0]);
    updateEditable(
      { values: { ...current.values, [fieldName]: value } },
      { debounce },
    );
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

  function handleClearWorksheet() {
    replaceSession();
    const worksheet = resolveMedalWorksheet(
      getMedalById(editable.current.medalId),
    );
    updateEditable(
      {
        name: undefined,
        entries: [{ slotId: 0, query: "", member: null }],
        values: applyAwardChange(null, worksheet, {}),
      },
      { clear: true },
    );
    nextSlotId.current = 1;
    setRecipientEditorKey((key) => key + 1);
    setHasAttemptedGenerate(false);
    setRecommendation(null);
  }

  function restoreDraft(prepared, persist = true, record = null) {
    replaceSession(record);
    updateEditable(
      {
        medalId: prepared.medalId,
        values: prepared.values,
        entries: prepared.entries,
        name: prepared.name,
      },
      {},
      persist,
    );
    nextSlotId.current = prepared.entries.length;
    setRecipientEditorKey((key) => key + 1);
    setHasAttemptedGenerate(false);
    setRecommendation(null);
  }

  return (
    <main className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/medalrecommendation"
        className={FEATURE_HOME_LINK_CLASS_NAME}
      >
        <span aria-hidden="true">←</span>
        Medal Recommendation Aid
      </Link>

      <header className="mt-6 max-w-3xl">
        <h1
          className={`${oswald.className} text-3xl font-semibold tracking-tight text-primary sm:text-4xl`}
        >
          {pageTitle}
        </h1>

        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {pageDescription}
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden border-border/70 bg-card/70 shadow-none">
          <CardHeader className="space-y-0 border-b border-border/70 p-5 sm:p-6">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <h2
                id="recommendation-worksheet-heading"
                className="text-xl font-semibold text-foreground"
              >
                Recommendation Worksheet
              </h2>
              <DraftFileControls
                state={{
                  medalFamily,
                  medalId: selectedMedalId,
                  entries: recipientEntries,
                  values: worksheetValues,
                  name: draftName,
                }}
                roster={recipientRoster ?? []}
                hasWork={Boolean(
                  selectedMedalId ||
                  recommendation ||
                  recipientEntries.some(
                    (entry) =>
                      entry.member || entry.unresolvedRecipient || entry.query,
                  ) ||
                  Object.values(worksheetValues).some(Boolean),
                )}
                binding={namedBinding}
                sessionId={sessionId}
                onNamedSaved={namedSaved}
                onNamedRenamed={namedRenamed}
                onNamedDeleted={(record, session) => {
                  if (
                    session === worksheetSession.current &&
                    namedBindingRef.current?.id === record.id
                  )
                    bindNamedDraft(null);
                }}
                onRestore={(prepared, record, session) => {
                  if (session === worksheetSession.current)
                    restoreDraft(prepared, true, record);
                }}
                onLoadStart={recovery.cancelHydration}
              />
            </div>
            <div
              aria-live="polite"
              aria-atomic="true"
              aria-label="Worksheet Recovery"
            >
              {recovery.status.message && (
                <p
                  className={`flex items-start gap-2 pt-3 text-[10pt] ${recovery.status.kind === "warning" ? "text-amber-400" : "text-muted-foreground"}`}
                >
                  {recovery.status.kind === "warning" && (
                    <TriangleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                  )}
                  <span>{recovery.status.message}</span>
                </p>
              )}
            </div>
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
                    resolveMedalWorksheet(
                      getMedalById(editable.current.medalId),
                    ),
                    nextWorksheet,
                    editable.current.values,
                  );

                  updateEditable({ medalId: value, values: nextValues });
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
                    className="font-semibold text-foreground"
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
                  key={recipientEditorKey}
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
                    const recipientEntries = editable.current.entries;
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
                    const recipientEntries = editable.current.entries;
                    if (
                      recipientEntries.length >
                      RECIPIENT_SELECTION_POLICY.minimum
                    )
                      updateRecipientEntries(recipientEntries.slice(0, -1));
                  }}
                  onRemoveEntry={(slotId) => {
                    const recipientEntries = editable.current.entries;
                    const remaining = recipientEntries.filter(
                      (entry) => entry.slotId !== slotId,
                    );
                    updateRecipientEntries(
                      remaining.length
                        ? remaining
                        : [
                            {
                              slotId: nextSlotId.current++,
                              query: "",
                              member: null,
                            },
                          ],
                    );
                  }}
                  onQueryChange={(slotId, query) =>
                    updateRecipientEntries(
                      editable.current.entries.map((entry) =>
                        entry.slotId === slotId
                          ? { ...entry, query, member: null }
                          : entry,
                      ),
                      { debounce: true },
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

                <div className="flex flex-wrap justify-between gap-3">
                  <Button
                    type="button"
                    className="max-w-full sm:w-80"
                    onClick={handleGenerate}
                  >
                    Generate Recommendation
                  </Button>
                  <Dialog
                    open={clearDialogOpen}
                    onOpenChange={setClearDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        className="ml-auto"
                      >
                        Clear Worksheet
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogTitle className="pr-8 text-xl font-semibold text-primary">
                        Clear worksheet?
                      </DialogTitle>
                      <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
                        This will remove all entered information, recipients,
                        and generated recommendation content. Your selected
                        medal will remain unchanged.
                      </DialogDescription>
                      <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            setClearDialogOpen(false);
                            handleClearWorksheet();
                          }}
                        >
                          Clear Worksheet
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

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

        <aside className="self-start lg:sticky lg:top-20">
          <Card className="overflow-hidden border-border/70 bg-card/70 shadow-none">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Recommendation Output
              </h2>
            </CardHeader>

            <CardContent className="space-y-6 p-5 sm:p-6">
              <section className="space-y-2" aria-labelledby="status-heading">
                <h3
                  id="status-heading"
                  className="font-semibold text-foreground"
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
                <h3 className="font-semibold text-foreground">
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
