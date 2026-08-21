"use client";

import { useState } from "react";

const MEDAL_TICKET_URL = "https://7cav.us/tickets/categories/18/create";

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function CopySection({ label, value, multiline = false, disabled = false }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (disabled || !value) {
      return;
    }

    try {
      await copyText(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Unable to copy text:", error);
    }
  }

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#d8d8d8]">{label}</h3>

        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          className="border border-[#666] px-3 py-1.5 text-xs font-semibold text-[#ccc] transition hover:border-[#ebc729] hover:text-[#ebc729] disabled:cursor-not-allowed disabled:border-[#444] disabled:text-[#666]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {multiline ? (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap border border-[#3b3b3b] bg-[#101010] p-3 text-xs leading-5 text-[#c8c8c8]">
          {value}
        </pre>
      ) : (
        <div className="break-words border border-[#3b3b3b] bg-[#101010] p-3 text-sm text-[#d0d0d0]">
          {value}
        </div>
      )}
    </div>
  );
}

export default function RecommendationResult({ result, stale = false }) {
  if (!result) {
    return (
      <section className="border border-[#353535] bg-[#141414] p-5">
        <h2 className="text-lg font-semibold text-[#e2e2e2]">
          Recommendation Preview
        </h2>

        <div className="mt-4 flex min-h-72 items-center justify-center border border-dashed border-[#3d3d3d] bg-[#111] p-8 text-center">
          <div className="max-w-sm">
            <p className="font-semibold text-[#888]">Nothing generated yet</p>
            <p className="mt-2 text-sm leading-6 text-[#666]">
              Complete the worksheet and select Generate Recommendation. The
              citation, validation results, ticket title, and BBCode will appear
              here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const failedChecks =
    result.checks?.filter((check) => check.status === "FAIL") ?? [];

  return (
    <section className="border border-[#353535] bg-[#141414] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#e2e2e2]">
          Recommendation Preview
        </h2>

        <div
          className={
            result.ready
              ? "border border-green-800 bg-green-950/30 px-3 py-1.5 text-xs font-semibold text-green-300"
              : "border border-red-800 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300"
          }
        >
          {result.statusText}
        </div>
      </div>

      {stale ? (
        <div className="mt-4 border border-yellow-700 bg-yellow-950/30 p-3 text-yellow-200">
          <div className="text-sm font-semibold">
            Worksheet changed — generate again
          </div>
          <p className="mt-1 text-xs leading-5">
            The preview below may no longer match the worksheet. Copy and ticket
            actions are disabled until you generate again.
          </p>
        </div>
      ) : null}

      {result.warnings?.length ? (
        <div className="mt-4 border border-yellow-900/70 bg-yellow-950/10 p-3">
          <h3 className="text-sm font-semibold text-yellow-300">Warnings</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-[#d0d0d0]">
            {result.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {failedChecks.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-[#ddd]">Validation</h3>
          <div className="mt-2 grid gap-2">
            {failedChecks.map((check, index) => (
              <div
                key={`${check.label}-${index}`}
                className="border border-red-900/70 bg-red-950/10 p-3 text-xs"
              >
                <div className="font-semibold text-red-400">{check.label}</div>
                {check.message ? (
                  <div className="mt-1 leading-5 text-[#aaa]">
                    {check.message}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-green-400">
          All automated validation checks passed.
        </p>
      )}

      <p className="mt-2 text-xs text-[#777]">
        Approx. sentences: {result.sentenceCount ?? 0} | Approx. words:{" "}
        {result.wordCount ?? 0}
      </p>

      {result.ready ? (
        <>
          <div
            className={`group relative mt-5 border border-[#4a4a4a] bg-[#111] p-5 transition-colors ${
              stale
                ? "opacity-70"
                : "hover:border-red-700 hover:bg-red-950/10 focus-within:border-red-700 focus-within:bg-red-950/10"
            }`}
          >
            {!stale ? (
              <div className="mb-4 hidden border border-red-800 bg-red-950/70 p-2 text-center text-xs font-semibold text-red-200 group-hover:block group-focus-within:block">
                Do not copy from this preview. Use the Copy buttons below.
              </div>
            ) : null}

            <div className="text-center">
              <h3 className="text-lg font-bold text-white">
                {result.award?.name}
              </h3>

              {result.award?.imageUrl ? (
                <img
                  src={result.award.imageUrl}
                  alt={`${result.award.name} ribbon`}
                  className="mx-auto mt-4 max-h-24 max-w-full"
                  referrerPolicy="no-referrer"
                />
              ) : null}

              <div className="mt-4 whitespace-pre-line font-semibold text-[#ebc729]">
                {result.recipientNames?.join("\n")}
              </div>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-left text-sm leading-7 text-[#d5d5d5]">
              {result.citation}
            </p>
          </div>

          <CopySection
            label="Ticket Title"
            value={result.ticketTitle}
            disabled={stale}
          />

          <CopySection
            label="Forum BBCode"
            value={result.bbcode}
            multiline
            disabled={stale}
          />

          <div className="mt-5">
            {stale ? (
              <span className="block cursor-not-allowed border border-[#444] px-5 py-3 text-center text-sm font-semibold text-[#666]">
                Open Medal Recommendation Ticket
              </span>
            ) : (
              <a
                href={MEDAL_TICKET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-[#ebc729] px-5 py-3 text-center text-sm font-semibold text-[#ebc729] transition hover:bg-[#ebc729] hover:text-black"
              >
                Open Medal Recommendation Ticket
              </a>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
