import GetCombatRoster from "../reusableModules/getCombatRoster";
import MedalRecommendationClient from "./MedalRecommendationClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Medal Recommendation Aid",
};

export default async function MedalRecommendationPage() {
  const rosterResponse = await GetCombatRoster();

  const profiles = Object.values(rosterResponse?.profiles ?? {});

  const combatRoster = profiles.map((profile) => ({
    user: {
      userId: profile.user?.userId ?? "",
      username: profile.user?.username ?? "",
    },
    rank: {
      rankShort: profile.rank?.rankShort ?? "",
      rankFull: profile.rank?.rankFull ?? "",
    },
    realName: profile.realName ?? "",
  }));

  return <MedalRecommendationClient combatRoster={combatRoster} />;
}
