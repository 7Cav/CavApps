import {
  getRecipientDisplayName,
  getRecipientRankAbbreviation,
} from "./recipient-utils";

const TITLE_PREFIX = "Medal Recommendation - ";
const MAX_TITLE_LENGTH = 150;

function exportError(message) {
  throw new Error(`Recommendation export: ${message}`);
}

function requireRecipients(recommendation) {
  if (
    !Array.isArray(recommendation?.recipients) ||
    !recommendation.recipients.length
  )
    exportError("a generated recipient list is required");
  return recommendation.recipients;
}

export function buildMilpacsUrl(recipient) {
  const id = String(recipient?.profileId ?? "").trim();
  if (!id) exportError("a MILPACS profile ID is required");
  return `https://7cav.us/rosters/profile/${encodeURIComponent(id)}/`;
}

function safePrefix(text, length) {
  const prefix = text.slice(0, length);
  const last = prefix.charCodeAt(prefix.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? prefix.slice(0, -1) : prefix;
}

export function buildRecommendationTitle(recommendation) {
  const recipients = requireRecipients(recommendation);
  const abbreviation = recommendation.medal?.abbreviation;
  if (typeof abbreviation !== "string" || !abbreviation)
    exportError("a medal abbreviation is required");
  let recipientLabel = "Multiple";
  if (recipients.length === 1) {
    const username = recipients[0].user?.username;
    if (typeof username !== "string" || !username.trim())
      exportError("a recipient username is required");
    recipientLabel = `${getRecipientRankAbbreviation(recipients[0])}.${username.trim()}`;
  }
  const context = recommendation.titleContext;
  if (context === null) {
    const title = `${TITLE_PREFIX}${abbreviation} - ${recipientLabel}`;
    if (title.length > MAX_TITLE_LENGTH)
      exportError(
        `protected title segments exceed ${MAX_TITLE_LENGTH} characters`,
      );
    return title;
  }
  if (typeof context !== "string" || !context)
    exportError("a captured title context is required");
  const suffix = ` - ${abbreviation} - ${recipientLabel}`;
  const budget = MAX_TITLE_LENGTH - TITLE_PREFIX.length - suffix.length;
  if (budget < 1)
    exportError("protected title segments leave no room for context");
  const outputContext =
    context.length <= budget ? context : `${safePrefix(context, budget - 1)}…`;
  return TITLE_PREFIX + outputContext + suffix;
}

export function buildRecommendationBody(recommendation) {
  const recipients = requireRecipients(recommendation);
  const { name, ribbonUrl } = recommendation.medal ?? {};
  if (
    typeof name !== "string" ||
    !name ||
    typeof ribbonUrl !== "string" ||
    !ribbonUrl
  )
    exportError("medal name and ribbon URL are required");
  if (
    typeof recommendation.citationText !== "string" ||
    !recommendation.citationText
  )
    exportError("captured citation text is required");
  const recipientLines = recipients
    .map(
      (recipient) =>
        `[B][URL=${buildMilpacsUrl(recipient)}]${getRecipientDisplayName(recipient)}[/URL][/B]`,
    )
    .join("\n");
  return `[CENTER][B]${name}[/B]\n\n[IMG]${ribbonUrl}[/IMG]\n\n${recipientLines}\n\n${recommendation.citationText}\n[/CENTER]`;
}
