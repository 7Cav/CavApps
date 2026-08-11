const CLIENT_TOKEN = process.env.NEXT_PUBLIC_CLIENT_TOKEN;

const COMBAT_API_URL = process.env.COMBAT_API_URL;

function getMedalEligibleApiUrl() {
  if (process.env.MEDAL_ELIGIBLE_API_URL) {
    return process.env.MEDAL_ELIGIBLE_API_URL;
  }

  if (!COMBAT_API_URL) {
    throw new Error("COMBAT_API_URL is not configured");
  }

  return COMBAT_API_URL.replace(/\/combat\/?$/, "/medal-eligible");
}

export default async function GetMedalEligibleRoster() {
  const response = await fetch(getMedalEligibleApiUrl(), {
    headers: {
      Authorization: CLIENT_TOKEN,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("HTTP Error! status: " + response.status);
  }

  return await response.json();
}
