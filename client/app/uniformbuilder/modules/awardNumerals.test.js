/**
 * Seam: GetCanvasObject(userName), the module's default export and the only
 * function the uniform builder page calls.
 *
 * canvas.jsx draws a ribbon's device from two fields on the award object:
 * ribbonAttachmentType picks the image folder and
 * ribbonDisplayedAttachmentCount picks the image in it, drawn only when it is
 * not 0. Those are the only things asserted here. Ribbons and medals have no
 * fixed slot in the returned arrays, so each award is found by its title.
 *
 * The Air Medal and the NCO Professional Development Ribbon (NCOPDR) carry a
 * numeral device. Per the award SOP (issue #226) the numeral is the award
 * count: one award draws a plain ribbon, two draw "2". NCOPDR counts distinct
 * NCO ranks read from each row's free text details.
 *
 * Expected numerals are literals from the SOP, not computed from the rows.
 *
 * The only stub is globalThis.fetch, the outermost network adapter.
 *
 * Run with `npm run test:client`, not a bare `node`; the script carries the
 * loader hook that lets Node import the client's .jsx modules.
 */

// getIndividual.js reads these at module scope, so they have to be set before
// the import below rather than per-test.
process.env.NEXT_PUBLIC_INDIVIDUAL_API_URL ??=
  "http://uniform-builder.test/individual";
process.env.NEXT_PUBLIC_CLIENT_TOKEN ??= "test-client-token";

import assert from "node:assert";
import { createHarness } from "../../../test-harness.mjs";

const { default: GetCanvasObject } = await import("./getCanvasObject.jsx");

const { test, report } = createHarness();

const AIR_MEDAL = "Air Medal";
const NCOPDR = "NCO Professional Development Ribbon";

/**
 * Mirrors the roster API response as getCanvasObject.jsx consumes it. Each
 * row is one MILPAC award entry: the catalog's award name plus the free text
 * details S1 typed on it.
 */
const rosterResponse = (rows) => ({
  user: { username: "Weather.J" },
  rank: { rankShort: "SPC", rankId: "19" },
  mos: "11B",
  awards: rows,
});

/** Rows of one award, each carrying the given details string. */
const rowsOf = (awardName, detailsList) =>
  detailsList.map((awardDetails) => ({ awardName, awardDetails }));

/**
 * The numeral the builder hands the renderer for one award: 0 draws a plain
 * ribbon, n draws the "n" image. Ribbons sit at index 1 and medals at index 3
 * of the array GetCanvasObject returns.
 */
const numeralFor = async (awardName, rows) => {
  const payload = rosterResponse(rows);
  globalThis.fetch = async () => ({ status: 200, json: async () => payload });
  const [, ribbons, , medals] = await GetCanvasObject(payload.user.username);
  const award = [...ribbons, ...medals].find((a) => a.awardTitle === awardName);
  assert.notStrictEqual(award, undefined, `${awardName} was not built`);
  return award.ribbonDisplayedAttachmentCount;
};

// ── Air Medal: the numeral is the row count ──────────────────────────────────

await test("one Air Medal draws a plain ribbon", async () => {
  const rows = rowsOf(AIR_MEDAL, ["Operation Anvil"]);
  assert.strictEqual(await numeralFor(AIR_MEDAL, rows), 0);
});

await test("two Air Medals draw the numeral 2", async () => {
  const rows = rowsOf(AIR_MEDAL, ["Operation Anvil", "Operation Bastion"]);
  assert.strictEqual(await numeralFor(AIR_MEDAL, rows), 2);
});

await test("seven Air Medals draw the highest numeral that exists, 6", async () => {
  const rows = rowsOf(AIR_MEDAL, ["a", "b", "c", "d", "e", "f", "g"]);
  assert.strictEqual(await numeralFor(AIR_MEDAL, rows), 6);
});

// ── NCOPDR: the numeral is the count of distinct NCO ranks ───────────────────
// S1 types the rank into each row's details by hand. The strings below are
// real MILPAC values, typos included.

await test("NCOPDR rows for SGT, SSG, SFC and MSG draw the numeral 4", async () => {
  // The SOP's own example: a SGT promoted straight to MSG is issued the
  // three rows he skipped, so his ribbon shows "4".
  const rows = rowsOf(NCOPDR, [
    "Master Sergeant Promotion",
    "Sergeant Promotion",
    "Sergeant First Class Promotion",
    "Staff Sergeant Promotion",
  ]);
  assert.strictEqual(await numeralFor(NCOPDR, rows), 4);
});

await test("two NCOPDR rows for the same rank, one misspelled, draw a plain ribbon", async () => {
  const rows = rowsOf(NCOPDR, ["Sergeant Promotion", "Sergent Promotion"]);
  assert.strictEqual(await numeralFor(NCOPDR, rows), 0);
});

await test("NCOPDR rows for MSG and 1SG, both E-8, draw the numeral 2", async () => {
  const rows = rowsOf(NCOPDR, [
    "Master Sergeant Promotion",
    "First Sergeant Promotion",
  ]);
  assert.strictEqual(await numeralFor(NCOPDR, rows), 2);
});

await test("NCOPDR rows for SGM and CSM draw the numeral 2", async () => {
  const rows = rowsOf(NCOPDR, [
    "Sergeant Major Promotion",
    "Command Sergeant Major Promotion",
  ]);
  assert.strictEqual(await numeralFor(NCOPDR, rows), 2);
});

await test("an NCOPDR row with blank details counts as a rank of its own", async () => {
  const rows = rowsOf(NCOPDR, ["Sergeant Promotion", ""]);
  assert.strictEqual(await numeralFor(NCOPDR, rows), 2);
});

await test("two NCOPDR rows with blank details draw the numeral 2", async () => {
  const rows = rowsOf(NCOPDR, ["", ""]);
  assert.strictEqual(await numeralFor(NCOPDR, rows), 2);
});

// ── Other devices keep the oak leaf convention ───────────────────────────────

await test("two Meritorious Service Medals still draw one oak leaf cluster", async () => {
  const msm = "Meritorious Service Medal";
  assert.strictEqual(await numeralFor(msm, rowsOf(msm, ["", ""])), 1);
});

report();
