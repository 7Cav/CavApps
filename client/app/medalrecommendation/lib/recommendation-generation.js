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
  return {
    medal,
    recipients,
    openingSentence: medal.buildOpening(context),
    narrative: analysis.text,
    highlightRanges: analysis.highlightRanges,
    narrativeWarnings: analysis.warnings,
    closingSentence: medal.buildClosing(context),
  };
}
