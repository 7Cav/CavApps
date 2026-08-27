// Military Occupational Specialty codes. Keys are the official 7cav S1 MOS
// name (UPPER_SNAKE); values are the exact code string used by the API and the
// rest of the app. Names sourced from the 7th Cavalry wiki "Approved MOS List":
// https://wiki.7cav.us/wiki/Military_Occupational_Specialty_(MOS)
//
// S2 has three entries by design: S2_OFFICER (35A), S2_NCO (35B) and
// S2_ENLISTED (35F). 35B is not on the wiki list (which only shows 35F for S2
// Enlisted) but is kept because the roster still uses it.
export const Mos = Object.freeze({
  // Aviation
  AVIATION_OFFICER: "15A",
  ROTARY_WING_AVIATOR_WARRANT_OFFICER: "153A",
  FIXED_WING_AVIATOR_WARRANT_OFFICER: "155A",
  JET_AIRCRAFT_PILOT: "155F",
  ENLISTED_ROTARY_CREWMAN: "15T",
  // Infantry
  INFANTRY_OFFICER: "11A",
  INFANTRYMAN: "11B",
  INDIRECT_FIRE_INFANTRYMAN: "11C",
  // Medical
  MEDICAL_OFFICER: "67A",
  COMBAT_MEDIC: "68W",
  // Armor / Cavalry
  ARMOR_CAVALRY_OFFICER: "19A",
  BRADLEY_CREWMEMBER: "19C",
  CAVALRY_SCOUT: "19D",
  ARMOR_CREWMAN: "19K",
  // Engineer
  COMBAT_ENGINEER_OFFICER: "12A",
  COMBAT_ENGINEER: "12B",
  // Field Artillery
  FIELD_ARTILLERY_OFFICER: "13A",
  CANNON_CREWMEMBER: "13B",
  // Command
  COMMAND_SERGEANT_MAJOR: "00Z",
  OFFICER_GENERALIST: "01A",
  // Staff — S1
  S1_OFFICER: "42B",
  S1_ENLISTED: "42A",
  // Staff — S2
  S2_OFFICER: "35A",
  S2_NCO: "35B",
  S2_ENLISTED: "35F",
  // Staff — S3
  S3_OFFICER: "57A",
  S3_ENLISTED: "57B",
  // Staff — S5
  S5_OFFICER: "46A",
  S5_ENLISTED: "46S",
  // Staff — S6
  S6_OFFICER: "25A",
  S6_ENLISTED: "25U",
  REGIMENTAL_TECHNICAL_AIDE: "255N",
  // Staff — S7
  S7_OFFICER: "47A",
  // Military Police
  MP_OFFICER: "31A",
  MP_ENLISTED: "31B",
  // JAG
  JAG_OFFICER: "27A",
  JAG_ENLISTED: "27D",
  // RRD
  RRD_OFFICER: "79A",
  RRD_ENLISTED: "79R",
  // RTC
  RTC_OFFICER: "79Z",
  RTC_ENLISTED: "79X",
  // WAG
  WAG_OFFICER: "26Z",
  WAG_ENLISTED: "26B",
  // Other commands / schools
  ODS_OFFICER: "47Q",
  NCOA_OFFICER: "47C",
  NCOA_ENLISTED: "47T",
  FCC_ANALYST: "49A",
  RDC_OFFICER: "50A",
  DEVCOM_LEAD: "51A",
  DEVCOM_SUPPORT_COORDINATOR: "51S",
});

// Semantic groupings used by the badge-eligibility logic in
// constants/badgeFamilies.js. Membership matches the post-#129 aviation
// behavior (155F counts as aviation, only 15T crews rather than pilots). Do not
// change membership without checking that logic.
export const MosGroup = Object.freeze({
  AVIATION: [
    Mos.ROTARY_WING_AVIATOR_WARRANT_OFFICER,
    Mos.FIXED_WING_AVIATOR_WARRANT_OFFICER,
    Mos.AVIATION_OFFICER,
    Mos.ENLISTED_ROTARY_CREWMAN,
    Mos.JET_AIRCRAFT_PILOT,
  ],
  MEDICAL: [Mos.COMBAT_MEDIC, Mos.MEDICAL_OFFICER],
  // Aviation MOSs that crew aircraft rather than pilot them.
  ROTARY_CREW: [Mos.ENLISTED_ROTARY_CREWMAN],
});
