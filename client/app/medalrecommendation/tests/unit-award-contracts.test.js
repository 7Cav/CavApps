import { getMedalFamily } from "../lib/medal-families";
import { resolveMedalWorksheet } from "../lib/worksheet-profiles";
import { validateWorksheet } from "../lib/worksheet-validation";
import { validateRecipientEntries } from "../lib/recipient-utils";
import { makeRecipient } from "./test-helpers";
import {
  UNIT_AWARD_CASES,
  UNIT_OPERATION_INPUTS,
  UNIT_SERVICE_INPUTS,
} from "./unit-award-cases";

const operationAwards = UNIT_AWARD_CASES.filter(
  ({ family }) => family === "operation",
);
const serviceAwards = UNIT_AWARD_CASES.filter(
  ({ family }) => family === "service",
);
function medalFor(award) {
  return getMedalFamily(award.family).getMedalById(award.id);
}
function entries(count) {
  return Array.from({ length: count }, (_, index) => ({
    member: makeRecipient({
      user: { userId: String(index + 1) },
      realName: `Test Member${index + 1}`,
    }),
  }));
}
function completeValues(award) {
  return award.family === "operation"
    ? { ...UNIT_OPERATION_INPUTS, actionCharacter: "skillful" }
    : { ...UNIT_SERVICE_INPUTS };
}

// UI tests own wording, field display, choices and transitions. This layer owns
// validation inputs that are difficult or impossible to enter through the UI.
describe("Unit award validation contracts", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 27, 12));
  });
  afterEach(() => vi.useRealTimers());

  test.each(UNIT_AWARD_CASES)(
    "$abbreviation rejects blank and whitespace-only required fields",
    (award) => {
      const worksheet = resolveMedalWorksheet(medalFor(award));
      const values = completeValues(award);
      expect(validateWorksheet(worksheet, values).isComplete).toBe(true);
      for (const key of worksheet.fieldOrder) {
        for (const blank of ["", "   "]) {
          const result = validateWorksheet(worksheet, {
            ...values,
            [key]: blank,
          });
          expect(result.fields[key], key).toBe(false);
          expect(result.isComplete, key).toBe(false);
        }
      }
    },
  );

  test.each(operationAwards)(
    "$abbreviation requires four unique valid recipients: zero, one and three are incomplete",
    (award) => {
      const policy = resolveMedalWorksheet(medalFor(award)).recipientPolicy;
      for (const count of [0, 1, 3, 4]) {
        expect(validateRecipientEntries(entries(count), policy)).toMatchObject({
          validCount: count,
          isComplete: count === 4,
        });
      }
      const three = entries(3);
      for (const fourth of [
        three[0],
        { member: null, query: "Typed but unselected" },
      ]) {
        expect(
          validateRecipientEntries([...three, fourth], policy),
        ).toMatchObject({ validCount: 3, isComplete: false });
      }
    },
  );

  test.each(serviceAwards)(
    "$abbreviation uses the application baseline of one because the SOP supplies no numeric minimum",
    (award) => {
      const policy = resolveMedalWorksheet(medalFor(award)).recipientPolicy;
      expect(validateRecipientEntries([], policy).isComplete).toBe(false);
      expect(validateRecipientEntries(entries(1), policy).isComplete).toBe(
        true,
      );
    },
  );

  // The shared recipient suite owns the 1,500-person stress case.
  test("all four Unit Awards accept a 30-person recipient collection without truncation", () => {
    const selected = entries(30);
    for (const award of UNIT_AWARD_CASES) {
      expect(
        validateRecipientEntries(
          selected,
          resolveMedalWorksheet(medalFor(award)).recipientPolicy,
        ),
      ).toMatchObject({ validCount: 30, isComplete: true });
    }
  });

  test.each(
    UNIT_AWARD_CASES.filter(({ abbreviation }) => abbreviation !== "AVUA"),
  )(
    "$abbreviation rejects unsupported citation choices instead of guessing wording",
    (award) => {
      const medal = medalFor(award);
      const worksheet = resolveMedalWorksheet(medal);
      const values = completeValues(award);
      for (const key of [
        "actionCharacter",
        "serviceType",
        "narrativeOpening",
      ].filter((key) => worksheet.fields[key])) {
        const unsupported = { ...values, [key]: "unsupported" };
        expect(validateWorksheet(worksheet, unsupported).isComplete).toBe(
          false,
        );
        const builders =
          key === "narrativeOpening"
            ? [medal.buildNarrativeOpening]
            : award.abbreviation === "JMUA"
              ? [medal.buildClosing]
              : [medal.buildOpening, medal.buildClosing];
        for (const builder of builders)
          expect(() => builder(unsupported)).toThrow(/Unsupported/);
      }
    },
  );

  test.each(operationAwards)(
    "$abbreviation rejects impossible and future dates while accepting today",
    (award) => {
      const worksheet = resolveMedalWorksheet(medalFor(award));
      for (const operationDate of [
        "2026-02-30",
        "2026-09-28",
        "2026-13-01",
        "not-a-date",
      ]) {
        expect(
          validateWorksheet(worksheet, {
            ...completeValues(award),
            operationDate,
          }).isComplete,
        ).toBe(false);
      }
      expect(
        validateWorksheet(worksheet, {
          ...completeValues(award),
          operationDate: "2026-09-27",
        }).isComplete,
      ).toBe(true);
    },
  );
});
