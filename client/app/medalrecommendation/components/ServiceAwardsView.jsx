"use client";

import { useMemo, useState } from "react";

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

function cleanText(value) {
  return String(
    value === undefined || value === null
      ? ""
      : value,
  )
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

  return Array.from(seen.values()).sort(
    (left, right) =>
      left.localeCompare(
        right,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      ),
  );
}

function buildBilletSuggestions(roster) {
  const primaryBillets = [];
  const secondaryBillets = [];
  const allBillets = [];

  (roster ?? []).forEach((person) => {
    if (person.primaryBillet) {
      primaryBillets.push(
        person.primaryBillet,
      );

      allBillets.push(
        person.primaryBillet,
      );
    }

    (
      person.secondaryBillets ?? []
    ).forEach((billet) => {
      secondaryBillets.push(billet);
      allBillets.push(billet);
    });
  });

  return {
    primaryBillets:
      uniqueSorted(primaryBillets),

    secondaryBillets:
      uniqueSorted(secondaryBillets),

    allBillets:
      uniqueSorted(allBillets),
  };
}

function buildServiceYears() {
  const currentYear =
    new Date().getFullYear();

  return Array.from(
    {
      length:
        Math.max(
          0,
          currentYear - 2009,
        ),
    },
    (_, index) =>
      String(currentYear - index),
  );
}

function isFieldVisible(
  field,
  fields,
) {
  if (!field.visibleWhen) {
    return true;
  }

  const currentValue = cleanText(
    fields[
      field.visibleWhen.field
    ],
  ).toLowerCase();

  const expectedValue = cleanText(
    field.visibleWhen.equals,
  ).toLowerCase();

  return currentValue === expectedValue;
}

function ServiceField({
  field,
  value,
  onChange,
  scope,
  serviceReference,
  billetSuggestions,
}) {
  const id =
    `service-${scope}-${field.key}`;

  const datalistId =
    `${id}-options`;

  const commonClassName =
    "w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white";

  let control = null;

  if (field.component === "select") {
    const choices =
      serviceReference.choices[
        field.optionsSource
      ] ?? [];

    control = (
      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={commonClassName}
      >
        <option value="">
          Select {field.label}…
        </option>

        {choices.map((choice) => (
          <option
            key={choice}
            value={choice}
          >
            {choice}
          </option>
        ))}
      </select>
    );
  } else if (
    field.component === "month"
  ) {
    control = (
      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={commonClassName}
      >
        <option value="">
          Select month…
        </option>

        {SERVICE_MONTHS.map(
          (month) => (
            <option
              key={month}
              value={month}
            >
              {month}
            </option>
          ),
        )}
      </select>
    );
  } else if (
    field.component === "year"
  ) {
    control = (
      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={commonClassName}
      >
        <option value="">
          Select year…
        </option>

        {buildServiceYears().map(
          (year) => (
            <option
              key={year}
              value={year}
            >
              {year}
            </option>
          ),
        )}
      </select>
    );
  } else if (
    field.component ===
    "organization"
  ) {
    const suggestions =
      serviceReference.organizations[
        field.optionsSource
      ] ?? [];

    control = (
      <>
        <input
          id={id}
          type="text"
          list={datalistId}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className={commonClassName}
          placeholder={
            field.placeholder ?? ""
          }
        />

        <datalist id={datalistId}>
          {suggestions.map(
            (option) => (
              <option
                key={option}
                value={option}
              />
            ),
          )}
        </datalist>
      </>
    );
  } else {
    const suggestions =
      field.suggestionsSource
        ? billetSuggestions[
            field.suggestionsSource
          ] ?? []
        : [];

    control = (
      <>
        <input
          id={id}
          type="text"
          list={
            suggestions.length
              ? datalistId
              : undefined
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className={commonClassName}
          placeholder={
            field.placeholder ?? ""
          }
        />

        {suggestions.length ? (
          <datalist id={datalistId}>
            {suggestions.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                />
              ),
            )}
          </datalist>
        ) : null}
      </>
    );
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-medium"
      >
        {field.label}
      </label>

      {control}

      {field.helpText ? (
        <p className="mt-2 text-sm text-[#888]">
          {field.helpText}
        </p>
      ) : null}
    </div>
  );
}

export default function ServiceAwardsView({
  roster,
}) {
  const [awardType, setAwardType] =
    useState("individual");

  const individualAwards =
    SERVICE_AWARD_DEFINITIONS.filter(
      (award) =>
        award.scope === "individual",
    );

  const unitAwards =
    SERVICE_AWARD_DEFINITIONS.filter(
      (award) =>
        award.scope === "unit",
    );

  const [
    individualForm,
    setIndividualForm,
  ] = useState({
    awardId:
      individualAwards[0]?.id ?? "",
    fields: {},
    recipients: [""],
    narrative: "",
  });

  const [unitForm, setUnitForm] =
    useState({
      awardId:
        unitAwards[0]?.id ?? "",
      fields: {},
      recipients: [
        "",
        "",
        "",
        "",
      ],
      narrative: "",
    });

  const [
    individualResult,
    setIndividualResult,
  ] = useState(null);

  const [
    unitResult,
    setUnitResult,
  ] = useState(null);

  const [
    individualResultStale,
    setIndividualResultStale,
  ] = useState(false);

  const [
    unitResultStale,
    setUnitResultStale,
  ] = useState(false);

  const organizations = useMemo(
    () =>
      buildOrganizationReference_(
        roster,
      ),
    [roster],
  );

  const billetSuggestions =
    useMemo(
      () =>
        buildBilletSuggestions(roster),
      [roster],
    );

  const serviceReference =
    useMemo(
      () => ({
        organizations,
        choices:
          SERVICE_REFERENCE_CHOICES,
      }),
      [organizations],
    );

  const selectedIndividualAward =
    individualAwards.find(
      (award) =>
        award.id ===
        individualForm.awardId,
    ) ?? null;

  const selectedUnitAward =
    unitAwards.find(
      (award) =>
        award.id === unitForm.awardId,
    ) ?? null;

  const generationContext =
    useMemo(
      () => ({
        rules: APP_RULES,

        rankPrecedence:
          RANK_PRECEDENCE,

        serviceAwards: {
          individual:
            individualAwards,
          unit: unitAwards,
        },

        serviceReference,

        roster,
      }),
      [
        individualAwards,
        unitAwards,
        serviceReference,
        roster,
      ],
    );

  function updateIndividualField(
    field,
    value,
  ) {
    setIndividualForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    if (individualResult) {
      setIndividualResultStale(
        true,
      );
    }
  }

  function updateUnitField(
    field,
    value,
  ) {
    setUnitForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (unitResult) {
      setUnitResultStale(true);
    }
  }

  function updateIndividualAwardField(
    key,
    value,
  ) {
    setIndividualForm(
      (current) => ({
        ...current,

        fields: {
          ...current.fields,
          [key]: value,
        },
      }),
    );

    if (individualResult) {
      setIndividualResultStale(
        true,
      );
    }
  }

  function updateUnitAwardField(
    key,
    value,
  ) {
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

  function handleIndividualAwardChange(
    awardId,
  ) {
    setIndividualForm(
      (current) => ({
        ...current,
        awardId,
        fields: {},
      }),
    );

    if (individualResult) {
      setIndividualResultStale(
        true,
      );
    }
  }

  function handleUnitAwardChange(
    awardId,
  ) {
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

      awardId:
        individualForm.awardId,

      fields:
        individualForm.fields,

      recipients:
        individualForm.recipients
          .map((recipient) =>
            recipient.trim(),
          )
          .filter(Boolean),

      narrative:
        individualForm.narrative,
    };

    const result =
      generateService(
        payload,
        generationContext,
      );

    setIndividualResult(result);

    setIndividualResultStale(false);
  }

  function handleGenerateUnit() {
    const payload = {
      scope: "unit",

      awardId: unitForm.awardId,

      fields: unitForm.fields,

      recipients:
        unitForm.recipients
          .map((recipient) =>
            recipient.trim(),
          )
          .filter(Boolean),

      narrative:
        unitForm.narrative,
    };

    const result =
      generateService(
        payload,
        generationContext,
      );

    setUnitResult(result);

    setUnitResultStale(false);
  }

  function renderAwardFields({
    award,
    fields,
    onChange,
    scope,
  }) {
    if (!award) {
      return null;
    }

    const visibleFields =
      (award.fields ?? []).filter(
        (field) =>
          isFieldVisible(
            field,
            fields,
          ),
      );

    if (!visibleFields.length) {
      return null;
    }

    return visibleFields.map(
      (field) => (
        <ServiceField
          key={field.key}
          field={field}
          value={
            fields[field.key] ?? ""
          }
          onChange={(value) =>
            onChange(
              field.key,
              value,
            )
          }
          scope={scope}
          serviceReference={
            serviceReference
          }
          billetSuggestions={
            billetSuggestions
          }
        />
      ),
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Service Awards
        </h2>

        <p className="mt-2 text-[#aaa]">
          Select the Service
          recommendation type and
          complete the fields required
          for the selected award.
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        <button
          type="button"
          onClick={() =>
            setAwardType(
              "individual",
            )
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
                htmlFor="service-individual-award"
                className="mb-2 block font-medium"
              >
                Service Medal
              </label>

              <select
                id="service-individual-award"
                value={
                  individualForm.awardId
                }
                onChange={(event) =>
                  handleIndividualAwardChange(
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
              >
                {individualAwards.map(
                  (award) => (
                    <option
                      key={award.id}
                      value={award.id}
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
              maximum={
                APP_RULES.maximumServiceIndividualRecipients ??
                20
              }
              label="Recipient"
            />

            {renderAwardFields({
              award:
                selectedIndividualAward,

              fields:
                individualForm.fields,

              onChange:
                updateIndividualAwardField,

              scope: "individual",
            })}

            <NarrativeField
              id="service-individual-narrative"
              value={
                individualForm.narrative
              }
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
              note="Write the narrative body in your own words. The required opening, narrative introduction, and closing language will be added automatically."
              placeholder="Describe the recipient's service, actions, contributions, and impact…"
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

          <div className="mt-8">
            <button
              type="button"
              onClick={
                handleGenerateIndividual
              }
              className="border border-[#ebc729] px-5 py-3 font-semibold text-[#ebc729]"
            >
              Generate Recommendation
            </button>
          </div>

          <RecommendationResult
            result={individualResult}
            stale={
              individualResultStale
            }
          />
        </div>
      ) : (
        <div className="max-w-3xl">
          <div className="grid gap-5">
            <div>
              <label
                htmlFor="service-unit-award"
                className="mb-2 block font-medium"
              >
                Service Unit Award
              </label>

              <select
                id="service-unit-award"
                value={unitForm.awardId}
                onChange={(event) =>
                  handleUnitAwardChange(
                    event.target.value,
                  )
                }
                className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
              >
                {unitAwards.map(
                  (award) => (
                    <option
                      key={award.id}
                      value={award.id}
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
                unitForm.recipients
              }
              onChange={(recipients) =>
                updateUnitField(
                  "recipients",
                  recipients,
                )
              }
              minimum={
                APP_RULES.minimumUnitRecipients ??
                4
              }
              maximum={
                APP_RULES.maximumManualServiceUnitRecipients ??
                20
              }
              label="Recipient"
            />

            {renderAwardFields({
              award:
                selectedUnitAward,

              fields:
                unitForm.fields,

              onChange:
                updateUnitAwardField,

              scope: "unit",
            })}

            <NarrativeField
              id="service-unit-narrative"
              label="Unit Citation Narrative"
              value={
                unitForm.narrative
              }
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
              note="Write the shared unit citation in your own words. Required opening and closing language will be added automatically."
              placeholder="Describe the unit's service, contributions, and impact…"
            />
          </div>

          {selectedUnitAward ? (
            <div className="mt-8 border border-[#444] p-4">
              <h3 className="font-semibold text-[#ebc729]">
                Criteria
              </h3>

              <p className="mt-2 text-[#ccc]">
                {
                  selectedUnitAward.criteria
                }
              </p>

              <h3 className="mt-5 font-semibold text-[#ebc729]">
                Citation Guidance
              </h3>

              <p className="mt-2 text-[#ccc]">
                {
                  selectedUnitAward.guidance
                }
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

          <div className="mt-8">
            <button
              type="button"
              onClick={
                handleGenerateUnit
              }
              className="border border-[#ebc729] px-5 py-3 font-semibold text-[#ebc729]"
            >
              Generate Recommendation
            </button>
          </div>

          <RecommendationResult
            result={unitResult}
            stale={unitResultStale}
          />
        </div>
      )}
    </div>
  );
}