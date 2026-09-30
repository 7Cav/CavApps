import { resolveRecommendationRecipientSubject } from "./citation-builders";
import { analyzeRecommendationNarrative } from "./narrative-validation";
import {
  getActiveWorksheetValues,
  getCitationChoiceText,
  isWorksheetFieldActive,
} from "./worksheet-profiles";

function formatOperationDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function resolveTitleContext(configuration, context) {
  let field;
  switch (configuration?.type) {
    case "none":
      return null;
    case "operation":
      if (context.operationTitle) return `Operation ${context.operationTitle}`;
      break;
    case "field":
      field = configuration.field;
      break;
    case "activeField": {
      if (!Array.isArray(configuration.fields)) break;
      const active = configuration.fields.filter((name) =>
        Object.hasOwn(context, name),
      );
      if (active.length === 1) field = active[0];
      break;
    }
    default:
      throw new Error(
        "Missing or unsupported Recommendation Title context configuration",
      );
  }
  if (
    typeof field === "string" &&
    typeof context[field] === "string" &&
    context[field]
  )
    return context[field];
  throw new Error(
    "Recommendation Title context must resolve to one active, nonempty value",
  );
}

export function generateRecommendation({
  medal,
  worksheet,
  values,
  recipients,
  rankEntries = [],
}) {
  const context = getActiveWorksheetValues(worksheet, values);
  for (const [name, field] of Object.entries(worksheet.fields)) {
    if (
      field.type === "citationChoice" &&
      isWorksheetFieldActive(field, values)
    ) {
      context[name] = getCitationChoiceText(field, context[name]);
    }
  }
  context.operationTitle = (context.operationTitle ?? "").replace(
    /^operation\s+/i,
    "",
  );
  context.date = context.operationDate
    ? formatOperationDate(context.operationDate)
    : "";
  context.recipientSubject = resolveRecommendationRecipientSubject(recipients);

  const systemOpening = medal.buildNarrativeOpening?.(context);
  const analysis = analyzeRecommendationNarrative(
    values.narrative ?? "",
    recipients,
    systemOpening,
    medal,
    rankEntries,
    worksheet.fields.narrative,
  );
  const openingSentence = medal.buildOpening(context);
  const closingSentence = medal.buildClosing(context);
  return {
    medal,
    recipients,
    openingSentence,
    narrative: analysis.text,
    highlightRanges: analysis.highlightRanges,
    narrativeWarnings: analysis.warnings,
    closingSentence,
    titleContext: resolveTitleContext(
      medal.recommendationTitleContext,
      context,
    ),
    citationText: [openingSentence, analysis.text, closingSentence].join(" "),
  };
}
