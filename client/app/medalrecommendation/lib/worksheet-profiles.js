export const WORKSHEET_PROFILES = {
  operationIndividual: {
    recipientType: "individual",

    fields: {
      combatElement: {
        type: "text",
        variant: "combat",
        required: true,
        label: "Combat Element",
        placeholder: "a rifleman, the Allied commander, etc.",
        awardChange: "sameVariant",
      },

      operationTitle: {
        type: "text",
        required: true,
        label: "Operation Title",
        placeholder: "Overlord",
        awardChange: "preserve",
      },

      location: {
        type: "text",
        required: true,
        label: "Location",
        placeholder: "Omaha Beach",
        awardChange: "preserve",
      },

      operationDate: {
        type: "date",
        required: true,
        label: "Operation Date",
        awardChange: "preserve",
      },

      narrative: {
        type: "textarea",
        required: true,
        label: "Narrative",
        placeholder: "Explain the lead-up, actions, and outcome...",
        awardChange: "preserve",
      },
    },
  },
};

function copyFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, field]) => [
      fieldName,
      { ...field },
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

  fields.combatElement = {
    ...fields.combatElement,
    variant: medal.fields?.combatElementVariant ?? fields.combatElement.variant,
    label: medal.fields?.combatElementLabel ?? fields.combatElement.label,
    placeholder:
      medal.fields?.combatElementPlaceholder ??
      fields.combatElement.placeholder,
  };

  if (medal.fields?.actionCharacter) {
    fields.actionCharacter = {
      ...medal.fields.actionCharacter,
      awardChange: "reset",
      options: medal.fields.actionCharacter.options.map((option) => ({
        ...option,
      })),
    };
  }

  if (medal.fields?.scope) {
    fields.scope = {
      ...medal.fields.scope,
      awardChange: "reset",
      options: medal.fields.scope.options.map((option) => ({
        ...option,
      })),
    };
  }

  return {
    recipientType: profile.recipientType,
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
        nextValues[fieldName] = "";
        break;

      case "sameVariant":
        if (
          !previousField ||
          !nextField ||
          previousField.variant !== nextField.variant
        ) {
          nextValues[fieldName] = "";
        }
        break;

      default:
        throw new Error(
          `Unsupported award-change policy for field "${fieldName}"`,
        );
    }
  }

  return nextValues;
}
