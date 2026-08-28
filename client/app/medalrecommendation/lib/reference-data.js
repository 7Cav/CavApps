/* exported STATIC_DATA_REVISION, APP_RULES, RANK_PRECEDENCE, COMBAT_ROLE_CHOICES, INDIVIDUAL_AWARDS, UNIT_AWARDS */

/**
 * Public, relatively static application data.
 *
 * These source-controlled definitions are the runtime source of truth for the
 * deployed application. Award generation does not depend on an administrative
 * worksheet or workbook.
 */

const STATIC_DATA_REVISION = "2026-08-07.1";

const APP_RULES = Object.freeze({
  minimumUnitRecipients: 4,
  maximumUnitRecipients: 20,
  maximumOperationIndividualRecipients: 20,
  maximumServiceIndividualRecipients: 20,
  maximumManualServiceUnitRecipients: 20,
});

const RANK_PRECEDENCE = Object.freeze([
  "GOA",
  "GEN",
  "LTG",
  "MG",
  "BG",
  "COL",
  "LTC",
  "MAJ",
  "CPT",
  "1LT",
  "2LT",
  "CW5",
  "CW4",
  "CW3",
  "CW2",
  "WO1",
  "CSM",
  "SGM",
  "1SG",
  "MSG",
  "SFC",
  "SSG",
  "SGT",
  "CPL",
  "SPC",
  "PFC",
  "PVT",
  "RCT",
]);

/**
 * These are suggestions rather than an enforced list. The role field remains
 * free text so specialized unit roles can still be entered.
 */
const COMBAT_ROLE_CHOICES = Object.freeze([
  "trooper",
  "rifleman",
  "automatic rifleman",
  "machine gunner",
  "gunner",
  "medic",
  "engineer",
  "anti-tank trooper",
  "assault trooper",
  "support trooper",
  "sniper",
  "spotter",
  "crewman",
  "driver",
  "tanker",
  "tank commander",
  "pilot",
  "aircrew member",
  "squad leader",
  "section leader",
  "platoon leader",
  "platoon sergeant",
]);

const INDIVIDUAL_AWARDS = Object.freeze([
  Object.freeze({
    name: "Army Commendation Medal",
    abbreviation: "ARCOM",
    imageUrl: "https://wiki.7cav.us/images/d/dc/ARCOM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:ARCOM.jpg",
    criteria:
      "Skillful or heroic performance over the entire operation, without one specific decisive act.",
    openingTemplate:
      "For {ACTION} actions over an entire operation while serving as {ELEMENT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s {ACTION} actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 3,
    guidance:
      "Explain the lead-up, the actions across the operation, and the outcome. The citation must be professionally written.",
    eligibility: "Show sustained skill or heroism throughout the operation.",
    characterRequired: true,
    survivalRule: "Not specified",
    flightWingsRequired: false,
    leadershipRequired: false,
    opponentRule: "None",
    allowedScope: "Fixed: Entire Operation",
    scopeRequired: false,
    allowedCharacter: "Skillful|Heroic",
  }),

  Object.freeze({
    name: "Army Commendation Medal With Valor",
    abbreviation: "ARCOMV",
    imageUrl: "https://wiki.7cav.us/images/0/0f/ARCOMV.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:ARCOMV.jpg",
    criteria: "A single act of heroism or skill while under enemy fire.",
    openingTemplate:
      "For a single act of heroism and skill under enemy fire while serving as {ELEMENT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s heroism and skill reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 3,
    guidance:
      "Explain the lead-up, the single act under fire, and the outcome.",
    eligibility:
      "The recommendation must focus on one specific act under enemy fire.",
    characterRequired: false,
    survivalRule: "Not specified",
    flightWingsRequired: false,
    leadershipRequired: false,
    opponentRule: "None",
    allowedScope: "Fixed: Single",
    scopeRequired: false,
    allowedCharacter: "Fixed by template",
  }),

  Object.freeze({
    name: "Air Medal",
    abbreviation: "AM",
    imageUrl: "https://wiki.7cav.us/images/3/3f/AM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:AM.jpg",
    criteria:
      "Aircrew or pilot performance over the entire operation that was critical to success.",
    openingTemplate:
      "For {ACTION} actions over an entire operation while serving as {ELEMENT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s {ACTION} actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 3,
    guidance:
      "Explain the lead-up, sustained aircrew actions, and outcome, including why the contribution was critical.",
    eligibility:
      "Recipient must be an aircrew member or pilot and the contribution must be critical to the successful outcome.",
    characterRequired: true,
    survivalRule: "Not specified",
    flightWingsRequired: false,
    leadershipRequired: false,
    opponentRule: "None",
    allowedScope: "Fixed: Entire Operation",
    scopeRequired: false,
    allowedCharacter: "Skillful|Heroic",
  }),

  Object.freeze({
    name: "Purple Heart",
    abbreviation: "PH",
    imageUrl: "https://wiki.7cav.us/images/b/b5/PH.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:PH.jpg",
    criteria:
      "Single or multiple heroic actions under enemy fire resulting in the recipient's sacrifice and death.",
    openingTemplate:
      "For {SCOPE} heroic {ACTION_NOUN} and skill under enemy fire resulting in their sacrifice and death while serving as {ELEMENT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s heroism and sacrifice reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 3,
    guidance:
      "Explain the lead-up, the heroic action or actions under fire, the death, and the outcome.",
    eligibility:
      "The recipient must have been killed while undertaking the recognized combat actions.",
    characterRequired: false,
    survivalRule: "Must die",
    flightWingsRequired: false,
    leadershipRequired: false,
    opponentRule: "None",
    allowedScope: "Single|Multiple",
    scopeRequired: true,
    allowedCharacter: "Fixed: Heroic",
  }),

  Object.freeze({
    name: "Bronze Star Medal",
    abbreviation: "BSM",
    imageUrl: "https://wiki.7cav.us/images/5/5e/BS.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:BS.jpg",
    criteria:
      "Sustained skillful or heroic actions over the operation that were critical to success.",
    openingTemplate:
      "For {ACTION} actions over an entire operation while serving as {ELEMENT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s {ACTION} actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 3,
    guidance:
      "Explain the lead-up, sustained actions, and outcome, including why the contribution was critical.",
    eligibility:
      "The contribution must have been critical to the successful outcome of the operation.",
    characterRequired: true,
    survivalRule: "Not specified",
    flightWingsRequired: false,
    leadershipRequired: false,
    opponentRule: "None",
    allowedScope: "Fixed: Entire Operation",
    scopeRequired: false,
    allowedCharacter: "Skillful|Heroic",
  }),

  Object.freeze({
    name: "Bronze Star Medal With Valor",
    abbreviation: "BSMV",
    imageUrl: "https://wiki.7cav.us/images/8/88/BSV.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:BSV.jpg",
    criteria:
      "A single extraordinary act of heroism and skill under fire that was critical to success.",
    openingTemplate:
      "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as {ELEMENT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s skills and heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 3,
    guidance: "Explain the lead-up, the extraordinary act, and the outcome.",
    eligibility:
      "The act must be critical to success and the recipient must have survived.",
    characterRequired: false,
    survivalRule: "Must survive",
    flightWingsRequired: false,
    leadershipRequired: false,
    opponentRule: "None",
    allowedScope: "Fixed: Single",
    scopeRequired: false,
    allowedCharacter: "Fixed by template",
  }),

  Object.freeze({
    name: "Distinguished Flying Cross",
    abbreviation: "DFC",
    imageUrl: "https://wiki.7cav.us/images/7/74/DFC.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:DFC.jpg",
    criteria:
      "A pilot's single extraordinary act of heroism and skill under fire that was critical to success.",
    openingTemplate:
      "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as a {ELEMENT} pilot in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s skills and heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 3,
    guidance:
      "Explain the lead-up, the pilot's extraordinary act, and the outcome.",
    eligibility:
      "Pilot only; aircrew are ineligible. Recipient must hold flight wings and must have survived.",
    characterRequired: false,
    survivalRule: "Must survive",
    flightWingsRequired: true,
    leadershipRequired: false,
    opponentRule: "None",
    allowedScope: "Fixed: Single",
    scopeRequired: false,
    allowedCharacter: "Fixed by template",
  }),

  Object.freeze({
    name: "Silver Star",
    abbreviation: "SS",
    imageUrl: "https://wiki.7cav.us/images/8/8f/SS.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:SS.jpg",
    criteria:
      "Extraordinary heroism, skill, and leadership under fire in an official leadership position, critical to success.",
    openingTemplate:
      "For conspicuous gallantry and intrepidity under direct enemy fire while serving as {ELEMENT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s heroism, skill and devotion to duty reflects great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 4,
    guidance:
      "Include the lead-up, at least two sentences describing the event, and the outcome of the event and mission.",
    eligibility:
      "Recipient must have served in an official leadership position and survived.",
    characterRequired: false,
    survivalRule: "Must survive",
    flightWingsRequired: false,
    leadershipRequired: true,
    opponentRule: "None",
    allowedScope: "Fixed by template",
    scopeRequired: false,
    allowedCharacter: "Fixed by template",
  }),

  Object.freeze({
    name: "Distinguished Service Cross",
    abbreviation: "DSC",
    imageUrl: "https://wiki.7cav.us/images/d/d3/DSC.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:DSC.jpg",
    criteria:
      "Extraordinary action unquestionably responsible for mission success against live opposition, or qualifying OIC action against AI.",
    openingTemplate:
      "For conspicuous gallantry and intrepidity under direct enemy fire while serving as {ELEMENT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "{FULLNAME}'s heroism, skill and devotion to duty reflects great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 5,
    guidance:
      "Include the lead-up, at least two sentences describing the event, and at least two sentences describing the outcome.",
    eligibility:
      "Recipient must survive. Normally requires live non-Cav opposition or internal PvP; against AI it is limited to qualifying OIC leadership.",
    characterRequired: false,
    survivalRule: "Must survive",
    flightWingsRequired: false,
    leadershipRequired: false,
    opponentRule: "Live/PvP or qualifying OIC vs AI",
    allowedScope: "Fixed by template",
    scopeRequired: false,
    allowedCharacter: "Fixed by template",
  }),
]);

const UNIT_AWARDS = Object.freeze([
  Object.freeze({
    name: "Army Valorous Unit Award",
    abbreviation: "VUA",
    imageUrl: "https://wiki.7cav.us/images/8/8e/VUA.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:VUA.jpg",
    criteria:
      "Awarded to squad-sized units and larger for outstanding and exceptional skill during combat operations when the unit's contribution was critical to mission success.",
    openingTemplate:
      "For conspicuous gallantry and intrepidity under direct enemy fire while serving as {UNIT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "Their heroism, skill and devotion to duty reflects great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 4,
    guidance:
      "Describe the lead-up, at least two sentences covering the unit's actions, and the outcome of the event and mission.",
    eligibility:
      "Requires an official organized event and at least four recipients.",
    characterRequired: false,
    allowedCharacter: "Fixed by template",
  }),

  Object.freeze({
    name: "Meritorious Unit Commendation",
    abbreviation: "MUC",
    imageUrl: "https://wiki.7cav.us/images/c/cc/MUC.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/File:MUC.jpg",
    criteria:
      "Awarded to squad-sized units and larger for outstanding and exceptional skill during combat operations or competitions.",
    openingTemplate:
      "For {ACTION} actions over an entire operation while serving as {UNIT} in the 7th Cavalry Regiment during combat in {OPERATION} near {LOCATION} on {DATE}.",
    endingTemplate:
      "Their {ACTION} actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    minimumSentences: 3,
    guidance:
      "Describe how the unit demonstrated exceptional skill or heroism throughout the operation, including the lead-up, actions, and outcome.",
    eligibility:
      "Requires an official organized event, total mission success or all official matches won, and at least four recipients.",
    characterRequired: true,
    allowedCharacter: "Skillful|Heroic",
  }),
]);

/* exported SERVICE_REFERENCE_CHOICES, SERVICE_AWARD_DEFINITIONS, validateServiceAwardDefinitions_, buildOrganizationReference_ */

/** Template-driven Service award definitions. */
const SERVICE_REFERENCE_CHOICES = Object.freeze({
  narrativeVerbs: Object.freeze(["distinguished", "contributed"]),
  narrativeLeads: Object.freeze([
    "distinguished themselves by",
    "contributed by",
  ]),
  actionsOrContributions: Object.freeze(["actions", "contributions"]),
  meritoriousBases: Object.freeze([
    "exceptionally meritorious service",
    "exceptionally meritorious contributions",
  ]),
  soldiersRecognitionTypes: Object.freeze(["service", "contributions"]),
  superiorBases: Object.freeze([
    "exceptionally meritorious service",
    "exceptionally meritorious contributions",
  ]),
  leadershipContexts: Object.freeze(["secondary billet", "operations"]),
});

const SERVICE_AWARD_DEFINITIONS = Object.freeze([
  {
    id: "service_outstanding_volunteer_service_medal",
    name: "Outstanding Volunteer Service Medal",
    abbreviation: "OVSM",
    scope: "individual",
    fields: [
      {
        key: "nonCombatDepartment",
        label: "Non-Combat Department",
        component: "organization",
        required: true,
        optionsSource: "supportDepartments",
        placeholder: "S1 Operations",
      },
    ],
    minimumSentences: 2,
    openingTemplate:
      "For providing outstanding service to {NON_COMBAT_DEPARTMENT}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and commitment is in great credit to themselves, {NON_COMBAT_DEPARTMENT} and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Outstanding service to a non-combat department to which the recipient is not assigned.",
    guidance:
      "Describe the recipient’s specific contributions to the selected department and explain the effect of that service.",
    eligibility:
      "The recipient must not have been assigned to the benefited non-combat department during the cited service.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/e/ec/OVSM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_humanitarian_service_medal",
    name: "Humanitarian Service Medal",
    abbreviation: "HSM",
    scope: "individual",
    fields: [],
    minimumSentences: 2,
    openingTemplate: "For providing aid to a fellow trooper.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and commitment is in great credit to themselves and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Providing financial, physical, mental, emotional, gaming, or computer-related aid to a fellow member, including initiating a Garry Owen for a member in need.",
    guidance:
      "Describe how the recipient provided help or aid and explain how it benefited the fellow member.",
    eligibility:
      "The narrative must identify a qualifying form of aid provided to a 7th Cavalry member.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/3/3b/HSM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_army_achievement_medal",
    name: "Army Achievement Medal",
    abbreviation: "AAM",
    scope: "individual",
    fields: [
      {
        key: "affectedArea",
        label: "Affected Area of the Regiment",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "B/2/E/2-7",
      },
    ],
    minimumSentences: 3,
    openingTemplate: "For contributions in {AFFECTED_AREA}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and commitment is in great credit to themselves, {AFFECTED_AREA} and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Contributions to any area of the Regiment, or selection as Enlisted of the Quarter.",
    guidance:
      "Describe the recipient’s contributions to the affected area and explain their results or impact.",
    eligibility:
      "The recommendation must document qualifying contributions or an Enlisted of the Quarter selection.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/d/d6/AAM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_joint_service_achievement_medal",
    name: "Joint Service Achievement Medal",
    abbreviation: "JSAM",
    scope: "individual",
    fields: [
      {
        key: "benefitedUnit",
        label: "Benefited Combat Line Unit",
        component: "organization",
        required: true,
        optionsSource: "lineOrganizations",
        placeholder: "2/B/2-7",
      },
    ],
    minimumSentences: 3,
    openingTemplate: "For contributions to {BENEFITED_UNIT}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and commitment to the Regiment is in great credit to themselves and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Attendance and contributions at multiple section practices outside the recipient’s assigned unit while consistently attending their own.",
    guidance:
      "Describe the outside section-practice attendance and the recipient’s contributions to the benefited combat-line unit.",
    eligibility:
      "The recipient must continue attending their assigned section practices, and the benefited combat-line unit commander must recommend the award.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/d/d0/JSAM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_army_commendation_medal",
    name: "Army Commendation Medal — Service",
    abbreviation: "ARCOM",
    scope: "individual",
    fields: [
      {
        key: "affectedUnitOrArea",
        label: "Affected Unit or Area",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "A/1/A/ACD",
      },
    ],
    minimumSentences: 3,
    openingTemplate:
      "For distinguished contributions to {AFFECTED_UNIT_OR_AREA}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and commitment to the Regiment is in great credit to themselves, {AFFECTED_UNIT_OR_AREA} and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Distinguished contributions to any area of the Regiment, or selection as Enlisted or NCO of the Quarter.",
    guidance:
      "Describe the distinguished contributions to the selected unit or area and explain their impact.",
    eligibility:
      "The recommendation must document distinguished contributions or a qualifying Enlisted or NCO of the Quarter selection.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/d/dc/ARCOM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_joint_service_commendation_medal",
    name: "Joint Service Commendation Medal",
    abbreviation: "JSCM",
    scope: "individual",
    fields: [
      {
        key: "actionsOrContributions",
        label: "Actions or Contributions",
        component: "select",
        required: true,
        optionsSource: "actionsOrContributions",
      },
      {
        key: "benefitedCompany",
        label: "Benefited Unit",
        component: "organization",
        required: true,
        optionsSource: "companies",
        placeholder: "B/1-7",
        helpText:
          "Enter the unit to which the recipient contributed to or acted on during the cited service.",
      },
      {
        key: "assignedCompany",
        label: "Recipient’s Assigned Unit During Cited Service",
        component: "organization",
        required: true,
        optionsSource: "companies",
        placeholder: "A/2/A/1-7",
        helpText:
          "Enter the unit to which the recipient belonged during the cited service.",
      },
      {
        key: "narrativeLead",
        label: "Narrative Introduction",
        component: "select",
        required: true,
        optionsSource: "narrativeLeads",
      },
    ],
    minimumSentences: 3,
    openingTemplate:
      "For {ACTIONS_OR_CONTRIBUTIONS} to {BENEFITED_COMPANY} as a member of {ASSIGNED_COMPANY}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and {ACTIONS_OR_CONTRIBUTIONS} are great credit to themselves and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Significant contributions to a combat-line unit outside the recipient’s assignment and outside ordinary section-practice attendance.",
    guidance:
      "Describe the actions or contributions, how they benefited the selected combat-line unit, and the recipient’s role while assigned elsewhere.",
    eligibility:
      "The benefited and assigned units must be different; section-practice attendance alone does not qualify, and the benefited unit commander must recommend the award.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/5/5f/JSCM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_meritorious_service_medal",
    name: "Meritorious Service Medal",
    abbreviation: "MSM",
    scope: "individual",
    fields: [
      {
        key: "recognitionBasis",
        label: "Recognition Type",
        component: "select",
        required: true,
        optionsSource: "meritoriousBases",
      },
      {
        key: "benefitedUnitOrArea",
        label: "Benefited Unit or Area",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "E/2-7",
      },
      {
        key: "narrativeLead",
        label: "Narrative Introduction",
        component: "select",
        required: true,
        optionsSource: "narrativeLeads",
      },
    ],
    minimumSentences: 3,
    openingTemplate: "For {RECOGNITION_BASIS} to {BENEFITED_UNIT_OR_AREA}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and {RECOGNITION_BASIS} are in great credit to themself and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Exceptional service or contributions that significantly improve unit health and morale, or selection as Enlisted, NCO, or Officer of the Quarter.",
    guidance:
      "Describe the exceptional service or contributions and explain the significant positive effect on unit health or morale.",
    eligibility:
      "Normally limited to one award per person in any six-month period; the limit does not apply to Of-the-Quarter awards.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/b/b3/MSM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_defense_meritorious_service_medal",
    name: "Defense Meritorious Service Medal",
    abbreviation: "DMSM",
    scope: "individual",
    fields: [
      {
        key: "benefitedUnitOrArea",
        label: "Benefited Unit or Area",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "S6 Department",
      },
    ],
    minimumSentences: 3,
    openingTemplate:
      "For a single, significant, and distinguished contribution to {BENEFITED_UNIT_OR_AREA}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} distinguished contribution is in great credit to themselves, the {BENEFITED_UNIT_OR_AREA}, and the 7th Cavalry Gaming Regiment.",
    criteria:
      "A single, significant, and distinguished meritorious contribution to any area of the Regiment.",
    guidance:
      "Keep the narrative focused on the one qualifying contribution and explain why it was significant and distinguished.",
    eligibility: "Limited to one award per person in any six-month period.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/a/a5/DMSM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_soldiers_medal",
    name: "Soldier’s Medal",
    abbreviation: "SM",
    scope: "individual",
    fields: [
      {
        key: "recognitionType",
        label: "Recognition Type",
        component: "select",
        required: true,
        optionsSource: "soldiersRecognitionTypes",
      },
      {
        key: "benefitedUnitOrArea",
        label: "Benefited Unit or Area",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "A/3-7",
      },
      {
        key: "narrativeLead",
        label: "Narrative Introduction",
        component: "select",
        required: true,
        optionsSource: "narrativeLeads",
      },
    ],
    minimumSentences: 3,
    openingTemplate:
      "For {SOLDIERS_OPENING_PHRASE} to {BENEFITED_UNIT_OR_AREA}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and {SOLDIERS_CLOSING_PHRASE} are in great credit to themself, the {BENEFITED_UNIT_OR_AREA}, and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Multiple significant and distinguished meritorious contributions to any area of the Regiment requiring significant time investment.",
    guidance:
      "Describe multiple qualifying contributions, the time invested, and their collective effect on the benefited unit or area.",
    eligibility: "Limited to one award per person in any six-month period.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/9/93/SM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_legion_of_merit",
    name: "Legion of Merit",
    abbreviation: "LOM",
    scope: "individual",
    fields: [
      {
        key: "secondaryBillet",
        label: "Secondary Billet Held During Cited Service",
        component: "text",
        required: true,
        suggestionsSource: "secondaryBillets",
        placeholder: "S7 ARMA IS Instructor",
        helpText: "Enter the billet held during the cited service period.",
      },
      {
        key: "creditedDepartmentOrElement",
        label: "Credited Department or Element",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "S7 Department",
        helpText:
          "Enter the organization that should be credited in the closing sentence.",
      },
      {
        key: "startMonth",
        label: "Start Month",
        component: "month",
        required: true,
      },
      {
        key: "startYear",
        label: "Start Year",
        component: "year",
        required: true,
      },
      {
        key: "endMonth",
        label: "End Month",
        component: "month",
        required: true,
      },
      {
        key: "endYear",
        label: "End Year",
        component: "year",
        required: true,
      },
    ],
    minimumSentences: 3,
    openingTemplate:
      "For exceptional service in a secondary billet while serving as {SECONDARY_BILLET} during {SERVICE_PERIOD}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} dedication to duty and commitment to their department is in great credit to themselves, the {CREDITED_DEPARTMENT_OR_ELEMENT} and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Exceptional service in a secondary billet over the course of one year, or selection as Departmental Clerk of the Year.",
    guidance:
      "Describe the recipient’s exceptional service throughout the cited period and connect it to the secondary billet and credited department.",
    eligibility:
      "Limited to one award per person per year and not available for secondary Lead billets or higher.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/e/e5/LOM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_defense_superior_service_medal",
    name: "Defense Superior Service Medal",
    abbreviation: "DSSM",
    scope: "individual",
    fields: [
      {
        key: "leadershipContext",
        label: "Leadership Context",
        component: "select",
        required: true,
        optionsSource: "leadershipContexts",
      },
      {
        key: "secondaryLeadershipBillet",
        label: "Secondary Leadership Billet Held During Cited Service",
        component: "text",
        required: true,
        suggestionsSource: "secondaryBillets",
        placeholder: "S1 Operations Senior",
        helpText: "Enter the billet held during the cited service period.",
        visibleWhen: {
          field: "leadershipContext",
          equals: "secondary billet",
        },
      },
      {
        key: "creditedDepartmentOrElement",
        label: "Credited Department or Element",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "S1 Operations",
        helpText:
          "Enter the organization that should be credited in the closing sentence.",
        visibleWhen: {
          field: "leadershipContext",
          equals: "secondary billet",
        },
      },
      {
        key: "operationsLeadershipAssignment",
        label: "Operations Leadership Assignment Held During Cited Service",
        component: "text",
        required: true,
        suggestionsSource: "allBillets",
        placeholder: "S3 HLL Public Staff Lead",
        helpText: "Enter the billet held during the cited service period.",
        visibleWhen: {
          field: "leadershipContext",
          equals: "operations",
        },
      },
      {
        key: "creditedOperationsAo",
        label: "Credited Operations AO",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "S3 HLL Public Staff",
        helpText:
          "Enter the organization that should be credited in the closing sentence.",
        visibleWhen: {
          field: "leadershipContext",
          equals: "operations",
        },
      },
      {
        key: "startMonth",
        label: "Start Month",
        component: "month",
        required: true,
      },
      {
        key: "startYear",
        label: "Start Year",
        component: "year",
        required: true,
      },
      {
        key: "endMonth",
        label: "End Month",
        component: "month",
        required: true,
      },
      {
        key: "endYear",
        label: "End Year",
        component: "year",
        required: true,
      },
    ],
    minimumSentences: 4,
    openingTemplate:
      "For exceptionally meritorious leadership of {LEADERSHIP_CONTEXT_PHRASE} while serving as {LEADERSHIP_ASSIGNMENT} during {SERVICE_PERIOD}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} exceptionally meritorious leadership is in great credit to themselves, the {CREDITED_ELEMENT_OR_OPERATIONS_AO}, and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Exceptionally meritorious leadership of a secondary billet or operations over the course of one year, or selection as Departmental Staff of the Year.",
    guidance:
      "Describe the recipient’s leadership throughout the cited period and explain its effect on the secondary billet or Operations AO.",
    eligibility:
      "The recipient must be an NCO or officer serving as a sub-department Lead or higher, and the award is limited to once per person per year.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/b/b1/DSSM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_distinguished_service_medal",
    name: "Distinguished Service Medal",
    abbreviation: "DSM",
    scope: "individual",
    fields: [
      {
        key: "primaryBillet",
        label: "Primary Billet Held During Cited Service",
        component: "text",
        required: true,
        suggestionsSource: "primaryBillets",
        placeholder: "2/A/2-7 Platoon Sergeant",
        helpText: "Enter the billet held during the cited service period.",
      },
      {
        key: "creditedOrganizationalElement",
        label: "Credited Organizational Element",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "2/A/2-7",
        helpText:
          "Enter the organization that should be credited in the closing sentence.",
      },
      {
        key: "startMonth",
        label: "Start Month",
        component: "month",
        required: true,
      },
      {
        key: "startYear",
        label: "Start Year",
        component: "year",
        required: true,
      },
      {
        key: "endMonth",
        label: "End Month",
        component: "month",
        required: true,
      },
      {
        key: "endYear",
        label: "End Year",
        component: "year",
        required: true,
      },
    ],
    minimumSentences: 4,
    openingTemplate:
      "For distinguished service in a primary billet while serving as {PRIMARY_BILLET} during {SERVICE_PERIOD}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} distinguished service and commitment is a great credit to themselves, {CREDITED_ORGANIZATIONAL_ELEMENT}, and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Distinguished service in a primary non-leadership billet, or selection as Battalion or Regimental Enlisted of the Year.",
    guidance:
      "Describe the distinguished service throughout the cited period and explain its effect on the credited organizational element.",
    eligibility:
      "Limited to one award per person per year and not available for primary leadership billets.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/2/29/DSM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_defense_distinguished_service_medal",
    name: "Defense Distinguished Service Medal",
    abbreviation: "DDSM",
    scope: "individual",
    fields: [
      {
        key: "primaryBillet",
        label: "Primary Billet Held During Cited Service",
        component: "text",
        required: true,
        suggestionsSource: "primaryBillets",
        placeholder: "B/2-7 Company Commander",
        helpText:
          "Enter the billet held during the cited service period. Current roster billets are suggestions only and may be outdated.",
      },
      {
        key: "creditedOrganizationalElement",
        label: "Credited Organizational Element",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "B/2-7",
        helpText:
          "Enter the organization that should be credited in the closing sentence. Suggestions are optional and fully editable.",
      },
      {
        key: "startMonth",
        label: "Start Month",
        component: "month",
        required: true,
      },
      {
        key: "startYear",
        label: "Start Year",
        component: "year",
        required: true,
      },
      {
        key: "endMonth",
        label: "End Month",
        component: "month",
        required: true,
      },
      {
        key: "endYear",
        label: "End Year",
        component: "year",
        required: true,
      },
    ],
    minimumSentences: 4,
    openingTemplate:
      "For exceptionally meritorious leadership of a primary billet while serving as {PRIMARY_BILLET} during {SERVICE_PERIOD}.",
    endingTemplate:
      "{FULL_NAME_POSSESSIVE} exemplary leadership demonstrates their commitment to their troopers and reflects great credit upon themselves, {CREDITED_ORGANIZATIONAL_ELEMENT}, and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Exceptionally meritorious leadership of a primary billet over the course of one year, or selection as Battalion or Regimental NCO or Officer of the Year.",
    guidance:
      "Describe the recipient’s leadership throughout the cited period and explain its effect on their troopers and organizational element.",
    eligibility:
      "The recipient must be an NCO or officer serving in a qualifying primary leadership billet, or receive a qualifying Of-the-Year selection.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/images/3/33/DDSM.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_joint_meritorious_unit_award",
    name: "Joint Meritorious Unit Award",
    abbreviation: "JMUA",
    scope: "unit",
    fields: [
      {
        key: "recognizedGroup",
        label: "Recognized Staff Department or Unit",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "D/1/B/3-7",
      },
      {
        key: "benefitedUnit",
        label: "Benefited Unit or Area",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "S5 Graphics",
      },
      {
        key: "narrativeVerb",
        label: "Narrative Introduction",
        component: "select",
        required: true,
        optionsSource: "narrativeVerbs",
      },
    ],
    minimumSentences: 3,
    openingTemplate:
      "For exceptionally meritorious performance and distinguished contributions to {BENEFITED_UNIT}. {RECOGNIZED_GROUP} {NARRATIVE_VERB} themselves by",
    endingTemplate:
      "Their dedication to duty and exceptionally meritorious service and contributions are in great credit to themselves, {BENEFITED_UNIT}, and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Excellent meritorious performance of duties and multiple significant, distinguished contributions that positively affect multiple areas of the Regiment.",
    guidance:
      "Describe the group’s multiple contributions, how it performed its duties, and the effect across the benefited areas.",
    eligibility:
      "The recognized group must be section or sub-department level or higher, and the award must be recommended by Battalion Staff, Departmental HQ, or higher. This is a Meritorious Service Medal equivalent.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/wiki/Special:Redirect/file/JMUA.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
  {
    id: "service_superior_unit_award",
    name: "Superior Unit Award",
    abbreviation: "SUA",
    scope: "unit",
    fields: [
      {
        key: "recognizedGroup",
        label: "Recognized Staff Department or Unit",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "D/1/B/3-7",
      },
      {
        key: "benefitedUnit",
        label: "Benefited Unit or Area",
        component: "organization",
        required: true,
        optionsSource: "approvedOrganizations",
        placeholder: "S1 Operations",
      },
      {
        key: "recognitionBasis",
        label: "Recognition Basis",
        component: "select",
        required: true,
        optionsSource: "superiorBases",
      },
      {
        key: "narrativeVerb",
        label: "Narrative Introduction",
        component: "select",
        required: true,
        optionsSource: "narrativeVerbs",
      },
    ],
    minimumSentences: 3,
    openingTemplate:
      "For {RECOGNITION_BASIS} to {BENEFITED_UNIT}. {RECOGNIZED_GROUP} {NARRATIVE_VERB} themselves by",
    endingTemplate:
      "Their dedication to duty and {RECOGNITION_BASIS} are in great credit to themselves, {BENEFITED_UNIT}, and the 7th Cavalry Gaming Regiment.",
    criteria:
      "Superior performance of duties by a section-level unit or higher, or a sub-department or higher.",
    guidance:
      "Describe the group’s superior performance and explain the effect of its service or contributions on the benefited unit.",
    eligibility:
      "Each Battalion or Department may award one per six months. This is an Army Commendation Medal equivalent.",
    choices: {},
    imageUrl: "https://wiki.7cav.us/wiki/Special:Redirect/file/SUA.jpg",
    filePageUrl: "https://wiki.7cav.us/wiki/Awards_and_Decorations",
  },
]);

function validateServiceAwardDefinitions_() {
  const errors = [];
  const ids = new Set();
  const allowedComponents = new Set([
    "text",
    "organization",
    "select",
    "month",
    "year",
  ]);
  const organizationSources = new Set([
    "approvedOrganizations",
    "lineOrganizations",
    "companies",
    "supportDepartments",
  ]);
  const choiceSources = new Set(Object.keys(SERVICE_REFERENCE_CHOICES));
  const suggestionSources = new Set([
    "primaryBillets",
    "secondaryBillets",
    "allBillets",
  ]);
  const specialTemplateTokens = new Set([
    "FULL_NAME",
    "FULL_NAME_POSSESSIVE",
    "SERVICE_PERIOD",
    "SOLDIERS_OPENING_PHRASE",
    "SOLDIERS_CLOSING_PHRASE",
    "LEADERSHIP_CONTEXT_PHRASE",
    "LEADERSHIP_ASSIGNMENT",
    "CREDITED_ELEMENT_OR_OPERATIONS_AO",
  ]);

  SERVICE_AWARD_DEFINITIONS.forEach((award, index) => {
    const prefix = `Service definition ${index + 1}`;
    const fields = Array.isArray(award.fields) ? award.fields : [];
    const fieldKeys = new Set();

    [
      "id",
      "name",
      "abbreviation",
      "scope",
      "openingTemplate",
      "endingTemplate",
      "criteria",
      "guidance",
      "eligibility",
    ].forEach((key) => {
      if (!award[key]) errors.push(`${prefix} is missing ${key}.`);
    });

    if (ids.has(award.id))
      errors.push(`Duplicate Service award id: ${award.id}.`);
    ids.add(award.id);

    if (!["individual", "unit"].includes(award.scope)) {
      errors.push(`${award.id} has invalid scope.`);
    }

    if (
      !Number.isInteger(award.minimumSentences) ||
      award.minimumSentences < 1
    ) {
      errors.push(`${award.id} has invalid minimumSentences.`);
    }

    fields.forEach((field) => {
      const fieldPrefix = `${award.id} field ${field && field.key ? field.key : "(unnamed)"}`;

      if (!field || !field.key || !field.label || !field.component) {
        errors.push(`${award.id} contains an incomplete field definition.`);
        return;
      }

      if (fieldKeys.has(field.key)) {
        errors.push(`${award.id} contains duplicate field key ${field.key}.`);
      }
      fieldKeys.add(field.key);

      if (!allowedComponents.has(field.component)) {
        errors.push(
          `${fieldPrefix} has unsupported component ${field.component}.`,
        );
      }

      if (
        field.component === "organization" &&
        !organizationSources.has(field.optionsSource)
      ) {
        errors.push(`${fieldPrefix} has invalid organization options source.`);
      }

      if (
        field.component === "select" &&
        !choiceSources.has(field.optionsSource)
      ) {
        errors.push(`${fieldPrefix} has invalid choice options source.`);
      }

      if (
        field.suggestionsSource &&
        !suggestionSources.has(field.suggestionsSource)
      ) {
        errors.push(`${fieldPrefix} has invalid suggestion source.`);
      }

      if (field.visibleWhen) {
        if (!field.visibleWhen.field || !field.visibleWhen.equals) {
          errors.push(`${fieldPrefix} has an incomplete visibility condition.`);
        }
      }
    });

    fields.forEach((field) => {
      if (field.visibleWhen && !fieldKeys.has(field.visibleWhen.field)) {
        errors.push(
          `${award.id} field ${field.key} references missing visibility field ` +
            `${field.visibleWhen.field}.`,
        );
      }
    });

    const fieldTemplateTokens = new Set(
      fields.map((field) => serviceDefinitionTemplateKey_(field.key)),
    );
    const templateTokens = serviceDefinitionTemplateTokens_(
      `${award.openingTemplate || ""} ${award.endingTemplate || ""}`,
    );

    templateTokens.forEach((token) => {
      if (
        !fieldTemplateTokens.has(token) &&
        !specialTemplateTokens.has(token)
      ) {
        errors.push(
          `${award.id} contains unsupported template token ${token}.`,
        );
      }
    });

    const periodKeys = ["startMonth", "startYear", "endMonth", "endYear"];
    const periodFieldCount = periodKeys.filter((key) =>
      fieldKeys.has(key),
    ).length;

    if (periodFieldCount > 0 && periodFieldCount !== periodKeys.length) {
      errors.push(
        `${award.id} contains an incomplete service-period field set.`,
      );
    }

    if (
      templateTokens.includes("SERVICE_PERIOD") &&
      periodFieldCount !== periodKeys.length
    ) {
      errors.push(
        `${award.id} uses SERVICE_PERIOD without all service-period fields.`,
      );
    }
  });

  const individual = SERVICE_AWARD_DEFINITIONS.filter(
    (award) => award.scope === "individual",
  ).length;
  const unit = SERVICE_AWARD_DEFINITIONS.filter(
    (award) => award.scope === "unit",
  ).length;

  if (individual !== 13)
    errors.push(`Expected 13 Service Medals; found ${individual}.`);
  if (unit !== 2) errors.push(`Expected 2 Service Unit Awards; found ${unit}.`);

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      individual,
      unit,
      total: SERVICE_AWARD_DEFINITIONS.length,
    },
  };
}

function serviceDefinitionTemplateKey_(key) {
  return String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase();
}

function serviceDefinitionTemplateTokens_(value) {
  const tokens = new Set();
  const expression = /\{([A-Z_]+)\}/g;
  const text = String(value || "");
  let match;

  while ((match = expression.exec(text)) !== null) {
    tokens.add(match[1]);
  }

  return Array.from(tokens);
}

function buildOrganizationReference_(roster) {
  const groups = {
    battalions: new Map(),
    companies: new Map(),
    platoons: new Map(),
    sections: new Map(),
    supportDepartments: new Map(),
  };

  const formation = "(?:\\d+-7|ACD|DEVCOM)";
  const patterns = [
    [
      "sections",
      new RegExp(`\\b[A-Z0-9]+\\/\\d+\\/[A-Z]\\/${formation}\\b`, "g"),
    ],
    ["platoons", new RegExp(`\\b\\d+\\/[A-Z]\\/${formation}\\b`, "g")],
    ["companies", new RegExp(`\\b[A-Z]\\/${formation}\\b`, "g")],
    ["battalions", /\b\d+-7\b/g],
  ];

  (roster || []).forEach((person) => {
    getOrganizationBillets_(person).forEach((billet) => {
      const upperBillet = billet.toUpperCase();
      let containsLineOrganization = false;

      patterns.forEach(([key, pattern]) => {
        (upperBillet.match(pattern) || []).forEach((organization) => {
          containsLineOrganization = true;
          addOrganizationValue_(groups[key], organization);
        });
      });

      if (!containsLineOrganization && isSelectableSupportBillet_(billet)) {
        addOrganizationValue_(groups.supportDepartments, billet);
        addSupportDepartmentPrefix_(groups.supportDepartments, billet);
      }
    });
  });

  const supportDepartments = sortOrganizationValues_(groups.supportDepartments);
  const battalions = sortOrganizationValues_(groups.battalions);
  const companies = sortOrganizationValues_(groups.companies);
  const platoons = sortOrganizationValues_(groups.platoons);
  const sections = sortOrganizationValues_(groups.sections);
  const lineOrganizations = [
    ...battalions,
    ...companies,
    ...platoons,
    ...sections,
  ];
  const approvedOrganizations = mergeOrganizationValues_(
    supportDepartments,
    lineOrganizations,
  );

  return {
    supportDepartments,
    battalions,
    companies,
    platoons,
    sections,
    lineOrganizations,
    approvedOrganizations,
  };
}

function getOrganizationBillets_(person) {
  const source = Array.isArray(person && person.billets)
    ? person.billets
    : [
        person && person.primaryBillet,
        ...(Array.isArray(person && person.secondaryBillets)
          ? person.secondaryBillets
          : []),
      ];
  const seen = new Set();

  return source.reduce((billets, value) => {
    const clean = cleanOrganizationValue_(value);
    const normalized = clean.toUpperCase();
    if (!clean || seen.has(normalized)) return billets;
    seen.add(normalized);
    billets.push(clean);
    return billets;
  }, []);
}

function isSelectableSupportBillet_(billet) {
  const normalized = cleanOrganizationValue_(billet).toUpperCase();
  const excluded = new Set([
    "DISCHARGED",
    "DISHONORABLY DISCHARGED",
    "ELOA",
    "NEW RECRUIT",
    "RESERVIST",
    "RETIRED",
    "WALL OF HONOR",
  ]);

  return Boolean(normalized) && !excluded.has(normalized);
}

function addSupportDepartmentPrefix_(organizations, billet) {
  const match = cleanOrganizationValue_(billet).match(
    /^([A-Z][A-Z0-9]{1,11})\b/u,
  );
  if (match) addOrganizationValue_(organizations, match[1]);
}

function addOrganizationValue_(organizations, value) {
  const clean = cleanOrganizationValue_(value);
  const normalized = clean.toUpperCase();
  if (clean && !organizations.has(normalized))
    organizations.set(normalized, clean);
}

function sortOrganizationValues_(organizations) {
  return Array.from(organizations.values()).sort((left, right) =>
    left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

function mergeOrganizationValues_(...groups) {
  const organizations = new Map();
  groups.flat().forEach((value) => addOrganizationValue_(organizations, value));
  return sortOrganizationValues_(organizations);
}

function cleanOrganizationValue_(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/\s+/gu, " ")
    .trim();
}

export {
  STATIC_DATA_REVISION,
  APP_RULES,
  RANK_PRECEDENCE,
  COMBAT_ROLE_CHOICES,
  INDIVIDUAL_AWARDS,
  UNIT_AWARDS,
  SERVICE_REFERENCE_CHOICES,
  SERVICE_AWARD_DEFINITIONS,
  validateServiceAwardDefinitions_,
  buildOrganizationReference_,
};
