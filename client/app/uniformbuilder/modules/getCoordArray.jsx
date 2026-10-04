import {
  RIBBON_BOTTOM_ROW_DY,
  RIBBON_RACKS,
  RIBBON_ROW_HEIGHT,
  RIBBON_SLOT_WIDTH,
  RibbonRowAlign,
} from "./constants";

// Returns where to draw each of the member's ribbons, highest priority first.
// canvas.jsx pairs entry i with the member's ribbon i in awardPriority order.
export default function GetCoordArray(ribbonCount) {
  const rack = RIBBON_RACKS.find((r) => ribbonCount <= r.upTo);
  if (!rack)
    throw new Error(
      "FATAL ERROR! The number of ribbons of this user exceeds the max allowable limit. This is a priority error. Inform your lead, S1 1IC and 2IC with the name of the affected user.",
    );

  /* included for use later
  {
    // -1 (On the pinboard)
    dx: 706,
    dy: 571,
  },
  {
    // -2
    dx: 750,
    dy: 571,
  },
  */

  // Filled from the bottom row up, so lowest priority first.
  const coords = [];
  let remaining = ribbonCount;
  rack.rows.forEach((capacity, row) => {
    const ribbonsInRow = Math.min(capacity, remaining);
    for (let slot = 0; slot < ribbonsInRow; slot++) {
      coords.push({
        dx: slotDx(rack, slot, ribbonsInRow),
        dy: RIBBON_BOTTOM_ROW_DY - row * RIBBON_ROW_HEIGHT,
      });
    }
    remaining -= ribbonsInRow;
  });
  return coords.reverse();
}

// Slot 0 is the rightmost on screen, the row's lowest-priority ribbon.
function slotDx(rack, slot, ribbonsInRow) {
  if (rack.align === RibbonRowAlign.RIGHT) {
    return rack.anchorDx - slot * RIBBON_SLOT_WIDTH;
  }
  // Centering puts an odd row on whole slots and shifts an even row by half a
  // slot, so a row of two sits over the middle of a row of three.
  return rack.anchorDx + ((ribbonsInRow - 1) / 2 - slot) * RIBBON_SLOT_WIDTH;
}
