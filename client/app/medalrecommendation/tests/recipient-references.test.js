import {
  scanRecipientReferences,
  evaluateRecipientReferences,
} from "../lib/recipient-references";

const operation = { firstMention: "authored", finalMention: "generated" };
const service = { firstMention: "generated", finalMention: "generated" };

function member(id, rankFull, realName, username) {
  return { user: { userId: id, username }, rank: { rankFull }, realName };
}
const buck = member("17", "Corporal", "Buck Jimmy Rogers", "Rogers.B");
const phoenix = member("22", "Sergeant", "Phoenix Van Auken", "Van Auken.P");

describe("recipient references in authored text", () => {
  test("reports the exact identity spans in the original text, including after non-BMP characters", () => {
    const full = "sERGeant\tPhoenix\nVan Auken";
    const intermediate = "Sergeant Van Auken";
    const narrative =
      "🏅 " + full + "’s team relieved " + intermediate + "'s squad.";
    const { references } = scanRecipientReferences(narrative, [phoenix]);
    expect(references).toEqual(
      [full, intermediate].map((text, i) => ({
        kind: i === 0 ? "complete" : "surname",
        recipientId: "22",
        text,
        start: narrative.indexOf(text),
        end: narrative.indexOf(text) + text.length,
      })),
    );
  });

  test("recognizes initials and internal apostrophes and accepts a trailing possessive apostrophe", () => {
    const pat = member("p", "Staff Sergeant", "Pat J. O’Neil", "ONeil.P");
    const { references } = scanRecipientReferences(
      "One team—Staff Sergeant Pat J. O'Neil and Corporal Rogers’ squad.",
      [pat, buck],
    );
    expect(references.map((r) => [r.recipientId, r.kind, r.text])).toEqual([
      ["p", "complete", "Staff Sergeant Pat J. O'Neil"],
      ["17", "surname", "Corporal Rogers"],
    ]);
  });

  test("consumes a longer known rank even when only the shorter rank has a matching recipient", () => {
    const roster = [member("s", "Sergeant", "Jo Smith", "Smith.J")];
    const text =
      "Staff Sergeant Smith, Command Sergeant Major Smith, Visiting Sergeant Smith and Sergeant Smith.";
    const { references } = scanRecipientReferences(text, roster, {
      rankEntries: [{ full: "Visiting Sergeant" }],
    });
    expect(references.map((r) => r.start)).toEqual([
      text.lastIndexOf("Sergeant Smith"),
    ]);
  });

  test("distinguishes two selected ranks with the same surname and prefers the longer complete name", () => {
    const roster = [
      member("a", "Sergeant", "Jo Smith", "Smith.J"),
      member("b", "Staff Sergeant", "Jo Smith", "Smith.J"),
      member("c", "Sergeant", "Jo Smith Jones", "Jones.J"),
    ];
    const { references } = scanRecipientReferences(
      "Sergeant Jo Smith Jones met Staff Sergeant Smith and Sergeant Jo Smith.",
      roster,
    );
    expect(references.map((r) => [r.recipientId, r.kind])).toEqual([
      ["c", "complete"],
      ["b", "surname"],
      ["a", "complete"],
    ]);
  });

  test("skips standalone words, fragments, rank abbreviations, and incomplete combinations", () => {
    const may = member("m", "Sergeant", "Jane May", "May.J");
    const text =
      "May called Buck Rogers. The sergeant may continue. SGT May; ex-Sergeant May; Sergeant Mayfield; Sergeant May-Jones; Sergeant May.J; Sergeant, May. Corporal Buck Rogers.";
    expect(scanRecipientReferences(text, [may, buck]).references).toEqual([]);
  });

  test("a username supporting Auken cannot rule out Van Auken", () => {
    const partial = member("22", "Sergeant", "Phoenix Van Auken", "Auken.P");
    const continuation =
      "Sergeant Van Auken coordinated. Sergeant Auken reported back.";
    const scan = scanRecipientReferences(continuation, [partial]);
    expect(scan.references.map((r) => [r.kind, r.text])).toEqual([
      ["surname", "Sergeant Auken"],
    ]);
    expect(evaluateRecipientReferences(scan, service)).toEqual([]);
    expect(
      scanRecipientReferences(continuation, [phoenix]).references.map(
        (r) => r.text,
      ),
    ).toEqual(["Sergeant Van Auken"]);
  });

  test("an unconfirmed longer surname prevents attribution to a competing recipient", () => {
    const partial = member("22", "Sergeant", "Phoenix Van Auken", "Auken.P");
    const other = member("31", "Sergeant", "Jo Van Auken", "VanAuken.J");
    const scan = scanRecipientReferences("Sergeant Van Auken led.", [
      partial,
      other,
    ]);
    expect(scan.references).toHaveLength(1);
    expect(scan.references[0]).toMatchObject({
      kind: "ambiguous",
      text: "Sergeant Van Auken",
    });
    expect(new Set(scan.references[0].candidateIds)).toEqual(
      new Set(["22", "31"]),
    );
    expect(
      evaluateRecipientReferences(scan, operation).map((f) => f.kind),
    ).toEqual(["ambiguous"]);
    const van = member("3", "Sergeant", "Alex Van", "Van.A");
    expect(
      scanRecipientReferences("Sergeant Van Auken led.", [partial, van])
        .references,
    ).toEqual([]);
  });

  test("an identity shared as a complete name and a surname cannot be assigned to either recipient", () => {
    const van = member("v", "Sergeant", "Van Auken", "Auken.V");
    const { references } = scanRecipientReferences("Sergeant Van Auken led.", [
      van,
      phoenix,
    ]);
    expect(references[0]).toMatchObject({ kind: "ambiguous" });
    expect(references[0]).not.toHaveProperty("recipientId");
  });

  test("locates distant mentions in a draft-sized narrative without changing offsets or prose", () => {
    const middle = "The team advanced. ".repeat(50_000);
    const text =
      "Corporal Buck Jimmy Rogers: " + middle + "Corporal Rogers’ team.";
    const { references } = scanRecipientReferences(text, [buck]);
    expect(references.map((r) => text.slice(r.start, r.end))).toEqual([
      "Corporal Buck Jimmy Rogers",
      "Corporal Rogers",
    ]);
    expect(text.slice(references[0].end, references[1].start)).toBe(
      ": " + middle,
    );
  });
});

describe("advisory findings for the known citation structure", () => {
  test("repeated intermediate full names produce one finding for that recipient", () => {
    const scan = {
      recipients: [{ id: "17", hasSurnameCandidate: true }],
      references: [0, 42, 86].map((start) => ({
        recipientId: "17",
        kind: "complete",
        start,
      })),
    };
    expect(evaluateRecipientReferences(scan, operation)).toEqual([
      { kind: "intermediate-complete", recipientId: "17", start: 42 },
    ]);
  });

  test("assesses authored first and intermediate mentions independently for each recipient", () => {
    const text =
      "Corporal Buck Jimmy Rogers joined Sergeant Van Auken and Corporal Rogers. Sergeant Phoenix Van Auken led.";
    const scan = scanRecipientReferences(text, [buck, phoenix]);
    expect(evaluateRecipientReferences(scan, operation)).toEqual([
      {
        kind: "first-shortened",
        recipientId: "22",
        start: text.indexOf("Sergeant Van Auken"),
      },
      {
        kind: "intermediate-complete",
        recipientId: "22",
        start: text.indexOf("Sergeant Phoenix"),
      },
    ]);
  });

  test("generated first and final mentions change which positions can be assessed", () => {
    const scan = scanRecipientReferences(
      "Corporal Buck Jimmy Rogers led. Corporal Rogers returned.",
      [buck],
    );
    expect(evaluateRecipientReferences(scan, operation)).toEqual([]);
    expect(evaluateRecipientReferences(scan, service)).toEqual([
      { kind: "intermediate-complete", recipientId: "17", start: 0 },
    ]);
    expect(
      evaluateRecipientReferences(scan, {
        firstMention: "generated",
        finalMention: "unknown",
      }),
    ).toEqual([]);
  });

  test("an unsupported shortened name produces only a general presence finding where the author supplies the first mention", () => {
    const scan = scanRecipientReferences("Corporal Buck Rogers led.", [buck]);
    expect(evaluateRecipientReferences(scan, operation)).toEqual([
      { kind: "complete-not-detected", recipientId: "17" },
    ]);
    expect(evaluateRecipientReferences(scan, service)).toEqual([]);
  });

  test("ambiguous mentions neither establish an order nor trigger individual missing-name findings", () => {
    const jack = member("j", "Corporal", "Jack Rogers", "Rogers.J");
    const scan = scanRecipientReferences(
      "Corporal Rogers led. Corporal Rogers returned. Corporal Buck Jimmy Rogers reported.",
      [buck, jack],
    );
    expect(evaluateRecipientReferences(scan, operation)).toEqual([
      { kind: "ambiguous", start: 0 },
    ]);
  });

  test("an unresolved surname permits full-name recognition but no surname-format judgment", () => {
    const unknown = member("u", "Corporal", "Buck Jimmy Rogers", "Unmatched.B");
    const scan = scanRecipientReferences(
      "Corporal Rogers left. Corporal Buck Jimmy Rogers returned.",
      [unknown],
    );
    expect(scan.references.map((r) => r.kind)).toEqual(["complete"]);
    expect(evaluateRecipientReferences(scan, service)).toEqual([]);
  });

  test("unit and seven-recipient contexts exclude individual checks; six still evaluates named recipients", () => {
    const roster = Array.from({ length: 7 }, (_, i) =>
      member(String(i), "Sergeant", "Alex Smith" + i, "Smith" + i + ".A"),
    );
    const text = "Sergeant Smith0 led.";
    for (const scan of [
      scanRecipientReferences(text, roster),
      scanRecipientReferences(text, roster.slice(0, 1), {
        recipientIdentityChecks: false,
      }),
    ]) {
      expect(scan.references).toEqual([]);
      expect(evaluateRecipientReferences(scan, operation)).toEqual([]);
    }
    expect(
      scanRecipientReferences(text, roster.slice(0, 6)).references[0],
    ).toMatchObject({ recipientId: "0", kind: "surname" });
  });
});
