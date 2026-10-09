import { normalizeOperationTitle } from "./citation-builders.js";

const INDIVIDUAL_RECIPIENT_POLICY = { minimum: 1 };

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

const OPERATION_DATE_FIELD = {
  type: "date",
  required: true,
  defaultValue: "",
  label: "Operation Date",
  invalidMessage: "Date must be today or earlier",
  awardChange: "preserve",
};

const OPERATION_NARRATIVE_FIELD = {
  type: "textarea",
  required: true,
  defaultValue: "",
  label: "Narrative",
  placeholder: "Explain the lead-up, actions, and outcome...",
  rows: 8,
  feedback: "narrativeWarnings",
  awardChange: "preserve",
};

function requiredText(label, placeholder) {
  return {
    type: "text",
    required: true,
    defaultValue: "",
    label,
    placeholder,
    awardChange: "preserve",
  };
}

const OPERATION_TITLE_FIELD = {
  ...requiredText("Operation Title", "Overlord"),
  validate: (value) => Boolean(normalizeOperationTitle(value)),
  invalidMessage: "Enter an operation name.",
};

const SERVICE_UNIT = requiredText("Unit", "A/1/A/1-7, S2 Intelligence, etc.");

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

function serviceWorksheet(recommendationTitleContext, contextFields = {}) {
  const fields = { ...contextFields, narrative: { ...SERVICE_NARRATIVE } };
  return {
    recommendationTitleContext,
    recipientType: "individual",
    recipientPolicy: INDIVIDUAL_RECIPIENT_POLICY,
    fieldOrder: Object.keys(fields),
    fields,
  };
}

function serviceUnitAwardWorksheet(contextFields) {
  const worksheet = serviceWorksheet(
    { type: "field", field: "benefittedUnit" },
    contextFields,
  );
  worksheet.fields.narrative = {
    ...SERVICE_NARRATIVE,
    recipientIdentityChecks: false,
    systemOpeningRequiresCompleteRecipients: false,
    liveWarningsRequireCompleteRecipients: false,
    placeholder: "Continue the group's recommendation narrative...",
    helperText:
      "Continue from the displayed group opening. Changes to the awarded group or Narrative Opening preserve your continuation.",
  };
  return worksheet;
}

const BENEFITTED_UNIT = requiredText("Benefitted Unit", "S3 Operations");
const AWARDED_UNIT = requiredText(
  "Awarded Department / Unit",
  "S3 ARMA Operations staff",
);

export const WORKSHEET_PROFILES = {
  operationIndividual: {
    recommendationTitleContext: { type: "operation" },
    recipientType: "individual",
    recipientPolicy: INDIVIDUAL_RECIPIENT_POLICY,

    fieldOrder: [
      "actionCharacter",
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

      operationTitle: { ...OPERATION_TITLE_FIELD },

      location: {
        type: "text",
        required: true,
        defaultValue: "",
        label: "Location",
        placeholder: "Omaha Beach",
        awardChange: "preserve",
      },

      operationDate: { ...OPERATION_DATE_FIELD },

      narrative: { ...OPERATION_NARRATIVE_FIELD },
    },
  },

  operationUnitAward: {
    recommendationTitleContext: { type: "operation" },
    // Unit awards still select individual roster records.
    recipientType: "individual",
    recipientPolicy: {
      minimum: 4,
      minimumMessage: (minimum) =>
        `At least ${minimum} recipients are required for this Unit Award.`,
    },
    fieldOrder: [
      "actionCharacter",
      "combatUnit",
      "operationTitle",
      "location",
      "operationDate",
      "narrative",
    ],
    fields: {
      combatUnit: {
        ...requiredText("Combat Unit", "Alpha Squad"),
        helperText: "Enter the combat unit whose actions are being recognized.",
      },
      operationTitle: { ...OPERATION_TITLE_FIELD },
      location: requiredText("Location", "Omaha Beach"),
      operationDate: { ...OPERATION_DATE_FIELD },
      narrative: {
        ...OPERATION_NARRATIVE_FIELD,
        placeholder: "Explain the unit's lead-up, actions, and outcome...",
        recipientIdentityChecks: false,
        liveWarningsRequireCompleteRecipients: false,
      },
    },
  },
  serviceJointUnitAward: serviceUnitAwardWorksheet({
    benefittedUnit: BENEFITTED_UNIT,
    awardedUnit: AWARDED_UNIT,
    serviceType: {
      ...SERVICE_CONTRIBUTIONS,
      helperText:
        "Controls the closing only. The opening uses the fixed SOP wording.",
    },
    narrativeOpening: NARRATIVE_OPENING,
  }),
  serviceSuperiorUnitAward: serviceUnitAwardWorksheet({
    serviceType: {
      ...SERVICE_CONTRIBUTIONS,
      helperText: "Controls the generated opening and closing together.",
    },
    benefittedUnit: BENEFITTED_UNIT,
    awardedUnit: AWARDED_UNIT,
    narrativeOpening: NARRATIVE_OPENING,
  }),

  serviceIndividual: serviceWorksheet(
    { type: "field", field: "affectedArea" },
    {
      affectedArea: requiredText(
        "Affected Area of the Cav",
        "S7 HLL SOI, 2/B/2-7, etc.",
      ),
    },
  ),
  serviceVolunteer: serviceWorksheet(
    { type: "field", field: "nonCombatDepartment" },
    {
      nonCombatDepartment: requiredText(
        "Non-Combat Department",
        "S1 Uniforms, S3 ARMA Operations, etc.",
      ),
    },
  ),
  serviceNarrative: serviceWorksheet({ type: "none" }),
  serviceUnit: serviceWorksheet(
    { type: "field", field: "unit" },
    { unit: SERVICE_UNIT },
  ),
  serviceJointContribution: serviceWorksheet(
    { type: "field", field: "benefittedCompany" },
    {
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
        ...requiredText("Action Phrase", "action phrase"),
        helperText:
          "Enter a short citation phrase, such as “outstanding support” or “inspiring dedication”. It will appear after “For” in the opening and after “dedication to duty and” in the closing. Do not enter a full sentence.",
        when: { field: "recognitionType", equals: "actions" },
      },
      benefittedCompany: requiredText(
        "Benefitted Company",
        "B/2-7, A/3-7, etc.",
      ),
      assignedCompany: requiredText("Assigned Company", "C/1-7, A/ACD, etc."),
      narrativeOpening: NARRATIVE_OPENING,
    },
  ),
  serviceMeritorious: serviceWorksheet(
    { type: "field", field: "unit" },
    {
      serviceType: SERVICE_CONTRIBUTIONS,
      unit: SERVICE_UNIT,
      narrativeOpening: NARRATIVE_OPENING,
    },
  ),
  serviceSecondaryPeriod: serviceWorksheet(
    { type: "field", field: "secondaryBillet" },
    {
      role: {
        ...requiredText("Role", "a clerk, an investigator, etc."),
        awardChange: "reset",
      },
      secondaryBillet: requiredText(
        "Secondary Billet",
        "S1 MILPACS, S5 Public Affairs, etc.",
      ),
      ...SERVICE_PERIOD,
    },
  ),
  serviceLeadershipPeriod: serviceWorksheet(
    { type: "activeField", fields: ["secondaryBillet", "operationsAO"] },
    {
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
        ...requiredText("Role", "1IC, 2IC, Lead, etc."),
        when: SECONDARY_PATHWAY,
      },
      secondaryBillet: {
        ...requiredText(
          "Secondary Billet",
          "Military Police, S7 ARMA CAS, etc.",
        ),
        when: SECONDARY_PATHWAY,
      },
      operationsLeadership: {
        ...requiredText("Operations Leadership", "AO Lead, S3 HLL Operations"),
        when: OPERATIONS_PATHWAY,
      },
      operationsAO: {
        ...requiredText("Operations AO", "Hell Let Loose: Vietnam AO"),
        when: OPERATIONS_PATHWAY,
      },
      ...SERVICE_PERIOD,
    },
  ),
  serviceDistinguishedService: serviceWorksheet(
    { type: "field", field: "element" },
    {
      serviceArea: {
        type: "semanticChoice",
        required: true,
        defaultValue: "primary",
        label: "Service Area",
        placeholder: "Select service area",
        options: [
          { id: "primary", label: "Primary Billet" },
          { id: "operations", label: "Operations" },
        ],
        awardChange: "reset",
      },
      role: {
        ...requiredText("Role", "a trooper, an officer, etc."),
        awardChange: "reset",
      },
      element: requiredText("Element", "A/2/B/3-7, 2nd Battalion, etc."),
      ...SERVICE_PERIOD,
    },
  ),
  servicePrimaryPeriod: serviceWorksheet(
    { type: "field", field: "element" },
    {
      role: {
        ...requiredText("Role", "a trooper, an infantryman, etc."),
        awardChange: "reset",
      },
      element: requiredText("Element", "A/2/B/3-7, D/1/C/2-7, etc."),
      ...SERVICE_PERIOD,
    },
  ),
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
    recommendationTitleContext: profile.recommendationTitleContext
      ? {
          ...profile.recommendationTitleContext,
          ...(profile.recommendationTitleContext.fields
            ? { fields: [...profile.recommendationTitleContext.fields] }
            : {}),
        }
      : undefined,
    recipientType: profile.recipientType,
    recipientPolicy: { ...profile.recipientPolicy },
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
