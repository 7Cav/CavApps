import { render, screen } from "@testing-library/react";
import MedalRecommendationPage from "../page";

export const combatRoster = {
  1001: {
    user: { userId: "1001", username: "Smith.J" },
    rank: { rankShort: "SPC", rankFull: "Specialist", rankId: "5" },
    realName: "John Smith",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "100" },
    secondaries: [],
  },
  1002: {
    user: { userId: "1002", username: "Long.A" },
    rank: { rankShort: "SPC", rankFull: "Specialist", rankId: "5" },
    realName: "Adam Long",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "101" },
    secondaries: [],
  },
  1003: {
    user: { userId: "1003", username: "Smith.TM" },
    rank: { rankShort: "SPC", rankFull: "Specialist", rankId: "5" },
    realName: "Taylor Morgan Smith",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "102" },
    secondaries: [],
  },
  1004: {
    user: { userId: "1004", username: "Rankless.T" },
    rank: { rankShort: "SPC", rankFull: "", rankId: "5" },
    realName: "Test Rankless",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "103" },
    secondaries: [],
  },
  1005: {
    user: { userId: "1005", username: "Nameless.T" },
    rank: { rankShort: "SPC", rankFull: "Specialist", rankId: "5" },
    realName: "",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "104" },
    secondaries: [],
  },
  1006: {
    user: { userId: "1006", username: "Rankspace.T" },
    rank: { rankShort: "SPC", rankFull: "   ", rankId: "5" },
    realName: "Test Rankspace",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "105" },
    secondaries: [],
  },
  1007: {
    user: { userId: "1007", username: "Namespace.T" },
    rank: { rankShort: "SPC", rankFull: "Specialist", rankId: "5" },
    realName: "   ",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "106" },
    secondaries: [],
  },
  1008: {
    user: { userId: "1008", username: "Smith.TJ" },
    rank: { rankShort: "SPC", rankFull: "Specialist", rankId: "5" },
    realName: "Taylor J. Smith",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "107" },
    secondaries: [],
  },
  1009: {
    user: { userId: "1009", username: "Kenton.W" },
    rank: { rankShort: "Cpl", rankFull: "Corporal", rankId: "6" },
    realName: "Wade Kenton",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "108" },
    secondaries: [],
  },
  1010: {
    user: { userId: "1010", username: "General.M" },
    rank: { rankShort: "MG", rankFull: "Major General", rankId: "12" },
    realName: "Morgan General",
    roster: "ROSTER_TYPE_COMBAT",
    primary: { positionTitle: "Trooper", positionId: "109" },
    secondaries: [],
  },
};

export async function renderMedalRecommendationAid() {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok: true,
    json: async () => ({ profiles: combatRoster }),
  });

  render(await MedalRecommendationPage());
}

export async function selectAward(user, awardName = "Army Commendation Medal") {
  await user.click(screen.getByRole("combobox", { name: "Award" }));
  await user.click(screen.getByRole("option", { name: awardName }));
}

export async function selectRecipient(
  user,
  query = "Smi",
  username = "Smith.J",
) {
  await user.type(screen.getByRole("textbox", { name: "Recipient" }), query);
  await user.click(await screen.findByRole("button", { name: username }));
}

export async function completeRecommendation(
  user,
  narrative,
  { omit, recipientQuery = "Smi", recipientUsername = "Smith.J" } = {},
) {
  await selectAward(user);
  await selectRecipient(user, recipientQuery, recipientUsername);

  if (omit !== "actionCharacter") {
    await user.click(
      screen.getByRole("combobox", { name: "Action Character" }),
    );
    await user.click(screen.getByRole("option", { name: "Skillful" }));
  }

  if (omit !== "combatElement") {
    await user.type(
      screen.getByRole("textbox", { name: "Combat Element" }),
      "rifleman",
    );
  }

  if (omit !== "operationTitle") {
    await user.type(
      screen.getByRole("textbox", { name: "Operation Title" }),
      "Exfor",
    );
  }

  if (omit !== "location") {
    await user.type(
      screen.getByRole("textbox", { name: "Location" }),
      "Remagen",
    );
  }

  if (omit !== "operationDate") {
    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");
  }

  if (omit !== "narrative") {
    const narrativeField = screen.getByRole("textbox", { name: "Narrative" });
    await user.click(narrativeField);
    await user.paste(narrative);
  }
}
