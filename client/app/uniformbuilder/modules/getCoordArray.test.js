/**
 * Seam: GetCoordArray(ribbonCount), the module's default export. GetUserInfo.jsx
 * passes its result through untouched as ribbonCoordArray, and canvas.jsx
 * draws ribbon i of the member's ribbons, sorted highest priority first, at
 * ribbonCoordArray[i]. So the order and the positions of the returned slots
 * are what a member sees on their chest.
 *
 * Exact pixel positions are deliberately not asserted. Where the rack sits and
 * how wide each row is are layout choices a maintainer may tune; these tests
 * assert the rules any layout has to keep.
 *
 * Expected values come from outside the module: the order ribbons are read in
 * (top row first, then from the wearer's right), and the 43 × 14 px size
 * canvas.jsx draws each ribbon at. None of them are read back from the rack
 * table, which would move both sides of each assertion together.
 *
 * Run with `npm run test:client`, not a bare `node`; the script carries the
 * loader hook that lets Node import the client's .jsx modules.
 */

import assert from "node:assert";
import { createHarness } from "../../../test-harness.mjs";
import GetCoordArray from "./getCoordArray.jsx";

const { test, report } = createHarness();

// The most ribbons the builder draws. Above this it refuses.
const MAX_RIBBONS = 34;

// canvas.jsx draws every ribbon 43 × 14 px from the slot's top-left corner.
const RIBBON_WIDTH = 43;
const RIBBON_HEIGHT = 14;

// On the canvas a smaller dy is higher on the chest, and the wearer's right is
// the viewer's left, so reading order is smallest dy first, then smallest dx.
const readsBefore = (a, b) => a.dy - b.dy || a.dx - b.dx;

const overlap = (a, b) =>
  Math.abs(a.dx - b.dx) < RIBBON_WIDTH && Math.abs(a.dy - b.dy) < RIBBON_HEIGHT;

// Each row's left and right edge on screen, bottom row first.
function rowEdges(slots) {
  const rows = new Map();
  for (const { dx, dy } of slots) {
    const row = rows.get(dy) ?? { left: Infinity, right: -Infinity };
    row.left = Math.min(row.left, dx);
    row.right = Math.max(row.right, dx + RIBBON_WIDTH);
    rows.set(dy, row);
  }
  return [...rows.entries()].sort(([a], [b]) => b - a).map(([, row]) => row);
}

await test("ribbons read in priority order: top row first, then from the wearer's right", () => {
  const misordered = [];
  for (let count = 0; count <= MAX_RIBBONS; count++) {
    const slots = GetCoordArray(count);
    const i = slots.findIndex(
      (slot, index) => index > 0 && readsBefore(slots[index - 1], slot) > 0,
    );
    if (i !== -1) {
      misordered.push(
        `${count} ribbons: ribbon ${i} reads before ribbon ${i - 1}`,
      );
    }
  }
  assert.deepStrictEqual(misordered, []);
});

await test("every ribbon gets its own slot, and no two ribbons overlap", () => {
  const problems = [];
  for (let count = 0; count <= MAX_RIBBONS; count++) {
    const slots = GetCoordArray(count);
    if (slots.length !== count) {
      problems.push(`${count} ribbons: ${slots.length} slots`);
    }
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (overlap(slots[i], slots[j])) {
          problems.push(`${count} ribbons: ribbons ${i} and ${j} overlap`);
        }
      }
    }
  }
  assert.deepStrictEqual(problems, []);
});

// A short row has to be either centered over the row beneath it or flush with
// its edge on the wearer's left. A short row of two in a rack of threes has to
// shift half a ribbon to be centered, which is where hand placement goes wrong.
await test("a row never hangs off-center from the row beneath it", () => {
  const offCenter = [];
  for (let count = 1; count <= MAX_RIBBONS; count++) {
    const rows = rowEdges(GetCoordArray(count));
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const below = rows[r - 1];
      // Equal sums of the edges mean equal midpoints.
      const centered = row.left + row.right === below.left + below.right;
      const flush = row.right === below.right;
      if (!centered && !flush) {
        offCenter.push(`${count} ribbons: row ${r + 1}`);
      }
    }
  }
  assert.deepStrictEqual(offCenter, []);
});

// page.jsx shows the error's message to the member, so it has to say who to
// report it to.
await test("more than 34 ribbons raises an error telling the member to report it to S1", () => {
  assert.throws(() => GetCoordArray(MAX_RIBBONS + 1), /\bS1\b/);
});

report();
