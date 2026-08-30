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
    `Operation ${operationTitle} near ${location} on ${date}.`
  );
}

export function buildActionCharacterCreditClosing({
  recipientRank,
  recipientCitationName,
  actionCharacter,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s ${actionCharacter} actions ` +
    "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
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
    `Operation ${operationTitle} near ${location} on ${date}.`
  );
}

export function buildHeroismSkillDevotionClosing({
  recipientRank,
  recipientCitationName,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s heroism, skill and devotion to duty ` +
    "reflects great credit upon themselves and the 7th Cavalry Gaming Regiment."
  );
}

export function buildSkillsAndHeroicActionsClosing({
  recipientRank,
  recipientCitationName,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s skills and heroic actions ` +
    "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
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
    `Operation ${operationTitle} near ${location} on ${date}.`
  );
}

export function buildHeroismAndSkillClosing({
  recipientRank,
  recipientCitationName,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s heroism and skill ` +
    "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
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
    `Regiment during combat in Operation ${operationTitle} near ${location} ` +
    `on ${date}.`
  );
}

export function buildHeroismAndSacrificeClosing({
  recipientRank,
  recipientCitationName,
}) {
  return (
    `${recipientRank} ${recipientCitationName}'s heroism and sacrifice ` +
    "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
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
    `Operation ${operationTitle} near ${location} on ${date}.`
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
    `Operation ${operationTitle} near ${location} on ${date}.`
  );
}
