const SERVICE_NARRATIVE = {
  type: "textarea",
  required: true,
  defaultValue: "",
  label: "Narrative",
  placeholder: "Continue the recipient's recommendation narrative...",
  systemOwnedNarrativeOpening: true,
  helperText:
    "The SOP requires the narrative to begin with the displayed recipient opening. Continue from the sentence starter below.",
  rows: 8,
  feedback: "narrativeWarnings",
  awardChange: "preserve",
};

function serviceText(label, placeholder) {
  return {
    type: "text",
    required: true,
    defaultValue: "",
    label,
    placeholder,
    awardChange: "preserve",
  };
}

const SERVICE_UNIT = serviceText("Unit", "A/1/A/1-7, S2 Intelligence, etc.");

const SERVICE_CONTRIBUTIONS = {
  type: "semanticChoice",
  required: true,
  defaultValue: "",
  label: "Service / Contributions",
  placeholder: "Select service or contributions",
  options: [
    { id: "service", label: "Service" },
    { id: "contributions", label: "Contributions" },
  ],
  awardChange: "reset",
};

const NARRATIVE_OPENING = {
  type: "semanticChoice",
  required: true,
  defaultValue: "distinguished",
  label: "Narrative Opening",
  placeholder: "Select narrative opening",
  options: [
    { id: "distinguished", label: "Distinguished" },
    { id: "contributed", label: "Contributed" },
  ],
  awardChange: "reset",
};

const SERVICE_PERIOD = {
  serviceStart: {
    type: "monthYear",
    required: true,
    defaultValue: "",
    label: "Service Start",
    awardChange: "preserve",
  },
  serviceEnd: {
    type: "monthYear",
    required: true,
    defaultValue: "",
    label: "Service End",
    notBefore: "serviceStart",
    invalidMessage:
      "Service End must be the same month as or later than Service Start",
    awardChange: "preserve",
  },
};

const SECONDARY_PATHWAY = { field: "leadershipArea", equals: "secondary" };
const OPERATIONS_PATHWAY = { field: "leadershipArea", equals: "operations" };

function serviceWorksheet(contextFields = {}) {
  const fields = { ...contextFields, narrative: SERVICE_NARRATIVE };
  return {
    recipientType: "individual",
    fieldOrder: Object.keys(fields),
    fields,
  };
}

export const WORKSHEET_PROFILES = {
  operationIndividual: {
    recipientType: "individual",

    fieldOrder: [
      "actionCharacter",
      "scope",
      "combatElement",
      "operationTitle",
      "location",
      "operationDate",
      "narrative",
    ],

    fields: {
      combatElement: {
        type: "text",
        variant: "combat",
        required: true,
        defaultValue: "",
        label: "Combat Element",
        placeholder: "a rifleman, the Allied commander, etc.",
        awardChange: "sameVariant",
      },

      operationTitle: {
        type: "text",
        required: true,
        defaultValue: "",
        label: "Operation Title",
        placeholder: "Overlord",
        awardChange: "preserve",
      },

      location: {
        type: "text",
        required: true,
        defaultValue: "",
        label: "Location",
        placeholder: "Omaha Beach",
        awardChange: "preserve",
      },

      operationDate: {
        type: "date",
        required: true,
        defaultValue: "",
        label: "Operation Date",
        invalidMessage: "Date must be today or earlier",
        awardChange: "preserve",
      },

      narrative: {
        type: "textarea",
        required: true,
        defaultValue: "",
        label: "Narrative",
        placeholder: "Explain the lead-up, actions, and outcome...",
        rows: 8,
        feedback: "narrativeWarnings",
        awardChange: "preserve",
      },
    },
  },

  serviceIndividual: serviceWorksheet({
    affectedArea: serviceText(
      "Affected Area of the Cav",
      "S7 HLL SOI, 2/B/2-7, etc.",
    ),
  }),
  serviceVolunteer: serviceWorksheet({
    nonCombatDepartment: serviceText(
      "Non-Combat Department",
      "S1 Uniforms, S3 ARMA Operations, etc.",
    ),
  }),
  serviceNarrative: serviceWorksheet(),
  serviceUnit: serviceWorksheet({ unit: SERVICE_UNIT }),
  serviceJointContribution: serviceWorksheet({
    recognitionType: {
      type: "semanticChoice",
      required: true,
      defaultValue: "contributions",
      label: "Recognition Wording",
      placeholder: "Select actions or contributions",
      options: [
        { id: "contributions", label: "Contributions" },
        { id: "actions", label: "Custom Action Phrase" },
      ],
      awardChange: "reset",
    },
    actionPhrase: {
      ...serviceText("Action Phrase", "action phrase"),
      helperText:
        "Enter a short citation phrase, such as “outstanding support” or “inspiring dedication”. It will appear after “For” in the opening and after “dedication to duty and” in the closing. Do not enter a full sentence.",
      when: { field: "recognitionType", equals: "actions" },
    },
    benefittedCompany: serviceText("Benefitted Company", "B/2-7, A/3-7, etc."),
    assignedCompany: serviceText("Assigned Company", "C/1-7, A/ACD, etc."),
    narrativeOpening: NARRATIVE_OPENING,
  }),
  serviceMeritorious: serviceWorksheet({
    serviceType: SERVICE_CONTRIBUTIONS,
    unit: SERVICE_UNIT,
    narrativeOpening: NARRATIVE_OPENING,
  }),
  serviceSecondaryPeriod: serviceWorksheet({
    role: {
      ...serviceText("Role", "a clerk, an investigator, etc."),
      awardChange: "reset",
    },
    secondaryBillet: serviceText(
      "Secondary Billet",
      "S1 MILPACS, S5 Public Affairs, etc.",
    ),
    ...SERVICE_PERIOD,
  }),
  serviceLeadershipPeriod: serviceWorksheet({
    leadershipArea: {
      type: "semanticChoice",
      required: true,
      defaultValue: "",
      label: "Leadership Area",
      placeholder: "Select leadership area",
      options: [
        { id: "secondary", label: "Secondary Billet" },
        { id: "operations", label: "Operations Leadership" },
      ],
      awardChange: "reset",
    },
    secondaryRole: {
      ...serviceText("Role", "1IC, 2IC, Lead, etc."),
      when: SECONDARY_PATHWAY,
    },
    secondaryBillet: {
      ...serviceText("Secondary Billet", "Military Police, S7 ARMA CAS, etc."),
      when: SECONDARY_PATHWAY,
    },
    operationsLeadership: {
      ...serviceText("Operations Leadership", "AO Lead, S3 HLL Operations"),
      when: OPERATIONS_PATHWAY,
    },
    operationsAO: {
      ...serviceText("Operations AO", "Hell Let Loose: Vietnam AO"),
      when: OPERATIONS_PATHWAY,
    },
    ...SERVICE_PERIOD,
  }),
  servicePrimaryPeriod: serviceWorksheet({
    role: {
      ...serviceText("Role", "a trooper, an infantryman, etc."),
      awardChange: "reset",
    },
    element: serviceText("Element", "A/2/B/3-7, D/1/C/2-7, etc."),
    ...SERVICE_PERIOD,
  }),
};

function copyField(field) {
  return {
    ...field,
    ...(field.when ? { when: { ...field.when } } : {}),
    ...(field.options
      ? {
          options: field.options.map((option) => ({ ...option })),
        }
      : {}),
  };
}

export function isWorksheetFieldActive(field, values) {
  return !field.when || values[field.when.field] === field.when.equals;
}

export function getActiveWorksheetValues(worksheet, values = {}) {
  return Object.fromEntries(
    Object.entries(worksheet?.fields ?? {})
      .filter(([, field]) => isWorksheetFieldActive(field, values))
      .map(([name, field]) => {
        const value = values[name] ?? field.defaultValue ?? "";
        return [name, typeof value === "string" ? value.trim() : value];
      }),
  );
}

function copyFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, field]) => [
      fieldName,
      copyField(field),
    ]),
  );
}

export function resolveMedalWorksheet(medal) {
  if (!medal) {
    return null;
  }

  const profile = WORKSHEET_PROFILES[medal.worksheetProfile];

  if (!profile) {
    return null;
  }

  const fields = copyFields(profile.fields);

  for (const [fieldName, medalField] of Object.entries(medal.fields ?? {})) {
    if (!medalField || typeof medalField !== "object") {
      continue;
    }

    if (!fields[fieldName] && !medalField.type) {
      continue;
    }

    fields[fieldName] = {
      ...fields[fieldName],
      ...copyField(medalField),
      awardChange:
        medalField.awardChange ?? fields[fieldName]?.awardChange ?? "reset",
    };
  }

  const fieldOrder = [
    ...profile.fieldOrder.filter((fieldName) => fields[fieldName]),
    ...Object.keys(fields).filter(
      (fieldName) => !profile.fieldOrder.includes(fieldName),
    ),
  ];

  return {
    recipientType: profile.recipientType,
    fieldOrder,
    fields,
  };
}

export function getCitationChoiceText(field, choiceId) {
  const option = field?.options?.find((entry) => entry.id === choiceId);

  if (
    field?.type !== "citationChoice" ||
    !option ||
    typeof option.citationText !== "string" ||
    !option.citationText
  ) {
    throw new Error(`Unsupported citation choice: ${choiceId}`);
  }

  return option.citationText;
}

export function applyAwardChange(
  previousWorksheet,
  nextWorksheet,
  currentValues,
) {
  const nextValues = { ...currentValues };

  const fieldNames = new Set([
    ...Object.keys(previousWorksheet?.fields ?? {}),
    ...Object.keys(nextWorksheet?.fields ?? {}),
  ]);

  for (const fieldName of fieldNames) {
    const previousField = previousWorksheet?.fields?.[fieldName];
    const nextField = nextWorksheet?.fields?.[fieldName];

    const awardChange = nextField?.awardChange ?? previousField?.awardChange;

    switch (awardChange) {
      case "preserve":
        break;

      case "reset":
        nextValues[fieldName] =
          nextField?.defaultValue ?? previousField?.defaultValue ?? "";
        break;

      case "sameVariant":
        if (
          !previousField ||
          !nextField ||
          previousField.variant !== nextField.variant
        ) {
          nextValues[fieldName] =
            nextField?.defaultValue ?? previousField?.defaultValue ?? "";
        }
        break;

      default:
        throw new Error(
          `Unsupported award-change policy for field "${fieldName}"`,
        );
    }

    if (nextField && nextValues[fieldName] === undefined) {
      nextValues[fieldName] = nextField.defaultValue ?? "";
    }
  }

  return nextValues;
}
