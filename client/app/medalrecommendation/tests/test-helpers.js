import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import MedalRecommendationClient from "../MedalRecommendationClient";
import OperationMedalRecommendationPage from "../operation/page";

export function makeRecipient(overrides = {}) {
  const recipient = {
    user: { userId: "1001", username: "Smith.J" },
    rank: { rankShort: "SPC", rankFull: "Specialist", rankId: "5" },
    realName: "John Smith",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "100" },
    secondaries: [],
  };

  return {
    ...recipient,
    ...overrides,
    user: { ...recipient.user, ...overrides.user },
    rank: { ...recipient.rank, ...overrides.rank },
    primary: { ...recipient.primary, ...overrides.primary },
    secondaries: overrides.secondaries ?? recipient.secondaries,
  };
}

export const activeRecipient = makeRecipient({
  user: { userId: "2000", username: "Combat.C" },
  realName: "Casey Combat",
  primary: { positionId: "199" },
});

export const reserveRecipient = makeRecipient({
  user: { userId: "2001", username: "Reserve.R" },
  rank: { rankShort: "SGT", rankFull: "Sergeant", rankId: "6" },
  realName: "Riley Reserve",
  roster: "ROSTER_TYPE_RESERVE",
  primary: { positionTitle: "Reservist", positionId: "200" },
});

export const eloaRecipient = makeRecipient({
  user: { userId: "2002", username: "Eloa.E" },
  rank: { rankShort: "CPL", rankFull: "Corporal", rankId: "4" },
  realName: "Elliot Eloa",
  roster: "ROSTER_TYPE_ELOA",
  primary: { positionTitle: "ELOA", positionId: "201" },
});

export const wallOfHonorRecipient = makeRecipient({
  user: { userId: "2003", username: "Honor.H" },
  rank: { rankShort: "1SG", rankFull: "First Sergeant", rankId: "8" },
  realName: "Harper Honor",
  roster: "ROSTER_TYPE_WALL_OF_HONOR",
  primary: { positionTitle: "Wall of Honor", positionId: "202" },
});

export const retiredRecipient = makeRecipient({
  user: { userId: "2004", username: "Retired.R" },
  rank: { rankShort: "MAJ", rankFull: "Major", rankId: "10" },
  realName: "Robin Retired",
  roster: "ROSTER_TYPE_PAST_MEMBERS",
  primary: { positionTitle: "Retired", positionId: "203" },
});

export const ranklessRecipient = makeRecipient({
  user: { userId: "1004", username: "Rankless.T" },
  rank: { rankFull: "" },
  realName: "Test Rankless",
  primary: { positionId: "103" },
});

export const namelessRecipient = makeRecipient({
  user: { userId: "1005", username: "Nameless.T" },
  realName: "",
  primary: { positionId: "104" },
});

export const combatRoster = {
  1001: makeRecipient(),
  1002: makeRecipient({
    user: { userId: "1002", username: "Long.A" },
    realName: "Adam Long",
    primary: { positionId: "101" },
  }),
  1003: makeRecipient({
    user: { userId: "1003", username: "Smith.TM" },
    realName: "Taylor Morgan Smith",
    primary: { positionId: "102" },
  }),
  1004: ranklessRecipient,
  1005: namelessRecipient,
  1006: makeRecipient({
    user: { userId: "1006", username: "Rankspace.T" },
    rank: { rankFull: "   " },
    realName: "Test Rankspace",
    primary: { positionId: "105" },
  }),
  1007: makeRecipient({
    user: { userId: "1007", username: "Namespace.T" },
    realName: "   ",
    primary: { positionId: "106" },
  }),
  1008: makeRecipient({
    user: { userId: "1008", username: "Smith.TJ" },
    realName: "Taylor J. Smith",
    primary: { positionId: "107" },
  }),
  1009: makeRecipient({
    user: { userId: "1009", username: "Kenton.W" },
    rank: { rankShort: "Cpl", rankFull: "Corporal", rankId: "6" },
    realName: "Wade Kenton",
    primary: { positionId: "108" },
  }),
  1010: makeRecipient({
    user: { userId: "1010", username: "General.M" },
    rank: { rankShort: "MG", rankFull: "Major General", rankId: "12" },
    realName: "Morgan General",
    primary: { positionId: "109" },
  }),
};

export function renderClient({
  roster = Object.values(combatRoster),
  medalFamily = "operation",
} = {}) {
  return render(
    createElement(MedalRecommendationClient, {
      recipientRoster: roster,
      medalFamily,
    }),
  );
}

export function renderServiceClient(options = {}) {
  return renderClient({ ...options, medalFamily: "service" });
}

export async function renderPageWithRoster(roster = combatRoster) {
  const profiles = Array.isArray(roster)
    ? Object.fromEntries(
        roster.map((recipient) => [recipient.user.userId, recipient]),
      )
    : roster;

  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok: true,
    json: async () => ({ profiles }),
  });

  return render(await OperationMedalRecommendationPage());
}

export async function selectComboboxOption(user, label, option) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(screen.getByRole("option", { name: option }));
}

export async function selectAward(user, awardName = "Army Commendation Medal") {
  await selectComboboxOption(user, "Award", awardName);
}

export async function selectServiceAward(user) {
  await selectAward(user, "Army Achievement Medal");
}

export async function selectRecipient(
  user,
  query = "Smi",
  username = "Smith.J",
) {
  await user.type(screen.getByRole("textbox", { name: "Recipient" }), query);
  await user.click(await screen.findByRole("button", { name: username }));
}

async function pasteIntoField(user, label, value) {
  if (value === undefined) {
    return;
  }

  const field = screen.getByRole("textbox", { name: label });
  await user.click(field);
  await user.paste(value);
}

export async function fillOperationWorksheet(user, values) {
  if (values.scope !== undefined) {
    await selectComboboxOption(user, "Scope", values.scope);
  }

  if (values.actionCharacter !== undefined) {
    await selectComboboxOption(
      user,
      "Action Character",
      values.actionCharacter,
    );
  }

  await pasteIntoField(user, "Combat Element", values.combatElement);
  await pasteIntoField(
    user,
    "Aircrew Combat Element",
    values.aircrewCombatElement,
  );
  await pasteIntoField(user, "Leadership Element", values.leadershipElement);
  await pasteIntoField(user, "Airframe", values.airframe);
  await pasteIntoField(user, "Operation Title", values.operationTitle);
  await pasteIntoField(user, "Location", values.location);

  if (values.operationDate !== undefined) {
    await user.type(
      screen.getByLabelText("Operation Date"),
      values.operationDate,
    );
  }

  await pasteIntoField(user, "Narrative", values.narrative);
}

export async function submitRecommendation(user) {
  await user.click(
    screen.getByRole("button", { name: "Generate Recommendation" }),
  );
}

export function getCitationText() {
  return screen.getByLabelText("Citation Narrative").textContent;
}

export function getHighlightTexts() {
  return Array.from(
    screen.getByLabelText("Citation Narrative").querySelectorAll("mark"),
    (highlight) => highlight.textContent,
  );
}
