// Independent expectations from Service Medal Mapping - Post PR 219 Updated.docx.
// Exact prose is intentional: production builders must not supply their own oracle.
export const SERVICE_CATALOG_CASES = [
  {
    id: "outstanding-volunteer-service-medal",
    name: "Outstanding Volunteer Service Medal",
    abbreviation: "OVSM",
    ribbonUrl: "https://wiki.7cav.us/images/e/ec/OVSM.jpg",
    minimum: 2,
    fields: ["Non-Combat Department", "Narrative"],
    criteria:
      "Awarded to members of the 7th Cavalry that provide outstanding service to a non-combat department to which they are not assigned.",
    guidance:
      "Describe the recipient's contributions in a minimum of two professionally written sentences.",
    eligibility: [
      "The service must have been provided to a non-combat department.",
      "The recipient must not be assigned to the department receiving the service.",
    ],
  },
  {
    id: "humanitarian-service-medal",
    name: "Humanitarian Service Medal",
    abbreviation: "HSM",
    ribbonUrl: "https://wiki.7cav.us/images/3/3b/HSM.jpg",
    minimum: 2,
    fields: ["Narrative"],
    criteria:
      "Awarded to any 7th Cavalry member that helped or aided a fellow member financially, physically, mentally, emotionally, or through games and/or computer parts. Also can be awarded for anyone initiating a Garry Owen for a member in need.",
    guidance:
      "Describe how the recipient provided help or aid in a minimum of two professionally written sentences.",
    eligibility: [],
  },
  {
    id: "army-achievement-medal",
    name: "Army Achievement Medal",
    abbreviation: "AAM",
    ribbonUrl: "https://wiki.7cav.us/images/d/d6/AAM.jpg",
    minimum: 3,
    fields: ["Affected Area of the Cav", "Narrative"],
    criteria:
      "Awarded for contributions to any area of the Regiment, or being selected as Enlisted of the Quarter.",
    guidance:
      "Describe the recipient's contributions to the affected area of the Regiment in a minimum of three professionally written sentences.",
    eligibility: [],
  },
  {
    id: "joint-service-achievement-medal",
    name: "Joint Service Achievement Medal",
    abbreviation: "JSAM",
    ribbonUrl: "https://wiki.7cav.us/images/d/d0/JSAM.jpg",
    minimum: 3,
    fields: ["Unit", "Narrative"],
    criteria:
      "Awarded for attending multiple section practices to which they are not assigned while still consistently attending their own. Is recommended by the benefitted combat line unit commander.",
    guidance:
      "Describe the recipient's SP attendance/contributions in a minimum of three professionally written sentences.",
    eligibility: [
      "The recipient must have attended multiple section practices belonging to a unit to which they are not assigned.",
      "The recipient must still be consistently attending their own section practices.",
      "The recommendation is made by the benefitted combat line unit commander.",
    ],
  },
  {
    id: "army-commendation-medal",
    name: "Army Commendation Medal",
    abbreviation: "ARCOM",
    ribbonUrl: "https://wiki.7cav.us/images/d/dc/ARCOM.jpg",
    minimum: 3,
    fields: ["Unit", "Narrative"],
    criteria:
      "Awarded for distinguished contributions to any area of the Regiment, or being selected Enlisted or NCO of the Quarter.",
    guidance:
      "Describe the recipient's distinguished contributions in a minimum of three professionally written sentences.",
    eligibility: [],
  },
  {
    id: "joint-service-commendation-medal",
    name: "Joint Service Commendation Medal",
    abbreviation: "JSCM",
    ribbonUrl: "https://wiki.7cav.us/images/5/5f/JSCM.jpg",
    minimum: 3,
    fields: [
      "Recognition Wording",
      "Benefitted Company",
      "Assigned Company",
      "Narrative Opening",
      "Narrative",
    ],
    criteria:
      "Awarded to Troopers that provide significant contributions to a combat line unit to which they are not assigned, outside of section practice attendance. Is recommended by the benefitted combat line unit commander.",
    guidance:
      "Describe how the recipient demonstrated their actions/contributions in a minimum of three professionally written sentences.",
    eligibility: [
      "The recipient must not be assigned to the benefitted combat line unit.",
      "The qualifying contribution must be outside of section practice attendance.",
      "The recommendation is made by the benefitted combat line unit commander.",
    ],
  },
  {
    id: "meritorious-service-medal",
    name: "Meritorious Service Medal",
    abbreviation: "MSM",
    ribbonUrl: "https://wiki.7cav.us/images/b/b3/MSM.jpg",
    minimum: 3,
    fields: [
      "Service / Contributions",
      "Unit",
      "Narrative Opening",
      "Narrative",
    ],
    criteria:
      'Awarded to any member for exceptional service or contributions that significantly impact the health and morale of the unit in a positive manner, or being selected as Enlisted, NCO, or Officer of the Quarter. Can only be awarded once per person, in any six-month period. The six-month limit does not apply to being awarded "Of the Quarter" medals.',
    guidance:
      "Describe how the recipient demonstrated their meritorious service/contributions in a minimum of three professionally written sentences.",
    eligibility: [
      "The MSM may normally only be awarded once per person in any six-month period.",
    ],
  },
  {
    id: "defense-meritorious-service-medal",
    name: "Defense Meritorious Service Medal",
    abbreviation: "DMSM",
    ribbonUrl: "https://wiki.7cav.us/images/a/a5/DMSM.jpg",
    minimum: 3,
    fields: ["Unit", "Narrative"],
    criteria:
      "Awarded for a single, significant and distinguished meritorious contribution to any area of the Regiment. Can only be awarded once per person, in any six-month period.",
    guidance:
      "Describe how the recipient demonstrated their single, significant, and distinguished contribution in a minimum of three professionally written sentences.",
    eligibility: [
      "The medal may only be awarded once per person in any six-month period.",
    ],
  },
  {
    id: "soldiers-medal",
    name: "Soldier’s Medal",
    abbreviation: "SM",
    ribbonUrl: "https://wiki.7cav.us/images/9/93/SM.jpg",
    minimum: 3,
    fields: [
      "Service / Contributions",
      "Unit",
      "Narrative Opening",
      "Narrative",
    ],
    criteria:
      "Awarded for multiple, significant and distinguished meritorious contributions to any area of the Regiment requiring significant time investment. Can only be awarded once per person, in any six-month period.",
    guidance:
      "Describe the recipient's multiple meritorious service/contributions and significant time investment in a minimum of three professionally written sentences.",
    eligibility: [
      "The medal may only be awarded once per person in any six-month period.",
    ],
  },
  {
    id: "legion-of-merit",
    name: "Legion of Merit",
    abbreviation: "LOM",
    ribbonUrl: "https://wiki.7cav.us/images/e/e5/LOM.jpg",
    minimum: 3,
    fields: [
      "Role",
      "Secondary Billet",
      "Service Start",
      "Service End",
      "Narrative",
    ],
    criteria:
      "Awarded to members for exceptional service in a secondary billet over the course of one year, or being selected as Departmental Clerk of the Year. Can only be awarded once per person, per year. Cannot be awarded to secondary Lead billets or higher.",
    guidance:
      "Describe how the recipient demonstrated their exceptional service in a minimum of three professionally written sentences.",
    eligibility: [
      "The recipient must have provided exceptional service in a secondary billet for one year.",
      "The qualifying billet must be below the secondary Lead level.",
      "The medal can only be awarded once per person, per year.",
    ],
  },
  {
    id: "defense-superior-service-medal",
    name: "Defense Superior Service Medal",
    abbreviation: "DSSM",
    ribbonUrl: "https://wiki.7cav.us/images/b/b1/DSSM.jpg",
    minimum: 4,
    fields: ["Leadership Area", "Service Start", "Service End", "Narrative"],
    criteria:
      "Awarded to officers and non-commissioned officers for exceptionally meritorious leadership of a secondary billet over the course of one year, or being selected as Departmental Staff of the Year. Applies to sub-department Leads or higher only. Can also be awarded for meritorious service to the Regiment in leadership in operations over a year. Can only be awarded once per person, per year.",
    guidance:
      "Describe how the recipient demonstrated their exceptionally meritorious leadership in a minimum of four professionally written sentences.",
    eligibility: [
      "The recipient must be an officer or non-commissioned officer.",
      "Secondary billet: The recipient must have provided exceptionally meritorious leadership in a secondary billet for one year, at the sub-department Lead level or higher.",
      "Operations leadership: The recipient must have provided meritorious leadership in Regimental operations for one year.",
      "The medal can only be awarded once per person, per year.",
    ],
  },
  {
    id: "distinguished-service-medal",
    name: "Distinguished Service Medal",
    abbreviation: "DSM",
    ribbonUrl: "https://wiki.7cav.us/images/2/29/DSM.jpg",
    minimum: 4,
    fields: ["Role", "Element", "Service Start", "Service End", "Narrative"],
    criteria:
      "Awarded for distinguished service in a primary non-leadership billet, or being selected as Battalion or Regimental Enlisted of the Year. Can only be awarded once per person, per year. Cannot be awarded to primary leadership billets.",
    guidance:
      "Describe how the recipient demonstrated their distinguished service in a minimum of four professionally written sentences.",
    eligibility: [
      "The recipient must have provided distinguished service in a primary non-leadership billet.",
      "Service in a primary leadership billet does not qualify.",
      "The medal can only be awarded once per person, per year.",
    ],
  },
  {
    id: "defense-distinguished-service-medal",
    name: "Defense Distinguished Service Medal",
    abbreviation: "DDSM",
    ribbonUrl: "https://wiki.7cav.us/images/3/33/DDSM.jpg",
    minimum: 4,
    fields: ["Role", "Element", "Service Start", "Service End", "Narrative"],
    criteria:
      "Awarded to officers and non-commissioned officers for exceptionally meritorious leadership of a primary billet over the course of one year, or being selected as Battalion or Regimental Non-Commissioned Officer or Officer of the Year.",
    guidance:
      "Describe how the recipient demonstrated their distinguished service in a minimum of four professionally written sentences.",
    eligibility: [
      "The recipient must be an officer or non-commissioned officer.",
      "The recipient must have provided exceptionally meritorious leadership in a primary billet for one year.",
    ],
  },
];

export const SERVICE_CONTINUATION =
  "supporting the unit. Their work improved readiness. Their efforts strengthened the Regiment. Their service benefited every trooper.";

export const SERVICE_CHOICE_CASES = [
  {
    medalId: "joint-service-commendation-medal",
    fieldName: "recognitionType",
    defaultValue: "contributions",
    options: [
      { id: "contributions", label: "Contributions" },
      { id: "actions", label: "Custom Action Phrase" },
    ],
  },
  ...["meritorious-service-medal", "soldiers-medal"].map((medalId) => ({
    medalId,
    fieldName: "serviceType",
    defaultValue: "",
    options: [
      { id: "service", label: "Service" },
      { id: "contributions", label: "Contributions" },
    ],
  })),
  ...[
    "joint-service-commendation-medal",
    "meritorious-service-medal",
    "soldiers-medal",
  ].map((medalId) => ({
    medalId,
    fieldName: "narrativeOpening",
    defaultValue: "distinguished",
    options: [
      { id: "distinguished", label: "Distinguished" },
      { id: "contributed", label: "Contributed" },
    ],
  })),
  {
    medalId: "defense-superior-service-medal",
    fieldName: "leadershipArea",
    defaultValue: "",
    options: [
      { id: "secondary", label: "Secondary Billet" },
      { id: "operations", label: "Operations Leadership" },
    ],
  },
];

export const SERVICE_CITATION_CASES = [
  {
    name: "Outstanding Volunteer Service Medal",
    path: "department",
    inputs: { "Non-Combat Department": "S1 Uniforms" },
    opening: "For providing outstanding service to S1 Uniforms.",
    closing:
      "Corporal John Smith's dedication to duty and commitment is in great credit to themselves, S1 Uniforms and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Humanitarian Service Medal",
    path: "aid",
    inputs: {},
    opening: "For providing aid to a fellow trooper.",
    closing:
      "Corporal John Smith's dedication to duty and commitment is in great credit to themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Joint Service Achievement Medal",
    path: "unit",
    inputs: { Unit: "2/B/2-7" },
    opening: "For contributions to 2/B/2-7.",
    closing:
      "Corporal John Smith’s dedication to duty and commitment to the Regiment is in great credit to themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Army Commendation Medal",
    path: "Service",
    inputs: { Unit: "S2 Intelligence" },
    opening: "For distinguished contributions to S2 Intelligence.",
    closing:
      "Corporal John Smith’s dedication to duty and commitment to the Regiment is in great credit to themselves, S2 Intelligence and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Joint Service Commendation Medal",
    path: "Contributions",
    inputs: { "Benefitted Company": "B/2-7", "Assigned Company": "C/1-7" },
    opening: "For contributions to B/2-7 as a member of C/1-7.",
    closing:
      "Corporal John Smith's dedication to duty and contributions are great credit to themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Joint Service Commendation Medal",
    path: "Actions",
    choices: {
      "Recognition Wording": "Custom Action Phrase",
      "Narrative Opening": "Contributed",
    },
    inputs: {
      "Action Phrase": "outstanding support",
      "Benefitted Company": "B/2-7",
      "Assigned Company": "C/1-7",
    },
    narrativeVerb: "contributed",
    opening: "For outstanding support to B/2-7 as a member of C/1-7.",
    closing:
      "Corporal John Smith's dedication to duty and outstanding support are great credit to themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Meritorious Service Medal",
    path: "Service",
    choices: { "Service / Contributions": "Service" },
    inputs: { Unit: "S2 Intelligence" },
    opening: "For exceptionally meritorious service to S2 Intelligence.",
    closing:
      "Corporal John Smith's dedication to duty and exceptionally meritorious service are in great credit to themself and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Meritorious Service Medal",
    path: "Contributions",
    choices: {
      "Service / Contributions": "Contributions",
      "Narrative Opening": "Contributed",
    },
    inputs: { Unit: "S2 Intelligence" },
    narrativeVerb: "contributed",
    opening: "For exceptionally meritorious contributions to S2 Intelligence.",
    closing:
      "Corporal John Smith's dedication to duty and exceptionally meritorious contributions are in great credit to themself and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Defense Meritorious Service Medal",
    path: "single contribution",
    inputs: { Unit: "S2 Intelligence" },
    opening:
      "For a single, significant, and distinguished contribution to S2 Intelligence.",
    closing:
      "Corporal John Smith's distinguished contribution is in great credit to themselves, the S2 Intelligence, and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Soldier’s Medal",
    path: "Service",
    choices: {
      "Service / Contributions": "Service",
      "Narrative Opening": "Contributed",
    },
    inputs: { Unit: "S2 Intelligence" },
    narrativeVerb: "contributed",
    opening:
      "For multiple, significant and distinguished meritorious service to S2 Intelligence.",
    closing:
      "Corporal John Smith's dedication to duty and exceptionally meritorious service are in great credit to themself, the S2 Intelligence, and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Soldier’s Medal",
    path: "Contributions",
    choices: { "Service / Contributions": "Contributions" },
    inputs: { Unit: "S2 Intelligence" },
    opening:
      "For multiple, significant and distinguished meritorious contributions to S2 Intelligence.",
    closing:
      "Corporal John Smith's dedication to duty and exceptionally meritorious contributions are in great credit to themself, the S2 Intelligence, and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Legion of Merit",
    path: "secondary billet",
    inputs: {
      Role: "a clerk",
      "Secondary Billet": "S1 MILPACS",
      "Service Start": "2025-01",
      "Service End": "2026-01",
    },
    opening:
      "For exceptional service in a secondary billet while serving as a clerk in S1 MILPACS during January 2025 to January 2026.",
    closing:
      "Corporal John Smith's dedication to duty and commitment to their department is in great credit to themselves, the S1 MILPACS and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Defense Superior Service Medal",
    path: "secondary billet",
    choices: { "Leadership Area": "Secondary Billet" },
    inputs: {
      Role: "1IC",
      "Secondary Billet": "Military Police",
      "Service Start": "2025-01",
      "Service End": "2026-01",
    },
    opening:
      "For exceptionally meritorious leadership of a secondary billet while serving as 1IC, Military Police during January 2025 to January 2026.",
    closing:
      "Corporal John Smith's exceptionally meritorious leadership is in great credit to themselves, the Military Police, and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Defense Superior Service Medal",
    path: "operations leadership",
    choices: { "Leadership Area": "Operations Leadership" },
    inputs: {
      "Operations Leadership": "AO Lead, S3 HLL Operations",
      "Operations AO": "Hell Let Loose: Vietnam",
      "Service Start": "2025-01",
      "Service End": "2026-01",
    },
    opening:
      "For exceptionally meritorious leadership of operations while serving as AO Lead, S3 HLL Operations during January 2025 to January 2026.",
    closing:
      "Corporal John Smith's exceptionally meritorious leadership is in great credit to themselves, the Hell Let Loose: Vietnam, and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Distinguished Service Medal",
    path: "primary billet",
    inputs: {
      Role: "a trooper",
      Element: "A/2/B/3-7",
      "Service Start": "2025-01",
      "Service End": "2025-08",
    },
    opening:
      "For distinguished service in a primary billet while serving as a trooper in A/2/B/3-7 during January 2025 to August 2025.",
    closing:
      "Corporal John Smith's distinguished service and commitment is a great credit to themselves, A/2/B/3-7, and the 7th Cavalry Gaming Regiment.",
  },
  {
    name: "Defense Distinguished Service Medal",
    path: "primary leadership",
    inputs: {
      Role: "Company Commander",
      Element: "B/2-7",
      "Service Start": "2025-01",
      "Service End": "2026-01",
    },
    opening:
      "For exceptionally meritorious leadership of a primary billet while serving as Company Commander of B/2-7 during January 2025 to January 2026.",
    closing:
      "Corporal John Smith's exemplary leadership demonstrates their commitment to their troopers and reflects great credit upon themselves, B/2-7, and the 7th Cavalry Gaming Regiment.",
  },
];
