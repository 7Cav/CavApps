import {
  buildDefenseDistinguishedServiceClosing,
  buildDefenseDistinguishedServiceOpening,
  buildDefenseMeritoriousServiceClosing,
  buildDefenseMeritoriousServiceOpening,
  buildDefenseSuperiorServiceClosing,
  buildDefenseSuperiorServiceOpening,
  buildDistinguishedServiceClosing,
  buildDistinguishedServiceOpening,
  buildHumanitarianServiceClosing,
  buildHumanitarianServiceOpening,
  buildJointServiceAchievementClosing,
  buildJointServiceAchievementOpening,
  buildJointServiceCommendationClosing,
  buildJointServiceCommendationOpening,
  buildLegionOfMeritClosing,
  buildLegionOfMeritOpening,
  buildMeritoriousServiceClosing,
  buildMeritoriousServiceOpening,
  buildSelectableServiceNarrativeOpening,
  buildServiceCommendationClosing,
  buildServiceCommendationOpening,
  buildServiceContributionOpening,
  buildServiceDedicationClosing,
  buildServiceNarrativeOpening,
  buildSoldiersMedalClosing,
  buildSoldiersMedalOpening,
  buildVolunteerServiceClosing,
  buildVolunteerServiceOpening,
} from "./citation-builders.js";

export const SERVICE_MEDALS = [
  {
    id: "outstanding-volunteer-service-medal",
    name: "Outstanding Volunteer Service Medal",
    abbreviation: "OVSM",
    worksheetProfile: "serviceVolunteer",
    ribbonUrl: "https://wiki.7cav.us/images/e/ec/OVSM.jpg",
    criteria:
      "Awarded to members of the 7th Cavalry that provide outstanding service to a non-combat department to which they are not assigned.",
    narrativeGuidance:
      "Describe the recipient's contributions in a minimum of two professionally written sentences.",
    minimumNarrativeSentences: 2,
    eligibilityNotes: [
      "The service must have been provided to a non-combat department.",
      "The recipient must not be assigned to the department receiving the service.",
    ],
    buildOpening: buildVolunteerServiceOpening,
    buildClosing: buildVolunteerServiceClosing,
  },
  {
    id: "humanitarian-service-medal",
    name: "Humanitarian Service Medal",
    abbreviation: "HSM",
    worksheetProfile: "serviceNarrative",
    ribbonUrl: "https://wiki.7cav.us/images/3/3b/HSM.jpg",
    criteria:
      "Awarded to any 7th Cavalry member that helped or aided a fellow member financially, physically, mentally, emotionally, or through games and/or computer parts. Also can be awarded for anyone initiating a Garry Owen for a member in need.",
    narrativeGuidance:
      "Describe how the recipient provided help or aid in a minimum of two professionally written sentences.",
    minimumNarrativeSentences: 2,
    buildOpening: buildHumanitarianServiceOpening,
    buildClosing: buildHumanitarianServiceClosing,
  },
  {
    id: "army-achievement-medal",
    name: "Army Achievement Medal",
    abbreviation: "AAM",
    worksheetProfile: "serviceIndividual",
    ribbonUrl: "https://wiki.7cav.us/images/d/d6/AAM.jpg",
    criteria:
      "Awarded for contributions to any area of the Regiment, or being selected as Enlisted of the Quarter.",
    narrativeGuidance:
      "Describe the recipient's contributions to the affected area of the Regiment in a minimum of three professionally written sentences.",
    buildOpening: buildServiceContributionOpening,
    buildClosing: buildServiceDedicationClosing,
  },
  {
    id: "joint-service-achievement-medal",
    name: "Joint Service Achievement Medal",
    abbreviation: "JSAM",
    worksheetProfile: "serviceUnit",
    ribbonUrl: "https://wiki.7cav.us/images/d/d0/JSAM.jpg",
    criteria:
      "Awarded for attending multiple section practices to which they are not assigned while still consistently attending their own. Is recommended by the benefitted combat line unit commander.",
    narrativeGuidance:
      "Describe the recipient's SP attendance/contributions in a minimum of three professionally written sentences.",
    eligibilityNotes: [
      "The recipient must have attended multiple section practices belonging to a unit to which they are not assigned.",
      "The recipient must still be consistently attending their own section practices.",
      "The recommendation is made by the benefitted combat line unit commander.",
    ],
    fields: { unit: { placeholder: "1/B/2-7, 2/B/2-7, etc." } },
    buildOpening: buildJointServiceAchievementOpening,
    buildClosing: buildJointServiceAchievementClosing,
  },
  {
    id: "army-commendation-medal",
    name: "Army Commendation Medal",
    abbreviation: "ARCOM",
    worksheetProfile: "serviceUnit",
    ribbonUrl: "https://wiki.7cav.us/images/d/dc/ARCOM.jpg",
    criteria:
      "Awarded for distinguished contributions to any area of the Regiment, or being selected Enlisted or NCO of the Quarter.",
    narrativeGuidance:
      "Describe the recipient's distinguished contributions in a minimum of three professionally written sentences.",
    buildOpening: buildServiceCommendationOpening,
    buildClosing: buildServiceCommendationClosing,
  },
  {
    id: "joint-service-commendation-medal",
    name: "Joint Service Commendation Medal",
    abbreviation: "JSCM",
    worksheetProfile: "serviceJointContribution",
    ribbonUrl: "https://wiki.7cav.us/images/5/5f/JSCM.jpg",
    criteria:
      "Awarded to Troopers that provide significant contributions to a combat line unit to which they are not assigned, outside of section practice attendance. Is recommended by the benefitted combat line unit commander.",
    narrativeGuidance:
      "Describe how the recipient demonstrated their actions/contributions in a minimum of three professionally written sentences.",
    eligibilityNotes: [
      "The recipient must not be assigned to the benefitted combat line unit.",
      "The qualifying contribution must be outside of section practice attendance.",
      "The recommendation is made by the benefitted combat line unit commander.",
    ],
    buildNarrativeOpening: buildSelectableServiceNarrativeOpening,
    buildOpening: buildJointServiceCommendationOpening,
    buildClosing: buildJointServiceCommendationClosing,
  },
  {
    id: "meritorious-service-medal",
    name: "Meritorious Service Medal",
    abbreviation: "MSM",
    worksheetProfile: "serviceMeritorious",
    ribbonUrl: "https://wiki.7cav.us/images/b/b3/MSM.jpg",
    criteria:
      'Awarded to any member for exceptional service or contributions that significantly impact the health and morale of the unit in a positive manner, or being selected as Enlisted, NCO, or Officer of the Quarter. Can only be awarded once per person, in any six-month period. The six-month limit does not apply to being awarded "Of the Quarter" medals.',
    narrativeGuidance:
      "Describe how the recipient demonstrated their meritorious service/contributions in a minimum of three professionally written sentences.",
    eligibilityNotes: [
      "The MSM may normally only be awarded once per person in any six-month period.",
    ],
    buildNarrativeOpening: buildSelectableServiceNarrativeOpening,
    buildOpening: buildMeritoriousServiceOpening,
    buildClosing: buildMeritoriousServiceClosing,
  },
  {
    id: "defense-meritorious-service-medal",
    name: "Defense Meritorious Service Medal",
    abbreviation: "DMSM",
    worksheetProfile: "serviceUnit",
    ribbonUrl: "https://wiki.7cav.us/images/a/a5/DMSM.jpg",
    criteria:
      "Awarded for a single, significant and distinguished meritorious contribution to any area of the Regiment. Can only be awarded once per person, in any six-month period.",
    narrativeGuidance:
      "Describe how the recipient demonstrated their single, significant, and distinguished contribution in a minimum of three professionally written sentences.",
    eligibilityNotes: [
      "The medal may only be awarded once per person in any six-month period.",
    ],
    buildOpening: buildDefenseMeritoriousServiceOpening,
    buildClosing: buildDefenseMeritoriousServiceClosing,
  },
  {
    id: "soldiers-medal",
    name: "Soldier’s Medal",
    abbreviation: "SM",
    worksheetProfile: "serviceMeritorious",
    ribbonUrl: "https://wiki.7cav.us/images/9/93/SM.jpg",
    criteria:
      "Awarded for multiple, significant and distinguished meritorious contributions to any area of the Regiment requiring significant time investment. Can only be awarded once per person, in any six-month period.",
    narrativeGuidance:
      "Describe the recipient's multiple meritorious service/contributions and significant time investment in a minimum of three professionally written sentences.",
    eligibilityNotes: [
      "The medal may only be awarded once per person in any six-month period.",
    ],
    buildNarrativeOpening: buildSelectableServiceNarrativeOpening,
    buildOpening: buildSoldiersMedalOpening,
    buildClosing: buildSoldiersMedalClosing,
  },
  {
    id: "legion-of-merit",
    name: "Legion of Merit",
    abbreviation: "LOM",
    worksheetProfile: "serviceSecondaryPeriod",
    ribbonUrl: "https://wiki.7cav.us/images/e/e5/LOM.jpg",
    criteria:
      "Awarded to members for exceptional service in a secondary billet over the course of one year, or being selected as Departmental Clerk of the Year. Can only be awarded once per person, per year. Cannot be awarded to secondary Lead billets or higher.",
    narrativeGuidance:
      "Describe how the recipient demonstrated their exceptional service in a minimum of three professionally written sentences.",
    eligibilityNotes: [
      "The recipient must have provided exceptional service in a secondary billet for one year.",
      "The qualifying billet must be below the secondary Lead level.",
      "The medal can only be awarded once per person, per year.",
    ],
    buildOpening: buildLegionOfMeritOpening,
    buildClosing: buildLegionOfMeritClosing,
  },
  {
    id: "defense-superior-service-medal",
    name: "Defense Superior Service Medal",
    abbreviation: "DSSM",
    worksheetProfile: "serviceLeadershipPeriod",
    ribbonUrl: "https://wiki.7cav.us/images/b/b1/DSSM.jpg",
    criteria:
      "Awarded to officers and non-commissioned officers for exceptionally meritorious leadership of a secondary billet over the course of one year, or being selected as Departmental Staff of the Year. Applies to sub-department Leads or higher only. Can also be awarded for meritorious service to the Regiment in leadership in operations over a year. Can only be awarded once per person, per year.",
    narrativeGuidance:
      "Describe how the recipient demonstrated their exceptionally meritorious leadership in a minimum of four professionally written sentences.",
    minimumNarrativeSentences: 4,
    eligibilityNotes: [
      "The recipient must be an officer or non-commissioned officer.",
      "Secondary billet: The recipient must have provided exceptionally meritorious leadership in a secondary billet for one year, at the sub-department Lead level or higher.",
      "Operations leadership: The recipient must have provided meritorious leadership in Regimental operations for one year.",
      "The medal can only be awarded once per person, per year.",
    ],
    buildOpening: buildDefenseSuperiorServiceOpening,
    buildClosing: buildDefenseSuperiorServiceClosing,
  },
  {
    id: "distinguished-service-medal",
    name: "Distinguished Service Medal",
    abbreviation: "DSM",
    worksheetProfile: "servicePrimaryPeriod",
    ribbonUrl: "https://wiki.7cav.us/images/2/29/DSM.jpg",
    criteria:
      "Awarded for distinguished service in a primary non-leadership billet, or being selected as Battalion or Regimental Enlisted of the Year. Can only be awarded once per person, per year. Cannot be awarded to primary leadership billets.",
    narrativeGuidance:
      "Describe how the recipient demonstrated their distinguished service in a minimum of four professionally written sentences.",
    minimumNarrativeSentences: 4,
    eligibilityNotes: [
      "The recipient must have provided distinguished service in a primary non-leadership billet.",
      "Service in a primary leadership billet does not qualify.",
      "The medal can only be awarded once per person, per year.",
    ],
    buildOpening: buildDistinguishedServiceOpening,
    buildClosing: buildDistinguishedServiceClosing,
  },
  {
    id: "defense-distinguished-service-medal",
    name: "Defense Distinguished Service Medal",
    abbreviation: "DDSM",
    worksheetProfile: "servicePrimaryPeriod",
    ribbonUrl: "https://wiki.7cav.us/images/3/33/DDSM.jpg",
    criteria:
      "Awarded to officers and non-commissioned officers for exceptionally meritorious leadership of a primary billet over the course of one year, or being selected as Battalion or Regimental Non-Commissioned Officer or Officer of the Year.",
    narrativeGuidance:
      "Describe how the recipient demonstrated their distinguished service in a minimum of four professionally written sentences.",
    minimumNarrativeSentences: 4,
    eligibilityNotes: [
      "The recipient must be an officer or non-commissioned officer.",
      "The recipient must have provided exceptionally meritorious leadership in a primary billet for one year.",
    ],
    fields: {
      role: { placeholder: "Company Commander, First Sergeant, etc." },
      element: { placeholder: "B/2-7, A/1-7, etc." },
    },
    buildOpening: buildDefenseDistinguishedServiceOpening,
    buildClosing: buildDefenseDistinguishedServiceClosing,
  },
].map((medal) => ({
  family: "Service Medal",
  criteriaHeading: "Medal Criteria",
  minimumNarrativeSentences: 3,
  eligibilityNotes: [],
  buildNarrativeOpening: buildServiceNarrativeOpening,
  ...medal,
}));

export function getServiceMedalById(medalId) {
  return SERVICE_MEDALS.find((medal) => medal.id === medalId) ?? null;
}
