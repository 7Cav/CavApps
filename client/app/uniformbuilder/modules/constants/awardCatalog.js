// Extensions are explicit so this module resolves under plain Node as well as
// the Next bundler: generateAwardSprites.js imports it directly to read award
// placement, and Node's ESM resolver does not guess extensions.
import { AwardType } from "./awardTypes.js";
import { AwardAttachmentType } from "./awardAttachmentTypes.js";
import { BadgeFamily } from "./badgeFamilies.js";
import { BadgeImages } from "./badgeImages.js";

// The full award catalog: name + per-award metadata. AwardRegistry loops this
// in order to populate its Map, so KEEP THE ORDER STABLE — Map iteration order
// is insertion order and downstream code may rely on it. `name` is the Map key;
// every other field becomes the stored detail object verbatim.
export const AWARD_CATALOG = [
  //____ MAINLINE MEDALS AND RIBBONS ____
  {
    name: `7th Cavalry Lifetime Dedication Award`,
    awardPriority: 0,
    medalPriority: 0,
    awardType: AwardType.Medal,
  },
  {
    name: `James "Krazee" Foster Lifetime Achievement Medal`,
    awardPriority: 1,
    medalPriority: 1,
    awardType: AwardType.Medal,
  },
  {
    name: `Ronnie "Coldblud" Bussey Lifetime Achievement Medal`,
    awardPriority: 2,
    medalPriority: 2,
    awardType: AwardType.Medal,
  },
  {
    name: "Army Distinguished Service Cross",
    awardPriority: 3,
    medalPriority: 3,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Defense Distinguished Service Medal",
    awardPriority: 4,
    medalPriority: 4,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Army Distinguished Service Medal",
    awardPriority: 5,
    medalPriority: 5,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Silver Star",
    awardPriority: 6,
    medalPriority: 6,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Defense Superior Service Medal",
    awardPriority: 7,
    medalPriority: 7,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Legion of Merit",
    awardPriority: 8,
    medalPriority: 8,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Distinguished Flying Cross",
    awardPriority: 9,
    medalPriority: 9,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Soldiers Medal",
    awardPriority: 10,
    medalPriority: 10,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Bronze Star",
    awardPriority: 11,
    medalPriority: 11,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.MedalWithValor,
  },
  {
    name: "Purple Heart",
    awardPriority: 12,
    medalPriority: 12,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Defense Meritorious Service Medal",
    awardPriority: 13,
    medalPriority: 13,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Meritorious Service Medal",
    awardPriority: 14,
    medalPriority: 14,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Air Medal",
    awardPriority: 15,
    medalPriority: 15,
    awardAttachmentType: AwardAttachmentType.NCO_NUMS,
    awardType: AwardType.Medal,
  },
  {
    name: "Joint Service Commendation Medal",
    awardPriority: 16,
    medalPriority: 16,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Army Commendation Medal",
    awardPriority: 17,
    medalPriority: 17,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.MedalWithValor,
  },
  {
    name: "Joint Service Achievement Medal",
    awardPriority: 18,
    medalPriority: 18,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Army Achievement Medal",
    awardPriority: 19,
    medalPriority: 19,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Prisoner of War Medal",
    awardPriority: 20,
    medalPriority: 20,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },
  {
    name: "Army Good Conduct Medal",
    awardPriority: 21,
    medalPriority: 21,
    awardAttachmentType: AwardAttachmentType.GC_NOTCHES,
    awardType: AwardType.Medal,
  },
  {
    name: "Armed Forces Expeditionary Medal",
    awardPriority: 22,
    medalPriority: 22,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "Afghanistan Campaign Medal",
    awardPriority: 23,
    medalPriority: 23,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "Iraq Campaign Medal",
    awardPriority: 24,
    medalPriority: 24,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "Global War on Terrorism Expeditionary Medal",
    awardPriority: 25,
    medalPriority: 25,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "National Defense Service Medal",
    awardPriority: 26,
    medalPriority: 26,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "Armed Forces Service Medal",
    awardPriority: 27,
    medalPriority: 27,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "Humanitarian Service Medal",
    awardPriority: 28,
    medalPriority: 28,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "Donation Ribbon",
    awardPriority: 29,
    awardAttachmentType: AwardAttachmentType.STARS_DONATION,
    awardType: AwardType.RibbonDonationLogic,
  }, // Requires Special Case
  {
    name: "7th Cavalry Server Upgrade Award",
    awardPriority: 30,
    medalPriority: 29,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.MedalTiered,
  }, // Fuck you, whoever put this into SOP
  {
    name: "StackUp Donation Medal",
    awardPriority: 31,
    medalPriority: 30,
    awardAttachmentType: AwardAttachmentType.GC_NOTCHES,
    awardType: AwardType.MedalTiered,
  }, // and again
  {
    name: "Outstanding Volunteer Service Medal",
    awardPriority: 32,
    medalPriority: 31,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "NCO Professional Development Ribbon",
    awardPriority: 33,
    awardAttachmentType: AwardAttachmentType.NCO_NUMS,
    awardType: AwardType.Ribbon,
  },
  {
    name: "Honor Graduate Ribbon",
    awardPriority: 34,
    awardType: AwardType.Ribbon,
  },
  {
    name: "Army Service Ribbon",
    awardPriority: 35,
    awardType: AwardType.Ribbon,
  },
  {
    name: "Cavalry Centurion Medal",
    awardPriority: 36,
    medalPriority: 32,
    awardAttachmentType: AwardAttachmentType.SILVER_STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "United Nations Service Medal",
    awardPriority: 37,
    medalPriority: 33,
    awardAttachmentType: AwardAttachmentType.STARS,
    awardType: AwardType.Medal,
  },
  {
    name: "Overseas Service Ribbon",
    awardPriority: 38,
    medalPriority: 34,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "Ready or Not Service Ribbon",
    awardPriority: 39,
    medalPriority: 35,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "DCS World Service Ribbon",
    awardPriority: 40,
    medalPriority: 36,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "Squad Service Ribbon",
    awardPriority: 41,
    medalPriority: 37,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "WWII Service Ribbon",
    awardPriority: 42,
    medalPriority: 38,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "Hell Let Loose Service Ribbon",
    awardPriority: 43,
    medalPriority: 39,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "Hell Let Loose Console Service Ribbon",
    awardPriority: 44,
    medalPriority: 40,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "Battlefield 6 Service Ribbon",
    awardPriority: 45,
    medalPriority: 41,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "Foxhole Service Ribbon",
    awardPriority: 46,
    medalPriority: 42,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS_SERVICE,
    awardType: AwardType.Medal,
  },
  {
    name: "Recruiting Ribbon",
    awardPriority: 47,
    awardAttachmentType: AwardAttachmentType.STARS_DONATION,
    awardType: AwardType.RibbonDonationLogic,
  }, // May Also require Special Case
  {
    name: "D-Day Commemorative Medal",
    awardPriority: 48,
    medalPriority: 43,
    awardType: AwardType.Medal,
  },
  {
    name: "Ranger Selection Ribbon",
    awardPriority: 49,
    awardType: AwardType.Ribbon,
  },
  {
    name: "Sniper Ribbon",
    awardPriority: 50,
    medalPriority: 44,
    awardType: AwardType.Medal,
  },
  {
    name: "Basic Assault Course Ribbon",
    awardPriority: 51,
    awardType: AwardType.Ribbon,
  },

  // ___ DISCONTINUED RIBBONS/MEDALS WITHOUT PRECIDENCE ___
  // These ones are a bit of an unknown precidence wise. Indeed we have some discon awards above, however precidence is known
  // Anything here is shown as is, and there is no inherent precicence for these.
  {
    name: "Cadre Course Ribbon",
    awardPriority: 52,
    awardType: AwardType.Ribbon,
  },
  {
    name: "Womens Army Corp Service Medal",
    awardPriority: 53,
    medalPriority: 45,
    awardType: AwardType.Medal,
  },
  {
    name: "D Day Participation Ribbon",
    awardPriority: 54,
    awardType: AwardType.Ribbon,
  },
  {
    name: "European/African/Middle Eastern Campaign Medal",
    awardPriority: 55,
    medalPriority: 46,
    awardAttachmentType: AwardAttachmentType.OAK_CLUSTERS,
    awardType: AwardType.Medal,
  },

  //____ UNIT CITATIONS ____
  {
    name: "Army & Air Force Presidential Unit Citation",
    awardPriority: 0,
    awardAttachmentType: AwardAttachmentType.UNIT_CITATION_CLUSTERS,
    awardType: AwardType.UnitCitation,
  },
  {
    name: "Army Valorous Unit Citation",
    awardPriority: 1,
    awardAttachmentType: AwardAttachmentType.UNIT_CITATION_CLUSTERS,
    awardType: AwardType.UnitCitation,
  },
  {
    name: "Joint Meritorious Unit Citation",
    awardPriority: 2,
    awardAttachmentType: AwardAttachmentType.UNIT_CITATION_CLUSTERS,
    awardType: AwardType.UnitCitation,
  },
  {
    name: "Army Meritorious Unit Citation",
    awardPriority: 3,
    awardAttachmentType: AwardAttachmentType.UNIT_CITATION_CLUSTERS,
    awardType: AwardType.UnitCitation,
  },
  {
    name: "Army Superior Unit Citation",
    awardPriority: 4,
    awardAttachmentType: AwardAttachmentType.UNIT_CITATION_CLUSTERS,
    awardType: AwardType.UnitCitation,
  },
  {
    name: "7th Cavalry Black Ops Unit Citation",
    awardPriority: 5,
    awardAttachmentType: AwardAttachmentType.UNIT_CITATION_S_STARS,
    awardType: AwardType.UnitCitation,
  },

  // ____ COMBAT BADGES ____
  {
    name: "Flight Medic Badge",
    awardPriority: 6,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.flightMedicBadge,
    badgeFamily: BadgeFamily.FLIGHT_MEDIC,
  }, // (3/1/b/1-7) (4/1/b/1-7)
  {
    name: "Master Army Aviator Badge",
    awardPriority: 11,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.masterAviator,
    badgeFamily: BadgeFamily.AVIATOR,
  }, // (A/1-7) (A/ACD)
  {
    name: "Senior Army Aviator Badge",
    awardPriority: 10,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.seniorAviator,
    badgeFamily: BadgeFamily.AVIATOR,
  },
  {
    name: "Army Aviator Badge",
    awardPriority: 9,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.aviator,
    badgeFamily: BadgeFamily.AVIATOR,
  },
  {
    name: "Aircraft Master Crewman Badge",
    awardPriority: 8,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.masterAircrew,
    badgeFamily: BadgeFamily.AIRCREW,
  }, // (A/1-7) (A/ACD)
  {
    name: "Aircraft Senior Crewman Badge",
    awardPriority: 7,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.seniorAircrew,
    badgeFamily: BadgeFamily.AIRCREW,
  },
  {
    name: "Aircraft Crewman Badge",
    awardPriority: 6,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.aircrew,
    badgeFamily: BadgeFamily.AIRCREW,
  },
  {
    name: "Combat Infantry Badge 4th Award",
    awardPriority: 5,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.combatInfantryFourth,
    badgeFamily: BadgeFamily.INFANTRY,
  },
  {
    name: "Combat Infantry Badge 3rd Award",
    awardPriority: 4,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.combatInfantryThird,
    badgeFamily: BadgeFamily.INFANTRY,
  },
  {
    name: "Combat Infantry Badge 2nd Award",
    awardPriority: 3,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.combatInfantrySecond,
    badgeFamily: BadgeFamily.INFANTRY,
  },
  {
    name: "Combat Infantry Badge",
    awardPriority: 2,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.combatInfantry,
    badgeFamily: BadgeFamily.INFANTRY,
  },
  {
    name: "Expert Infantry Badge",
    awardPriority: 1,
    awardType: AwardType.BadgeCombat,
    badgeImage: BadgeImages.expertInfantry,
    badgeFamily: BadgeFamily.INFANTRY,
  }, // et. al.

  //____ WEAPON QUALS ____
  { name: "Rifle Expert", awardTag: "rifle", awardType: AwardType.WeaponQual },
  {
    name: "Rifle Sharpshooter",
    awardTag: "rifle",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Rifle Marksman",
    awardTag: "rifle",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Grenade Expert",
    awardTag: "grenade",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Grenade Sharpshooter",
    awardTag: "grenade",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Grenade Marksman",
    awardTag: "grenade",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Pistol Expert",
    awardTag: "pistol",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Pistol Sharpshooter",
    awardTag: "pistol",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Pistol Marksman",
    awardTag: "pistol",
    awardType: AwardType.WeaponQual,
  },
  { name: "M-203 Expert", awardTag: "m203", awardType: AwardType.WeaponQual },
  {
    name: "M-203 Sharpshooter",
    awardTag: "m203",
    awardType: AwardType.WeaponQual,
  },
  { name: "M-203 Marksman", awardTag: "m203", awardType: AwardType.WeaponQual },
  {
    name: "Machine Gun Expert",
    awardTag: "machineGun",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Machine Gun Sharpshooter",
    awardTag: "machineGun",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Machine Gun Marksman",
    awardTag: "machineGun",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Recoilless Rifle Expert",
    awardTag: "recoilless",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Recoilless Rifle Sharpshooter",
    awardTag: "recoilless",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Recoilless Rifle Marksman",
    awardTag: "recoilless",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Aeroweapons Expert",
    awardTag: "aeroweapons",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Aeroweapons Sharpshooter",
    awardTag: "aeroweapons",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Aeroweapons Marksman",
    awardTag: "aeroweapons",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Hydra-70 Expert",
    awardTag: "hydra70",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Hydra-70 Sharpshooter",
    awardTag: "hydra70",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Hydra-70 Marksman",
    awardTag: "hydra70",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Tank Weapons Expert",
    awardTag: "tankWeapons",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Tank Weapons Sharpshooter",
    awardTag: "tankWeapons",
    awardType: AwardType.WeaponQual,
  },
  {
    name: "Tank Weapons Marksman",
    awardTag: "tankWeapons",
    awardType: AwardType.WeaponQual,
  },

  //____ TABS ____
  { name: "Special Forces Tab", awardPriority: 0, awardType: AwardType.Tab },
  { name: "Ranger Tab", awardPriority: 1, awardType: AwardType.Tab },
  { name: "Sapper Tab", awardPriority: 2, awardType: AwardType.Tab },
  {
    name: "Long-Range Reconnaissance Patrol Tab",
    awardPriority: 3,
    awardType: AwardType.Tab,
  },
];
