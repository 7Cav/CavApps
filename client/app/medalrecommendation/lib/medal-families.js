import {
  getOperationMedalById,
  OPERATION_MEDALS,
} from "./medal-definitions.js";
import {
  getServiceMedalById,
  SERVICE_MEDALS,
} from "./service-medal-definitions.js";

export const MEDAL_FAMILY_IDS = Object.freeze({
  OPERATION: "operation",
  SERVICE: "service",
});

const MEDAL_FAMILIES = Object.freeze({
  [MEDAL_FAMILY_IDS.OPERATION]: Object.freeze({
    id: MEDAL_FAMILY_IDS.OPERATION,
    route: "/medalrecommendation/operation",
    landingTitle: "Operation Medals",
    landingDescription:
      "Create recommendations recognizing actions performed during operations.",
    medals: OPERATION_MEDALS,
    getMedalById: getOperationMedalById,
    awardPlaceholder: "Select an Operation Medal",
    pageTitle: "Operation Medal Recommendation",
    pageDescription: "Prepare and review an Operation Medal recommendation.",
  }),
  [MEDAL_FAMILY_IDS.SERVICE]: Object.freeze({
    id: MEDAL_FAMILY_IDS.SERVICE,
    route: "/medalrecommendation/service",
    landingTitle: "Service Medals",
    landingDescription:
      "Create recommendations recognizing service and contributions to the Regiment.",
    medals: SERVICE_MEDALS,
    getMedalById: getServiceMedalById,
    awardPlaceholder: "Select a Service Medal",
    pageTitle: "Service Medal Recommendation",
    pageDescription: "Prepare and review a Service Medal recommendation.",
  }),
});

export const MEDAL_FAMILY_LIST = Object.freeze(Object.values(MEDAL_FAMILIES));

export function getMedalFamily(familyId) {
  if (!Object.hasOwn(MEDAL_FAMILIES, familyId)) {
    throw new Error(`Unsupported medal family: ${String(familyId)}`);
  }

  return MEDAL_FAMILIES[familyId];
}

export const AWARD_CATEGORY_IDS = Object.freeze({
  INDIVIDUAL: "individual",
  UNIT: "unit",
});

export const AWARD_CATEGORY_LIST = Object.freeze([
  Object.freeze({ id: AWARD_CATEGORY_IDS.INDIVIDUAL, label: "Individual" }),
  Object.freeze({ id: AWARD_CATEGORY_IDS.UNIT, label: "Unit" }),
]);

export function groupMedalsByAwardCategory(medals) {
  const groups = AWARD_CATEGORY_LIST.map((category) => ({
    ...category,
    medals: [],
  }));
  for (const medal of medals) {
    const group = groups.find(
      (category) => category.id === medal.awardCategory,
    );
    if (!group) {
      throw new Error(
        `Unsupported award category: ${String(medal.awardCategory)}`,
      );
    }
    group.medals.push(medal);
  }
  return groups;
}
