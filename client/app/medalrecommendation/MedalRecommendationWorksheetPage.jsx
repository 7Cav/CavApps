import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import GetMedalRecipientRoster from "../reusableModules/getMedalRecipientRoster";
import GetRosterGroups from "../reusableModules/getGroups";
import MedalRecommendationClient from "./MedalRecommendationClient";
import { getMedalFamily } from "./lib/medal-families";

export async function renderMedalRecommendationWorksheetPage(medalFamily) {
  const family = getMedalFamily(medalFamily);
  let rosterResponse;
  const rosterPromise = GetMedalRecipientRoster();
  // Organization metadata is optional; its failure must not block the roster.
  const groupsPromise = GetRosterGroups().catch((error) => {
    console.error("Medal recipient organization fetch failed:", error.message);
    return null;
  });

  try {
    rosterResponse = await rosterPromise;
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
                href={family.route}
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
      rankId: profile.rank?.rankId,
      rankShort: profile.rank?.rankShort ?? "",
      rankFull: profile.rank?.rankFull ?? "",
    },
    realName: profile.realName ?? "",
    roster: profile.roster ?? "",
    primary: {
      positionId: profile.primary?.positionId ?? "",
      positionTitle: profile.primary?.positionTitle ?? "",
    },
    secondaries: Object.values(profile.secondaries ?? {}).map((position) => ({
      positionId: position.positionId ?? "",
      positionTitle: position.positionTitle ?? "",
    })),
  }));

  const groupsResponse = await groupsPromise;

  return (
    <MedalRecommendationClient
      recipientRoster={medalRecipientRoster}
      rosterGroups={Object.values(groupsResponse?.groups ?? {})}
      medalFamily={family.id}
    />
  );
}
