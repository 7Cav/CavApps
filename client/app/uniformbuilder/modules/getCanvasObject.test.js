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
 * For the collar it reads three things off data[0]: mosCheck (non-null means
 * the MOS and rank disagree and nothing is drawn), shoulderCord and neckPins
 * (asset names, or false for none). The collar cases assert those three.
 *
 * For weapon quals, canvas.jsx reads data[5].expertQuals (and the sharpshooter
 * and marksman arrays) and draws one plate per entry, top to bottom, in array
 * order. The order of that array is what the weapon qual tests assert.
 *
 * The only stub is globalThis.fetch, the outermost network adapter. No
 * internal collaborator is mocked.
 *
 * Expected image numbers are literals, transcribed from the badge artwork in
 * public/skunkworks/uniformBadges/combatBadges — 6.png is wings with a
 * caduceus, 10/11/12.png are aircrew wings plain / with a star / with a star in
 * a wreath, and so on. They are deliberately NOT read back from the catalog:
 * sourcing them from the data under test would move both sides of the
 * assertion together and no row could ever fail. The one exception is the
 * weapon list at the end, which reads the catalog to find out which weapons
 * exist. The expected position in each of those rows is still a literal.
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
import { AWARD_CATALOG } from "./constants/awardCatalog.js";
import { AwardType } from "./constants/awardTypes.js";

// getIndividual.js reads the two variables above at module scope, so this one
// import has to happen after they are set — hence dynamic rather than static.
const { default: GetCanvasObject } = await import("./getCanvasObject.jsx");

const { test, report } = createHarness();

/**
 * Mirrors the roster API response as getCanvasObject.jsx and GetUserInfo.jsx
 * consume it. `awardName` is the field that links a fetched award to its
 * catalog entry, and the API returns the catalog's own award names.
 */
// The two rank classes GetUserInfo.jsx tells apart. An officer MOS on an
// enlisted rank (or the reverse) sets mosCheck and the collar stays bare, so
// each collar case pairs its MOS with the matching rank.
const ENLISTED = { rankShort: "SPC", rankId: "19" }; // E4, Specialist
const OFFICER = { rankShort: "CPT", rankId: "9" }; // O3, Captain

const rosterResponse = (mos, awardNames, rank = ENLISTED) => ({
  user: { username: "Weather.J" },
  rank,
  mos,
  awards: awardNames.map((awardName) => ({ awardName, awardDetails: "" })),
});

/** Everything the builder hands the renderer for one member. */
const canvasObjectFor = async (mos, awardNames, rank = ENLISTED) => {
  const payload = rosterResponse(mos, awardNames, rank);
  globalThis.fetch = async () => ({ status: 200, json: async () => payload });
  return GetCanvasObject(payload.user.username);
};

/** The collar decorations the builder hands the renderer for one member. */
const collarFor = async (mos, rank) => {
  const { mosCheck, shoulderCord, neckPins } = (
    await canvasObjectFor(mos, [], rank)
  )[0];
  // The fixture's rank must match the MOS class, or the canvas discards the
  // cord and pins whatever their values. Loose equality on purpose. The canvas
  // tests `mosCheck != null`, so undefined draws the collar too.
  assert.equal(mosCheck, null, "fixture rank does not match MOS");
  return { shoulderCord, neckPins };
};

/** The combat badge the builder hands the renderer, or null for none. */
const combatBadgeFor = async (mos, awardNames) =>
  (await canvasObjectFor(mos, awardNames))[4];

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

// ── Service ribbons: the medal display, in precedence order ──────────────────
// canvas.jsx lays out data[3] in list order and reads each entry's
// medalPriority for its sprite-sheet row. An award the registry does not know
// never reaches data[3], so a missing catalog entry shows up as a missing
// medal. awardTitle is the award name as the API sent it; it is read here only
// to tell the medals apart, since the row number is the sole other identity a
// medal carries and it shifts with every award added above it.

/** The medal display for a member holding these awards. MOS plays no part in it. */
const medalsFor = async (awardNames) =>
  (await canvasObjectFor("11B", awardNames))[3];

await test("Vietnam Service Ribbon sits between Overseas and Ready or Not on the medal display", async () => {
  // Expected order is MILPAC's, not the catalog's: display_order 205
  // (Overseas), 210 (Vietnam), 225 (Ready or Not). Held in shuffled order so
  // the API's ordering cannot satisfy this by accident.
  const medals = await medalsFor([
    "Ready or Not Service Ribbon",
    "Vietnam Service Ribbon",
    "Overseas Service Ribbon",
  ]);
  assert.deepStrictEqual(
    medals.map((medal) => medal.awardTitle),
    [
      "Overseas Service Ribbon",
      "Vietnam Service Ribbon",
      "Ready or Not Service Ribbon",
    ],
  );
  // The sprite rows must climb with the display order, or Vietnam's slot
  // would draw a neighbour's medal art.
  const rows = medals.map((medal) => medal.medalPriority);
  assert.ok(
    rows[0] < rows[1] && rows[1] < rows[2],
    `medal sheet rows ${rows} do not follow the display order`,
  );
});

// ── Collar: Logistics cord and pins for the two Logistics MOSs (#225) ────────
// Expected asset names are literals. They are the filenames the canvas loads
// from uniformCords/ and uniformLapelPins/.

await test("90A officer wears the Logistics cord and officer pins", async () => {
  assert.deepStrictEqual(await collarFor("90A", OFFICER), {
    shoulderCord: "Logistics",
    neckPins: "LogisticsOfficer",
  });
});

await test("92Y enlisted wears the Logistics cord and NCO pins", async () => {
  assert.deepStrictEqual(await collarFor("92Y", ENLISTED), {
    shoulderCord: "Logistics",
    neckPins: "LogisticsNCO",
  });
});

// Regression guards. Both were green before #225. A new case block lands at
// the end of a switch, so each guard covers the block that was last before
// this change: 19A's cord block in the cord lookup, 11B's pin block in the pin
// lookup. A misplaced insertion shows up here rather than in the cases above.

await test("19A officer still wears the Armor cord and officer pins", async () => {
  assert.deepStrictEqual(await collarFor("19A", OFFICER), {
    shoulderCord: "Armor",
    neckPins: "ArmorOfficer",
  });
});

await test("11B enlisted still wears the Infantry cord and NCO pins", async () => {
  assert.deepStrictEqual(await collarFor("11B", ENLISTED), {
    shoulderCord: "Infantry",
    neckPins: "InfantryNCO",
  });
});

// ── Weapon quals: plates stack in SOP order ──────────────────────────────────
// The S1 Uniforms SOP fixes the order plates stack in a column. The expected
// arrays below are transcribed from it, not read from the slot list in
// WeaponQual, so a slot that drifts from its catalog tag fails here.

/** The weapon qual object the builder hands the renderer, or 0 for none. */
const weaponQualsFor = async (awardNames) => {
  const payload = rosterResponse("11B", awardNames);
  globalThis.fetch = async () => ({ status: 200, json: async () => payload });
  return (await GetCanvasObject(payload.user.username))[5];
};

await test("expert quals listed in reverse SOP order stack in SOP order", async () => {
  // Reverse of the SOP order, so insertion order alone cannot pass. Before the
  // fix Recoilless Rifle sorted after Hydra-70 because its slot was spelled
  // "recoillessRifle" while the catalog tags it "recoilless".
  const held = [
    "Hydra-70 Expert",
    "Pistol Expert",
    "Recoilless Rifle Expert",
    "Machine Gun Expert",
    "Rifle Expert",
  ];
  assert.deepStrictEqual((await weaponQualsFor(held)).expertQuals, [
    "rifle",
    "machineGun",
    "recoilless",
    "pistol",
    "hydra70",
  ]);
});

// ── Mk-82: each MILPAC title reaches its level array (#227) ──────────────────
// No catalog entry named Mk-82, so a member holding one of its titles got no
// weapon qual object at all ([5] was 0) and nothing drew. Each title is held
// alone, so a row can only see whether that one title maps to a weapon qual at
// its level. The tag is a literal, like every other tag in this file. Whether
// the tag names a plate file that exists is the catalog test's job.

await test("Mk-82 Expert is filed under expert quals", async () => {
  assert.deepStrictEqual((await weaponQualsFor(["Mk-82 Expert"])).expertQuals, [
    "mk82",
  ]);
});

await test("Mk-82 Sharpshooter is filed under sharpshooter quals", async () => {
  assert.deepStrictEqual(
    (await weaponQualsFor(["Mk-82 Sharpshooter"])).sharpshooterQuals,
    ["mk82"],
  );
});

await test("Mk-82 Marksman is filed under marksman quals", async () => {
  assert.deepStrictEqual(
    (await weaponQualsFor(["Mk-82 Marksman"])).marksmanQuals,
    ["mk82"],
  );
});

// ── Every weapon has a slot ──────────────────────────────────────────────────
// A tag with no slot sorts after every known tag, so the Recoilless Rifle
// defect is one instance of a class. Mk-82 is last in the SOP, so every other
// weapon must stack above it. Weapons come from the catalog, not a list here,
// so a new weapon is covered the day its catalog entry lands.
//
// The last weapon's own slot is the blind spot. A slotless mk82 sorts last,
// which is where the SOP puts it, so no row here can see that mistake. The
// blind spot moves with the anchor. Hydra-70 held it until Mk-82 landed below
// it (#227). Now the Hydra-70 row sees Hydra-70 lose its slot. It is also the
// only row that goes red alone when the mk82 slot lands anywhere but last,
// whether before Hydra-70 or in place of it. That row was green from birth,
// so it is a regression pin, not defect evidence.
//
// The catalog has no level field: the builder files a qual under expert,
// sharpshooter or marksman by the word in its name, so the Expert entry is
// picked the same way. The count guard turns a rename that drops the word into
// a failure here rather than a silently missing row.

const weaponQualTags = [
  ...new Set(
    AWARD_CATALOG.filter(
      (award) => award.awardType === AwardType.WeaponQual,
    ).map((award) => award.awardTag),
  ),
];

const expertQualNamed = (tag) =>
  AWARD_CATALOG.find(
    (award) => award.awardTag === tag && award.name.includes("Expert"),
  )?.name;

const weaponsAboveMk82 = weaponQualTags
  .filter((tag) => tag !== "mk82")
  .map((tag) => [tag, expertQualNamed(tag)])
  .filter(([, name]) => name !== undefined);

await test("every weapon qual tag in the catalog has an Expert entry to check", () => {
  // Guards the rows below: a tag whose Expert entry was renamed would vanish
  // from the list instead of failing.
  assert.strictEqual(weaponsAboveMk82.length, weaponQualTags.length - 1);
  assert.ok(weaponsAboveMk82.length > 0);
});

for (const [tag, expertName] of weaponsAboveMk82) {
  await test(`${expertName} stacks above Mk-82 Expert`, async () => {
    const quals = await weaponQualsFor(["Mk-82 Expert", expertName]);
    assert.deepStrictEqual(quals.expertQuals, [tag, "mk82"]);
  });
}

report();
