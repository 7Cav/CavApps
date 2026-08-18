import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedalRecommendationPage from "../page";
import { selectAward } from "./test-helpers.js";

const medalRecipientRoster = {
  2000: {
    user: {
      userId: "2000",
      username: "Combat.C",
    },
    rank: {
      rankShort: "SPC",
      rankFull: "Specialist",
      rankId: "5",
    },
    realName: "Casey Combat",
    roster: "ROSTER_TYPE_COMBAT",
    primary: {
      positionTitle: "Trooper",
      positionId: "199",
    },
    secondaries: [],
  },

  2001: {
    user: {
      userId: "2001",
      username: "Reserve.R",
    },
    rank: {
      rankShort: "SGT",
      rankFull: "Sergeant",
      rankId: "6",
    },
    realName: "Riley Reserve",
    roster: "ROSTER_TYPE_RESERVE",
    primary: {
      positionTitle: "Reservist",
      positionId: "200",
    },
    secondaries: [],
  },

  2002: {
    user: {
      userId: "2002",
      username: "Eloa.E",
    },
    rank: {
      rankShort: "CPL",
      rankFull: "Corporal",
      rankId: "4",
    },
    realName: "Elliot Eloa",
    roster: "ROSTER_TYPE_ELOA",
    primary: {
      positionTitle: "ELOA",
      positionId: "201",
    },
    secondaries: [],
  },

  2003: {
    user: {
      userId: "2003",
      username: "Honor.H",
    },
    rank: {
      rankShort: "1SG",
      rankFull: "First Sergeant",
      rankId: "8",
    },
    realName: "Harper Honor",
    roster: "ROSTER_TYPE_WALL_OF_HONOR",
    primary: {
      positionTitle: "Wall of Honor",
      positionId: "202",
    },
    secondaries: [],
  },

  2004: {
    user: {
      userId: "2004",
      username: "Retired.R",
    },
    rank: {
      rankShort: "MAJ",
      rankFull: "Major",
      rankId: "10",
    },
    realName: "Robin Retired",
    roster: "ROSTER_TYPE_PAST_MEMBERS",
    primary: {
      positionTitle: "Retired",
      positionId: "203",
    },
    secondaries: [],
  },
};

async function renderMedalRecommendationAid() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    if (url === "https://medal-recipient-roster.test/") {
      return {
        ok: true,
        json: async () => ({
          profiles: medalRecipientRoster,
        }),
      };
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  });

  render(await MedalRecommendationPage());
}

async function selectRecipient(user, query, username) {
  await user.type(
    screen.getByRole("textbox", {
      name: "Recipient",
    }),
    query,
  );

  await user.click(
    await screen.findByRole("button", {
      name: username,
    }),
  );
}

describe("Medal Recommendation recipient roster", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("lets a user search for and select a Reserve medal recipient", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user);

    await selectRecipient(user, "Res", "Reserve.R");

    expect(screen.getByText("Selected recipient: Reserve.R")).toBeVisible();

    expect(screen.getByText("Sergeant Riley Reserve")).toBeVisible();
  });

  test("does not warn when the selected recipient is an active Combat member", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user);

    await selectRecipient(user, "Com", "Combat.C");

    expect(
      screen.queryByText(
        /this member is not an active member, please confirm eligibility/i,
      ),
    ).not.toBeInTheDocument();
  });

  test.each([
    ["Reserve", "Res", "Reserve.R"],
    ["ELOA", "Elo", "Eloa.E"],
    ["Wall of Honor", "Hon", "Honor.H"],
    ["Retired", "Ret", "Retired.R"],
  ])(
    "warns when the selected recipient is %s",
    async (_status, query, username) => {
      const user = userEvent.setup();

      await renderMedalRecommendationAid();
      await selectAward(user);

      await selectRecipient(user, query, username);

      expect(
        screen.getByText(
          /this member is not an active member, please confirm eligibility/i,
        ),
      ).toBeVisible();
    },
  );

  test("allows generation for a non-active recipient after showing the eligibility warning", async () => {
    const user = userEvent.setup();

    await renderMedalRecommendationAid();
    await selectAward(user);

    await selectRecipient(user, "Res", "Reserve.R");

    expect(
      screen.getByText(
        /this member is not an active member, please confirm eligibility/i,
      ),
    ).toBeVisible();

    await user.click(
      screen.getByRole("combobox", {
        name: "Action Character",
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "Skillful",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Combat Element",
      }),
      "rifleman",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Operation Title",
      }),
      "Exfor",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Location",
      }),
      "Remagen",
    );

    await user.type(screen.getByLabelText("Operation Date"), "2026-08-11");

    await user.type(
      screen.getByRole("textbox", {
        name: "Narrative",
      }),
      "SGT Reserve maintained the position throughout the operation.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Generate Recommendation",
      }),
    );

    expect(
      screen.getByRole("region", {
        name: "Recommendation Preview",
      }),
    ).toBeVisible();

    expect(
      screen.getByText(
        /this member is not an active member, please confirm eligibility/i,
      ),
    ).toBeVisible();
  });
});
