import { getMedalFamily, MEDAL_FAMILY_IDS } from "../lib/medal-families.js";

describe("medal family resolution", () => {
  test("resolves the Operation family", () => {
    const family = getMedalFamily(MEDAL_FAMILY_IDS.OPERATION);

    expect(family.id).toBe("operation");
    expect(family.pageTitle).toBe("Operation Medal Recommendation");
    expect(family.route).toBe("/medalrecommendation/operation");
  });

  test("resolves the Service family", () => {
    const family = getMedalFamily(MEDAL_FAMILY_IDS.SERVICE);

    expect(family.id).toBe("service");
    expect(family.pageTitle).toBe("Service Medal Recommendation");
    expect(family.route).toBe("/medalrecommendation/service");
  });

  test("rejects unsupported and missing families instead of falling back", () => {
    expect(() => getMedalFamily("servcie")).toThrow(
      "Unsupported medal family: servcie",
    );
    expect(() => getMedalFamily()).toThrow(
      "Unsupported medal family: undefined",
    );
  });
});
