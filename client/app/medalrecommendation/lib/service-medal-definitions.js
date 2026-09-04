import {
  buildServiceContributionOpening,
  buildServiceDedicationClosing,
  buildServiceNarrativeOpening,
} from "./citation-builders.js";

export const SERVICE_MEDALS = [
  {
    id: "army-achievement-medal",
    name: "Army Achievement Medal",
    abbreviation: "AAM",
    family: "Service Medal",
    worksheetProfile: "serviceIndividual",
    ribbonUrl: "https://wiki.7cav.us/images/d/d6/AAM.jpg",

    criteria:
      "Awarded for contributions to any area of the Regiment, or being selected as Enlisted of the Quarter.",

    narrativeGuidance:
      "Describe the recipient's contributions to the affected area of the Regiment in a minimum of three professionally written sentences.",

    minimumNarrativeSentences: 3,

    eligibilityNotes: [],

    criteriaHeading: "Medal Criteria",
    showLiveNarrativeWarnings: true,

    buildNarrativeOpening: buildServiceNarrativeOpening,
    buildOpening: buildServiceContributionOpening,
    buildClosing: buildServiceDedicationClosing,
  },
];

export function getServiceMedalById(medalId) {
  return SERVICE_MEDALS.find((medal) => medal.id === medalId) ?? null;
}
