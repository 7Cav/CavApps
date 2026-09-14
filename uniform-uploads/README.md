# uniform-uploads

Drop folder for queuing new Uniform Builder awards. Pushing a change under this
folder triggers the **award_sprites** GitHub Actions workflow, which regenerates
the sprite sheets and opens a pull request for review.

## How to add an award

1. **Edit the catalog first.** Add (and renumber) the award in
   `client/app/uniformbuilder/modules/constants/awardCatalog.js`. This is the
   single source of truth for placement — CI imports the same module the
   uniform builder renders from and reads `awardPriority` / `medalPriority`
   off it; the manifest never restates row numbers.
2. **Drop the source art** here as PNG(s), named as plain filenames — no
   subdirectories, and the name must end in `.png`:
   - Ribbon art: 43×13 or 43×14, RGB or RGBA, or an exact whole-number multiple
     of either (86×26, 86×28, 129×39, …). A tile is 13 lines of ribbon over one
     transparent line, the gap the rack shows between ribbons. A 43×13 source
     is the ribbon alone and lands on the top 13 lines; a 43×14 source brings
     its own 14th line, so leave that line clear. Any other shape fails the
     run: the resize is a _stretch_ to fill the width, so a source of another
     shape comes out distorted rather than merely imperfect, and by then your
     PNG is gone.

     Author at 1× if you can. A larger source is scaled down first, and that
     resample softens stripe edges, so the tile it produces is **not** the same
     as the one you would get from a 43×13 original.

   - Medal art: RGBA with transparency, ideally 70×120 or larger (it is scaled
     to fit a 70×120 tile, centered horizontally, top-aligned on
     transparency). Odd proportions warn rather than fail — the scale preserves
     aspect, so the cost is transparent margin, not the art. A source smaller
     than the tile is scaled **up**, which warns too: it will look soft, and
     once the run consumes it there is nothing left to compare against.

3. **Add a manifest entry** to `manifest.json` (a JSON array):

   ```json
   [
     {
       "name": "Foxhole Service Ribbon",
       "ribbon": "FH_Ribbon_uniform.png",
       "medal": "FH_medal_uniforms.png"
     }
   ]
   ```

   - `name` must match the catalog award name exactly.
   - `ribbon` and `medal` must be plain filenames sitting in this folder. A
     path that climbs out of it (`../…`) is rejected: the generator deletes
     each source once its tile is spliced.
   - Every entry needs its **own** file. Two entries naming one PNG is
     rejected: it would splice the same art into both awards' rows and consume
     the file once, so the art meant for the second award would never be
     missed. Copy-pasting an entry and forgetting to change the filename is
     the way this happens.
   - `name`, `ribbon`, `medal` and `replace` are the only keys an entry may
     carry, and the error message lists them if you get one wrong. Anything
     else fails the run: a misspelled `replace` would otherwise read as absent,
     inserting a tile instead of overwriting one and pushing every award below
     it down a row.
   - Supply `ribbon` if the award has an `awardPriority`, and `medal` if it has
     a `medalPriority` of 2 or higher. Service ribbons have both; pure ribbons
     have only `ribbon`. Priorities 0 and 1 are the two Lifetime medals, which
     sit on the ribbon sheet only.
   - Supplying art for a sheet the catalog does not place the award on fails
     the run rather than skipping that tile. If you meant to add the tile, the
     catalog entry is what needs fixing; if you did not, drop the key. Either
     way nothing is spliced and your PNGs stay put for the retry.
   - Only mainline medals and ribbons live in these two sheets. Badges, tabs,
     weapon quals and unit citations render from separate assets and cannot be
     uploaded here, even though they carry an `awardPriority`.

4. **Push.** CI validates the manifest against the catalog, splices the tiles
   into the sprite sheets at the catalog-derived rows, removes the consumed
   PNGs, empties the manifest, and opens a PR containing only the regenerated
   sheets and this cleanup. Review and merge it.

CI never edits the catalog, never touches the `.xcf` GIMP sources, and never
auto-merges.

## Adding new art vs. fixing existing art

Two modes, selected per entry:

- **New award (default) — insert.** Omit `replace` (or set it to `false`). CI
  splices the tile in at the catalog-derived row and shifts every row below it
  down by one tile. Use this only for an award that is **new to the sheet**, and
  renumber the catalog as in step 1 so the priorities below it move too.

  Renumbering is not bookkeeping you can skip. CI checks that the catalog
  places one award for every row the sheet already holds, plus one for each row
  your upload inserts, so an insert only adds up if the catalog gained an award
  to match. Re-uploading art for an award that is already on the sheet without
  setting `replace` fails this check, which is the point: it would otherwise
  have pushed every award below it down a row, and you would not have found out
  until the sprites looked wrong in the builder.

  The priorities themselves also have to run consecutively, with no repeats and
  no holes. Renumbering by hand across a hundred awards makes both easy to
  produce, and either one misrenders every award below it, so CI rejects them
  and names the priority at fault.

  What this check cannot catch: it counts rows, so it is satisfied by the wrong
  insert as readily as the right one. Add award X to the catalog and then
  upload art under existing award Y's name as an insert, and the numbers still
  balance — the tile lands on Y's row and shifts everything below it. Getting
  the `name` right is still on you; the check only proves the catalog grew.

- **Existing award — replace.** Set `"replace": true`. CI overwrites the tile
  already at that award's catalog row in place — no shift, no height change —
  so re-uploading art for an award that already has a tile fixes it instead of
  inserting a duplicate.

  ```json
  [
    {
      "name": "Army Distinguished Service Cross",
      "ribbon": "ADSC_ribbon_v2.png",
      "medal": "ADSC_medal_v2.png",
      "replace": true
    }
  ]
  ```

  Do **not** renumber the catalog for a replace — the award keeps its existing
  priority. Replacing a row that doesn't exist yet (a priority past the end of
  the sheet) fails the run; use an insert for a genuinely new award. If the
  catalog and the sheet disagree about how many awards are on it, a replace
  fails too, since overwriting a tile in place cannot settle that difference.

  **Fixing the art on only one sheet.** Most medals sit on both sheets, and an
  entry has to supply both sources every time — so to fix just the medal, you
  re-supply the ribbon art you already have. That is fine and it is the
  intended way to do it. The run notices that the ribbon tile did not change
  and says so in the PR body, naming the award and the sheet; treat that
  warning as confirmation, unless it names a tile you _did_ mean to change, in
  which case the file you uploaded for it is not the file you edited.

One case the manifest cannot express: an award that already has a tile on one
sheet gaining its first tile on the other. That is a replace on one sheet and
an insert on the other, and `replace` is set per entry rather than per sheet.
Splitting it across two uploads does not help, because an award on both sheets
must supply both sources every time. Ask a maintainer rather than working
around it.

Two more things fail the run rather than passing quietly:

- **Art identical to every tile it would place.** The run would consume your
  PNGs and change nothing at all, so it stops before deleting anything — your
  files are still here and the manifest still holds its entries. Checked on
  pixels, per tile: a tile that changes nothing alongside one that does is the
  one-sheet case above, and warns instead.
- **A medal source saved without an alpha channel.** It would fill the whole
  tile with a solid rectangle, hiding the medals either side of it.

And **art in this folder that no manifest entry claims**. If the manifest has
other work to do, that is a warning in the PR body — the run is legitimate, it
just did less than you intended, and your file is still here. If the manifest
is _empty_, it is an error instead. Nothing would be generated, so no PR gets
opened and there is no PR body for a warning to appear in: the push would have
gone green over an upload that did nothing, and would keep doing so on every
push after it. Dropping the PNGs and forgetting the manifest edit is the
easiest mistake here, so it fails loudly rather than quietly.
