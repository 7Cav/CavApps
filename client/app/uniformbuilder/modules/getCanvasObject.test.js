/**
 * Seam: GetCanvasObject(userName) — the module's default export, and the only
 * function the uniform builder page calls.
 *
 * canvas.jsx reads exactly two things about the combat badge: whether data[4]
 * is null (nothing is drawn), and data[4].imageNum (which badge image is
 * drawn). Those are the only things asserted here. awardTitle and the rest of
 * the badge object are internal and are deliberately left alone, so this suite
 * survives a rewrite of how the badge is chosen.
 *
 * The only stub is globalThis.fetch, the outermost network adapter. No
 * internal collaborator is mocked.
 *
 * Expected image numbers are literals, transcribed from the badge artwork in
 * public/skunkworks/uniformBadges/combatBadges — 6.png is wings with a
 * caduceus, 10/11/12.png are aircrew wings plain / with a star / with a star in
 * a wreath, and so on. They are deliberately NOT read back from the catalog:
 * sourcing them from the data under test would move both sides of the
 * assertion together and no row could ever fail.
 *
 * Run with `npm run test:client` — not a bare `node`; the script carries the
 * loader hook that lets Node import the client's .jsx modules.
 */

// getIndividual.js reads these at module scope, so they have to be set before
// the import below rather than per-test.
process.env.NEXT_PUBLIC_INDIVIDUAL_API_URL ??=
  "http://uniform-builder.test/individual";
process.env.NEXT_PUBLIC_CLIENT_TOKEN ??= "test-client-token";

import assert from "node:assert";
import { createHarness } from "../../../test-harness.mjs";

// getIndividual.js reads the two variables above at module scope, so this one
// import has to happen after they are set — hence dynamic rather than static.
const { default: GetCanvasObject } = await import("./getCanvasObject.jsx");

const { test, report } = createHarness();

/**
 * Mirrors the roster API response as getCanvasObject.jsx and GetUserInfo.jsx
 * consume it. `awardName` is the field that links a fetched award to its
 * catalog entry, and the API returns the catalog's own award names.
 */
const rosterResponse = (mos, awardNames) => ({
  user: { username: "Weather.J" },
  rank: { rankShort: "SPC", rankId: "19" }, // E4, Specialist
  mos,
  awards: awardNames.map((awardName) => ({ awardName, awardDetails: "" })),
});

/** The combat badge the builder hands the renderer, or null for none. */
const combatBadgeFor = async (mos, awardNames) => {
  const payload = rosterResponse(mos, awardNames);
  globalThis.fetch = async () => ({ status: 200, json: async () => payload });
  return (await GetCanvasObject(payload.user.username))[4];
};

const assertDraws = (badge, expectedImageNum) => {
  assert.notStrictEqual(badge, null, "expected a combat badge, got none");
  assert.strictEqual(badge.imageNum, expectedImageNum);
};

const assertDrawsNothing = (badge) => {
  // Deliberately strict: a badge object carrying an undefined imageNum is not
  // "nothing drawn", it is a request for combatBadges/undefined.png.
  assert.strictEqual(badge, null);
};

// ── Identity: every badge is drawn as itself ─────────────────────────────────
// One row per badge, held alone by a MOS entitled to wear it. These guard the
// badge-to-image and MOS-to-family data against mis-tagging; they do not
// reproduce any reported defect.

const EVERY_BADGE_DRAWN_BY_AN_ELIGIBLE_WEARER = [
  ["Expert Infantry Badge", "11B", 1],
  ["Combat Infantry Badge", "11B", 2],
  ["Combat Infantry Badge 2nd Award", "11B", 3],
  ["Combat Infantry Badge 3rd Award", "11B", 4],
  ["Combat Infantry Badge 4th Award", "11B", 5],
  ["Flight Medic Badge", "68W", 6],
  ["Army Aviator Badge", "153A", 7],
  ["Senior Army Aviator Badge", "153A", 8],
  ["Master Army Aviator Badge", "153A", 9],
  ["Aircraft Crewman Badge", "15T", 10],
  ["Aircraft Senior Crewman Badge", "15T", 11],
  ["Aircraft Master Crewman Badge", "15T", 12],
];

for (const [
  awardName,
  mos,
  imageNum,
] of EVERY_BADGE_DRAWN_BY_AN_ELIGIBLE_WEARER) {
  await test(`${mos} draws ${awardName} as itself`, async () => {
    assertDraws(await combatBadgeFor(mos, [awardName]), imageNum);
  });
}

// ── Refusal: a badge whose family this MOS does not wear ─────────────────────
// These are the reported defect. A combat medic in an aviation company can earn
// the Aircraft Crewman Badge, but aircrew badges are worn by aviation MOSs
// only. Before the fix all three drew a badge the member had never been
// awarded.

await test("68W holding only an aircrew badge displays no combat badge", async () => {
  assertDrawsNothing(await combatBadgeFor("68W", ["Aircraft Crewman Badge"]));
});

await test("11B holding only an aircrew badge displays no combat badge", async () => {
  assertDrawsNothing(await combatBadgeFor("11B", ["Aircraft Crewman Badge"]));
});

await test("15T holding only an aviator badge displays no combat badge", async () => {
  // 15T crew aircraft rather than fly them, so the aviator badges are not
  // theirs to wear even when earned.
  assertDrawsNothing(await combatBadgeFor("15T", ["Army Aviator Badge"]));
});

await test("153A holding only a flight medic badge displays no combat badge", async () => {
  // The flight medic badge belongs to the medical MOSs. Before the fix an
  // aviation MOS holding one was drawn the aircrew badge, which is neither the
  // badge held nor a badge they had earned.
  assertDrawsNothing(await combatBadgeFor("153A", ["Flight Medic Badge"]));
});

// ── Selection: the highest badge the member may wear, whatever the order ─────
// The API's ordering of a member's awards is not guaranteed, and the badge is
// built by a different code path depending on which award arrives first. Each
// case is therefore run in both orderings.

await test("68W wears his highest CIB, not the aircrew badge, in any award order", async () => {
  // SPC Weather.J's record: five combat badges, one of them an aircrew badge
  // he earned but may not wear.
  const held = [
    "Expert Infantry Badge",
    "Combat Infantry Badge",
    "Aircraft Crewman Badge",
    "Combat Infantry Badge 2nd Award",
    "Combat Infantry Badge 3rd Award",
  ];
  assertDraws(await combatBadgeFor("68W", held), 4);
  assertDraws(await combatBadgeFor("68W", [...held].reverse()), 4);
});

await test("11B wears his highest CIB over an aircrew badge, in any award order", async () => {
  const held = ["Aircraft Crewman Badge", "Combat Infantry Badge 3rd Award"];
  assertDraws(await combatBadgeFor("11B", held), 4);
  assertDraws(await combatBadgeFor("11B", [...held].reverse()), 4);
});

await test("68W wears the Flight Medic Badge over a CIB, in any award order", async () => {
  const held = ["Combat Infantry Badge", "Flight Medic Badge"];
  assertDraws(await combatBadgeFor("68W", held), 6);
  assertDraws(await combatBadgeFor("68W", [...held].reverse()), 6);
});

report();
