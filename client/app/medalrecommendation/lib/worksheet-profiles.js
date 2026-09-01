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
};

function copyField(field) {
  return {
    ...field,
    ...(field.options
      ? {
          options: field.options.map((option) => ({ ...option })),
        }
      : {}),
  };
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
