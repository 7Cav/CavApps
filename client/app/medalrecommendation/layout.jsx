import Link from "next/link";
import Logo from "../theme/adrLogo";

export default function MedalRecommendationLayout({ children }) {
  return (
    <>
      <header
        aria-label="CavApps"
        className="sticky top-0 z-40 mb-[1.2em] flex justify-center bg-[#2e2e2e]"
      >
        <Link
          href="/"
          aria-label="7th Cavalry Gaming — Medal Recommendation Aid. Return to CavApps"
          className="block max-w-[220px] self-center rounded-sm p-[3px] leading-[21px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Logo
            variant="medalRecommendation"
            aria-hidden="true"
            width="17em"
            height="3em"
          />
        </Link>
      </header>
      {children}
    </>
  );
}
