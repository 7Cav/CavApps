"use client";

import { useMemo, useState } from "react";

import AwardGuidance from "./AwardGuidance";
import BulkRecipientSelector from "./BulkRecipientSelector";
import NarrativeField from "./NarrativeField";
import RecipientSelector from "./RecipientSelector";
import RecommendationResult from "./RecommendationResult";

import {
  countApproximateSentences,
  countWords,
  generate as generateService,
} from "../lib/service-engine";

import {
  APP_RULES,
  RANK_PRECEDENCE,
  SERVICE_AWARD_DEFINITIONS,
  SERVICE_REFERENCE_CHOICES,
  buildOrganizationReference_,
} from "../lib/reference-data";

import {
  INDIVIDUAL_NARRATIVE_LIMITS,
  UNIT_NARRATIVE_LIMITS,
} from "../lib/narrative-limits";

const FIELD_CLASS =
  "h-10 w-full border border-[#444] bg-[#1b1b1b] px-3 text-sm text-white outline-none transition focus:border-[#ebc729]";

const LABEL_CLASS = "mb-1.5 block text-xs font-medium text-[#c8c8c8]";

const SERVICE_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const INDIVIDUAL_SERVICE_AWARDS = SERVICE_AWARD_DEFINITIONS.filter(
  (award) => award.scope === "individual",
);

const UNIT_SERVICE_AWARDS = SERVICE_AWARD_DEFINITIONS.filter(
  (award) => award.scope === "unit",
);

function cleanText(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/\s+/gu, " ")
    .trim();
}

function uniqueSorted(values) {
  const seen = new Map();

  (values ?? []).forEach((value) => {
    const clean = cleanText(value);
    if (!clean) {
      return;
    }

    const normalized = clean.toUpperCase();
    if (!seen.has(normalized)) {
      seen.set(normalized, clean);
    }
  });

  return Array.from(seen.values()).sort((left, right) =>
    left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

function buildBilletSuggestions(roster) {
  const primaryBillets = [];
  const secondaryBillets = [];
  const allBillets = [];

  (roster ?? []).forEach((person) => {
    if (person.primaryBillet) {
      primaryBillets.push(person.primaryBillet);
      allBillets.push(person.primaryBillet);
    }

    (person.secondaryBillets ?? []).forEach((billet) => {
      secondaryBillets.push(billet);
      allBillets.push(billet);
    });
  });

  return {
    primaryBillets: uniqueSorted(primaryBillets),
    secondaryBillets: uniqueSorted(secondaryBillets),
    allBillets: uniqueSorted(allBillets),
  };
}

function buildServiceYears() {
  const currentYear = new Date().getFullYear();

  return Array.from(
    {
      length: Math.max(0, currentYear - 2009),
    },
    (_, index) => String(currentYear - index),
  );
}

function isFieldVisible(field, fields) {
  if (!field.visibleWhen) {
    return true;
  }

  const currentValue = cleanText(fields[field.visibleWhen.field]).toLowerCase();

  const expectedValue = cleanText(field.visibleWhen.equals).toLowerCase();
  return currentValue === expectedValue;
}

function awardHasField(award, fieldKey) {
  return (award?.fields ?? []).some((field) => field.key === fieldKey);
}

function getIndividualNarrativeNote(award, fields) {
  if (!award) {
    return "";
  }

  const hasSelectableLead = awardHasField(award, "narrativeLead");
  const selectedLead = cleanText(fields?.narrativeLead);

  if (hasSelectableLead && !selectedLead) {
    return (
      "After you select a Narrative Introduction, the app will begin the narrative sentence for you using " +
      "the recipient’s full rank and name. Continue that sentence directly in the narrative box. Begin with a lowercase word " +
      "unless the first word is a proper noun."
    );
  }

  const narrativeLead = selectedLead || "distinguished themselves by";

  return (
    `The app will begin this sentence for you: "Full Rank First Last ${narrativeLead} …" ` +
    "Continue the sentence directly in the narrative box. Begin with a lowercase word unless the first word is a proper noun."
  );
}

function getUnitNarrativeNote(award, fields) {
  if (!award) {
    return "";
  }

  const hasNarrativeVerb = awardHasField(award, "narrativeVerb");

  if (!hasNarrativeVerb) {
    return "Write the shared unit citation in your own words. Required opening and closing language will be added automatically.";
  }

  const narrativeVerb = cleanText(fields?.narrativeVerb);
  const recognizedGroup =
    cleanText(fields?.recognizedGroup) || "Recognized Group";

  if (!narrativeVerb) {
    return (
      "After you select a Narrative Introduction, the app will end the opening with an incomplete sentence starter for the recognized group. " +
      "Continue that sentence directly in the narrative box. Begin with a lowercase word unless the first word is a proper noun."
    );
  }

  return (
    `The app will begin this part of the sentence for you: "${recognizedGroup} ${narrativeVerb} themselves by …" ` +
    "Continue the sentence directly in the narrative box. Begin with a lowercase word unless the first word is a proper noun."
  );
}

function createIndividualForm() {
  return {
    awardId: INDIVIDUAL_SERVICE_AWARDS[0]?.id ?? "",
    fields: {},
    recipients: [""],
    narrative: "",
  };
}

function createUnitForm() {
  return {
    awardId: UNIT_SERVICE_AWARDS[0]?.id ?? "",
    fields: {},
    recipients: ["", "", "", ""],
    narrative: "",
  };
}

function ServiceField({
  field,
  value,
  onChange,
  scope,
  serviceReference,
  billetSuggestions,
}) {
  const id = `service-${scope}-${field.key}`;
  const datalistId = `${id}-options`;

  let control = null;

  if (field.component === "select") {
    const choices = serviceReference.choices[field.optionsSource] ?? [];

    control = (
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      >
        <option value="">Select {field.label}…</option>
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    );
  } else if (field.component === "month") {
    control = (
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      >
        <option value="">Select month…</option>
        {SERVICE_MONTHS.map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>
    );
  } else if (field.component === "year") {
    control = (
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      >
        <option value="">Select year…</option>
        {buildServiceYears().map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    );
  } else if (field.component === "organization") {
    const suggestions =
      serviceReference.organizations[field.optionsSource] ?? [];

    control = (
      <>
        <input
          id={id}
          type="text"
          list={datalistId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={FIELD_CLASS}
          placeholder={field.placeholder ?? ""}
        />

        <datalist id={datalistId}>
          {suggestions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </>
    );
  } else {
    const suggestions = field.suggestionsSource
      ? (billetSuggestions[field.suggestionsSource] ?? [])
      : [];

    control = (
      <>
        <input
          id={id}
          type="text"
          list={suggestions.length ? datalistId : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={FIELD_CLASS}
          placeholder={field.placeholder ?? ""}
        />

        {suggestions.length ? (
          <datalist id={datalistId}>
            {suggestions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        ) : null}
      </>
    );
  }

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {field.label}
      </label>

      {control}

      {field.helpText ? (
        <p className="mt-1.5 text-xs leading-5 text-[#777]">{field.helpText}</p>
      ) : null}
    </div>
  );
}

export default function ServiceAwardsView({ roster, onBack }) {
  const [awardType, setAwardType] = useState("individual");
  const [individualForm, setIndividualForm] = useState(createIndividualForm);
  const [unitForm, setUnitForm] = useState(createUnitForm);

  const [individualResult, setIndividualResult] = useState(null);
  const [unitResult, setUnitResult] = useState(null);
  const [individualResultStale, setIndividualResultStale] = useState(false);
  const [unitResultStale, setUnitResultStale] = useState(false);
  const [bulkRecipientEditorOpen, setBulkRecipientEditorOpen] = useState(false);

  const organizations = useMemo(
    () => buildOrganizationReference_(roster),
    [roster],
  );

  const billetSuggestions = useMemo(
    () => buildBilletSuggestions(roster),
    [roster],
  );

  const serviceReference = useMemo(
    () => ({
      organizations,
      choices: SERVICE_REFERENCE_CHOICES,
    }),
    [organizations],
  );

  const selectedIndividualAward =
    INDIVIDUAL_SERVICE_AWARDS.find(
      (award) => award.id === individualForm.awardId,
    ) ?? null;

  const selectedUnitAward =
    UNIT_SERVICE_AWARDS.find((award) => award.id === unitForm.awardId) ?? null;

  const generationContext = useMemo(
    () => ({
      rules: APP_RULES,
      rankPrecedence: RANK_PRECEDENCE,
      serviceAwards: {
        individual: INDIVIDUAL_SERVICE_AWARDS,
        unit: UNIT_SERVICE_AWARDS,
      },
      serviceReference,
      roster,
    }),
    [serviceReference, roster],
  );

  function updateIndividualField(field, value) {
    setIndividualForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (individualResult) {
      setIndividualResultStale(true);
    }
  }

  function updateUnitField(field, value) {
    setUnitForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (unitResult) {
      setUnitResultStale(true);
    }
  }

  function updateIndividualAwardField(key, value) {
    setIndividualForm((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [key]: value,
      },
    }));

    if (individualResult) {
      setIndividualResultStale(true);
    }
  }

  function updateUnitAwardField(key, value) {
    setUnitForm((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [key]: value,
      },
    }));

    if (unitResult) {
      setUnitResultStale(true);
    }
  }

  function handleIndividualAwardChange(awardId) {
    setIndividualForm((current) => ({
      ...current,
      awardId,
      fields: {},
    }));

    if (individualResult) {
      setIndividualResultStale(true);
    }
  }

  function handleUnitAwardChange(awardId) {
    setUnitForm((current) => ({
      ...current,
      awardId,
      fields: {},
    }));

    if (unitResult) {
      setUnitResultStale(true);
    }
  }

  function handleGenerateIndividual() {
    const payload = {
      scope: "individual",
      awardId: individualForm.awardId,
      fields: individualForm.fields,
      recipients: individualForm.recipients
        .map((recipient) => recipient.trim())
        .filter(Boolean),
      narrative: individualForm.narrative,
    };

    const result = generateService(payload, {
      ...generationContext,
      limits: { narrative: INDIVIDUAL_NARRATIVE_LIMITS.hard },
    });
    setIndividualResult(result);
    setIndividualResultStale(false);
  }

  function handleGenerateUnit() {
    const payload = {
      scope: "unit",
      awardId: unitForm.awardId,
      fields: unitForm.fields,
      recipients: unitForm.recipients
        .map((recipient) => recipient.trim())
        .filter(Boolean),
      narrative: unitForm.narrative,
    };

    const result = generateService(payload, {
      ...generationContext,
      limits: { narrative: UNIT_NARRATIVE_LIMITS.hard },
    });
    setUnitResult(result);
    setUnitResultStale(false);
  }

  function handleResetWorksheet() {
    setAwardType("individual");
    setIndividualForm(createIndividualForm());
    setUnitForm(createUnitForm());
    setIndividualResult(null);
    setUnitResult(null);
    setIndividualResultStale(false);
    setUnitResultStale(false);
    setBulkRecipientEditorOpen(false);
  }

  function handleConfirmBulkRecipients(recipients) {
    updateUnitField("recipients", recipients);
    setBulkRecipientEditorOpen(false);
  }

  function handleClearBulkRecipients() {
    const minimum = APP_RULES.minimumUnitRecipients ?? 4;
    updateUnitField(
      "recipients",
      Array.from({ length: minimum }, () => ""),
    );
  }

  function renderAwardFields({ award, fields, onChange, scope }) {
    if (!award) {
      return null;
    }

    const visibleFields = (award.fields ?? []).filter((field) =>
      isFieldVisible(field, fields),
    );

    if (!visibleFields.length) {
      return null;
    }

    return visibleFields.map((field) => (
      <ServiceField
        key={field.key}
        field={field}
        value={fields[field.key] ?? ""}
        onChange={(value) => onChange(field.key, value)}
        scope={scope}
        serviceReference={serviceReference}
        billetSuggestions={billetSuggestions}
      />
    ));
  }

  const currentResult =
    awardType === "individual" ? individualResult : unitResult;

  const currentResultStale =
    awardType === "individual" ? individualResultStale : unitResultStale;

  const minimumUnitRecipients = APP_RULES.minimumUnitRecipients ?? 4;
  const maximumManualServiceUnitRecipients =
    APP_RULES.maximumManualServiceUnitRecipients ?? 20;
  const selectedUnitRecipients = unitForm.recipients
    .map((recipient) => recipient.trim())
    .filter(Boolean);
  const usingBulkUnitRecipients =
    selectedUnitRecipients.length > maximumManualServiceUnitRecipients;

  return (
    <section className="py-2">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 text-sm font-semibold text-[#c8c8c8] transition hover:text-[#ebc729]"
          >
            ← Back to Home
          </button>

          <h1 className="text-3xl font-semibold text-[#ebc729]">
            Service Medals
          </h1>

          <p className="mt-2 text-sm text-[#8f8f8f]">
            Prepare an individual Service Medal or Service Unit Award.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetWorksheet}
          className="border border-[#555] px-4 py-2 text-sm font-semibold text-[#c8c8c8] transition hover:border-red-700 hover:text-red-300"
        >
          Reset Worksheet
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAwardType("individual")}
          className={
            awardType === "individual"
              ? "border border-[#ebc729] bg-[#262626] px-4 py-2 text-sm font-semibold text-[#ebc729]"
              : "border border-[#444] bg-[#171717] px-4 py-2 text-sm text-[#c8c8c8] transition hover:border-[#666] hover:text-white"
          }
        >
          Individual Medal
        </button>

        <button
          type="button"
          onClick={() => setAwardType("unit")}
          className={
            awardType === "unit"
              ? "border border-[#ebc729] bg-[#262626] px-4 py-2 text-sm font-semibold text-[#ebc729]"
              : "border border-[#444] bg-[#171717] px-4 py-2 text-sm text-[#c8c8c8] transition hover:border-[#666] hover:text-white"
          }
        >
          Unit Award
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(390px,2fr)]">
        <div className="min-w-0 space-y-4">
          {awardType === "individual" ? (
            <>
              <section className="border border-[#353535] bg-[#141414] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#ebc729]">
                    Recommendation Details
                  </h2>
                  <span className="text-xs text-[#777]">Individual Medal</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="service-individual-award"
                      className={LABEL_CLASS}
                    >
                      Service Medal
                    </label>
                    <select
                      id="service-individual-award"
                      value={individualForm.awardId}
                      onChange={(event) =>
                        handleIndividualAwardChange(event.target.value)
                      }
                      className={FIELD_CLASS}
                    >
                      {INDIVIDUAL_SERVICE_AWARDS.map((award) => (
                        <option key={award.id} value={award.id}>
                          {award.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {renderAwardFields({
                    award: selectedIndividualAward,
                    fields: individualForm.fields,
                    onChange: updateIndividualAwardField,
                    scope: "individual",
                  })}
                </div>
              </section>

              <AwardGuidance award={selectedIndividualAward} />

              <RecipientSelector
                roster={roster}
                recipients={individualForm.recipients}
                onChange={(recipients) =>
                  updateIndividualField("recipients", recipients)
                }
                minimum={1}
                maximum={APP_RULES.maximumServiceIndividualRecipients ?? 20}
                label="Recipient"
              />

              <NarrativeField
                id="service-individual-narrative"
                value={individualForm.narrative}
                onChange={(value) => updateIndividualField("narrative", value)}
                countWords={countWords}
                countSentences={countApproximateSentences}
                minimumSentences={
                  selectedIndividualAward?.minimumSentences ?? 0
                }
                note={getIndividualNarrativeNote(
                  selectedIndividualAward,
                  individualForm.fields,
                )}
                placeholder="Continue the citation sentence here…"
                softCharacterLimit={INDIVIDUAL_NARRATIVE_LIMITS.soft}
                hardCharacterLimit={INDIVIDUAL_NARRATIVE_LIMITS.hard}
              />

              <button
                type="button"
                onClick={handleGenerateIndividual}
                className="w-full border border-[#ebc729] bg-[#1c1c1c] px-5 py-3 font-semibold text-[#ebc729] transition hover:bg-[#ebc729] hover:text-black"
              >
                Generate Recommendation
              </button>
            </>
          ) : (
            <>
              <section className="border border-[#353535] bg-[#141414] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#ebc729]">
                    Recommendation Details
                  </h2>
                  <span className="text-xs text-[#777]">Unit Award</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="service-unit-award" className={LABEL_CLASS}>
                      Service Unit Award
                    </label>
                    <select
                      id="service-unit-award"
                      value={unitForm.awardId}
                      onChange={(event) =>
                        handleUnitAwardChange(event.target.value)
                      }
                      className={FIELD_CLASS}
                    >
                      {UNIT_SERVICE_AWARDS.map((award) => (
                        <option key={award.id} value={award.id}>
                          {award.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {renderAwardFields({
                    award: selectedUnitAward,
                    fields: unitForm.fields,
                    onChange: updateUnitAwardField,
                    scope: "unit",
                  })}
                </div>
              </section>

              <AwardGuidance award={selectedUnitAward} />

              {usingBulkUnitRecipients ? (
                <section className="border border-[#353535] bg-[#141414] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#ebc729]">
                        Recipients
                      </h3>
                      <p className="mt-1 text-xs text-[#858585]">
                        {selectedUnitRecipients.length} recipients selected
                        through the bulk roster tool.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkRecipientEditorOpen(true)}
                        className="border border-[#555] px-3 py-1.5 text-xs font-semibold text-[#cfcfcf] transition hover:border-[#ebc729] hover:text-[#ebc729]"
                      >
                        View/Edit Recipients
                      </button>
                      <button
                        type="button"
                        onClick={handleClearBulkRecipients}
                        className="border border-[#555] px-3 py-1.5 text-xs font-semibold text-[#c8c8c8] transition hover:border-red-700 hover:text-red-300"
                      >
                        Clear Recipients
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 whitespace-pre-line border border-[#333] bg-[#1a1a1a] p-3 text-sm leading-6 text-[#bdbdbd]">
                    {selectedUnitRecipients.slice(0, 8).join("\n")}
                    {selectedUnitRecipients.length > 8
                      ? `\n+ ${selectedUnitRecipients.length - 8} more`
                      : ""}
                  </div>
                </section>
              ) : (
                <RecipientSelector
                  roster={roster}
                  recipients={unitForm.recipients}
                  onChange={(recipients) =>
                    updateUnitField("recipients", recipients)
                  }
                  minimum={minimumUnitRecipients}
                  maximum={maximumManualServiceUnitRecipients}
                  label="Recipient"
                  extraActions={
                    <button
                      type="button"
                      onClick={() => setBulkRecipientEditorOpen(true)}
                      className="border border-[#555] px-3 py-1.5 text-xs font-semibold text-[#cfcfcf] transition hover:border-[#ebc729] hover:text-[#ebc729]"
                    >
                      Bulk Add Recipients
                    </button>
                  }
                />
              )}

              <NarrativeField
                id="service-unit-narrative"
                label="Unit Citation Narrative"
                value={unitForm.narrative}
                onChange={(value) => updateUnitField("narrative", value)}
                countWords={countWords}
                countSentences={countApproximateSentences}
                minimumSentences={selectedUnitAward?.minimumSentences ?? 0}
                note={getUnitNarrativeNote(selectedUnitAward, unitForm.fields)}
                placeholder="Continue the unit citation sentence here…"
                softCharacterLimit={UNIT_NARRATIVE_LIMITS.soft}
                hardCharacterLimit={UNIT_NARRATIVE_LIMITS.hard}
              />

              <button
                type="button"
                onClick={handleGenerateUnit}
                className="w-full border border-[#ebc729] bg-[#1c1c1c] px-5 py-3 font-semibold text-[#ebc729] transition hover:bg-[#ebc729] hover:text-black"
              >
                Generate Recommendation
              </button>
            </>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <RecommendationResult
            result={currentResult}
            stale={currentResultStale}
          />
        </aside>
      </div>

      {bulkRecipientEditorOpen ? (
        <BulkRecipientSelector
          roster={roster}
          recipients={unitForm.recipients}
          minimum={minimumUnitRecipients}
          onConfirm={handleConfirmBulkRecipients}
          onCancel={() => setBulkRecipientEditorOpen(false)}
        />
      ) : null}
    </section>
  );
}
