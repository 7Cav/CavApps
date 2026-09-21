export function combineNarrative(requiredOpening, continuation) {
  const normalizedOpening = requiredOpening.trim();
  const normalizedContinuation = continuation.trim();

  if (!normalizedOpening) {
    return normalizedContinuation;
  }

  if (!normalizedContinuation) {
    return normalizedOpening;
  }

  return `${normalizedOpening} ${normalizedContinuation}`;
}

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
    `reflect ${GREAT_CREDIT_CLOSING}`
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

export function buildSingleHeroismOrSkillOpening({
  combatElement,
  operationTitle,
  location,
  date,
}) {
  return (
    "For a single act of heroism or skill under enemy fire while serving as " +
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
  combatElement,
  operationTitle,
  location,
  date,
}) {
  return (
    "For a single or multiple heroic actions while under enemy fire resulting in their " +
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

export function buildSelectableServiceNarrativeOpening({
  recipientRank,
  recipientCitationName,
  narrativeOpening,
}) {
  if (!narrativeOpening) return "";
  if (!["distinguished", "contributed"].includes(narrativeOpening)) {
    throw new Error(`Unsupported Narrative Opening: ${narrativeOpening}`);
  }
  return `${recipientRank} ${recipientCitationName} ${narrativeOpening} themselves by`;
}

export function buildVolunteerServiceOpening({ nonCombatDepartment }) {
  return `For providing outstanding service to ${nonCombatDepartment}.`;
}

export function buildVolunteerServiceClosing({
  recipientRank,
  recipientCitationName,
  nonCombatDepartment,
}) {
  return `${recipientRank} ${recipientCitationName}'s dedication to duty and commitment is in great credit to themselves, ${nonCombatDepartment} and the 7th Cavalry Gaming Regiment.`;
}

export function buildHumanitarianServiceOpening() {
  return "For providing aid to a fellow trooper.";
}

export function buildHumanitarianServiceClosing({
  recipientRank,
  recipientCitationName,
}) {
  return `${recipientRank} ${recipientCitationName}'s dedication to duty and commitment is in great credit to themselves and the 7th Cavalry Gaming Regiment.`;
}

export function buildJointServiceAchievementOpening({ unit }) {
  return `For contributions to ${unit}.`;
}

export function buildJointServiceAchievementClosing({
  recipientRank,
  recipientCitationName,
}) {
  return `${recipientRank} ${recipientCitationName}’s dedication to duty and commitment to the Regiment is in great credit to themselves and the 7th Cavalry Gaming Regiment.`;
}

export function buildServiceCommendationOpening({ unit }) {
  return `For distinguished contributions to ${unit}.`;
}

export function buildServiceCommendationClosing({
  recipientRank,
  recipientCitationName,
  unit,
}) {
  return `${recipientRank} ${recipientCitationName}’s dedication to duty and commitment to the Regiment is in great credit to themselves, ${unit} and the 7th Cavalry Gaming Regiment.`;
}

function resolveJointContributionPhrase({ recognitionType, actionPhrase }) {
  switch (recognitionType) {
    case "contributions":
      return "contributions";
    case "actions":
      return actionPhrase;
    default:
      throw new Error(`Unsupported Recognition Wording: ${recognitionType}`);
  }
}

export function buildJointServiceCommendationOpening(context) {
  return `For ${resolveJointContributionPhrase(context)} to ${context.benefittedCompany} as a member of ${context.assignedCompany}.`;
}

export function buildJointServiceCommendationClosing(context) {
  return `${context.recipientRank} ${context.recipientCitationName}'s dedication to duty and ${resolveJointContributionPhrase(context)} are great credit to themselves and the 7th Cavalry Gaming Regiment.`;
}

function resolveServiceType(serviceType) {
  if (!["service", "contributions"].includes(serviceType)) {
    throw new Error(`Unsupported Service / Contributions: ${serviceType}`);
  }
  return serviceType;
}

export function buildMeritoriousServiceOpening({ serviceType, unit }) {
  return `For exceptionally meritorious ${resolveServiceType(serviceType)} to ${unit}.`;
}

export function buildMeritoriousServiceClosing({
  recipientRank,
  recipientCitationName,
  serviceType,
}) {
  return `${recipientRank} ${recipientCitationName}'s dedication to duty and exceptionally meritorious ${resolveServiceType(serviceType)} are in great credit to themself and the 7th Cavalry Gaming Regiment.`;
}

export function buildDefenseMeritoriousServiceOpening({ unit }) {
  return `For a single, significant, and distinguished contribution to ${unit}.`;
}

export function buildDefenseMeritoriousServiceClosing({
  recipientRank,
  recipientCitationName,
  unit,
}) {
  return `${recipientRank} ${recipientCitationName}'s distinguished contribution is in great credit to themselves, the ${unit}, and the 7th Cavalry Gaming Regiment.`;
}

export function buildSoldiersMedalOpening({ serviceType, unit }) {
  return `For multiple, significant and distinguished meritorious ${resolveServiceType(serviceType)} to ${unit}.`;
}

export function buildSoldiersMedalClosing({
  recipientRank,
  recipientCitationName,
  serviceType,
  unit,
}) {
  return `${recipientRank} ${recipientCitationName}'s dedication to duty and exceptionally meritorious ${resolveServiceType(serviceType)} are in great credit to themself, the ${unit}, and the 7th Cavalry Gaming Regiment.`;
}

export const SERVICE_MONTH_NAMES = [
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

export function formatServiceMonth(value) {
  const [year, month] = value.split("-").map(Number);
  return `${SERVICE_MONTH_NAMES[month - 1]} ${year}`;
}

function servicePeriod({ serviceStart, serviceEnd }) {
  return `${formatServiceMonth(serviceStart)} to ${formatServiceMonth(serviceEnd)}`;
}

export function buildLegionOfMeritOpening(context) {
  return `For exceptional service in a secondary billet while serving as ${context.role} in ${context.secondaryBillet} during ${servicePeriod(context)}.`;
}

export function buildLegionOfMeritClosing({
  recipientRank,
  recipientCitationName,
  secondaryBillet,
}) {
  return `${recipientRank} ${recipientCitationName}'s dedication to duty and commitment to their department is in great credit to themselves, the ${secondaryBillet} and the 7th Cavalry Gaming Regiment.`;
}

function resolveLeadershipPathway(context) {
  switch (context.leadershipArea) {
    case "secondary":
      return {
        area: "a secondary billet",
        assignment: `${context.secondaryRole}, ${context.secondaryBillet}`,
        organization: context.secondaryBillet,
      };
    case "operations":
      return {
        area: "operations",
        assignment: context.operationsLeadership,
        organization: context.operationsAO,
      };
    default:
      throw new Error(`Unsupported Leadership Area: ${context.leadershipArea}`);
  }
}

export function buildDefenseSuperiorServiceOpening(context) {
  const pathway = resolveLeadershipPathway(context);
  return `For exceptionally meritorious leadership of ${pathway.area} while serving as ${pathway.assignment} during ${servicePeriod(context)}.`;
}

export function buildDefenseSuperiorServiceClosing(context) {
  return `${context.recipientRank} ${context.recipientCitationName}'s exceptionally meritorious leadership is in great credit to themselves, the ${resolveLeadershipPathway(context).organization}, and the 7th Cavalry Gaming Regiment.`;
}

export function buildDistinguishedServiceOpening(context) {
  return `For distinguished service in a primary billet while serving as ${context.role} in ${context.element} during ${servicePeriod(context)}.`;
}

export function buildDistinguishedServiceClosing({
  recipientRank,
  recipientCitationName,
  element,
}) {
  return `${recipientRank} ${recipientCitationName}'s distinguished service and commitment is a great credit to themselves, ${element}, and the 7th Cavalry Gaming Regiment.`;
}

export function buildDefenseDistinguishedServiceOpening(context) {
  return `For exceptionally meritorious leadership of a primary billet while serving as ${context.role} of ${context.element} during ${servicePeriod(context)}.`;
}

export function buildDefenseDistinguishedServiceClosing({
  recipientRank,
  recipientCitationName,
  element,
}) {
  return `${recipientRank} ${recipientCitationName}'s exemplary leadership demonstrates their commitment to their troopers and reflects great credit upon themselves, ${element}, and the 7th Cavalry Gaming Regiment.`;
}
