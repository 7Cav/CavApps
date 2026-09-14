import GetCoordArray from "./getCoordArray";
import GetCitationCoordArray from "./getCitationCoordArray";
import GetCombatBadgeCoords from "./getCombatBadgeCoords";
import GetYearsInServiceCoordArray from "./getYearsInServiceCoordArray";
import GetTabCoordArray from "./getTabCoordArray";
import { Mos } from "./constants";

export default function GetUserInfo(
  dataActive,
  ribbonCount,
  citationCount,
  yearsInService,
  tabCount,
) {
  const returnObject = {
    nameTag: generateNameTag(dataActive.user.username),
    rank: dataActive.rank.rankShort,
    rankId: dataActive.rank.rankId,
    rankGrade: getRankGrade(dataActive.rank.rankId),
    ribbonCount: ribbonCount,
    unitCitationCount: citationCount,
    yearsInService: yearsInService,
    tabCount: tabCount,
    yearsInServiceCoordArray: [],
    ribbonCoordArray: [],
    unitCitationCoordArray: [],
    combatBadgeCoords: [],
    tabCoordArray: [],
    mosCheck: checkMos(dataActive.mos, getRankGrade(dataActive.rank.rankId)),
    shoulderCord: setShoulderCord(dataActive.mos),
    neckPins: setNeckPins(dataActive.mos),
  };
  returnObject.ribbonCoordArray = GetCoordArray(ribbonCount);
  returnObject.unitCitationCoordArray = GetCitationCoordArray(citationCount);
  returnObject.combatBadgeCoords = GetCombatBadgeCoords(ribbonCount);
  returnObject.yearsInServiceCoordArray = GetYearsInServiceCoordArray(
    yearsInService,
    getRankGrade(dataActive.rank.rankId),
  );
  returnObject.tabCoordArray = GetTabCoordArray(tabCount);

  return returnObject;
}

function generateNameTag(username) {
  const periodIndex = username.indexOf(".");
  const nameTag = username.substring(0, periodIndex);
  return nameTag.toUpperCase();
}

function getRankGrade(rankId) {
  switch (rankId) {
    case "1":
      return "O11";
    case "2":
      return "O10";
    case "3":
      return "O9";
    case "4":
      return "O8";
    case "5":
      return "O7";
    case "6":
      return "O6";
    case "7":
      return "O5";
    case "8":
      return "O4";
    case "9":
      return "O3";
    case "10":
      return "O2";
    case "11":
      return "O1";
    case "12":
      return "E11";
    case "13":
      return "E10";
    case "14":
      return "E9";
    case "15":
      return "E8";
    case "16":
      return "E7";
    case "17":
      return "E6";
    case "18":
      return "E5";
    case "19":
      return "E4";
    case "20":
      return "E3";
    case "21":
      return "E2";
    case "22":
      return "E1";
    case "26":
      return "W5";
    case "27":
      return "W4";
    case "28":
      return "W3";
    case "29":
      return "W2";
    case "30":
      return "W1";
    default:
      return "E0";
  }
}

function setShoulderCord(mos) {
  switch (mos) {
    case Mos.COMBAT_MEDIC:
    case Mos.MEDICAL_OFFICER:
      return "Medical";
    case Mos.INFANTRYMAN:
    case Mos.INFANTRY_OFFICER:
    case Mos.INDIRECT_FIRE_INFANTRYMAN:
      return "Infantry";
    case Mos.FIELD_ARTILLERY_OFFICER:
    case Mos.CANNON_CREWMEMBER:
      return "Artillery";
    case Mos.COMBAT_ENGINEER_OFFICER:
    case Mos.COMBAT_ENGINEER:
      return "Engineer";
    case Mos.OFFICER_GENERALIST:
      return "Aide";
    case Mos.MP_OFFICER:
    case Mos.MP_ENLISTED:
      return "MP";
    case Mos.ARMOR_CREWMAN:
    case Mos.ARMOR_CAVALRY_OFFICER:
    case Mos.BRADLEY_CREWMEMBER:
    case Mos.CAVALRY_SCOUT:
      return "Armor";
    case Mos.LOGISTICS_OFFICER:
    case Mos.LOGISTICS_ENLISTED:
      return "Logistics";
    default:
      return false;
  }
}

function setNeckPins(mos) {
  switch (mos) {
    case Mos.ROTARY_WING_AVIATOR_WARRANT_OFFICER:
    case Mos.FIXED_WING_AVIATOR_WARRANT_OFFICER:
    case Mos.AVIATION_OFFICER:
      return "AviationOfficer";
    case Mos.ENLISTED_ROTARY_CREWMAN:
    case Mos.JET_AIRCRAFT_PILOT:
      return "AviationNCO";
    case Mos.FIELD_ARTILLERY_OFFICER:
      return "ArtilleryOfficer";
    case Mos.CANNON_CREWMEMBER:
      return "ArtilleryNCO";
    case Mos.MEDICAL_OFFICER:
      return "MedicalOfficer";
    case Mos.COMBAT_MEDIC:
      return "MedicalNCO";
    case Mos.COMBAT_ENGINEER_OFFICER:
      return "EngineerOfficer";
    case Mos.COMBAT_ENGINEER:
      return "EngineerNCO";
    case Mos.OFFICER_GENERALIST:
      return "Aide";
    case Mos.COMMAND_SERGEANT_MAJOR:
      return "CSM";
    case Mos.REGIMENTAL_TECHNICAL_AIDE:
    case Mos.S6_OFFICER:
      return "IMOOfficer";
    case Mos.S6_ENLISTED:
      return "IMONCO";
    case Mos.S1_OFFICER:
    case Mos.S3_OFFICER:
    case Mos.S5_OFFICER:
      return "S1S3S5";
    case Mos.S2_NCO:
      return "S2NCO";
    case Mos.S2_OFFICER:
      return "S2Officer";
    case Mos.MP_OFFICER:
      return "MPOfficer";
    case Mos.MP_ENLISTED:
      return "MPNCO";
    case Mos.ARMOR_CAVALRY_OFFICER:
      return "ArmorOfficer";
    case Mos.ARMOR_CREWMAN:
    case Mos.BRADLEY_CREWMEMBER:
    case Mos.CAVALRY_SCOUT:
      return "ArmorNCO";
    case Mos.JAG_OFFICER:
      return "JAGOfficer";
    case Mos.JAG_ENLISTED:
      return "JAGNCO";
    case Mos.DEVCOM_LEAD:
    case Mos.RDC_OFFICER:
      return "RDCOfficer";
    case Mos.INFANTRY_OFFICER:
    case Mos.FIELD_ARTILLERY_OFFICER:
    case Mos.S7_OFFICER:
    case Mos.RRD_OFFICER:
    case Mos.RTC_OFFICER:
    case Mos.WAG_OFFICER:
    case Mos.ODS_OFFICER:
    case Mos.NCOA_OFFICER:
      return "InfantryOfficer";
    case Mos.INFANTRYMAN:
    case Mos.INDIRECT_FIRE_INFANTRYMAN:
    case Mos.S1_ENLISTED:
    case Mos.S3_ENLISTED:
    case Mos.S5_ENLISTED:
    case Mos.RRD_ENLISTED:
    case Mos.RTC_ENLISTED:
    case Mos.DEVCOM_SUPPORT_COORDINATOR:
    case Mos.FCC_ANALYST:
    case Mos.WAG_ENLISTED:
    case Mos.NCOA_ENLISTED:
      return "InfantryNCO";
    case Mos.LOGISTICS_OFFICER:
      return "LogisticsOfficer";
    case Mos.LOGISTICS_ENLISTED:
      return "LogisticsNCO";
    default:
      return false;
  }
}

function checkMos(mos, rankGrade) {
  const officerRegex =
    /\b(?!(?:00Z|11C|42A|49A|14B|12B|35B|31B|11B|57B|26B|13B|19C))[0-9]+[A,B,Z,Q,C,N]/gim;

  if (rankGrade.includes("W") || rankGrade.includes("O")) {
    if (mos.match(officerRegex) == null && mos) {
      return [
        "Failed",
        `MOS ${mos} is an Enlisted/NCO MOS, despite user being of Officer/WO rank. Inform your lead if you see this error.`,
      ];
    }
  }

  if (rankGrade.includes("E")) {
    if (mos.match(officerRegex) != null && mos) {
      return [
        "Failed",
        `MOS ${mos} is an Officer/WO MOS, despite user being of Enlisted/NCO rank. Inform your lead if you see this error.`,
      ];
    }
  }

  return null;
}
