"use client";

import { useState } from "react";

import NarrativeField from "./NarrativeField";
import RecipientSelector from "./RecipientSelector";

import {
  countApproximateSentences,
  countWords,
} from "../lib/citation-engine";

import {
  COMBAT_ROLE_CHOICES,
  INDIVIDUAL_AWARDS,
  UNIT_AWARDS,
} from "../lib/reference-data";

function splitChoices(value) {
  if (!value || /^fixed/i.test(value)) {
    return [];
  }

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function OperationAwardsView({
  roster,
}) {
  const [awardType, setAwardType] =
    useState("individual");

  const [individualForm, setIndividualForm] =
    useState({
      operationName: "",
      operationDate: "",
      location: "",
      role: "",
      awardName:
        INDIVIDUAL_AWARDS[0]?.name ?? "",
      recipients: [""],
      actionScope: "",
      actionCharacter: "",
      narrative: "",
    });

  const [unitForm, setUnitForm] =
    useState({
      operationName: "",
      operationDate: "",
      location: "",
      unitName: "",
      awardName:
        UNIT_AWARDS[0]?.name ?? "",
      recipients: ["", "", "", ""],
      actionCharacter: "",
      narrative: "",
    });

  const selectedIndividualAward =
    INDIVIDUAL_AWARDS.find(
      (award) =>
        award.name ===
        individualForm.awardName,
    ) ?? null;

  const selectedUnitAward =
    UNIT_AWARDS.find(
      (award) =>
        award.name === unitForm.awardName,
    ) ?? null;

  function updateIndividualField(
    field,
    value,
  ) {
    setIndividualForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateUnitField(
    field,
    value,
  ) {
    setUnitForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleIndividualAwardChange(
    value,
  ) {
    setIndividualForm((current) => ({
      ...current,
      awardName: value,
      actionScope: "",
      actionCharacter: "",
    }));
  }

  function handleUnitAwardChange(value) {
    setUnitForm((current) => ({
      ...current,
      awardName: value,
      actionCharacter: "",
    }));
  }

  return (
    <div className="mt-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Operation Awards
        </h2>

        <p className="mt-2 text-[#aaa]">
          Select the recommendation type
          and complete the required award
          information.
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        <button
          type="button"
          onClick={() =>
            setAwardType("individual")
          }
          className={
            awardType === "individual"
              ? "border border-[#ebc729] px-4 py-2 text-[#ebc729]"
              : "border border-[#444] px-4 py-2 text-[#aaa]"
          }
        >
          Individual Medal
        </button>

        <button
          type="button"
          onClick={() =>
            setAwardType("unit")
          }
          className={
            awardType === "unit"
              ? "border border-[#ebc729] px-4 py-2 text-[#ebc729]"
              : "border border-[#444] px-4 py-2 text-[#aaa]"
          }
        >
          Unit Award
        </button>
      </div>

      {awardType === "individual" ? (
        <div className="max-w-3xl">
          <div className="grid gap-5">
            <div>
              <label
                htmlFor="individual-operation"
                className="mb-2 block font-medium"
              >
                Operation Name
              </label>

              <input
                id="individual-operation"
                type="text"
                value={
                  individualForm.operationName
                }
                onChange={(event) =>
                  updateIndividualField(
                    "operationName",
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                placeholder="Operation Overlord"
              />
            </div>

            <div>
              <label
                htmlFor="individual-date"
                className="mb-2 block font-medium"
              >
                Operation Date
              </label>

              <input
                id="individual-date"
                type="date"
                value={
                  individualForm.operationDate
                }
                onChange={(event) =>
                  updateIndividualField(
                    "operationDate",
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
              />
            </div>

            <div>
              <label
                htmlFor="individual-location"
                className="mb-2 block font-medium"
              >
                Location
              </label>

              <input
                id="individual-location"
                type="text"
                value={
                  individualForm.location
                }
                onChange={(event) =>
                  updateIndividualField(
                    "location",
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                placeholder="Omaha Beach"
              />
            </div>

            <div>
              <label
                htmlFor="individual-role"
                className="mb-2 block font-medium"
              >
                Combat Role / Element
              </label>

              <input
                id="individual-role"
                type="text"
                list="combat-role-options"
                value={individualForm.role}
                onChange={(event) =>
                  updateIndividualField(
                    "role",
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                placeholder="trooper"
              />

              <datalist id="combat-role-options">
                {COMBAT_ROLE_CHOICES.map(
                  (role) => (
                    <option
                      key={role}
                      value={role}
                    />
                  ),
                )}
              </datalist>
            </div>

            <div>
              <label
                htmlFor="individual-award"
                className="mb-2 block font-medium"
              >
                Medal
              </label>

              <select
                id="individual-award"
                value={
                  individualForm.awardName
                }
                onChange={(event) =>
                  handleIndividualAwardChange(
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
              >
                {INDIVIDUAL_AWARDS.map(
                  (award) => (
                    <option
                      key={award.name}
                      value={award.name}
                    >
                      {award.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <RecipientSelector
              roster={roster}
              recipients={
                individualForm.recipients
              }
              onChange={(recipients) =>
                updateIndividualField(
                  "recipients",
                  recipients,
                )
              }
              minimum={1}
              maximum={20}
              label="Recipient"
            />

            {selectedIndividualAward?.scopeRequired ? (
              <div>
                <label
                  htmlFor="individual-scope"
                  className="mb-2 block font-medium"
                >
                  Action Scope
                </label>

                <select
                  id="individual-scope"
                  value={
                    individualForm.actionScope
                  }
                  onChange={(event) =>
                    updateIndividualField(
                      "actionScope",
                      event.target.value,
                    )
                  }
                  className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                >
                  <option value="">
                    Select action scope…
                  </option>

                  {splitChoices(
                    selectedIndividualAward.allowedScope,
                  ).map((choice) => (
                    <option
                      key={choice}
                      value={choice}
                    >
                      {choice}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {selectedIndividualAward?.characterRequired ? (
              <div>
                <label
                  htmlFor="individual-character"
                  className="mb-2 block font-medium"
                >
                  Action Character
                </label>

                <select
                  id="individual-character"
                  value={
                    individualForm.actionCharacter
                  }
                  onChange={(event) =>
                    updateIndividualField(
                      "actionCharacter",
                      event.target.value,
                    )
                  }
                  className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                >
                  <option value="">
                    Select action character…
                  </option>

                  {splitChoices(
                    selectedIndividualAward.allowedCharacter,
                  ).map((choice) => (
                    <option
                      key={choice}
                      value={choice}
                    >
                      {choice}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <NarrativeField
              id="individual-narrative"
              value={individualForm.narrative}
              onChange={(value) =>
                updateIndividualField(
                  "narrative",
                  value,
                )
              }
              countWords={countWords}
              countSentences={
                countApproximateSentences
              }
              minimumSentences={
                selectedIndividualAward?.minimumSentences ??
                0
              }
              note="Write the narrative completely in your own words. Official opening and closing language will be added automatically."
              placeholder="Explain the lead-up, actions, and outcome…"
            />
          </div>

          {selectedIndividualAward ? (
            <div className="mt-8 border border-[#444] p-4">
              <h3 className="font-semibold text-[#ebc729]">
                Criteria
              </h3>

              <p className="mt-2 text-[#ccc]">
                {
                  selectedIndividualAward.criteria
                }
              </p>

              <h3 className="mt-5 font-semibold text-[#ebc729]">
                Citation Guidance
              </h3>

              <p className="mt-2 text-[#ccc]">
                {
                  selectedIndividualAward.guidance
                }
              </p>

              <h3 className="mt-5 font-semibold text-[#ebc729]">
                Eligibility / Evidence
              </h3>

              <p className="mt-2 text-[#ccc]">
                {selectedIndividualAward.eligibility ||
                  "No additional automated note."}
              </p>

              <p className="mt-4 text-sm text-[#999]">
                Minimum narrative
                sentences:{" "}
                {
                  selectedIndividualAward.minimumSentences
                }
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="max-w-3xl">
          <div className="grid gap-5">
            <div>
              <label
                htmlFor="unit-operation"
                className="mb-2 block font-medium"
              >
                Operation Name
              </label>

              <input
                id="unit-operation"
                type="text"
                value={
                  unitForm.operationName
                }
                onChange={(event) =>
                  updateUnitField(
                    "operationName",
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                placeholder="Operation Overlord"
              />
            </div>

            <div>
              <label
                htmlFor="unit-date"
                className="mb-2 block font-medium"
              >
                Operation Date
              </label>

              <input
                id="unit-date"
                type="date"
                value={
                  unitForm.operationDate
                }
                onChange={(event) =>
                  updateUnitField(
                    "operationDate",
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
              />
            </div>

            <div>
              <label
                htmlFor="unit-location"
                className="mb-2 block font-medium"
              >
                Location
              </label>

              <input
                id="unit-location"
                type="text"
                value={unitForm.location}
                onChange={(event) =>
                  updateUnitField(
                    "location",
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                placeholder="Omaha Beach"
              />
            </div>

            <div>
              <label
                htmlFor="unit-name"
                className="mb-2 block font-medium"
              >
                Combat Unit Name
              </label>

              <input
                id="unit-name"
                type="text"
                value={unitForm.unitName}
                onChange={(event) =>
                  updateUnitField(
                    "unitName",
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                placeholder="Able Squad"
              />
            </div>

            <div>
              <label
                htmlFor="unit-award"
                className="mb-2 block font-medium"
              >
                Unit Award
              </label>

              <select
                id="unit-award"
                value={unitForm.awardName}
                onChange={(event) =>
                  handleUnitAwardChange(
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
              >
                {UNIT_AWARDS.map(
                  (award) => (
                    <option
                      key={award.name}
                      value={award.name}
                    >
                      {award.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <RecipientSelector
              roster={roster}
              recipients={unitForm.recipients}
              onChange={(recipients) =>
                updateUnitField(
                  "recipients",
                  recipients,
                )
              }
              minimum={4}
              maximum={20}
              label="Recipient"
            />

            {selectedUnitAward?.characterRequired ? (
              <div>
                <label
                  htmlFor="unit-character"
                  className="mb-2 block font-medium"
                >
                  Action Character
                </label>

                <select
                  id="unit-character"
                  value={
                    unitForm.actionCharacter
                  }
                  onChange={(event) =>
                    updateUnitField(
                      "actionCharacter",
                      event.target.value,
                    )
                  }
                  className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
                >
                  <option value="">
                    Select action character…
                  </option>

                  {splitChoices(
                    selectedUnitAward.allowedCharacter,
                  ).map((choice) => (
                    <option
                      key={choice}
                      value={choice}
                    >
                      {choice}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <NarrativeField
              id="unit-narrative"
              label="Unit Citation Narrative"
              value={unitForm.narrative}
              onChange={(value) =>
                updateUnitField(
                  "narrative",
                  value,
                )
              }
              countWords={countWords}
              countSentences={
                countApproximateSentences
              }
              minimumSentences={
                selectedUnitAward?.minimumSentences ??
                0
              }
              note="Use the shared unit name. Do not name individual recipients in the citation body."
              placeholder="Describe the unit's lead-up, actions, and outcome…"
            />
          </div>

          {selectedUnitAward ? (
            <div className="mt-8 border border-[#444] p-4">
              <h3 className="font-semibold text-[#ebc729]">
                Criteria
              </h3>

              <p className="mt-2 text-[#ccc]">
                {selectedUnitAward.criteria}
              </p>

              <h3 className="mt-5 font-semibold text-[#ebc729]">
                Citation Guidance
              </h3>

              <p className="mt-2 text-[#ccc]">
                {selectedUnitAward.guidance}
              </p>

              <h3 className="mt-5 font-semibold text-[#ebc729]">
                Eligibility / Evidence
              </h3>

              <p className="mt-2 text-[#ccc]">
                {selectedUnitAward.eligibility ||
                  "No additional automated note."}
              </p>

              <p className="mt-4 text-sm text-[#999]">
                Minimum narrative
                sentences:{" "}
                {
                  selectedUnitAward.minimumSentences
                }
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}