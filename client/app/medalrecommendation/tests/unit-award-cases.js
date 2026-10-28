// Literal Unit Award review oracles from Awards and Decorations,
// pinned revision oldid=17782. Keep independent from production definitions/builders.
export const UNIT_AWARD_CASES = [
  {
    id: "army-valorous-unit-award",
    name: "Army Valorous Unit Award",
    abbreviation: "AVUA",
    family: "operation",
    minimumRecipients: 4,
    minimumSentences: 4,
    ribbonUrl: "https://wiki.7cav.us/images/8/8e/VUA.jpg",
    fields: [
      "Combat Unit",
      "Operation Title",
      "Location",
      "Operation Date",
      "Narrative",
    ],
    criteria:
      "Awarded to squad-sized units and up that display outstanding and exceptional skill as a whole during combat operations and the unit’s contribution was critical to the successful outcome of the operation. Must have won all official match(es) played or achieved total mission success (PVE). Must be an official organized event. This award is a Silver Star equivalent and is to be used for applicable scenarios with 4 or more people.",
    narrativeGuidance:
      "Describe how the unit demonstrated extraordinary heroism and skill/leadership under fire in the operation in a minimum of four professionally written sentences containing the explanation leading up to the event, two sentences of the event itself, and the outcome of the event and mission.",
    eligibilityNotes: [
      "Unit award recommendations should include all individuals in the unit being awarded.",
      "This award is a Silver Star equivalent and is to be used for applicable scenarios with 4 or more people.",
      "The unit’s contribution must have been critical to the operation’s success.",
    ],
    citation:
      "For conspicuous gallantry and intrepidity under direct enemy fire while serving as 1st Squad, Alpha Company in the 7th Cavalry Regiment during combat in Operation Overlord near Omaha Beach on 11 August 2026. The squad prepared the approach. The unit secured the crossing. Its teams repelled the counterattack. The mission achieved every objective. Their heroism, skill and devotion to duty reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    id: "meritorious-unit-commendation",
    name: "Meritorious Unit Commendation",
    abbreviation: "MUC",
    family: "operation",
    minimumRecipients: 4,
    minimumSentences: 3,
    ribbonUrl: "https://wiki.7cav.us/images/c/cc/MUC.jpg",
    fields: [
      "Skillful / Heroic",
      "Combat Unit",
      "Operation Title",
      "Location",
      "Operation Date",
      "Narrative",
    ],
    criteria:
      "Awarded to squad-sized units and up that display outstanding and exceptional skill as a whole during combat operations and competitions. Must have won all official match(es) played in the competition, or achieved total mission success (PVE). Must be an official organized event. Each Battalion may award one per month. This award is a Bronze Star equivalent and is to be used for applicable scenarios with 4 or more people.",
    narrativeGuidance:
      "Describe how the unit demonstrated exceptional skill/heroism over the entire duration of the operation that was critical to the successful outcome in a minimum of three professionally written sentences containing the explanation leading up to the events, the events themselves, and the outcome of the events.",
    eligibilityNotes: [
      "Unit award recommendations should include all individuals in the unit being awarded.",
      "This award is a Bronze Star equivalent and is to be used for applicable scenarios with 4 or more people.",
      "Each Battalion may award one MUC per month.",
    ],
    citation:
      "For skillful actions over an entire operation while serving as 1st Squad, Alpha Company in the 7th Cavalry Regiment during combat in Operation Overlord near Omaha Beach on 11 August 2026. The squad prepared the approach. The unit secured the crossing. Its teams repelled the counterattack. The mission achieved every objective. Their skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    id: "joint-meritorious-unit-award",
    name: "Joint Meritorious Unit Award",
    abbreviation: "JMUA",
    family: "service",
    minimumRecipients: 1,
    minimumSentences: 3,
    ribbonUrl: "https://wiki.7cav.us/images/0/00/JMUA.jpg",
    fields: [
      "Benefitted Unit",
      "Awarded Department / Unit",
      "Service / Contributions",
      "Narrative Opening",
      "Narrative",
    ],
    criteria:
      "Awarded to section-level units and higher or sub-departments and higher for excellent meritorious performance of their duties and multiple, significant and distinguished meritorious contributions that positively affected multiple areas of the Regiment. Must be recommended by Battalion Staff or Departmental HQ or higher. This award is a Meritorious Service Medal equivalent.",
    narrativeGuidance:
      "Continue from the displayed group opening. Describe how the group demonstrated their multiple meritorious service/contributions in a minimum of three professionally written sentences.",
    eligibilityNotes: [
      "Unit award recommendations should include all individuals in the unit being awarded.",
      "The awarded organization must be a section-level unit or larger, or a sub-department or larger.",
      "Recommendation must originate from Battalion Staff, Departmental HQ, or higher.",
    ],
    citation:
      "For exceptionally meritorious performance and distinguished contributions to S3 Operations. S3 ARMA Operations staff distinguished themselves by coordinating training across departments. The group completed every assigned task. Their work improved readiness throughout the Regiment. Their dedication to duty and exceptionally meritorious service are in great credit to themselves, S3 Operations, and the 7th Cavalry Gaming Regiment.",
  },
  {
    id: "superior-unit-award",
    name: "Superior Unit Award",
    abbreviation: "SUA",
    family: "service",
    minimumRecipients: 1,
    minimumSentences: 3,
    ribbonUrl: "https://wiki.7cav.us/images/7/71/SUA.jpg",
    fields: [
      "Service / Contributions",
      "Benefitted Unit",
      "Awarded Department / Unit",
      "Narrative Opening",
      "Narrative",
    ],
    criteria:
      "Awarded to section-level units and higher or sub-departments and higher for superior performance of their duties. Each Battalion/Department may award one per 6 months. This award is an Army Commendation Medal equivalent.",
    narrativeGuidance:
      "Continue from the displayed group opening. Describe how the group demonstrated their meritorious service/contributions in a minimum of three professionally written sentences.",
    eligibilityNotes: [
      "Unit award recommendations should include all individuals in the unit being awarded.",
      "The awarded organization must be a section-level unit or larger, or a sub-department or larger.",
      "Each Battalion or Department may award one SUA per six months.",
    ],
    citation:
      "For exceptionally meritorious service to S3 Operations. S3 ARMA Operations staff distinguished themselves by coordinating training across departments. The group completed every assigned task. Their work improved readiness throughout the Regiment. Their dedication to duty and exceptionally meritorious service are in great credit to themselves, S3 Operations, and the 7th Cavalry Gaming Regiment.",
  },
];

export const UNIT_NARRATIVE =
  "The squad prepared the approach. The unit secured the crossing. Its teams repelled the counterattack. The mission achieved every objective.";
export const UNIT_CONTINUATION =
  "coordinating training across departments. The group completed every assigned task. Their work improved readiness throughout the Regiment.";
export const UNIT_OPERATION_INPUTS = {
  combatUnit: "1st Squad, Alpha Company",
  operationTitle: "Overlord",
  location: "Omaha Beach",
  operationDate: "2026-08-11",
  narrative: UNIT_NARRATIVE,
};
export const UNIT_SERVICE_INPUTS = {
  benefittedUnit: "S3 Operations",
  awardedUnit: "S3 ARMA Operations staff",
  serviceType: "service",
  narrativeOpening: "distinguished",
  narrative: UNIT_CONTINUATION,
};
