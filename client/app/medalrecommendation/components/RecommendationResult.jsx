"use client";

import { useState } from "react";

const MEDAL_TICKET_URL =
  "https://7cav.us/tickets/categories/18/create";

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  document.execCommand("copy");

  textarea.remove();
}

function CopySection({
  label,
  value,
  multiline = false,
  disabled = false,
}) {
  const [copied, setCopied] =
    useState(false);

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
      console.error(
        "Unable to copy text:",
        error,
      );
    }
  }

  return (
    <div className="mt-6">
      <h3 className="font-semibold">
        {label}
      </h3>

      <div className="mt-2 flex items-start gap-3">
        {multiline ? (
          <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap border border-[#444] bg-[#151515] p-3 text-sm">
            {value}
          </pre>
        ) : (
          <div className="min-w-0 flex-1 break-words border border-[#444] bg-[#151515] p-3">
            {value}
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          className="shrink-0 border border-[#ebc729] px-4 py-3 font-semibold text-[#ebc729] disabled:cursor-not-allowed disabled:border-[#444] disabled:text-[#666]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function RecommendationResult({
  result,
  stale = false,
}) {
  if (!result) {
    return null;
  }

  const failedChecks =
    result.checks?.filter(
      (check) =>
        check.status === "FAIL",
    ) ?? [];

  return (
    <div className="mt-8 border border-[#444] p-5">
      {stale ? (
        <div className="mb-5 border border-yellow-700 bg-yellow-950/30 p-4 text-yellow-200">
          <div className="font-semibold">
            Worksheet changed — generate
            again
          </div>

          <p className="mt-1 text-sm">
            The preview below may no
            longer match the current
            worksheet. Copy and ticket
            actions are disabled until
            you generate again.
          </p>
        </div>
      ) : null}

      <div
        className={
          result.ready
            ? "border border-green-700 bg-green-950/30 p-3 font-semibold text-green-300"
            : "border border-red-700 bg-red-950/30 p-3 font-semibold text-red-300"
        }
      >
        {result.statusText}
      </div>

      {result.warnings?.length ? (
        <div className="mt-5">
          <h3 className="font-semibold text-yellow-300">
            Warnings
          </h3>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#ddd]">
            {result.warnings.map(
              (warning, index) => (
                <li key={index}>
                  {warning}
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="font-semibold">
          Validation Checks
        </h3>

        {failedChecks.length ? (
          <div className="mt-3 grid gap-2">
            {failedChecks.map(
              (check, index) => (
                <div
                  key={`${check.label}-${index}`}
                  className="border border-red-900/70 p-3 text-sm"
                >
                  <div className="font-semibold text-red-400">
                    {check.label}
                  </div>

                  {check.message ? (
                    <div className="mt-1 text-[#aaa]">
                      {check.message}
                    </div>
                  ) : null}
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-green-400">
            All automated validation
            checks passed.
          </p>
        )}

        <p className="mt-3 text-sm text-[#999]">
          Approx. sentences:{" "}
          {result.sentenceCount ?? 0} |
          Approx. words:{" "}
          {result.wordCount ?? 0}
        </p>
      </div>

      {result.ready ? (
        <>
          <div
            className={`group relative mt-8 border border-[#555] p-5 transition-colors ${
              stale
                ? "opacity-70"
                : "hover:border-red-700 hover:bg-red-950/20 focus-within:border-red-700 focus-within:bg-red-950/20"
            }`}
          >
            {!stale ? (
              <div className="mb-4 hidden border border-red-800 bg-red-950/70 p-2 text-center text-sm font-semibold text-red-200 group-hover:block group-focus-within:block">
                Do not copy from this
                preview. Use the Copy
                buttons below.
              </div>
            ) : null}

            <div className="text-center">
              <h3 className="text-lg font-bold text-white">
                {result.award?.name}
              </h3>

              {result.award?.imageUrl ? (
                <img
                  src={
                    result.award.imageUrl
                  }
                  alt={`${result.award.name} ribbon`}
                  className="mx-auto mt-4 max-h-24 max-w-full"
                  referrerPolicy="no-referrer"
                />
              ) : null}

              <div className="mt-4 whitespace-pre-line font-semibold text-[#ebc729]">
                {result.recipientNames?.join(
                  "\n",
                )}
              </div>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-left leading-7 text-[#ddd]">
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

          <div className="mt-7">
            <a
              href={
                stale
                  ? undefined
                  : MEDAL_TICKET_URL
              }
              target={
                stale
                  ? undefined
                  : "_blank"
              }
              rel={
                stale
                  ? undefined
                  : "noopener noreferrer"
              }
              aria-disabled={stale}
              className={
                stale
                  ? "inline-block cursor-not-allowed border border-[#444] px-5 py-3 font-semibold text-[#666]"
                  : "inline-block border border-[#ebc729] px-5 py-3 font-semibold text-[#ebc729]"
              }
            >
              Open Medal Recommendation
              Ticket
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}