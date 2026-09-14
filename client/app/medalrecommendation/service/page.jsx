import { renderMedalRecommendationWorksheetPage } from "../MedalRecommendationWorksheetPage";
import { MEDAL_FAMILY_IDS } from "../lib/medal-families";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Service Medal Recommendation Aid",
};

export default async function ServiceMedalRecommendationPage() {
  return renderMedalRecommendationWorksheetPage(MEDAL_FAMILY_IDS.SERVICE);
}
