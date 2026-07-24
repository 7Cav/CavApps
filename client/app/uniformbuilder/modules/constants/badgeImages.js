// Enum of common names for combat badges within:
// client/public/skunkworks/uniformBadges/combatBadges/<n>.png
// this is used to select the proper image for layering within canvas.jsx
// For example, the Aviator Badge is known as 7.png within the files themselves.
// Values 1 - 5 are EIB thru CIB 4. These are universal and do not require special enumeration.
export const BadgeImages = Object.freeze({
  flightMedicBadge: 6,
  aviator: 7,
  seniorAviator: 8,
  masterAviator: 9,
  aircrew: 10,
  seniorAircrew: 11,
  masterAircrew: 12,
});
