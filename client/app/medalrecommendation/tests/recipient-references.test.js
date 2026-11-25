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
const john = member("john", "Corporal", "John Smith", "Smith.J");
const allen = member("allen", "Corporal", "John Allen Smith", "Smith.JA");

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

  test("skips standalone words, unrelated fragments, prose and longer ranks even when a partial identity looks similar", () => {
    const may = member("m", "Sergeant", "Jane May", "May.J");
    const text =
      "May called Buck Rogers. The sergeant may continue. SGT May; ex-Sergeant May; Sergeant Mayfield; Sergeant May-Jones; Sergeant May.J; Sergeant, May. Corporal Buck Riley Rogers. Corporal Buck Rogersson. Staff Sergeant Auken. The sergeant may proceed.";
    const compoundMay = member("v", "Sergeant", "Alice Van May", "VanMay.A");
    expect(
      scanRecipientReferences(text, [may, buck, phoenix, compoundMay])
        .references,
    ).toEqual([]);
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
      evaluateRecipientReferences(
        scanRecipientReferences(
          "Sergeant Phoenix Van Auken led. Sergeant Auken fired.",
          [partial],
        ),
        operation,
      ),
    ).toEqual([]);
    expect(
      scanRecipientReferences(continuation, [phoenix]).references.map(
        (r) => r.text,
      ),
    ).toEqual(["Sergeant Van Auken", "Sergeant Auken"]);
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

  test("the two full Smith names are attributed in narrative order regardless of selection order", () => {
    const text = "Corporal John Smith and Corporal John Allen Smith led.";
    for (const roster of [
      [john, allen],
      [allen, john],
    ]) {
      const scan = scanRecipientReferences(text, roster);
      expect(scan.references.map((r) => [r.kind, r.recipientId])).toEqual([
        ["complete", "john"],
        ["complete", "allen"],
      ]);
      expect(evaluateRecipientReferences(scan, operation)).toEqual([]);
    }
    const onlyAllen = scanRecipientReferences("Corporal John Smith led.", [
      allen,
    ]);
    expect(evaluateRecipientReferences(onlyAllen, operation)).toEqual([
      expect.objectContaining({ kind: "incomplete", recipientId: "allen" }),
    ]);
  });

  test("identical full names remain ambiguous between their roster IDs", () => {
    const otherJohn = member("other", "Corporal", "John Smith", "Smith.J2");
    const { references } = scanRecipientReferences("Corporal John Smith led.", [
      allen,
      otherJohn,
      john,
    ]);
    expect(references).toHaveLength(1);
    expect(references[0].kind).toBe("ambiguous");
    expect(new Set(references[0].candidateIds)).toEqual(
      new Set(["john", "other"]),
    );
  });

  test.each(["Van Auken.P", "Auken.P"])(
    "a complete name overlapping a corroborated or possible compound surname (%s) stays ambiguous",
    (username) => {
      const van = member("v", "Sergeant", "Van Auken", "Auken.V");
      const { references } = scanRecipientReferences(
        "Sergeant Van Auken led.",
        [van, member("22", "Sergeant", "Phoenix Van Auken", username)],
      );
      expect(references[0]).toMatchObject({ kind: "ambiguous" });
      expect(references[0]).not.toHaveProperty("recipientId");
    },
  );

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

  test.each([
    [
      "Operation first",
      operation,
      buck,
      "Corporal Buck Rogers led. Corporal Buck Jimmy Rogers fired.",
      "Corporal Buck Jimmy Rogers led. Corporal Rogers fired.",
      "Corporal Buck Rogers",
      "complete",
      ["intermediate-complete"],
    ],
    [
      "Operation intermediate",
      operation,
      buck,
      "Corporal Buck Jimmy Rogers led. Corporal Buck Rogers fired.",
      "Corporal Buck Jimmy Rogers led. Corporal Rogers fired.",
      "Corporal Buck Rogers",
      "surname",
      [],
    ],
    [
      "Service continuation",
      service,
      buck,
      "led. Corporal Buck Rogers fired.",
      "led. Corporal Rogers fired.",
      "Corporal Buck Rogers",
      "surname",
      [],
    ],
    [
      "compound surname",
      operation,
      phoenix,
      "Sergeant Phoenix Van Auken led. Sergeant Auken fired.",
      "Sergeant Phoenix Van Auken led. Sergeant Van Auken fired.",
      "Sergeant Auken",
      "surname",
      [],
    ],
  ])(
    "%s incomplete identity is assessed in place and the correction clears the advice",
    (
      _,
      context,
      recipient,
      original,
      corrected,
      partial,
      expectedForm,
      laterFindings,
    ) => {
      const check = (text) =>
        evaluateRecipientReferences(
          scanRecipientReferences(text, [recipient]),
          context,
        );
      const findings = check(original);
      expect(findings[0]).toMatchObject({
        kind: "incomplete",
        expectedForm,
        start: original.indexOf(partial),
      });
      expect(findings.slice(1).map((f) => f.kind)).toEqual(laterFindings);
      expect(check(corrected)).toEqual([]);
    },
  );

  test("retains whole middle components in roster order and requires the entire corroborated surname after a given name", () => {
    const recipient = member(
      "r",
      "Corporal",
      "Buck Alan J. Van Rogers",
      "VanRogers.B",
    );
    const text =
      "Corporal Buck J. Van Rogers led. Corporal Buck Alan Van Rogers returned. Corporal Buck J. Alan Van Rogers left. Corporal Buck Rogers reported.";
    const scan = scanRecipientReferences(text, [recipient]);
    expect(scan.references.map((r) => [r.kind, r.text])).toEqual([
      ["incomplete", "Corporal Buck J. Van Rogers"],
      ["incomplete", "Corporal Buck Alan Van Rogers"],
    ]);
  });

  test("a partial identity shared with another roster name gives only manual-review advice, even across uncertain surname boundaries", () => {
    const allen = member("a", "Corporal", "John Allen Smith", "Smith.JA");
    for (const username of ["Smith.JB", "Unmatched.B", "BruceSmith.J"]) {
      const bruce = member("b", "Corporal", "John Bruce Smith", username);
      const scan = scanRecipientReferences("Corporal John Smith led.", [
        allen,
        bruce,
      ]);
      expect(
        evaluateRecipientReferences(scan, operation).map((f) => f.kind),
      ).toEqual(["ambiguous"]);
    }
  });

  test("a unique incomplete reference can be corrected with the full name when the surname is shared", () => {
    const roster = [
      member("a", "Corporal", "John Allen Smith", "Smith.JA"),
      member("b", "Corporal", "Jane Bruce Smith", "Smith.JB"),
    ];
    const check = (text) =>
      evaluateRecipientReferences(
        scanRecipientReferences(text, roster),
        service,
      );
    expect(check("Corporal Jane Smith reported.")).toEqual([
      expect.objectContaining({
        kind: "incomplete",
        recipientId: "b",
        expectedForm: "complete",
      }),
    ]);
    expect(check("Corporal Jane Bruce Smith reported.")).toEqual([]);
  });

  test("a surname collision leaves distinct rank or surname identities subject to the intermediate rule", () => {
    const roster = [
      member("a", "Corporal", "John Allen Smith", "Smith.JA"),
      member("b", "Corporal", "John Bruce Smith", "Smith.JB"),
      member("s", "Sergeant", "Drew Smith", "Smith.D"),
      buck,
    ];
    const scan = scanRecipientReferences(
      "Corporal John Allen Smith met Corporal John Bruce Smith. Sergeant Drew Smith and Corporal Buck Jimmy Rogers reported.",
      roster,
    );
    expect(
      evaluateRecipientReferences(scan, service).map((f) => [
        f.kind,
        f.recipientId,
      ]),
    ).toEqual([
      ["intermediate-complete", "s"],
      ["intermediate-complete", "17"],
    ]);
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
