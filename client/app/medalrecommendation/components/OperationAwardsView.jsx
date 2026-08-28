"use client";

import { useState } from "react";

import AwardGuidance from "./AwardGuidance";
import NarrativeField from "./NarrativeField";
import RecipientSelector from "./RecipientSelector";
import RecommendationResult from "./RecommendationResult";

import {
  countApproximateSentences,
  countWords,
  generateIndividual,
  generateUnit,
} from "../lib/citation-engine";

import {
  APP_RULES,
  COMBAT_ROLE_CHOICES,
  INDIVIDUAL_AWARDS,
  RANK_PRECEDENCE,
  UNIT_AWARDS,
} from "../lib/reference-data";

import {
  INDIVIDUAL_NARRATIVE_LIMITS,
  UNIT_NARRATIVE_LIMITS,
} from "../lib/narrative-limits";

const FIELD_CLASS =
  "h-10 w-full border border-[#444] bg-[#1b1b1b] px-3 text-sm text-white outline-none transition focus:border-[#ebc729]";

const LABEL_CLASS = "mb-1.5 block text-xs font-medium text-[#c8c8c8]";

const INITIAL_INDIVIDUAL_FORM = {
  operationName: "",
  operationDate: "",
  location: "",
  role: "",
  awardName: INDIVIDUAL_AWARDS[0]?.name ?? "",
  recipients: [""],
  actionScope: "",
  actionCharacter: "",
  narrative: "",
};

const INITIAL_UNIT_FORM = {
  operationName: "",
  operationDate: "",
  location: "",
  unitName: "",
  awardName: UNIT_AWARDS[0]?.name ?? "",
  recipients: ["", "", "", ""],
  actionCharacter: "",
  narrative: "",
};

function splitChoices(value) {
  if (!value || /^fixed/i.test(value)) {
    return [];
  }

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cloneIndividualForm() {
  return {
    ...INITIAL_INDIVIDUAL_FORM,
    recipients: [""],
  };
}

function cloneUnitForm() {
  return {
    ...INITIAL_UNIT_FORM,
    recipients: ["", "", "", ""],
  };
}

function MedalSelectionSection({
  mode,
  awards,
  selectedAward,
  awardName,
  actionScope,
  actionCharacter,
  onAwardChange,
  onScopeChange,
  onCharacterChange,
}) {
  const isUnitAward = mode === "unit";
  const awardInputId = isUnitAward ? "unit-award" : "individual-award";
  const scopeInputId = isUnitAward ? "unit-scope" : "individual-scope";
  const characterInputId = isUnitAward
    ? "unit-character"
    : "individual-character";

  return (
    <section className="border border-[#353535] bg-[#141414] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-[#ebc729]">Medal Selection</h2>
        <span className="text-xs text-[#777]">
          {isUnitAward ? "Unit Award" : "Individual Medal"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={awardInputId} className={LABEL_CLASS}>
            {isUnitAward ? "Unit Award" : "Medal"}
          </label>
          <select
            id={awardInputId}
            value={awardName}
            onChange={(event) => onAwardChange(event.target.value)}
            className={FIELD_CLASS}
          >
            {awards.map((award) => (
              <option key={award.name} value={award.name}>
                {award.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4">
          {selectedAward?.scopeRequired ? (
            <div>
              <label htmlFor={scopeInputId} className={LABEL_CLASS}>
                Action Scope
              </label>
              <select
                id={scopeInputId}
                value={actionScope}
                onChange={(event) => onScopeChange?.(event.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">Select action scope…</option>
                {splitChoices(selectedAward.allowedScope).map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {selectedAward?.characterRequired ? (
            <div>
              <label htmlFor={characterInputId} className={LABEL_CLASS}>
                Action Character
              </label>
              <select
                id={characterInputId}
                value={actionCharacter}
                onChange={(event) => onCharacterChange?.(event.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">Select action character…</option>
                {splitChoices(selectedAward.allowedCharacter).map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function OperationAwardsView({ roster, onBack }) {
  const [awardType, setAwardType] = useState("individual");
  const [individualForm, setIndividualForm] = useState(cloneIndividualForm);
  const [unitForm, setUnitForm] = useState(cloneUnitForm);

  const [individualResult, setIndividualResult] = useState(null);
  const [unitResult, setUnitResult] = useState(null);
  const [individualResultStale, setIndividualResultStale] = useState(false);
  const [unitResultStale, setUnitResultStale] = useState(false);

  const selectedIndividualAward =
    INDIVIDUAL_AWARDS.find(
      (award) => award.name === individualForm.awardName,
    ) ?? null;

  const selectedUnitAward =
    UNIT_AWARDS.find((award) => award.name === unitForm.awardName) ?? null;

  const generationContext = {
    rules: APP_RULES,
    rankPrecedence: RANK_PRECEDENCE,
    individualAwards: INDIVIDUAL_AWARDS,
    unitAwards: UNIT_AWARDS,
    roster,
  };

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

  function handleIndividualAwardChange(value) {
    setIndividualForm((current) => ({
      ...current,
      awardName: value,
      actionScope: "",
      actionCharacter: "",
    }));

    if (individualResult) {
      setIndividualResultStale(true);
    }
  }

  function handleUnitAwardChange(value) {
    setUnitForm((current) => ({
      ...current,
      awardName: value,
      actionCharacter: "",
    }));

    if (unitResult) {
      setUnitResultStale(true);
    }
  }

  function handleGenerateIndividual() {
    const payload = {
      ...individualForm,
      recipients: individualForm.recipients
        .map((recipient) => recipient.trim())
        .filter(Boolean),
    };

    const result = generateIndividual(payload, {
      ...generationContext,
      limits: { narrative: INDIVIDUAL_NARRATIVE_LIMITS.hard },
    });
    setIndividualResult(result);
    setIndividualResultStale(false);
  }

  function handleGenerateUnit() {
    const payload = {
      ...unitForm,
      recipients: unitForm.recipients
        .map((recipient) => recipient.trim())
        .filter(Boolean),
    };

    const result = generateUnit(payload, {
      ...generationContext,
      limits: { narrative: UNIT_NARRATIVE_LIMITS.hard },
    });
    setUnitResult(result);
    setUnitResultStale(false);
  }

  function handleResetWorksheet() {
    setAwardType("individual");
    setIndividualForm(cloneIndividualForm());
    setUnitForm(cloneUnitForm());
    setIndividualResult(null);
    setUnitResult(null);
    setIndividualResultStale(false);
    setUnitResultStale(false);
  }

  const currentResult =
    awardType === "individual" ? individualResult : unitResult;

  const currentResultStale =
    awardType === "individual" ? individualResultStale : unitResultStale;

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
            Operation Medals
          </h1>

          <p className="mt-2 text-sm text-[#8f8f8f]">
            Prepare an individual combat medal or Operation Unit Award.
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
              <MedalSelectionSection
                mode="individual"
                awards={INDIVIDUAL_AWARDS}
                selectedAward={selectedIndividualAward}
                awardName={individualForm.awardName}
                actionScope={individualForm.actionScope}
                actionCharacter={individualForm.actionCharacter}
                onAwardChange={handleIndividualAwardChange}
                onScopeChange={(value) =>
                  updateIndividualField("actionScope", value)
                }
                onCharacterChange={(value) =>
                  updateIndividualField("actionCharacter", value)
                }
              />

              <AwardGuidance award={selectedIndividualAward} />

              <section className="border border-[#353535] bg-[#141414] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#ebc729]">
                    Recommendation Details
                  </h2>
                  <span className="text-xs text-[#777]">Individual Medal</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="individual-operation"
                      className={LABEL_CLASS}
                    >
                      Operation Name
                    </label>
                    <input
                      id="individual-operation"
                      type="text"
                      value={individualForm.operationName}
                      onChange={(event) =>
                        updateIndividualField(
                          "operationName",
                          event.target.value,
                        )
                      }
                      className={FIELD_CLASS}
                      placeholder="Operation Overlord"
                    />
                  </div>

                  <div>
                    <label htmlFor="individual-date" className={LABEL_CLASS}>
                      Operation Date
                    </label>
                    <input
                      id="individual-date"
                      type="date"
                      value={individualForm.operationDate}
                      onChange={(event) =>
                        updateIndividualField(
                          "operationDate",
                          event.target.value,
                        )
                      }
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="individual-location"
                      className={LABEL_CLASS}
                    >
                      Location
                    </label>
                    <input
                      id="individual-location"
                      type="text"
                      value={individualForm.location}
                      onChange={(event) =>
                        updateIndividualField("location", event.target.value)
                      }
                      className={FIELD_CLASS}
                      placeholder="Omaha Beach"
                    />
                  </div>

                  <div>
                    <label htmlFor="individual-role" className={LABEL_CLASS}>
                      Combat Role / Element
                    </label>
                    <input
                      id="individual-role"
                      type="text"
                      list="combat-role-options"
                      value={individualForm.role}
                      onChange={(event) =>
                        updateIndividualField("role", event.target.value)
                      }
                      className={FIELD_CLASS}
                      placeholder="trooper"
                    />
                    <datalist id="combat-role-options">
                      {COMBAT_ROLE_CHOICES.map((role) => (
                        <option key={role} value={role} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </section>

              <RecipientSelector
                roster={roster}
                recipients={individualForm.recipients}
                onChange={(recipients) =>
                  updateIndividualField("recipients", recipients)
                }
                minimum={1}
                maximum={APP_RULES.maximumOperationIndividualRecipients ?? 20}
                label="Recipient"
              />

              <NarrativeField
                id="individual-narrative"
                value={individualForm.narrative}
                onChange={(value) => updateIndividualField("narrative", value)}
                countWords={countWords}
                countSentences={countApproximateSentences}
                minimumSentences={
                  selectedIndividualAward?.minimumSentences ?? 0
                }
                note="Write the narrative completely in your own words. Official opening and closing language will be added automatically."
                placeholder="Explain the lead-up, actions, and outcome…"
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
              <MedalSelectionSection
                mode="unit"
                awards={UNIT_AWARDS}
                selectedAward={selectedUnitAward}
                awardName={unitForm.awardName}
                actionCharacter={unitForm.actionCharacter}
                onAwardChange={handleUnitAwardChange}
                onCharacterChange={(value) =>
                  updateUnitField("actionCharacter", value)
                }
              />

              <AwardGuidance award={selectedUnitAward} />

              <section className="border border-[#353535] bg-[#141414] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#ebc729]">
                    Recommendation Details
                  </h2>
                  <span className="text-xs text-[#777]">Unit Award</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="unit-operation" className={LABEL_CLASS}>
                      Operation Name
                    </label>
                    <input
                      id="unit-operation"
                      type="text"
                      value={unitForm.operationName}
                      onChange={(event) =>
                        updateUnitField("operationName", event.target.value)
                      }
                      className={FIELD_CLASS}
                      placeholder="Operation Overlord"
                    />
                  </div>

                  <div>
                    <label htmlFor="unit-date" className={LABEL_CLASS}>
                      Operation Date
                    </label>
                    <input
                      id="unit-date"
                      type="date"
                      value={unitForm.operationDate}
                      onChange={(event) =>
                        updateUnitField("operationDate", event.target.value)
                      }
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div>
                    <label htmlFor="unit-location" className={LABEL_CLASS}>
                      Location
                    </label>
                    <input
                      id="unit-location"
                      type="text"
                      value={unitForm.location}
                      onChange={(event) =>
                        updateUnitField("location", event.target.value)
                      }
                      className={FIELD_CLASS}
                      placeholder="Omaha Beach"
                    />
                  </div>

                  <div>
                    <label htmlFor="unit-name" className={LABEL_CLASS}>
                      Combat Unit Name
                    </label>
                    <input
                      id="unit-name"
                      type="text"
                      value={unitForm.unitName}
                      onChange={(event) =>
                        updateUnitField("unitName", event.target.value)
                      }
                      className={FIELD_CLASS}
                      placeholder="Able Squad"
                    />
                  </div>
                </div>
              </section>

              <RecipientSelector
                roster={roster}
                recipients={unitForm.recipients}
                onChange={(recipients) =>
                  updateUnitField("recipients", recipients)
                }
                minimum={APP_RULES.minimumUnitRecipients ?? 4}
                maximum={APP_RULES.maximumUnitRecipients ?? 20}
                label="Recipient"
              />

              <NarrativeField
                id="unit-narrative"
                label="Unit Citation Narrative"
                value={unitForm.narrative}
                onChange={(value) => updateUnitField("narrative", value)}
                countWords={countWords}
                countSentences={countApproximateSentences}
                minimumSentences={selectedUnitAward?.minimumSentences ?? 0}
                note="Use the shared unit name. Do not name individual recipients in the citation body."
                placeholder="Describe the unit's lead-up, actions, and outcome…"
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
    </section>
  );
}
