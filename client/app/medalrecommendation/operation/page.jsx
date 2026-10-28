import { renderMedalRecommendationWorksheetPage } from "../MedalRecommendationWorksheetPage";
import { MEDAL_FAMILY_IDS } from "../lib/medal-families";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Medal Recommendation Aid",
};

export default async function OperationMedalRecommendationPage() {
  return renderMedalRecommendationWorksheetPage(MEDAL_FAMILY_IDS.OPERATION);
}
