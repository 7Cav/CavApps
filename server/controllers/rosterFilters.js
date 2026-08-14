"use strict";

function filterRetiredRoster(rosterResponse) {
  const profiles = rosterResponse?.profiles ?? {};

  const retiredProfiles = Object.fromEntries(
    Object.entries(profiles).filter(([, profile]) => {
      return (
        profile?.roster === "ROSTER_TYPE_PAST_MEMBERS" &&
        profile?.primary?.positionTitle === "Retired"
      );
    }),
  );

  return {
    ...rosterResponse,
    profiles: retiredProfiles,
  };
}

module.exports = {
  filterRetiredRoster,
};
