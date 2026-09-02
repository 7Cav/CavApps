import { OPERATION_MEDALS } from "../lib/medal-definitions.js";
import {
  applyAwardChange,
  getCitationChoiceText,
  resolveMedalWorksheet,
} from "../lib/worksheet-profiles.js";

function getMedal(name) {
  return OPERATION_MEDALS.find((medal) => medal.name === name);
}

describe("Medal Recommendation Aid - worksheet profiles", () => {
  test("resolves the shared Operation worksheet for ARCOM", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    expect(worksheet.recipientType).toBe("individual");

    expect(worksheet.fields.combatElement).toMatchObject({
      type: "text",
      variant: "combat",
      required: true,
      label: "Combat Element",
      placeholder: "a rifleman, the Allied commander, etc.",
    });

    expect(worksheet.fields.operationTitle).toMatchObject({
      type: "text",
      required: true,
      label: "Operation Title",
    });

    expect(worksheet.fields.location).toMatchObject({
      type: "text",
      required: true,
      label: "Location",
    });

    expect(worksheet.fields.operationDate).toMatchObject({
      type: "date",
      required: true,
      label: "Operation Date",
    });

    expect(worksheet.fields.narrative).toMatchObject({
      type: "textarea",
      required: true,
      label: "Narrative",
    });

    expect(worksheet.fields.actionCharacter).toBeDefined();
    expect(worksheet.fields.scope).toBeUndefined();
  });

  test("overrides only the element configuration needed by DFC", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Distinguished Flying Cross"),
    );

    expect(worksheet.fields.combatElement).toMatchObject({
      type: "text",
      variant: "airframe",
      required: true,
      label: "Airframe",
      placeholder: "an F/A-18, a Rotary-Wing, etc.",
    });

    expect(worksheet.fields.operationTitle.label).toBe("Operation Title");
    expect(worksheet.fields.location.label).toBe("Location");
    expect(worksheet.fields.operationDate.label).toBe("Operation Date");
    expect(worksheet.fields.narrative.label).toBe("Narrative");

    expect(worksheet.fields.actionCharacter).toBeUndefined();
    expect(worksheet.fields.scope).toBeUndefined();
  });

  test.each([
    ["Army Commendation Medal", "combat"],
    ["Army Commendation Medal With Valor", "combat"],
    ["Air Medal", "aircrew"],
    ["Purple Heart", "combat"],
    ["Bronze Star Medal", "combat"],
    ["Bronze Star Medal With Valor", "combat"],
    ["Distinguished Flying Cross", "airframe"],
    ["Silver Star", "leadership"],
    ["Distinguished Service Cross", "combat"],
  ])(
    "%s resolves the correct worksheet profile and combat element semantics",
    (medalName, combatElementVariant) => {
      const medal = getMedal(medalName);
      const worksheet = resolveMedalWorksheet(medal);

      expect(medal.worksheetProfile).toBe("operationIndividual");
      expect(worksheet.fields.combatElement.variant).toBe(combatElementVariant);
    },
  );

  test("resolves medal-specific field overrides that shape the worksheet", () => {
    const airMedalWorksheet = resolveMedalWorksheet(getMedal("Air Medal"));
    const bronzeStarWorksheet = resolveMedalWorksheet(
      getMedal("Bronze Star Medal"),
    );

    expect(airMedalWorksheet.fields.combatElement.label).toBe(
      "Aircrew Combat Element",
    );
    expect(bronzeStarWorksheet.fields.actionCharacter).toBeDefined();
  });

  test("declares award-change behavior for shared Operation fields", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    expect(worksheet.fields.combatElement.awardChange).toBe("sameVariant");
    expect(worksheet.fields.operationTitle.awardChange).toBe("preserve");
    expect(worksheet.fields.location.awardChange).toBe("preserve");
    expect(worksheet.fields.operationDate.awardChange).toBe("preserve");
    expect(worksheet.fields.narrative.awardChange).toBe("preserve");
  });

  test("declares medal-specific choices to reset when the award changes", () => {
    const arcomWorksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    const purpleHeartWorksheet = resolveMedalWorksheet(
      getMedal("Purple Heart"),
    );

    expect(arcomWorksheet.fields.actionCharacter.awardChange).toBe("reset");
    expect(purpleHeartWorksheet.fields.scope.awardChange).toBe("reset");
  });

  test("preserves shared Operation values when changing between compatible medals", () => {
    const previousWorksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    const nextWorksheet = resolveMedalWorksheet(getMedal("Bronze Star Medal"));

    const values = {
      actionCharacter: "skillful",
      scope: "",
      combatElement: "a rifleman",
      operationTitle: "Overlord",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative: "Existing narrative",
    };

    expect(applyAwardChange(previousWorksheet, nextWorksheet, values)).toEqual({
      actionCharacter: "",
      scope: "",
      combatElement: "a rifleman",
      operationTitle: "Overlord",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative: "Existing narrative",
    });
  });

  test("clears the combat element when its semantic variant changes", () => {
    const previousWorksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    const nextWorksheet = resolveMedalWorksheet(
      getMedal("Distinguished Flying Cross"),
    );

    const values = {
      actionCharacter: "",
      scope: "",
      combatElement: "a rifleman",
      operationTitle: "Overlord",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative: "Existing narrative",
    };

    expect(
      applyAwardChange(previousWorksheet, nextWorksheet, values),
    ).toMatchObject({
      combatElement: "",
      operationTitle: "Overlord",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative: "Existing narrative",
    });
  });

  test("clears Scope when leaving Purple Heart", () => {
    const previousWorksheet = resolveMedalWorksheet(getMedal("Purple Heart"));

    const nextWorksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    const values = {
      actionCharacter: "",
      scope: "single",
      combatElement: "a rifleman",
      operationTitle: "Overlord",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative: "Existing narrative",
    };

    expect(
      applyAwardChange(previousWorksheet, nextWorksheet, values),
    ).toMatchObject({
      scope: "",
      combatElement: "a rifleman",
    });
  });

  test("declares presentation metadata for shared Operation fields", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    expect(worksheet.fields.operationTitle).toMatchObject({
      label: "Operation Title",
      placeholder: "Overlord",
    });

    expect(worksheet.fields.location).toMatchObject({
      label: "Location",
      placeholder: "Omaha Beach",
    });

    expect(worksheet.fields.operationDate).toMatchObject({
      label: "Operation Date",
      defaultValue: "",
      invalidMessage: "Date must be today or earlier",
    });

    expect(worksheet.fields.narrative).toMatchObject({
      label: "Narrative",
      defaultValue: "",
      placeholder: "Explain the lead-up, actions, and outcome...",
      rows: 8,
      feedback: "narrativeWarnings",
    });

    expect(worksheet.fields.operationTitle.defaultValue).toBe("");
    expect(worksheet.fields.location.defaultValue).toBe("");
  });

  test("declares worksheet-controlled field order", () => {
    const arcomWorksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );
    const purpleHeartWorksheet = resolveMedalWorksheet(
      getMedal("Purple Heart"),
    );

    expect(arcomWorksheet.fieldOrder).toEqual([
      "actionCharacter",
      "combatElement",
      "operationTitle",
      "location",
      "operationDate",
      "narrative",
    ]);
    expect(purpleHeartWorksheet.fieldOrder).toEqual([
      "scope",
      "combatElement",
      "operationTitle",
      "location",
      "operationDate",
      "narrative",
    ]);
  });

  test("resolves a new medal field without field-specific profile plumbing", () => {
    const worksheet = resolveMedalWorksheet({
      worksheetProfile: "operationIndividual",
      fields: {
        missionCode: {
          type: "text",
          required: true,
          defaultValue: "",
          label: "Mission Code",
          placeholder: "EXFOR-01",
        },
      },
    });

    expect(worksheet.fields.missionCode).toMatchObject({
      type: "text",
      required: true,
      defaultValue: "",
      label: "Mission Code",
      placeholder: "EXFOR-01",
      awardChange: "reset",
    });
    expect(worksheet.fieldOrder.at(-1)).toBe("missionCode");
  });

  test("clones choice options into the resolved worksheet", () => {
    const medal = getMedal("Army Commendation Medal");
    const worksheet = resolveMedalWorksheet(medal);

    expect(worksheet.fields.actionCharacter.options).toEqual(
      medal.fields.actionCharacter.options,
    );
    expect(worksheet.fields.actionCharacter.options).not.toBe(
      medal.fields.actionCharacter.options,
    );
    expect(worksheet.fields.actionCharacter.options[0]).not.toBe(
      medal.fields.actionCharacter.options[0],
    );
  });

  test("ignores malformed or incomplete medal field overrides", () => {
    const worksheet = resolveMedalWorksheet({
      worksheetProfile: "operationIndividual",
      fields: {
        combatElement: "unsupported",
        ignoredNull: null,
        incompleteField: {
          label: "Incomplete Field",
        },
      },
    });

    expect(worksheet.fields.combatElement).toMatchObject({
      type: "text",
      variant: "combat",
      label: "Combat Element",
    });
    expect(worksheet.fields.combatElement).not.toHaveProperty("0");
    expect(worksheet.fields.ignoredNull).toBeUndefined();
    expect(worksheet.fields.incompleteField).toBeUndefined();
  });

  test("preserves the profile award-change policy for field overrides", () => {
    const worksheet = resolveMedalWorksheet(getMedal("Air Medal"));

    expect(worksheet.fields.combatElement.awardChange).toBe("sameVariant");
  });

  test("initializes a new field from its worksheet default", () => {
    const worksheet = resolveMedalWorksheet({
      worksheetProfile: "operationIndividual",
      fields: {
        missionCode: {
          type: "text",
          required: true,
          defaultValue: "EXFOR-01",
          label: "Mission Code",
        },
      },
    });

    expect(applyAwardChange(null, worksheet, {})).toMatchObject({
      missionCode: "EXFOR-01",
    });
  });

  test("initializes a preserved field from its worksheet default", () => {
    const worksheet = {
      fields: {
        missionCode: {
          awardChange: "preserve",
          defaultValue: "EXFOR-01",
        },
      },
    };

    expect(applyAwardChange(null, worksheet, {})).toEqual({
      missionCode: "EXFOR-01",
    });
  });

  test.each([
    ["the next field default", "NEXT-01", "PREVIOUS-01", "NEXT-01"],
    ["the previous field default", undefined, "PREVIOUS-01", "PREVIOUS-01"],
    ["an empty-string fallback", undefined, undefined, ""],
  ])(
    "uses %s when a same-variant field changes semantics",
    (_defaultSource, nextDefault, previousDefault, expectedValue) => {
      const previousWorksheet = {
        fields: {
          missionCode: {
            variant: "previous",
            awardChange: "sameVariant",
            ...(previousDefault === undefined
              ? {}
              : { defaultValue: previousDefault }),
          },
        },
      };
      const nextWorksheet = {
        fields: {
          missionCode: {
            variant: "next",
            awardChange: "sameVariant",
            ...(nextDefault === undefined ? {} : { defaultValue: nextDefault }),
          },
        },
      };

      expect(
        applyAwardChange(previousWorksheet, nextWorksheet, {
          missionCode: "CURRENT-01",
        }),
      ).toEqual({
        missionCode: expectedValue,
      });
    },
  );

  test("resets to an empty string when neither field declares a default", () => {
    const previousWorksheet = {
      fields: {
        missionCode: {
          awardChange: "reset",
        },
      },
    };
    const nextWorksheet = {
      fields: {
        missionCode: {
          awardChange: "reset",
        },
      },
    };

    expect(
      applyAwardChange(previousWorksheet, nextWorksheet, {
        missionCode: "CURRENT-01",
      }),
    ).toEqual({
      missionCode: "",
    });
  });

  test("initializes a preserved field without a default to an empty string", () => {
    const worksheet = {
      fields: {
        missionCode: {
          awardChange: "preserve",
        },
      },
    };

    expect(applyAwardChange(null, worksheet, {})).toEqual({
      missionCode: "",
    });
  });

  test("rejects an unsupported award-change policy", () => {
    const worksheet = {
      fields: {
        missionCode: {
          awardChange: "unsupported",
        },
      },
    };

    expect(() => applyAwardChange(null, worksheet, {})).toThrow(
      'Unsupported award-change policy for field "missionCode"',
    );
  });

  test("declares Action Character options as citation-ready choices", () => {
    const medal = getMedal("Army Commendation Medal");

    expect(medal.fields.actionCharacter).toEqual({
      type: "citationChoice",
      required: true,
      defaultValue: "",
      label: "Action Character",
      placeholder: "Select action character",
      options: [
        {
          id: "skillful",
          label: "Skillful",
          citationText: "skillful",
        },
        {
          id: "heroic",
          label: "Heroic",
          citationText: "heroic",
        },
      ],
    });
  });

  test("declares Purple Heart Scope as semantic choices", () => {
    const medal = getMedal("Purple Heart");

    expect(medal.fields.scope).toEqual({
      type: "scopeChoice",
      required: true,
      defaultValue: "",
      label: "Scope",
      placeholder: "Select action scope",
      options: [
        {
          id: "single",
          label: "Single",
        },
        {
          id: "multiple",
          label: "Multiple",
        },
      ],
    });
  });

  test("Purple Heart rejects an unsupported Scope value", () => {
    const medal = getMedal("Purple Heart");

    expect(() =>
      medal.buildOpening({
        scope: "unsupported",
        combatElement: "a rifleman",
        operationTitle: "Overlord",
        location: "Remagen",
        date: "11 August 2026",
      }),
    ).toThrow("Unsupported Purple Heart scope: unsupported");
  });

  test("resolves citation-ready text independently from a choice id", () => {
    const field = {
      type: "citationChoice",
      options: [
        {
          id: "heroic-actions",
          label: "Heroic",
          citationText: "heroic",
        },
      ],
    };

    expect(getCitationChoiceText(field, "heroic-actions")).toBe("heroic");
  });

  test("rejects an unsupported citation choice id", () => {
    const field = {
      type: "citationChoice",
      options: [
        {
          id: "heroic-actions",
          label: "Heroic",
          citationText: "heroic",
        },
      ],
    };

    expect(() => getCitationChoiceText(field, "unsupported")).toThrow(
      "Unsupported citation choice: unsupported",
    );
  });

  test("fails closed when a medal references an unknown worksheet profile", () => {
    const worksheet = resolveMedalWorksheet({
      worksheetProfile: "unsupportedProfile",
    });

    expect(worksheet).toBeNull();
  });

  test("fails closed when no medal is provided", () => {
    expect(resolveMedalWorksheet()).toBeNull();
  });

  test.each([
    [undefined, "heroic"],
    [
      {
        type: "citationChoice",
      },
      "heroic",
    ],
    [
      {
        type: "scopeChoice",
        options: [
          {
            id: "heroic",
            citationText: "heroic",
          },
        ],
      },
      "heroic",
    ],
    [
      {
        type: "citationChoice",
        options: [
          {
            id: "heroic",
            citationText: 123,
          },
        ],
      },
      "heroic",
    ],
  ])(
    "fails closed for malformed citation-choice configuration",
    (field, choiceId) => {
      expect(() => getCitationChoiceText(field, choiceId)).toThrow(
        `Unsupported citation choice: ${choiceId}`,
      );
    },
  );
});
