// Combat badge images, by the filename they are stored under in
// client/public/skunkworks/uniformBadges/combatBadges/<n>.png.
//
// Each combat badge in awardCatalog.js names its image here. Do not derive the
// image from a badge's awardPriority: priority ranks a badge within a member's
// ladder and is deliberately not unique across badges — the Flight Medic Badge
// and the Aircraft Crewman Badge share priority 6 — so it cannot identify one.
export const BadgeImages = Object.freeze({
  expertInfantry: 1,
  combatInfantry: 2,
  combatInfantrySecond: 3,
  combatInfantryThird: 4,
  combatInfantryFourth: 5,
  flightMedicBadge: 6,
  aviator: 7,
  seniorAviator: 8,
  masterAviator: 9,
  aircrew: 10,
  seniorAircrew: 11,
  masterAircrew: 12,
});

// The one place the badge image path is built. canvas.jsx renders from this and
// the catalog test checks files through it, so the two cannot drift apart.
export function combatBadgeImagePath(imageNum) {
  return `skunkworks/uniformBadges/combatBadges/${imageNum}.png`;
}
