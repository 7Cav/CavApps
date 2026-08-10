"use client";

export default function RecipientSelector({
  roster,
  recipients,
  onChange,
  minimum = 1,
  maximum = 20,
  label = "Recipient",
}) {
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
    <div>
      <datalist id="medal-roster-options">
        {roster.map((person) => (
          <option
            key={person.milpacId}
            value={person.dropdownName}
          />
        ))}
      </datalist>

      <div className="grid gap-4">
        {recipients.map((recipient, index) => (
          <div key={index}>
            <label
              htmlFor={`recipient-${label}-${index}`}
              className="mb-2 block font-medium"
            >
              {label} {index + 1}
            </label>

            <input
              id={`recipient-${label}-${index}`}
              type="text"
              list="medal-roster-options"
              value={recipient}
              onChange={(event) =>
                updateRecipient(
                  index,
                  event.target.value,
                )
              }
              className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
              placeholder="Start typing a rank or name…"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={addRecipient}
          disabled={
            recipients.length >= maximum
          }
          className="border border-[#444] px-4 py-2 text-[#ddd] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add Recipient
        </button>

        <button
          type="button"
          onClick={removeRecipient}
          disabled={
            recipients.length <= minimum
          }
          className="border border-[#444] px-4 py-2 text-[#ddd] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Remove Recipient
        </button>

        <span className="self-center text-sm text-[#888]">
          {recipients.length} / {maximum}
        </span>
      </div>
    </div>
  );
}