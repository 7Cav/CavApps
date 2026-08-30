import { OPERATION_MEDALS } from "../lib/medal-definitions.js";
import { resolveMedalWorksheet } from "../lib/worksheet-profiles.js";
import { validateWorksheet } from "../lib/worksheet-validation.js";

function getMedal(name) {
  return OPERATION_MEDALS.find((medal) => medal.name === name);
}

function completeOperationValues(overrides = {}) {
  return {
    actionCharacter: "skillful",
    scope: "",
    combatElement: "a rifleman",
    operationTitle: "Overlord",
    location: "Remagen",
    operationDate: new Date().toLocaleDateString("en-CA"),
    narrative: "Existing narrative",
    ...overrides,
  };
}

describe("Medal Recommendation Aid - worksheet validation", () => {
  test("accepts a complete Operation worksheet", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    const result = validateWorksheet(worksheet, completeOperationValues());

    expect(result.isComplete).toBe(true);

    expect(result.fields).toMatchObject({
      combatElement: true,
      operationTitle: true,
      location: true,
      operationDate: true,
      narrative: true,
      actionCharacter: true,
    });
  });

  test("rejects whitespace-only required text fields", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    const result = validateWorksheet(
      worksheet,
      completeOperationValues({
        combatElement: "   ",
      }),
    );

    expect(result.isComplete).toBe(false);
    expect(result.fields.combatElement).toBe(false);
  });

  test("only validates medal-specific fields present in the resolved worksheet", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal With Valor"),
    );

    const result = validateWorksheet(
      worksheet,
      completeOperationValues({
        actionCharacter: "",
        scope: "",
      }),
    );

    expect(result.fields.actionCharacter).toBeUndefined();
    expect(result.fields.scope).toBeUndefined();
    expect(result.isComplete).toBe(true);
  });

  test("requires Purple Heart Scope because the resolved worksheet declares it", () => {
    const worksheet = resolveMedalWorksheet(getMedal("Purple Heart"));

    const result = validateWorksheet(
      worksheet,
      completeOperationValues({
        actionCharacter: "",
        scope: "",
      }),
    );

    expect(result.isComplete).toBe(false);
    expect(result.fields.scope).toBe(false);
  });

  test("rejects a future Operation Date", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = validateWorksheet(
      worksheet,
      completeOperationValues({
        operationDate: tomorrow.toLocaleDateString("en-CA"),
      }),
    );

    expect(result.isComplete).toBe(false);
    expect(result.fields.operationDate).toBe(false);
  });

  test("treats a missing required field value as invalid", () => {
    const worksheet = resolveMedalWorksheet(
      getMedal("Army Commendation Medal"),
    );

    const values = completeOperationValues();
    delete values.combatElement;

    const result = validateWorksheet(worksheet, values);

    expect(result.isComplete).toBe(false);
    expect(result.fields.combatElement).toBe(false);
  });

  test("fails closed when no worksheet is provided", () => {
    const result = validateWorksheet(null, completeOperationValues());

    expect(result).toEqual({
      fields: {},
      isComplete: false,
    });
  });

  test("fails closed for an unsupported required field type", () => {
    const worksheet = {
      fields: {
        unsupportedField: {
          type: "unsupported",
          required: true,
        },
      },
    };

    const result = validateWorksheet(worksheet, {
      unsupportedField: "value",
    });

    expect(result.isComplete).toBe(false);
    expect(result.fields.unsupportedField).toBe(false);
  });
});
