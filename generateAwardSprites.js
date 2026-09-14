"use strict";

/**
 * Award sprite-sheet generator.
 *
 * Reads `uniform-uploads/manifest.json`, validates every entry against
 * `constants/awardCatalog.js` (the human-owned source of truth for placement,
 * imported as a module — see loadCatalog), normalizes each source PNG to its
 * target tile geometry, and splices the tile into the correct sprite sheet(s)
 * at the catalog-derived row. An in-bounds insert shifts every lower row down
 * by its tile height (N inserts shift the bottom band down by N tiles); an
 * insert past the current end pads the sub-tile remainder with transparency
 * and appends without shifting anything. An entry flagged `replace: true`
 * overwrites the tile already at
 * that row in place — no shift, no growth — to fix the art of an award that
 * already has a tile. Consumed sources and their manifest entries are then
 * removed.
 *
 * Which of the two a run is doing cannot be settled by looking at the target
 * row, since a legitimate insert and a mistaken one both land on an occupied
 * one. Each sheet the run writes to is therefore reconciled against the
 * catalog: the catalog must place one award per row the sheet already holds,
 * plus one for each row the run inserts. See validateManifest for why that is
 * the question worth asking.
 *
 * Geometry (load-bearing):
 *   Ribbon: tile 43x14, row y = awardPriority * 14
 *   Medal:  tile 70x120, row y = (medalPriority - 2) * 120
 *
 * Sheet membership is awardType-gated: only mainline medal/ribbon awards live
 * in these two sheets (Tabs, weapon quals, unit citations, and badges render
 * from other assets). See RIBBON_SHEET_TYPES / MEDAL_SHEET_TYPES below.
 *
 * Run via `npm run sprites:generate` to process the real manifest, or require
 * it as a module to use the exported helpers in tests. Prefer the npm script
 * over a bare `node generateAwardSprites.js`: it carries the flag that mutes
 * Node's MODULE_TYPELESS_PACKAGE_JSON notice for the imported catalog. That
 * notice points at `client/package.json`, and marking THAT `"type": "module"`
 * would require converting `client/next.config.js`, which is CommonJS. Do not
 * add `"type"` to the root package.json instead — it would break this
 * generator and silence nothing.
 */

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const sharp = require("sharp");

const ROOT = __dirname;

const DEFAULT_PATHS = {
  uploadDir: path.join(ROOT, "uniform-uploads"),
  manifest: path.join(ROOT, "uniform-uploads", "manifest.json"),
  catalog: path.join(
    ROOT,
    "client/app/uniformbuilder/modules/constants/awardCatalog.js",
  ),
  ribbonSheet: path.join(
    ROOT,
    "client/public/skunkworks/uniformRibbons/ribbons/ribbonSpriteSheet.png",
  ),
  medalSheet: path.join(
    ROOT,
    "client/public/skunkworks/uniformMedals/medalSpriteSheet.png",
  ),
};

const RIBBON = { width: 43, tileHeight: 14 };
const MEDAL = { width: 70, tileHeight: 120 };

// awardTypes that actually render from each sprite sheet. Awards of any other
// type (UnitCitation, BadgeCombat, WeaponQual, Tab) live in separate assets.
const RIBBON_SHEET_TYPES = new Set([
  "Medal",
  "MedalTiered",
  "MedalWithValor",
  "Ribbon",
  "RibbonDonationLogic",
  "RibbonPerRank",
]);
const MEDAL_SHEET_TYPES = new Set(["Medal", "MedalTiered", "MedalWithValor"]);
// The medal sheet's first row is medalPriority 2 (y = (medalPriority - 2)*120);
// priorities 0/1 (the Lifetime medals) are not on it.
const MEDAL_MIN_PRIORITY = 2;

/**
 * Everything that differs between the two sheets, in one place and keyed by
 * `kind`. Membership, row arithmetic, geometry and the field name a
 * contributor has to fix all vary together per sheet, so they are described
 * together: the alternative is the same `kind === "ribbon" ? … : …` decision
 * restated at each use, which is how one of them eventually disagrees with the
 * rest. `firstPriority` is the priority that maps to row 0 — the medal sheet
 * starts at 2, since the two Lifetime medals are on the ribbon sheet only.
 */
const SHEETS = {
  ribbon: {
    ...RIBBON,
    priorityField: "awardPriority",
    types: RIBBON_SHEET_TYPES,
    firstPriority: 0,
  },
  medal: {
    ...MEDAL,
    priorityField: "medalPriority",
    types: MEDAL_SHEET_TYPES,
    firstPriority: MEDAL_MIN_PRIORITY,
  },
};

/**
 * Does this award have a tile on `kind`'s sheet?
 *
 * The priority must be a usable row index, not merely present. `null >= 0` is
 * true in JS and `null - 0` is 0, so a priority written as null — or as a
 * string, or a float — would otherwise be counted as a member sitting on row 0
 * (or on row 3.5). validateManifest catches that for an award the manifest
 * names, via malformedFields, but catalogSheetRows scans the WHOLE catalog and
 * has no such guard behind it. Awards that state the field and fill it with
 * something unusable are collected there by name instead of being silently
 * counted or silently dropped.
 */
function onSheet(award, kind) {
  const { types, priorityField, firstPriority } = SHEETS[kind];
  return (
    !!award &&
    types.has(award.awardType) &&
    Number.isInteger(award[priorityField]) &&
    award[priorityField] >= firstPriority
  );
}

/**
 * Does this award state `kind`'s priority field but fill it with a value that
 * cannot be a row index?
 *
 * Distinct from "not a member". A medal-typed award with medalPriority 0 is a
 * Lifetime medal, legitimately off the medal sheet — that is what
 * firstPriority expresses, and why this asks FIELD_IS_USABLE (is the value a
 * row index at all?) rather than repeating the `>= firstPriority` membership
 * test. A medalPriority of null, "WIP" or -1 is a broken entry, and the two
 * need opposite advice.
 */
function unusablePriority(award, kind) {
  const { types, priorityField } = SHEETS[kind];
  if (!award || !types.has(award.awardType)) return false;
  if (!Object.hasOwn(award, priorityField)) return false;
  return !FIELD_IS_USABLE[priorityField](award[priorityField]);
}

/** Does this award have a tile on the ribbon sheet? */
function onRibbonSheet(award) {
  return onSheet(award, "ribbon");
}

/** Does this award have a tile on the medal sheet? */
function onMedalSheet(award) {
  return onSheet(award, "medal");
}

/** The 0-based row an award occupies on `kind`'s sheet. */
function sheetRowIndex(award, kind) {
  const { priorityField, firstPriority } = SHEETS[kind];
  return award[priorityField] - firstPriority;
}

/**
 * How many tile rows a sheet currently holds.
 *
 * Ceiling, because a partial final row is still a row: the ribbon sheet's last
 * tile is truncated, and its remaining pixels are opaque art rather than
 * padding. Rounding is not a safe substitute. A sheet has also carried a
 * remainder that was NOT a tile, the medal sheet having spent about two months
 * a single pixel taller than its tiles after a hand-edit, since cropped.
 * Nothing measurable tells those two cases apart, which is why the count this
 * returns is reconciled against the catalog rather than trusted on its own.
 *
 * "Any pixels in row k mean row k exists" is also the notion of existence the
 * replace guard in buildSplicedSheet already uses (`ins.y >= height` means
 * there is no tile to overwrite). Keeping one definition of it in this file is
 * deliberate: two competing answers to "does this row exist" is how a tile
 * lands on the wrong award.
 */
function sheetRowCount(height, tileHeight) {
  return Math.ceil(height / tileHeight);
}

/**
 * The rows the catalog claims on `kind`'s sheet: how many, and every way the
 * claim is malformed.
 *
 * The anomalies are returned rather than a second number to compare against
 * `count`, because comparing counts looks like a contiguity test and is not
 * one. Against `max(row) + 1` a priority claimed twice and a priority claimed
 * by nobody cancel out, so [0, 1, 1, 3] reads as four awards across four rows
 * and passes. That is a renumbering slip, which is the likeliest mistake in the
 * workflow this file documents: bump one award's priority, miss its neighbour.
 *
 * It matters because the consumer reads a tile at `row * tileHeight`. A hole is
 * a blank row that every award below it is then read across, and a repeat is
 * two awards fighting over one row with the loser never drawn.
 *
 * `unusable` lists the awards that claim a row on this sheet with a value that
 * cannot be one, as { name, value }. Kept separate from the hole count because
 * "your medalPriority is null" and "nothing claims medalPriority 7" send a
 * contributor to different places, and only one of them is true. Returned as
 * data rather than a formatted string for the same reason `missing` is: the
 * caller is the one that knows how to phrase a priority.
 */
function catalogSheetRows(catalog, kind) {
  const { priorityField } = SHEETS[kind];
  const awards = [...catalog.values()];
  const rows = awards
    .filter((award) => onSheet(award, kind))
    .map((award) => sheetRowIndex(award, kind));
  const occupied = new Set(rows);
  const extent = rows.length === 0 ? 0 : Math.max(...rows) + 1;
  const missing = [];
  for (let row = 0; row < extent; row += 1) {
    if (!occupied.has(row)) missing.push(row);
  }
  // Sorted, like `missing` is by construction: `occupied` follows catalog order,
  // and a contributor reading "awardPriority 12, 4 is claimed by more than one
  // award" reads it as one fault about row 12 before they reach the comma.
  const duplicated = [...occupied]
    .filter((row) => rows.filter((other) => other === row).length > 1)
    .sort((a, b) => a - b);
  const unusable = awards
    .filter((award) => unusablePriority(award, kind))
    .map((award) => ({ name: award.name, value: award[priorityField] }));
  return { count: rows.length, missing, duplicated, unusable };
}

/**
 * Index an AWARD_CATALOG array by award name.
 *
 * Throws on a malformed catalog rather than returning a partial index: a
 * nameless entry or a duplicate name means the app's own AwardRegistry Map is
 * broken too (it keys on the same field, so the LAST duplicate silently wins
 * and the earlier one vanishes), so failing here surfaces it instead of
 * quietly misplacing a tile.
 *
 * An empty array is rejected for a sharper reason. AWARD_CATALOG is a
 * hand-maintained file of ~100 awards, so zero entries never means "no awards
 * yet" — it means the module resolved but the data did not come with it.
 * Without this, every manifest entry fails as "not present in the award
 * catalog", which is the same misdirection that hid the original breakage: it
 * sends the operator off to re-check the spelling of an award they just added.
 */
function indexCatalog(entries) {
  if (!Array.isArray(entries)) {
    throw new Error(
      `award catalog must export AWARD_CATALOG as an array, got ${typeof entries}`,
    );
  }
  if (entries.length === 0) {
    throw new Error(
      "award catalog exported AWARD_CATALOG as an EMPTY array; the module " +
        "resolved but carried no awards, so the generator is not reading the " +
        "data you edited. Check that AWARD_CATALOG is still the exported name " +
        "and that the array literal is intact.",
    );
  }
  const byName = new Map();
  entries.forEach((entry, i) => {
    if (!entry || typeof entry.name !== "string" || entry.name === "") {
      throw new Error(`award catalog entry ${i} has no usable "name"`);
    }
    if (byName.has(entry.name)) {
      throw new Error(
        `award catalog has a duplicate name "${entry.name}" (entry ${i})`,
      );
    }
    byName.set(entry.name, entry);
  });
  return byName;
}

/**
 * Import the award catalog and index it by name.
 *
 * The catalog is imported, not parsed as text: it is the same module the
 * uniform builder renders from, so the generator and the app can never
 * disagree about which row an award sits in. (They can still disagree about
 * NAMES — the app resolves through AwardRegistry.getAwardDetails, which strips
 * valor devices first, while lookupAward here is exact-match.) That coupling
 * is the point — a refactor that moves or renames this data now breaks the
 * import loudly instead of leaving a text matcher quietly finding nothing.
 *
 * Imported by file URL so absolute Windows paths resolve; `await import` of an
 * ES module is why every caller of this is async.
 */
async function loadCatalog(catalogPath) {
  const mod = await import(pathToFileURL(catalogPath).href);
  return indexCatalog(mod.AWARD_CATALOG);
}

/** Look up one award's details by name, or null when it is not in the catalog. */
function lookupAward(catalog, name) {
  return catalog.get(name) ?? null;
}

// What each placement field must hold to be usable. One table so the check can
// never drift field-by-field, and so adding a field is one line here.
const FIELD_IS_USABLE = {
  awardPriority: (v) => Number.isInteger(v) && v >= 0,
  medalPriority: (v) => Number.isInteger(v) && v >= 0,
  awardType: (v) => typeof v === "string" && v !== "",
};

/**
 * Names of placement fields the award states but fills with a value the
 * splicer cannot use as a row index or a sheet-membership key.
 *
 * Guards the dangerous case: a field set to something unusable would otherwise
 * read as "field not set," making the award look like a non-member of that
 * sheet. The manifest-side check catches this too whenever a source for that
 * sheet is supplied, so what survives here is the case where none is: the
 * award silently loses a tile it was meant to have, and the operator is told
 * it is not on that sheet rather than that the field is broken.
 *
 * Keyed on whether the field is WRITTEN, not on `!== undefined`, because the
 * two mean opposite things here. An entry that omits `medalPriority` is a
 * legitimate ribbon-only award. An entry that spells the key out and lands on
 * `undefined` — a mistyped `AwardType.Medl`, a constant deleted out from under
 * it, a spread of a half-built object — has declared an intent to sit on the
 * medal sheet and must be rejected. Collapsing those two would splice the
 * ribbon tile, skip the medal tile, and still exit 0.
 *
 * Note this cannot catch a MISSPELLED key (`medalPriorty: 5`), which reads as
 * omitted. Neither could the text matcher this replaced. The catalog numbering
 * check in validateManifest usually catches it downstream — the award drops off
 * its sheet and leaves a hole, reported by number — but not always: an award
 * that held the HIGHEST priority on its sheet leaves no hole when it drops out,
 * since the numbering simply ends one row sooner. What catches that one is the
 * reconciliation, and only on a run that writes to the sheet.
 */
function malformedFields(award) {
  return Object.keys(FIELD_IS_USABLE).filter(
    (key) => Object.hasOwn(award, key) && !FIELD_IS_USABLE[key](award[key]),
  );
}

/**
 * Read a sheet's raw RGBA pixels.
 *
 * Both production sheets are RGBA and this asserts it. Not because the splice
 * would break otherwise — `ensureAlpha` would quietly promote a flattened sheet
 * back to four channels and the arithmetic would go on working — but because a
 * sheet that arrived here without transparency has had it destroyed by
 * something, and re-encoding it as RGBA is how that gets buried. Every tile
 * behind every medal is a hole in the rack; this is the check that says so
 * instead of shipping it.
 */
async function readSheet(sheetPath) {
  const meta = await readSheetMetadata(sheetPath);
  if (!meta.hasAlpha) {
    throw new Error(
      `sheet ${path.basename(sheetPath)} has no alpha channel; sprite sheets must be RGBA`,
    );
  }
  const channels = 4;
  const data = await sharp(sheetPath).ensureAlpha().raw().toBuffer();
  return { data, width: meta.width, height: meta.height, channels };
}

/**
 * Render a tile PNG buffer to raw bytes at the sheet's channel count.
 *
 * That count is readSheet's, and readSheet returns 4 for every sheet it will
 * accept — so the parameter has exactly one legal value today and this asserts
 * it rather than quietly rendering a tile at a stride the sheet is not using.
 * It is written as a check on the caller instead of dropping the parameter
 * because the coupling is the thing worth stating: whatever a tile is rendered
 * at has to be whatever the sheet was read at, and if readSheet ever learns a
 * second answer this is where that lands.
 */
async function tileToRaw(tilePng, channels) {
  if (channels !== 4) {
    throw new Error(
      `tileToRaw got channels=${channels}; readSheet reads every sheet as RGBA, so a tile ` +
        `rendered at any other channel count would be copied in at the wrong stride`,
    );
  }
  return sharp(tilePng).ensureAlpha().raw().toBuffer();
}

/**
 * Read an image's metadata, naming the file if it cannot be decoded.
 *
 * sharp's own message for a file that is not an image is "Input file contains
 * unsupported image format" and nothing else — no path. With several entries
 * queued that leaves a contributor with no way to tell which of their uploads
 * is the bad one, and for a sheet it does not even say which of the two. Every
 * error this file writes itself names the file it is about; the ones that came
 * from the library were the exceptions.
 */
async function readImageMetadata(file, label, hint) {
  try {
    return await sharp(file).metadata();
  } catch (e) {
    throw new Error(
      `${label} ${path.basename(file)} could not be read as an image: ${e.message}. ${hint}`,
    );
  }
}

/** Metadata for one uploaded source PNG, named as the contributor named it. */
function readSourceMetadata(srcPath, kind) {
  return readImageMetadata(
    srcPath,
    `${kind} source`,
    `Check it is a real PNG and not, say, an .xcf or a Git LFS pointer renamed to .png`,
  );
}

/** Metadata for one sprite sheet, which is a repo file rather than an upload. */
function readSheetMetadata(sheetPath) {
  return readImageMetadata(
    sheetPath,
    "sprite sheet",
    `Restore it from git — nothing was modified by this run`,
  );
}

// Source shapes a ribbon tile can be produced from: the documented 43x13, the
// already-tile-sized 43x14, or an exact integer multiple of either.
const RIBBON_SOURCE_BASES = [
  [RIBBON.width, 13],
  [RIBBON.width, RIBBON.tileHeight],
];

/** Is this ribbon source one of the accepted shapes, at any whole-number scale? */
function isRibbonSourceShape(width, height) {
  return RIBBON_SOURCE_BASES.some(
    ([baseWidth, baseHeight]) =>
      width % baseWidth === 0 &&
      height % baseHeight === 0 &&
      width / baseWidth === height / baseHeight &&
      width >= baseWidth,
  );
}

/**
 * Normalize a ribbon source to a 43x14 tile. Ribbon stripes are vertical, so a
 * vertical stretch from the typical 43x13 source is distortion-free.
 *
 * A source of any other shape is rejected rather than reshaped, because the
 * resize is `fit: "fill"` — a stretch, not a scale. A 512x512 source does not
 * come out imperfect, it comes out as 43x14 of mush, and by the time anyone
 * sees it the only copy has been deleted. The medal side keeps warning
 * instead: `fit: "inside"` preserves aspect there, so a mismatch costs
 * transparent margin rather than the art.
 *
 * Exact multiples are accepted rather than a percentage tolerance. A tolerance
 * needs a threshold nobody can justify later, and the two failure modes here
 * are not symmetric: a source wrongly rejected costs one retry with the PNG
 * still on disk, while one wrongly accepted is unrecoverable.
 */
async function normalizeRibbon(srcPath) {
  const meta = await readSourceMetadata(srcPath, "ribbon");
  if (!isRibbonSourceShape(meta.width, meta.height)) {
    throw new Error(
      `ribbon source ${path.basename(srcPath)} is ${meta.width}x${meta.height}; ` +
        `ribbon art must be ${RIBBON.width}x13 or ${RIBBON.width}x${RIBBON.tileHeight}, ` +
        `or an exact multiple of one of those (86x26, 129x39, ...). The tile is made ` +
        `by stretching the source to fill ${RIBBON.width}x${RIBBON.tileHeight}, so any ` +
        `other shape is distorted beyond use`,
    );
  }
  const png = await sharp(srcPath)
    .resize({ width: RIBBON.width, height: RIBBON.tileHeight, fit: "fill" })
    .png()
    .toBuffer();
  return { png };
}

/**
 * Normalize a medal source to a 70x120 RGBA tile: scale to fit preserving
 * aspect, place horizontally centered and top-aligned on full transparency.
 */
async function normalizeMedal(srcPath) {
  const warnings = [];
  const meta = await readSourceMetadata(srcPath, "medal");
  // A flattened export is an error, not a warning. The tile is composited onto
  // full transparency, so a source with no alpha fills all 70x120 with a solid
  // rectangle that hides the medals either side of it. readSheet asserts the
  // same thing on the sheets; the input side matters more, because the input is
  // the copy that gets deleted.
  if (!meta.hasAlpha) {
    throw new Error(
      `medal source ${path.basename(srcPath)} has no alpha channel; medal art is placed on ` +
        `transparency, so a flattened export fills the whole tile with a solid rectangle`,
    );
  }
  // Upscaling is the one geometry problem the aspect warnings below cannot see:
  // a source smaller than the tile fits perfectly, fills it edge to edge, and
  // arrives blurred with nothing to compare it against once the original is
  // gone. `withoutEnlargement: false` is deliberate — a small source is still
  // better placed than refused — but it must not be silent.
  if (meta.width < MEDAL.width && meta.height < MEDAL.tileHeight) {
    warnings.push(
      `medal source ${path.basename(srcPath)} is ${meta.width}x${meta.height}, smaller than the ` +
        `${MEDAL.width}x${MEDAL.tileHeight} tile, so it is scaled UP and the tile will look soft. ` +
        `Author medal art at ${MEDAL.width}x${MEDAL.tileHeight} or larger`,
    );
  }
  const fit = await sharp(srcPath)
    .resize({
      width: MEDAL.width,
      height: MEDAL.tileHeight,
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();
  const fitMeta = await sharp(fit).metadata();
  if (fitMeta.height < MEDAL.tileHeight) {
    warnings.push(
      `medal source ${path.basename(srcPath)} fits to ${fitMeta.width}x${fitMeta.height}; aspect is wider than ${MEDAL.width}x${MEDAL.tileHeight}, leaving a ${MEDAL.tileHeight - fitMeta.height}px gap below`,
    );
  } else if (fitMeta.width < MEDAL.width) {
    warnings.push(
      `medal source ${path.basename(srcPath)} fits to ${fitMeta.width}x${fitMeta.height}; aspect is narrower than ${MEDAL.width}x${MEDAL.tileHeight}, leaving ${MEDAL.width - fitMeta.width}px of transparent margin (centered)`,
    );
  }
  const left = Math.round((MEDAL.width - fitMeta.width) / 2);
  const png = await sharp({
    create: {
      width: MEDAL.width,
      height: MEDAL.tileHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fit, top: 0, left }])
    .png()
    .toBuffer();
  return { png, warnings };
}

/**
 * Splice tiles into a sheet by raw-byte concatenation — the only operation
 * that guarantees every non-inserted row stays byte-identical and the sheet's
 * trailing sub-tile pixels survive. Inserts are applied in ascending row
 * order, each at its catalog-derived `y`, on the progressively grown sheet
 * (correctly interleaving multiple inserts at their final positions). When a
 * row lands at or beyond the current end — a new bottom-most award, given the
 * sub-tile remainder — the sheet is padded with transparency up to `y` so the
 * tile sits at its exact consumer-read position.
 *
 * An entry with `replace: true` overwrites the tile already at `y` in place:
 * no shift, no height change. It is used to fix the art of an award that
 * already has a tile, and errors only if `y` is at or past the sheet end (no
 * row to overwrite). The bottom-most award's partial final row is a valid
 * target — the copy clamps to the bytes remaining there.
 *
 * Replaces and inserts must NOT be mixed in one call: a replace copies into an
 * absolute byte offset derived from the catalog row, but an insert grows the
 * buffer and shifts every lower row down, so a replace sorted after an insert
 * would land on the shifted neighbour instead of its target — overwriting the
 * wrong award while the intended one stays broken, with the run still exiting
 * 0. We reject the mix here (and in validateManifest) rather than try to
 * reconcile the two offset spaces.
 */
async function buildSplicedSheet(sheetPath, inserts) {
  if (inserts.length === 0) return null;
  const hasReplace = inserts.some((i) => i.replace);
  const hasInsert = inserts.some((i) => !i.replace);
  if (hasReplace && hasInsert) {
    throw new Error(
      `cannot mix a replace and an insert on the same sheet in one run (${sheetPath}); ` +
        `an insert shifts the buffer and would send the replace to the wrong row — ` +
        `split them across separate runs`,
    );
  }
  const sheet = await readSheet(sheetPath);
  let { data, height } = sheet;
  const { width, channels } = sheet;
  // Names of the awards whose tile is already exactly the art being spliced
  // over it. Collected per tile rather than compared once over the whole sheet
  // at the end: a sheet-wide comparison answers "did this run move anything",
  // which any one real change makes true, and the tile that moved nothing is
  // then consumed and reported as placed. Inserts never appear here — an insert
  // adds a row, so it always changes the sheet.
  const unchanged = [];
  const sorted = [...inserts].sort((a, b) => a.y - b.y);
  for (const ins of sorted) {
    if (ins.y < 0) {
      throw new Error(
        `${ins.replace ? "replace" : "insert"} row y=${ins.y} is negative for "${ins.name}" (${sheetPath})`,
      );
    }
    const rawTile = await tileToRaw(ins.png, channels);
    const expected = width * ins.tileHeight * channels;
    if (rawTile.length !== expected) {
      throw new Error(
        `normalized tile for "${ins.name}" is ${rawTile.length} bytes, expected ${expected} (${width}x${ins.tileHeight}x${channels})`,
      );
    }
    if (ins.replace) {
      // Overwrite the existing tile at `y` in place — no shift, no growth.
      // Gate on the row's *start*, not its full height: the bottom-most award
      // sits in the sheet's sub-tile remainder (the real ribbon sheet is 783px
      // = 55*14 + 13, so its last row is only 13px), and `rawTile.copy` clamps
      // to the bytes actually left, writing the partial row without overrun.
      if (ins.y >= height) {
        throw new Error(
          `replace for "${ins.name}" targets row y=${ins.y} but the sheet is only ${height}px tall; there is no existing tile to overwrite (use an insert for a new award)`,
        );
      }
      const at = ins.y * width * channels;
      // Compare only the bytes that will actually land. `copy` clamps to the
      // room left, which for the bottom-most award is a partial row, and the
      // tile rows past the sheet's end never reach it — a difference confined
      // to those is not a difference to any pixel anyone sees.
      const room = Math.min(rawTile.length, data.length - at);
      if (rawTile.subarray(0, room).equals(data.subarray(at, at + room))) {
        unchanged.push(ins.name);
      }
      rawTile.copy(data, at);
      continue; // height unchanged
    }
    if (ins.y <= height) {
      // In-bounds splice: shift everything below `y` down one tile.
      const splitByte = ins.y * width * channels;
      data = Buffer.concat([
        data.subarray(0, splitByte),
        rawTile,
        data.subarray(splitByte),
      ]);
    } else {
      // Append past the end: pad the gap (the sub-tile remainder) with
      // transparency, then place the tile at its exact catalog row.
      const pad = Buffer.alloc((ins.y - height) * width * channels);
      data = Buffer.concat([data, pad, rawTile]);
    }
    height = Math.max(height, ins.y) + ins.tileHeight;
  }
  // `unchanged` is answered on pixels, here, and that is the only trustworthy
  // way to ask it. The obvious alternative — let CI diff the written file
  // against git — asks the encoder instead of the art: two PNGs can hold
  // identical pixels and differ over metadata (a pHYs density chunk, say), and
  // identical bytes are not what "this award's tile did not change" means
  // anyway, since a sheet carries many awards. That inference also rots on any
  // sharp/libvips/zlib bump. Here it is a Buffer.equals per tile.
  return { data, width, height, channels, unchanged };
}

/**
 * Write a computed raw sheet buffer back out as a PNG.
 *
 * Encoded at full compression with adaptive filtering, which on these sheets is
 * lossless and still smaller than sharp's defaults. Worth setting because a
 * sheet this run touches is re-encoded whole — there is no partial PNG write —
 * so the default's inflation would compound on an asset the client downloads.
 *
 * Both committed sheets are already the output of this function, so encoding
 * one and comparing it to what is in git is a no-op. Keep it that way: it makes
 * an unexpected binary diff mean something. Note it holds only for the file
 * bytes reached through readSheet -> writeSheet; re-compressing a sheet with
 * some other tool will differ over PNG metadata (a pHYs density chunk) while
 * every pixel stays the same.
 *
 * Do NOT add `effort`, `quality`, `colours`/`colors` or `dither`, however good
 * the reported saving looks. sharp sets `palette: true` if any of them is
 * defined (see lib/output.js), and on RGBA art that quantizes: alpha values and
 * visible pixels both change. Verify any encoder change by decoding both sides
 * to raw and comparing them, never by comparing file sizes.
 */
async function writeSheet(sheetPath, plan) {
  const { data, width, height, channels } = plan;
  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(sheetPath);
}

/** Compute and write a spliced sheet in one call (used by tests). */
async function spliceSheet(sheetPath, inserts) {
  const plan = await buildSplicedSheet(sheetPath, inserts);
  if (!plan) return null;
  await writeSheet(sheetPath, plan);
  return { width: plan.width, height: plan.height, channels: plan.channels };
}

/**
 * Why the catalog does not place this award on `kind`'s sheet, phrased for a
 * contributor who has just asserted the opposite by supplying art for it.
 *
 * Checks the reasons in the order membership gates them, rather than
 * shortcutting on what the caller has already ruled out. It stops short of
 * re-checking that the priority is a usable row index, which malformedFields
 * has rejected before any caller reaches this. A wrong reason is
 * worse here than no reason: it sends someone to fix a field that was never
 * the problem, and the caller's preconditions are not visible from inside.
 */
function sheetExclusionReason(award, kind) {
  const { types } = SHEETS[kind];
  if (!types.has(award.awardType)) {
    return `its awardType "${award.awardType}" is not one of ${[...types].join(", ")}`;
  }
  if (kind === "ribbon") return "it has no awardPriority";
  if (award.medalPriority === undefined) return "it has no medalPriority";
  return `its medalPriority ${award.medalPriority} is below ${MEDAL_MIN_PRIORITY}, the sheet's first row`;
}

// Every key a manifest entry may carry. Anything else is rejected rather than
// ignored, because `replace` is read as a strict `=== true`: a near-miss
// spelling ("replaced") reads as absent, which quietly downgrades a replace
// into an insert and shifts every row below the target down by one tile. That
// is the same class of silent row divergence the replace/insert mix guard
// exists to prevent, reached by a different route and with no diagnostic.
const MANIFEST_KEYS = ["name", "ribbon", "medal", "replace"];

/**
 * Is this a source filename the generator may open and then delete?
 *
 * The value is joined to the upload directory, and the result is both read as
 * art and `unlinkSync`'d once its tile is spliced. A value that escapes the
 * directory would therefore consume a file elsewhere in the repo. Restricting
 * it to a bare filename makes containment provable here instead of something
 * to re-derive at each use.
 *
 * Backslash is rejected separately from the `basename` check rather than as a
 * traversal in its own right. On POSIX `path.basename` does not split on it, so
 * `sub\art.png` passes as a plain name and stays inside uploadDir — harmless
 * here, and a directory traversal the moment this runs anywhere `path.join`
 * treats `\` as a separator. Rejecting it keeps containment true on both
 * platforms instead of true only on the runner we happen to use. (`..\x.png` is
 * not the example to reach for: the leading-dot clause below rejects it first.)
 *
 * The leading-dot clause is what stops `..` and `.` themselves, and it also
 * keeps dotfiles out — neither is art anyone means to upload.
 *
 * A committed symlink still passes — it is a plain name. Left open knowingly:
 * `unlink` removes the link rather than its target, so the worst case is a
 * tile spliced from the wrong image, and lstat-ing every source to close it
 * would cost real I/O against a threat that needs commit access to mount.
 */
function isPlainPngName(value) {
  return (
    path.basename(value) === value &&
    !value.includes("\\") &&
    !value.startsWith(".") &&
    /\.png$/i.test(value)
  );
}

/**
 * Validate the manifest against the award catalog (a name-indexed Map from
 * {@link loadCatalog}) and against the sheets themselves. `sheetRows` is each
 * sheet's current row count, from {@link sheetRowCount}; it is required rather
 * than optional, because a default would have this function fabricate the very
 * state it exists to check. Returns { errors }; non-empty means the run must
 * abort before any image is written.
 *
 * Every condition here is an error, never a warning. This tool deletes its
 * sources and empties the manifest on success, and CI opens a PR from that, so
 * a warning is indistinguishable from approval by the time anyone reads it —
 * the inputs that would prove something was skipped are already gone.
 */
function validateManifest(manifest, catalog, uploadDir, sheetRows) {
  // A caller contract, checked because getting it wrong is silent. Integer, not
  // just `typeof === "number"`: NaN is a number, and it propagates into the
  // reconciliation as "the catalog must place NaN award(s) on it" — a tool
  // failure dressed up as a contributor error, telling them to renumber a
  // catalog that was fine. Thrown rather than pushed for the same reason: a
  // caller that gets this wrong has a bug, and it is not the contributor's.
  //
  // Not reachable from run() today — an undecodable sheet throws in
  // sharp().metadata() long before this, which is what the read in run() is
  // positioned to do. It guards the seam, which is exported and has other
  // callers: anything that computes a row count from somewhere other than
  // sheetRowCount can land here with undefined or a float.
  const badRows = ["ribbon", "medal"].filter(
    (kind) => !Number.isInteger(sheetRows?.[kind]) || sheetRows[kind] < 0,
  );
  if (badRows.length > 0) {
    throw new TypeError(
      `validateManifest requires sheetRows { ribbon, medal } as non-negative integer row ` +
        `counts; got ` +
        badRows.map((kind) => `${kind}=${sheetRows?.[kind]}`).join(", "),
    );
  }
  const errors = [];
  if (!Array.isArray(manifest)) {
    errors.push("manifest.json must be a JSON array of entries");
    return { errors };
  }
  const seen = new Set();
  // Source files already claimed by an earlier entry, filename -> which entry.
  // Two entries naming one PNG is not caught by anything else: the row
  // reconciliation counts rows and the row count is right, `consumed` is a Set
  // so the file is unlinked once, and the award whose art was never uploaded is
  // never missed. The result is two awards wearing the same tile, exit 0.
  const claimedSources = new Map();
  // Per-sheet record of what this run does: which placement modes appear (true
  // = replace, false = insert) and how many tiles it inserts. A sheet that sees
  // both modes is rejected below, because mixing them corrupts the wrong row
  // (see buildSplicedSheet). The insert count is the growth the catalog has to
  // have already accounted for — see the reconciliation after the loop.
  const perSheet = {
    ribbon: { inserts: 0, replaces: 0 },
    medal: { inserts: 0, replaces: 0 },
  };
  manifest.forEach((entry, i) => {
    const label = `entry ${i}`;
    if (!entry || typeof entry.name !== "string" || entry.name === "") {
      errors.push(`${label}: missing required "name"`);
      return;
    }
    if (seen.has(entry.name)) {
      errors.push(`${label}: "${entry.name}" is a duplicate manifest entry`);
      return;
    }
    seen.add(entry.name);
    const unknown = Object.keys(entry).filter(
      (k) => !MANIFEST_KEYS.includes(k),
    );
    if (unknown.length > 0) {
      errors.push(
        `${label}: "${entry.name}" has unrecognised key(s) (${unknown.join(", ")}); ` +
          `allowed keys are ${MANIFEST_KEYS.join(", ")} — check the spelling`,
      );
      return;
    }
    if (entry.replace !== undefined && typeof entry.replace !== "boolean") {
      errors.push(
        `${label}: "${entry.name}" has a non-boolean "replace" (must be true or false)`,
      );
      return;
    }
    const award = lookupAward(catalog, entry.name);
    if (!award) {
      errors.push(
        `${label}: "${entry.name}" is not present in the award catalog (awardCatalog.js)`,
      );
      return;
    }
    // A field that is set but unusable must abort, separate from "name absent"
    // and "not a sheet member": otherwise an award whose (say) medalPriority
    // holds a bad value looks like a non-member. With no medal source supplied
    // there is nothing else to notice the mismatch, so the ribbon tile goes in,
    // its source is consumed, and the medal tile is silently never placed.
    const malformed = malformedFields(award);
    if (malformed.length > 0) {
      errors.push(
        `${label}: "${entry.name}" has catalog field(s) that are present but unusable (${malformed.join(", ")}); fix the entry in awardCatalog.js`,
      );
      return;
    }
    if (award.awardType === undefined) {
      errors.push(
        `${label}: "${entry.name}" has no usable awardType in the award catalog`,
      );
      return;
    }
    const needRibbon = onRibbonSheet(award);
    const needMedal = onMedalSheet(award);
    if (!needRibbon && !needMedal) {
      errors.push(
        `${label}: "${entry.name}" (awardType "${award.awardType ?? "?"}") does not belong to the ribbon or medal sprite sheet; only mainline medals/ribbons are supported`,
      );
      return;
    }
    const check = (kind, need) => {
      if (need) {
        if (typeof entry[kind] !== "string" || entry[kind] === "") {
          errors.push(
            `${label}: "${entry.name}" belongs to the ${kind} sheet but supplies no "${kind}" source file`,
          );
        } else if (!isPlainPngName(entry[kind])) {
          errors.push(
            `${label}: "${kind}" source "${entry[kind]}" for "${entry.name}" must be a plain ` +
              `.png filename sitting directly in ${path.basename(uploadDir)}/ — no directories, ` +
              `no "..", no leading dot`,
          );
        } else if (!fs.existsSync(path.join(uploadDir, entry[kind]))) {
          errors.push(
            `${label}: "${kind}" source "${entry[kind]}" for "${entry.name}" not found in ${path.basename(uploadDir)}/`,
          );
        } else if (claimedSources.has(entry[kind])) {
          errors.push(
            `${label}: "${kind}" source "${entry[kind]}" for "${entry.name}" is already claimed by ` +
              `${claimedSources.get(entry[kind])}. Each tile needs its own file: two entries ` +
              `pointing at one PNG splice the same art into both awards' rows, consume the file ` +
              `once, and the art that was meant for the other award is never missed.`,
          );
        } else {
          claimedSources.set(entry[kind], `${label} ("${entry.name}")`);
        }
      } else if (entry[kind]) {
        // Two humans contradicting each other, not a stray file: the manifest
        // asserts this award has art for this sheet, the catalog gives it
        // nowhere to go. Warning here would place the other tile, consume that
        // tile's source and empty the manifest, shipping the award half-placed
        // while the warning reads as "correct, this one is ribbon-only". An
        // omitted priority is the legitimate way to say "no tile on that
        // sheet", so the supplied source is the only signal saying otherwise
        // and it must not be discarded.
        errors.push(
          `${label}: "${entry.name}" supplies a "${kind}" source but the catalog does not ` +
            `place it on the ${kind} sheet — ${sheetExclusionReason(award, kind)}. Either fix ` +
            `the award in awardCatalog.js, or drop "${kind}" from this manifest entry.`,
        );
      }
    };
    check("ribbon", needRibbon);
    check("medal", needMedal);
    const isReplace = entry.replace === true;
    [
      ["ribbon", needRibbon],
      ["medal", needMedal],
    ].forEach(([kind, need]) => {
      if (!need) return;
      if (isReplace) perSheet[kind].replaces += 1;
      else perSheet[kind].inserts += 1;
    });
  });
  // Whether every entry was fully accounted for. An entry that bailed out early
  // above never reached the insert/replace tally, so `perSheet` undercounts and
  // the reconciliation below would compute an expectation from a manifest it
  // only partly read. The run aborts either way, but the second error tells the
  // contributor to renumber a catalog that is fine — and someone who fixes both
  // as instructed ends up with a genuinely broken one.
  const manifestFullyRead = errors.length === 0;
  Object.entries(perSheet).forEach(([kind, { inserts, replaces }]) => {
    const { priorityField, tileHeight, firstPriority } = SHEETS[kind];
    const { count, missing, duplicated, unusable } = catalogSheetRows(
      catalog,
      kind,
    );
    // An award of this sheet's type whose priority cannot be a row index is
    // dropped from `count` and from the numbering, so it can surface as a hole
    // or as a count one short. Appended to whichever check fails rather than
    // raised on its own, and the asymmetry with the hole check below is
    // deliberate: a hole or a repeat is contagious, shifting every award
    // beneath it, whereas an unusable priority costs exactly the one award that
    // has it — and that award cannot be uploaded anyway, because
    // malformedFields rejects it the moment art is supplied for it. So it is
    // not silent where it counts. What it IS good for is explaining a count
    // that does not add up, which is the difference between fixing one broken
    // entry and renumbering a hundred that were fine.
    const asPriorities = (rows) =>
      rows.map((row) => row + firstPriority).join(", ");
    const named = unusable
      .map(({ name, value }) => `"${name}" (${JSON.stringify(value)})`)
      .join(", ");
    const unusableHint =
      unusable.length > 0
        ? ` Note the catalog also gives ${unusable.length === 1 ? "an award" : `${unusable.length} awards`} ` +
          `on the ${kind} sheet ${/^[aeiou]/i.test(priorityField) ? "an" : "a"} ${priorityField} ` +
          `that cannot be a row: ${named}. ` +
          `${unusable.length === 1 ? "It is" : "They are"} not counted as being on the sheet, ` +
          `which may be the whole of what is wrong here.`
        : "";
    // Checked for BOTH sheets, whether or not this run writes to them. Unlike
    // the reconciliation below, a hole or a repeat is a property of the catalog
    // on its own: it misrenders every award beneath it from the moment it is
    // merged, tile or no tile. This upload is what carries the catalog edit
    // into main, so it is the thing that should refuse it. (The break may not
    // be the uploader's doing — it can arrive by any route that edits the
    // catalog — which is why the message describes the fault rather than
    // blaming them.)
    if (missing.length > 0 || duplicated.length > 0) {
      // Reported as priorities, not row indices, via asPriorities above. They
      // differ on the medal sheet (row 0 is medalPriority 2), and the
      // contributor is going to fix this by editing priorities.
      const faults = [];
      if (duplicated.length > 0) {
        faults.push(
          `${priorityField} ${asPriorities(duplicated)} is claimed by more than one award`,
        );
      }
      if (missing.length > 0) {
        faults.push(
          `no award claims ${priorityField} ${asPriorities(missing)}`,
        );
      }
      errors.push(
        `the catalog's ${kind} numbering has a break in it: ${faults.join(", and ")}. ` +
          `The sheet is read at row * ${tileHeight}px, so from that point down every award ` +
          `renders as a different one. Renumber awardCatalog.js so the ${kind} priorities ` +
          `run consecutively with no repeats and no holes.` +
          unusableHint,
      );
      return;
    }
    // Past this point the catalog is coherent on its own terms. What is left is
    // whether it agrees with the sheet, which only matters for a sheet this run
    // writes to: an untouched sheet's drift is the business of the run that
    // finally writes to it.
    if (!manifestFullyRead) return;
    if (inserts === 0 && replaces === 0) return;
    if (inserts > 0 && replaces > 0) {
      errors.push(
        `the ${kind} sheet has both a replace and an insert in one run; ` +
          `an insert shifts the buffer and would send the replace to the wrong row — ` +
          `process them in separate uploads`,
      );
      return;
    }
    // The reconciliation. The sheet records no award identity, so "is this row
    // already taken" cannot be answered by looking at it — and it would be the
    // wrong question anyway, since inserting mid-sheet onto a taken row and
    // renumbering below it is the documented way to add an award. What actually
    // separates that from re-uploading art for an award that already has a tile
    // is whether the catalog grew to account for the new row. So: the catalog
    // must claim one award per row the sheet already holds, plus one for each
    // row this run is about to insert.
    const expected = sheetRows[kind] + inserts;
    if (count === expected) return;
    errors.push(
      (inserts > 0
        ? `the ${kind} sheet has ${sheetRows[kind]} row(s) and this run inserts ` +
          `${inserts}, so the catalog must place ${expected} award(s) on it — it places ` +
          `${count}. An insert pushes every row below it down one tile, so it is only ` +
          `right for an award that is NEW to the sheet: add it to awardCatalog.js and ` +
          `renumber the awards below it. To fix the art of an award that already has a ` +
          `tile, set "replace": true instead. If the catalog looks right as it stands, ` +
          `suspect the sheet: its row count is its pixel height divided by ${tileHeight} ` +
          `and rounded UP, so a stray row of leftover pixels reads as a whole extra row. ` +
          `Do not renumber the catalog to match a sheet you have not checked.`
        : `the ${kind} sheet has ${sheetRows[kind]} row(s) but the catalog places ${count} ` +
          `award(s) on it, and a replace overwrites a tile in place without changing that. ` +
          `If this award is gaining a ${kind} tile it does not have yet while keeping the ` +
          `one it already has on the other sheet, that is an insert on one sheet and a ` +
          `replace on the other, which a single manifest entry cannot express and no ` +
          `sequence of uploads works around — raise it rather than forcing it. Otherwise ` +
          `the sheet and awardCatalog.js have drifted apart, so restore or regenerate one.`) +
        unusableHint,
    );
  });
  return { errors };
}

/**
 * PNGs sitting in the upload folder that no manifest entry names.
 *
 * Read straight off the manifest rather than off what a run consumed, so the
 * answer exists before anything is spliced or deleted — and so it exists for a
 * manifest that will process nothing at all, which is the case it matters most
 * in.
 *
 * Directories are skipped: a sheet's temp file is `<sheet>.png.tmp.png`, and a
 * leftover of any shape there is the write path's business, not unclaimed art.
 * `outputNames` is the basenames to disregard — the sprite sheets, named rather
 * than assumed to live elsewhere. They do in production, but they are outputs
 * either way, and a layout that put them side by side would otherwise have this
 * report the generator's own product back as art nobody claimed.
 */
function unclaimedArt(uploadDir, manifest, outputNames) {
  const claimed = new Set();
  if (Array.isArray(manifest)) {
    manifest.forEach((entry) => {
      if (!entry) return;
      ["ribbon", "medal"].forEach((kind) => {
        if (typeof entry[kind] === "string") claimed.add(entry[kind]);
      });
    });
  }
  const outputs = new Set(outputNames);
  return fs
    .readdirSync(uploadDir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((f) => /\.png$/i.test(f) && !claimed.has(f) && !outputs.has(f));
}

/** Write the manifest array back prettier-clean (2-space, trailing newline). */
function writeManifest(manifestPath, entries) {
  fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2) + "\n");
}

async function run(paths = DEFAULT_PATHS, log = console) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(paths.manifest, "utf8"));
  } catch (e) {
    // JSON.parse names a character offset and no file. This is the one input a
    // contributor hand-edits every time, so it gets the same treatment as the
    // catalog: say which file, and that nothing was touched.
    throw new Error(
      `could not read ${path.basename(paths.manifest)}: ${e.message}. ` +
        `No sprite sheet was modified`,
    );
  }
  // Art in the folder that no entry names. Computed before anything else so it
  // can be reported ahead of every write and every unlink, but only ACTED on
  // below — a manifest that does not validate has an untrustworthy idea of what
  // it claims, and an orphan error raised off the back of a typo'd key sends
  // someone to add an entry when what they need to fix is the key.
  const orphans = unclaimedArt(
    paths.uploadDir,
    manifest,
    [paths.ribbonSheet, paths.medalSheet].map((p) => path.basename(p)),
  );
  // One phrasing of the fact, whether it goes out as an error or a warning.
  const unclaimed = (f) =>
    `${f} is in ${path.basename(paths.uploadDir)}/ but no manifest entry claims it`;
  // Only an empty ARRAY means "nothing to do". A manifest that is not an array
  // at all — an object written where a one-element array was meant — is a
  // mistake worth reporting, not a no-op to skip. Collapsing the two made
  // validateManifest's "must be a JSON array" error unreachable from here, so
  // that manifest was silently ignored and the run exited 0.
  if (Array.isArray(manifest) && manifest.length === 0) {
    // Art with an empty manifest is the one unclaimed-art case a warning cannot
    // cover, and the likeliest slip in the documented flow: drop the PNGs,
    // forget the manifest edit. Nothing is generated, so CI opens no pull
    // request — and the pull request body is the only place a warning is ever
    // read. Silence here is a green check over an upload that did nothing and
    // will keep doing nothing on every push after it.
    if (orphans.length > 0) {
      orphans.forEach((f) =>
        log.error(
          `ERROR: ${unclaimed(f)}, and the manifest is empty, so nothing will be generated ` +
            `from it. Add an entry for it to ${path.basename(paths.manifest)}, or remove the file`,
        ),
      );
      throw new Error(
        `${orphans.length} uploaded file(s) with no manifest entry (${orphans.join(", ")}); ` +
          `no sprite sheet was modified`,
      );
    }
    log.log("uniform-uploads/manifest.json is empty — nothing to process.");
    return { processed: 0, warnings: [] };
  }
  const catalog = await loadCatalog(paths.catalog);

  // Measure both sheets before validating: the reconciliation compares the
  // catalog against how many rows each sheet actually holds. Reading them here
  // also means a missing or undecodable sheet fails before any source has been
  // normalized, let alone consumed.
  const sheetRows = {
    ribbon: sheetRowCount(
      (await readSheetMetadata(paths.ribbonSheet)).height,
      RIBBON.tileHeight,
    ),
    medal: sheetRowCount(
      (await readSheetMetadata(paths.medalSheet)).height,
      MEDAL.tileHeight,
    ),
  };

  const { errors } = validateManifest(
    manifest,
    catalog,
    paths.uploadDir,
    sheetRows,
  );
  if (errors.length > 0) {
    errors.forEach((e) => log.error(`ERROR: ${e}`));
    // The list rides along on the Error too. A caller that is not a terminal —
    // a test, or anything that drives run() programmatically — otherwise gets
    // only the count and has to scrape stderr for what actually went wrong.
    throw Object.assign(
      new Error(
        `manifest validation failed (${errors.length} error(s)); no sprite sheet was modified`,
      ),
      { errors },
    );
  }

  // Every warning goes out as it is produced AND is kept for the return value.
  // Emitting immediately matters because later steps throw: a warning held back
  // to be printed at the end is lost exactly when the run had something to say.
  const allWarnings = [];
  const warn = (m) => {
    allWarnings.push(m);
    log.warn(`WARN: ${m}`);
  };

  // Uploaded art nobody claimed, now that the manifest is known to be coherent
  // and its claims can be believed. Pre-existing behaviour is to leave the file
  // sitting in the folder, which is fine — but the manifest is emptied on the
  // way out, so the next push reports "nothing to generate" and the file stays
  // there forever with its award never getting a tile. A warning is the whole
  // fix: the run is legitimate, it just does less than the uploader thinks.
  // Said here rather than on the way out, because a warning that arrives after
  // the sheets are written and the sources deleted has outlived everything it
  // could have prevented — and is lost outright if a later entry throws.
  orphans.forEach((f) =>
    warn(
      `${unclaimed(f)}; no tile will be spliced from it and the manifest is emptied by this run`,
    ),
  );

  // Build insert plans. Normalize everything BEFORE writing any sheet so a bad
  // source aborts the run without leaving a half-written sheet.
  const ribbonInserts = [];
  const medalInserts = [];
  const consumed = new Set();

  for (const entry of manifest) {
    const award = lookupAward(catalog, entry.name);
    const replace = entry.replace === true;
    if (onRibbonSheet(award)) {
      const { png } = await normalizeRibbon(
        path.join(paths.uploadDir, entry.ribbon),
      );
      ribbonInserts.push({
        y: sheetRowIndex(award, "ribbon") * RIBBON.tileHeight,
        tileHeight: RIBBON.tileHeight,
        png,
        name: entry.name,
        replace,
      });
      // Only mark a source consumed once its tile is actually going into a
      // sheet — never delete art for a tile that wasn't placed.
      consumed.add(entry.ribbon);
    }
    if (onMedalSheet(award)) {
      const { png, warnings: w } = await normalizeMedal(
        path.join(paths.uploadDir, entry.medal),
      );
      w.forEach(warn);
      medalInserts.push({
        y: sheetRowIndex(award, "medal") * MEDAL.tileHeight,
        tileHeight: MEDAL.tileHeight,
        png,
        name: entry.name,
        replace,
      });
      consumed.add(entry.medal);
    }
  }

  // Compute both spliced sheets fully before writing either, then encode each
  // to a temp file and only rename into place once BOTH encodes have succeeded.
  // That way a decode/encode failure on the second sheet can't leave the first
  // already overwritten — the renames are the only mutation, and they run last.
  const ribbonPlan = await buildSplicedSheet(paths.ribbonSheet, ribbonInserts);
  const medalPlan = await buildSplicedSheet(paths.medalSheet, medalInserts);
  const pending = [];
  if (ribbonPlan) pending.push({ dest: paths.ribbonSheet, plan: ribbonPlan });
  if (medalPlan) pending.push({ dest: paths.medalSheet, plan: medalPlan });

  // Tiles whose art is byte-identical to what is already at their row, per
  // tile and per sheet. Two different situations, and they need opposite
  // answers:
  //
  // If EVERY tile in the run is one of these, the run achieves nothing. It
  // would delete the contributor's PNGs, empty the manifest and open a pull
  // request whose only content is a re-encoded sheet, with no way left to tell.
  // Thrown ahead of the writes: nothing has been consumed, so recovery is to do
  // nothing.
  //
  // If only SOME are, the run has real work to do and must not be blocked — an
  // award on both sheets has to supply both sources every time, so fixing the
  // art on one sheet necessarily re-submits the other sheet's tile unchanged,
  // and that is the documented way to do it rather than a mistake. Aborting
  // there told a contributor who had uploaded exactly the right files to go and
  // check they had uploaded the right files. What is owed is a warning naming
  // the tile that did not move, so "I uploaded the wrong file for one of these"
  // is visible in the pull request rather than indistinguishable from success.
  const noops = pending.flatMap(({ dest, plan }) =>
    plan.unchanged.map((name) => ({ sheet: path.basename(dest), name })),
  );
  if (noops.length === ribbonInserts.length + medalInserts.length) {
    throw new Error(
      `this run would change nothing: every tile it splices is byte-identical to the art ` +
        `already in place (${noops.map(({ name, sheet }) => `"${name}" on ${sheet}`).join(", ")}). ` +
        `Nothing has been deleted — check you uploaded the files you meant to, and that they ` +
        `are not the same PNGs the sheets were built from.`,
    );
  }
  noops.forEach(({ sheet, name }) =>
    warn(
      `"${name}" already has exactly this art on ${sheet}, so its tile there is unchanged by ` +
        `this run. That is expected when you are fixing an award's art on the other sheet ` +
        `only; if you meant to change this one, the file you uploaded for it is not the ` +
        `file you edited`,
    ),
  );

  const tmpFor = (dest) => dest + ".tmp.png";
  try {
    const renames = [];
    for (const { dest, plan } of pending) {
      const tmp = tmpFor(dest);
      await writeSheet(tmp, plan);
      renames.push([tmp, dest]);
    }
    // The renames are the only mutation and run last. Two destinations can't be
    // made truly atomic: if the second rename throws, sheet one is already
    // replaced and sheet two is stale. ENOSPC and a Windows file lock are what
    // would do it — not a cross-device move, since tmpFor puts the temp file
    // beside its destination. The manifest is NOT emptied in that case, so the
    // next run re-processes the same entries against an already-modified sheet.
    // That no longer double-applies: for an insert the sheet has grown, so the
    // reconciliation in validateManifest sees a catalog that no longer accounts
    // for it and aborts, and re-running a replace writes the same tile to the
    // same row. Restoring both sheets from git before re-running is still the
    // clean recovery.
    const replaced = [];
    try {
      renames.forEach(([tmp, dest]) => {
        fs.renameSync(tmp, dest);
        replaced.push(path.basename(dest));
      });
    } catch (e) {
      // The reasoning above is a code comment, and the person who hits this is
      // not reading the code — they are reading a bare ENOSPC and deciding what
      // to do next. Say which sheets are already replaced, because that is the
      // difference between "re-run it" and "restore from git first".
      throw new Error(
        `a sprite sheet could not be moved into place: ${e.message}. ` +
          (replaced.length > 0
            ? `${replaced.join(" and ")} HAS already been replaced and ${renames.length - replaced.length} ` +
              `sheet(s) still hold the old art, so the two are now out of step. `
            : `No sheet was replaced. `) +
          `No source has been deleted and the manifest still holds every entry. Restore both ` +
          `sheets from git before re-running`,
      );
    }
  } finally {
    // Best-effort: remove any tmp that didn't get renamed (write failure or a
    // partial-rename crash) so a failed run never litters the repo with orphans.
    pending.forEach(({ dest }) => {
      const tmp = tmpFor(dest);
      if (fs.existsSync(tmp)) {
        try {
          fs.unlinkSync(tmp);
        } catch (e) {
          // Not "nothing more we can do" — say so, through the same helper as
          // every other warning so it reaches run()'s return value and not just
          // the log. The orphan sits inside client/public/skunkworks/, which CI
          // both diffs and commits, so an unremovable one would otherwise ride
          // into the pull request as an untracked file nobody wrote.
          warn(`could not remove temp file ${tmp}: ${e.message}`);
        }
      }
    });
  }

  // Consume sources and empty the manifest of processed entries. An unlink that
  // throws here leaves the manifest full against already-written sheets. On
  // retry an insert run aborts on the reconciliation, and a replace run either
  // re-applies the same tile to the same row or aborts because a source it
  // already deleted is missing — the loop deletes as it goes, so a failure part
  // way through leaves some sources gone. Either way nothing is applied twice.
  // Tracked as it goes, because the loop deletes one at a time and a failure
  // part way through leaves the folder half cleared. Which half is exactly what
  // the person picking up the pieces needs and cannot otherwise find out.
  const deleted = [];
  try {
    consumed.forEach((file) => {
      const p = path.join(paths.uploadDir, file);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        deleted.push(file);
        // validateManifest proved this file existed minutes ago. If it is gone
        // now, something outside this run removed it, and skipping it in
        // silence turns that into a no-op. It is on its way to deletion anyway,
        // so saying so costs nothing and is the only trace anyone would get.
      } else warn(`source ${file} was already gone before it was consumed`);
    });
    writeManifest(paths.manifest, []);
  } catch (e) {
    // Both sheets are correct and on disk at this point; only the upload folder
    // is not. Worth spelling out, because the failure that leaves the manifest
    // full with the sources already deleted presents on the NEXT run as "your
    // source file is missing" — sending someone to re-upload art that is
    // already spliced, which lands as a second insert.
    const left = [...consumed].filter((f) => !deleted.includes(f));
    throw new Error(
      `both sprite sheets are written and correct, but clearing the upload folder failed: ` +
        `${e.message}. The tiles ARE in the sheets — do not upload them again. ` +
        (deleted.length > 0
          ? `Already deleted: ${deleted.join(", ")}. `
          : `Nothing was deleted. `) +
        (left.length > 0
          ? `Still to delete by hand: ${left.join(", ")}. `
          : ``) +
        `Then empty ${path.basename(paths.manifest)} to []`,
    );
  }

  log.log(
    `Processed ${manifest.length} award(s): ` +
      `${ribbonInserts.length} ribbon tile(s)` +
      (ribbonPlan ? ` (sheet now ${ribbonPlan.height}px tall)` : "") +
      `, ${medalInserts.length} medal tile(s)` +
      (medalPlan ? ` (sheet now ${medalPlan.height}px tall)` : "") +
      ".",
  );
  return {
    processed: manifest.length,
    warnings: allWarnings,
    ribbonResult: ribbonPlan && {
      width: ribbonPlan.width,
      height: ribbonPlan.height,
      channels: ribbonPlan.channels,
    },
    medalResult: medalPlan && {
      width: medalPlan.width,
      height: medalPlan.height,
      channels: medalPlan.channels,
    },
  };
}

if (require.main === module) {
  run().catch((err) => {
    // The stack, not just the message: a syntax error in the catalog otherwise
    // surfaces as a bare "Unexpected token '}'" naming no file at all.
    console.error(err.stack ?? err.message);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_PATHS,
  RIBBON,
  MEDAL,
  RIBBON_SHEET_TYPES,
  MEDAL_SHEET_TYPES,
  indexCatalog,
  loadCatalog,
  lookupAward,
  malformedFields,
  onRibbonSheet,
  onMedalSheet,
  sheetRowIndex,
  sheetRowCount,
  catalogSheetRows,
  isPlainPngName,
  isRibbonSourceShape,
  readSheet,
  normalizeRibbon,
  normalizeMedal,
  buildSplicedSheet,
  writeSheet,
  spliceSheet,
  validateManifest,
  writeManifest,
  run,
};
