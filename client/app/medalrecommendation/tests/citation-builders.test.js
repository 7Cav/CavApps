import { combineNarrative } from "../lib/citation-builders.js";

describe("Narrative composition", () => {
  test.each([
    ["Opening", "Continuation.", "Opening Continuation."],
    ["  Opening  ", "", "Opening"],
    ["", "  Continuation.  ", "Continuation."],
    ["  Opening  ", "  Continuation.  ", "Opening Continuation."],
  ])(
    "combines %j and %j with normalized boundary whitespace",
    (opening, continuation, expected) => {
      expect(combineNarrative(opening, continuation)).toBe(expected);
    },
  );
});
