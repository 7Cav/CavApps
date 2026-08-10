"use client";

function MedalChoiceButton({
  title,
  imageSrc,
  imageAlt,
  imageClassName,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-[32rem] w-full flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#4a4a4a] bg-[#2a2a2a] px-8 py-10 text-center transition hover:border-[#ebc729] hover:bg-[#313131] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ebc729] md:h-[34rem]"
    >
      <span className="text-[2.25rem] font-bold tracking-wide text-white transition group-hover:text-[#ebc729] md:text-[2.6rem]">
        {title}
      </span>

      <div className="flex h-[20rem] w-full items-center justify-center overflow-hidden md:h-[22rem]">
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`block max-h-full max-w-full object-contain ${imageClassName}`}
          draggable="false"
        />
      </div>

      <span className="text-[2.25rem] font-bold tracking-wide text-white transition group-hover:text-[#ebc729] md:text-[2.6rem]">
        Medals
      </span>
    </button>
  );
}

export default function MedalLanding({
  onOpenOperation,
  onOpenService,
  onOpenGuide,
}) {
  return (
    <section className="flex min-h-[calc(100vh-120px)] items-center justify-center py-8 md:py-10">
      <div className="w-full">
        <div className="mb-8 text-center md:mb-10">
          <h1 className="text-4xl font-bold text-[#e7e7e7] sm:text-5xl">
            Medal Recommendation Aid
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-[#9f9f9f] sm:text-base md:text-lg">
            Choose the type of recommendation you want to prepare.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[66rem]">
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <MedalChoiceButton
              title="Operation"
              imageSrc="/assets/medal-recommendation/operation-button.png"
              imageAlt="Operation medals silhouette"
              imageClassName="w-[96%]"
              onClick={onOpenOperation}
            />

            <MedalChoiceButton
              title="Service"
              imageSrc="/assets/medal-recommendation/service-button.png"
              imageAlt="Service medals silhouette"
              imageClassName="w-[88%]"
              onClick={onOpenService}
            />
          </div>

          <button
            type="button"
            onClick={onOpenGuide}
            className="mt-6 w-full rounded-xl border border-[#4a4a4a] bg-[#1f1f1f] px-8 py-6 text-xl font-semibold text-white transition hover:border-[#ebc729] hover:bg-[#262626] hover:text-[#ebc729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ebc729] md:mt-8 md:py-7 md:text-2xl"
          >
            How To Use
          </button>
        </div>
      </div>
    </section>
  );
}
