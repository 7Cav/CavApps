function cleanText(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/\s+/gu, " ")
    .trim();
}

function uniqueValues(values) {
  const seen = new Set();

  return (values || []).reduce((result, value) => {
    const clean = cleanText(value);
    const normalized = clean.toUpperCase();

    if (!clean || seen.has(normalized)) {
      return result;
    }

    seen.add(normalized);
    result.push(clean);

    return result;
  }, []);
}

function extractRosterSurname(username) {
  const cleanUsername = cleanText(username);

  if (!cleanUsername) {
    return "";
  }

  const separatorIndex = cleanUsername.search(/[.,]/u);

  return cleanText(
    separatorIndex >= 0
      ? cleanUsername.slice(0, separatorIndex)
      : cleanUsername,
  );
}

function splitRealName(realName, username) {
  const parts = cleanText(realName).split(/\s+/u).filter(Boolean);

  if (!parts.length) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const rosterSurname = extractRosterSurname(username);

  if (rosterSurname) {
    const surnameParts = rosterSurname.split(/\s+/u).filter(Boolean);

    const candidateParts = parts.slice(-surnameParts.length);

    if (
      candidateParts.length === surnameParts.length &&
      candidateParts.join(" ").toUpperCase() === rosterSurname.toUpperCase()
    ) {
      return {
        firstName: parts.slice(0, -surnameParts.length).join(" "),

        lastName: candidateParts.join(" "),
      };
    }
  }

  return {
    firstName: parts.slice(0, -1).join(" "),

    lastName: parts.at(-1) ?? "",
  };
}

function getStatusLong(rosterType) {
  switch (rosterType) {
    case "ROSTER_TYPE_COMBAT":
      return "Active Duty";

    case "ROSTER_TYPE_RESERVE":
      return "Reserve";

    case "ROSTER_TYPE_ELOA":
      return "ELOA";

    case "ROSTER_TYPE_PAST_MEMBERS":
      return "Retired";

    default:
      return "";
  }
}

function adaptProfile(milpacId, profile) {
  const user = profile?.user;
  const rank = profile?.rank;

  const username = cleanText(user?.username);

  const realName = cleanText(profile?.realName);

  const rankAbbreviation = cleanText(rank?.rankShort);

  const rankLong = cleanText(rank?.rankFull);

  if (!milpacId || !username || !realName || !rankAbbreviation || !rankLong) {
    return null;
  }

  const nameParts = splitRealName(realName, username);

  const primaryBillet = cleanText(profile?.primary?.positionTitle);

  const secondaryBillets = uniqueValues(
    (profile?.secondaries ?? []).map((position) => position?.positionTitle),
  );

  const billets = uniqueValues([primaryBillet, ...secondaryBillets]);

  return {
    dropdownName: `${rankAbbreviation} ${username}`,

    rankAbbreviation,
    rankLong,

    firstName: nameParts.firstName,

    lastName: nameParts.lastName,

    fullName: realName,

    rosterName: username,

    userId: cleanText(user?.userId),

    milpacId: cleanText(milpacId),

    milpacsUrl: `https://7cav.us/rosters/profile/${milpacId}/`,

    statusLong: getStatusLong(profile?.roster),

    statusShort: cleanText(profile?.roster),

    areaOfResponsibility: "",

    primaryBillet,
    secondaryBillets,
    billets,

    combinedBillets: billets.join(", "),
  };
}

export function adaptMedalRoster(profiles) {
  return Object.entries(profiles ?? {})
    .map(([milpacId, profile]) => adaptProfile(milpacId, profile))
    .filter(Boolean)
    .sort((left, right) =>
      left.dropdownName.localeCompare(right.dropdownName, undefined, {
        sensitivity: "base",
        numeric: true,
      }),
    );
}
