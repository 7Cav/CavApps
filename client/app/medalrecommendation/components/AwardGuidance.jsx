export default function AwardGuidance({ award }) {
  if (!award) {
    return null;
  }

  return (
    <details className="border border-[#353535] bg-[#141414]">
      <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-[#d8d8d8] transition hover:text-[#ebc729]">
        Award Criteria & Guidance
      </summary>

      <div className="grid gap-4 border-t border-[#303030] p-4 text-sm leading-6 lg:grid-cols-3">
        <div>
          <h3 className="font-semibold text-[#ebc729]">Criteria</h3>
          <p className="mt-1 text-[#bcbcbc]">{award.criteria}</p>
        </div>

        <div>
          <h3 className="font-semibold text-[#ebc729]">
            Citation Guidance
          </h3>
          <p className="mt-1 text-[#bcbcbc]">{award.guidance}</p>
        </div>

        <div>
          <h3 className="font-semibold text-[#ebc729]">
            Eligibility / Evidence
          </h3>
          <p className="mt-1 text-[#bcbcbc]">
            {award.eligibility || "No additional automated note."}
          </p>
          <p className="mt-3 text-xs text-[#777]">
            Minimum narrative sentences: {award.minimumSentences ?? 0}
          </p>
        </div>
      </div>
    </details>
  );
}
