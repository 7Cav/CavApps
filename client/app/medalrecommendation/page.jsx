import Link from "next/link";
import Image from "next/image";
import { MEDAL_FAMILY_LIST } from "./lib/medal-families";
import { oswald } from "./lib/fonts";
import { LANDING_LINK_CLASS_NAME } from "./lib/navigation-styles";

export const metadata = {
  title: "Medal Recommendation Aid",
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
          ({ route, landingTitle, landingDescription, artwork }) => {
            return (
              <Link
                key={route}
                href={route}
                aria-label={landingTitle}
                className={`${LANDING_LINK_CLASS_NAME} grid min-h-72 cursor-pointer grid-cols-[42%_minmax(0,1fr)] items-center py-6 pr-4 !text-foreground sm:min-h-[25rem] sm:pr-8`}
              >
                <div
                  className="flex min-w-0 items-center justify-center"
                  aria-hidden="true"
                >
                  <Image
                    src={artwork.src}
                    alt=""
                    width={artwork.width}
                    height={artwork.height}
                    sizes={artwork.sizes}
                    quality={90}
                    style={{
                      aspectRatio: `${artwork.width} / ${artwork.height}`,
                    }}
                    className={`${artwork.className} h-auto object-contain`}
                  />
                </div>
                <div className="min-w-0 py-2">
                  <h2
                    className={`${oswald.className} max-w-min text-4xl leading-[1.05] font-bold sm:text-5xl xl:text-6xl`}
                  >
                    {landingTitle}
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
          className={`${LANDING_LINK_CLASS_NAME} flex h-[54px] w-full items-center justify-center px-4 text-center text-base font-medium !text-muted-foreground hover:!text-foreground sm:text-xl lg:col-span-2`}
        >
          How to Use This Tool
        </Link>
      </nav>
    </main>
  );
}
