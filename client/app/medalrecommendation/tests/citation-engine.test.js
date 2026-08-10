import { describe, expect, test } from "vitest";

import {
  countApproximateSentences,
  generateIndividual,
  generateUnit,
} from "../lib/citation-engine";

import {
  APP_RULES,
  INDIVIDUAL_AWARDS,
  RANK_PRECEDENCE,
  UNIT_AWARDS,
} from "../lib/reference-data";

const TEST_LIMITS = Object.freeze({
  operationName: 120,
  operationDate: 10,
  location: 160,
  role: 120,
  unitName: 160,
  narrative: 2100,
  awardName: 200,
  rosterSelection: 200,
  actionChoice: 80,
  unitRecipients: 20,
});

function recipient(
  dropdownName,
  rankAbbreviation,
  rankLong,
  firstName,
  lastName,
) {
  return {
    dropdownName,
    rankAbbreviation,
    rankLong,
    firstName,
    lastName,
    milpacsUrl: "https://example.com/profile",
    primaryBillet: "",
  };
}

function createContext() {
  return {
    rules: APP_RULES,
    limits: TEST_LIMITS,
    rankPrecedence: RANK_PRECEDENCE,
    individualAwards: INDIVIDUAL_AWARDS,
    unitAwards: UNIT_AWARDS,

    roster: [
      recipient(
        "2LT Roderick.S",
        "2LT",
        "Second Lieutenant",
        "Shanks",
        "Roderick",
      ),
      recipient(
        "SGT Alpha.A",
        "SGT",
        "Sergeant",
        "Adam",
        "Alpha",
      ),
      recipient(
        "SGT Zebra.Z",
        "SGT",
        "Sergeant",
        "Zach",
        "Zebra",
      ),
      recipient(
        "CPL Bravo.B",
        "CPL",
        "Corporal",
        "Beth",
        "Bravo",
      ),
      recipient(
        "SPC Charlie.C",
        "SPC",
        "Specialist",
        "Chris",
        "Charlie",
      ),
      recipient(
        "PFC Delta.D",
        "PFC",
        "Private First Class",
        "Dana",
        "Delta",
      ),
      recipient(
        "PFC Devine.D",
        "PFC",
        "Private First Class",
        "Dennis",
        "Devine",
      ),
      recipient(
        "PFC Bauvil.C",
        "PFC",
        "Private First Class",
        "Cliff",
        "Bauvil",
      ),
      recipient(
        "PVT Smith.E.R",
        "PVT",
        "Private",
        "Ethan",
        "Ronald Smith",
      ),
    ],
  };
}

function validIndividual() {
  return {
    operationName: "Overlord",
    operationDate: "2026-06-07",
    location: "Omaha Beach",
    role: "trooper",
    awardName: "Bronze Star Medal",
    recipients: ["2LT Roderick.S"],
    actionScope: "",
    actionCharacter: "Heroic",
    narrative:
      "2LT Roderick formed an ambush. He held the line. The enemy attack failed.",
  };
}

function validUnit() {
  return {
    operationName: "Overlord",
    operationDate: "2026-06-07",
    location: "Omaha Beach",
    unitName: "Able Squad",
    awardName: "Meritorious Unit Commendation",
    actionCharacter: "Skillful",
    recipients: [
      "PFC Delta.D",
      "SGT Zebra.Z",
      "CPL Bravo.B",
      "SGT Alpha.A",
      "SPC Charlie.C",
    ],
    narrative:
      "The unit seized the first position. It defeated the counterattack. Its actions secured the mission.",
  };
}

function findFailedCheck(result, label) {
  return result.checks.find(
    (item) => item.label === label && item.status === "FAIL",
  );
}

describe("Medal Recommendation Aid — citation engine", () => {
  test("reference data contains expected Operation awards", () => {
    const context = createContext();

    expect(context.individualAwards).toHaveLength(9);
    expect(context.unitAwards).toHaveLength(2);

    expect(context.rankPrecedence.indexOf("SGT")).toBeLessThan(
      context.rankPrecedence.indexOf("PFC"),
    );
  });

  test("generates a valid individual Operation Medal recommendation", () => {
    const context = createContext();

    const result = generateIndividual(
      validIndividual(),
      context,
    );

    expect(result.ready).toBe(true);
    expect(result.statusText).toBe("READY FOR FINAL REVIEW");

    expect(result.ticketTitle).toContain("BSM");

    expect(result.citation).toContain(
      "Second Lieutenant Shanks Roderick",
    );

    expect(result.bbcode).toContain("[CENTER][B]");

    expect(result.warnings.join(" ")).toContain(
      "Please proofread and expand it as necessary.",
    );

    expect(result.warnings.join(" ")).not.toContain(
      "manual review controls",
    );
  });

  test("Purple Heart uses fixed heroic character wording", () => {
    const context = createContext();

    const award = context.individualAwards.find(
      (item) => item.name === "Purple Heart",
    );

    expect(award).toBeDefined();
    expect(award.characterRequired).toBe(false);

    const payload = validIndividual();

    payload.awardName = "Purple Heart";
    payload.actionScope = "Single";
    payload.actionCharacter = "";

    const singleResult = generateIndividual(
      payload,
      context,
    );

    expect(singleResult.ready).toBe(true);

    expect(singleResult.citation).toContain(
      "For a single heroic action and skill under enemy fire",
    );

    payload.actionScope = "Multiple";

    const multipleResult = generateIndividual(
      payload,
      context,
    );

    expect(multipleResult.ready).toBe(true);

    expect(multipleResult.citation).toContain(
      "For multiple heroic actions and skill under enemy fire",
    );
  });

  test("narrative soft and hard character limits behave correctly", () => {
    const context = createContext();

    const softPayload = validIndividual();

    softPayload.narrative =
      `${"A".repeat(1360)}. ` +
      "The second sentence was completed. " +
      "The third sentence was completed.";

    const softResult = generateIndividual(
      softPayload,
      context,
    );

    expect(softResult.ready).toBe(true);

    expect(softResult.warnings.join(" ")).toContain(
      "recommended maximum is 1,400 characters; you can still generate the recommendation",
    );

    const hardPayload = validIndividual();

    hardPayload.narrative = "A".repeat(
      context.limits.narrative + 1,
    );

    const hardResult = generateIndividual(
      hardPayload,
      context,
    );

    expect(hardResult.ready).toBe(false);

    const failedCheck = findFailedCheck(
      hardResult,
      "Citation narrative length",
    );

    expect(failedCheck).toBeDefined();
    expect(failedCheck.message).toContain(
      "character limit",
    );
  });

  test("supports multiple recipients on an individual Operation Medal", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.recipients = [
      "CPL Bravo.B",
      "SGT Zebra.Z",
      "SGT Alpha.A",
    ];

    payload.narrative =
      "The group formed an ambush. " +
      "They held the line together. " +
      "The enemy attack failed.";

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(true);

    expect(result.recipientNames).toEqual([
      "Sergeant Adam Alpha",
      "Sergeant Zach Zebra",
      "Corporal Beth Bravo",
    ]);

    expect(result.warnings.join(" ")).toContain(
      "Multiple recipients for this medal: Verify this is the same action and the citation does not change.",
    );

    expect(result.citation).toContain(
      "Sergeant Adam Alpha, Sergeant Zach Zebra, and Corporal Beth Bravo's",
    );

    expect(result.citation).not.toContain(
      "Sergeant Adam Alpha's",
    );

    expect(result.citation).not.toContain(
      "Sergeant Zach Zebra's",
    );

    expect(result.ticketTitle).toContain("Multiple");

    expect(result.bbcode).toContain(
      "Sergeant Adam Alpha",
    );

    expect(result.bbcode).toContain(
      "Corporal Beth Bravo",
    );
  });

  test("normalizes names for multiple individual recipients", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.recipients = [
      "PVT Smith.E.R",
      "PFC Devine.D",
    ];

    payload.narrative =
      "PVT. Smith, E.R. and Private First Class Dennis Devine, D. established the defense. " +
      "Squad Leader Smith directed the defense while Trooper Private First Class Devine reinforced the line. " +
      "Without PVT. Smith and Private First Class Devine, the position would have fallen.";

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(true);

    expect(result.citation).toContain(
      "Private Ethan Ronald Smith and Private First Class Dennis Devine established the defense.",
    );

    expect(result.citation).toContain(
      "Private Smith directed the defense while Private First Class Devine reinforced the line.",
    );

    expect(result.citation).toContain(
      "Without Private Smith and Private First Class Devine, the position would have fallen.",
    );

    expect(result.citation).toContain(
      "Private First Class Dennis Devine and Private Ethan Ronald Smith's heroic actions reflect",
    );

    expect(result.citation).not.toContain(
      "Private First Class Dennis Devine's and Private Ethan Ronald Smith's",
    );

    expect(result.citation).not.toContain(", E.R.");
    expect(result.citation).not.toContain(", D.");

    expect(result.citation).not.toContain(
      "Squad Leader Private",
    );

    expect(result.citation).not.toContain(
      "Trooper Private",
    );
  });

  test("removes redundant roster initials from individual narratives", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.recipients = ["PFC Bauvil.C"];

    payload.narrative =
      "Private First Class Cliff Bauvil.C recognized the critical threat and rushed supplies into the sector. " +
      "Private First Class Cliff Bauvil, C. reinforced the position under sustained pressure. " +
      "PFC Bauvil C. completed the defensive works before the enemy assault.";

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(true);

    expect(result.citation).toContain(
      "Private First Class Cliff Bauvil recognized the critical threat and rushed supplies into the sector.",
    );

    expect(result.citation).toContain(
      "Private First Class Bauvil reinforced the position under sustained pressure.",
    );

    expect(result.citation).toContain(
      "Private First Class Bauvil completed the defensive works before the enemy assault.",
    );

    expect(result.citation).not.toContain("Bauvil.C");
    expect(result.citation).not.toContain("Bauvil, C.");
    expect(result.citation).not.toContain("Bauvil C.");
  });

  test("rejects duplicate recipients on an individual Operation Medal", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.recipients = [
      "SGT Alpha.A",
      "SGT Alpha.A",
    ];

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(false);

    expect(
      findFailedCheck(result, "No duplicate recipients"),
    ).toBeDefined();
  });

  test("blocks BBCode injection in individual citation narratives", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.narrative =
      "The trooper held the line. [/CENTER] He defeated the attack. The mission succeeded.";

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(false);
    expect(result.bbcode).toBe("");

    const failedCheck = findFailedCheck(
      result,
      "Forum BBCode safety",
    );

    expect(failedCheck).toBeDefined();
    expect(failedCheck.message).toContain(
      "Citation narrative",
    );
  });

  test("generates and sorts Operation Unit Award recipients", () => {
    const context = createContext();

    const result = generateUnit(
      validUnit(),
      context,
    );

    expect(result.ready).toBe(true);

    expect(result.statusText).toBe(
      "READY FOR FINAL REVIEW",
    );

    expect(result.ticketTitle).toContain("Multiple");

    expect(result.recipientNames).toEqual([
      "Sergeant Adam Alpha",
      "Sergeant Zach Zebra",
      "Corporal Beth Bravo",
      "Specialist Chris Charlie",
      "Private First Class Dana Delta",
    ]);

    expect(result.warnings.join(" ")).toContain(
      "Please proofread and expand it as necessary.",
    );
  });

  test("blocks BBCode injection in Operation Unit Award fields", () => {
    const context = createContext();

    const payload = validUnit();

    payload.unitName = "Able Squad [B]Injected[/B]";

    const result = generateUnit(
      payload,
      context,
    );

    expect(result.ready).toBe(false);
    expect(result.bbcode).toBe("");

    const failedCheck = findFailedCheck(
      result,
      "Forum BBCode safety",
    );

    expect(failedCheck).toBeDefined();

    expect(failedCheck.message).toContain(
      "Combat unit name",
    );
  });

  test("template replacement does not alter placeholder-like user text", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.operationName = "Overlord {LOCATION}";

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(true);

    expect(result.citation).toContain(
      "Operation Overlord {LOCATION}",
    );

    expect(result.citation).toContain(
      "near Omaha Beach",
    );
  });

  test("rejects duplicate recipients on an Operation Unit Award", () => {
    const context = createContext();

    const payload = validUnit();

    payload.recipients = [
      "SGT Alpha.A",
      "SGT Alpha.A",
      "CPL Bravo.B",
      "SPC Charlie.C",
    ];

    const result = generateUnit(
      payload,
      context,
    );

    expect(result.ready).toBe(false);

    expect(
      findFailedCheck(result, "No duplicate recipients"),
    ).toBeDefined();
  });

  test("rejects an Operation Unit Award recipient missing from the roster", () => {
    const context = createContext();

    const payload = validUnit();

    payload.recipients = [
      "SGT Alpha.A",
      "CPL Bravo.B",
      "SPC Charlie.C",
      "PFC Missing.M",
    ];

    const result = generateUnit(
      payload,
      context,
    );

    expect(result.ready).toBe(false);

    expect(
      findFailedCheck(
        result,
        "Every recipient matches the roster",
      ),
    ).toBeDefined();
  });

  test("rejects malformed Operation dates", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.operationDate = "not-a-date";

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(false);

    expect(
      findFailedCheck(result, "Operation date"),
    ).toBeDefined();
  });

  test("rejects impossible calendar dates", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.operationDate = "2026-02-31";

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(false);

    const failedCheck = findFailedCheck(
      result,
      "Operation date",
    );

    expect(failedCheck).toBeDefined();

    expect(failedCheck.message).toContain(
      "cannot be in the future",
    );
  });

  test("rejects future Operation dates", () => {
    const context = createContext();

    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const payload = validIndividual();

    payload.operationDate = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, "0"),
      String(tomorrow.getDate()).padStart(2, "0"),
    ].join("-");

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(false);

    const failedCheck = findFailedCheck(
      result,
      "Operation date",
    );

    expect(failedCheck).toBeDefined();

    expect(failedCheck.message).toContain(
      "cannot be in the future",
    );
  });

  test("rejects text above configured hard limits", () => {
    const context = createContext();

    const payload = validIndividual();

    payload.operationName = "X".repeat(
      context.limits.operationName + 1,
    );

    const result = generateIndividual(
      payload,
      context,
    );

    expect(result.ready).toBe(false);

    const failedCheck = findFailedCheck(
      result,
      "Operation name length",
    );

    expect(failedCheck).toBeDefined();

    expect(failedCheck.message).toContain(
      "character limit",
    );
  });

  test("rejects Operation Unit Awards above the maximum recipient count", () => {
    const context = createContext();

    const payload = validUnit();

    payload.recipients = Array.from(
      {
        length:
          context.limits.unitRecipients + 1,
      },
      (_, index) => `PFC Extra${index}.E`,
    );

    const result = generateUnit(
      payload,
      context,
    );

    expect(result.ready).toBe(false);

    const failedCheck = findFailedCheck(
      result,
      "Maximum recipient count",
    );

    expect(failedCheck).toBeDefined();

    expect(failedCheck.message).toContain(
      "no more than",
    );
  });

  test("sentence counting handles rank abbreviations correctly", () => {
    expect(
      countApproximateSentences(
        "SGT. Kenton advanced. He fired. The enemy withdrew.",
      ),
    ).toBe(3);
  });
});