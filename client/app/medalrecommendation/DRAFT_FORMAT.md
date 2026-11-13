# Medal Recommendation draft files — version 1

Draft files contain editable worksheet inputs, not generated recommendations.
Save, Load, and Download run entirely in the browser; none sends draft contents
to a server. Save manages named browser drafts; Load offers saved drafts and JSON
file import; Download creates a portable JSON file. A medal must be selected to
save or download, but the worksheet need not be complete.

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
      "identity": { "userId": "9397" },
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
512 UTF-16 code units) is preserved on re-download. Clear Worksheet removes this
local metadata. Normal edits and medal changes retain it. The optional name is
never authority to overwrite a named browser record.

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
- `identity` contains exactly one property: `userId`, the forum user ID. It is
  a required nonempty string of at most 128 UTF-16 code units. Whitespace around
  the ID is normalized. Unsupported identity properties, including the distinct
  MILPACS `profileId`, are rejected rather than discarded.
- `snapshot` contains exactly `username`, `rankFull`, and `realName`, each a
  string of at most 4096 UTF-16 code units. These are display fallbacks, never
  trusted roster records or identity-matching criteria.

Resolution uses the same forum-ID deduplication as normal recipient selection,
then looks up the saved `userId` in the current roster. A recreated MILPACS
profile under the same forum account resolves successfully. A missing forum
account remains unresolved, even if another member has the saved username or
real name. Duplicate selected `userId` values reject the entire import.

This is the final pre-release version-one identity contract. Earlier drafts
containing `profileId` (alone or alongside `userId`) fail strict validation;
there is no migration or version change.

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
Browser-assigned duplicate download filenames remain outside the application.

## Named browser drafts

Named drafts are local to this browser profile, shared by anyone using it, and
do not synchronize across devices or forum accounts. They are independent of
automatic worksheet recovery and of downloaded files. Clear Worksheet does not
delete named drafts.

The dedicated IndexedDB database `cavapps-medal-drafts`, schema version 1, has one
`drafts` store keyed by an immutable UUID. Each record contains `id`,
`schemaVersion`, `medalFamily`, `name`, `nameKey`, `revision`, `createdAt`,
`modifiedAt`, and `draftJSON`. A unique compound index on family/name key prevents
collisions; a family/modification index supports listing. Invalid records omitted
by that index are also surfaced without repair. Records list newest first with
ID ordering for ties. There is no automatic pruning or draft-count limit.

The payload remains the strict version-one JSON documented above. New snapshots
use `serializeDraft()`; Rename parses the existing payload and changes only its
name. The envelope and payload names must match. The 1 MiB limit includes the
encoded name, indentation, and final newline. IDs, revisions, timestamps, and
other database metadata never enter downloaded files or automatic recovery.

Browser names are trimmed, normalized to NFC, nonblank, free of control
characters, and at most 512 UTF-16 code units. Capitalization and internal spaces
are retained for display. Uniqueness uses deterministic lowercase NFC within a
medal family; Operation and Service may share a name. Imported file metadata
continues using the original v1 validation rules.

New names start from the existing download filename without `.json`. Generated
collisions use the smallest available positive number, for example
`Draft (1) - Operation Overlord - ARCOM - SSG.Kenton.W`. Custom copies may use
` (1)`. Suggestions can be edited before confirmation. A collision at confirmation
fails visibly; there is no implicit overwrite or automatic retry under a new name.

Save captures editable state at confirmation, including incomplete and inactive
profile fields, partial Service dates, unresolved references, and search order.
It preserves existing generated output. A successful Save binds the current
worksheet session to the saved ID, family, name, and acknowledged revision.
Subsequent edits retain that binding. Save then offers explicit confirmed
Overwrite or a separate copy with a new ID.

Create, Overwrite, Rename, and Delete each use a native atomic read/write
transaction, acknowledged only on completion. Existing-record mutations compare
the captured ID, family, and revision before writing; a remote modification or
deletion rejects stale requests. Failed operations leave the existing record
intact. No deleted ID is recreated. Rename advances a worksheet's binding only
when the previously acknowledged revision matches; refreshing the list never
authorizes overwriting from a stale worksheet.

Named Load validates the envelope and payload and resolves recipients using the
current roster. Existing meaningful work requires replacement confirmation;
accepting that confirmation re-reads and checks the saved revision. Successful
Load clears generated output, resets validation display, and records an ordinary
recovery edit. Corrupt drafts cannot replace the worksheet or block unrelated
valid entries. Explicit deletion of corrupt content is allowed only when its
identity metadata is valid. Unsupported records are reported without migration,
repair, or purge. File import remains available if named storage fails.

Bindings exist only in the current worksheet session. File import, automatic
recovery after reload, Clear, and unmount discard them. A delayed operation cannot
attach to a replacement session, and completing Save does not revert later edits.
Manual Save and local name changes do not register a recovery edit. An active
recovery conflict stays active after named Save or Load; saving a separate named
copy and downloading remain available without authorizing stale recovery writes.
