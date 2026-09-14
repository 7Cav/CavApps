// Weapon qual plates are stored under
// client/public/skunkworks/uniformWeaponQuals/plates/<awardTag>.png, so the
// catalog's awardTag is the filename. A tag with no file draws nothing (#229).
// Plates stack in the order awardPriority gives, read from the same catalog
// entry (#242).
//
// The one place the plate path is built. canvas.jsx renders from this and the
// catalog test checks files through it, so the two cannot drift apart.
export function weaponQualPlatePath(awardTag) {
  return `skunkworks/uniformWeaponQuals/plates/${awardTag}.png`;
}
