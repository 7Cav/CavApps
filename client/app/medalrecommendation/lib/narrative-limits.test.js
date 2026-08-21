import { describe, expect, it } from "vitest";

import {
  INDIVIDUAL_NARRATIVE_LIMITS,
  UNIT_NARRATIVE_LIMITS,
} from "./narrative-limits";

describe("Medal Recommendation narrative limits", () => {
  it("uses the S1-approved limits for individual Operation and Service medals", () => {
    expect(INDIVIDUAL_NARRATIVE_LIMITS).toEqual({
      soft: 1400,
      hard: 1600,
    });
  });

  it("uses the S1-approved limits for all Unit Awards", () => {
    expect(UNIT_NARRATIVE_LIMITS).toEqual({
      soft: 1600,
      hard: 1800,
    });
  });

  it("keeps each hard cap above its soft warning threshold", () => {
    expect(INDIVIDUAL_NARRATIVE_LIMITS.hard).toBeGreaterThan(
      INDIVIDUAL_NARRATIVE_LIMITS.soft,
    );
    expect(UNIT_NARRATIVE_LIMITS.hard).toBeGreaterThan(
      UNIT_NARRATIVE_LIMITS.soft,
    );
  });
});
