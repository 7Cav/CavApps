import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  fillOperationWorksheet,
  getCitationText,
  renderClient,
  selectAward,
  selectRecipient,
  submitRecommendation,
} from "./test-helpers.js";
import {
  getOperationMedal,
  OPERATION_MEDAL_CASES,
} from "./operation-medal-cases.js";

const BASE_OPENING_VALUES = {
  actionCharacter: "skillful",
  combatElement: "rifleman",
  operationTitle: "Exfor",
  location: "Remagen",
  date: "11 August 2026",
  scope: "single",
};

const BASE_CLOSING_VALUES = {
  recipientRank: "Specialist",
  recipientCitationName: "John Smith",
  actionCharacter: "skillful",
};

const OPENING_CASES = [
  {
    label: "Army Commendation Medal skillful actions",
    medalName: "Army Commendation Medal",
    values: {},
    expected:
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Army Commendation Medal heroic actions",
    medalName: "Army Commendation Medal",
    values: { actionCharacter: "heroic" },
    expected:
      "For heroic actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Army Commendation Medal With Valor",
    medalName: "Army Commendation Medal With Valor",
    values: {},
    expected:
      "For a single act of heroism and skill under enemy fire while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Air Medal skillful actions",
    medalName: "Air Medal",
    values: { combatElement: "rotary-wing pilot" },
    expected:
      "For skillful actions over an entire operation while serving as rotary-wing pilot in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Air Medal heroic actions",
    medalName: "Air Medal",
    values: {
      actionCharacter: "heroic",
      combatElement: "rotary-wing pilot",
    },
    expected:
      "For heroic actions over an entire operation while serving as rotary-wing pilot in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Purple Heart single scope",
    medalName: "Purple Heart",
    values: {},
    expected:
      "For a single heroic action and skill under enemy fire resulting in their sacrifice and death while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Purple Heart multiple scope",
    medalName: "Purple Heart",
    values: { scope: "multiple" },
    expected:
      "For multiple heroic actions and skill under enemy fire resulting in their sacrifice and death while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Bronze Star Medal skillful actions",
    medalName: "Bronze Star Medal",
    values: {},
    expected:
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Bronze Star Medal heroic actions",
    medalName: "Bronze Star Medal",
    values: { actionCharacter: "heroic" },
    expected:
      "For heroic actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Bronze Star Medal With Valor",
    medalName: "Bronze Star Medal With Valor",
    values: {},
    expected:
      "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Distinguished Flying Cross Airframe override",
    medalName: "Distinguished Flying Cross",
    values: { combatElement: "an F/A-18" },
    expected:
      "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as an F/A-18 pilot in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Silver Star Leadership Element override",
    medalName: "Silver Star",
    values: { combatElement: "platoon leader" },
    expected:
      "For conspicuous gallantry and intrepidity under direct enemy fire while serving as platoon leader in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
  {
    label: "Distinguished Service Cross",
    medalName: "Distinguished Service Cross",
    values: { combatElement: "company commander" },
    expected:
      "For conspicuous gallantry and intrepidity under direct enemy fire while serving as company commander in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
  },
];

const CLOSING_CASES = [
  {
    label: "Army Commendation Medal skillful actions",
    medalName: "Army Commendation Medal",
    values: {},
    expected:
      "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Army Commendation Medal heroic actions",
    medalName: "Army Commendation Medal",
    values: { actionCharacter: "heroic" },
    expected:
      "Specialist John Smith's heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Army Commendation Medal With Valor",
    medalName: "Army Commendation Medal With Valor",
    values: {},
    expected:
      "Specialist John Smith's heroism and skill reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Air Medal skillful actions",
    medalName: "Air Medal",
    values: {},
    expected:
      "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Air Medal heroic actions",
    medalName: "Air Medal",
    values: { actionCharacter: "heroic" },
    expected:
      "Specialist John Smith's heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Purple Heart",
    medalName: "Purple Heart",
    values: {},
    expected:
      "Specialist John Smith's heroism and sacrifice reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Bronze Star Medal skillful actions",
    medalName: "Bronze Star Medal",
    values: {},
    expected:
      "Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Bronze Star Medal heroic actions",
    medalName: "Bronze Star Medal",
    values: { actionCharacter: "heroic" },
    expected:
      "Specialist John Smith's heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Bronze Star Medal With Valor",
    medalName: "Bronze Star Medal With Valor",
    values: {},
    expected:
      "Specialist John Smith's skills and heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Distinguished Flying Cross",
    medalName: "Distinguished Flying Cross",
    values: {},
    expected:
      "Specialist John Smith's skills and heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Silver Star",
    medalName: "Silver Star",
    values: {},
    expected:
      "Specialist John Smith's heroism, skill and devotion to duty reflects great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
  {
    label: "Distinguished Service Cross",
    medalName: "Distinguished Service Cross",
    values: {},
    expected:
      "Specialist John Smith's heroism, skill and devotion to duty reflects great credit upon themselves and the 7th Cavalry Gaming Regiment.",
  },
];

const ARCOM_NARRATIVE =
  "Specialist John Smith maintained an effective fighting position throughout the operation. " +
  "He repeatedly engaged enemy forces and supported his squad during each major contact. " +
  "His performance contributed directly to the successful completion of the operation.";

const PURPLE_HEART_NARRATIVE =
  "Specialist John Smith held the line under heavy fire. " +
  "Specialist Smith continued fighting despite overwhelming opposition. " +
  "Specialist Smith's actions allowed the remainder of the element to complete the mission.";

const ALL_MEDALS_NARRATIVE =
  "Specialist John Smith established a secure position before enemy contact. " +
  "Specialist Smith coordinated the element as opposition intensified. " +
  "Specialist Smith directed accurate fires while protecting the team. " +
  "His actions enabled the unit to complete every assigned objective. " +
  "The element secured the area and completed the operation successfully.";

describe("Operation Medal citation contracts", () => {
  test.each(OPENING_CASES)(
    "$label builds the exact opening through its medal definition",
    ({ medalName, values, expected }) => {
      const medal = getOperationMedal(medalName);

      expect(medal, `Missing medal definition for ${medalName}`).toBeDefined();
      expect(
        medal.buildOpening({
          ...BASE_OPENING_VALUES,
          ...values,
        }),
      ).toBe(expected);
    },
  );

  test.each(CLOSING_CASES)(
    "$label builds the exact closing through its medal definition",
    ({ medalName, values, expected }) => {
      const medal = getOperationMedal(medalName);

      expect(medal, `Missing medal definition for ${medalName}`).toBeDefined();
      expect(
        medal.buildClosing({
          ...BASE_CLOSING_VALUES,
          ...values,
        }),
      ).toBe(expected);
    },
  );
});

describe("Medal Recommendation Aid - citation integrations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each(OPERATION_MEDAL_CASES)(
    "$name generates a preview with its heading and ribbon",
    async ({ name, ribbonUrl, worksheetValues }) => {
      const user = userEvent.setup();
      renderClient();

      await selectAward(user, name);
      await selectRecipient(user);
      await fillOperationWorksheet(user, {
        ...worksheetValues,
        operationTitle: "Exfor",
        location: "Remagen",
        operationDate: "2026-08-11",
        narrative: ALL_MEDALS_NARRATIVE,
      });
      await submitRecommendation(user);

      const preview = screen.getByRole("region", {
        name: "Recommendation Preview",
      });

      expect(within(preview).getByRole("heading", { name })).toBeVisible();
      expect(
        within(preview).getByRole("img", { name: `${name} ribbon` }),
      ).toHaveAttribute("src", ribbonUrl);
    },
  );

  test("generates a complete Army Commendation Medal preview", async () => {
    const user = userEvent.setup();
    renderClient();

    await selectAward(user);
    await selectRecipient(user);
    await fillOperationWorksheet(user, {
      actionCharacter: "Skillful",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative: ARCOM_NARRATIVE,
    });
    await submitRecommendation(user);

    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    const citation = screen.getByLabelText("Citation Narrative");
    const paragraphs = preview.querySelectorAll("p");

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent(/^Specialist John Smith$/);
    expect(paragraphs[1]).toBe(citation);
    expect(citation).toBeVisible();
    expect(getCitationText()).toBe(
      "For skillful actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        ARCOM_NARRATIVE +
        " Specialist John Smith's skillful actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test.each([
    {
      scope: "Single",
      opening:
        "For a single heroic action and skill under enemy fire resulting in their sacrifice and death while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
    },
    {
      scope: "Multiple",
      opening:
        "For multiple heroic actions and skill under enemy fire resulting in their sacrifice and death while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026.",
    },
  ])(
    "flows Purple Heart $scope scope into the citation",
    async ({ scope, opening }) => {
      const user = userEvent.setup();
      renderClient();

      await selectAward(user, "Purple Heart");
      await selectRecipient(user);
      await fillOperationWorksheet(user, {
        scope,
        combatElement: "rifleman",
        operationTitle: "Exfor",
        location: "Remagen",
        operationDate: "2026-08-11",
        narrative: PURPLE_HEART_NARRATIVE,
      });
      await submitRecommendation(user);

      expect(getCitationText()).toBe(
        opening +
          " " +
          PURPLE_HEART_NARRATIVE +
          " Specialist John Smith's heroism and sacrifice reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
      );
    },
  );

  test("flows the Distinguished Flying Cross Airframe override into the citation", async () => {
    const user = userEvent.setup();
    const narrative =
      "Specialist John Smith flew directly into intense enemy fire to extract the isolated element. " +
      "Specialist Smith maneuvered the aircraft through the engagement while maintaining control under sustained fire. " +
      "Specialist Smith's actions were critical to the successful completion of the mission.";

    renderClient();
    await selectAward(user, "Distinguished Flying Cross");
    await selectRecipient(user);
    await fillOperationWorksheet(user, {
      airframe: "an F/A-18",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative,
    });
    await submitRecommendation(user);

    expect(getCitationText()).toBe(
      "For a single act demonstrating extraordinary heroism and skill under enemy fire while serving as an F/A-18 pilot in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        narrative +
        " Specialist John Smith's skills and heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test("flows Action Character selection into the opening and closing", async () => {
    const user = userEvent.setup();
    renderClient();

    await selectAward(user);
    await selectRecipient(user);
    await fillOperationWorksheet(user, {
      actionCharacter: "Heroic",
      combatElement: "rifleman",
      operationTitle: "Exfor",
      location: "Remagen",
      operationDate: "2026-08-11",
      narrative: ARCOM_NARRATIVE,
    });
    await submitRecommendation(user);

    expect(getCitationText()).toBe(
      "For heroic actions over an entire operation while serving as rifleman in the 7th Cavalry Regiment during combat in Operation Exfor near Remagen on 11 August 2026. " +
        ARCOM_NARRATIVE +
        " Specialist John Smith's heroic actions reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.",
    );
  });

  test.each([
    ["Overlord", "Operation Overlord", 1],
    ["Operation Overlord", "Operation Overlord", 1],
    [
      "Defense of Operation Market Garden",
      "Operation Defense of Operation Market Garden",
      2,
    ],
  ])(
    "normalizes the Operation title %s at the leading boundary only",
    async (operationTitle, normalizedTitle, operationWordCount) => {
      const user = userEvent.setup();
      renderClient();

      await selectAward(user);
      await selectRecipient(user);
      await fillOperationWorksheet(user, {
        actionCharacter: "Skillful",
        combatElement: "rifleman",
        operationTitle,
        location: "Remagen",
        operationDate: "2026-08-11",
        narrative: ARCOM_NARRATIVE,
      });
      await submitRecommendation(user);

      const citation = getCitationText();

      expect(citation).toContain(
        `during combat in ${normalizedTitle} near Remagen`,
      );
      expect(citation.match(/Operation/g)).toHaveLength(operationWordCount);
    },
  );
});
