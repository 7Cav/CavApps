"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BulkRecipientDialog from "./BulkRecipientDialog";
import {
  RECIPIENT_INLINE_LIMIT,
  RECIPIENT_SELECTION_POLICY,
  filterRecipients,
  getRecipientDisplayName,
  getRecipientId,
  prioritizeInlineRecipients,
  requiresEligibilityWarning,
} from "./lib/recipient-utils";

export default function RecipientManager({
  entries,
  selected,
  recommendationRecipients,
  roster,
  organizations,
  minimumError,
  hasAttemptedGenerate,
  errors,
  onAdd,
  onRemove,
  onRemoveEntry,
  onQueryChange,
  onSelect,
  onConfirm,
}) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pendingShown, setPendingShown] = useState(RECIPIENT_INLINE_LIMIT);
  const returnFocusRef = useRef(null);
  const bulkButtonRef = useRef(null);
  const selectedIds = useMemo(
    () => new Set(selected.map(getRecipientId)),
    [selected],
  );
  const compact = entries.length > RECIPIENT_INLINE_LIMIT;
  const pendingEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry.member);
  const nonActiveCount = selected.filter(requiresEligibilityWarning).length;

  function openBulk(event) {
    returnFocusRef.current = event.currentTarget;
    setBulkOpen(true);
  }

  function renderEntry(entry, index) {
    const id = `recipient-${entry.slotId}`;
    const error = entry.unresolvedRecipient
      ? "Recipient Not Found"
      : errors[index];
    const query = entry.query.trim().toLowerCase();
    const suggestions =
      !query || entry.member?.user?.username === entry.query
        ? []
        : prioritizeInlineRecipients(
            filterRecipients(roster, query).filter(
              (member) => !selectedIds.has(getRecipientId(member)),
            ),
            query,
          ).slice(0, 10);
    return (
      <div key={entry.slotId} className="flex min-w-0 flex-col gap-2">
        <label
          htmlFor={id}
          className="pb-1 text-sm font-semibold text-foreground"
        >
          {entries.length === 1 ? "Recipient" : `Recipient ${index + 1}`}
        </label>
        <Input
          id={id}
          type="text"
          value={entry.query}
          autoComplete="off"
          placeholder="Search by name, username, rank, or billet"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-required` : undefined}
          className={
            error
              ? "border-destructive focus-visible:ring-destructive"
              : undefined
          }
          onChange={(event) => onQueryChange(entry.slotId, event.target.value)}
        />
        {error && (
          <p
            id={`${id}-required`}
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        {entry.unresolvedRecipient && (
          <p className="break-words text-sm">
            {entry.unresolvedRecipient.snapshot.rankFull}{" "}
            {entry.unresolvedRecipient.snapshot.realName} (
            {entry.unresolvedRecipient.snapshot.username})
          </p>
        )}
        {!entry.member && (compact || entry.unresolvedRecipient) && (
          <Button
            type="button"
            variant="ghost"
            className="self-start"
            aria-label={`Remove recipient ${index + 1}`}
            onClick={() => onRemoveEntry(entry.slotId)}
          >
            Remove
          </Button>
        )}
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            {suggestions.map((member) => (
              <Button
                key={getRecipientId(member)}
                type="button"
                variant="outline"
                onClick={() => onSelect(entry.slotId, member)}
              >
                {member.user.username}
              </Button>
            ))}
          </div>
        )}
        {entry.member && (
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="font-medium">
                {getRecipientDisplayName(entry.member)}
              </p>
            </div>
            {requiresEligibilityWarning(entry.member) && (
              <div
                role="status"
                className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm"
              >
                This member is not an active member, please confirm eligibility.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="recipients-heading"
      aria-describedby={minimumError ? "recipients-minimum-error" : undefined}
      className="space-y-4"
    >
      <h3 id="recipients-heading" className="font-semibold text-foreground">
        Recipients
      </h3>
      {minimumError && (
        <p
          id="recipients-minimum-error"
          role={hasAttemptedGenerate ? "alert" : "status"}
          className={`text-sm font-medium ${hasAttemptedGenerate ? "text-destructive" : "text-muted-foreground"}`}
        >
          {minimumError}
        </p>
      )}
      {compact ? (
        <>
          <Button
            ref={bulkButtonRef}
            type="button"
            variant="outline"
            onClick={openBulk}
          >
            View/Edit Recipients
          </Button>
          <p aria-live="polite">
            {selected.length}{" "}
            {selected.length === 1 ? "recipient" : "recipients"} selected
          </p>
          <ul aria-label="Confirmed recipients" className="space-y-1">
            {(expanded
              ? recommendationRecipients
              : recommendationRecipients.slice(0, RECIPIENT_INLINE_LIMIT)
            ).map((member) => (
              <li key={getRecipientId(member)}>
                {getRecipientDisplayName(member)}
              </li>
            ))}
          </ul>
          {selected.length > RECIPIENT_INLINE_LIMIT && (
            <Button
              type="button"
              variant="ghost"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded
                ? "Show less"
                : `+ ${selected.length - RECIPIENT_INLINE_LIMIT} more`}
            </Button>
          )}
          {pendingEntries.length > 0 && (
            <div
              className="space-y-3"
              role="group"
              aria-label="Recipients needing attention"
            >
              <p role="status">
                {pendingEntries.length} recipient entries need attention
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {pendingEntries
                  .slice(0, pendingShown)
                  .map(({ entry, index }) => renderEntry(entry, index))}
              </div>
              {pendingShown < pendingEntries.length && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setPendingShown((count) => count + RECIPIENT_INLINE_LIMIT)
                  }
                >
                  Show more pending recipients
                </Button>
              )}
            </div>
          )}
          {nonActiveCount > 0 && (
            <p
              role="status"
              className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm"
            >
              {nonActiveCount} selected recipients are not active members.
              Please confirm eligibility.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={
                entries.length === RECIPIENT_INLINE_LIMIT ? openBulk : onAdd
              }
            >
              Add Recipient
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={entries.length <= RECIPIENT_SELECTION_POLICY.minimum}
              onClick={onRemove}
            >
              Remove Recipient
            </Button>
            <Button
              ref={bulkButtonRef}
              type="button"
              variant="outline"
              onClick={openBulk}
            >
              Bulk Add Recipients
            </Button>
          </div>
          <div
            className={
              entries.length === 1 ? "grid gap-4" : "grid gap-4 md:grid-cols-2"
            }
          >
            {entries.map(renderEntry)}
          </div>
        </>
      )}
      <BulkRecipientDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef.current?.isConnected
            ? returnFocusRef.current
            : bulkButtonRef.current;
          target?.focus();
        }}
        roster={roster}
        organizations={organizations}
        selected={selected}
        onConfirm={(members) => {
          onConfirm(members);
          setExpanded(false);
          setBulkOpen(false);
        }}
      />
    </section>
  );
}
