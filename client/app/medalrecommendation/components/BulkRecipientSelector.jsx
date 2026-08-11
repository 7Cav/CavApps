"use client";

import { useMemo, useState } from "react";

import {
  buildOrganizationOptions,
  filterBulkRoster,
  formatBilletSummary,
  formatBulkPersonName,
  matchPastedRecipients,
  orderSelectedRecipients,
  resolveExistingRecipients,
} from "../lib/bulk-recipient-utils";

const INPUT_CLASS =
  "h-10 w-full border border-[#444] bg-[#1b1b1b] px-3 text-sm text-white outline-none transition focus:border-[#ebc729]";

const SECONDARY_BUTTON_CLASS =
  "border border-[#555] px-3 py-2 text-xs font-semibold text-[#cfcfcf] transition hover:border-[#ebc729] hover:text-[#ebc729] disabled:cursor-not-allowed disabled:opacity-35";

export default function BulkRecipientSelector({
  roster,
  recipients,
  minimum = 4,
  onConfirm,
  onCancel,
}) {
  const initialResolution = useMemo(
    () => resolveExistingRecipients(recipients, roster),
    [recipients, roster],
  );

  const [selected, setSelected] = useState(
    () => new Set(initialResolution.matched),
  );
  const [search, setSearch] = useState("");
  const [organization, setOrganization] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pasteReport, setPasteReport] = useState(null);

  const organizationOptions = useMemo(
    () => buildOrganizationOptions(roster),
    [roster],
  );

  const filteredRoster = useMemo(
    () => filterBulkRoster(roster, search, organization),
    [roster, search, organization],
  );

  const rosterByName = useMemo(
    () =>
      new Map((roster ?? []).map((person) => [person.dropdownName, person])),
    [roster],
  );

  const orderedSelected = useMemo(
    () => orderSelectedRecipients(Array.from(selected), roster),
    [selected, roster],
  );

  function toggleRecipient(dropdownName) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(dropdownName)) {
        next.delete(dropdownName);
      } else {
        next.add(dropdownName);
      }

      return next;
    });
  }

  function selectAllShown() {
    setSelected((current) => {
      const next = new Set(current);
      filteredRoster.forEach((person) => next.add(person.dropdownName));
      return next;
    });
  }

  function clearShown() {
    setSelected((current) => {
      const next = new Set(current);
      filteredRoster.forEach((person) => next.delete(person.dropdownName));
      return next;
    });
  }

  function handlePasteMatch() {
    const report = matchPastedRecipients(
      pasteText,
      roster,
      Array.from(selected),
    );

    if (report.matched.length) {
      setSelected((current) => {
        const next = new Set(current);
        report.matched.forEach((recipient) => next.add(recipient));
        return next;
      });
    }

    setPasteReport(report);
  }

  function handleConfirm() {
    if (orderedSelected.length < minimum) {
      return;
    }

    onConfirm(orderedSelected);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-unit-bulk-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden border border-[#4a4a4a] bg-[#111] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#333] px-5 py-4 sm:px-6">
          <div>
            <span className="text-xs font-semibold tracking-[0.18em] text-[#ebc729]">
              SERVICE UNIT AWARD
            </span>
            <h2
              id="service-unit-bulk-title"
              className="mt-1 text-2xl font-bold text-white"
            >
              Bulk Recipient Selection
            </h2>
            <p className="mt-1 text-sm text-[#888]">
              Select department- or unit-sized recipient groups from the
              eligible roster.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="border border-[#444] px-3 py-1.5 text-lg leading-none text-[#aaa] transition hover:border-[#ebc729] hover:text-[#ebc729]"
            aria-label="Close bulk recipient selection"
          >
            ×
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)]">
          <section className="flex min-h-0 flex-col border-b border-[#333] p-5 lg:border-b-0 lg:border-r sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-[#aaa]">
                Search Roster
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={`${INPUT_CLASS} mt-1.5`}
                  placeholder="Search rank, name, or billet…"
                  autoFocus
                />
              </label>

              <label className="text-xs font-medium text-[#aaa]">
                Organization
                <select
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  className={`${INPUT_CLASS} mt-1.5`}
                >
                  <option value="">All organizations</option>
                  {organizationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="my-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllShown}
                  disabled={!filteredRoster.length}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  Select All Shown
                </button>
                <button
                  type="button"
                  onClick={clearShown}
                  disabled={!filteredRoster.length}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  Clear Shown
                </button>
              </div>

              <span className="text-xs text-[#777]">
                {filteredRoster.length} roster members shown
              </span>
            </div>

            <div className="min-h-[16rem] flex-1 overflow-y-auto border border-[#333] bg-[#151515]">
              {filteredRoster.length ? (
                filteredRoster.map((person) => (
                  <label
                    key={person.milpacId || person.dropdownName}
                    className="flex cursor-pointer items-start gap-3 border-b border-[#292929] px-3 py-2.5 transition last:border-b-0 hover:bg-[#1d1d1d]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(person.dropdownName)}
                      onChange={() => toggleRecipient(person.dropdownName)}
                      className="mt-1 h-4 w-4 accent-[#ebc729]"
                    />
                    <span className="min-w-0">
                      <strong className="block text-sm font-semibold text-[#e6e6e6]">
                        {formatBulkPersonName(person)}
                      </strong>
                      <small className="mt-0.5 block text-xs leading-5 text-[#777]">
                        {formatBilletSummary(person)}
                      </small>
                    </span>
                  </label>
                ))
              ) : (
                <p className="p-5 text-sm text-[#777]">
                  No roster members match the current filters.
                </p>
              )}
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto p-5 sm:p-6">
            <div className="mb-5">
              <strong className="text-base text-white">
                {orderedSelected.length} recipients selected
              </strong>
              <p className="mt-1 text-xs text-[#777]">
                Minimum required: {minimum}. Maximum: eligible roster size.
              </p>
            </div>

            {initialResolution.unmatched.length ? (
              <div className="mb-5 border border-amber-700/60 bg-amber-950/20 p-3 text-xs leading-5 text-amber-200">
                {initialResolution.unmatched.length} current recipient entr
                {initialResolution.unmatched.length === 1 ? "y" : "ies"} could
                not be matched to the roster and will not be kept unless
                corrected.
              </div>
            ) : null}

            <div className="max-h-52 overflow-y-auto border border-[#333] bg-[#151515]">
              {orderedSelected.length ? (
                orderedSelected.map((dropdownName) => {
                  const person = rosterByName.get(dropdownName);

                  return (
                    <div
                      key={dropdownName}
                      className="flex items-center justify-between gap-3 border-b border-[#292929] px-3 py-2 last:border-b-0"
                    >
                      <span className="min-w-0 truncate text-sm text-[#d7d7d7]">
                        {person ? formatBulkPersonName(person) : dropdownName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRecipient(dropdownName)}
                        className="shrink-0 text-xs font-semibold text-[#888] transition hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="p-4 text-sm text-[#777]">
                  No recipients selected.
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-[#333] pt-5">
              <label className="text-xs font-medium text-[#aaa]">
                Paste a Recipient List
                <textarea
                  value={pasteText}
                  onChange={(event) => {
                    setPasteText(event.target.value);
                    setPasteReport(null);
                  }}
                  className="mt-1.5 min-h-32 w-full resize-y border border-[#444] bg-[#1b1b1b] p-3 text-sm text-white outline-none transition focus:border-[#ebc729]"
                  placeholder="Paste one recipient per line. Full rank and name, rank abbreviation and name, roster name, or first and last name are accepted."
                />
              </label>

              <button
                type="button"
                onClick={handlePasteMatch}
                disabled={!pasteText.trim()}
                className={`${SECONDARY_BUTTON_CLASS} mt-2 w-full`}
              >
                Match Pasted Names
              </button>

              {pasteReport ? (
                <div
                  className="mt-3 space-y-2 text-xs leading-5"
                  aria-live="polite"
                >
                  <p
                    className={
                      pasteReport.unmatched.length
                        ? "text-amber-300"
                        : "text-emerald-300"
                    }
                  >
                    {pasteReport.matched.length} matched
                  </p>

                  {pasteReport.unmatched.length ? (
                    <div className="text-amber-200">
                      <strong>Unmatched:</strong>
                      <ul className="mt-1 list-disc pl-5">
                        {pasteReport.unmatched.map((name) => (
                          <li key={`unmatched-${name}`}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {pasteReport.duplicates.length ? (
                    <div className="text-[#aaa]">
                      <strong>Duplicates already selected:</strong>
                      <ul className="mt-1 list-disc pl-5">
                        {pasteReport.duplicates.map((name) => (
                          <li key={`duplicate-${name}`}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#333] px-5 py-4 sm:px-6">
          <span className="text-xs text-[#777]">
            {orderedSelected.length < minimum
              ? `Select at least ${minimum} recipients to continue.`
              : `${orderedSelected.length} recipients ready to confirm.`}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={SECONDARY_BUTTON_CLASS}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={orderedSelected.length < minimum}
              className="border border-[#ebc729] bg-[#1c1c1c] px-4 py-2 text-sm font-semibold text-[#ebc729] transition hover:bg-[#ebc729] hover:text-black disabled:cursor-not-allowed disabled:opacity-35"
            >
              Confirm Recipients
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
