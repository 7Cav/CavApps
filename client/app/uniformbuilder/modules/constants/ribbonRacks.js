// Where ribbons sit on the left chest. GetCoordArray picks the first rack whose
// upTo covers the member's ribbon count and fills its rows bottom row first,
// each row up to its capacity. The last rack's upTo is the most ribbons the
// builder draws.
//
// Small racks are rows of three, centered. Large racks are rows of four flush
// against the wearer's left (the viewer's right), narrowing toward the top
// where the lapel crosses the chest.

// A 43px ribbon plus a 1px gap.
export const RIBBON_SLOT_WIDTH = 44;
export const RIBBON_ROW_HEIGHT = 14;
export const RIBBON_BOTTOM_ROW_DY = 287;

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
