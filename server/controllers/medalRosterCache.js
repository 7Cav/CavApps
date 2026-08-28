const axios = require("axios");

const cacheManager = require("./cacheManager");

const API_TOKEN = process.env.API_TOKEN;

const SUPPLEMENTAL_CACHE_TTL_MS = 60 * 60 * 1000;

let supplementalCache = null;
let supplementalCacheTime = 0;
let refreshPromise = null;

function getApiHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: "Bearer " + API_TOKEN,
    "Accept-Encoding": "gzip",
  };
}

function supplementalCacheIsFresh() {
  if (!supplementalCache) {
    return false;
  }

  return Date.now() - supplementalCacheTime < SUPPLEMENTAL_CACHE_TTL_MS;
}

async function fetchSupplementalRosters() {
  const headers = getApiHeaders();

  const [eloaResponse, pastMembersResponse] = await Promise.all([
    axios.get("https://api.7cav.us/api/v1/roster/3/lite", {
      headers,
    }),

    axios.get("https://api.7cav.us/api/v1/roster/6/lite", {
      headers,
    }),
  ]);

  const eloaProfiles = eloaResponse.data?.profiles ?? {};

  const pastMemberProfiles = pastMembersResponse.data?.profiles ?? {};

  const retiredProfiles = Object.fromEntries(
    Object.entries(pastMemberProfiles).filter(([, profile]) => {
      const positionTitle = profile?.primary?.positionTitle ?? "";

      return positionTitle.trim().toUpperCase() === "RETIRED";
    }),
  );

  return {
    eloaProfiles,
    retiredProfiles,
    fetchedAt: new Date().toISOString(),
  };
}

async function getSupplementalRosters() {
  if (supplementalCacheIsFresh()) {
    return supplementalCache;
  }

  // If two requests arrive while the cache is
  // refreshing, make them share the same request.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetchSupplementalRosters()
    .then((result) => {
      supplementalCache = result;
      supplementalCacheTime = Date.now();

      console.log(
        `Medal supplemental roster cache updated: ` +
          `${Object.keys(result.eloaProfiles).length} ELOA, ` +
          `${Object.keys(result.retiredProfiles).length} retired`,
      );

      return supplementalCache;
    })
    .catch((error) => {
      // If a refresh fails but an older cache exists,
      // keep serving the older Medal-specific data.
      if (supplementalCache) {
        console.warn(
          "Failed to refresh Medal supplemental roster cache; using stale cache:",
          error.message,
        );

        return supplementalCache;
      }

      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function getMedalEligibleRoster() {
  // Reuse S6's existing Combat and Reserve caches.
  // We do not modify or replace cacheManager.js.
  const combatRoster = cacheManager.getCachedCombatRoster();

  const reserveRoster = cacheManager.getCachedReserveRoster();

  if (!combatRoster?.profiles || !reserveRoster?.profiles) {
    throw new Error(
      "Core CavApps Combat or Reserve roster cache is unavailable",
    );
  }

  const supplemental = await getSupplementalRosters();

  const combatProfiles = combatRoster.profiles ?? {};

  const reserveProfiles = reserveRoster.profiles ?? {};

  const eloaProfiles = supplemental.eloaProfiles ?? {};

  const retiredProfiles = supplemental.retiredProfiles ?? {};

  const profiles = {
    ...combatProfiles,
    ...reserveProfiles,
    ...eloaProfiles,
    ...retiredProfiles,
  };

  return {
    profiles,

    meta: {
      combatCount: Object.keys(combatProfiles).length,

      reserveCount: Object.keys(reserveProfiles).length,

      eloaCount: Object.keys(eloaProfiles).length,

      retiredCount: Object.keys(retiredProfiles).length,

      eligibleCount: Object.keys(profiles).length,

      supplementalFetchedAt: supplemental.fetchedAt,
    },
  };
}

module.exports = {
  getMedalEligibleRoster,
};
