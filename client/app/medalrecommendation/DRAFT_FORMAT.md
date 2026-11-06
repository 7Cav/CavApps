# Medal Recommendation draft files — version 1

Draft files contain editable worksheet inputs, not generated recommendations.
Load and Download run entirely in the browser; neither sends file contents to a
server or writes browser draft storage. A medal must be selected to download,
but the worksheet need not be complete.

## Envelope

```json
{
  "format": "cavapps.medal-recommendation.draft",
  "version": 1,
  "medalFamily": "operation",
  "medalId": "army-commendation-medal",
  "recipients": [
    {
      "kind": "selected",
      "query": "Kenton.W",
      "identity": { "userId": "9397", "profileId": "4637" },
      "snapshot": {
        "username": "Kenton.W",
        "rankFull": "Staff Sergeant",
        "realName": "Wade Kenton"
      }
    },
    { "kind": "search", "query": "unfinished search" }
  ],
  "values": {
    "combatElement": "",
    "operationTitle": "Overlord",
    "location": "",
    "operationDate": "",
    "narrative": "Unfinished text",
    "actionCharacter": ""
  }
}
```

All shown envelope properties are required. An optional string `name` (at most
512 UTF-16 code units) is preserved on re-download. Slice 1 has no naming UI;
Clear Worksheet removes this metadata. Normal edits and medal changes retain it.

`medalFamily` is `operation` or `service`. The family must match the open
worksheet, and `medalId` must exist in that family's current catalog. Medal IDs
are not globally unique across families. Unknown markers, versions, medals,
fields, choices, properties, and unsupported primitive types are rejected.
There are no speculative migrations. A future incompatible schema needs an
explicit version handler.

## Recipients

Array order is editable working order, independent of recommendation sorting.
Empty arrays are accepted and restored as one blank editable slot. Runtime slot
IDs are freshly allocated and never serialized.

- `search` entries contain only `kind` and the raw string `query`.
- `selected` entries additionally require `identity` and `snapshot`.
- `identity` contains one or both nonempty string identifiers, each at most
  128 UTF-16 code units. Whitespace around IDs is normalized. `userId` is the
  forum user ID; `profileId` is the MILPACS profile-map key. They are distinct.
- `snapshot` contains exactly `username`, `rankFull`, and `realName`, each a
  string of at most 4096 UTF-16 code units. These are display fallbacks, never
  trusted roster records or identity-matching criteria.

Resolution indexes the original roster supplied to the page, before selection
deduplication. Every supplied ID must match uniquely and agree on the same
current member; ambiguous current identities remain unresolved. A missing or
conflicting second identifier does not silently fall back to the first.
Repeated saved identifiers, or separate entries resolving to the same person,
reject the entire import.

Resolved recipients use current usernames, names, ranks, billets, and roster
status. A resolved selection's query becomes the current username. No additional
API refresh occurs during loading. Existing eligibility and narrative checks
continue to apply without historical-rank warnings.

Unresolved entries retain their saved identity and editable query, show
**Recipient Not Found**, and block generation. Selecting a current roster member
explicitly replaces the saved identity. Typing alone does not discard it.
Explicit removal does discard it. Compact mode exposes pending entries in
expandable groups of eight and counts them separately from resolved members.
Bulk confirmation preserves unresolved entries and nonempty unfinished queries,
while retaining Bulk's resolved-member order. Re-download preserves unresolved
references and snapshots.

## Worksheet values

The current resolved worksheet profile supplies the field allowlist and types.
All current field types store strings. Downloads include all fields of that
profile, including inactive conditional fields, with raw whitespace and prose
preserved. Values belonging only to an earlier medal's profile are excluded.
Omitted known fields on import receive their current defaults or an empty string.

- Text and narrative strings may be incomplete, including content that ordinary
  worksheet validation will subsequently reject.
- Choice fields store option IDs, or an empty string for unfinished selection.
- Operation dates are empty or date-shaped strings (`YYYY-MM-DD`, allowing
  longer year components). Completion and calendar rules remain in the existing
  validator. Native browser date-input segments that have not produced a field
  value are not accessible to the application and are not persisted.
- Service month/year values are empty or `year-month`. The year may contain zero
  to four digits and the month is empty or `01`–`12`. Thus `20-05`, `2026-`, and
  `-05` preserve partial editing. Completion validation is unchanged.

Generated titles, citations, BBCode, previews, warning/validation results,
derived profiles, dialog state, roster records, and storage metadata are not
part of the format.

## Limits and safe handling

Both import and export have a 1 MiB (1,048,576-byte) UTF-8 limit. Downloads use
two-space JSON indentation and a final newline; this actual encoded output must
fit the limit. Nothing is truncated. Free-text values are also bounded by this
budget; identifier and snapshot bounds are stricter as described above.

The recipient-array safety bound is derived from the file budget divided by the
minimum legal entry's compact JSON length. This does not introduce a medal
recipient-count maximum. The byte limit normally constrains actual selected
recipient collections much earlier.

Load checks file size before reading, decodes UTF-8 strictly, parses JSON, checks
exact shapes and allowed keys at each schema level, validates family/catalog/
profile compatibility, and resolves recipients before offering replacement.
`__proto__`, `constructor`, and `prototype` keys are rejected. Fresh objects are
built from allowed properties; imported objects are not merged into state.
Snapshot strings are rendered as text, not HTML. No code is executed from a file.

Invalid files and cancellation leave the complete worksheet and generated output
unchanged. Superseded, closed, or unmounted file reads cannot apply stale results
or errors. A successful load applies all editable state together, resets editor
and validation-display state, and clears output. Generate Recommendation must be
clicked again using the current definitions and roster.

Download filenames use `Draft -`, available title-context/medal/recipient
segments, and `.json`. Missing segments are omitted. Unsafe path/platform
characters are replaced; the stem is bounded to 180 UTF-8 bytes without splitting
Unicode code points. Saved draft names do not override these filename rules.
Browser duplicate-number assignment is outside Slice 1.
