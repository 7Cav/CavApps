import {
  EXPLICIT_RECIPIENT_LIMIT,
  getRecipientIdentity,
} from "./recipient-utils";

// Recipients arrive in recommendation order; editing collections stay untouched.
export function resolveRecommendationRecipientSubject(recipients) {
  if (recipients.length === 0) {
    throw new Error("Missing recipient citation subject");
  }
  const isPlural = recipients.length > 1;
  const isCollective = recipients.length > EXPLICIT_RECIPIENT_LIMIT;
  if (isCollective)
    return { subject: "The recipients", isPlural, isCollective };

  const names = recipients.map((member) => {
    const { recipientRank, recipientCitationName } =
      getRecipientIdentity(member);
    return `${recipientRank} ${recipientCitationName}`;
  });
  const subject =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? names.join(" and ")
        : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
  return { subject, isPlural, isCollective };
}

function getSubject(context) {
  const subject = context?.recipientSubject?.subject;
  if (typeof subject !== "string" || !subject.trim()) {
    throw new Error("Missing recipient citation subject");
  }
  return subject;
}

function getPossessiveSubject(context, apostrophe = "'") {
  const subject = getSubject(context);
  return `${subject}${apostrophe}${context.recipientSubject.isCollective ? "" : "s"}`;
}

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

export function normalizeOperationTitle(value) {
  return value
    .trim()
    .replace(/^operation(?=$|[\s–—|:/_,;-])/i, "")
    .trim()
    .replace(/^[\s–—|:/_,;-]+/, "")
    .trim();
}

export function formatOperationName(value) {
  return `Operation ${normalizeOperationTitle(value)}`;
}

function buildOperationLocationDateTail({ operationTitle, location, date }) {
  return `${formatOperationName(operationTitle)} near ${location} on ${date}.`;
}

const GREAT_CREDIT_CLOSING =
  "great credit upon themselves and the 7th Cavalry Gaming Regiment.";

function buildOperationServiceContext(servingElement, context) {
  return (
    `${servingElement} in the 7th Cavalry Regiment during combat in ` +
    buildOperationLocationDateTail(context)
  );
}

export function buildEntireOperationActionOpening(context) {
  return (
    `For ${context.actionCharacter} actions over an entire operation while serving as ` +
    buildOperationServiceContext(context.combatElement, context)
  );
}

function buildActionCharacterCredit(possessiveSubject, actionCharacter) {
  return `${possessiveSubject} ${actionCharacter} actions reflect ${GREAT_CREDIT_CLOSING}`;
}

export function buildActionCharacterCreditClosing(context) {
  return buildActionCharacterCredit(
    getPossessiveSubject(context),
    context.actionCharacter,
  );
}

export function buildGallantryOpening(context) {
  return (
    "For conspicuous gallantry and intrepidity under direct enemy fire while serving as " +
    buildOperationServiceContext(context.combatElement, context)
  );
}

function buildHeroismSkillDevotionCredit(possessiveSubject) {
  return `${possessiveSubject} heroism, skill and devotion to duty reflect ${GREAT_CREDIT_CLOSING}`;
}

export function buildHeroismSkillDevotionClosing(context) {
  return buildHeroismSkillDevotionCredit(getPossessiveSubject(context));
}

export function buildSkillsAndHeroicActionsClosing(context) {
  return (
    `${getPossessiveSubject(context)} skills and heroic actions ` +
    `reflect ${GREAT_CREDIT_CLOSING}`
  );
}

export function buildSingleHeroismOrSkillOpening(context) {
  return (
    "For a single act of heroism or skill under enemy fire while serving as " +
    buildOperationServiceContext(context.combatElement, context)
  );
}

export function buildHeroismAndSkillClosing(context) {
  return (
    `${getPossessiveSubject(context)} heroism and skill ` +
    `reflect ${GREAT_CREDIT_CLOSING}`
  );
}

export function buildPurpleHeartOpening(context) {
  return (
    "For a single or multiple heroic actions while under enemy fire resulting in their " +
    "sacrifice and death while serving as " +
    buildOperationServiceContext(context.combatElement, context)
  );
}

export function buildHeroismAndSacrificeClosing(context) {
  return (
    `${getPossessiveSubject(context)} heroism and sacrifice ` +
    `reflect ${GREAT_CREDIT_CLOSING}`
  );
}

export function buildExtraordinaryHeroismOpening(context) {
  return (
    "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as " +
    buildOperationServiceContext(context.combatElement, context)
  );
}

export function buildExtraordinaryHeroismPilotOpening(context) {
  return (
    "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as " +
    buildOperationServiceContext(`${context.combatElement} pilot`, context)
  );
}

export function buildServiceContributionOpening({ affectedArea }) {
  return `For contributions in ${affectedArea}.`;
}

export function buildServiceDedicationClosing(context) {
  const { affectedArea } = context;
  return (
    `${getPossessiveSubject(context)} dedication to duty and commitment ` +
    `is in great credit to themselves, ${affectedArea}, and the 7th Cavalry Gaming Regiment.`
  );
}

export function buildServiceNarrativeOpening(context) {
  return `${getSubject(context)} distinguished themselves by`;
}

function buildSelectableNarrativeOpening(subject, narrativeOpening) {
  if (!narrativeOpening) return "";
  if (!["distinguished", "contributed"].includes(narrativeOpening)) {
    throw new Error(`Unsupported Narrative Opening: ${narrativeOpening}`);
  }
  if (!subject) return "";
  return `${subject} ${narrativeOpening} themselves by`;
}

export function buildSelectableServiceNarrativeOpening(context) {
  return buildSelectableNarrativeOpening(
    context.narrativeOpening ? getSubject(context) : "",
    context.narrativeOpening,
  );
}

export function buildVolunteerServiceOpening({ nonCombatDepartment }) {
  return `For providing outstanding service to ${nonCombatDepartment}.`;
}

export function buildVolunteerServiceClosing(context) {
  const { nonCombatDepartment } = context;
  return `${getPossessiveSubject(context)} dedication to duty and commitment is in great credit to themselves, ${nonCombatDepartment}, and the 7th Cavalry Gaming Regiment.`;
}

export function buildHumanitarianServiceOpening() {
  return "For providing aid to a fellow trooper.";
}

export function buildHumanitarianServiceClosing(context) {
  return `${getPossessiveSubject(context)} dedication to duty and commitment is in great credit to themselves and the 7th Cavalry Gaming Regiment.`;
}

export function buildJointServiceAchievementOpening({ unit }) {
  return `For contributions to ${unit}.`;
}

export function buildJointServiceAchievementClosing(context) {
  return `${getPossessiveSubject(context, "’")} dedication to duty and commitment to the Regiment is in great credit to themselves and the 7th Cavalry Gaming Regiment.`;
}

export function buildServiceCommendationOpening({ unit }) {
  return `For distinguished contributions to ${unit}.`;
}

export function buildServiceCommendationClosing(context) {
  const { unit } = context;
  return `${getPossessiveSubject(context, "’")} dedication to duty and commitment to the Regiment is in great credit to themselves, ${unit}, and the 7th Cavalry Gaming Regiment.`;
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
  return `${getPossessiveSubject(context)} dedication to duty and ${resolveJointContributionPhrase(context)} are great credit to themselves and the 7th Cavalry Gaming Regiment.`;
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

export function buildMeritoriousServiceClosing(context) {
  const { serviceType } = context;
  return `${getPossessiveSubject(context)} dedication to duty and exceptionally meritorious ${resolveServiceType(serviceType)} are in great credit to themselves and the 7th Cavalry Gaming Regiment.`;
}

export function buildDefenseMeritoriousServiceOpening({ unit }) {
  return `For a single, significant, and distinguished contribution to ${unit}.`;
}

export function buildDefenseMeritoriousServiceClosing(context) {
  const { unit } = context;
  return `${getPossessiveSubject(context)} distinguished contribution is in great credit to themselves, ${unit}, and the 7th Cavalry Gaming Regiment.`;
}

export function buildSoldiersMedalOpening({ serviceType, unit }) {
  return `For multiple, significant and distinguished meritorious ${resolveServiceType(serviceType)} to ${unit}.`;
}

export function buildSoldiersMedalClosing(context) {
  const { serviceType, unit } = context;
  return `${getPossessiveSubject(context)} dedication to duty and exceptionally meritorious ${resolveServiceType(serviceType)} are in great credit to themselves, ${unit}, and the 7th Cavalry Gaming Regiment.`;
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

export function buildLegionOfMeritClosing(context) {
  const { secondaryBillet } = context;
  return `${getPossessiveSubject(context)} dedication to duty and commitment to their department is in great credit to themselves, ${secondaryBillet}, and the 7th Cavalry Gaming Regiment.`;
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
  return `${getPossessiveSubject(context)} exceptionally meritorious leadership is in great credit to themselves, ${resolveLeadershipPathway(context).organization}, and the 7th Cavalry Gaming Regiment.`;
}

export function buildDistinguishedServiceOpening(context) {
  let area;
  switch (context.serviceArea) {
    case "primary":
      area = "a primary billet";
      break;
    case "operations":
      area = "operations";
      break;
    default:
      throw new Error(`Unsupported Service Area: ${context.serviceArea}`);
  }
  return `For distinguished service in ${area} while serving as ${context.role} in ${context.element} during ${servicePeriod(context)}.`;
}

export function buildDistinguishedServiceClosing(context) {
  const { element } = context;
  return `${getPossessiveSubject(context)} distinguished service and commitment is a great credit to themselves, ${element}, and the 7th Cavalry Gaming Regiment.`;
}

export function buildDefenseDistinguishedServiceOpening(context) {
  return `For exceptionally meritorious leadership of a primary billet while serving as ${context.role} of ${context.element} during ${servicePeriod(context)}.`;
}

export function buildDefenseDistinguishedServiceClosing(context) {
  const { element } = context;
  return `${getPossessiveSubject(context)} exemplary leadership demonstrates their commitment to their troopers and reflects great credit upon themselves, ${element}, and the 7th Cavalry Gaming Regiment.`;
}

export function buildValorousUnitOpening(context) {
  return buildGallantryOpening({
    ...context,
    combatElement: context.combatUnit,
  });
}

export function buildValorousUnitClosing() {
  return buildHeroismSkillDevotionCredit("Their");
}

export function buildMeritoriousUnitOpening(context) {
  return buildEntireOperationActionOpening({
    ...context,
    combatElement: context.combatUnit,
  });
}

export function buildMeritoriousUnitClosing({ actionCharacter }) {
  return buildActionCharacterCredit("Their", actionCharacter);
}

export function buildJointUnitOpening({ benefittedUnit }) {
  return `For exceptionally meritorious performance and distinguished contributions to ${benefittedUnit}.`;
}

export function buildSuperiorUnitOpening({ serviceType, benefittedUnit }) {
  return `For exceptionally meritorious ${resolveServiceType(serviceType)} to ${benefittedUnit}.`;
}

export function buildUnitNarrativeOpening({ awardedUnit, narrativeOpening }) {
  return buildSelectableNarrativeOpening(awardedUnit?.trim(), narrativeOpening);
}

export function buildServiceUnitClosing({ serviceType, benefittedUnit }) {
  return `Their dedication to duty and exceptionally meritorious ${resolveServiceType(serviceType)} are in great credit to themselves, ${benefittedUnit}, and the 7th Cavalry Gaming Regiment.`;
}
