const axios = require("axios");
const axiosRetry = require("axios-retry").default || require("axios-retry");
const { filterRetiredRoster } = require("./rosterFilters");

const API_TOKEN = process.env.API_TOKEN;

let cacheStatus = {
  combat: false,
  reserve: false,
  individual: false,
  groups: false,
  medalRecipients: false,
};

let cachedCombatRoster;
let cachedReserveRoster;
let cachedIndividual;
let cachedGroups;
let cachedMedalRecipientRoster;
let cacheTime = {};

axiosRetry(axios, {
  retries: 5,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
});

const updateCombatRosterCache = async () => {
  try {
    const response = await axios("https://api.7cav.us/api/v1/roster/1", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_TOKEN,
        "Accept-Encoding": "gzip",
      },
    });
    cachedCombatRoster = response.data;
    cacheTime["combat"] = Date.now();
    cacheStatus.combat = true;
  } catch (error) {
    console.error("Failed to update combat cache:", error.message);
    cacheStatus.combat = false;
  }
};

const updateReserveRosterCache = async () => {
  try {
    const response = await axios("https://api.7cav.us/api/v1/roster/2", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_TOKEN,
        "Accept-Encoding": "gzip",
      },
    });
    cachedReserveRoster = response.data;
    cacheTime["reserve"] = Date.now();
    cacheStatus.reserve = true;
  } catch (error) {
    console.error("Failed to update reserve cache:", error.message);
    cacheStatus.reserve = false;
  }
};

const updateMedalRecipientRosterCache = async () => {
  try {
    const requestOptions = {
      timeout: 5000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_TOKEN,
        "Accept-Encoding": "gzip",
      },
    };

    const [
      combatResponse,
      reserveResponse,
      eloaResponse,
      wallOfHonorResponse,
      pastMembersResponse,
    ] = await Promise.all([
      axios("https://api.7cav.us/api/v1/roster/1/lite", requestOptions),
      axios("https://api.7cav.us/api/v1/roster/2/lite", requestOptions),
      axios("https://api.7cav.us/api/v1/roster/3/lite", requestOptions),
      axios("https://api.7cav.us/api/v1/roster/4/lite", requestOptions),
      axios("https://api.7cav.us/api/v1/roster/6/lite", requestOptions),
    ]);

    const retiredResponse = filterRetiredRoster(pastMembersResponse.data);

    cachedMedalRecipientRoster = {
      profiles: {
        ...(combatResponse.data?.profiles ?? {}),
        ...(reserveResponse.data?.profiles ?? {}),
        ...(eloaResponse.data?.profiles ?? {}),
        ...(wallOfHonorResponse.data?.profiles ?? {}),
        ...(retiredResponse.profiles ?? {}),
      },
    };

    cacheTime["medalRecipients"] = Date.now();
    cacheStatus.medalRecipients = true;
  } catch (error) {
    console.error("Failed to update Medal recipient cache:", error.message);
    cacheStatus.medalRecipients = false;
  }
};

const updateCachedIndividual = async (userName) => {
  try {
    const response = await axios(
      `https://api.7cav.us/api/v1/milpacs/profile/username/${userName}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + API_TOKEN,
          "Accept-Encoding": "gzip",
        },
      },
    );
    cachedIndividual = response.data;
    cacheTime["individual"] = Date.now();
    cacheStatus.individual = true;
    return cachedIndividual;
  } catch (error) {
    console.error("Failed to update individual user cache:", error.message);
    cacheStatus.individual = false;
    return null;
  }
};

const updateCachedGroups = async () => {
  try {
    const response = await axios(
      "https://api.7cav.us/api/v1/milpacs/position/groups",
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + API_TOKEN,
          "Accept-Encoding": "gzip",
        },
      },
    );
    cachedGroups = response.data;
    cacheTime["individual"] = Date.now();
    cacheStatus.groups = true;
    return cachedGroups;
  } catch (error) {
    console.error("Failed to update groups cache:", error.message);
    cacheStatus.groups = false;
    return null;
  }
};

const scheduleCacheUpdate = (updateFunction) => {
  const now = new Date();
  const delay =
    (60 - now.getMinutes()) * 60 * 1000 + (60 - now.getSeconds()) * 1000;

  setTimeout(() => {
    updateFunction();
    setInterval(updateFunction, 3660 * 1000); // Update every 3660 seconds (1 hour and 1 minute)
  }, delay);
};

const initializeCache = async () => {
  try {
    // Initial cache update
    await updateCombatRosterCache();
    await updateReserveRosterCache();
    await updateCachedGroups();

    // Check only the existing startup-critical caches.
    if (
      !cacheStatus["combat"] ||
      !cacheStatus["reserve"] ||
      !cacheStatus["groups"]
    ) {
      console.error("Failed to initialize cache. Exiting...");
      process.exit(1); // Exit to trigger Docker restart
    }

    // Medal Recommendation recipient data is useful to the Medal Aid,
    // but it is not a startup-critical dependency for the rest of CavApps.
    // Start the initial refresh without delaying server startup.
    void updateMedalRecipientRosterCache();

    // Schedule the updates
    scheduleCacheUpdate(updateCombatRosterCache);
    scheduleCacheUpdate(updateReserveRosterCache);
    scheduleCacheUpdate(updateCachedGroups);
    scheduleCacheUpdate(updateMedalRecipientRosterCache);
  } catch (error) {
    // Fatal path: keep the stack, which is the only diagnostic before exit.
    // Never the error object itself — that is what carried the token.
    console.error(
      "Critical error during cache initialization:",
      error.stack || error.message || String(error),
    );
    process.exit(1); // Exit to trigger Docker restart
  }
};

const getCachedCombatRoster = () => {
  return cachedCombatRoster;
};

const getCachedReserveRoster = () => {
  return cachedReserveRoster;
};

const getCachedMedalRecipientRoster = () => {
  return cachedMedalRecipientRoster;
};

const getCachedIndividual = () => {
  return cachedIndividual;
};

const getCachedGroups = () => {
  return cachedGroups;
};

module.exports = {
  updateCachedIndividual,
  updateMedalRecipientRosterCache,
  getCachedCombatRoster,
  getCachedReserveRoster,
  getCachedMedalRecipientRoster,
  getCachedIndividual,
  getCachedGroups,
  cacheTime,
  initializeCache,
};
