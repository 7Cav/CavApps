"use client";

function makeSafeId(value) {
  return String(value || "recipient")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RecipientSelector({
  roster,
  recipients,
  onChange,
  minimum = 1,
  maximum = 20,
  label = "Recipient",
  extraActions = null,
}) {
  const safeLabel = makeSafeId(label);
  const datalistId = `medal-roster-options-${safeLabel}`;

  function updateRecipient(index, value) {
    const nextRecipients = [...recipients];
    nextRecipients[index] = value;
    onChange(nextRecipients);
  }

  function addRecipient() {
    if (recipients.length >= maximum) {
      return;
    }

    onChange([...recipients, ""]);
  }

  function removeRecipient() {
    if (recipients.length <= minimum) {
      return;
    }

    onChange(recipients.slice(0, -1));
  }

  return (
    <section className="border border-[#353535] bg-[#141414] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#ebc729]">Recipients</h3>
          <p className="mt-1 text-xs text-[#858585]">
            Start typing a rank or roster name and choose the correct member.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-[#777]">
            {recipients.length} / {maximum}
          </span>

          <button
            type="button"
            onClick={addRecipient}
            disabled={recipients.length >= maximum}
            className="border border-[#555] px-3 py-1.5 text-xs font-semibold text-[#cfcfcf] transition hover:border-[#ebc729] hover:text-[#ebc729] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Add Recipient
          </button>

          <button
            type="button"
            onClick={removeRecipient}
            disabled={recipients.length <= minimum}
            className="border border-[#555] px-3 py-1.5 text-xs font-semibold text-[#c8c8c8] transition hover:border-red-700 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Remove
          </button>

          {extraActions}
        </div>
      </div>

      <datalist id={datalistId}>
        {roster.map((person) => (
          <option key={person.milpacId} value={person.dropdownName} />
        ))}
      </datalist>

      <div className="grid gap-3 sm:grid-cols-2">
        {recipients.map((recipient, index) => (
          <div key={index}>
            <label
              htmlFor={`${safeLabel}-${index}`}
              className="mb-1.5 block text-xs font-medium text-[#c8c8c8]"
            >
              {label} {index + 1}
            </label>

            <input
              id={`${safeLabel}-${index}`}
              type="text"
              list={datalistId}
              value={recipient}
              onChange={(event) => updateRecipient(index, event.target.value)}
              className="h-10 w-full border border-[#444] bg-[#1b1b1b] px-3 text-sm text-white outline-none transition focus:border-[#ebc729]"
              placeholder="Rank or name…"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
