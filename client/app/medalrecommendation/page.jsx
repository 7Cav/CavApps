import Link from "next/link";
import { Oswald } from "next/font/google";
import { MEDAL_FAMILY_LIST } from "./lib/medal-families";

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata = {
  title: "Medal Recommendation Aid",
};

const MEDAL_ARTWORK = {
  operation: {
    src: "bronze-star.png",
    width: 1254,
    height: 1254,
    className: "w-full",
  },
  service: {
    src: "distinguished-service-medal.png",
    width: 1132,
    height: 1390,
    className: "w-4/5",
  },
};

export default function MedalRecommendationPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-[90rem] px-4 py-12 sm:px-6 sm:py-16">
      <header className="text-center">
        <h1
          className={`${oswald.className} text-4xl font-semibold tracking-tight text-primary sm:text-5xl xl:text-6xl`}
        >
          Medal Recommendation Aid
        </h1>

        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Making Medal Recommendations Easier
        </p>
      </header>

      <nav
        aria-label="Medal worksheet families"
        className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6"
      >
        {MEDAL_FAMILY_LIST.map(
          ({ id, route, landingTitle, landingDescription }) => {
            const artwork = MEDAL_ARTWORK[id];
            return (
              <Link
                key={route}
                href={route}
                aria-label={landingTitle}
                className="grid min-h-72 cursor-pointer grid-cols-[42%_minmax(0,1fr)] items-center rounded-xl border border-border/70 border-l-4 border-l-primary bg-card/70 py-6 pr-4 !text-foreground transition-[border-color,box-shadow,scale] duration-150 ease-out hover:border-primary/50 hover:border-l-primary hover:!no-underline hover:shadow-[0_0_24px_-8px_rgba(249,204,23,0.45)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background active:scale-[0.99] motion-reduce:active:scale-100 motion-reduce:transition-none sm:min-h-[25rem] sm:pr-8"
              >
                <div
                  className="flex min-w-0 items-center justify-center"
                  aria-hidden="true"
                >
                  <img
                    src={`/medalrecommendation/${artwork.src}`}
                    alt=""
                    width={artwork.width}
                    height={artwork.height}
                    className={`${artwork.className} h-auto object-contain`}
                  />
                </div>
                <div className="min-w-0 py-2">
                  <h2
                    className={`${oswald.className} text-4xl leading-[1.05] font-bold sm:text-5xl xl:text-6xl`}
                  >
                    {landingTitle.split(" ")[0]} <br />
                    Medals
                  </h2>
                  <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:mt-10 sm:text-xl">
                    {landingDescription}
                  </p>
                </div>
              </Link>
            );
          },
        )}
        <Link
          href="/medalrecommendation/how-to-use"
          className="flex h-[54px] w-full items-center justify-center rounded-xl border border-border/70 border-l-4 border-l-primary bg-card/70 px-4 text-center text-base font-medium !text-muted-foreground transition-[border-color,box-shadow,scale] duration-150 ease-out hover:border-primary/50 hover:border-l-primary hover:!text-foreground hover:!no-underline hover:shadow-[0_0_24px_-8px_rgba(249,204,23,0.45)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background active:scale-[0.99] motion-reduce:active:scale-100 motion-reduce:transition-none sm:text-xl lg:col-span-2"
        >
          How to Use This Tool
        </Link>
      </nav>
    </main>
  );
}
