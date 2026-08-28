import { describe, expect, it } from "vitest";

import {
  buildOrganizationOptions,
  filterBulkRoster,
  matchPastedRecipients,
  resolveExistingRecipients,
} from "./bulk-recipient-utils";

const ROSTER = [
  {
    dropdownName: "SGT Alpha.A",
    rankAbbreviation: "SGT",
    rankLong: "Sergeant",
    firstName: "Adam",
    lastName: "Alpha",
    fullName: "Adam Alpha",
    rosterName: "Alpha.A",
    primaryBillet: "B/2/B/2-7",
    secondaryBillets: ["S1 Operations"],
    billets: ["B/2/B/2-7", "S1 Operations"],
  },
  {
    dropdownName: "CPL Bravo.B",
    rankAbbreviation: "CPL",
    rankLong: "Corporal",
    firstName: "Beth",
    lastName: "Bravo",
    fullName: "Beth Bravo",
    rosterName: "Bravo.B",
    primaryBillet: "D/2/B/2-7",
    secondaryBillets: ["S3 HLL"],
    billets: ["D/2/B/2-7", "S3 HLL"],
  },
  {
    dropdownName: "SPC Charlie.C",
    rankAbbreviation: "SPC",
    rankLong: "Specialist",
    firstName: "Chris",
    lastName: "Charlie",
    fullName: "Chris Charlie",
    rosterName: "Charlie.C",
    primaryBillet: "D/2/B/2-7",
    secondaryBillets: [],
    billets: ["D/2/B/2-7"],
  },
];

describe("bulk recipient utilities", () => {
  it("matches the supported pasted-name formats", () => {
    const result = matchPastedRecipients(
      ["Sergeant Adam Alpha", "CPL Beth Bravo", "Chris Charlie"].join("\n"),
      ROSTER,
    );

    expect(result.matched).toEqual([
      "SGT Alpha.A",
      "CPL Bravo.B",
      "SPC Charlie.C",
    ]);
    expect(result.unmatched).toEqual([]);
    expect(result.duplicates).toEqual([]);
  });

  it("accepts roster names and reports duplicate selections", () => {
    const result = matchPastedRecipients(
      ["Alpha.A", "SGT Alpha.A", "Bravo.B"].join("\n"),
      ROSTER,
      ["SGT Alpha.A"],
    );

    expect(result.matched).toEqual(["CPL Bravo.B"]);
    expect(result.duplicates).toEqual(["Alpha.A", "SGT Alpha.A"]);
  });

  it("reports names that cannot be matched uniquely", () => {
    const result = matchPastedRecipients(
      "Someone Not On Roster\nBeth Bravo",
      ROSTER,
    );

    expect(result.matched).toEqual(["CPL Bravo.B"]);
    expect(result.unmatched).toEqual(["Someone Not On Roster"]);
  });

  it("filters by both free-text search and organization", () => {
    expect(filterBulkRoster(ROSTER, "s1", "")).toHaveLength(1);
    expect(filterBulkRoster(ROSTER, "", "D/2/B/2-7")).toHaveLength(2);
    expect(filterBulkRoster(ROSTER, "bravo", "S3 HLL")).toHaveLength(1);
  });

  it("builds unique organization choices from primary and secondary billets", () => {
    expect(buildOrganizationOptions(ROSTER)).toEqual([
      "B/2/B/2-7",
      "D/2/B/2-7",
      "S1 Operations",
      "S3 HLL",
    ]);
  });

  it("restores existing manual recipients into the bulk selector", () => {
    const result = resolveExistingRecipients(
      ["SGT Alpha.A", "Beth Bravo", "Bad Entry", ""],
      ROSTER,
    );

    expect(result.matched).toEqual(["SGT Alpha.A", "CPL Bravo.B"]);
    expect(result.unmatched).toEqual(["Bad Entry"]);
  });
});
