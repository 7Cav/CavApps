// Weapon qual plates are stored under
// client/public/skunkworks/uniformWeaponQuals/plates/<awardTag>.png, so the
// catalog's awardTag is the filename. It is also the slot name in
// WeaponQual.weaponOrder; a tag that differs in either place sorts last or
// draws nothing (#229).
//
// The one place the plate path is built. canvas.jsx renders from this and the
// catalog test checks files through it, so the two cannot drift apart.
export function weaponQualPlatePath(awardTag) {
  return `skunkworks/uniformWeaponQuals/plates/${awardTag}.png`;
}
