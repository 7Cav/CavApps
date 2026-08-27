/**
 * Seam: AWARD_CATALOG as data.
 *
 * Combat badges are only displayed to members whose MOS wears that badge's
 * family, so a combat-badge entry without a badgeFamily is worn by nobody. That
 * failure is silent — the badge simply never appears on a uniform — and no
 * behavioural test catches it, because a test only covers the badges it names.
 * This reads the real catalog rather than a fixture, for the reason
 * generateAwardSprites.test.js records: a fixture cannot catch the award data
 * moving or changing shape.
 *
 * Run with `npm run test:client`.
 */

import assert from "node:assert";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHarness } from "../../../../test-harness.mjs";
import { AWARD_CATALOG } from "./awardCatalog.js";
import { AwardType } from "./awardTypes.js";
import { BadgeFamily } from "./badgeFamilies.js";
import { BadgeImages, combatBadgeImagePath } from "./badgeImages.js";

// combatBadgeImagePath returns the path the browser requests, relative to the
// public directory the app is served from.
const PUBLIC_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../public",
);

const { test, report } = createHarness();

const combatBadges = AWARD_CATALOG.filter(
  (award) => award.awardType === AwardType.BadgeCombat,
);

await test("the catalog still contains combat badges to check", () => {
  // Guards the filter above: if awardType or the catalog shape moves, every
  // other assertion here would pass vacuously over an empty list.
  assert.ok(combatBadges.length > 0);
});

const knownFamilies = Object.values(BadgeFamily);
const knownImages = Object.values(BadgeImages);

for (const badge of combatBadges) {
  await test(`${badge.name} belongs to a known badge family`, () => {
    assert.ok(
      knownFamilies.includes(badge.badgeFamily),
      `badgeFamily was ${JSON.stringify(badge.badgeFamily)}; a combat badge ` +
        `without a recognised family is displayed to nobody`,
    );
  });

  await test(`${badge.name} names an image that exists`, () => {
    assert.ok(
      knownImages.includes(badge.badgeImage),
      `badgeImage was ${JSON.stringify(badge.badgeImage)}, which is not one ` +
        `of the images BadgeImages names`,
    );
    // Reached through the same helper canvas.jsx renders from, so a badge whose
    // artwork was never committed fails here rather than 404ing on a uniform.
    const path = join(PUBLIC_DIR, combatBadgeImagePath(badge.badgeImage));
    assert.ok(existsSync(path), `no image file at ${path}`);
  });
}

report();
