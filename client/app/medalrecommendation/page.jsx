import Link from "next/link";

import CavColor from "../theme/cavColor";

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
                <div className="p-nav-logo" style={{ maxWidth: "none" }}>
                  <Link
                    href="/"
                    title="Return to CavApps"
                    className="flex items-center gap-2"
                  >
                    <CavColor width="2.7em" height="2.7em" aria-hidden="true" />

                    <span className="flex flex-col leading-[1.05] text-white">
                      <span className="whitespace-nowrap text-[0.88rem] font-bold tracking-[0.05em]">
                        7TH CAVALRY GAMING
                      </span>
                      <span className="mt-[1px] whitespace-nowrap text-[0.67rem] font-medium tracking-[0.01em]">
                        Medal Recommendation Aid
                      </span>
                    </span>
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
