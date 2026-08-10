import Link from "next/link";

import Logo from "../theme/adrLogo";

import MedalRecommendationClient from "./MedalRecommendationClient";

import GetMedalEligibleRoster from "./lib/get-medal-eligible-roster";

import {
  adaptMedalRoster,
} from "./lib/roster-adapter";

import "../adr/page.css";
import "../globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Medal Recommendation Aid",
};

export default async function MedalRecommendationPage() {
  const medalRoster =
    await GetMedalEligibleRoster();

  const profiles =
    medalRoster?.profiles ?? {};

  const roster =
    adaptMedalRoster(profiles);

  const meta =
    medalRoster?.meta ?? {};

  const rosterSummary = {
    combatCount:
      meta.combatCount ?? 0,

    reserveCount:
      meta.reserveCount ?? 0,

    eloaCount:
      meta.eloaCount ?? 0,

    retiredCount:
      meta.retiredCount ?? 0,

    totalCount:
      meta.eligibleCount ??
      Object.keys(profiles).length,
  };

  return (
    <div className="MasterContainer">
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold">
          Medal Recommendation Aid
        </h1>

        <MedalRecommendationClient
          rosterSummary={rosterSummary}
          roster={roster}
        />
      </div>
    </div>
  );
}