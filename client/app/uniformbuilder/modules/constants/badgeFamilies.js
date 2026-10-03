// Extensions are explicit here for the same reason as awardCatalog.js: this
// module is reachable from plain Node, whose ESM resolver does not guess them.
import { MosGroup } from "./mos.js";

// Combat badges come in four families. Which family a badge belongs to is a
// property of the badge, not of its rank within a member's ladder: two badges
// can share an awardPriority and still belong to different families. The Flight
// Medic Badge and the Aircraft Crewman Badge both sit at priority 6, and telling
// them apart by priority is impossible — that is what the family is for.
export const BadgeFamily = Object.freeze({
  INFANTRY: "infantry",
  FLIGHT_MEDIC: "flightMedic",
  AIRCREW: "aircrew",
  AVIATOR: "aviator",
});

// The badge families a member may display, by MOS. A member can hold a badge
// they may not display: aircrew badges are awarded to troopers outside the
// aviation MOSs, but only aviation MOSs wear them.
export function displayableBadgeFamilies(userMos) {
  const families = [BadgeFamily.INFANTRY];

  if (MosGroup.MEDICAL.includes(userMos)) {
    families.push(BadgeFamily.FLIGHT_MEDIC);
  }

  if (MosGroup.AVIATION.includes(userMos)) {
    families.push(BadgeFamily.AIRCREW);

    // Crewmen stop at the aircrew badges; the aviator badges are the
    // pilots'.
    if (!MosGroup.ROTARY_CREW.includes(userMos)) {
      families.push(BadgeFamily.AVIATOR);
    }
  }

  return families;
}
