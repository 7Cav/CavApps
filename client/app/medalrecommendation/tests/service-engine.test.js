import { describe, expect, test } from "vitest";

import {
  countApproximateSentences,
  countWords,
  generate,
} from "../lib/service-engine";

import {
  APP_RULES,
  RANK_PRECEDENCE,
  SERVICE_AWARD_DEFINITIONS,
  SERVICE_REFERENCE_CHOICES,
  buildOrganizationReference_,
  validateServiceAwardDefinitions_,
} from "../lib/reference-data";

function recipient(
  dropdownName,
  rankAbbreviation,
  rankLong,
  firstName,
  lastName,
  primaryBillet = "",
) {
  return {
    dropdownName,
    rankAbbreviation,
    rankLong,
    firstName,
    lastName,
    milpacsUrl: "https://example.com/profile",
    primaryBillet,
    secondaryBillets: [],
  };
}

function createRoster() {
  return [
    recipient(
      "SGT Alpha.A",
      "SGT",
      "Sergeant",
      "Adam",
      "Alpha",
      "S1 Operations",
    ),
    recipient(
      "CPL Bravo.B",
      "CPL",
      "Corporal",
      "Beth",
      "Bravo",
      "1/B/2-7",
    ),
    recipient(
      "PFC Delta.D",
      "PFC",
      "Private First Class",
      "Dana",
      "Delta",
      "2/B/2-7",
    ),
    recipient(
      "PVT Smith.E",
      "PVT",
      "Private",
      "Ethan",
      "Smith",
      "D/2/B/2-7",
    ),
  ];
}

function createContext() {
  const roster = createRoster();

  const serviceIndividualAwards =
    SERVICE_AWARD_DEFINITIONS.filter(
      (award) => award.scope === "individual",
    );

  const serviceUnitAwards =
    SERVICE_AWARD_DEFINITIONS.filter(
      (award) => award.scope === "unit",
    );

  return {
    rules: APP_RULES,
    rankPrecedence: RANK_PRECEDENCE,
    roster,

    serviceAwards: {
      individual: serviceIndividualAwards,
      unit: serviceUnitAwards,
    },

    serviceReference: {
      organizations: buildOrganizationReference_(roster),
      choices: SERVICE_REFERENCE_CHOICES,
    },
  };
}

function findFailedCheck(result, label) {
  return result.checks.find(
    (item) =>
      item.label === label &&
      item.status === "FAIL",
  );
}

function validHumanitarian() {
  return {
    scope: "individual",
    awardId: "service_humanitarian_service_medal",
    recipients: ["CPL Bravo.B"],
    fields: {},
    narrative:
      "provided technical assistance to a fellow trooper. The assistance restored their system and allowed them to return to duty.",
  };
}

function validSuperiorUnitAward() {
  return {
    scope: "unit",
    awardId: "service_superior_unit_award",
    recipients: [
      "SGT Alpha.A",
      "CPL Bravo.B",
      "PFC Delta.D",
      "PVT Smith.E",
    ],
    fields: {
      recognizedGroup: "S1 Operations",
      benefitedUnit: "B/2-7",
      recognitionBasis:
        "exceptionally meritorious service",
      narrativeVerb: "distinguished",
    },
    narrative:
      "the group improved the department workflow. The changes reduced administrative delays. The improvements benefited the supported unit.",
  };
}

describe("Medal Recommendation Aid — Service citation engine", () => {
  test("loads valid Service award definitions", () => {
    const individualAwards =
      SERVICE_AWARD_DEFINITIONS.filter(
        (award) => award.scope === "individual",
      );

    const unitAwards =
      SERVICE_AWARD_DEFINITIONS.filter(
        (award) => award.scope === "unit",
      );

    expect(individualAwards).toHaveLength(13);
    expect(unitAwards).toHaveLength(2);

    const validation =
      validateServiceAwardDefinitions_();

    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.counts.total).toBe(15);
  });

  test("Service sentence and word counters execute as ES-module functions", () => {
    const narrative =
      "They provided technical assistance. The issue was resolved.";

    expect(
      countApproximateSentences(narrative),
    ).toBe(2);

    expect(countWords(narrative)).toBeGreaterThan(0);
  });

  test("generates a Humanitarian Service Medal recommendation", () => {
    const context = createContext();

    const result = generate(
      validHumanitarian(),
      context,
    );

    expect(result.ready).toBe(true);

    expect(result.statusText).toBe(
      "READY FOR FINAL REVIEW",
    );

    expect(result.award.name).toBe(
      "Humanitarian Service Medal",
    );

    expect(result.recipientNames).toEqual([
      "Corporal Beth Bravo",
    ]);

    expect(result.ticketTitle).toContain("HSM");

    expect(result.citation).toContain(
      "Corporal Beth Bravo",
    );

    expect(result.citation).toContain(
      "For providing aid to a fellow trooper.",
    );

    expect(result.bbcode).toContain(
      "[CENTER][B]Humanitarian Service Medal[/B]",
    );
  });

  test("generates an Army Achievement Medal with organization in the ticket title", () => {
    const context = createContext();

    const payload = {
      scope: "individual",
      awardId: "service_army_achievement_medal",
      recipients: ["CPL Bravo.B"],
      fields: {
        affectedArea: "B/2-7",
      },
      narrative:
        "improved the unit administrative process. The changes reduced delays for members. The resulting process improved unit readiness.",
    };

    const result = generate(payload, context);

    expect(result.ready).toBe(true);

    expect(result.ticketTitle).toBe(
      "Medal Recommendation | B/2-7 | AAM | CPL.Bravo.B",
    );

    expect(result.citation).toContain(
      "For contributions in B/2-7.",
    );

    expect(result.citation).toContain(
      "Corporal Beth Bravo",
    );
  });

  test("supports multiple recipients on an individual Service Medal", () => {
    const context = createContext();

    const payload = validHumanitarian();

    payload.recipients = [
      "PFC Delta.D",
      "SGT Alpha.A",
      "CPL Bravo.B",
    ];

    const result = generate(payload, context);

    expect(result.ready).toBe(true);

    expect(result.recipientNames).toEqual([
      "Sergeant Adam Alpha",
      "Corporal Beth Bravo",
      "Private First Class Dana Delta",
    ]);

    expect(result.ticketTitle).toContain(
      "HSM | Multiple",
    );

    expect(result.bbcode).toContain(
      "Sergeant Adam Alpha",
    );

    expect(result.bbcode).toContain(
      "Private First Class Dana Delta",
    );
  });

  test("rejects duplicate and missing Service Medal recipients", () => {
    const context = createContext();

    const duplicatePayload =
      validHumanitarian();

    duplicatePayload.recipients = [
      "CPL Bravo.B",
      "CPL Bravo.B",
    ];

    const duplicateResult = generate(
      duplicatePayload,
      context,
    );

    expect(duplicateResult.ready).toBe(false);

    expect(
      findFailedCheck(
        duplicateResult,
        "No duplicate recipients",
      ),
    ).toBeDefined();

    const missingPayload =
      validHumanitarian();

    missingPayload.recipients = [
      "PFC Missing.M",
    ];

    const missingResult = generate(
      missingPayload,
      context,
    );

    expect(missingResult.ready).toBe(false);

    expect(
      findFailedCheck(
        missingResult,
        "Every recipient matches the roster",
      ),
    ).toBeDefined();
  });

  test("blocks BBCode injection in Service Medal narratives", () => {
    const context = createContext();

    const payload = validHumanitarian();

    payload.narrative =
      "provided technical assistance. [/CENTER] The member was able to return to duty.";

    const result = generate(payload, context);

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

  test("Joint Service Commendation Medal requires different benefited and assigned companies", () => {
    const context = createContext();

    const payload = {
      scope: "individual",
      awardId:
        "service_joint_service_commendation_medal",
      recipients: ["CPL Bravo.B"],
      fields: {
        actionsOrContributions: "actions",
        benefitedCompany: "B/2-7",
        assignedCompany: "B/2-7",
        narrativeLead:
          "distinguished themselves by",
      },
      narrative:
        "supporting the combat line unit during multiple events. The assistance improved the unit's effectiveness. The work provided a measurable benefit to the unit.",
    };

    const result = generate(payload, context);

    expect(result.ready).toBe(false);

    expect(
      findFailedCheck(
        result,
        "Companies are different",
      ),
    ).toBeDefined();
  });

  test("generates a Service Medal with a valid service period", () => {
    const context = createContext();

    const payload = {
      scope: "individual",
      awardId: "service_legion_of_merit",
      recipients: ["SGT Alpha.A"],
      fields: {
        secondaryBillet: "S1 Operations Clerk",
        creditedDepartmentOrElement:
          "S1 Operations",
        startMonth: "January",
        startYear: "2025",
        endMonth: "December",
        endYear: "2025",
      },
      narrative:
        "maintained a high standard of administrative performance. The work improved the department's ability to process requests. The sustained contribution benefited the Regiment.",
    };

    const result = generate(payload, context);

    expect(result.ready).toBe(true);

    expect(result.citation).toContain(
      "during January 2025 to December 2025.",
    );

    expect(result.ticketTitle).toBe(
      "Medal Recommendation | S1 Operations | LOM | SGT.Alpha.A",
    );

    expect(
      findFailedCheck(
        result,
        "Service period is valid",
      ),
    ).toBeUndefined();
  });

  test("enforces Service Unit Award recipient limits", () => {
    const context = createContext();

    const validResult = generate(
      validSuperiorUnitAward(),
      context,
    );

    expect(validResult.ready).toBe(true);

    expect(validResult.recipientNames).toEqual([
      "Sergeant Adam Alpha",
      "Corporal Beth Bravo",
      "Private First Class Dana Delta",
      "Private Ethan Smith",
    ]);

    expect(validResult.ticketTitle).toContain(
      "SUA | Multiple",
    );

    const invalidPayload =
      validSuperiorUnitAward();

    invalidPayload.recipients = [
      "SGT Alpha.A",
      "CPL Bravo.B",
      "PFC Delta.D",
    ];

    const invalidResult = generate(
      invalidPayload,
      context,
    );

    expect(invalidResult.ready).toBe(false);

    expect(
      findFailedCheck(
        invalidResult,
        "Service Unit recipient limit observed",
      ),
    ).toBeDefined();
  });
});