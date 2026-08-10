"use client";

const SOFT_CHARACTER_LIMIT = 1400;
const HARD_CHARACTER_LIMIT = 2100;
const TEXTAREA_INPUT_LIMIT = 12000;

export default function NarrativeField({
  id,
  label = "Citation Narrative",
  value,
  onChange,
  countWords,
  countSentences,
  minimumSentences = 0,
  note = "",
  placeholder = "",
}) {
  const normalizedValue = value.trim();

  const words =
    typeof countWords === "function"
      ? countWords(normalizedValue)
      : 0;

  const sentences =
    typeof countSentences === "function"
      ? countSentences(normalizedValue)
      : 0;

  const characters = normalizedValue.length;

  const softLimitExceeded =
    characters > SOFT_CHARACTER_LIMIT;

  const hardLimitExceeded =
    characters > HARD_CHARACTER_LIMIT;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-medium"
      >
        {label}
      </label>

      {note ? (
        <p className="mb-3 text-sm text-[#aaa]">
          {note}
        </p>
      ) : null}

      <textarea
        id={id}
        rows={12}
        maxLength={TEXTAREA_INPUT_LIMIT}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full border border-[#444] bg-[#1a1a1a] px-3 py-2 text-white"
        placeholder={placeholder}
      />

      <div
        className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#999]"
        aria-live="polite"
      >
        <span>
          Approx. sentences:{" "}
          <strong className="text-white">
            {sentences}
          </strong>
          {minimumSentences > 0 ? (
            <> / {minimumSentences} minimum</>
          ) : null}
        </span>

        <span>
          Approx. words:{" "}
          <strong className="text-white">
            {words}
          </strong>
        </span>

        <span
          className={
            hardLimitExceeded
              ? "text-red-400"
              : softLimitExceeded
                ? "text-yellow-400"
                : ""
          }
        >
          Characters:{" "}
          <strong>
            {characters.toLocaleString()} /{" "}
            {HARD_CHARACTER_LIMIT.toLocaleString()}
          </strong>
        </span>
      </div>

      {softLimitExceeded ? (
        <p
          className={
            hardLimitExceeded
              ? "mt-2 text-sm text-red-400"
              : "mt-2 text-sm text-yellow-400"
          }
        >
          {hardLimitExceeded
            ? `Hard limit exceeded: shorten the narrative to ${HARD_CHARACTER_LIMIT.toLocaleString()} characters or fewer before generating.`
            : `Soft warning: over ${SOFT_CHARACTER_LIMIT.toLocaleString()} characters. You can still generate the recommendation.`}
        </p>
      ) : null}
    </div>
  );
}