// Where ribbons sit. GetCoordArray picks the first chest rack whose upTo covers
// the member's ribbon count and fills its rows bottom row first, each row up to
// its capacity. Ribbons past the last chest rack's upTo go on the pinboard.
//
// Small chest racks are rows of three, centered. Large chest racks are rows of
// four flush against the wearer's left (the viewer's right), narrowing toward
// the top where the lapel crosses the chest.

// A 43px ribbon plus a 1px gap.
export const RIBBON_SLOT_WIDTH = 44;
export const RIBBON_ROW_HEIGHT = 14;
export const RIBBON_CHEST_BOTTOM_ROW_DY = 287;

export const RibbonRowAlign = Object.freeze({
  // Every row is centered on anchorDx, the dx of a row of three's middle slot.
  CENTER: "center",
  // Every row ends at anchorDx, the dx of the rightmost slot.
  RIGHT: "right",
});

export const RIBBON_RACKS = Object.freeze([
  {
    upTo: 11,
    align: RibbonRowAlign.CENTER,
    anchorDx: 559,
    rows: [3, 3, 3, 3],
  },
  {
    upTo: 32,
    align: RibbonRowAlign.RIGHT,
    anchorDx: 625,
    rows: [4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 1],
  },
  // Thirteen rows is as high as the rack goes, so past 32 lower rows widen.
  {
    upTo: 33,
    align: RibbonRowAlign.RIGHT,
    anchorDx: 625,
    rows: [4, 4, 4, 3, 3, 2, 2, 2, 2, 2, 2, 2, 1],
  },
  {
    upTo: 34,
    align: RibbonRowAlign.RIGHT,
    anchorDx: 625,
    rows: [4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 1],
  },
]);

export const RIBBON_CHEST_CAPACITY = RIBBON_RACKS[RIBBON_RACKS.length - 1].upTo;

// The chest takes the member's highest-priority ribbons up to its capacity.
// The combat badge sits above the chest, so it is placed by this count too.
export const ribbonsOnChest = (ribbonCount) =>
  Math.min(ribbonCount, RIBBON_CHEST_CAPACITY);

// The pinboard is the band between the uniform and the medal case, y 570 to
// 688. It takes the member's lowest-priority ribbons once the chest is full and
// fills like a chest rack, but the rows in use are centered on middleDy rather
// than standing on a fixed bottom row.
export const RIBBON_PINBOARD = Object.freeze({
  align: RibbonRowAlign.RIGHT,
  anchorDx: 750,
  middleDy: 629,
  rows: [3, 3, 3],
});

export const RIBBON_PINBOARD_CAPACITY = RIBBON_PINBOARD.rows.reduce(
  (total, capacity) => total + capacity,
  0,
);
