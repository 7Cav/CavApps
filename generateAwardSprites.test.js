"use strict";

/**
 * Harness for generateAwardSprites.js. No test framework — run with `npm test`
 * (not a bare `node`; the script carries the flag that mutes Node's
 * MODULE_TYPELESS_PACKAGE_JSON notice). Builds synthetic sprite sheets and
 * sources in a temp dir so the real sheets are never touched, then asserts the
 * I/O-matrix edge cases from the spec.
 *
 * One deliberate exception to "synthetic": the first block of main() loads the
 * REAL constants/awardCatalog.js and awardTypes.js, read-only. Those
 * assertions are the entire point of this suite — a fixture cannot catch the
 * award data moving or changing shape, which is how the generator once sat
 * broken for a month with every test green. Do not replace them with a
 * fixture.
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const sharp = require("sharp");

const { pathToFileURL } = require("url");

const {
  DEFAULT_PATHS,
  RIBBON_SHEET_TYPES,
  MEDAL_SHEET_TYPES,
  indexCatalog,
  loadCatalog,
  lookupAward,
  malformedFields,
  onRibbonSheet,
  onMedalSheet,
  sheetRowCount,
  catalogSheetRows,
  writeSheet,
  isPlainPngName,
  isRibbonSourceShape,
  validateManifest,
  spliceSheet,
  readSheet,
  run,
} = require("./generateAwardSprites");

// Synthetic stand-in for AWARD_CATALOG, in the real catalog's shape: an ordered
// array of plain objects keyed by `name`. Shared by the in-memory Map fixture
// and the on-disk ESM module that run() imports, so both exercise the same
// data through the same indexing code the generator uses in production.
const CATALOG_ENTRIES = [
  {
    name: "Lifetime Medal",
    awardPriority: 0,
    medalPriority: 0,
    awardType: "Medal",
  },
  { name: "Foo Ribbon", awardPriority: 1, awardType: "Ribbon" },
  { name: "Bar Medal", awardPriority: 2, medalPriority: 2, awardType: "Medal" },
  // Holds ribbon row 3. A real catalog's priorities are contiguous — the sheet
  // is read at row * tileHeight, so a hole is a blank row every award below it
  // is then read across — and validateManifest now rejects a gap outright.
  { name: "Filler Ribbon", awardPriority: 3, awardType: "Ribbon" },
  {
    name: `Baz "Q" Service Ribbon`,
    awardPriority: 4,
    medalPriority: 3,
    awardType: "Medal",
  },
  { name: "Ranger Tab", awardPriority: 1, awardType: "Tab" },
  // Carries an unrelated nested field: extra keys must not disturb placement.
  {
    name: "Nested Medal",
    awardPriority: 5,
    style: { x: 1 },
    medalPriority: 4,
    awardType: "Medal",
  },
  // medalPriority is present but not a usable row index — must be rejected
  // loudly rather than read as "no medal tile".
  {
    name: "Broken Medal",
    awardPriority: 6,
    medalPriority: "WIP",
    awardType: "Medal",
  },
  { name: "Typeless Medal", awardPriority: 7, medalPriority: 6 },
];

const CATALOG = indexCatalog(CATALOG_ENTRIES);

// validateManifest takes each sheet's current row count as an argument, so
// every call has to state which sheet state it is checking against. STEADY is
// "every catalog award already has a tile", which is what a replace requires;
// inserting(n, m) is the sheet as it stands just before n ribbon and m medal
// tiles are spliced in; SOLO is the empty sheet that a one-award fixture
// catalog splices its first tile into.
//
// Derived from CATALOG rather than written out, so adding a fixture award does
// not silently invalidate every call site below.
const STEADY = {
  ribbon: catalogSheetRows(CATALOG, "ribbon").count,
  medal: catalogSheetRows(CATALOG, "medal").count,
};
const SOLO = { ribbon: 0, medal: 0 };
const inserting = (ribbon = 0, medal = 0) => ({
  ribbon: STEADY.ribbon - ribbon,
  medal: STEADY.medal - medal,
});

// Solid-color RGBA tile as a PNG buffer.
function colorTile(width, height, [r, g, b]) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

// Build a sheet of stacked tile bands, each a distinct color, written to disk.
async function makeSheet(file, width, tileH, colors) {
  const bands = await Promise.all(
    colors.map((c, i) =>
      colorTile(width, tileH, c).then((png) => ({
        input: png,
        top: i * tileH,
        left: 0,
      })),
    ),
  );
  await sharp({
    create: {
      width,
      height: tileH * colors.length,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(bands)
    .png()
    .toFile(file);
}

async function rowColor(sheetPath, y) {
  const { data, width, channels } = await readSheet(sheetPath);
  const off = y * width * channels;
  return [data[off], data[off + 1], data[off + 2]];
}

let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  passed++;
  console.log(`  ok - ${name}`);
}

async function main() {
  // --- REAL catalog: the guard this whole rewrite exists for ---
  // History: the generator used to parse AwardRegistry.jsx as text. PR #130
  // moved the award data into constants/awardCatalog.js and the text matcher
  // silently matched nothing — every upload failed "not present in
  // AwardRegistry.jsx" while this suite stayed green, because every other test
  // here runs against synthetic fixtures. These assertions run against the
  // REAL catalog, so the next time that data moves or changes shape, it fails
  // at merge time instead of in front of a contributor.
  const realCatalog = await loadCatalog(DEFAULT_PATHS.catalog);
  ok("real catalog: loads a non-empty catalog", realCatalog.size > 50);

  const dsc = lookupAward(realCatalog, "Army Distinguished Service Cross");
  ok(
    "real catalog: a known award resolves with usable placement fields",
    dsc !== null &&
      Number.isInteger(dsc.awardPriority) &&
      Number.isInteger(dsc.medalPriority) &&
      dsc.awardType === "Medal",
  );
  ok(
    "real catalog: that award gates onto both sheets",
    onRibbonSheet(dsc) && onMedalSheet(dsc),
  );
  ok(
    "real catalog: an absent name resolves to null",
    lookupAward(realCatalog, "Nope") === null,
  );

  const realAwards = [...realCatalog.values()];
  ok(
    "real catalog: every entry has a non-empty string awardType",
    realAwards.every(
      (a) => typeof a.awardType === "string" && a.awardType !== "",
    ),
  );
  ok(
    "real catalog: no entry has a malformed placement field",
    realAwards.every((a) => malformedFields(a).length === 0),
  );
  ok(
    "real catalog: at least one award gates onto each sheet",
    realAwards.some(onRibbonSheet) && realAwards.some(onMedalSheet),
  );

  // --- REAL catalog against the REAL sheets ---
  // The invariant the whole reconciliation rests on: each sheet holds exactly
  // one row per award the catalog places on it, densely numbered from the
  // sheet's first row. It is unverifiable from the artifact alone — a PNG
  // records no award identity — so it is asserted here against production data
  // rather than assumed. If it ever stops holding, every upload starts failing
  // reconciliation, and the fix is the catalog or the sheet, not this check.
  //
  // The row counts must be read through sheetRowCount, not height/tileHeight:
  // the ribbon sheet is 783px = 55*14 + 13, its final tile genuinely truncated.
  const reencodeDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "sprites-reencode-"),
  );
  scratchDirs.push(reencodeDir);
  for (const [kind, sheetPath, tileHeight] of [
    ["ribbon", DEFAULT_PATHS.ribbonSheet, 14],
    ["medal", DEFAULT_PATHS.medalSheet, 120],
  ]) {
    const { count, missing, duplicated } = catalogSheetRows(realCatalog, kind);
    ok(
      `real ${kind} sheet: ${count} catalog priorities run consecutively, no repeats or holes`,
      missing.length === 0 && duplicated.length === 0,
    );
    const rows = sheetRowCount(
      (await sharp(sheetPath).metadata()).height,
      tileHeight,
    );
    ok(
      `real ${kind} sheet: holds exactly the ${count} row(s) the catalog claims`,
      rows === count,
    );
    // The committed sheet is the generator's own output, so re-encoding it
    // changes nothing. Worth pinning because it makes an unexplained binary
    // diff mean something: with this true, the next sheet change in git is
    // either real art or a dependency that started encoding differently, and
    // both are things a reviewer should be told about rather than wave past.
    const reencoded = path.join(reencodeDir, `${kind}.png`);
    await writeSheet(reencoded, await readSheet(sheetPath));
    ok(
      `real ${kind} sheet: committed bytes are exactly what writeSheet emits`,
      fs.readFileSync(reencoded).equals(fs.readFileSync(sheetPath)),
    );
  }

  // sheetRowCount against both real geometries and the accident it survived.
  // The stray pixel arrived when a hand-edit added 121px where 120 was meant
  // (5160 -> 5281, 2026-05-05) and rode along through a later clean +120 to
  // 5401; it has since been cropped. Rounding down on it would have hidden a
  // row and rounding up would have invented one.
  ok(
    "sheetRowCount: a truncated final tile still counts as a row (783px = 56)",
    sheetRowCount(783, 14) === 56,
  );
  ok(
    "sheetRowCount: an exact multiple counts cleanly (5400px = 45)",
    sheetRowCount(5400, 120) === 45,
  );
  ok(
    "sheetRowCount: a stray pixel past the last tile reads as another row",
    sheetRowCount(5401, 120) === 46,
  );

  // The sheet-membership sets are written as plain strings, so they are bound
  // to awardTypes.js only by convention. Cross-check them against the real
  // enum: renaming a value there (Ribbon: "Ribbon" -> "RIBBON") would silently
  // drop every award of that type off its sheet, and no assertion above would
  // notice, because the survivors of the OTHER types keep every "some(...)"
  // and "typeof === string" check true. Verified: that exact rename drops 7
  // real awards off the ribbon sheet with the rest of this suite still green.
  const { AwardType } = await import(
    pathToFileURL(
      path.join(path.dirname(DEFAULT_PATHS.catalog), "awardTypes.js"),
    ).href
  );
  const enumValues = new Set(Object.values(AwardType));
  const orphanedSetMembers = [
    ...RIBBON_SHEET_TYPES,
    ...MEDAL_SHEET_TYPES,
  ].filter((t) => !enumValues.has(t));
  assert.deepStrictEqual(orphanedSetMembers, []);
  ok("real enum: every sheet-membership type is a live AwardType value", true);

  const orphanedCatalogTypes = [
    ...new Set(realAwards.map((a) => a.awardType)),
  ].filter((t) => !enumValues.has(t));
  assert.deepStrictEqual(orphanedCatalogTypes, []);
  ok(
    "real enum: every awardType used by the catalog is a live AwardType value",
    true,
  );

  // --- indexCatalog / lookupAward ---
  assert.deepStrictEqual(lookupAward(CATALOG, "Foo Ribbon"), {
    name: "Foo Ribbon",
    awardPriority: 1,
    awardType: "Ribbon",
  });
  ok("lookup: ribbon-only has awardPriority, no medalPriority", true);

  assert.strictEqual(lookupAward(CATALOG, "Nope"), null);
  ok("lookup: absent name returns null", true);

  assert.strictEqual(
    lookupAward(CATALOG, 'Baz "Q" Service Ribbon').medalPriority,
    3,
  );
  ok("lookup: name with embedded quotes resolves", true);

  assert.strictEqual(lookupAward(CATALOG, "Nested Medal").medalPriority, 4);
  ok("lookup: an unrelated nested field does not disturb placement", true);

  assert.throws(
    () => indexCatalog([{ name: "Dup" }, { name: "Dup" }]),
    /duplicate/i,
  );
  ok("indexCatalog: a duplicate award name throws", true);

  assert.throws(() => indexCatalog([{ awardPriority: 1 }]), /name/i);
  ok("indexCatalog: an entry with no name throws", true);

  assert.throws(() => indexCatalog([{ name: "", awardPriority: 1 }]), /name/i);
  ok("indexCatalog: an empty-string name throws", true);

  // A stray comma or a conditional spread in the catalog array leaves a hole.
  assert.throws(() => indexCatalog([null]), /name/i);
  ok("indexCatalog: a null entry throws the catalog-shaped error", true);

  assert.throws(() => indexCatalog("not an array"), /array/i);
  ok("indexCatalog: a non-array catalog throws", true);

  // An empty catalog is never a legitimate state, and letting it through
  // reports every award as "not present" — the same misdirection that hid the
  // original breakage.
  assert.throws(() => indexCatalog([]), /empty/i);
  ok("indexCatalog: an empty catalog throws instead of indexing nothing", true);

  await assert.rejects(
    loadCatalog(path.join(os.tmpdir(), "no-such-award-catalog.js")),
    /ERR_MODULE_NOT_FOUND|Cannot find module/,
  );
  ok(
    "loadCatalog: a missing catalog file rejects, never degrades to empty",
    true,
  );

  // --- malformedFields: present-but-unusable value is flagged ---
  assert.deepStrictEqual(
    malformedFields(lookupAward(CATALOG, "Broken Medal")),
    ["medalPriority"],
  );
  ok("malformed: present-but-unusable medalPriority is flagged", true);
  assert.deepStrictEqual(
    malformedFields(lookupAward(CATALOG, "Bar Medal")),
    [],
  );
  ok("malformed: clean entry flags nothing", true);
  assert.deepStrictEqual(
    malformedFields({ awardPriority: -1, awardType: "Medal" }),
    ["awardPriority"],
  );
  ok("malformed: a negative row index is flagged", true);

  // A field WRITTEN as undefined (what a typo'd or deleted enum reference
  // evaluates to) states an intent to sit on that sheet, so it must be
  // rejected — not read as "field omitted", which would splice the ribbon
  // tile, skip the medal tile, and still exit 0.
  assert.deepStrictEqual(
    malformedFields({
      awardPriority: 1,
      medalPriority: undefined,
      awardType: "Medal",
    }),
    ["medalPriority"],
  );
  ok(
    "malformed: a field written as undefined is flagged, not read as absent",
    true,
  );

  assert.deepStrictEqual(
    malformedFields({ awardPriority: 1, awardType: "Medal" }),
    [],
  );
  ok(
    "malformed: an omitted field is a legitimate non-member, not flagged",
    true,
  );

  assert.deepStrictEqual(malformedFields({ awardPriority: 1, awardType: "" }), [
    "awardType",
  ]);
  ok("malformed: an empty-string awardType is flagged", true);

  // --- membership gating ---
  ok(
    "membership: Tab is on neither sheet",
    !onRibbonSheet(lookupAward(CATALOG, "Ranger Tab")) &&
      !onMedalSheet(lookupAward(CATALOG, "Ranger Tab")),
  );
  ok(
    "membership: Lifetime medal (medalPriority 0) is ribbon-only, not on medal sheet",
    onRibbonSheet(lookupAward(CATALOG, "Lifetime Medal")) &&
      !onMedalSheet(lookupAward(CATALOG, "Lifetime Medal")),
  );
  ok(
    "membership: service ribbon is on both sheets",
    onRibbonSheet(lookupAward(CATALOG, 'Baz "Q" Service Ribbon')) &&
      onMedalSheet(lookupAward(CATALOG, 'Baz "Q" Service Ribbon')),
  );

  // --- validateManifest ---
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sprites-"));
  fs.writeFileSync(
    path.join(dir, "ribbon.png"),
    await colorTile(43, 13, [9, 9, 9]),
  );
  fs.writeFileSync(
    path.join(dir, "medal.png"),
    await colorTile(72, 148, [9, 9, 9]),
  );
  // A second ribbon source, for the cases that put two entries in one manifest.
  // They cannot share one file: two entries naming the same PNG is itself an
  // error now (it would splice one award's art into two rows and consume the
  // file once), and it would mask the check each of those cases is really about.
  fs.writeFileSync(
    path.join(dir, "ribbon2.png"),
    await colorTile(43, 13, [8, 8, 8]),
  );

  let r = validateManifest(
    [{ name: "Ghost", ribbon: "ribbon.png" }],
    CATALOG,
    dir,
    STEADY,
  );
  ok("validate: name absent from the catalog errors", r.errors.length === 1);

  r = validateManifest(
    [{ name: "Broken Medal", ribbon: "ribbon.png", medal: "medal.png" }],
    CATALOG,
    dir,
    STEADY,
  );
  ok(
    "validate: present-but-unusable field is a hard error, not a non-member",
    r.errors.some(
      (e) => e.includes("present but unusable") && e.includes("medalPriority"),
    ),
  );

  // Built inline rather than added to CATALOG_ENTRIES: JSON.stringify drops
  // undefined-valued keys, so this entry would not survive writeCatalog() and
  // the on-disk fixture would disagree with the in-memory one.
  r = validateManifest(
    [{ name: "Phantom Medal", ribbon: "ribbon.png", medal: "medal.png" }],
    indexCatalog([
      {
        name: "Phantom Medal",
        awardPriority: 0,
        medalPriority: undefined,
        awardType: "Medal",
      },
    ]),
    dir,
    STEADY,
  );
  ok(
    "validate: a medalPriority written as undefined aborts the run, not just the medal tile",
    r.errors.some(
      (e) => e.includes("present but unusable") && e.includes("medalPriority"),
    ),
  );

  r = validateManifest(
    [{ name: "Typeless Medal", ribbon: "ribbon.png", medal: "medal.png" }],
    CATALOG,
    dir,
    STEADY,
  );
  ok(
    "validate: priorities present but no awardType errors distinctly (not 'does not belong')",
    r.errors.some((e) => e.includes("no usable awardType")) &&
      !r.errors.some((e) => e.includes("does not belong")),
  );

  r = validateManifest(
    [{ name: "Bar Medal", ribbon: "ribbon.png" }],
    CATALOG,
    dir,
    inserting(1, 1),
  );
  ok(
    "validate: missing required medal source errors",
    r.errors.some((e) => e.includes("medal sheet")),
  );

  r = validateManifest(
    [{ name: "Foo Ribbon", ribbon: "ribbon.png" }],
    CATALOG,
    dir,
    inserting(1),
  );
  ok("validate: ribbon-only with its source passes", r.errors.length === 0);

  r = validateManifest(
    [{ name: "Bar Medal", ribbon: "ribbon.png", medal: "medal.png" }],
    CATALOG,
    dir,
    inserting(1, 1),
  );
  ok(
    "validate: both-sheet award with both sources passes",
    r.errors.length === 0,
  );

  // Supplying art for a sheet the catalog does not place the award on is a
  // contradiction between two humans' intent, not a stray file: the manifest
  // asserts the tile exists, the catalog says it has nowhere to go. Warning and
  // continuing placed the other tile, consumed its source and exited 0, leaving
  // an award half-placed with the warning reading as "correct, ribbon-only".
  r = validateManifest(
    [{ name: "Foo Ribbon", ribbon: "ribbon.png", medal: "medal.png" }],
    CATALOG,
    dir,
    inserting(1),
  );
  ok(
    "validate: a medal source for a pure ribbon errors, not warns",
    r.errors.some(
      (e) => e.includes("medal sheet") && e.includes("awardType"),
    ) && r.errors.length === 1,
  );

  // The headline shape: a medal whose medalPriority the contributor forgot to
  // add. Omitting it is the legitimate way to write a ribbon-only award, so the
  // supplied "medal" source is the only thing distinguishing the two.
  r = validateManifest(
    [{ name: "Forgetful Medal", ribbon: "ribbon.png", medal: "medal.png" }],
    indexCatalog([
      { name: "Forgetful Medal", awardPriority: 0, awardType: "Medal" },
    ]),
    dir,
    SOLO,
  );
  ok(
    "validate: a medal source for a medal missing medalPriority errors",
    r.errors.some(
      (e) => e.includes("medal sheet") && e.includes("no medalPriority"),
    ),
  );

  // A medalPriority on a non-medal awardType is not a medal tile: membership is
  // gated on type first, so the priority is inert and the art has nowhere to go.
  r = validateManifest(
    [{ name: "Priced Ribbon", ribbon: "ribbon.png", medal: "medal.png" }],
    indexCatalog([
      {
        name: "Priced Ribbon",
        awardPriority: 0,
        medalPriority: 5,
        awardType: "Ribbon",
      },
    ]),
    dir,
    SOLO,
  );
  ok(
    "validate: a medal source for a ribbon carrying a medalPriority errors",
    r.errors.some(
      (e) =>
        e.includes("medal sheet") &&
        e.includes('awardType "Ribbon"') &&
        !e.includes("medalPriority"),
    ),
  );

  // Priorities 0 and 1 are the two Lifetime medals: on the ribbon sheet, below
  // the medal sheet's first row. Absence and out-of-range must read alike.
  r = validateManifest(
    [{ name: "Lifetime Medal", ribbon: "ribbon.png", medal: "medal.png" }],
    CATALOG,
    dir,
    inserting(1),
  );
  ok(
    "validate: a medal source for a below-minimum medalPriority errors",
    r.errors.some((e) => e.includes("medal sheet") && e.includes("below")),
  );

  // The mirror. An award can be medal-only if it omits awardPriority, so the
  // same contradiction has a ribbon-side shape that must fail identically.
  r = validateManifest(
    [{ name: "Medal Only", ribbon: "ribbon.png", medal: "medal.png" }],
    indexCatalog([
      { name: "Medal Only", medalPriority: 2, awardType: "Medal" },
    ]),
    dir,
    SOLO,
  );
  ok(
    "validate: a ribbon source for a medal-only award errors (the mirror case)",
    r.errors.some(
      (e) => e.includes("ribbon sheet") && e.includes("no awardPriority"),
    ),
  );

  r = validateManifest(
    [{ name: "Ranger Tab", ribbon: "ribbon.png" }],
    CATALOG,
    dir,
    STEADY,
  );
  ok(
    "validate: award on neither sheet (Tab) errors",
    r.errors.some((e) => e.includes("does not belong")),
  );

  r = validateManifest(
    [
      { name: "Foo Ribbon", ribbon: "ribbon.png" },
      { name: "Foo Ribbon", ribbon: "ribbon.png" },
    ],
    CATALOG,
    dir,
    inserting(1),
  );
  ok(
    "validate: duplicate manifest entry errors",
    r.errors.some((e) => e.includes("duplicate")),
  );

  // Both entries land on the ribbon sheet; mixing a replace with an insert in
  // one run would shift the buffer out from under the replace, so it's rejected.
  r = validateManifest(
    [
      { name: "Foo Ribbon", ribbon: "ribbon.png", replace: true },
      { name: "Lifetime Medal", ribbon: "ribbon2.png" },
    ],
    CATALOG,
    dir,
    STEADY,
  );
  ok(
    "validate: mixing a replace and an insert on the same sheet errors",
    r.errors.some((e) => e.includes("both a replace and an insert")),
  );

  // Two replaces on the same sheet is fine — no insert means no shift.
  r = validateManifest(
    [
      { name: "Foo Ribbon", ribbon: "ribbon.png", replace: true },
      { name: "Lifetime Medal", ribbon: "ribbon2.png", replace: true },
    ],
    CATALOG,
    dir,
    STEADY,
  );
  ok(
    "validate: two replaces on the same sheet (no insert) is allowed",
    !r.errors.some((e) => e.includes("both a replace and an insert")),
  );

  // An unrecognised key is rejected rather than ignored. `replace` is read as a
  // strict `=== true`, so a near-miss spelling reads as absent and downgrades a
  // replace to an insert — which shifts every row below it, silently.
  r = validateManifest(
    [{ name: "Foo Ribbon", ribbon: "ribbon.png", replaced: true }],
    CATALOG,
    dir,
    STEADY,
  );
  ok(
    'validate: a near-miss "replace" key errors instead of reading as an insert',
    r.errors.some(
      (e) => e.includes("unrecognised key") && e.includes("replaced"),
    ),
  );

  r = validateManifest(
    [{ name: "Foo Ribbon", ribbon: "ribbon.png", note: "hi" }],
    CATALOG,
    dir,
    STEADY,
  );
  ok(
    "validate: any unrecognised key errors, not only near-misses of a real one",
    r.errors.some((e) => e.includes("unrecognised key")),
  );

  r = validateManifest(
    [
      {
        name: "Bar Medal",
        ribbon: "ribbon.png",
        medal: "medal.png",
        replace: true,
      },
    ],
    CATALOG,
    dir,
    STEADY,
  );
  ok(
    "validate: all four allowed keys together still pass",
    r.errors.length === 0,
  );

  // --- spliceSheet: two new tiles interleave at their final catalog rows ---
  // Refutes the "multi-insert cascade" review claim: inserting ascending on the
  // growing buffer places each tile at its final position.
  const inter = path.join(dir, "inter.png");
  await makeSheet(inter, 43, 14, [
    [10, 0, 0],
    [20, 0, 0],
  ]); // P, Q at rows 0,1
  await spliceSheet(inter, [
    {
      y: 28,
      tileHeight: 14,
      png: await colorTile(43, 14, [200, 0, 0]),
      name: "B",
    },
    {
      y: 14,
      tileHeight: 14,
      png: await colorTile(43, 14, [100, 0, 0]),
      name: "A",
    },
  ]);
  assert.deepStrictEqual(await rowColor(inter, 0), [10, 0, 0]); // P
  assert.deepStrictEqual(await rowColor(inter, 14), [100, 0, 0]); // A
  assert.deepStrictEqual(await rowColor(inter, 28), [200, 0, 0]); // B
  assert.deepStrictEqual(await rowColor(inter, 42), [20, 0, 0]); // Q shifted
  ok("splice: two consecutive new tiles interleave as [P,A,B,Q]", true);

  // --- spliceSheet: append past a sub-tile-short sheet pads to exact row ---
  const appnd = path.join(dir, "appnd.png");
  await sharp({
    create: {
      width: 43,
      height: 27, // 14 + 13: mimics the 1px-short trailing remainder
      channels: 4,
      background: { r: 50, g: 50, b: 50, alpha: 255 },
    },
  })
    .png()
    .toFile(appnd);
  await spliceSheet(appnd, [
    {
      y: 28,
      tileHeight: 14,
      png: await colorTile(43, 14, [150, 0, 0]),
      name: "C",
    },
  ]);
  const appndMeta = await sharp(appnd).metadata();
  ok(
    "splice: append pads then places tile (height 27 -> 42)",
    appndMeta.height === 42,
  );
  assert.deepStrictEqual(await rowColor(appnd, 0), [50, 50, 50]);
  ok("splice: original content preserved before padded append", true);
  assert.deepStrictEqual(await rowColor(appnd, 28), [150, 0, 0]);
  ok("splice: appended tile lands at its exact catalog row y=28", true);

  // --- spliceSheet: ascending multi-insert, rows below unchanged ---
  const sheet = path.join(dir, "sheet.png");
  await makeSheet(sheet, 43, 14, [
    [10, 0, 0],
    [20, 0, 0],
    [30, 0, 0],
  ]); // 3 bands, 42px
  const tileA = await colorTile(43, 14, [100, 0, 0]);
  const tileB = await colorTile(43, 14, [200, 0, 0]);
  // Insert at catalog rows 1 (y=14) and 3 (y=42, append) — final layout.
  await spliceSheet(sheet, [
    { y: 42, tileHeight: 14, png: tileB, name: "B" },
    { y: 14, tileHeight: 14, png: tileA, name: "A" },
  ]);
  const meta = await sharp(sheet).metadata();
  ok("splice: height grew by two tiles (42 -> 70)", meta.height === 70);
  assert.deepStrictEqual(await rowColor(sheet, 0), [10, 0, 0]);
  ok("splice: row above first insert unchanged", true);
  assert.deepStrictEqual(await rowColor(sheet, 14), [100, 0, 0]);
  ok("splice: tile A landed at y=14", true);
  assert.deepStrictEqual(await rowColor(sheet, 28), [20, 0, 0]);
  ok("splice: original band 1 shifted down below insert A", true);
  assert.deepStrictEqual(await rowColor(sheet, 42), [200, 0, 0]);
  ok("splice: tile B landed at its final catalog row y=42", true);
  assert.deepStrictEqual(await rowColor(sheet, 56), [30, 0, 0]);
  ok("splice: original last band shifted down below both inserts", true);

  // --- spliceSheet: replace overwrites in place, no shift, no growth ---
  const repl = path.join(dir, "repl.png");
  await makeSheet(repl, 43, 14, [
    [10, 0, 0],
    [20, 0, 0],
    [30, 0, 0],
  ]); // rows 0,1,2 — 42px
  await spliceSheet(repl, [
    {
      y: 14,
      tileHeight: 14,
      png: await colorTile(43, 14, [99, 0, 0]),
      name: "R",
      replace: true,
    },
  ]);
  const replMeta = await sharp(repl).metadata();
  ok("splice(replace): height unchanged (42 -> 42)", replMeta.height === 42);
  assert.deepStrictEqual(await rowColor(repl, 0), [10, 0, 0]);
  ok("splice(replace): row above untouched", true);
  assert.deepStrictEqual(await rowColor(repl, 14), [99, 0, 0]);
  ok("splice(replace): target row overwritten in place", true);
  assert.deepStrictEqual(await rowColor(repl, 28), [30, 0, 0]);
  ok("splice(replace): row below NOT shifted", true);

  // --- spliceSheet: replace past the sheet end is rejected ---
  let replThrew = false;
  try {
    await spliceSheet(repl, [
      {
        y: 56,
        tileHeight: 14,
        png: await colorTile(43, 14, [1, 1, 1]),
        name: "R2",
        replace: true,
      },
    ]);
  } catch (e) {
    replThrew = e.message.includes("no existing tile to overwrite");
  }
  ok("splice(replace): replacing a nonexistent row throws", replThrew);

  // --- spliceSheet: replace into the partial final row (sub-tile remainder) ---
  // The bottom-most award lives in the sheet's leftover < tileHeight band — the
  // real ribbon sheet ends in a 13px remainder, so its last row is short of a
  // full tile (buildSplicedSheet's replace guard states the height and the sum).
  // A replace there must succeed: the guard gates on the row's start, and the
  // copy clamps to the bytes that exist. Two full 14px rows + a 13px remainder.
  const partial = path.join(dir, "partial.png");
  await sharp({
    create: {
      width: 43,
      height: 41,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: await colorTile(43, 14, [10, 0, 0]), top: 0, left: 0 },
      { input: await colorTile(43, 14, [20, 0, 0]), top: 14, left: 0 },
      { input: await colorTile(43, 13, [30, 0, 0]), top: 28, left: 0 }, // 13px
    ])
    .png()
    .toFile(partial);
  let partialThrew = false;
  try {
    await spliceSheet(partial, [
      {
        y: 28,
        tileHeight: 14,
        png: await colorTile(43, 14, [99, 0, 0]),
        name: "EAME Campaign Medal",
        replace: true,
      },
    ]);
  } catch (e) {
    partialThrew = true;
  }
  ok("splice(replace): partial final row is NOT rejected", !partialThrew);
  const partialMeta = await sharp(partial).metadata();
  ok(
    "splice(replace): partial-row replace leaves height unchanged (41 -> 41)",
    partialMeta.height === 41,
  );
  assert.deepStrictEqual(await rowColor(partial, 0), [10, 0, 0]);
  ok("splice(replace): row above partial final row untouched", true);
  assert.deepStrictEqual(await rowColor(partial, 14), [20, 0, 0]);
  ok("splice(replace): second row above partial final row untouched", true);
  assert.deepStrictEqual(await rowColor(partial, 28), [99, 0, 0]);
  ok("splice(replace): partial final row overwritten in place", true);

  // --- spliceSheet: mixing a replace and an insert in one call is rejected ---
  // The insert would shift the buffer out from under the replace's absolute
  // offset, landing it on the wrong row. Guard fires before any byte is touched.
  const mix = path.join(dir, "mix.png");
  await makeSheet(mix, 43, 14, [
    [10, 0, 0],
    [20, 0, 0],
    [30, 0, 0],
  ]);
  const mixBefore = fs.readFileSync(mix);
  let mixThrew = false;
  try {
    await spliceSheet(mix, [
      {
        y: 14,
        tileHeight: 14,
        png: await colorTile(43, 14, [1, 0, 0]),
        name: "ins",
      },
      {
        y: 28,
        tileHeight: 14,
        png: await colorTile(43, 14, [2, 0, 0]),
        name: "rep",
        replace: true,
      },
    ]);
  } catch (e) {
    mixThrew = e.message.includes("mix a replace and an insert");
  }
  ok("splice: mixing a replace and an insert throws", mixThrew);
  ok(
    "splice: sheet untouched after a rejected replace+insert mix",
    mixBefore.equals(fs.readFileSync(mix)),
  );

  // --- run: no-op manifest leaves sheets byte-identical ---
  // Its own directory, because "empty manifest" now also asserts that the
  // upload folder holds no art nobody claimed, and the shared fixture dir is
  // full of PNGs left there for the validateManifest cases.
  const noopPaths = makeScratch("emptymanifest");
  await makeSheet(noopPaths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
  ]);
  await makeSheet(noopPaths.medalSheet, 70, 120, [
    [0, 1, 0],
    [0, 2, 0],
  ]);
  const ribBefore = fs.readFileSync(noopPaths.ribbonSheet);
  const medBefore = fs.readFileSync(noopPaths.medalSheet);
  fs.writeFileSync(noopPaths.manifest, "[]\n");
  const noop = await run(noopPaths, silent());
  ok("run: empty manifest processes nothing", noop.processed === 0);
  ok(
    "run: ribbon sheet byte-identical after no-op",
    ribBefore.equals(fs.readFileSync(noopPaths.ribbonSheet)),
  );
  ok(
    "run: medal sheet byte-identical after no-op",
    medBefore.equals(fs.readFileSync(noopPaths.medalSheet)),
  );

  const paths = makePaths(dir);

  // --- run: full service-ribbon insert into both sheets ---
  // Baz is awardPriority 4 (ribbon y=56) and medalPriority 3 (medal y=120),
  // so the sheets must be tall enough to splice mid-sequence. Six ribbon rows
  // and two medal rows are what the catalog claims minus this run's one insert
  // per sheet — the state a contributor is in having just added Baz.
  await makeSheet(paths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
    [4, 0, 0],
    [5, 0, 0],
    [6, 0, 0],
  ]);
  await makeSheet(paths.medalSheet, 70, 120, [
    [0, 1, 0],
    [0, 2, 0],
  ]);
  fs.writeFileSync(
    path.join(dir, "rib2.png"),
    await colorTile(43, 13, [7, 7, 7]),
  );
  fs.writeFileSync(
    path.join(dir, "med2.png"),
    await colorTile(72, 148, [7, 7, 7]),
  );
  fs.writeFileSync(
    paths.manifest,
    JSON.stringify(
      [
        {
          name: 'Baz "Q" Service Ribbon',
          ribbon: "rib2.png",
          medal: "med2.png",
        },
      ],
      null,
      2,
    ) + "\n",
  );
  const ribH0 = (await sharp(paths.ribbonSheet).metadata()).height;
  const medH0 = (await sharp(paths.medalSheet).metadata()).height;
  const res = await run(paths, silent());
  ok("run: processed one award", res.processed === 1);
  ok(
    "run: ribbon sheet grew by one 14px tile",
    (await sharp(paths.ribbonSheet).metadata()).height === ribH0 + 14,
  );
  ok(
    "run: medal sheet grew by one 120px tile",
    (await sharp(paths.medalSheet).metadata()).height === medH0 + 120,
  );
  ok(
    "run: source PNGs removed",
    !fs.existsSync(path.join(dir, "rib2.png")) &&
      !fs.existsSync(path.join(dir, "med2.png")),
  );
  ok(
    "run: manifest emptied",
    fs.readFileSync(paths.manifest, "utf8") === "[]\n",
  );

  // --- run: validation failure writes nothing ---
  await makeSheet(paths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
  ]);
  const ribGuard = fs.readFileSync(paths.ribbonSheet);
  fs.writeFileSync(
    paths.manifest,
    JSON.stringify([{ name: "Ghost", ribbon: "rib2.png" }], null, 2) + "\n",
  );
  let threw = false;
  try {
    await run(paths, silent());
  } catch (e) {
    threw = true;
  }
  ok("run: invalid manifest throws", threw);
  ok(
    "run: sheet untouched after validation failure",
    ribGuard.equals(fs.readFileSync(paths.ribbonSheet)),
  );

  // --- run: replace:true overwrites both tiles in place without growing ---
  // Bar Medal: ribbon y=28 (priority 2), medal y=0 (priority 2). Sheets hold
  // every row the catalog claims, which is what a replace requires: the rows
  // already exist, and overwriting one must not change the height.
  await makeSheet(paths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
    [4, 0, 0],
    [5, 0, 0],
    [6, 0, 0],
    [7, 0, 0],
  ]);
  await makeSheet(paths.medalSheet, 70, 120, [
    [0, 1, 0],
    [0, 2, 0],
    [0, 3, 0],
  ]);
  fs.writeFileSync(
    path.join(dir, "rR.png"),
    await colorTile(43, 13, [8, 8, 8]),
  );
  fs.writeFileSync(
    path.join(dir, "mR.png"),
    await colorTile(72, 148, [8, 8, 8]),
  );
  fs.writeFileSync(
    paths.manifest,
    JSON.stringify(
      [{ name: "Bar Medal", ribbon: "rR.png", medal: "mR.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  const ribHR = (await sharp(paths.ribbonSheet).metadata()).height;
  const medHR = (await sharp(paths.medalSheet).metadata()).height;
  await run(paths, silent());
  ok(
    "run(replace): ribbon sheet height unchanged",
    (await sharp(paths.ribbonSheet).metadata()).height === ribHR,
  );
  ok(
    "run(replace): medal sheet height unchanged",
    (await sharp(paths.medalSheet).metadata()).height === medHR,
  );

  // --- run: a typo'd replace key aborts instead of turning into an insert ---
  // The damaging shape: the operator asked to overwrite one tile, and a single
  // misspelled key would instead insert on BOTH sheets, pushing every award
  // below down one row so each renders as its neighbour — with no diagnostic.
  await makeSheet(paths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
  ]);
  await makeSheet(paths.medalSheet, 70, 120, [
    [0, 1, 0],
    [0, 2, 0],
  ]);
  fs.writeFileSync(
    path.join(dir, "rT.png"),
    await colorTile(43, 13, [6, 6, 6]),
  );
  fs.writeFileSync(
    path.join(dir, "mT.png"),
    await colorTile(72, 148, [6, 6, 6]),
  );
  fs.writeFileSync(
    paths.manifest,
    JSON.stringify(
      [
        {
          name: "Bar Medal",
          ribbon: "rT.png",
          medal: "mT.png",
          replaced: true,
        },
      ],
      null,
      2,
    ) + "\n",
  );
  const ribHT = (await sharp(paths.ribbonSheet).metadata()).height;
  const medHT = (await sharp(paths.medalSheet).metadata()).height;
  let typoThrew = false;
  try {
    await run(paths, silent());
  } catch (e) {
    typoThrew = true;
  }
  ok("run(typo): unrecognised key aborts the run", typoThrew);
  ok(
    "run(typo): ribbon sheet not grown by a mistaken insert",
    (await sharp(paths.ribbonSheet).metadata()).height === ribHT,
  );
  ok(
    "run(typo): medal sheet not grown by a mistaken insert",
    (await sharp(paths.medalSheet).metadata()).height === medHT,
  );
  ok(
    "run(typo): sources kept for a retry, not consumed",
    fs.existsSync(path.join(dir, "rT.png")) &&
      fs.existsSync(path.join(dir, "mT.png")),
  );
  ok(
    "run(typo): manifest entry retained, not emptied",
    JSON.parse(fs.readFileSync(paths.manifest, "utf8")).length === 1,
  );

  // --- run: a source for a non-member sheet aborts, consuming nothing ---
  // The whole danger of this tool is that it deletes its inputs and CI opens a
  // PR on success, so a run that places one of two tiles and still exits 0
  // destroys the evidence that anything was missed. Assert at the run() seam,
  // not just validateManifest: the error is only worth anything if it actually
  // reaches the caller before a sheet is written or a source is unlinked.
  await makeSheet(paths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
  ]);
  await makeSheet(paths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(dir, "rib3.png"),
    await colorTile(43, 13, [7, 7, 7]),
  );
  fs.writeFileSync(
    path.join(dir, "extra.png"),
    await colorTile(72, 148, [7, 7, 7]),
  );
  fs.writeFileSync(
    paths.manifest,
    JSON.stringify(
      [{ name: "Foo Ribbon", ribbon: "rib3.png", medal: "extra.png" }],
      null,
      2,
    ) + "\n",
  );
  const ribGuardHalf = fs.readFileSync(paths.ribbonSheet);
  let halfThrew = false;
  try {
    await run(paths, silent());
  } catch (e) {
    halfThrew = true;
  }
  ok("run(half-placed): a source for a non-member sheet aborts", halfThrew);
  ok(
    "run(half-placed): the placeable ribbon tile was not spliced in anyway",
    ribGuardHalf.equals(fs.readFileSync(paths.ribbonSheet)),
  );
  ok(
    "run(half-placed): both sources kept for a retry",
    fs.existsSync(path.join(dir, "rib3.png")) &&
      fs.existsSync(path.join(dir, "extra.png")),
  );
  ok(
    "run(half-placed): manifest entry retained, not emptied",
    JSON.parse(fs.readFileSync(paths.manifest, "utf8")).length === 1,
  );

  // --- run: one bad entry aborts the whole manifest, not just itself ---
  // Validation runs over every entry before any splice, so a good entry sharing
  // the manifest with a bad one must not be half-applied. Pinned at the run()
  // seam because that is the property worth keeping if entry handling ever
  // moves closer to per-entry processing: partial application is what makes
  // this tool dangerous, since the sources that prove it are deleted.
  await makeSheet(paths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
  ]);
  await makeSheet(paths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(dir, "good.png"),
    await colorTile(43, 13, [5, 5, 5]),
  );
  fs.writeFileSync(
    path.join(dir, "bad.png"),
    await colorTile(43, 13, [4, 4, 4]),
  );
  fs.writeFileSync(
    path.join(dir, "badMedal.png"),
    await colorTile(72, 148, [4, 4, 4]),
  );
  fs.writeFileSync(
    paths.manifest,
    JSON.stringify(
      [
        { name: "Foo Ribbon", ribbon: "good.png" },
        // Lifetime Medal is medalPriority 0, so it has no medal tile.
        { name: "Lifetime Medal", ribbon: "bad.png", medal: "badMedal.png" },
      ],
      null,
      2,
    ) + "\n",
  );
  const ribGuardMulti = fs.readFileSync(paths.ribbonSheet);
  let multiThrew = false;
  try {
    await run(paths, silent());
  } catch (e) {
    multiThrew = true;
  }
  ok("run(multi): one bad entry aborts the run", multiThrew);
  ok(
    "run(multi): the good entry's tile was not spliced in",
    ribGuardMulti.equals(fs.readFileSync(paths.ribbonSheet)),
  );
  ok(
    "run(multi): the good entry's source is not consumed",
    fs.existsSync(path.join(dir, "good.png")),
  );
  ok(
    "run(multi): both manifest entries retained",
    JSON.parse(fs.readFileSync(paths.manifest, "utf8")).length === 2,
  );

  // --- run: medal geometry still warns, and the warning reaches the log ---
  // The medal normalizer resizes with fit:"inside", so an odd aspect costs
  // transparent margin rather than the art itself, which is a warning and not an
  // error. It is also the only thing left filling result.warnings, since the
  // ribbon side throws and validateManifest no longer produces warnings.
  // Unexercised, that channel would rot.
  await makeSheet(paths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
    [4, 0, 0],
    [5, 0, 0],
    [6, 0, 0],
    [7, 0, 0],
  ]);
  await makeSheet(paths.medalSheet, 70, 120, [
    [0, 1, 0],
    [0, 2, 0],
    [0, 3, 0],
  ]);
  fs.writeFileSync(
    path.join(dir, "wideR.png"),
    await colorTile(43, 13, [3, 3, 3]),
  );
  fs.writeFileSync(
    path.join(dir, "wideM.png"),
    await colorTile(140, 120, [3, 3, 3]),
  );
  fs.writeFileSync(
    paths.manifest,
    JSON.stringify(
      [
        {
          name: "Bar Medal",
          ribbon: "wideR.png",
          medal: "wideM.png",
          replace: true,
        },
      ],
      null,
      2,
    ) + "\n",
  );
  const warned = [];
  const spy = {
    log() {},
    warn(m) {
      warned.push(m);
    },
    error() {},
  };
  const oddResult = await run(paths, spy);
  ok(
    "run(warnings): a wide medal source is reported, not silently letterboxed",
    oddResult.warnings.some((w) => w.includes("70x60")),
  );
  ok(
    "run(warnings): the warning reaches the log too",
    warned.some((w) => w.includes("70x60")),
  );

  // --- run: THE BUG. An occupied row, uploaded without `replace` ---
  // A contributor re-uploading fixed art for an award that already has a tile,
  // who simply forgets the flag. It needs no typo and no catalog mistake, and
  // it reached the same corruption as the misspelled `replace` key: a tile
  // inserted rather than overwritten, pushing every row below it down one, on
  // both sheets, exiting 0 with the sources deleted and the manifest emptied.
  //
  // Occupancy alone cannot catch it — inserting onto a taken row and renumbering
  // below is the documented way to ADD an award, so the corrupting case and the
  // intended one land on the same row. What separates them is whether the
  // catalog grew to account for the new row, which is what is asserted here:
  // the sheets already hold every row the catalog claims, so there is no room
  // for an insert.
  const occ = makeScratch("occupied", CATALOG_ENTRIES);
  for (const flag of [undefined, false]) {
    await makeSheet(occ.ribbonSheet, 43, 14, [
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [5, 0, 0],
      [6, 0, 0],
      [7, 0, 0],
    ]);
    await makeSheet(occ.medalSheet, 70, 120, [
      [0, 1, 0],
      [0, 2, 0],
      [0, 3, 0],
    ]);
    fs.writeFileSync(
      path.join(occ.uploadDir, "oR.png"),
      await colorTile(43, 13, [9, 9, 9]),
    );
    fs.writeFileSync(
      path.join(occ.uploadDir, "oM.png"),
      await colorTile(70, 120, [9, 9, 9]),
    );
    const entry = { name: "Bar Medal", ribbon: "oR.png", medal: "oM.png" };
    if (flag !== undefined) entry.replace = flag;
    fs.writeFileSync(occ.manifest, JSON.stringify([entry], null, 2) + "\n");
    const ribGuardOcc = fs.readFileSync(occ.ribbonSheet);
    const medGuardOcc = fs.readFileSync(occ.medalSheet);
    const occLog = collecting();
    let occThrew = false;
    try {
      await run(occ, occLog);
    } catch (e) {
      occThrew = true;
    }
    // `replace: false` written out is the same defect reached deliberately, and
    // is why requiring the key explicitly would not have been a fix on its own.
    const how = flag === undefined ? "omitted" : "false";
    ok(`run(occupied/${how}): an insert onto a full sheet aborts`, occThrew);
    // The diagnostic IS the fix here: swapping the two reconciliation messages
    // used to pass, so a contributor could be told to renumber when what they
    // needed was the flag.
    ok(
      `run(occupied/${how}): both sheets are named and the advice is to set replace`,
      ["ribbon", "medal"].every((kind) =>
        occLog.errors.some(
          (e) =>
            e.includes(`the ${kind} sheet has`) &&
            e.includes('set "replace": true'),
        ),
      ),
    );
    ok(
      `run(occupied/${how}): ribbon sheet byte-identical`,
      ribGuardOcc.equals(fs.readFileSync(occ.ribbonSheet)),
    );
    ok(
      `run(occupied/${how}): medal sheet byte-identical`,
      medGuardOcc.equals(fs.readFileSync(occ.medalSheet)),
    );
    ok(
      `run(occupied/${how}): both sources kept for a retry`,
      fs.existsSync(path.join(occ.uploadDir, "oR.png")) &&
        fs.existsSync(path.join(occ.uploadDir, "oM.png")),
    );
    ok(
      `run(occupied/${how}): manifest entry retained`,
      JSON.parse(fs.readFileSync(occ.manifest, "utf8")).length === 1,
    );
  }

  // --- run: the control. A legitimate MID-SHEET insert still shifts ---
  // The half of the rule that is easy to break: the fix must not turn every
  // insert into an error. Bar Medal sits at ribbon row 2 with rows below it,
  // and the catalog claims one more row than the sheet holds — a contributor
  // who added an award and renumbered. The tile goes in at row 2 and the old
  // occupant moves down to row 3.
  const mid = makeScratch("midsheet", CATALOG_ENTRIES);
  await makeSheet(mid.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
    [4, 0, 0],
    [5, 0, 0],
    [6, 0, 0],
  ]);
  await makeSheet(mid.medalSheet, 70, 120, [
    [0, 1, 0],
    [0, 2, 0],
  ]);
  fs.writeFileSync(
    path.join(mid.uploadDir, "mR.png"),
    await colorTile(43, 13, [77, 0, 0]),
  );
  fs.writeFileSync(
    path.join(mid.uploadDir, "mM.png"),
    await colorTile(70, 120, [0, 77, 0]),
  );
  fs.writeFileSync(
    mid.manifest,
    JSON.stringify(
      [{ name: "Bar Medal", ribbon: "mR.png", medal: "mM.png" }],
      null,
      2,
    ) + "\n",
  );
  const midRes = await run(mid, silent());
  ok(
    "run(mid-sheet): a legitimate mid-sheet insert is not blocked",
    midRes.processed === 1,
  );
  ok(
    "run(mid-sheet): ribbon sheet grew by one tile",
    midRes.ribbonResult.height === 98,
  );
  assert.deepStrictEqual(await rowColor(mid.ribbonSheet, 28), [77, 0, 0]);
  ok("run(mid-sheet): the new tile landed on its catalog row", true);
  assert.deepStrictEqual(await rowColor(mid.ribbonSheet, 42), [3, 0, 0]);
  ok("run(mid-sheet): the row it displaced moved down one tile", true);

  // --- run: the other control. A new bottom-most award still appends ---
  const app = makeScratch("append", [
    { name: "First Ribbon", awardPriority: 0, awardType: "Ribbon" },
    { name: "Second Ribbon", awardPriority: 1, awardType: "Ribbon" },
  ]);
  await makeSheet(app.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(app.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(app.uploadDir, "aR.png"),
    await colorTile(43, 13, [55, 0, 0]),
  );
  fs.writeFileSync(
    app.manifest,
    JSON.stringify([{ name: "Second Ribbon", ribbon: "aR.png" }], null, 2) +
      "\n",
  );
  const appRes = await run(app, silent());
  ok(
    "run(append): a new bottom-most award still appends",
    appRes.ribbonResult.height === 28,
  );

  // --- run: a catalog with a hole in its numbering aborts ---
  // The sheet is read at row * tileHeight, so a missing priority is not a
  // cosmetic gap: it is a blank row that every award below it renders across.
  const gap = makeScratch("gap", [
    { name: "Zero Ribbon", awardPriority: 0, awardType: "Ribbon" },
    { name: "Two Ribbon", awardPriority: 2, awardType: "Ribbon" },
  ]);
  // One row, deliberately: the catalog holds 2 awards spanning 3 rows, so this
  // is the one sheet size at which the reconciliation is satisfied (2 awards ==
  // 1 row + 1 insert) and contiguity is the only check left that can fail.
  // Sized any other way the case aborts on the reconciliation instead and
  // passes while saying nothing about gaps — which is exactly what it did until
  // mutation testing caught it.
  await makeSheet(gap.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(gap.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(gap.uploadDir, "gR.png"),
    await colorTile(43, 13, [4, 4, 4]),
  );
  fs.writeFileSync(
    gap.manifest,
    JSON.stringify([{ name: "Two Ribbon", ribbon: "gR.png" }], null, 2) + "\n",
  );
  const gapGuard = fs.readFileSync(gap.ribbonSheet);
  const gapLog = collecting();
  let gapThrew = false;
  try {
    await run(gap, gapLog);
  } catch (e) {
    gapThrew = true;
  }
  ok("run(gap): a hole in the numbering aborts the run", gapThrew);
  ok(
    "run(gap): the diagnostic names the missing priority",
    gapLog.errors.some((e) => e.includes("no award claims awardPriority 1")),
  );
  ok(
    "run(gap): the sheet is left untouched",
    gapGuard.equals(fs.readFileSync(gap.ribbonSheet)),
  );
  ok(
    "run(gap): the source is kept for a retry",
    fs.existsSync(path.join(gap.uploadDir, "gR.png")),
  );

  // --- run: a priority claimed twice aborts, even when the totals balance ---
  // The check this replaced compared the number of awards against the highest
  // row index, which is not a contiguity test: a priority claimed twice and a
  // priority claimed by nobody cancel out. Rows [0, 1, 1, 3] counted four
  // awards across four rows and passed, so the run spliced onto row 1, left
  // row 2 blank, deleted the sources and exited 0. That is the corruption this
  // whole file exists to prevent, reached through the renumbering step the
  // README tells contributors to perform by hand.
  // Duplicate with NO hole, so the repeat is the only thing that can fail:
  // rows [0, 1, 1] leave nothing missing, and 3 awards against a 2-row sheet
  // plus this run's 1 insert reconciles exactly. Sized any other way the case
  // would abort on the hole or the reconciliation and prove nothing about
  // duplicates, which is what the first version of it did.
  const dupe = makeScratch("duplicate", [
    { name: "Zero", awardPriority: 0, awardType: "Ribbon" },
    { name: "One", awardPriority: 1, awardType: "Ribbon" },
    { name: "AlsoOne", awardPriority: 1, awardType: "Ribbon" },
  ]);
  ok(
    "catalogSheetRows: a duplicate and a hole no longer cancel out",
    catalogSheetRows(
      indexCatalog([
        { name: "Zero", awardPriority: 0, awardType: "Ribbon" },
        { name: "One", awardPriority: 1, awardType: "Ribbon" },
        { name: "AlsoOne", awardPriority: 1, awardType: "Ribbon" },
        { name: "Three", awardPriority: 3, awardType: "Ribbon" },
      ]),
      "ribbon",
    ).duplicated.length === 1,
  );
  await makeSheet(dupe.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
  ]);
  await makeSheet(dupe.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(dupe.uploadDir, "dR.png"),
    await colorTile(43, 13, [4, 4, 4]),
  );
  fs.writeFileSync(
    dupe.manifest,
    JSON.stringify([{ name: "AlsoOne", ribbon: "dR.png" }], null, 2) + "\n",
  );
  const dupeGuard = fs.readFileSync(dupe.ribbonSheet);
  const dupeLog = collecting();
  let dupeThrew = false;
  try {
    await run(dupe, dupeLog);
  } catch (e) {
    dupeThrew = true;
  }
  ok("run(duplicate): a priority claimed twice aborts the run", dupeThrew);
  ok(
    "run(duplicate): the diagnostic names the repeat, and does not invent a hole",
    dupeLog.errors.some((e) =>
      e.includes("awardPriority 1 is claimed by more than one award"),
    ) && !dupeLog.errors.some((e) => e.includes("no award claims")),
  );
  ok(
    "run(duplicate): the sheet is left untouched",
    dupeGuard.equals(fs.readFileSync(dupe.ribbonSheet)),
  );
  ok(
    "run(duplicate): the source is kept for a retry",
    fs.existsSync(path.join(dupe.uploadDir, "dR.png")),
  );

  // --- run: two inserts on one sheet in one upload ---
  // The reconciliation adds the run's insert COUNT to the sheet's rows, and
  // until this existed that count was only ever 1, so `inserts = 1` in place of
  // `inserts += 1` passed the whole suite. Getting it wrong in that direction
  // rejects a legitimate two-award upload; getting it wrong the other way lets
  // a run insert more tiles than the catalog accounts for, shifting everything
  // below the second one.
  const two = makeScratch("two-inserts", [
    { name: "Keep", awardPriority: 0, awardType: "Ribbon" },
    { name: "AddOne", awardPriority: 1, awardType: "Ribbon" },
    { name: "AddTwo", awardPriority: 2, awardType: "Ribbon" },
    { name: "Below", awardPriority: 3, awardType: "Ribbon" },
  ]);
  await makeSheet(two.ribbonSheet, 43, 14, [
    [11, 0, 0],
    [22, 0, 0],
  ]);
  await makeSheet(two.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(two.uploadDir, "t1.png"),
    await colorTile(43, 13, [91, 0, 0]),
  );
  fs.writeFileSync(
    path.join(two.uploadDir, "t2.png"),
    await colorTile(43, 13, [92, 0, 0]),
  );
  fs.writeFileSync(
    two.manifest,
    JSON.stringify(
      [
        { name: "AddOne", ribbon: "t1.png" },
        { name: "AddTwo", ribbon: "t2.png" },
      ],
      null,
      2,
    ) + "\n",
  );
  const twoRes = await run(two, silent());
  ok("run(two inserts): both entries processed", twoRes.processed === 2);
  ok(
    "run(two inserts): sheet grew by exactly two tiles",
    twoRes.ribbonResult.height === 56,
  );
  assert.deepStrictEqual(await rowColor(two.ribbonSheet, 0), [11, 0, 0]);
  assert.deepStrictEqual(await rowColor(two.ribbonSheet, 14), [91, 0, 0]);
  assert.deepStrictEqual(await rowColor(two.ribbonSheet, 28), [92, 0, 0]);
  assert.deepStrictEqual(await rowColor(two.ribbonSheet, 42), [22, 0, 0]);
  ok(
    "run(two inserts): both tiles landed on their catalog rows, displacing the rest",
    true,
  );

  // --- run: the medal sheet is spliced at the right row, checked by pixel ---
  // Every other medal assertion reads a height, and height is blind to any row
  // error that lands inside the sheet. Forcing every medal tile to row 0, or
  // one row too low, left the suite green: in production that is every medal
  // rendering as the award below it, sources deleted, exit 0.
  const medal = makeScratch("medal-row", [
    {
      name: "First Medal",
      awardPriority: 0,
      medalPriority: 2,
      awardType: "Medal",
    },
    {
      name: "Second Medal",
      awardPriority: 1,
      medalPriority: 3,
      awardType: "Medal",
    },
    {
      name: "Third Medal",
      awardPriority: 2,
      medalPriority: 4,
      awardType: "Medal",
    },
  ]);
  await makeSheet(medal.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
  ]);
  await makeSheet(medal.medalSheet, 70, 120, [
    [0, 11, 0],
    [0, 22, 0],
  ]);
  fs.writeFileSync(
    path.join(medal.uploadDir, "mr.png"),
    await colorTile(43, 13, [5, 5, 5]),
  );
  fs.writeFileSync(
    path.join(medal.uploadDir, "mm.png"),
    await colorTile(70, 120, [0, 99, 0]),
  );
  fs.writeFileSync(
    medal.manifest,
    JSON.stringify(
      [{ name: "Second Medal", ribbon: "mr.png", medal: "mm.png" }],
      null,
      2,
    ) + "\n",
  );
  const medalRes = await run(medal, silent());
  ok(
    "run(medal row): medal sheet grew by one 120px tile",
    medalRes.medalResult.height === 360,
  );
  assert.deepStrictEqual(await rowColor(medal.medalSheet, 0), [0, 11, 0]);
  assert.deepStrictEqual(await rowColor(medal.medalSheet, 120), [0, 99, 0]);
  assert.deepStrictEqual(await rowColor(medal.medalSheet, 240), [0, 22, 0]);
  ok(
    "run(medal row): the tile landed on medalPriority 3's row, displacing the row below",
    true,
  );

  // --- run: the reconciliation covers the medal sheet, not just the ribbon ---
  // Every reconciliation failure above trips on the ribbon side, so skipping
  // the medal sheet entirely passed the suite. Here the ribbon side is exactly
  // consistent and only the medal side is not.
  const medalOnly = makeScratch("medal-reconcile", [
    { name: "Rib", awardPriority: 0, awardType: "Ribbon" },
    { name: "Med", awardPriority: 1, medalPriority: 2, awardType: "Medal" },
  ]);
  // Ribbon: 2 awards, 1 row, 1 insert -> consistent. Medal: 1 award, 1 row,
  // 1 insert -> the catalog would need 2, so only the medal side can fail.
  await makeSheet(medalOnly.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(medalOnly.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(medalOnly.uploadDir, "mo.png"),
    await colorTile(43, 13, [6, 6, 6]),
  );
  fs.writeFileSync(
    path.join(medalOnly.uploadDir, "mo2.png"),
    await colorTile(70, 120, [0, 6, 0]),
  );
  fs.writeFileSync(
    medalOnly.manifest,
    JSON.stringify(
      [{ name: "Med", ribbon: "mo.png", medal: "mo2.png" }],
      null,
      2,
    ) + "\n",
  );
  const medalOnlyLog = collecting();
  let medalOnlyThrew = false;
  try {
    await run(medalOnly, medalOnlyLog);
  } catch (e) {
    medalOnlyThrew = true;
  }
  ok(
    "run(medal reconcile): the medal sheet is reconciled independently of the ribbon",
    medalOnlyThrew,
  );
  ok(
    "run(medal reconcile): the diagnostic names the medal sheet, not the ribbon",
    medalOnlyLog.errors.some((e) =>
      e.includes("the medal sheet has 1 row(s)"),
    ) && !medalOnlyLog.errors.some((e) => e.includes("the ribbon sheet has")),
  );

  // --- run: a flattened medal source aborts rather than filling the tile ---
  // Medal art is composited onto full transparency, so a source saved without
  // an alpha channel covers all 70x120 with a solid rectangle and hides the
  // medals either side of it. readSheet asserts the same thing on the sheets;
  // the input side matters more, because the input is the copy that is deleted.
  const flat = makeScratch("flattened", [
    {
      name: "Flat Medal",
      awardPriority: 0,
      medalPriority: 2,
      awardType: "Medal",
    },
  ]);
  await makeSheet(flat.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(flat.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(flat.uploadDir, "fR.png"),
    await colorTile(43, 13, [8, 8, 8]),
  );
  fs.writeFileSync(
    path.join(flat.uploadDir, "fM.png"),
    await sharp(Buffer.alloc(70 * 120 * 3, 200), {
      raw: { width: 70, height: 120, channels: 3 },
    })
      .png()
      .toBuffer(),
  );
  fs.writeFileSync(
    flat.manifest,
    JSON.stringify(
      [
        {
          name: "Flat Medal",
          ribbon: "fR.png",
          medal: "fM.png",
          replace: true,
        },
      ],
      null,
      2,
    ) + "\n",
  );
  const flatGuard = fs.readFileSync(flat.medalSheet);
  let flatErr = "";
  try {
    await run(flat, silent());
  } catch (e) {
    flatErr = e.message;
  }
  ok(
    "run(flattened): a medal source with no alpha channel aborts",
    flatErr.includes("no alpha channel"),
  );
  ok(
    "run(flattened): the medal sheet is untouched and the source kept",
    flatGuard.equals(fs.readFileSync(flat.medalSheet)) &&
      fs.existsSync(path.join(flat.uploadDir, "fM.png")),
  );

  // --- validate: the replace side of the reconciliation ---
  // Deleting the whole `inserts === 0` branch passed the suite: every replace
  // fixture had a catalog and sheet that already agreed, so it never fired.
  const replaceDrift = validateManifest(
    [{ name: "Foo Ribbon", ribbon: "ribbon.png", replace: true }],
    CATALOG,
    dir,
    { ribbon: STEADY.ribbon - 1, medal: STEADY.medal },
  );
  ok(
    "validate(replace drift): a replace against a short sheet errors",
    replaceDrift.errors.some((e) =>
      e.includes("a replace overwrites a tile in place"),
    ),
  );
  ok(
    "validate(replace drift): the message does not prescribe splitting the upload",
    !replaceDrift.errors.some((e) => e.includes("separate uploads")),
  );

  // --- validate: sheetRows is required, and must be usable row counts ---
  // A caller bug, so it throws rather than reporting a manifest error. NaN is
  // the case worth pinning: an undecodable sheet makes sheetRowCount return
  // NaN, which is a number, and it used to surface as "the catalog must place
  // NaN award(s) on it" — a tool failure blamed on the contributor.
  assert.throws(
    () => validateManifest([], CATALOG, dir),
    /sheetRows/,
    "omitted sheetRows must throw",
  );
  assert.throws(
    () => validateManifest([], CATALOG, dir, { ribbon: NaN, medal: 3 }),
    /ribbon=NaN/,
    "NaN row count must throw and name the sheet",
  );
  ok("validate: sheetRows must be present and integral", true);

  // --- validate: every clause of the source-filename rule ---
  // Reducing isPlainPngName to its basename clause passed the suite, because
  // the only fixture was "../outsider.png". The backslash clause is the one
  // that matters on the Linux runner: path.basename does not split on \ under
  // POSIX, so "..\x.png" would arrive as a literal filename.
  [
    // Deliberately not "..\\escape.png": that starts with a dot, so the
    // leading-dot clause rejects it and the backslash clause is never reached.
    ["sub\\art.png", "a backslash path"],
    [".hidden.png", "a leading dot"],
    ["art.jpg", "a non-png extension"],
    ["sub/art.png", "a subdirectory"],
  ].forEach(([name, label]) => {
    const r = validateManifest(
      [{ name: "Foo Ribbon", ribbon: name }],
      CATALOG,
      dir,
      inserting(1),
    );
    ok(
      `validate: ${label} is rejected as a source filename`,
      r.errors.some((e) => e.includes("must be a plain")),
    );
  });

  // --- run: a manifest written as a bare object is reported, not skipped ---
  // `!Array.isArray(m) || m.length === 0` collapsed "not a list" into "nothing
  // to do", so an object written where a one-element array was meant exited 0
  // saying the manifest was empty, and validateManifest's own "must be a JSON
  // array" error was unreachable from run().
  const bare = makeScratch("bare", CATALOG_ENTRIES);
  await makeSheet(bare.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(bare.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(bare.uploadDir, "bR.png"),
    await colorTile(43, 13, [4, 4, 4]),
  );
  fs.writeFileSync(
    bare.manifest,
    JSON.stringify({ name: "Foo Ribbon", ribbon: "bR.png" }, null, 2) + "\n",
  );
  const bareLog = collecting();
  let bareThrew = false;
  try {
    await run(bare, bareLog);
  } catch (e) {
    bareThrew = true;
  }
  ok(
    "run(bare object): a non-array manifest aborts rather than exiting 0",
    bareThrew,
  );
  ok(
    "run(bare object): the diagnostic says the manifest must be an array",
    bareLog.errors.some((e) => e.includes("must be a JSON array")),
  );

  // --- run: a source name that escapes the upload directory aborts ---
  // The value is joined to uploadDir, spliced, and then unlinked, so a path
  // that climbs out would consume a file elsewhere in the repo.
  const esc = makeScratch("escape", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  await makeSheet(esc.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(esc.medalSheet, 70, 120, [[0, 1, 0]]);
  const outsider = path.join(esc.uploadDir, "..", "outsider.png");
  fs.writeFileSync(outsider, await colorTile(43, 13, [4, 4, 4]));
  fs.writeFileSync(
    esc.manifest,
    JSON.stringify(
      [{ name: "Only Ribbon", ribbon: "../outsider.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  let escThrew = false;
  try {
    await run(esc, silent());
  } catch (e) {
    escThrew = true;
  }
  ok(
    "run(escape): a source name climbing out of the upload dir aborts",
    escThrew,
  );
  ok(
    "run(escape): the file it pointed at was not consumed",
    fs.existsSync(outsider),
  );
  fs.unlinkSync(outsider);

  // --- run: a ribbon source of the wrong shape aborts, rather than stretching ---
  // The ribbon resize is fit:"fill". A 512x512 source does not come out
  // imperfect, it comes out as 43x14 of mush — and the only copy is deleted.
  const geo = makeScratch("geometry", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  await makeSheet(geo.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(geo.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(geo.uploadDir, "sq.png"),
    await colorTile(512, 512, [4, 4, 4]),
  );
  fs.writeFileSync(
    geo.manifest,
    JSON.stringify(
      [{ name: "Only Ribbon", ribbon: "sq.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  let geoErr = "";
  try {
    await run(geo, silent());
  } catch (e) {
    geoErr = e.message;
  }
  ok(
    "run(geometry): a 512x512 ribbon source aborts",
    geoErr.includes("512x512"),
  );
  ok(
    "run(geometry): the source is kept for a retry",
    fs.existsSync(path.join(geo.uploadDir, "sq.png")),
  );

  // A source already at tile size used to WARN, which is a false positive — and
  // a warning block that cries wolf is one reviewers learn to skim.
  const tile = makeScratch("tilesize", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  await makeSheet(tile.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(tile.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(tile.uploadDir, "exact.png"),
    await colorTile(43, 14, [4, 4, 4]),
  );
  fs.writeFileSync(
    tile.manifest,
    JSON.stringify(
      [{ name: "Only Ribbon", ribbon: "exact.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  const tileRes = await run(tile, silent());
  ok(
    "run(geometry): an already-tile-sized 43x14 source passes without warning",
    tileRes.warnings.length === 0,
  );

  // --- run: the gap line ---
  // Every hand-made tile on the real sheet is 13 lines of ribbon over one
  // transparent line, and that line is the gap the rack shows between ribbons.
  // A 43x13 source is the ribbon alone, so it has to land on the top 13 lines
  // with the 14th left clear; stretching it to 14 (which is what fit:"fill"
  // does on its own) paints over the gap and the ribbon touches the one below.
  // A 43x14 source already carries its own 14th line and is used as it is.
  // Each case replaces row 0 of a one-row sheet seeded [1,0,0] with a source
  // of a different colour, so the seed and the source are told apart on
  // every line. readSheet only ever returns RGBA.
  const alphaAt = async (sheetPath, y) => {
    const { data, width, channels } = await readSheet(sheetPath);
    return data[y * width * channels + 3];
  };
  const spliceOnlyRibbon = async (tag, sourcePng) => {
    const paths = makeScratch(tag, [
      { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
    ]);
    await makeSheet(paths.ribbonSheet, 43, 14, [[1, 0, 0]]);
    await makeSheet(paths.medalSheet, 70, 120, [[0, 1, 0]]);
    fs.writeFileSync(path.join(paths.uploadDir, "src.png"), sourcePng);
    fs.writeFileSync(
      paths.manifest,
      JSON.stringify(
        [{ name: "Only Ribbon", ribbon: "src.png", replace: true }],
        null,
        2,
      ) + "\n",
    );
    await run(paths, silent());
    return paths.ribbonSheet;
  };

  const ribbonOnly = await spliceOnlyRibbon(
    "gapline-bare",
    await colorTile(43, 13, [4, 4, 4]),
  );
  ok(
    "run(gap line): a 43x13 source fills the tile's first 13 lines",
    (await rowColor(ribbonOnly, 0)).join() === "4,4,4" &&
      (await rowColor(ribbonOnly, 12)).join() === "4,4,4",
  );
  ok(
    "run(gap line): a 43x13 source leaves the tile's 14th line transparent",
    (await alphaAt(ribbonOnly, 13)) === 0,
  );

  const withGap = await spliceOnlyRibbon(
    "gapline-tile",
    await colorTile(43, 14, [5, 5, 5]),
  );
  ok(
    "run(gap line): a 43x14 source lands its own 14th line on the tile",
    (await rowColor(withGap, 13)).join() === "5,5,5" &&
      (await alphaAt(withGap, 13)) === 255,
  );

  // A multiple of the bare shape is still the ribbon alone. The base is what
  // decides the art height, so a check on the literal 43x13 would pass while
  // 86x26 stretched back over the gap.
  const twice = await spliceOnlyRibbon(
    "gapline-2x",
    await colorTile(86, 26, [6, 6, 6]),
  );
  ok(
    "run(gap line): an 86x26 source, 2x of the bare ribbon, keeps the gap",
    (await rowColor(twice, 12)).join() === "6,6,6" &&
      (await alphaAt(twice, 13)) === 0,
  );

  // --- replace onto the row one past the end: the boundary that copies nothing ---
  // `ins.y >= height` is the whole guard, and `>` instead of `>=` leaves every
  // assertion in this file green. It is not a cosmetic off-by-one: Buffer.copy
  // with targetStart === data.length copies ZERO bytes and does not throw, so
  // the sheet re-encodes unchanged, the source is unlinked, the manifest is
  // emptied and the run exits 0. A contributor reaches it by setting
  // "replace": true on a new bottom-most award, whose row is exactly the row
  // count. Reproduced at the seam rather than through run(), because the
  // reconciliation would reject that manifest before the splicer ever saw it.
  const edge = path.join(dir, "edgeSheet.png");
  await makeSheet(edge, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
  ]);
  const edgeBefore = fs.readFileSync(edge);
  let edgeErr = null;
  try {
    await spliceSheet(edge, [
      {
        y: 28,
        tileHeight: 14,
        png: await colorTile(43, 14, [9, 9, 9]),
        name: "Past The End",
        replace: true,
      },
    ]);
  } catch (e) {
    edgeErr = e;
  }
  ok(
    "splice(replace): a replace one row past the end throws, never copies nothing",
    edgeErr !== null &&
      edgeErr.message.includes("no existing tile to overwrite"),
  );
  ok(
    "splice(replace): the sheet is untouched after that rejection",
    edgeBefore.equals(fs.readFileSync(edge)),
  );

  // --- the medal sheet's diagnostic speaks in priorities, not row indices ---
  // Row 0 of the medal sheet is medalPriority 2, so a hole at row 1 must be
  // reported as medalPriority 3. Dropping the `+ firstPriority` offset survives
  // every other assertion here, because both existing numbering cases are
  // ribbon-side where the offset is zero and therefore invisible. The wrong
  // number is worse than a vague one: medalPriority 1 is a Lifetime medal,
  // deliberately not on this sheet, so it sends someone to "fix" an award that
  // is correct by design, two rows from the actual break.
  const medGap = collecting();
  const medGapPaths = makeScratch("medalgap", [
    { name: "M Two", awardPriority: 0, medalPriority: 2, awardType: "Medal" },
    { name: "M Four", awardPriority: 1, medalPriority: 4, awardType: "Medal" },
  ]);
  await makeSheet(medGapPaths.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(medGapPaths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(medGapPaths.uploadDir, "r.png"),
    await colorTile(43, 13, [5, 5, 5]),
  );
  fs.writeFileSync(
    path.join(medGapPaths.uploadDir, "m.png"),
    await colorTile(72, 148, [5, 5, 5]),
  );
  fs.writeFileSync(
    medGapPaths.manifest,
    JSON.stringify(
      [{ name: "M Two", ribbon: "r.png", medal: "m.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  await assert.rejects(() => run(medGapPaths, medGap));
  ok(
    "run(medal gap): the hole is named as medalPriority 3, not row 1",
    medGap.errors.some((e) => e.includes("no award claims medalPriority 3")),
  );
  ok(
    "run(medal gap): it never names medalPriority 1, a deliberate off-sheet Lifetime row",
    !medGap.errors.some((e) => e.includes("medalPriority 1")),
  );

  // --- ribbon source shapes, at the seam ---
  // Exercised directly because run() can only reach two of these, and the
  // clause that makes the rest safe — equal scale on both axes — is invisible
  // at 1x. Without it 86x14 and 43x28 are accepted and `fit: "fill"`-stretched
  // into mush, and the contributor's only copy is unlinked either way. The
  // asymmetry is the point: a wrongly rejected source costs one retry, a
  // wrongly accepted one is unrecoverable.
  [
    [43, 13, true, "the documented 1x source"],
    [43, 14, true, "already at tile size"],
    [86, 26, true, "2x of 43x13"],
    [86, 28, true, "2x of 43x14"],
    [129, 39, true, "3x of 43x13"],
    [43, 26, false, "twice as tall, same width"],
    [43, 28, false, "double height at 1x width"],
    [86, 13, false, "double width, unscaled height"],
    [86, 14, false, "double width, tile height"],
    [64, 20, false, "a shape that is no multiple of either base"],
    [512, 512, false, "a square export"],
    [0, 0, false, "a zero-sized source"],
    [43, 0, false, "no height at all"],
  ].forEach(([w, h, want, why]) => {
    ok(
      `ribbon shape: ${w}x${h} is ${want ? "accepted" : "rejected"} (${why})`,
      isRibbonSourceShape(w, h) === want,
    );
  });

  // An uppercase extension is a valid upload, not a traversal. Every other
  // filename assertion is a rejection, so dropping the /i would go unnoticed.
  ok(
    "filename: an uppercase .PNG extension is accepted",
    isPlainPngName("art.PNG"),
  );

  // --- two entries naming one source file ---
  // The row reconciliation cannot see this by construction: both awards are new,
  // the catalog grew by two, the run inserts two, and the count balances. The
  // file is unlinked once, so the art that was meant for the second award is
  // never missed and both awards wear the same tile.
  const sharedPaths = makeScratch("sharedsource", [
    { name: "First New", awardPriority: 0, awardType: "Ribbon" },
    { name: "Second New", awardPriority: 1, awardType: "Ribbon" },
  ]);
  fs.writeFileSync(
    path.join(sharedPaths.uploadDir, "one.png"),
    await colorTile(43, 13, [3, 3, 3]),
  );
  const sharedErrors = validateManifest(
    [
      { name: "First New", ribbon: "one.png" },
      { name: "Second New", ribbon: "one.png" },
    ],
    indexCatalog([
      { name: "First New", awardPriority: 0, awardType: "Ribbon" },
      { name: "Second New", awardPriority: 1, awardType: "Ribbon" },
    ]),
    sharedPaths.uploadDir,
    { ribbon: 0, medal: 0 },
  ).errors;
  ok(
    "validate: two entries claiming one source file errors",
    sharedErrors.some(
      (e) => e.includes("already claimed by") && e.includes("one.png"),
    ),
  );

  // A non-boolean `replace` is the natural JSON slip, and `"true"` is the
  // damaging one: read through the strict `=== true` it is an INSERT, which
  // shifts every row below the target.
  ok(
    'validate: a string "true" replace errors rather than reading as an insert',
    validateManifest(
      [{ name: "Foo Ribbon", ribbon: "ribbon.png", replace: "true" }],
      CATALOG,
      dir,
      STEADY,
    ).errors.some((e) => e.includes("non-boolean")),
  );

  // --- art identical to what is already on the sheet ---
  // Nothing this run does is worth doing: it would consume the PNG, empty the
  // manifest and open a pull request whose only content is a re-encoded sheet.
  // It must abort BEFORE any of that, so the recovery is to do nothing. CI
  // cannot answer this from out there — "did the file change" is a question
  // about the encoder, not about the art, and it rots on any sharp bump.
  const same = collecting();
  const samePaths = makeScratch("identical", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  await makeSheet(samePaths.ribbonSheet, 43, 14, [[4, 4, 4]]);
  await makeSheet(samePaths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(samePaths.uploadDir, "same.png"),
    await colorTile(43, 14, [4, 4, 4]),
  );
  fs.writeFileSync(
    samePaths.manifest,
    JSON.stringify(
      [{ name: "Only Ribbon", ribbon: "same.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  const sameBefore = fs.readFileSync(samePaths.ribbonSheet);
  await assert.rejects(
    () => run(samePaths, same),
    (e) =>
      e.message.includes("would change nothing") &&
      e.message.includes('"Only Ribbon"'),
    "a run that changes no pixel must abort, naming the awards involved",
  );
  ok(
    "run(identical): the source is still on disk",
    fs.existsSync(path.join(samePaths.uploadDir, "same.png")),
  );
  ok(
    "run(identical): the manifest still holds its entry",
    JSON.parse(fs.readFileSync(samePaths.manifest, "utf8")).length === 1,
  );
  ok(
    "run(identical): the sheet is byte-identical, not even re-encoded",
    sameBefore.equals(fs.readFileSync(samePaths.ribbonSheet)),
  );

  // Art that differs by a single channel in one pixel is a real change, and the
  // guard above must not swallow it. Without this the cheapest way to pass the
  // identical-art test is to call every run unchanged.
  const near = makeScratch("nearidentical", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  await makeSheet(near.ribbonSheet, 43, 14, [[4, 4, 4]]);
  await makeSheet(near.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(near.uploadDir, "near.png"),
    await colorTile(43, 14, [4, 4, 5]),
  );
  fs.writeFileSync(
    near.manifest,
    JSON.stringify(
      [{ name: "Only Ribbon", ribbon: "near.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  await run(near, silent());
  ok(
    "run(near-identical): a one-channel difference still counts as a change",
    !fs.existsSync(path.join(near.uploadDir, "near.png")),
  );

  // --- an unusable priority is named, not silently uncounted ---
  // `null >= 0` is true and `null - 0` is 0, so before onSheet required an
  // integer this award was counted as sitting on row 0. Now it is excluded —
  // which on its own would present as a hole with no stated cause, and send
  // someone renumbering the awards that were fine.
  const badPrio = collecting();
  const badPrioPaths = makeScratch("nullpriority", [
    { name: "R Zero", awardPriority: 0, awardType: "Ribbon" },
    { name: "R Null", awardPriority: null, awardType: "Ribbon" },
    { name: "R Two", awardPriority: 2, awardType: "Ribbon" },
  ]);
  await makeSheet(badPrioPaths.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(badPrioPaths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(badPrioPaths.uploadDir, "r.png"),
    await colorTile(43, 13, [5, 5, 5]),
  );
  fs.writeFileSync(
    badPrioPaths.manifest,
    JSON.stringify(
      [{ name: "R Zero", ribbon: "r.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  await assert.rejects(() => run(badPrioPaths, badPrio));
  ok(
    "run(null priority): the offending award is named, with its unusable value",
    badPrio.errors.some(
      (e) => e.includes('"R Null"') && e.includes("cannot be a row"),
    ),
  );
  // The claim that separates a usable row index from a merely present one.
  // Without the integer check `null >= 0` is true and `null - 0` is 0, so
  // R Null is counted as sitting on row 0 alongside R Zero and the run reports
  // awardPriority 0 as claimed twice. It is not: R Null claims no row at all,
  // and renumbering R Zero to chase that would break a correct entry.
  ok(
    "run(null priority): it does not accuse a real award of duplicating row 0",
    !badPrio.errors.some((e) =>
      e.includes("awardPriority 0 is claimed by more than one award"),
    ),
  );

  // --- an entry that bailed out early must not feed the reconciliation ---
  // The tally it never reached would make the run look like it inserts one tile
  // when it inserts two, producing a second error that instructs a contributor
  // to renumber a catalog that is correct. Someone who fixes both as told ends
  // up with a genuinely broken one.
  const partialRead = validateManifest(
    [
      { name: "Foo Ribbon", ribbon: "ribbon.png", bogus: 1 },
      { name: "Lifetime Medal", ribbon: "ribbon2.png" },
    ],
    CATALOG,
    dir,
    inserting(2),
  );
  ok(
    "validate: a typo'd key does not also produce a bogus renumber-the-catalog error",
    partialRead.errors.some((e) => e.includes("unrecognised key")) &&
      !partialRead.errors.some((e) => e.includes("the catalog must place")),
  );

  // --- the sheets' own RGBA assertion ---
  // The input side of this pair is covered; this is the other half. A sheet that
  // reaches here without transparency has had it destroyed by something, and
  // ensureAlpha would quietly promote it back to four channels and re-encode —
  // burying the fact, with a solid rectangle now behind every medal.
  const rgbSheet = path.join(dir, "rgbSheet.png");
  await sharp({
    create: {
      width: 43,
      height: 14,
      channels: 3,
      background: { r: 1, g: 2, b: 3 },
    },
  })
    .png()
    .toFile(rgbSheet);
  await assert.rejects(
    () => readSheet(rgbSheet),
    (e) => e.message.includes("no alpha channel"),
    "an RGB sprite sheet must be refused, not silently handled",
  );
  ok("readSheet: an RGB sheet is refused", true);

  // readSheet is reached directly by spliceSheet, so it names the sheet itself
  // rather than leaning on run() having read the metadata first.
  const corruptSheet = path.join(dir, "corruptSheet.png");
  fs.writeFileSync(corruptSheet, "not a PNG at all\n");
  await assert.rejects(
    () => readSheet(corruptSheet),
    (e) => e.message.includes("corruptSheet.png"),
    "an undecodable sheet must name itself from readSheet too",
  );
  ok("readSheet: an undecodable sheet names itself", true);

  // --- a tile of the wrong size is refused before it shifts every later pixel ---
  // The last line of defence if a normalizer ever changes: the splice is a byte
  // copy, so a 13px tile would slide every subsequent row up a scanline.
  const wrongSize = path.join(dir, "wrongSize.png");
  await makeSheet(wrongSize, 43, 14, [[1, 0, 0]]);
  const shortTile = await colorTile(43, 13, [2, 2, 2]);
  await assert.rejects(
    () =>
      spliceSheet(wrongSize, [
        { y: 0, tileHeight: 14, png: shortTile, name: "Short Tile" },
      ]),
    (e) => e.message.includes("expected"),
    "a tile whose raw size is wrong must be refused",
  );
  ok("splice: a wrong-sized tile is refused with its byte counts", true);

  // --- art left in the folder that no entry claimed ---
  // The run is legitimate; it just did less than the uploader thinks. The
  // warning has to be emitted BEFORE the sheets are written and the sources
  // deleted: held to the end it arrives after everything it could have
  // prevented, and it is lost outright if a later entry throws.
  const stray = collecting();
  const strayPaths = makeScratch("strayupload", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  await makeSheet(strayPaths.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(strayPaths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(strayPaths.uploadDir, "claimed.png"),
    await colorTile(43, 13, [7, 7, 7]),
  );
  fs.writeFileSync(
    path.join(strayPaths.uploadDir, "forgotten.png"),
    await colorTile(43, 13, [6, 6, 6]),
  );
  fs.writeFileSync(
    strayPaths.manifest,
    JSON.stringify(
      [{ name: "Only Ribbon", ribbon: "claimed.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  const strayRes = await run(strayPaths, stray);
  ok(
    "run(stray): unclaimed art in the upload folder is reported by name",
    strayRes.warnings.some((w) => w.includes("forgotten.png")),
  );
  ok(
    "run(stray): the warning reaches the log, where CI greps for it",
    stray.warnings.some(
      (w) => w.startsWith("WARN:") && w.includes("forgotten.png"),
    ),
  );
  ok(
    "run(stray): the sheets themselves are never reported as unclaimed art",
    !strayRes.warnings.some((w) => w.includes("Sheet.png")),
  );
  ok(
    "run(stray): the claimed source is not reported as unclaimed",
    !strayRes.warnings.some((w) => w.includes("claimed.png")),
  );

  // --- art pushed with nothing in the manifest to process it ---
  // The one case a warning cannot cover, and the likeliest slip in the
  // documented flow: drop the PNGs, forget the manifest edit. run() used to
  // return at "manifest is empty, nothing to process" before the upload folder
  // was ever looked at, so the workflow printed "Skipping PR" and went green.
  // There is no pull request in that case, and the PR body is the only place a
  // warning is read — so this has to fail the run instead.
  const unmanifested = collecting();
  const unmanifestedPaths = makeScratch("unmanifested", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  await makeSheet(unmanifestedPaths.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(unmanifestedPaths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(unmanifestedPaths.uploadDir, "nobody-claimed-me.png"),
    await colorTile(43, 13, [6, 6, 6]),
  );
  fs.writeFileSync(unmanifestedPaths.manifest, "[]\n");
  await assert.rejects(
    () => run(unmanifestedPaths, unmanifested),
    (e) => e.message.includes("no manifest entry"),
    "art pushed against an empty manifest must fail, not report nothing to do",
  );
  ok(
    "run(unmanifested): the file nobody claimed is named",
    unmanifested.errors.some((e) => e.includes("nobody-claimed-me.png")),
  );
  ok(
    "run(unmanifested): the art is left where it is, for the retry",
    fs.existsSync(
      path.join(unmanifestedPaths.uploadDir, "nobody-claimed-me.png"),
    ),
  );

  // --- one tile in a batch that changes nothing ---
  // The identical-art guard used to be one boolean per SHEET, so a tile that
  // moved no pixel was excused by any sibling tile on the same sheet that did.
  // The run exited 0 with that award's PNG deleted, the manifest emptied, and
  // nothing anywhere saying its upload had achieved nothing — while the PR
  // showed a real binary diff, produced by the sibling.
  const batch = collecting();
  const batchPaths = makeScratch("batchnoop", [
    { name: "R Moved", awardPriority: 0, awardType: "Ribbon" },
    { name: "R Same", awardPriority: 1, awardType: "Ribbon" },
  ]);
  await makeSheet(batchPaths.ribbonSheet, 43, 14, [
    [4, 4, 4],
    [5, 5, 5],
  ]);
  await makeSheet(batchPaths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(batchPaths.uploadDir, "moved.png"),
    await colorTile(43, 14, [9, 9, 9]),
  );
  fs.writeFileSync(
    path.join(batchPaths.uploadDir, "same.png"),
    await colorTile(43, 14, [5, 5, 5]),
  );
  fs.writeFileSync(
    batchPaths.manifest,
    JSON.stringify(
      [
        { name: "R Moved", ribbon: "moved.png", replace: true },
        { name: "R Same", ribbon: "same.png", replace: true },
      ],
      null,
      2,
    ) + "\n",
  );
  const batchRes = await run(batchPaths, batch);
  ok(
    "run(batch no-op): the tile that changed nothing is named",
    batchRes.warnings.some(
      (w) => w.includes('"R Same"') && w.includes("already"),
    ),
  );
  ok(
    "run(batch no-op): the tile that did change is not accused of it",
    !batchRes.warnings.some((w) => w.includes('"R Moved"')),
  );
  ok(
    "run(batch no-op): the run still completes, having placed the other tile",
    batchRes.processed === 2 &&
      (await rowColor(batchPaths.ribbonSheet, 0)).join() === "9,9,9",
  );
  ok(
    "run(batch no-op): the row it would not have changed is untouched",
    (await rowColor(batchPaths.ribbonSheet, 14)).join() === "5,5,5",
  );

  // --- an award on both sheets, fixing the art on only one of them ---
  // 45 of the 105 real awards sit on both sheets, and validateManifest requires
  // a source for each. So fixing just the medal art means re-supplying the
  // ribbon art unchanged, and the per-SHEET guard read that as "the ribbon
  // sheet would be unchanged, abort" — telling a contributor who had uploaded
  // exactly the right files to go and check they had uploaded the right files.
  // Nothing is wrong here: the run has work to do, and says what it skipped.
  const oneSide = makeScratch("onesided", [
    {
      name: "Both Award",
      awardPriority: 0,
      medalPriority: 2,
      awardType: "Medal",
    },
  ]);
  await makeSheet(oneSide.ribbonSheet, 43, 14, [[4, 4, 4]]);
  await makeSheet(oneSide.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(oneSide.uploadDir, "sameR.png"),
    await colorTile(43, 14, [4, 4, 4]),
  );
  fs.writeFileSync(
    path.join(oneSide.uploadDir, "newM.png"),
    await colorTile(70, 120, [0, 9, 0]),
  );
  fs.writeFileSync(
    oneSide.manifest,
    JSON.stringify(
      [
        {
          name: "Both Award",
          ribbon: "sameR.png",
          medal: "newM.png",
          replace: true,
        },
      ],
      null,
      2,
    ) + "\n",
  );
  const oneSideRes = await run(oneSide, silent());
  ok(
    "run(one-sided): fixing one sheet's art is allowed, not aborted",
    oneSideRes.processed === 1 &&
      (await rowColor(oneSide.medalSheet, 0)).join() === "0,9,0",
  );
  ok(
    "run(one-sided): the sheet that could not change says so",
    oneSideRes.warnings.some(
      (w) => w.includes('"Both Award"') && w.includes("ribbonSheet.png"),
    ),
  );

  // --- run: a failed encode leaves BOTH sheets as they were ---
  // The temp-file-then-rename dance exists for exactly this: two destinations
  // cannot be written atomically, so everything is encoded first and the
  // renames run last. Deleting the whole mechanism and writing each sheet
  // straight to its destination passed the entire suite, which meant the
  // property it exists for was asserted nowhere.
  //
  // The encode is made to fail by putting a DIRECTORY where the medal sheet's
  // temp file goes: readSheet still reads the real sheet, and sharp's toFile
  // fails on the destination.
  const atomic = collecting();
  const atomicPaths = makeScratch("atomic", [
    {
      name: "Both Award",
      awardPriority: 0,
      medalPriority: 2,
      awardType: "Medal",
    },
  ]);
  await makeSheet(atomicPaths.ribbonSheet, 43, 14, [[4, 4, 4]]);
  await makeSheet(atomicPaths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(atomicPaths.uploadDir, "aR.png"),
    await colorTile(43, 14, [9, 9, 9]),
  );
  fs.writeFileSync(
    path.join(atomicPaths.uploadDir, "aM.png"),
    await colorTile(70, 120, [0, 9, 0]),
  );
  fs.writeFileSync(
    atomicPaths.manifest,
    JSON.stringify(
      [
        {
          name: "Both Award",
          ribbon: "aR.png",
          medal: "aM.png",
          replace: true,
        },
      ],
      null,
      2,
    ) + "\n",
  );
  const atomicRibBefore = fs.readFileSync(atomicPaths.ribbonSheet);
  const atomicMedBefore = fs.readFileSync(atomicPaths.medalSheet);
  const blockedTmp = atomicPaths.medalSheet + ".tmp.png";
  fs.mkdirSync(blockedTmp);
  await assert.rejects(
    () => run(atomicPaths, atomic),
    "an encode failure on the second sheet must abort the run",
  );
  ok(
    "run(atomic): the sheet that encoded first is not left overwritten",
    atomicRibBefore.equals(fs.readFileSync(atomicPaths.ribbonSheet)),
  );
  ok(
    "run(atomic): the sheet that failed to encode is untouched",
    atomicMedBefore.equals(fs.readFileSync(atomicPaths.medalSheet)),
  );
  ok(
    "run(atomic): no source was consumed",
    fs.existsSync(path.join(atomicPaths.uploadDir, "aR.png")) &&
      fs.existsSync(path.join(atomicPaths.uploadDir, "aM.png")),
  );
  ok(
    "run(atomic): the manifest still holds its entry for the retry",
    JSON.parse(fs.readFileSync(atomicPaths.manifest, "utf8")).length === 1,
  );
  ok(
    "run(atomic): the temp file that did get written is cleaned up",
    !fs.existsSync(atomicPaths.ribbonSheet + ".tmp.png"),
  );
  ok(
    "run(atomic): a temp file that cannot be removed is reported, not swallowed",
    atomic.warnings.some(
      (w) => w.startsWith("WARN:") && w.includes("could not remove temp file"),
    ),
  );
  fs.rmdirSync(blockedTmp);

  // --- run: a warning produced before a later entry throws is not lost ---
  // Warnings used to be printed after the loop, which is precisely when they
  // are worth having and precisely when the loop does not reach the end. The
  // first entry warns (a wide medal source), the second throws (a square ribbon
  // source), and the warning still has to have been said.
  const lost = collecting();
  const lostPaths = makeScratch("lostwarning", [
    {
      name: "Wide Medal",
      awardPriority: 0,
      medalPriority: 2,
      awardType: "Medal",
    },
    { name: "Square Ribbon", awardPriority: 1, awardType: "Ribbon" },
  ]);
  await makeSheet(lostPaths.ribbonSheet, 43, 14, [
    [1, 0, 0],
    [2, 0, 0],
  ]);
  await makeSheet(lostPaths.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(lostPaths.uploadDir, "wR.png"),
    await colorTile(43, 14, [9, 9, 9]),
  );
  fs.writeFileSync(
    path.join(lostPaths.uploadDir, "wM.png"),
    await colorTile(140, 120, [9, 9, 9]),
  );
  fs.writeFileSync(
    path.join(lostPaths.uploadDir, "sq.png"),
    await colorTile(512, 512, [9, 9, 9]),
  );
  fs.writeFileSync(
    lostPaths.manifest,
    JSON.stringify(
      [
        {
          name: "Wide Medal",
          ribbon: "wR.png",
          medal: "wM.png",
          replace: true,
        },
        { name: "Square Ribbon", ribbon: "sq.png", replace: true },
      ],
      null,
      2,
    ) + "\n",
  );
  await assert.rejects(
    () => run(lostPaths, lost),
    (e) => e.message.includes("512x512"),
    "a square ribbon source must abort the run",
  );
  ok(
    "run(lost warning): a warning from an earlier entry survives a later throw",
    lost.warnings.some((w) => w.includes("70x60")),
  );

  // --- run: a medal source smaller than its tile is scaled up, and says so ---
  // The aspect warnings cannot see this one: 35x60 fits 70x120 exactly, filling
  // the tile edge to edge with no margin to report. It is simply blurred, and
  // once the source is consumed there is nothing left to compare it against.
  const small = makeScratch("upscale", [
    {
      name: "Both Award",
      awardPriority: 0,
      medalPriority: 2,
      awardType: "Medal",
    },
  ]);
  await makeSheet(small.ribbonSheet, 43, 14, [[4, 4, 4]]);
  await makeSheet(small.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(small.uploadDir, "sR.png"),
    await colorTile(43, 14, [9, 9, 9]),
  );
  fs.writeFileSync(
    path.join(small.uploadDir, "sM.png"),
    await colorTile(35, 60, [0, 9, 0]),
  );
  fs.writeFileSync(
    small.manifest,
    JSON.stringify(
      [
        {
          name: "Both Award",
          ribbon: "sR.png",
          medal: "sM.png",
          replace: true,
        },
      ],
      null,
      2,
    ) + "\n",
  );
  const smallRes = await run(small, silent());
  ok(
    "run(upscale): a medal source below tile size is reported, not silently blurred",
    smallRes.warnings.some(
      (w) => w.includes("35x60") && w.includes("scaled UP"),
    ),
  );

  // --- the diagnostics name the file they are about ---
  // Both of these used to surface as a bare library string. JSON.parse names a
  // character offset and no file; sharp says "Input file contains unsupported
  // image format" and nothing else, which with several entries queued leaves no
  // way to tell which upload is the bad one.
  const badJson = makeScratch("badjson");
  fs.writeFileSync(badJson.manifest, '[{"name": "Foo Ribbon",}]\n');
  await assert.rejects(
    () => run(badJson, silent()),
    (e) =>
      e.message.includes("manifest.json") &&
      e.message.includes("No sprite sheet was modified"),
    "an unparseable manifest must name the file it could not read",
  );
  ok("run(bad json): the manifest is named, not just an offset", true);

  const notArt = makeScratch("notart", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  await makeSheet(notArt.ribbonSheet, 43, 14, [[1, 0, 0]]);
  await makeSheet(notArt.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(notArt.uploadDir, "renamed.png"),
    "this is not a PNG\n",
  );
  fs.writeFileSync(
    notArt.manifest,
    JSON.stringify(
      [{ name: "Only Ribbon", ribbon: "renamed.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  await assert.rejects(
    () => run(notArt, silent()),
    (e) => e.message.includes("renamed.png"),
    "a source that is not an image must name itself",
  );
  ok("run(not art): an undecodable source is named", true);

  // The same courtesy for the sheets. There are two of them, and sharp's
  // message says which of them is broken exactly as well as it says which
  // upload is: not at all.
  const badSheet = makeScratch("badsheet", [
    { name: "Only Ribbon", awardPriority: 0, awardType: "Ribbon" },
  ]);
  fs.writeFileSync(badSheet.ribbonSheet, "truncated to nothing\n");
  await makeSheet(badSheet.medalSheet, 70, 120, [[0, 1, 0]]);
  fs.writeFileSync(
    path.join(badSheet.uploadDir, "art.png"),
    await colorTile(43, 13, [7, 7, 7]),
  );
  fs.writeFileSync(
    badSheet.manifest,
    JSON.stringify(
      [{ name: "Only Ribbon", ribbon: "art.png", replace: true }],
      null,
      2,
    ) + "\n",
  );
  await assert.rejects(
    () => run(badSheet, silent()),
    (e) => e.message.includes("ribbonSheet.png"),
    "an undecodable sprite sheet must say which sheet it is",
  );
  ok(
    "run(bad sheet): the sheet that could not be read is named",
    fs.existsSync(path.join(badSheet.uploadDir, "art.png")),
  );

  // --- a repeated priority is reported in the order a human reads ---
  // `occupied` follows catalog order, so the offending priorities came out in
  // whatever order the catalog happened to mention them first: "awardPriority
  // 3, 1" reads as one fault about row 3 before you reach the comma.
  const unsorted = indexCatalog([
    { name: "P Three", awardPriority: 3, awardType: "Ribbon" },
    { name: "P One", awardPriority: 1, awardType: "Ribbon" },
    { name: "P Zero", awardPriority: 0, awardType: "Ribbon" },
    { name: "P Two", awardPriority: 2, awardType: "Ribbon" },
    { name: "P Three Again", awardPriority: 3, awardType: "Ribbon" },
    { name: "P One Again", awardPriority: 1, awardType: "Ribbon" },
  ]);
  ok(
    "validate: repeated priorities are listed in ascending order",
    validateManifest([], unsorted, dir, { ribbon: 4, medal: 0 }).errors.some(
      (e) => e.includes("awardPriority 1, 3 is claimed by more than one award"),
    ),
  );

  // --- splice: a negative row is refused ---
  // Unreachable through run() today, since both sheets' firstPriority keeps y at
  // or above 0 — but buildSplicedSheet is exported and this is the last check
  // between a bad offset and a Buffer.concat that would silently reorder the
  // sheet.
  const negSheet = path.join(dir, "negSheet.png");
  await makeSheet(negSheet, 43, 14, [[1, 0, 0]]);
  const negTile = await colorTile(43, 14, [2, 2, 2]);
  await assert.rejects(
    () =>
      spliceSheet(negSheet, [
        { y: -14, tileHeight: 14, png: negTile, name: "Below Zero" },
      ]),
    (e) => e.message.includes("negative") && e.message.includes("Below Zero"),
    "a negative row must be refused",
  );
  ok("splice: a negative row is refused, naming the award", true);

  // A negative row count is as much a caller bug as a missing one, and it makes
  // the reconciliation demand a negative number of awards.
  assert.throws(
    () => validateManifest([], CATALOG, dir, { ribbon: -1, medal: 3 }),
    /ribbon=-1/,
    "a negative row count must throw and name the sheet",
  );
  ok("validate: a negative row count is refused", true);

  fs.rmSync(dir, { recursive: true, force: true });
  scratchDirs.forEach((d) => fs.rmSync(d, { recursive: true, force: true }));
  console.log(`\nAll ${passed} assertions passed.`);
}

function makePaths(dir, entries = CATALOG_ENTRIES) {
  return {
    uploadDir: dir,
    manifest: path.join(dir, "manifest.json"),
    catalog: writeCatalog(dir, entries),
    ribbonSheet: path.join(dir, "ribbonSheet.png"),
    medalSheet: path.join(dir, "medalSheet.png"),
  };
}

/**
 * A scratch upload directory with its own catalog, for a run() case that needs
 * catalog contents the shared fixture cannot express. A fresh directory per
 * call is not tidiness: Node caches ES modules by URL and never invalidates, so
 * two different catalogs written to one directory would serve the first twice.
 */
const scratchDirs = [];
function makeScratch(tag, entries) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `sprites-${tag}-`));
  scratchDirs.push(dir);
  return makePaths(dir, entries);
}

/**
 * Write CATALOG_ENTRIES out as a standalone ES module for run() to import.
 * Self-contained (values inlined, no imports) so it loads from a temp dir with
 * no package.json.
 *
 * Two constraints if you extend this. Node caches ES modules by URL and never
 * invalidates, so a second catalog with DIFFERENT contents must be written to a
 * different directory or the first one is served again. And JSON.stringify
 * drops undefined-valued keys, so a fixture testing a field written as
 * `undefined` cannot round-trip through here — build it inline with
 * indexCatalog() instead.
 */
function writeCatalog(dir, entries = CATALOG_ENTRIES) {
  const p = path.join(dir, "awardCatalog.js");
  fs.writeFileSync(
    p,
    `export const AWARD_CATALOG = ${JSON.stringify(entries, null, 2)};\n`,
  );
  return p;
}

function silent() {
  return { log() {}, warn() {}, error() {} };
}

/**
 * A log that keeps what it was told, for asserting on the diagnostics a run
 * actually produces.
 *
 * run() throws only a summary ("manifest validation failed (2 error(s))"); the
 * errors that tell a contributor what to fix go to log.error. Asserting on the
 * thrown message therefore proves almost nothing, and a test that only checks
 * something threw passes just as happily when the wrong check fires.
 */
function collecting() {
  const errors = [];
  const warnings = [];
  return {
    errors,
    warnings,
    log() {},
    warn(m) {
      warnings.push(m);
    },
    error(m) {
      errors.push(m);
    },
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
