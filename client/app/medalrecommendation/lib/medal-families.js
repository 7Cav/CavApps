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

const WORKSHEET_DESCRIPTION =
  "Prepare a recommendation to recognize a fellow trooper.";

const MEDAL_FAMILIES = Object.freeze({
  [MEDAL_FAMILY_IDS.OPERATION]: Object.freeze({
    id: MEDAL_FAMILY_IDS.OPERATION,
    route: "/medalrecommendation/operation",
    landingTitle: "Operation Medals",
    landingDescription:
      "Create recommendations recognizing actions performed during operations.",
    artwork: Object.freeze({
      src: "/medalrecommendation/bronze-star.png",
      width: 1254,
      height: 1254,
      className: "w-full",
      // 42% of the card's inner width, including padding, borders and grid gap.
      // The app's 13px root makes the 90rem page cap 1170px. Use pixels here:
      // image sizes resolves rem against the initial font size, not that root.
      sizes:
        "(min-width: 1170px) 221px, (min-width: 1024px) calc(21vw - 25px), (min-width: 640px) calc(42vw - 29px), calc(42vw - 18px)",
    }),
    medals: OPERATION_MEDALS,
    getMedalById: getOperationMedalById,
    awardPlaceholder: "Select an Operation Medal",
    pageTitle: "Operation Medal Recommendation",
    pageDescription: WORKSHEET_DESCRIPTION,
  }),
  [MEDAL_FAMILY_IDS.SERVICE]: Object.freeze({
    id: MEDAL_FAMILY_IDS.SERVICE,
    route: "/medalrecommendation/service",
    landingTitle: "Service Medals",
    landingDescription:
      "Create recommendations recognizing service and contributions to the Regiment.",
    artwork: Object.freeze({
      src: "/medalrecommendation/distinguished-service-medal.png",
      width: 1132,
      height: 1390,
      className: "w-4/5",
      // DSM occupies 80% of the same 42% artwork column.
      sizes:
        "(min-width: 1170px) 177px, (min-width: 1024px) calc(16.8vw - 20px), (min-width: 640px) calc(33.6vw - 23px), calc(33.6vw - 14px)",
    }),
    medals: SERVICE_MEDALS,
    getMedalById: getServiceMedalById,
    awardPlaceholder: "Select a Service Medal",
    pageTitle: "Service Medal Recommendation",
    pageDescription: WORKSHEET_DESCRIPTION,
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
