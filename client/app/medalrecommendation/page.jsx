import Link from "next/link";

export const metadata = {
  title: "Medal Recommendation Aid",
};

const WORKSHEET_FAMILIES = [
  {
    href: "/medalrecommendation/operation",
    title: "Operation Medals",
    description:
      "Create recommendations recognizing actions performed during operations.",
  },
  {
    href: "/medalrecommendation/service",
    title: "Service Medals",
    description:
      "Create recommendations recognizing service and contributions to the Regiment.",
  },
];

export default function MedalRecommendationPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-[64rem] px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Medal Recommendation Aid
        </h1>

        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Create and review a medal recommendation.
        </p>
      </header>

      <nav
        aria-label="Medal worksheet families"
        className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
      >
        {WORKSHEET_FAMILIES.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-40 flex-col rounded-xl border border-border/70 border-l-[3px] border-l-primary/70 bg-card/70 p-6 !text-foreground transition-[background-color,border-color,transform] duration-150 ease-out hover:border-primary/50 hover:border-l-primary hover:bg-card hover:!no-underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-4 focus-visible:ring-offset-background active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none sm:p-7"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>

              <span
                aria-hidden="true"
                className="text-lg text-primary/70 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none motion-reduce:transition-none"
              >
                →
              </span>
            </div>

            <p className="mt-4 max-w-md leading-7 text-muted-foreground">
              {description}
            </p>
          </Link>
        ))}
      </nav>
    </main>
  );
}
