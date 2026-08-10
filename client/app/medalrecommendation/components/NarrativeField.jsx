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
    typeof countWords === "function" ? countWords(normalizedValue) : 0;

  const sentences =
    typeof countSentences === "function"
      ? countSentences(normalizedValue)
      : 0;

  const characters = normalizedValue.length;
  const softLimitExceeded = characters > SOFT_CHARACTER_LIMIT;
  const hardLimitExceeded = characters > HARD_CHARACTER_LIMIT;

  return (
    <section className="border border-[#353535] bg-[#141414] p-4">
      <label htmlFor={id} className="block font-semibold text-[#dedede]">
        {label}
      </label>

      {note ? (
        <p className="mt-2 border-l-2 border-[#ebc729] bg-[#191919] px-3 py-2 text-xs leading-5 text-[#a9a9a9]">
          {note}
        </p>
      ) : null}

      <textarea
        id={id}
        rows={7}
        maxLength={TEXTAREA_INPUT_LIMIT}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full resize-y border border-[#444] bg-[#1b1b1b] px-3 py-2 text-sm leading-6 text-white outline-none transition focus:border-[#ebc729]"
        placeholder={placeholder}
      />

      <div
        className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#858585]"
        aria-live="polite"
      >
        <span>
          Sentences: <strong className="text-[#ccc]">{sentences}</strong>
          {minimumSentences > 0 ? <> / {minimumSentences} minimum</> : null}
        </span>

        <span>
          Words: <strong className="text-[#ccc]">{words}</strong>
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
          Characters: <strong>{characters.toLocaleString()}</strong> /{" "}
          {HARD_CHARACTER_LIMIT.toLocaleString()}
        </span>
      </div>

      {softLimitExceeded ? (
        <p
          className={
            hardLimitExceeded
              ? "mt-2 text-xs text-red-400"
              : "mt-2 text-xs text-yellow-400"
          }
        >
          {hardLimitExceeded
            ? `Hard limit exceeded: shorten the narrative to ${HARD_CHARACTER_LIMIT.toLocaleString()} characters or fewer before generating.`
            : `Soft warning: over ${SOFT_CHARACTER_LIMIT.toLocaleString()} characters. You can still generate the recommendation.`}
        </p>
      ) : null}
    </section>
  );
}
