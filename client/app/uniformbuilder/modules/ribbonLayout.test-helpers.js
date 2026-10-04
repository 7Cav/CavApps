// Ribbon geometry shared by the tests that check where ribbons land. Every
// number here comes from outside the rack table: the size canvas.jsx draws a
// ribbon at, and the pinboard band as it sits in uniformBase.png.

import GetCoordArray from "./getCoordArray.jsx";

// canvas.jsx draws every ribbon 43 × 14 px from the slot's top-left corner.
export const RIBBON_WIDTH = 43;
export const RIBBON_HEIGHT = 14;

// The tan band between the uniform and the medal case in uniformBase.png
// covers x 22 to 814 and y 570 to 687. Right and bottom are exclusive edges.
export const BAND = Object.freeze({
  left: 22,
  right: 815,
  top: 570,
  bottom: 688,
});

export const insideBand = ({ dx, dy }) =>
  dx >= BAND.left &&
  dx + RIBBON_WIDTH <= BAND.right &&
  dy >= BAND.top &&
  dy + RIBBON_HEIGHT <= BAND.bottom;

// Each row's top edge and its left and right edge on screen, bottom row first.
export function rowEdges(slots) {
  const rows = new Map();
  for (const { dx, dy } of slots) {
    const row = rows.get(dy) ?? { dy, left: Infinity, right: -Infinity };
    row.left = Math.min(row.left, dx);
    row.right = Math.max(row.right, dx + RIBBON_WIDTH);
    rows.set(dy, row);
  }
  return [...rows.values()].sort((a, b) => b.dy - a.dy);
}

// A row sits on the row below it when the gap between them is smaller than a
// ribbon. A wider gap means two separate groups, like the chest and the
// pinboard.
export const sitsOn = (row, below) =>
  below.dy - (row.dy + RIBBON_HEIGHT) < RIBBON_HEIGHT;

// How many separate groups of rows the slots form.
export function stackCount(slots) {
  const rows = rowEdges(slots);
  let stacks = rows.length > 0 ? 1 : 0;
  for (let r = 1; r < rows.length; r++) {
    if (!sitsOn(rows[r], rows[r - 1])) stacks++;
  }
  return stacks;
}

// The most ribbons GetCoordArray places as one group, up to upTo, which is how
// many the chest holds before ribbons spill onto the pinboard.
export function chestLimit(upTo) {
  let limit = 0;
  for (let count = 0; count <= upTo; count++) {
    try {
      if (stackCount(GetCoordArray(count)) <= 1) limit = count;
    } catch {
      // A refused count holds nothing.
    }
  }
  return limit;
}
