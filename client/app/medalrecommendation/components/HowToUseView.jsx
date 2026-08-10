"use client";

const GUIDE_STEPS = [
  {
    number: "1",
    title: "Choose a worksheet",
    text: "Start with Operation Medals for combat-operation recommendations or Service Medals for service and contribution awards.",
  },
  {
    number: "2",
    title: "Select the award",
    text: "Choose the medal or unit award first. The worksheet will show only the fields required for that award.",
  },
  {
    number: "3",
    title: "Add the recipient(s)",
    text: "Begin typing a rank or roster name and select the correct member. Add additional recipients when the award allows it.",
  },
  {
    number: "4",
    title: "Complete the narrative",
    text: "Follow the narrative helper closely. Some Service Medal narratives continue a sentence starter that the app inserts automatically.",
  },
  {
    number: "5",
    title: "Generate and review",
    text: "Generate the recommendation and review every validation message, warning, recipient name, and the completed citation before submitting.",
  },
  {
    number: "6",
    title: "Copy the submission text",
    text: "Use the Copy buttons for the ticket title and forum BBCode, then open the Medal Recommendation ticket from the generated result panel.",
  },
];

export default function HowToUseView({
  onBack,
  onOpenOperation,
  onOpenService,
}) {
  return (
    <section className="py-4">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 text-sm font-semibold text-[#aaa] transition hover:text-[#ebc729]"
          >
            ← Back to Home
          </button>

          <h1 className="text-3xl font-semibold text-[#e7e7e7]">
            How To Use
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9f9f9f]">
            The aid checks formatting and builds the required citation and submission text. You are still responsible for the accuracy, quality, and merit of the recommendation.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GUIDE_STEPS.map((step) => (
          <article
            key={step.number}
            className="border border-[#363636] bg-[#151515] p-5"
          >
            <div className="mb-4 flex h-9 w-9 items-center justify-center border border-[#ebc729] font-bold text-[#ebc729]">
              {step.number}
            </div>

            <h2 className="text-lg font-semibold text-[#e5e5e5]">
              {step.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#a8a8a8]">
              {step.text}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onOpenOperation}
          className="border border-[#555] bg-[#202020] px-5 py-4 font-semibold text-[#ddd] transition hover:border-[#ebc729] hover:text-[#ebc729]"
        >
          Open Operation Medals
        </button>

        <button
          type="button"
          onClick={onOpenService}
          className="border border-[#555] bg-[#202020] px-5 py-4 font-semibold text-[#ddd] transition hover:border-[#ebc729] hover:text-[#ebc729]"
        >
          Open Service Medals
        </button>
      </div>
    </section>
  );
}
