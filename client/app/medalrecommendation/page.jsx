import GetMedalRecipientRoster from "../reusableModules/getMedalRecipientRoster";
import MedalRecommendationClient from "./MedalRecommendationClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Medal Recommendation Aid",
};

export default async function MedalRecommendationPage() {
  const rosterResponse = await GetMedalRecipientRoster();

  const profiles = Object.values(rosterResponse?.profiles ?? {});

  const medalRecipientRoster = profiles.map((profile) => ({
    user: {
      userId: profile.user?.userId ?? "",
      username: profile.user?.username ?? "",
    },
    rank: {
      rankShort: profile.rank?.rankShort ?? "",
      rankFull: profile.rank?.rankFull ?? "",
    },
    realName: profile.realName ?? "",
    roster: profile.roster ?? "",
    primary: {
      positionTitle: profile.primary?.positionTitle ?? "",
    },
  }));

  return <MedalRecommendationClient recipientRoster={medalRecipientRoster} />;
}
