import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ServiceMedalRecommendationPage from "../service/page";
import {
  getServiceMedalById,
  SERVICE_MEDALS,
} from "../lib/service-medal-definitions.js";
import { resolveMedalWorksheet } from "../lib/worksheet-profiles.js";
import {
  makeRecipient,
  renderServiceClient,
  selectRecipient,
  selectServiceAward,
  submitRecommendation,
} from "./test-helpers.js";

const serviceRecipient = makeRecipient({
  rank: { rankShort: "CPL", rankFull: "Corporal" },
  realName: "John Smith",
});

const secondServiceRecipient = makeRecipient({
  user: { userId: "1002", username: "Jones.A" },
  rank: { rankShort: "SGT", rankFull: "Sergeant" },
  realName: "Alex Jones",
});

const multiPartNameServiceRecipient = makeRecipient({
  rank: { rankShort: "CPL", rankFull: "Corporal" },
  realName: "John Michael Smith",
});

const affectedArea = "S7 HLL SOI";

const aamId = "army-achievement-medal";

const requiredNarrativeOpening =
  "Corporal John Smith distinguished themselves by";

const completeNarrativeContinuation =
  "developing and maintaining several resources used by S7 HLL SOI. Corporal Smith consistently volunteered additional time to keep those resources current and assist staff when problems arose. Corporal Smith's contributions substantially improved the section's ability to support the Regiment.";

const expectedCitation =
  "For contributions in S7 HLL SOI. Corporal John Smith distinguished themselves by developing and maintaining several resources used by S7 HLL SOI. Corporal Smith consistently volunteered additional time to keep those resources current and assist staff when problems arose. Corporal Smith's contributions substantially improved the section's ability to support the Regiment. Corporal John Smith's dedication to duty and commitment is in great credit to themselves, S7 HLL SOI and the 7th Cavalry Gaming Regiment.";

async function renderSelectedServiceMedal({
  roster = [serviceRecipient],
} = {}) {
  const user = userEvent.setup();

  renderServiceClient({ roster });
  await selectServiceAward(user);

  return user;
}

async function selectServiceRecipient(user) {
  await selectRecipient(user, "Smi", "Smith.J");
}

async function replaceNarrative(user, value) {
  const narrative = screen.getByRole("textbox", { name: "Narrative" });

  await user.clear(narrative);
  await user.click(narrative);
  await user.paste(value);
}

async function completeServiceWorksheet(
  user,
  narrative = completeNarrativeContinuation,
  area = affectedArea,
) {
  await selectServiceRecipient(user);
  await user.type(
    screen.getByRole("textbox", { name: "Affected Area of the Cav" }),
    area,
  );
  await replaceNarrative(user, narrative);
}

function getDescribedElements(control) {
  const describedByIds = control
    .getAttribute("aria-describedby")
    ?.split(/\s+/)
    .filter(Boolean);

  return (describedByIds ?? []).map((id) => document.getElementById(id));
}

describe("Service Medal Recommendation Aid", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("loads directly with the server roster and exposes AAM", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profiles: { [serviceRecipient.user.userId]: serviceRecipient },
      }),
    });

    render(await ServiceMedalRecommendationPage());

    const user = userEvent.setup();
    await selectServiceAward(user);
    await selectServiceRecipient(user);

    expect(screen.getByText("Selected recipient: Smith.J")).toBeVisible();
    expect(screen.getByText("Corporal John Smith")).toBeVisible();
  });

  test("shows a graceful unavailable state when the Service roster cannot be loaded", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("fetch failed"),
    );

    render(await ServiceMedalRecommendationPage());

    expect(
      screen.getByRole("heading", {
        name: "Unable to load Medal Recommendation Aid",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/the medal recipient roster could not be loaded/i),
    ).toBeVisible();

    expect(screen.getByRole("link", { name: "Try Again" })).toHaveAttribute(
      "href",
      "/medalrecommendation/service",
    );
  });

  test("resolves AAM through the Service Medal lookup boundary", () => {
    const aam = getServiceMedalById(aamId);

    expect(SERVICE_MEDALS).toContain(aam);
    expect(aam).toMatchObject({
      id: "army-achievement-medal",
      name: "Army Achievement Medal",
      abbreviation: "AAM",
      family: "Service Medal",
      worksheetProfile: "serviceIndividual",
      ribbonUrl: "https://wiki.7cav.us/images/d/d6/AAM.jpg",
      minimumNarrativeSentences: 3,
    });
  });

  test.each([undefined, "", "does-not-exist"])(
    "returns null for an unknown Service Medal id: %s",
    (medalId) => {
      expect(getServiceMedalById(medalId)).toBeNull();
    },
  );

  test.each(SERVICE_MEDALS)(
    "$name satisfies the shared Service Medal definition contract",
    (medal) => {
      expect(medal.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(medal.name.trim()).not.toBe("");
      expect(medal.abbreviation.trim()).not.toBe("");
      expect(medal.family).toBe("Service Medal");
      expect(medal.ribbonUrl.trim()).not.toBe("");
      expect(medal.worksheetProfile.trim()).not.toBe("");
      expect(medal.buildOpening).toEqual(expect.any(Function));
      expect(medal.buildClosing).toEqual(expect.any(Function));

      const worksheet = resolveMedalWorksheet(medal);
      const narrativeField = worksheet?.fields.narrative;
      const declaresFixedOpening = Boolean(
        medal.buildNarrativeOpening ||
        narrativeField?.systemOwnedNarrativeOpening,
      );

      expect(worksheet).not.toBeNull();

      if (declaresFixedOpening) {
        expect(medal.buildNarrativeOpening).toEqual(expect.any(Function));
        expect(narrativeField?.systemOwnedNarrativeOpening).toBe(true);
        expect(narrativeField?.feedback).toBe("narrativeWarnings");
        expect(medal.showLiveNarrativeWarnings).toBe(true);
        expect(medal.minimumNarrativeSentences).toEqual(expect.any(Number));
        expect(medal.minimumNarrativeSentences).toBeGreaterThan(0);
      }
    },
  );

  test("shows AAM criteria and guidance without an EOTQ workflow", async () => {
    await renderSelectedServiceMedal();

    expect(
      screen.getByText(
        "Awarded for contributions to any area of the Regiment, or being selected as Enlisted of the Quarter.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Medal Criteria" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Narrative Guidance" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Describe the recipient's contributions to the affected area of the Regiment in a minimum of three professionally written sentences.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Eligibility Guidance" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("textbox", { name: "Affected Area of the Cav" }),
    ).toHaveAttribute("placeholder", "S7 HLL SOI, 2/B/2-7, etc.");
    expect(screen.queryByLabelText(/award basis/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/enlisted of the quarter/i),
    ).not.toBeInTheDocument();
  });

  test("renders a system-owned opening above the editable continuation", async () => {
    const user = await renderSelectedServiceMedal();
    const continuationBeforeRecipient = screen.getByRole("textbox", {
      name: "Narrative",
    });
    const helperText = screen.getByText(
      "The SOP requires the narrative to begin with the displayed recipient opening. Continue from the sentence starter below.",
    );

    expect(getDescribedElements(continuationBeforeRecipient)).toEqual([
      helperText,
    ]);

    await selectServiceRecipient(user);

    const opening = screen.getByText(requiredNarrativeOpening);
    const narrativeControls = screen.getAllByRole("textbox", {
      name: "Narrative",
    });
    const continuation = narrativeControls[0];
    const narrativeLabel = screen.getByText("Narrative", { selector: "label" });

    expect(opening).toBeVisible();
    expect(narrativeControls).toHaveLength(1);
    expect(
      opening.closest(
        'input, textarea, [role="textbox"], [contenteditable=""], [contenteditable="true"]',
      ),
    ).toBeNull();
    expect(continuation).toHaveValue("");
    expect(
      screen.queryByText(/Sentence count: This medal requires/i),
    ).not.toBeInTheDocument();

    expect(narrativeLabel.compareDocumentPosition(helperText)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(helperText.compareDocumentPosition(opening)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(opening.compareDocumentPosition(continuation)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    const describedElements = getDescribedElements(continuation);

    expect(describedElements).toHaveLength(2);
    expect(describedElements).not.toContain(null);
    expect(describedElements).toEqual(
      expect.arrayContaining([helperText, opening]),
    );

    await user.type(continuation, "developing a new training resource.");

    expect(continuation).toHaveValue("developing a new training resource.");
    expect(continuation.value).not.toContain(requiredNarrativeOpening);
  });

  test("preserves continuation entered before recipient selection", async () => {
    const user = await renderSelectedServiceMedal();
    const continuation = screen.getByRole("textbox", { name: "Narrative" });
    const shortNarrative = "improving the section's readiness.";

    await user.type(continuation, shortNarrative);

    expect(
      screen.queryByText(/Sentence count: This medal requires/i),
    ).not.toBeInTheDocument();

    await selectServiceRecipient(user);

    expect(screen.getByText(requiredNarrativeOpening)).toBeVisible();
    expect(continuation).toHaveValue(shortNarrative);
    expect(
      screen.getByText(/Sentence count: This medal requires/i),
    ).toBeVisible();
  });

  test("blocks generation when hard-required recipient, area, or narrative input is missing", async () => {
    const user = await renderSelectedServiceMedal();

    await submitRecommendation(user);

    expect(screen.getByRole("textbox", { name: "Recipient" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByRole("textbox", { name: "Affected Area of the Cav" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();

    await selectServiceRecipient(user);
    await user.type(
      screen.getByRole("textbox", { name: "Affected Area of the Cav" }),
      affectedArea,
    );
    await submitRecommendation(user);

    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("treats whitespace-only Service fields as missing", async () => {
    const user = await renderSelectedServiceMedal();

    await selectServiceRecipient(user);
    await user.type(
      screen.getByRole("textbox", { name: "Affected Area of the Cav" }),
      "   ",
    );
    await user.type(screen.getByRole("textbox", { name: "Narrative" }), "   ");

    expect(
      screen.queryByText(/Sentence count: This medal requires/i),
    ).not.toBeInTheDocument();

    await submitRecommendation(user);

    expect(
      screen.getByRole("textbox", { name: "Affected Area of the Cav" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("generates the exact mapped AAM citation without duplicating its narrative opening", async () => {
    const user = await renderSelectedServiceMedal();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Complete the worksheet to generate a recommendation.",
    );

    await completeServiceWorksheet(
      user,
      `  ${completeNarrativeContinuation}  `,
      `  ${affectedArea}  `,
    );
    await submitRecommendation(user);

    const citation = screen.getByLabelText("Citation Narrative").textContent;

    expect(screen.getByRole("status")).toHaveTextContent(
      "Recommendation generated.",
    );
    expect(citation).toBe(expectedCitation);
    expect(
      citation.match(/Corporal John Smith distinguished themselves by/g),
    ).toHaveLength(1);
    expect(
      screen.getByRole("img", { name: "Army Achievement Medal ribbon" }),
    ).toHaveAttribute("src", "https://wiki.7cav.us/images/d/d6/AAM.jpg");
  });

  test("uses first and last name only throughout an AAM citation", async () => {
    const user = await renderSelectedServiceMedal({
      roster: [multiPartNameServiceRecipient],
    });

    await selectServiceRecipient(user);
    await user.type(
      screen.getByRole("textbox", { name: "Affected Area of the Cav" }),
      affectedArea,
    );
    await replaceNarrative(user, completeNarrativeContinuation);

    expect(
      screen.getByText("Corporal John Smith distinguished themselves by"),
    ).toBeVisible();

    await submitRecommendation(user);

    const citation = screen.getByLabelText("Citation Narrative").textContent;

    expect(citation).toContain(
      "Corporal John Smith distinguished themselves by",
    );
    expect(citation).toContain("Corporal John Smith's dedication to duty");
    expect(citation).not.toContain("John Michael Smith");
  });

  test("updates combined AAM narrative warnings live before generation", async () => {
    const user = await renderSelectedServiceMedal();
    const shortNarrative = "improving the section's readiness.";

    await selectServiceRecipient(user);
    await user.type(
      screen.getByRole("textbox", { name: "Affected Area of the Cav" }),
      affectedArea,
    );
    await replaceNarrative(user, shortNarrative);

    const sentenceWarning = await screen.findByText(
      /Sentence count: This medal requires/i,
    );
    const warningRegion = sentenceWarning.closest('[role="status"]');
    const continuation = screen.getByRole("textbox", { name: "Narrative" });
    const describedElements = getDescribedElements(continuation);

    expect(sentenceWarning).toBeVisible();
    expect(screen.queryByText(/Recipient mention:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
    expect(warningRegion).not.toBeNull();
    expect(describedElements).not.toContain(null);
    expect(describedElements).toContain(warningRegion);

    await replaceNarrative(user, completeNarrativeContinuation);

    await waitFor(() => {
      expect(
        screen.queryByText(/Sentence count: This medal requires/i),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });

  test("warns about fewer than three sentences without blocking generation", async () => {
    const user = await renderSelectedServiceMedal();
    const shortNarrative = "improving the section's readiness.";

    await completeServiceWorksheet(user, shortNarrative);
    await submitRecommendation(user);

    expect(
      screen.getByText(/Sentence count: This medal requires/i),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();

    await replaceNarrative(user, completeNarrativeContinuation);

    expect(
      screen.queryByText(/Sentence count: This medal requires/i),
    ).not.toBeInTheDocument();
  });

  test("updates only the system-owned opening when the recipient changes", async () => {
    const user = await renderSelectedServiceMedal({
      roster: [serviceRecipient, secondServiceRecipient],
    });

    await selectServiceRecipient(user);
    await replaceNarrative(user, completeNarrativeContinuation);

    const recipient = screen.getByRole("textbox", { name: "Recipient" });
    await user.clear(recipient);
    await user.type(recipient, "Jon");
    await user.click(screen.getByRole("button", { name: "Jones.A" }));

    expect(
      screen.getByText("Sergeant Alex Jones distinguished themselves by"),
    ).toBeVisible();
    expect(
      screen.queryByText(requiredNarrativeOpening),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Narrative" })).toHaveValue(
      completeNarrativeContinuation,
    );
  });

  test.each([
    ["recipient", "Recipient"],
    ["affected area", "Affected Area of the Cav"],
    ["narrative", "Narrative"],
  ])("clears a generated preview after %s changes", async (_field, label) => {
    const user = await renderSelectedServiceMedal();

    await completeServiceWorksheet(user);
    await submitRecommendation(user);

    expect(
      screen.getByRole("region", { name: "Recommendation Preview" }),
    ).toBeVisible();

    const input = screen.getByRole("textbox", { name: label });

    if (label === "Recipient") {
      await user.clear(input);
    } else {
      await user.type(input, " updated");
    }

    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
  });
});
