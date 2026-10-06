import {
  RIBBON_CHEST_BOTTOM_ROW_DY,
  RIBBON_CHEST_CAPACITY,
  RIBBON_PINBOARD,
  RIBBON_PINBOARD_CAPACITY,
  RIBBON_RACKS,
  RIBBON_ROW_HEIGHT,
  RIBBON_SLOT_WIDTH,
  RibbonRowAlign,
  ribbonsOnChest,
} from "./constants";

// Returns where to draw each of the member's ribbons, highest priority first.
// canvas.jsx pairs entry i with the member's ribbon i in awardPriority order.
// The chest takes the highest-priority ribbons and the pinboard the rest.
export default function GetCoordArray(ribbonCount) {
  if (!(ribbonCount <= RIBBON_CHEST_CAPACITY + RIBBON_PINBOARD_CAPACITY))
    throw new Error(
      "FATAL ERROR! The number of ribbons of this user exceeds the max allowable limit. This is a priority error. Inform your lead, S1 1IC and 2IC with the name of the affected user.",
    );

  const onChest = ribbonsOnChest(ribbonCount);
  const chest = RIBBON_RACKS.find((r) => onChest <= r.upTo);
  return [
    ...fillRack(chest, onChest, RIBBON_CHEST_BOTTOM_ROW_DY),
    ...centeredOn(
      fillRack(RIBBON_PINBOARD, ribbonCount - onChest, 0),
      RIBBON_PINBOARD.middleDy,
    ),
  ];
}

// Fills rows from the bottom up, so lowest priority first, then reverses.
function fillRack(rack, ribbonCount, bottomRowDy) {
  const coords = [];
  let remaining = ribbonCount;
  rack.rows.forEach((capacity, row) => {
    const ribbonsInRow = Math.min(capacity, remaining);
    for (let slot = 0; slot < ribbonsInRow; slot++) {
      coords.push({
        dx: slotDx(rack, slot, ribbonsInRow),
        dy: bottomRowDy - row * RIBBON_ROW_HEIGHT,
      });
    }
    remaining -= ribbonsInRow;
  });
  return coords.reverse();
}

// Moves the rows so they straddle middleDy, so the block grows both ways.
function centeredOn(coords, middleDy) {
  if (coords.length === 0) return coords;
  const top = Math.min(...coords.map((c) => c.dy));
  const bottom = Math.max(...coords.map((c) => c.dy)) + RIBBON_ROW_HEIGHT;
  const shift = Math.round(middleDy - (top + bottom) / 2);
  return coords.map((c) => ({ dx: c.dx, dy: c.dy + shift }));
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
