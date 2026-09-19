import { formatServiceMonth } from "../lib/citation-builders.js";
import {
  getServiceMedalById,
  SERVICE_MEDALS,
} from "../lib/service-medal-definitions.js";
import {
  applyAwardChange,
  getActiveWorksheetValues,
  isWorksheetFieldActive,
  resolveMedalWorksheet,
} from "../lib/worksheet-profiles.js";
import { validateWorksheet } from "../lib/worksheet-validation.js";
import {
  SERVICE_CATALOG_CASES,
  SERVICE_CHOICE_CASES,
  SERVICE_CITATION_CASES,
  SERVICE_CONTINUATION,
} from "./service-medal-cases.js";

function worksheetFor(id) {
  return resolveMedalWorksheet(getServiceMedalById(id));
}

function validatePeriod(serviceStart, serviceEnd) {
  return validateWorksheet(worksheetFor("legion-of-merit"), {
    role: "a clerk",
    secondaryBillet: "S1 MILPACS",
    narrative: "providing service.",
    serviceStart,
    serviceEnd,
  });
}

describe("Service worksheet capabilities", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 17, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test.each(SERVICE_CATALOG_CASES)(
    "$abbreviation resolves its mapped metadata and initial field order",
    ({
      id,
      name,
      abbreviation,
      ribbonUrl,
      minimum,
      criteria,
      guidance,
      eligibility,
      fields,
    }) => {
      const medal = getServiceMedalById(id);
      expect(medal).toMatchObject({
        name,
        abbreviation,
        ribbonUrl,
        criteria,
        minimumNarrativeSentences: minimum,
        narrativeGuidance: guidance,
        eligibilityNotes: eligibility,
      });
      const worksheet = resolveMedalWorksheet(medal);
      expect(worksheet.recipientType).toBe("individual");
      const values = applyAwardChange(null, worksheet, {});
      expect(
        worksheet.fieldOrder
          .filter((key) =>
            isWorksheetFieldActive(worksheet.fields[key], values),
          )
          .map((key) => worksheet.fields[key].label),
      ).toEqual(fields);
    },
  );

  test.each(SERVICE_CITATION_CASES)(
    "$name / $path resolves the mapped citation through its worksheet",
    ({
      name,
      choices = {},
      inputs,
      opening,
      closing,
      narrativeVerb = "distinguished",
    }) => {
      const medal = SERVICE_MEDALS.find((entry) => entry.name === name);
      const worksheet = resolveMedalWorksheet(medal);
      const values = {
        ...applyAwardChange(null, worksheet, {}),
        narrative: SERVICE_CONTINUATION,
      };
      for (const [label, value] of Object.entries({ ...choices, ...inputs })) {
        const [key, field] = Object.entries(worksheet.fields).find(
          ([, field]) => field.label === label,
        );
        values[key] = field.options
          ? field.options.find((option) => option.label === value).id
          : value;
      }
      expect(validateWorksheet(worksheet, values).isComplete).toBe(true);
      const context = {
        ...getActiveWorksheetValues(worksheet, values),
        recipientRank: "Corporal",
        recipientCitationName: "John Smith",
      };
      expect(medal.buildOpening(context)).toBe(opening);
      expect(medal.buildClosing(context)).toBe(closing);
      expect(medal.buildNarrativeOpening(context)).toBe(
        `Corporal John Smith ${narrativeVerb} themselves by`,
      );
    },
  );

  test.each(SERVICE_CHOICE_CASES)(
    "$medalId / $fieldName validates explicit semantic IDs and fails closed",
    ({ medalId, fieldName, options, defaultValue }) => {
      const medal = getServiceMedalById(medalId);
      const field = worksheetFor(medalId).fields[fieldName];
      expect(field).toMatchObject({
        type: "semanticChoice",
        required: true,
        options,
        defaultValue,
        awardChange: "reset",
      });
      for (const value of [
        ...options.map(({ id }) => id),
        "",
        "unsupported",
        undefined,
      ]) {
        expect(
          validateWorksheet(
            { fields: { [fieldName]: field } },
            { [fieldName]: value },
          ).isComplete,
        ).toBe(options.some(({ id }) => id === value));
      }
      const builders =
        fieldName === "narrativeOpening"
          ? [medal.buildNarrativeOpening]
          : [medal.buildOpening, medal.buildClosing];
      for (const build of builders) {
        expect(() => build({ [fieldName]: "unsupported" })).toThrow(
          /Unsupported/,
        );
      }
    },
  );

  test.each(SERVICE_CHOICE_CASES)(
    "$medalId / $fieldName resets an established choice across award changes",
    ({ medalId, fieldName, options, defaultValue }) => {
      const worksheet = worksheetFor(medalId);
      const other = worksheetFor("humanitarian-service-medal");
      const values = {
        ...applyAwardChange(null, worksheet, {}),
        [fieldName]: options.at(-1).id,
        narrative: "An established continuation.",
        serviceStart: "2025-01",
        serviceEnd: "2026-01",
      };
      expect(values[fieldName]).not.toBe(defaultValue);
      const returned = applyAwardChange(
        other,
        worksheet,
        applyAwardChange(worksheet, other, values),
      );
      expect(returned[fieldName]).toBe(defaultValue);
      expect(returned).toMatchObject({
        narrative: values.narrative,
        serviceStart: values.serviceStart,
        serviceEnd: values.serviceEnd,
      });
    },
  );

  test("resolved Service conditions and options cannot mutate another worksheet", () => {
    const first = worksheetFor("joint-service-commendation-medal");
    first.fields.actionPhrase.when.equals = "changed";
    first.fields.recognitionType.options[0].id = "changed";
    const second = worksheetFor("joint-service-commendation-medal");
    expect(second.fields.actionPhrase.when).toEqual({
      field: "recognitionType",
      equals: "actions",
    });
    expect(second.fields.recognitionType.options[0].id).toBe("contributions");
  });

  test.each(["reset", "sameVariant"])(
    "a newly resolved %s field without a default initializes empty",
    (awardChange) => {
      const worksheet = resolveMedalWorksheet({
        ...getServiceMedalById("humanitarian-service-medal"),
        fields: {
          supportingContext: { type: "text", required: true, awardChange },
        },
      });
      const values = applyAwardChange(null, worksheet, {});
      expect(values.supportingContext).toBe("");
      expect(
        validateWorksheet(worksheet, values).fields.supportingContext,
      ).toBe(false);
    },
  );

  test.each([
    ["2025-01", "January 2025"],
    ["2025-02", "February 2025"],
    ["2025-03", "March 2025"],
    ["2025-04", "April 2025"],
    ["2025-05", "May 2025"],
    ["2025-06", "June 2025"],
    ["2025-07", "July 2025"],
    ["2025-08", "August 2025"],
    ["2025-09", "September 2025"],
    ["2025-10", "October 2025"],
    ["2025-11", "November 2025"],
    ["2026-12", "December 2026"],
  ])("formats service month %s as %s", (value, expected) => {
    expect(formatServiceMonth(value)).toBe(expected);
  });

  test("active values trim prose, retain non-string values, and supply missing defaults", () => {
    const worksheet = worksheetFor("joint-service-commendation-medal");
    expect(
      getActiveWorksheetValues(worksheet, {
        benefittedCompany: "  B/2-7  ",
        narrative: "  supporting the company.  ",
      }),
    ).toEqual({
      recognitionType: "contributions",
      benefittedCompany: "B/2-7",
      assignedCompany: "",
      narrativeOpening: "distinguished",
      narrative: "supporting the company.",
    });
    expect(getActiveWorksheetValues(null)).toEqual({});
    expect(
      getActiveWorksheetValues(
        { fields: { withoutDefault: {}, numeric: {} } },
        { numeric: 7 },
      ),
    ).toEqual({ withoutDefault: "", numeric: 7 });
  });

  test("unselected narrative wording cannot invent a recipient opening", () => {
    for (const medalId of [
      "joint-service-commendation-medal",
      "meritorious-service-medal",
      "soldiers-medal",
    ]) {
      const medal = getServiceMedalById(medalId);
      const worksheet = worksheetFor(medalId);
      expect(
        medal.buildNarrativeOpening({
          narrativeOpening: "",
          recipientRank: "Corporal",
          recipientCitationName: "John Smith",
        }),
      ).toBe("");
      expect(
        validateWorksheet(worksheet, { narrativeOpening: "" }).fields
          .narrativeOpening,
      ).toBe(false);
    }
  });

  test("JSCM requires the custom phrase only for Actions and excludes it otherwise", () => {
    const worksheet = worksheetFor("joint-service-commendation-medal");
    const values = {
      ...applyAwardChange(null, worksheet, {}),
      benefittedCompany: "B/2-7",
      assignedCompany: "C/1-7",
      narrative: "supporting the company.",
    };

    expect(validateWorksheet(worksheet, values).isComplete).toBe(true);
    expect(
      validateWorksheet(worksheet, { ...values, recognitionType: "actions" })
        .isComplete,
    ).toBe(false);
    expect(
      validateWorksheet(worksheet, {
        ...values,
        recognitionType: "actions",
        actionPhrase: "  ",
      }).isComplete,
    ).toBe(false);
    expect(
      validateWorksheet(worksheet, {
        ...values,
        recognitionType: "actions",
        actionPhrase: "outstanding support",
      }).isComplete,
    ).toBe(true);
    expect(
      getActiveWorksheetValues(worksheet, {
        ...values,
        actionPhrase: "stale phrase",
      }),
    ).not.toHaveProperty("actionPhrase");
  });

  test("DSSM validates and includes only the selected leadership context", () => {
    const worksheet = worksheetFor("defense-superior-service-medal");
    expect(worksheet.fields.leadershipArea.options).toEqual([
      { id: "secondary", label: "Secondary Billet" },
      { id: "operations", label: "Operations Leadership" },
    ]);
    const values = {
      leadershipArea: "secondary",
      secondaryRole: "1IC",
      secondaryBillet: "Military Police",
      serviceStart: "2025-01",
      serviceEnd: "2025-02",
      narrative: "leading the department.",
    };

    expect(validateWorksheet(worksheet, values).isComplete).toBe(true);
    const operations = { ...values, leadershipArea: "operations" };
    expect(validateWorksheet(worksheet, operations)).toMatchObject({
      fields: { operationsLeadership: false, operationsAO: false },
      isComplete: false,
    });
    const populatedOperations = {
      ...operations,
      operationsLeadership: "AO Lead, S3 HLL Operations",
      operationsAO: "Hell Let Loose: Vietnam AO",
    };
    expect(validateWorksheet(worksheet, populatedOperations).isComplete).toBe(
      true,
    );
    const activeOperations = getActiveWorksheetValues(
      worksheet,
      populatedOperations,
    );
    expect(activeOperations).not.toHaveProperty("secondaryRole");
    expect(activeOperations).not.toHaveProperty("secondaryBillet");
    expect(activeOperations).toMatchObject({
      operationsLeadership: "AO Lead, S3 HLL Operations",
      operationsAO: "Hell Let Loose: Vietnam AO",
    });

    const secondary = { ...populatedOperations, leadershipArea: "secondary" };
    expect(validateWorksheet(worksheet, secondary).isComplete).toBe(true);
    expect(getActiveWorksheetValues(worksheet, secondary)).toEqual(values);
    expect(
      validateWorksheet(worksheet, {
        ...secondary,
        secondaryRole: "",
        secondaryBillet: "",
      }),
    ).toMatchObject({
      fields: { secondaryRole: false, secondaryBillet: false },
      isComplete: false,
    });
  });

  test.each([
    ["legion-of-merit", { role: "a clerk", secondaryBillet: "S1 MILPACS" }],
    [
      "defense-superior-service-medal",
      {
        leadershipArea: "secondary",
        secondaryRole: "1IC",
        secondaryBillet: "Military Police",
      },
    ],
    [
      "distinguished-service-medal",
      { role: "a trooper", element: "A/2/B/3-7" },
    ],
    [
      "defense-distinguished-service-medal",
      { role: "Company Commander", element: "B/2-7" },
    ],
  ])(
    "%s uses required month/year fields with chronological validation",
    (id, context) => {
      const worksheet = worksheetFor(id);
      expect(worksheet.fields).toMatchObject({
        serviceStart: {
          type: "monthYear",
          required: true,
          defaultValue: "",
          awardChange: "preserve",
          label: "Service Start",
        },
        serviceEnd: {
          type: "monthYear",
          required: true,
          defaultValue: "",
          awardChange: "preserve",
          label: "Service End",
        },
      });
      const values = {
        ...context,
        narrative: "providing service.",
        serviceStart: "2025-01",
        serviceEnd: "2025-01",
      };
      expect(validateWorksheet(worksheet, values).isComplete).toBe(true);
      expect(
        validateWorksheet(worksheet, { ...values, serviceStart: "" }).fields
          .serviceStart,
      ).toBe(false);
      expect(
        validateWorksheet(worksheet, { ...values, serviceEnd: "" }).fields
          .serviceEnd,
      ).toBe(false);
      expect(
        validateWorksheet(worksheet, { ...values, serviceStart: "2025-08" })
          .fields.serviceEnd,
      ).toBe(false);
      expect(
        validateWorksheet(worksheet, { ...values, serviceEnd: "2025-08" })
          .isComplete,
      ).toBe(true);
    },
  );

  test.each([
    "2025-00",
    "2025-13",
    "2025-1",
    "2025-01-01",
    "0000-01",
    "September 2025",
    "x2025-01",
    ["2025-01"],
  ])("rejects malformed service month %s", (value) => {
    const worksheet = worksheetFor("legion-of-merit");
    expect(
      validateWorksheet(worksheet, { serviceStart: value, serviceEnd: value }),
    ).toMatchObject({
      fields: { serviceStart: false, serviceEnd: false },
      errors: { serviceStart: "Required", serviceEnd: "Required" },
      isComplete: false,
    });
  });

  describe("Service month boundaries", () => {
    const startFuture = "Service Start must be the current month or earlier";
    const endFuture = "Service End must be the current month or earlier";
    const chronology =
      "Service End must be the same month as or later than Service Start";

    test.each([
      ["previous month", "2026-08", "2026-08", {}],
      ["current month, including a same-month range", "2026-09", "2026-09", {}],
      ["past to current month", "2026-08", "2026-09", {}],
      [
        "future End in the same year",
        "2026-09",
        "2026-10",
        { serviceEnd: endFuture },
      ],
      ["future year", "2026-09", "2027-01", { serviceEnd: endFuture }],
      [
        "future Start without a cascading End error",
        "2026-10",
        "2026-09",
        { serviceStart: startFuture },
      ],
      [
        "future errors before chronology",
        "2026-11",
        "2026-10",
        { serviceStart: startFuture, serviceEnd: endFuture },
      ],
      [
        "reverse historical range",
        "2026-08",
        "2026-07",
        { serviceEnd: chronology },
      ],
      [
        "reverse range from the current month",
        "2026-09",
        "2026-08",
        { serviceEnd: chronology },
      ],
      [
        "malformed historical Start without a cascading End error",
        "2026-08-extra",
        "2026-07",
        { serviceStart: "Required" },
      ],
      [
        "missing Start without a cascading End error",
        "",
        "2026-09",
        { serviceStart: "Required" },
      ],
      [
        "malformed Start without a cascading End error",
        "2026-13",
        "2026-09",
        { serviceStart: "Required" },
      ],
      [
        "incomplete End before chronology",
        "2026-10",
        "",
        { serviceStart: startFuture, serviceEnd: "Required" },
      ],
    ])("handles %s", (_name, start, end, errors) => {
      const result = validatePeriod(start, end);
      expect(result.isComplete).toBe(Object.keys(errors).length === 0);
      expect(result.fields).toMatchObject({
        serviceStart: !errors.serviceStart,
        serviceEnd: !errors.serviceEnd,
      });
      expect(result.errors ?? {}).toEqual(errors);
    });

    test("uses the local calendar month at a UTC month boundary", () => {
      const originalTimezone = process.env.TZ;
      try {
        process.env.TZ = "America/Los_Angeles";
        vi.setSystemTime(new Date(2026, 8, 30, 23, 30));
        expect(new Date().getUTCMonth()).toBe(9);
        expect(validatePeriod("2026-09", "2026-09").isComplete).toBe(true);
        expect(validatePeriod("2026-09", "2026-10")).toMatchObject({
          fields: { serviceStart: true, serviceEnd: false },
          errors: { serviceEnd: endFuture },
          isComplete: false,
        });
      } finally {
        if (originalTimezone === undefined) delete process.env.TZ;
        else process.env.TZ = originalTimezone;
      }
    });

    test("zero-pads the local year before comparing Service months", () => {
      vi.setSystemTime(new Date(999, 0, 17, 12));
      expect(validatePeriod("0999-01", "0999-01").isComplete).toBe(true);
      expect(validatePeriod("0999-01", "0999-02").errors).toEqual({
        serviceEnd: endFuture,
      });
    });

    test("chronology remains a hard failure without display-message metadata", () => {
      const worksheet = worksheetFor("legion-of-merit");
      worksheet.fields.serviceEnd.invalidMessage = undefined;
      const result = validateWorksheet(worksheet, {
        role: "a clerk",
        secondaryBillet: "S1 MILPACS",
        narrative: "providing service.",
        serviceStart: "2026-09",
        serviceEnd: "2026-08",
      });
      expect(result.fields).toMatchObject({
        serviceStart: true,
        serviceEnd: false,
      });
      expect(result.isComplete).toBe(false);
    });
  });
});
