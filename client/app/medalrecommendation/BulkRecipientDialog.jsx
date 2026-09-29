"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RECIPIENT_SELECTION_POLICY,
  getRecipientPasteError,
  clearShownRecipients,
  filterRecipients,
  getRecipientDisplayName,
  getRecipientId,
  matchPastedRecipients,
  selectShownRecipients,
  uniqueRecipients,
  validateRecipientEntries,
} from "./lib/recipient-utils";

// Mounted afresh for each opening: cancelling discards all draft edits.
function BulkRecipientDraft({
  roster,
  organizations,
  selected,
  policy,
  onConfirm,
}) {
  const [draft, setDraft] = useState(() => uniqueRecipients(selected));
  const [query, setQuery] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [paste, setPaste] = useState("");
  const [pasteResults, setPasteResults] = useState([]);
  const [pasteError, setPasteError] = useState("");
  const shown = useMemo(
    () =>
      filterRecipients(
        roster,
        query,
        organizations.find((entry) => entry.id === organizationId),
      ),
    [roster, query, organizations, organizationId],
  );
  const selectedIds = useMemo(
    () => new Set(draft.map(getRecipientId)),
    [draft],
  );
  const canConfirm = validateRecipientEntries(
    draft.map((member) => ({ member })),
    RECIPIENT_SELECTION_POLICY,
  ).isComplete;

  function rejectOversizedInput(message) {
    setPasteResults([]);
    setPasteError(message);
  }

  function changePaste(value) {
    const error = getRecipientPasteError(value.length);
    if (error) {
      rejectOversizedInput(error);
      return;
    }
    setPaste(value);
    setPasteResults([]);
    setPasteError("");
  }

  function preflightPaste(event) {
    const field = event.currentTarget;
    const clipboardText = event.clipboardData.getData("text");
    const proposedLength =
      field.value.length -
      (field.selectionEnd - field.selectionStart) +
      clipboardText.length;
    const error = getRecipientPasteError(proposedLength);
    if (error) {
      event.preventDefault();
      rejectOversizedInput(error);
    }
  }

  function matchPaste() {
    try {
      const { selection, results } = matchPastedRecipients(
        paste,
        roster,
        draft,
      );
      setDraft(selection);
      setPasteResults(results);
      setPasteError("");
    } catch (error) {
      setPasteError(error.message);
    }
  }

  return (
    <>
      <div className="mt-5 grid min-w-0 gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-label="Eligible roster" className="min-w-0 space-y-3">
          <label
            htmlFor="bulk-roster-search"
            className="block text-sm font-semibold"
          >
            Search Roster
          </label>
          <Input
            id="bulk-roster-search"
            placeholder="Search by name, username, rank, or billet..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label
            htmlFor="bulk-organization"
            className="block text-sm font-semibold"
          >
            Organization
          </label>
          <Select
            value={organizationId || "all"}
            onValueChange={(value) =>
              setOrganizationId(value === "all" ? "" : value)
            }
          >
            <SelectTrigger id="bulk-organization">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organizations</SelectItem>
              {organizations.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft((current) => selectShownRecipients(current, shown))
              }
            >
              Select All Shown
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft((current) => clearShownRecipients(current, shown))
              }
            >
              Clear Shown
            </Button>
          </div>
          <ul
            aria-label="Roster matches"
            className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2"
          >
            {shown.map((member) => (
              <li key={getRecipientId(member)}>
                <label className="flex cursor-pointer items-start gap-3 rounded-sm p-2 hover:bg-muted">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    checked={selectedIds.has(getRecipientId(member))}
                    aria-label={getRecipientDisplayName(member)}
                    aria-describedby={`bulk-member-${getRecipientId(member)}-context`}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setDraft((current) =>
                        checked
                          ? selectShownRecipients(current, [member])
                          : clearShownRecipients(current, [member]),
                      );
                    }}
                  />
                  <span className="min-w-0 break-words">
                    <span className="block font-medium">
                      {getRecipientDisplayName(member)}
                    </span>
                    <span
                      id={`bulk-member-${getRecipientId(member)}-context`}
                      className="text-sm text-muted-foreground"
                    >
                      {member.user.username} · {member.primary?.positionTitle}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {shown.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No matching recipients.
            </p>
          )}
        </section>
        <section aria-label="Selected recipients" className="min-w-0 space-y-3">
          <p aria-live="polite" className="font-semibold">
            {draft.length} recipients selected
          </p>
          {policy.minimum > 1 && (
            <p className="text-sm text-muted-foreground">
              You can confirm a smaller selection and continue editing. At least{" "}
              {policy.minimum} valid recipients are required to generate this
              recommendation.
            </p>
          )}
          <ul
            aria-label="Draft recipients"
            className="max-h-52 space-y-1 overflow-y-auto rounded-md border p-2"
          >
            {draft.map((member) => (
              <li
                key={getRecipientId(member)}
                className="flex items-center justify-between gap-2 p-1"
              >
                <span className="min-w-0 break-words">
                  <span className="block font-medium">
                    {getRecipientDisplayName(member)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {member.user.username}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${getRecipientDisplayName(member)} (${member.user.username})`}
                  onClick={() =>
                    setDraft((current) =>
                      clearShownRecipients(current, [member]),
                    )
                  }
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
          <label
            htmlFor="bulk-recipient-paste"
            className="block text-sm font-semibold"
          >
            Paste a Recipient List
          </label>
          <p id="bulk-paste-help" className="text-sm text-muted-foreground">
            One recipient per line: full name, rank and name, username, or
            rank.username. Exact matches only.
          </p>
          <textarea
            id="bulk-recipient-paste"
            aria-describedby={
              pasteError
                ? "bulk-paste-help bulk-paste-error"
                : "bulk-paste-help"
            }
            aria-invalid={pasteError ? "true" : undefined}
            value={paste}
            rows={4}
            onPaste={preflightPaste}
            onChange={(event) => changePaste(event.target.value)}
            className="w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(pasteError)}
            onClick={matchPaste}
          >
            Match Pasted Names
          </Button>
          {pasteError && (
            <p id="bulk-paste-error" role="alert">
              {pasteError}
            </p>
          )}
          <ul
            aria-label="Paste match results"
            aria-live="polite"
            className="max-h-40 overflow-y-auto text-sm"
          >
            {pasteResults.map((result, index) => (
              <li key={index}>
                {result.line}: {result.outcome}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm(uniqueRecipients(draft))}
        >
          Confirm Recipients
        </Button>
      </div>
    </>
  );
}

export default function BulkRecipientDialog({
  open,
  onOpenChange,
  onCloseAutoFocus,
  ...props
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel="Close bulk recipient selection"
        className="max-w-[90rem]"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogTitle className="pr-8 text-xl font-semibold text-primary">
          Bulk Recipient Selection
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          Choose recipients, then confirm to update the worksheet. Cancel
          discards your changes.
        </DialogDescription>
        <BulkRecipientDraft {...props} />
      </DialogContent>
    </Dialog>
  );
}
