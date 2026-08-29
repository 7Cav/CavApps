export const OPERATION_MEDALS = [
  {
    id: "army-commendation-medal",
    name: "Army Commendation Medal",
    abbreviation: "ARCOM",
    ribbonUrl: "https://wiki.7cav.us/images/d/dc/ARCOM.jpg",

    criteria:
      "Awarded for skillful or heroic actions over an entire operation where there was no one specific instance of heroism or skill.",

    narrativeGuidance:
      "Describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation in a minimum of three professionally written sentences containing the explanation leading up to the events, the events themselves, and the outcome of the events.",

    minimumNarrativeSentences: 3,

    fields: {
      actionCharacter: true,
      scope: false,
      combatElementLabel: "Combat Element",
      combatElementPlaceholder: "a rifleman, the Allied commander, etc.",
    },

    actionCharacterOptions: [
      {
        value: "skillful",
        label: "Skillful",
      },
      {
        value: "heroic",
        label: "Heroic",
      },
    ],

    scopeOptions: [],

    eligibilityNotes: [],

    buildOpening({
      actionCharacter,
      combatElement,
      operationTitle,
      location,
      date,
    }) {
      return (
        `For ${actionCharacter} actions over an entire operation while serving as ` +
        `${combatElement} in the 7th Cavalry Regiment during combat in ` +
        `Operation ${operationTitle} near ${location} on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName, actionCharacter }) {
      return (
        `${recipientRank} ${recipientCitationName}'s ${actionCharacter} actions ` +
        "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },

  {
    id: "army-commendation-medal-with-valor",
    name: "Army Commendation Medal With Valor",
    abbreviation: "ARCOMV",
    ribbonUrl: "https://wiki.7cav.us/images/0/0f/ARCOMV.jpg",

    criteria: "Awarded for a single act of heroism or skill under fire.",

    narrativeGuidance:
      "Describe how the trooper demonstrated heroism and skill in a single act during the operation in a minimum of three professionally written sentences containing the explanation leading up to the event, the event itself, and the outcome of the event.",

    minimumNarrativeSentences: 3,

    fields: {
      actionCharacter: false,
      scope: false,
      combatElementLabel: "Combat Element",
      combatElementPlaceholder: "a rifleman, the Allied commander, etc.",
    },

    actionCharacterOptions: [],
    scopeOptions: [],
    eligibilityNotes: [],

    buildOpening({ combatElement, operationTitle, location, date }) {
      return (
        "For a single act of heroism and skill under enemy fire while serving as " +
        `${combatElement} in the 7th Cavalry Regiment during combat in ` +
        `Operation ${operationTitle} near ${location} on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName }) {
      return (
        `${recipientRank} ${recipientCitationName}'s heroism and skill ` +
        "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },

  {
    id: "air-medal",
    name: "Air Medal",
    abbreviation: "AM",
    ribbonUrl: "https://wiki.7cav.us/images/3/3f/AM.jpg",

    criteria:
      "Awarded to any member of an aircrew, including pilots, for skillful or heroic actions over the entire operation where there was no one specific instance of heroism and the Trooper's contribution was critical to the successful outcome of the operation. This award is the aviation equivalent to the Bronze Star without a valor device.",

    narrativeGuidance:
      "Describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation that was critical to the successful outcome in a minimum of three professionally written sentences containing the explanation leading up to the events, the events themselves, and the outcome of the events.",

    minimumNarrativeSentences: 3,

    fields: {
      actionCharacter: true,
      scope: false,
      combatElementLabel: "Aircrew Combat Element",
      combatElementPlaceholder: "a door gunner, an F-16 pilot, etc.",
    },

    actionCharacterOptions: [
      {
        value: "skillful",
        label: "Skillful",
      },
      {
        value: "heroic",
        label: "Heroic",
      },
    ],

    scopeOptions: [],

    eligibilityNotes: [
      "The recipient must be a member of an aircrew. Pilots are eligible.",
    ],

    buildOpening({
      actionCharacter,
      combatElement,
      operationTitle,
      location,
      date,
    }) {
      return (
        `For ${actionCharacter} actions over an entire operation while serving as ` +
        `${combatElement} in the 7th Cavalry Regiment during combat in ` +
        `Operation ${operationTitle} near ${location} on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName, actionCharacter }) {
      return (
        `${recipientRank} ${recipientCitationName}'s ${actionCharacter} actions ` +
        "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },

  {
    id: "purple-heart",
    name: "Purple Heart",
    abbreviation: "PH",
    ribbonUrl: "https://wiki.7cav.us/images/b/b5/PH.jpg",

    criteria:
      "Awarded for a single or multiple heroic actions while under enemy fire where the recipient was killed undertaking combat actions that resulted in the recipient's sacrifice and death.",

    narrativeGuidance:
      "Describe how the trooper's one or more heroic actions while under fire resulted in their sacrifice and death in a minimum of three professionally written sentences containing the explanation leading up to the event, the event itself, and the outcome of the event.",

    minimumNarrativeSentences: 3,

    fields: {
      actionCharacter: false,
      scope: true,
      combatElementLabel: "Combat Element",
      combatElementPlaceholder: "a rifleman, the Allied commander, etc.",
    },

    actionCharacterOptions: [],

    scopeOptions: [
      {
        value: "single",
        label: "Single",
      },
      {
        value: "multiple",
        label: "Multiple",
      },
    ],

    eligibilityNotes: [
      "The recipient must have been killed while undertaking the combat actions being cited.",
    ],

    buildOpening({ scope, combatElement, operationTitle, location, date }) {
      const actionText =
        scope === "single"
          ? "a single heroic action"
          : "multiple heroic actions";

      return (
        `For ${actionText} and skill under enemy fire resulting in their ` +
        `sacrifice and death while serving as ${combatElement} in the 7th Cavalry ` +
        `Regiment during combat in Operation ${operationTitle} near ${location} ` +
        `on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName }) {
      return (
        `${recipientRank} ${recipientCitationName}'s heroism and sacrifice ` +
        "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },

  {
    id: "bronze-star-medal",
    name: "Bronze Star Medal",
    abbreviation: "BS",
    ribbonUrl: "https://wiki.7cav.us/images/5/5e/BS.jpg",

    criteria:
      "Awarded for skillful or heroic actions over the entire operation where there was no one specific instance of heroism and the Trooper's contribution was critical to the successful outcome of the operation.",

    narrativeGuidance:
      "Describe how the trooper demonstrated exceptional skill or heroism over the entire duration of the operation that was critical to the successful outcome in a minimum of three professionally written sentences containing the explanation leading up to the events, the events themselves, and the outcome of the events.",

    minimumNarrativeSentences: 3,

    fields: {
      actionCharacter: true,
      scope: false,
      combatElementLabel: "Combat Element",
      combatElementPlaceholder: "a rifleman, the Allied commander, etc.",
    },

    actionCharacterOptions: [
      {
        value: "skillful",
        label: "Skillful",
      },
      {
        value: "heroic",
        label: "Heroic",
      },
    ],

    scopeOptions: [],
    eligibilityNotes: [],

    buildOpening({
      actionCharacter,
      combatElement,
      operationTitle,
      location,
      date,
    }) {
      return (
        `For ${actionCharacter} actions over an entire operation while serving as ` +
        `${combatElement} in the 7th Cavalry Regiment during combat in ` +
        `Operation ${operationTitle} near ${location} on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName, actionCharacter }) {
      return (
        `${recipientRank} ${recipientCitationName}'s ${actionCharacter} actions ` +
        "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },

  {
    id: "bronze-star-medal-with-valor",
    name: "Bronze Star Medal With Valor",
    abbreviation: "BSV",
    ribbonUrl: "https://wiki.7cav.us/images/8/88/BSV.jpg",

    criteria:
      "Awarded for a single act demonstrating extraordinary heroism and skill while under enemy fire and the Trooper's contribution was critical to the successful outcome of the operation. The recipient must have survived to be eligible to receive this award.",

    narrativeGuidance:
      "Describe how the trooper demonstrated extraordinary heroism in a single act during the operation in a minimum of three professionally written sentences containing the explanation leading up to the event, the event itself, and the outcome of the event.",

    minimumNarrativeSentences: 3,

    fields: {
      actionCharacter: false,
      scope: false,
      combatElementLabel: "Combat Element",
      combatElementPlaceholder: "a rifleman, the Allied commander, etc.",
    },

    actionCharacterOptions: [],
    scopeOptions: [],

    eligibilityNotes: [
      "The recipient must have survived the cited action to be eligible for this award.",
    ],

    buildOpening({ combatElement, operationTitle, location, date }) {
      return (
        "For a single act demonstrating extraordinary heroism and skill under enemy fire " +
        `while serving as ${combatElement} in the 7th Cavalry Regiment during combat in ` +
        `Operation ${operationTitle} near ${location} on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName }) {
      return (
        `${recipientRank} ${recipientCitationName}'s skills and heroic actions ` +
        "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },

  {
    id: "distinguished-flying-cross",
    name: "Distinguished Flying Cross",
    abbreviation: "DFC",
    ribbonUrl: "https://wiki.7cav.us/images/7/74/DFC.jpg",

    criteria:
      "Awarded to pilots for a single act demonstrating extraordinary heroism and skill while under enemy fire and the pilot's contribution was critical to the successful outcome of the operation. This award is the aviation equivalent of the Bronze Star with Valor device. Air crew are not eligible for this award and pilots must have their flight wings. The recipient must have survived to be eligible to receive this award.",

    narrativeGuidance:
      "Describe how the trooper demonstrated extraordinary heroism in a single act during the operation in a minimum of three professionally written sentences containing the explanation leading up to the event, the event itself, and the outcome of the event.",

    minimumNarrativeSentences: 3,

    fields: {
      actionCharacter: false,
      scope: false,
      combatElementLabel: "Airframe",
      combatElementPlaceholder: "an F/A-18, a Rotary-Wing, etc.",
    },

    actionCharacterOptions: [],
    scopeOptions: [],

    eligibilityNotes: [
      "The recipient must be a pilot.",
      "Air crew who are not pilots are not eligible.",
      "The pilot must possess their flight wings.",
      "The recipient must have survived the cited action.",
    ],

    buildOpening({ combatElement, operationTitle, location, date }) {
      return (
        "For a single act demonstrating extraordinary heroism and skill under enemy fire " +
        `while serving as ${combatElement} pilot in the 7th Cavalry Regiment during combat in ` +
        `Operation ${operationTitle} near ${location} on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName }) {
      return (
        `${recipientRank} ${recipientCitationName}'s skills and heroic actions ` +
        "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },

  {
    id: "silver-star",
    name: "Silver Star",
    abbreviation: "SS",
    ribbonUrl: "https://wiki.7cav.us/images/8/8f/SS.jpg",

    criteria:
      "Awarded for actions demonstrating extraordinary heroism, skill, and leadership under fire while serving in an official leadership position which were critical to the successful outcome of the mission. The recipient must have survived to be eligible to receive this award.",

    narrativeGuidance:
      "Describe how the trooper demonstrated extraordinary heroism and skill or leadership under fire in the operation in a minimum of four professionally written sentences containing the explanation leading up to the event, two sentences describing the event itself, and the outcome of the event and mission.",

    minimumNarrativeSentences: 4,

    fields: {
      actionCharacter: false,
      scope: false,
      combatElementLabel: "Leadership Element",
      combatElementPlaceholder: "a platoon leader, commander, etc.",
    },

    actionCharacterOptions: [],
    scopeOptions: [],

    eligibilityNotes: [
      "The recipient must have been serving in an official leadership position.",
      "The recipient must have survived the cited action.",
    ],

    buildOpening({ combatElement, operationTitle, location, date }) {
      return (
        "For conspicuous gallantry and intrepidity under direct enemy fire while serving as " +
        `${combatElement} in the 7th Cavalry Regiment during combat in ` +
        `Operation ${operationTitle} near ${location} on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName }) {
      return (
        `${recipientRank} ${recipientCitationName}'s heroism, skill and devotion to duty ` +
        "reflects great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },

  {
    id: "distinguished-service-cross",
    name: "Distinguished Service Cross",
    abbreviation: "DSC",
    ribbonUrl: "https://wiki.7cav.us/images/d/d3/DSC.jpg",

    criteria:
      "Awarded for actions, or a single act, demonstrating extraordinary heroism and skill under fire which were unquestionably responsible for the successful outcome of the mission against a live enemy (non-Cav) force or internal player versus player matches. It can also be awarded against a computer opponent for actions, or a single act, demonstrating extraordinary heroism, skill, and leadership under fire while serving as Officer-In-Command (OIC) of an official operation which were unquestionably responsible for the successful outcome of the mission. The recipient must have survived to be eligible to receive this award.",

    narrativeGuidance:
      "Describe how the trooper demonstrated extraordinary heroism and skill or leadership under fire in the operation in a minimum of five professionally written sentences containing the explanation leading up to the event, two sentences describing the event itself, and two sentences describing the outcome of the event.",

    minimumNarrativeSentences: 5,

    fields: {
      actionCharacter: false,
      scope: false,
      combatElementLabel: "Combat Element",
      combatElementPlaceholder: "a rifleman, the Allied commander, etc.",
    },

    actionCharacterOptions: [],
    scopeOptions: [],

    eligibilityNotes: [
      "The recipient must have survived the cited action.",
      "Against a live enemy (non-Cav) force or in an internal player-versus-player match, the cited actions must have been unquestionably responsible for the successful outcome of the mission.",
      "Against a computer opponent, the recipient must have been serving as Officer-In-Command (OIC) of the official operation and their actions must have been unquestionably responsible for the successful outcome of the mission.",
    ],

    buildOpening({ combatElement, operationTitle, location, date }) {
      return (
        "For conspicuous gallantry and intrepidity under direct enemy fire while serving as " +
        `${combatElement} in the 7th Cavalry Regiment during combat in ` +
        `Operation ${operationTitle} near ${location} on ${date}.`
      );
    },

    buildClosing({ recipientRank, recipientCitationName }) {
      return (
        `${recipientRank} ${recipientCitationName}'s heroism, skill and devotion to duty ` +
        "reflects great credit upon themselves and the 7th Cavalry Gaming Regiment."
      );
    },
  },
];

export function getOperationMedalById(medalId) {
  return OPERATION_MEDALS.find((medal) => medal.id === medalId) ?? null;
}
