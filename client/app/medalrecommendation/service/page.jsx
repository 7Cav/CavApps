import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import GetMedalRecipientRoster from "../../reusableModules/getMedalRecipientRoster";
import MedalRecommendationClient from "../MedalRecommendationClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Service Medal Recommendation Aid",
};

export default async function ServiceMedalRecommendationPage() {
  let rosterResponse;

  try {
    rosterResponse = await GetMedalRecipientRoster();
  } catch (error) {
    console.error("Medal recipient roster fetch failed:", error.message);
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              Unable to load Medal Recommendation Aid
            </h2>
          </CardHeader>

          <CardContent className="space-y-4">
            <p>
              The medal recipient roster could not be loaded. Please try again.
            </p>

            <Button asChild>
              <a
                href="/medalrecommendation/service"
                className="!text-primary-foreground hover:!text-primary-foreground"
              >
                Try Again
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

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

  return (
    <MedalRecommendationClient
      recipientRoster={medalRecipientRoster}
      medalFamily="service"
    />
  );
}
