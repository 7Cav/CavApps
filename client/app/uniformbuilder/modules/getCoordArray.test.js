/**
 * Seam: GetCoordArray(ribbonCount), the module's default export. GetUserInfo.jsx
 * passes its result through untouched as ribbonCoordArray, and canvas.jsx
 * draws ribbon i of the member's ribbons, sorted highest priority first, at
 * ribbonCoordArray[i]. So the order and the positions of the returned slots
 * are what a member sees on their chest and, once the chest is full, on the
 * pinboard band below it.
 *
 * Exact pixel positions are deliberately not asserted. Where the rack sits, how
 * wide each row is, how many ribbons the chest holds and how far the pinboard
 * grows past the 43 promised below are layout choices a maintainer may tune;
 * these tests assert the rules any layout has to keep. How many the chest holds
 * is read off the output instead: the most ribbons placed as one group of rows.
 *
 * Expected values come from outside the module: the order ribbons are read in
 * (top row first, then from the wearer's right), the 43 × 14 px size canvas.jsx
 * draws each ribbon at, and the band's edges in uniformBase.png. None of them
 * are read back from the rack table, which would move both sides of each
 * assertion together.
 *
 * Run with `npm run test:client`, not a bare `node`; the script carries the
 * loader hook that lets Node import the client's .jsx modules.
 */

import assert from "node:assert";
import { isDeepStrictEqual } from "node:util";
import { createHarness } from "../../../test-harness.mjs";
import GetCoordArray from "./getCoordArray.jsx";
import {
  BAND,
  RIBBON_HEIGHT,
  RIBBON_WIDTH,
  chestLimit,
  insideBand,
  rowEdges,
  sitsOn,
} from "./ribbonLayout.test-helpers.js";

const { test, report } = createHarness();

// Ribbons that don't fit on the chest go on the pinboard, which grows to a
// 3 × 3 like a standard milpac rack. With the chest holding 34 that promises a
// uniform to everyone with up to 43 ribbons. Growing the pinboard keeps the
// promise; shrinking it breaks it.
const RIBBONS_ALWAYS_DRAWN = 43;

// Counts 0 to 100 cover every member; the catalog has well under 100 ribbon
// types.
const PROBE_LIMIT = 100;

// Every count in range, split by whether GetCoordArray places it or refuses it.
function probe() {
  const accepted = [];
  const refused = [];
  for (let count = 0; count <= PROBE_LIMIT; count++) {
    try {
      accepted.push({ count, slots: GetCoordArray(count) });
    } catch (error) {
      refused.push({ count, error });
    }
  }
  return { accepted, refused };
}

// The accepted counts that overflow the chest, with how many the chest holds.
function spilled() {
  const chest = chestLimit(PROBE_LIMIT);
  return {
    chest,
    counts: probe().accepted.filter(({ count }) => count > chest),
  };
}

// On the canvas a smaller dy is higher on the chest, and the wearer's right is
// the viewer's left, so reading order is smallest dy first, then smallest dx.
const readsBefore = (a, b) => a.dy - b.dy || a.dx - b.dx;

const overlap = (a, b) =>
  Math.abs(a.dx - b.dx) < RIBBON_WIDTH && Math.abs(a.dy - b.dy) < RIBBON_HEIGHT;

await test("ribbons read in priority order: top row first, then from the wearer's right", () => {
  const misordered = [];
  for (const { count, slots } of probe().accepted) {
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

await test("every count the builder accepts gets one slot per ribbon, none overlapping", () => {
  const problems = [];
  for (const { count, slots } of probe().accepted) {
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
// Only a row sitting on another is held to this; the pinboard sits apart from
// the chest, not under it.
await test("a row never hangs off-center from the row beneath it", () => {
  const offCenter = [];
  for (const { count, slots } of probe().accepted) {
    const rows = rowEdges(slots);
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const below = rows[r - 1];
      if (!sitsOn(row, below)) continue;
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
await test("any count the builder refuses raises an error telling the member to report it to S1", () => {
  const unhelpful = probe()
    .refused.filter(({ error }) => !/\bS1\b/.test(String(error?.message)))
    .map(({ count, error }) => `${count} ribbons: ${error?.message}`);
  assert.deepStrictEqual(unhelpful, []);
});

await test("a member with up to 43 ribbons is never refused", () => {
  const refused = probe()
    .refused.map(({ count }) => count)
    .filter((count) => count <= RIBBONS_ALWAYS_DRAWN);
  assert.deepStrictEqual(refused, []);
});

// The chest holds the highest-priority ribbons. Once it is full the rest move
// to the pinboard band, and nothing on the chest touches the band.
await test("ribbons that don't fit on the chest go on the pinboard band", () => {
  const { chest, counts } = spilled();
  const misplaced = [];
  for (const { count, slots } of counts) {
    slots.forEach((slot, i) => {
      const onBand = insideBand(slot);
      if (i < chest && onBand) {
        misplaced.push(`${count} ribbons: chest ribbon ${i} is on the band`);
      }
      if (i >= chest && !onBand) {
        misplaced.push(`${count} ribbons: ribbon ${i} is off the band`);
      }
    });
  }
  assert.deepStrictEqual(misplaced, []);
});

// Whatever rows the pinboard is using sit in the middle of the band's height,
// not pinned to its top or bottom. Within a pixel, for rounding.
await test("the pinboard's rows are centered on the band's height", () => {
  const { chest, counts } = spilled();
  const offCenter = [];
  for (const { count, slots } of counts) {
    const pinboard = slots.slice(chest);
    const top = Math.min(...pinboard.map((slot) => slot.dy));
    const bottom = Math.max(...pinboard.map((slot) => slot.dy)) + RIBBON_HEIGHT;
    const above = top - BAND.top;
    const below = BAND.bottom - bottom;
    if (Math.abs(above - below) > 1) {
      offCenter.push(`${count} ribbons: ${above}px above, ${below}px below`);
    }
  }
  assert.deepStrictEqual(offCenter, []);
});

await test("once ribbons spill onto the pinboard, the chest stays as it is when full", () => {
  const { chest, counts } = spilled();
  const fullChest = GetCoordArray(chest);
  const changed = counts
    .filter(({ slots }) => !isDeepStrictEqual(slots.slice(0, chest), fullChest))
    .map(({ count }) => `${count} ribbons`);
  assert.deepStrictEqual(changed, []);
});

report();
