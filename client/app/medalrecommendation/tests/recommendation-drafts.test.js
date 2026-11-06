import {
  buildDraftFilename,
  MAX_DRAFT_BYTES,
  parseDraft,
  prepareDraftRestore,
  serializeDraft,
} from "../lib/recommendation-drafts";
import { MEDAL_FAMILY_LIST } from "../lib/medal-families";
import { makeRecipient, makeRecipientRoster } from "./test-helpers";

function draft(overrides = {}) {
  return {
    format: "cavapps.medal-recommendation.draft",
    version: 1,
    medalFamily: "operation",
    medalId: "army-commendation-medal",
    recipients: [],
    values: {},
    ...overrides,
  };
}
function saved(identity = { userId: "9397", profileId: "4637" }) {
  return {
    kind: "selected",
    query: "Old.W",
    identity,
    snapshot: { username: "Old.W", rankFull: "Corporal", realName: "Old Name" },
  };
}
const member = makeRecipient({
  profileId: "4637",
  user: { userId: "9397", username: "Kenton.W" },
  rank: { rankId: "17", rankShort: "SSG", rankFull: "Staff Sergeant" },
  realName: "Wade Kenton",
});
const parse = (value, family = "operation") =>
  parseDraft(JSON.stringify(value), family);
const restore = (recipients, roster = [member]) =>
  prepareDraftRestore(parse(draft({ recipients })), roster);

describe("Draft file contract", () => {
  test("exports raw editable values, independent profile identity, search order, and no generated or roster data", () => {
    const text = serializeDraft({
      medalFamily: "operation",
      medalId: "army-commendation-medal",
      name: "Work in progress",
      entries: [
        { member, query: "Kenton.W", slotId: 70 },
        { member: null, query: "  Doe  " },
      ],
      values: {
        narrative: "  unfinished\ntext  ",
        operationTitle: "Overlord",
        actionCharacter: "heroic",
        unrelated: "old award",
      },
      recommendation: { citationText: "Never save this" },
    });
    const output = JSON.parse(text);
    expect(Object.keys(output).sort()).toEqual([
      "format",
      "medalFamily",
      "medalId",
      "name",
      "recipients",
      "values",
      "version",
    ]);
    expect(output.recipients).toEqual([
      {
        kind: "selected",
        query: "Kenton.W",
        identity: { userId: "9397", profileId: "4637" },
        snapshot: {
          username: "Kenton.W",
          rankFull: "Staff Sergeant",
          realName: "Wade Kenton",
        },
      },
      { kind: "search", query: "  Doe  " },
    ]);
    expect(output.values).toEqual({
      combatElement: "",
      operationTitle: "Overlord",
      location: "",
      operationDate: "",
      narrative: "  unfinished\ntext  ",
      actionCharacter: "heroic",
    });
    expect(output.name).toBe("Work in progress");
    expect(parseDraft(text, "operation").values.narrative).toBe(
      "  unfinished\ntext  ",
    );
  });

  test.each(
    MEDAL_FAMILY_LIST.flatMap((family) =>
      family.medals.map((medal) => [family.id, medal.id]),
    ),
  )("%s / %s permits an incomplete draft", (medalFamily, medalId) => {
    const text = serializeDraft({
      medalFamily,
      medalId,
      entries: [{ member: null, query: "" }],
      values: {},
    });
    expect(parseDraft(text, medalFamily).medalId).toBe(medalId);
  });

  test("preserves inactive conditional Service fields and partial month/year inputs", () => {
    const text = serializeDraft({
      medalFamily: "service",
      medalId: "defense-superior-service-medal",
      entries: [],
      values: {
        leadershipArea: "secondary",
        secondaryRole: "a clerk",
        secondaryBillet: "S1",
        operationsLeadership: "Saved AO lead",
        operationsAO: "Saved AO",
        serviceStart: "20-05",
        serviceEnd: "2026-",
        narrative: "[unfinished]",
      },
    });
    expect(parseDraft(text, "service").values).toEqual({
      leadershipArea: "secondary",
      secondaryRole: "a clerk",
      secondaryBillet: "S1",
      operationsLeadership: "Saved AO lead",
      operationsAO: "Saved AO",
      serviceStart: "20-05",
      serviceEnd: "2026-",
      narrative: "[unfinished]",
    });
  });

  test.each([
    ["null", () => null],
    ["array", () => []],
    ["wrong marker", (d) => ({ ...d, format: "other" })],
    ["unknown version", (d) => ({ ...d, version: 2 })],
    ["string version", (d) => ({ ...d, version: "1" })],
    ["wrong family", (d) => ({ ...d, medalFamily: "service" })],
    ["unknown medal", (d) => ({ ...d, medalId: "missing" })],
    ["nonstring medal", (d) => ({ ...d, medalId: 7 })],
    ["output property", (d) => ({ ...d, citation: "no" })],
    ["unknown field", (d) => ({ ...d, values: { mystery: "no" } })],
    ["object field", (d) => ({ ...d, values: { narrative: {} } })],
    ["null field", (d) => ({ ...d, values: { narrative: null } })],
    [
      "unsupported choice",
      (d) => ({ ...d, values: { actionCharacter: "invented" } }),
    ],
    [
      "invalid date structure",
      (d) => ({ ...d, values: { operationDate: "tomorrow" } }),
    ],
    ["invalid collection", (d) => ({ ...d, recipients: {} })],
    ["invalid entry", (d) => ({ ...d, recipients: [null] })],
    ["untyped entry", (d) => ({ ...d, recipients: [{ query: "Smith" }] })],
    [
      "search with selection",
      (d) => ({
        ...d,
        recipients: [{ kind: "search", query: "Smith", identity: {} }],
      }),
    ],
    [
      "nonstring query",
      (d) => ({ ...d, recipients: [{ kind: "search", query: 1 }] }),
    ],
    ["missing stable ID", (d) => ({ ...d, recipients: [saved({})] })],
    [
      "blank stable ID",
      (d) => ({ ...d, recipients: [saved({ userId: " " })] }),
    ],
    [
      "numeric stable ID",
      (d) => ({ ...d, recipients: [saved({ userId: 9397 })] }),
    ],
    [
      "oversized ID",
      (d) => ({ ...d, recipients: [saved({ userId: "a".repeat(129) })] }),
    ],
    [
      "missing snapshot",
      (d) => ({ ...d, recipients: [{ ...saved(), snapshot: null }] }),
    ],
    ["oversized name", (d) => ({ ...d, name: "n".repeat(513) })],
  ])("rejects %s", (_, alter) => expect(() => parse(alter(draft()))).toThrow());

  test.each(["__proto__", "constructor", "prototype"])(
    "rejects %s at every permitted object level",
    (key) => {
      for (const target of [
        "root",
        "values",
        "entry",
        "identity",
        "snapshot",
      ]) {
        const input = draft({ recipients: [saved()] });
        const location = {
          root: input,
          values: input.values,
          entry: input.recipients[0],
          identity: input.recipients[0].identity,
          snapshot: input.recipients[0].snapshot,
        }[target];
        Object.defineProperty(location, key, {
          value: { polluted: true },
          enumerable: true,
        });
        expect(() => parse(input)).toThrow(/property/);
      }
      expect({}.polluted).toBeUndefined();
    },
  );

  test("rejects malformed JSON and another family's otherwise shared medal ID", () => {
    expect(() => parseDraft("{unfinished", "operation")).toThrow(/JSON/);
    expect(() => parse(draft({ medalFamily: "service" }))).toThrow(/family/);
  });

  test("accepts incomplete and future values without applying recommendation completion rules", () => {
    expect(
      parse(
        draft({
          values: { narrative: "[unfinished]", operationDate: "2099-12-31" },
        }),
      ).values.operationDate,
    ).toBe("2099-12-31");
    expect(
      parse(
        draft({
          medalFamily: "service",
          medalId: "legion-of-merit",
          values: { serviceStart: "-05", serviceEnd: "202-" },
        }),
        "service",
      ).values.serviceStart,
    ).toBe("-05");
    expect(() =>
      parse(
        draft({
          medalFamily: "service",
          medalId: "legion-of-merit",
          values: { serviceStart: "2026-19" },
        }),
        "service",
      ),
    ).toThrow();
  });

  test("enforces the UTF-8 byte boundary on parsing and serialization without truncating", () => {
    const basic = JSON.stringify(draft());
    expect(
      parseDraft(basic.padEnd(MAX_DRAFT_BYTES, " "), "operation").medalId,
    ).toBe("army-commendation-medal");
    expect(() =>
      parseDraft(basic.padEnd(MAX_DRAFT_BYTES + 1, " "), "operation"),
    ).toThrow(/1 MiB/);
    const narrative = "😀".repeat(270000);
    const input = draft({ values: { narrative } });
    expect(JSON.stringify(input).length).toBeLessThan(MAX_DRAFT_BYTES);
    expect(() => parse(input)).toThrow(/1 MiB/);
    expect(() =>
      serializeDraft({ ...input, entries: [], values: { narrative } }),
    ).toThrow(/1 MiB/);
    expect(input.values.narrative).toBe(narrative);
  });

  test("round-trips a substantial selection with Unicode identities and a long narrative", () => {
    const roster = makeRecipientRoster(1500).map((r) => ({
      ...r,
      realName: `Renée 李 ${r.realName}`,
    }));
    const text = serializeDraft({
      medalFamily: "operation",
      medalId: "army-valorous-unit-award",
      entries: roster.map((member) => ({
        member,
        query: member.user.username,
      })),
      values: { narrative: "é".repeat(100000) },
    });
    expect(new TextEncoder().encode(text).byteLength).toBeLessThan(
      MAX_DRAFT_BYTES,
    );
    const restored = prepareDraftRestore(parseDraft(text, "operation"), roster);
    expect(restored.entries.map((entry) => entry.member)).toEqual(roster);
    expect(restored.values.narrative).toBe("é".repeat(100000));
    expect(new Set(restored.entries.map((entry) => entry.slotId)).size).toBe(
      1500,
    );
  });
});

describe("Draft recipient identity", () => {
  test.each([
    { userId: "9397", profileId: "4637" },
    { userId: "9397" },
    { profileId: "4637" },
  ])("resolves %j to the current roster record", (identity) => {
    const result = restore([saved(identity)]);
    expect(result.entries[0].member).toBe(member);
    expect(result.entries[0].query).toBe("Kenton.W");
  });
  test.each([
    ["missing", [saved({ userId: "missing" })], [member]],
    [
      "same name, different ID",
      [saved({ userId: "missing" })],
      [makeRecipient({ user: { username: "Old.W" }, realName: "Old Name" })],
    ],
    [
      "one unverifiable ID",
      [saved({ userId: "9397", profileId: "missing" })],
      [member],
    ],
    [
      "conflicting IDs",
      [saved({ userId: "9397", profileId: "other" })],
      [member, makeRecipient({ profileId: "other" })],
    ],
    [
      "ambiguous forum ID",
      [saved()],
      [member, makeRecipient({ user: { userId: "9397" }, profileId: "other" })],
    ],
    [
      "ambiguous profile ID",
      [saved()],
      [member, makeRecipient({ profileId: "4637" })],
    ],
  ])("keeps %s identity unresolved and downloadable", (_, entries, roster) => {
    const restored = restore(entries, roster);
    expect(restored.entries[0].member).toBeNull();
    expect(restored.entries[0].unresolvedRecipient).toEqual({
      identity: entries[0].identity,
      snapshot: entries[0].snapshot,
    });
    const redownload = serializeDraft({
      medalFamily: "operation",
      medalId: restored.medalId,
      entries: restored.entries,
      values: restored.values,
    });
    expect(JSON.parse(redownload).recipients).toEqual(entries);
  });
  test.each([
    [saved(), saved({ userId: "9397" })],
    [saved(), saved({ profileId: "4637" })],
  ])("rejects repeated saved identifiers", (...recipients) =>
    expect(() => restore(recipients)).toThrow(/duplicate/),
  );
  test("rejects two different identifier forms resolving to the same member", () => {
    expect(() =>
      restore([saved({ userId: "9397" }), saved({ profileId: "4637" })]),
    ).toThrow(/duplicate/);
  });
  test("keeps working order and unfinished text rather than recommendation sorting", () => {
    const junior = makeRecipient();
    const result = restore(
      [
        { kind: "search", query: "  unfinished  " },
        saved({ userId: "1001" }),
        saved(),
      ],
      [member, junior],
    );
    expect(result.entries.map((e) => e.query)).toEqual([
      "  unfinished  ",
      "Smith.J",
      "Kenton.W",
    ]);
    expect(result.entries.map((e) => e.member)).toEqual([null, junior, member]);
  });
});

describe("Draft filenames", () => {
  const state = {
    medalFamily: "operation",
    medalId: "army-commendation-medal",
    entries: [{ member }],
    values: { operationTitle: "Overlord" },
  };
  test("uses established title segments and omits missing information", () => {
    expect(buildDraftFilename(state)).toBe(
      "Draft - Operation Overlord - ARCOM - SSG.Kenton.W.json",
    );
    expect(
      buildDraftFilename({
        ...state,
        entries: [],
        medalId: "bronze-star-medal",
        values: { operationTitle: "Downfall" },
      }),
    ).toBe("Draft - Operation Downfall - BS.json");
    expect(
      buildDraftFilename({
        ...state,
        medalFamily: "service",
        medalId: "army-achievement-medal",
        values: {},
      }),
    ).toBe("Draft - AAM - SSG.Kenton.W.json");
    expect(
      buildDraftFilename({
        ...state,
        values: {},
        entries: [{ member }, { member: makeRecipient() }],
      }),
    ).toBe("Draft - ARCOM - Multiple.json");
    expect(
      buildDraftFilename({
        ...state,
        entries: [
          {
            member: makeRecipient({
              rank: { rankId: "unknown", rankShort: "?" },
            }),
          },
        ],
      }),
    ).toBe("Draft - Operation Overlord - ARCOM.json");
  });
  test("uses the active Service title field without leaking its inactive alternative", () => {
    expect(
      buildDraftFilename({
        ...state,
        medalFamily: "service",
        medalId: "defense-superior-service-medal",
        values: {
          leadershipArea: "operations",
          operationsAO: "Vietnam",
          secondaryBillet: "Hidden",
        },
      }),
    ).toBe("Draft - Vietnam - DSSM - SSG.Kenton.W.json");
  });
  test("produces bounded path-safe Unicode filenames", () => {
    const result = buildDraftFilename({
      ...state,
      values: {
        operationTitle: '../Bad\\name:\u0000?<>|*"' + "😀".repeat(100),
      },
    });
    expect(result).not.toMatch(/[<>:"/\\|?*\u0000-\u001f\u007f]/);
    expect(new TextEncoder().encode(result).byteLength).toBeLessThanOrEqual(
      185,
    );
    expect(result).toMatch(/^Draft - .+\.json$/u);
    expect(result).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/u);
  });
});
