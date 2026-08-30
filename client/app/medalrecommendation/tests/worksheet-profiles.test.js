import { OPERATION_MEDALS } from "../lib/medal-definitions.js";
import { resolveMedalWorksheet } from "../lib/worksheet-profiles.js";
import {
  applyAwardChange,
  resolveMedalWorksheet,
} from "../lib/worksheet-profiles.js";
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
    });

    expect(worksheet.fields.narrative).toMatchObject({
      label: "Narrative",
      placeholder: "Explain the lead-up, actions, and outcome...",
    });
  });

  test("declares Action Character options as citation-ready choices", () => {
    const medal = getMedal("Army Commendation Medal");

    expect(medal.fields.actionCharacter).toEqual({
      type: "citationChoice",
      required: true,
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
