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

function validateSingleField(field, value, { omitValue = false } = {}) {
  return validateWorksheet(
    {
      fields: {
        fieldUnderTest: field,
      },
    },
    omitValue ? {} : { fieldUnderTest: value },
  );
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

  describe.each(["text", "textarea"])("required %s fields", (type) => {
    test.each([
      ["plain text", "rifleman"],
      ["surrounding whitespace", "  rifleman  "],
    ])("accept %s", (_caseName, value) => {
      const result = validateSingleField({ type, required: true }, value);

      expect(result).toEqual({
        fields: { fieldUnderTest: true },
        isComplete: true,
      });
    });

    test.each([
      ["an empty string", "", false],
      ["whitespace only", "   ", false],
      ["a missing value", undefined, true],
      ["null", null, false],
      ["a number", 7, false],
      ["a boolean", true, false],
      ["an object", {}, false],
      ["an array", [], false],
    ])("reject %s", (_caseName, value, omitValue) => {
      const result = validateSingleField({ type, required: true }, value, {
        omitValue,
      });

      expect(result).toEqual({
        fields: { fieldUnderTest: false },
        isComplete: false,
      });
    });
  });

  describe.each(["citationChoice", "scopeChoice"])(
    "required %s fields",
    (type) => {
      const field = {
        type,
        required: true,
        options: [
          { id: "first", label: "First" },
          { id: "second", label: "Second" },
        ],
      };

      test.each([
        ["the first declared option", "first", true],
        ["the second declared option", "second", true],
        ["an empty choice", "", false],
        ["an unsupported choice id", "unsupported", false],
      ])("handles %s", (_caseName, value, expected) => {
        const result = validateSingleField(field, value);

        expect(result).toEqual({
          fields: { fieldUnderTest: expected },
          isComplete: expected,
        });
      });

      test("fails closed when options are missing", () => {
        const result = validateSingleField({ type, required: true }, "first");

        expect(result).toEqual({
          fields: { fieldUnderTest: false },
          isComplete: false,
        });
      });
    },
  );

  test.each([
    "text",
    "textarea",
    "date",
    "citationChoice",
    "scopeChoice",
    "unsupported",
  ])("accepts a missing optional %s field", (type) => {
    const result = validateSingleField({ type, required: false }, undefined, {
      omitValue: true,
    });

    expect(result).toEqual({
      fields: { fieldUnderTest: true },
      isComplete: true,
    });
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

  describe("required date fields", () => {
    const originalTimezone = process.env.TZ;

    beforeEach(() => {
      process.env.TZ = "UTC";
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();

      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    });

    test.each([
      ["an empty value", ""],
      ["a non-date string", "not-a-date"],
      ["a one-digit month", "2026-1-01"],
      ["a one-digit day", "2026-01-1"],
      ["a non-ISO ordering", "03-01-2026"],
      ["a timestamp", "2026-03-01T00:00:00Z"],
      ["leading whitespace", " 2026-02-28"],
      ["a numeric suffix", "2026-02-28.0"],
    ])("rejects malformed format: %s", (_caseName, value) => {
      const result = validateSingleField(
        { type: "date", required: true },
        value,
      );

      expect(result).toEqual({
        fields: { fieldUnderTest: false },
        isComplete: false,
      });
    });

    test.each([
      ["a non-leap-year February 29", "2026-02-29"],
      ["February 30", "2026-02-30"],
      ["April 31", "2026-04-31"],
      ["month zero", "2026-00-10"],
      ["month thirteen", "2026-13-10"],
      ["day zero", "2026-03-00"],
      ["a year that Date.UTC remaps", "0099-03-01"],
    ])("rejects impossible calendar date: %s", (_caseName, value) => {
      const result = validateSingleField(
        { type: "date", required: true },
        value,
      );

      expect(result).toEqual({
        fields: { fieldUnderTest: false },
        isComplete: false,
      });
    });

    test.each([
      ["yesterday", "2026-02-28", true],
      ["today", "2026-03-01", true],
      ["tomorrow", "2026-03-02", false],
    ])("handles %s", (_caseName, value, expected) => {
      const result = validateSingleField(
        { type: "date", required: true },
        value,
      );

      expect(result).toEqual({
        fields: { fieldUnderTest: expected },
        isComplete: expected,
      });
    });

    test.each([
      ["the day before leap day", "2024-02-28", true],
      ["leap day", "2024-02-29", true],
      ["the day after leap day", "2024-03-01", true],
      ["a non-leap-year February 29", "2023-02-29", false],
    ])("handles leap-day boundary: %s", (_caseName, value, expected) => {
      vi.setSystemTime(new Date("2024-03-01T12:00:00.000Z"));

      const result = validateSingleField(
        { type: "date", required: true },
        value,
      );

      expect(result).toEqual({
        fields: { fieldUnderTest: expected },
        isComplete: expected,
      });
    });

    test("uses the user's local calendar date instead of the UTC date", () => {
      process.env.TZ = "America/Los_Angeles";
      vi.setSystemTime(new Date("2026-03-01T07:30:00.000Z"));

      const localToday = validateSingleField(
        { type: "date", required: true },
        "2026-02-28",
      );
      const utcTomorrow = validateSingleField(
        { type: "date", required: true },
        "2026-03-01",
      );

      expect(localToday).toEqual({
        fields: { fieldUnderTest: true },
        isComplete: true,
      });
      expect(utcTomorrow).toEqual({
        fields: { fieldUnderTest: false },
        isComplete: false,
      });
    });

    test("zero-pads the local year before comparing dates", () => {
      vi.setSystemTime(new Date(999, 0, 2, 12));

      const localToday = validateSingleField(
        { type: "date", required: true },
        "0999-01-02",
      );
      const localTomorrow = validateSingleField(
        { type: "date", required: true },
        "0999-01-03",
      );

      expect(localToday).toEqual({
        fields: { fieldUnderTest: true },
        isComplete: true,
      });
      expect(localTomorrow).toEqual({
        fields: { fieldUnderTest: false },
        isComplete: false,
      });
    });
  });

  test.each([
    ["null", null],
    ["undefined", undefined],
    ["an object without fields", {}],
  ])("fails closed when the worksheet is %s", (_caseName, worksheet) => {
    const result = validateWorksheet(worksheet, completeOperationValues());

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
