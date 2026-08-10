"use client";

export default function RecommendationResult({
  result,
}) {
  if (!result) {
    return null;
  }

  return (
    <div className="mt-8 border border-[#444] p-5">
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

        <div className="mt-3 grid gap-2">
          {result.checks?.map(
            (check, index) => (
              <div
                key={`${check.label}-${index}`}
                className="flex gap-3 border border-[#333] p-3 text-sm"
              >
                <span
                  className={
                    check.status === "PASS"
                      ? "font-semibold text-green-400"
                      : "font-semibold text-red-400"
                  }
                >
                  {check.status}
                </span>

                <div>
                  <div className="font-medium">
                    {check.label}
                  </div>

                  {check.status === "FAIL" &&
                  check.message ? (
                    <div className="mt-1 text-[#aaa]">
                      {check.message}
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          )}
        </div>

        <p className="mt-3 text-sm text-[#999]">
          Approx. sentences:{" "}
          {result.sentenceCount ?? 0} | Approx.
          words: {result.wordCount ?? 0}
        </p>
      </div>

      {result.ready ? (
        <>
          <div className="mt-8 border border-[#555] p-5">
            <h3 className="text-lg font-semibold text-[#ebc729]">
              {result.award?.name}
            </h3>

            <div className="mt-4 whitespace-pre-line font-semibold">
              {result.recipientNames?.join("\n")}
            </div>

            <p className="mt-5 whitespace-pre-wrap leading-7 text-[#ddd]">
              {result.citation}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">
              Ticket Title
            </h3>

            <div className="mt-2 border border-[#444] bg-[#151515] p-3">
              {result.ticketTitle}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">
              Forum BBCode
            </h3>

            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap border border-[#444] bg-[#151515] p-3 text-sm">
              {result.bbcode}
            </pre>
          </div>
        </>
      ) : null}
    </div>
  );
}