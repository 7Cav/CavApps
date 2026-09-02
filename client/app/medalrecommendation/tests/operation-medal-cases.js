import { OPERATION_MEDALS } from "../lib/medal-definitions.js";

export const OPERATION_MEDAL_CASES = [
  {
    id: "army-commendation-medal",
    name: "Army Commendation Medal",
    recommendationPrompt: "Create an Army Commendation Medal recommendation.",
    criteriaPattern:
      /awarded for skillful or heroic actions over an entire operation/i,
    guidancePattern:
      /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    eligibilityNotes: [],
    showsActionCharacter: true,
    showsScope: false,
    elementLabel: "Combat Element",
    elementPlaceholder: "a rifleman, the Allied commander, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/d/dc/ARCOM.jpg",
    worksheetValues: {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
    },
  },
  {
    id: "army-commendation-medal-with-valor",
    name: "Army Commendation Medal With Valor",
    recommendationPrompt:
      "Create an Army Commendation Medal With Valor recommendation.",
    criteriaPattern: /awarded for a single act of heroism or skill under fire/i,
    guidancePattern:
      /describe how the trooper demonstrated heroism and skill in a single act during the operation/i,
    eligibilityNotes: [],
    showsActionCharacter: false,
    showsScope: false,
    elementLabel: "Combat Element",
    elementPlaceholder: "a rifleman, the Allied commander, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/0/0f/ARCOMV.jpg",
    worksheetValues: {
      combatElement: "rifleman",
    },
  },
  {
    id: "air-medal",
    name: "Air Medal",
    recommendationPrompt: "Create an Air Medal recommendation.",
    criteriaPattern: /awarded to any member of an aircrew, including pilots/i,
    guidancePattern:
      /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    eligibilityNotes: [
      "The recipient must be a member of an aircrew. Pilots are eligible.",
    ],
    showsActionCharacter: true,
    showsScope: false,
    elementLabel: "Aircrew Combat Element",
    elementPlaceholder: "a door gunner, an F-16 pilot, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/3/3f/AM.jpg",
    worksheetValues: {
      actionCharacter: "Skillful",
      aircrewCombatElement: "rotary-wing pilot",
    },
  },
  {
    id: "purple-heart",
    name: "Purple Heart",
    recommendationPrompt: "Create a Purple Heart recommendation.",
    criteriaPattern:
      /awarded for a single or multiple heroic actions while under enemy fire/i,
    guidancePattern:
      /describe how the trooper's one or more heroic actions while under fire resulted in their sacrifice and death/i,
    eligibilityNotes: [
      "The recipient must have been killed while undertaking the combat actions being cited.",
    ],
    showsActionCharacter: false,
    showsScope: true,
    elementLabel: "Combat Element",
    elementPlaceholder: "a rifleman, the Allied commander, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/b/b5/PH.jpg",
    worksheetValues: {
      scope: "Single",
      combatElement: "rifleman",
    },
  },
  {
    id: "bronze-star-medal",
    name: "Bronze Star Medal",
    recommendationPrompt: "Create a Bronze Star Medal recommendation.",
    criteriaPattern:
      /awarded for skillful or heroic actions over the entire operation/i,
    guidancePattern:
      /describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation/i,
    eligibilityNotes: [],
    showsActionCharacter: true,
    showsScope: false,
    elementLabel: "Combat Element",
    elementPlaceholder: "a rifleman, the Allied commander, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/5/5e/BS.jpg",
    worksheetValues: {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
    },
  },
  {
    id: "bronze-star-medal-with-valor",
    name: "Bronze Star Medal With Valor",
    recommendationPrompt:
      "Create a Bronze Star Medal With Valor recommendation.",
    criteriaPattern:
      /awarded for a single act demonstrating extraordinary heroism and skill while under enemy fire/i,
    guidancePattern:
      /describe how the trooper demonstrated extraordinary heroism in a single act during the operation/i,
    eligibilityNotes: [
      "The recipient must have survived the cited action to be eligible for this award.",
    ],
    showsActionCharacter: false,
    showsScope: false,
    elementLabel: "Combat Element",
    elementPlaceholder: "a rifleman, the Allied commander, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/8/88/BSV.jpg",
    worksheetValues: {
      combatElement: "rifleman",
    },
  },
  {
    id: "distinguished-flying-cross",
    name: "Distinguished Flying Cross",
    recommendationPrompt: "Create a Distinguished Flying Cross recommendation.",
    criteriaPattern:
      /awarded to pilots for a single act demonstrating extraordinary heroism and skill while under enemy fire/i,
    guidancePattern:
      /describe how the trooper demonstrated extraordinary heroism in a single act during the operation/i,
    eligibilityNotes: [
      "The recipient must be a pilot.",
      "Air crew who are not pilots are not eligible.",
      "The pilot must possess their flight wings.",
      "The recipient must have survived the cited action.",
    ],
    showsActionCharacter: false,
    showsScope: false,
    elementLabel: "Airframe",
    elementPlaceholder: "an F/A-18, a Rotary-Wing, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/7/74/DFC.jpg",
    worksheetValues: {
      airframe: "an F/A-18",
    },
  },
  {
    id: "silver-star",
    name: "Silver Star",
    recommendationPrompt: "Create a Silver Star recommendation.",
    criteriaPattern:
      /awarded for actions demonstrating extraordinary heroism, skill, and leadership under fire/i,
    guidancePattern:
      /describe how the trooper demonstrated extraordinary heroism and skill or leadership under fire in the operation/i,
    eligibilityNotes: [
      "The recipient must have been serving in an official leadership position.",
      "The recipient must have survived the cited action.",
    ],
    showsActionCharacter: false,
    showsScope: false,
    elementLabel: "Leadership Element",
    elementPlaceholder: "a platoon leader, commander, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/8/8f/SS.jpg",
    worksheetValues: {
      leadershipElement: "a platoon",
    },
  },
  {
    id: "distinguished-service-cross",
    name: "Distinguished Service Cross",
    recommendationPrompt:
      "Create a Distinguished Service Cross recommendation.",
    criteriaPattern:
      /awarded for actions, or a single act, demonstrating extraordinary heroism and skill under fire/i,
    guidancePattern:
      /describe how the trooper demonstrated extraordinary heroism and skill or leadership under fire in the operation/i,
    eligibilityNotes: [
      "The recipient must have survived the cited action.",
      "Against a live enemy (non-Cav) force or in an internal player-versus-player match, the cited actions must have been unquestionably responsible for the successful outcome of the mission.",
      "Against a computer opponent, the recipient must have been serving as Officer-In-Command (OIC) of the official operation and their actions must have been unquestionably responsible for the successful outcome of the mission.",
    ],
    showsActionCharacter: false,
    showsScope: false,
    elementLabel: "Combat Element",
    elementPlaceholder: "a rifleman, the Allied commander, etc.",
    ribbonUrl: "https://wiki.7cav.us/images/d/d3/DSC.jpg",
    worksheetValues: {
      combatElement: "rifleman",
    },
  },
];

export function getOperationMedal(name) {
  return OPERATION_MEDALS.find((medal) => medal.name === name);
}
