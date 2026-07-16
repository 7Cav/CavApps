const CLIENT_TOKEN = process.env.NEXT_PUBLIC_CLIENT_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_USERCACHE_API_URL;

export default async function searchForUser(query) {
  if (!BASE_URL)
    throw new Error("NEXT_PUBLIC_USERCACHE_API_URL is not configured");
  if (!CLIENT_TOKEN)
    throw new Error("NEXT_PUBLIC_CLIENT_TOKEN is not configured");

  const url = new URL(BASE_URL);

  url.searchParams.append("q", query);
  const fullIndividualApiUrl = url.toString();

  const response = await fetch(fullIndividualApiUrl, {
    headers: {
      Authorization: CLIENT_TOKEN,
    },
    cache: "no-store",
  });

  // A search that matches no users is not an error — return no suggestions.
  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`User search failed: ${response.status}`);
  }

  try {
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error("User search returned non-array payload", data);
      return [];
    }
    return data;
  } catch (error) {
    throw new Error(`Invalid JSON response: ${error.message}`);
  }
}
