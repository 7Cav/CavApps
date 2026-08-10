import Link from "next/link";

import Logo from "../theme/adrLogo";

import MedalRecommendationClient from "./MedalRecommendationClient";
import GetMedalEligibleRoster from "./lib/get-medal-eligible-roster";
import { adaptMedalRoster } from "./lib/roster-adapter";

import "../adr/page.css";
import "../globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Medal Recommendation Aid",
};

export default async function MedalRecommendationPage() {
  const medalRoster = await GetMedalEligibleRoster();
  const profiles = medalRoster?.profiles ?? {};
  const roster = adaptMedalRoster(profiles);

  return (
    <div className="MasterContainer min-h-screen bg-[#0f0f0f]">
      <div className="p-nav-primary">
        <div className="p-nav-wrapper">
          <nav className="p-nav">
            <div className="p-nav-inner">
              <div className="p-nav-scroller">
                <div className="p-nav-logo">
                  <Link href="/">
                    <Logo
                      alt="ADR Logo"
                      title="Return to CavApps"
                      width="17em"
                      height="3em"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <MedalRecommendationClient roster={roster} />
      </main>
    </div>
  );
}
