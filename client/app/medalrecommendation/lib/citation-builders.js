function buildOperationLocationDateTail({ operationTitle, location, date }) {
  return `Operation ${operationTitle} near ${location} on ${date}.`;
}

const GREAT_CREDIT_CLOSING =
  "great credit upon themselves and the 7th Cavalry Gaming Regiment.";

export function buildEntireOperationActionOpening({
  actionCharacter,
  combatElement,
  operationTitle,
  location,
  date,
}) {
  return (
    `For ${actionCharacter} actions over an entire operation while serving as ` +
    `${combatElement} in the 7th Cavalry Regiment during combat in ` +
    buildOperationLocationDateTail({ operationTitle, location, date })
  );
}

export function buildActionCharacterCreditClosing({
  recipientRank,
  recipientCitationName,
  actionCharacter,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s ${actionCharacter} actions ` +
    `reflect ${GREAT_CREDIT_CLOSING}`
  );
}

export function buildGallantryOpening({
  combatElement,
  operationTitle,
  location,
  date,
}) {
  return (
    "For conspicuous gallantry and intrepidity under direct enemy fire while serving as " +
    `${combatElement} in the 7th Cavalry Regiment during combat in ` +
    buildOperationLocationDateTail({ operationTitle, location, date })
  );
}

export function buildHeroismSkillDevotionClosing({
  recipientRank,
  recipientCitationName,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s heroism, skill and devotion to duty ` +
    `reflects ${GREAT_CREDIT_CLOSING}`
  );
}

export function buildSkillsAndHeroicActionsClosing({
  recipientRank,
  recipientCitationName,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s skills and heroic actions ` +
    `reflect ${GREAT_CREDIT_CLOSING}`
  );
}

export function buildSingleHeroismAndSkillOpening({
  combatElement,
  operationTitle,
  location,
  date,
}) {
  return (
    "For a single act of heroism and skill under enemy fire while serving as " +
    `${combatElement} in the 7th Cavalry Regiment during combat in ` +
    buildOperationLocationDateTail({ operationTitle, location, date })
  );
}

export function buildHeroismAndSkillClosing({
  recipientRank,
  recipientCitationName,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s heroism and skill ` +
    `reflect ${GREAT_CREDIT_CLOSING}`
  );
}

export function buildPurpleHeartOpening({
  scope,
  combatElement,
  operationTitle,
  location,
  date,
}) {
  let actionText;

  switch (scope) {
    case "single":
      actionText = "a single heroic action";
      break;

    case "multiple":
      actionText = "multiple heroic actions";
      break;

    default:
      throw new Error(`Unsupported Purple Heart scope: ${scope}`);
  }

  return (
    `For ${actionText} and skill under enemy fire resulting in their ` +
    `sacrifice and death while serving as ${combatElement} in the 7th Cavalry ` +
    `Regiment during combat in ${buildOperationLocationDateTail({
      operationTitle,
      location,
      date,
    })}`
  );
}

export function buildHeroismAndSacrificeClosing({
  recipientRank,
  recipientCitationName,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s heroism and sacrifice ` +
    `reflect ${GREAT_CREDIT_CLOSING}`
  );
}

export function buildExtraordinaryHeroismOpening({
  combatElement,
  operationTitle,
  location,
  date,
}) {
  return (
    "For a single act demonstrating extraordinary heroism and skill under enemy fire " +
    `while serving as ${combatElement} in the 7th Cavalry Regiment during combat in ` +
    buildOperationLocationDateTail({ operationTitle, location, date })
  );
}

export function buildExtraordinaryHeroismPilotOpening({
  combatElement,
  operationTitle,
  location,
  date,
}) {
  return (
    "For a single act demonstrating extraordinary heroism and skill under enemy fire " +
    `while serving as ${combatElement} pilot in the 7th Cavalry Regiment during combat in ` +
    buildOperationLocationDateTail({ operationTitle, location, date })
  );
}

export function buildServiceContributionOpening({ affectedArea }) {
  return `For contributions in ${affectedArea}.`;
}

export function buildServiceDedicationClosing({
  recipientRank,
  recipientCitationName,
  affectedArea,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s dedication to duty and commitment ` +
    `is in great credit to themselves, ${affectedArea} and the 7th Cavalry Gaming Regiment.`
  );
}

export function buildServiceNarrativeOpening({
  recipientRank,
  recipientCitationName,
}) {
  return `${recipientRank} ${recipientCitationName} distinguished themselves by`;
}
