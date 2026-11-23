"use strict";

// Title and body of the pull request the AWARD_SPRITES workflow opens, built
// from run()'s result. The reader knows award names, not the generator.

/** "A", "A and B", "A, B and C". */
function listNames(names) {
  return names.length < 3
    ? names.join(" and ")
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/**
 * run().tiles grouped by award, in manifest order. An award none of whose
 * tiles changed is left out; its warnings already say so.
 */
function changedAwards(tiles) {
  const awards = new Map();
  for (const tile of tiles) {
    const award = awards.get(tile.name) ?? {
      name: tile.name,
      replace: tile.replace,
    };
    award[tile.kind] = tile;
    awards.set(tile.name, award);
  }
  return [...awards.values()].filter((a) =>
    [a.ribbon, a.medal].some((t) => t && !t.unchanged),
  );
}

function prTitle(tiles) {
  const awards = changedAwards(tiles);
  const replaced = awards.filter((a) => a.replace).length;
  const verb =
    replaced === 0 ? "add" : replaced === awards.length ? "replace" : "update";
  const names =
    awards.length <= 3
      ? listNames(awards.map((a) => a.name))
      : `${awards.length} awards`;
  return `chore(uniformbuilder): ${verb} award art for ${names}`;
}

function placement(tile, kind) {
  if (!tile) return `No ${kind}`;
  if (tile.unchanged) return "Not changed";
  const verb = tile.replace ? "Replaced" : "New";
  const { above, below } = tile;
  if (above && below) return `${verb}, between ${above} and ${below}`;
  if (below) return `${verb}, first on the sheet, above ${below}`;
  if (above) return `${verb}, last on the sheet, below ${above}`;
  return `${verb}, only award on the sheet`;
}

function prBody({ tiles, warnings }, previewUrl) {
  const awards = changedAwards(tiles);
  const added = awards.filter((a) => !a.replace).map((a) => a.name);
  const replaced = awards.filter((a) => a.replace).map((a) => a.name);
  const summary = [
    added.length > 0 && `Adds art for ${listNames(added)}.`,
    replaced.length > 0 && `Replaces the art for ${listNames(replaced)}.`,
  ].filter(Boolean);

  return [
    summary.join(" "),
    `![Changed tiles with their neighbors](${previewUrl})`,
    "Each row of the image is one award from the table, ribbon on the left and medal " +
      "on the right. Each red box is a changed tile, between the tiles above and below " +
      "it on the same sheet.",
    [
      "| Award | Ribbon | Medal |",
      "| --- | --- | --- |",
      ...awards.map(
        (a) =>
          `| ${a.name} | ${placement(a.ribbon, "ribbon")} | ${placement(a.medal, "medal")} |`,
      ),
    ].join("\n"),
    tiles.some((t) => !t.replace && t.below) &&
      "Each new tile moves the awards after it on its sheet down one slot.",
    "## Check before you merge",
    [
      "- The art in each red box looks right.",
      "- The tiles above and below each box belong to the awards in the table. " +
        "If they do not, the art is in the wrong slot.",
    ].join("\n"),
    warnings.length > 0 && "## Problems found",
    warnings.length > 0 && warnings.map((w) => `- ${w}`).join("\n"),
    "The AWARD_SPRITES workflow made this PR from the files pushed to " +
      "`uniform-uploads/`. It also deletes the uploaded images it used and clears the " +
      "manifest.",
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}

module.exports = { prTitle, prBody };
