import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  fillOperationWorksheet,
  enterWorksheetField as enter,
  getCitationText,
  getHighlightTexts,
  makeRecipient,
  renderClient,
  renderPageWithRoster,
  selectAward,
  selectComboboxOption,
  selectRecipient,
  submitRecommendation,
} from "./test-helpers";

// Independent title/body/header oracles from Awards and Decorations,
// pinned revision: https://wiki.7cav.us/wiki/Awards_and_Decorations?oldid=17782
// Keep expected strings independent of production definitions and serializers.
const citation =
  "For a single act of heroism or skill under enemy fire while serving as a rifleman in the 7th Cavalry Regiment during combat in Operation Overlord near Normandy on 11 August 2026. Specialist John Smith advanced. The team held. The mission succeeded. Specialist John Smith's heroism and skill reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";
const title =
  "Medal Recommendation - Operation Overlord - ARCOMV - SPC.Smith.J";
const body =
  "[CENTER][B]Army Commendation Medal With Valor[/B]\n\n[IMG]https://wiki.7cav.us/images/0/0f/ARCOMV.jpg[/IMG]\n\n[B][URL=https://7cav.us/rosters/profile/profile-1001/]Specialist John Smith[/URL][/B]\n\nFor a single act of heroism or skill under enemy fire while serving as a rifleman in the 7th Cavalry Regiment during combat in Operation Overlord near Normandy on 11 August 2026. Specialist John Smith advanced. The team held. The mission succeeded. Specialist John Smith's heroism and skill reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.\n[/CENTER]";
const previewWarning =
  "Do not copy from this preview. Use the Recommendation Title and Recommendation Body copy buttons below to preserve formatting and the ribbon image.";
async function ready({
  recipient = makeRecipient(),
  location = "Normandy",
  operationTitle = "Overlord",
} = {}) {
  const user = userEvent.setup();
  renderClient({
    roster: [
      recipient,
      makeRecipient({
        user: { userId: "1002", username: "Doe.J" },
        realName: "Jane Doe",
      }),
    ],
  });
  expect(
    screen.queryByLabelText("Recommendation Title"),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Open Medal Recommendation Ticket" }),
  ).not.toBeInTheDocument();
  await selectAward(user, "Army Commendation Medal With Valor");
  await selectRecipient(user, "Smi", recipient.user.username?.trim() ?? "");
  await fillOperationWorksheet(user, {
    combatElement: "a rifleman",
    operationTitle,
    location,
    operationDate: "2026-08-11",
    narrative:
      "Specialist John Smith advanced. The team held. The mission succeeded.",
  });
  await submitRecommendation(user);
  return user;
}

describe("Recommendation submission", () => {
  afterEach(() => vi.restoreAllMocks());

  test("the roster profile key reaches both preview and exported links when the forum ID differs", async () => {
    const user = userEvent.setup();
    // Live roster shape: profiles[4637].user.userId is 9397 for Kenton.W.
    await renderPageWithRoster({
      4637: {
        user: { userId: "9397", username: "Kenton.W" },
        rank: { rankId: "17", rankShort: "SSG", rankFull: "Staff Sergeant" },
        realName: "Wade Kenton",
        roster: "ROSTER_TYPE_COMBAT",
      },
    });
    await selectAward(user, "Army Commendation Medal With Valor");
    await selectRecipient(user, "Kenton", "Kenton.W");
    await fillOperationWorksheet(user, {
      combatElement: "a rifleman",
      operationTitle: "Overlord",
      location: "Normandy",
      operationDate: "2026-08-11",
      narrative:
        "Staff Sergeant Wade Kenton advanced. The team held. The mission succeeded.",
    });
    await submitRecommendation(user);
    expect(
      screen.getByRole("link", { name: "Staff Sergeant Wade Kenton" }),
    ).toHaveAttribute("href", "https://7cav.us/rosters/profile/4637/");
    const exportedBody = screen.getByLabelText("Recommendation Body").value;
    expect(exportedBody).toContain(
      "[B][URL=https://7cav.us/rosters/profile/4637/]Staff Sergeant Wade Kenton[/URL][/B]",
    );
    expect(exportedBody).not.toContain("/profile/9397/");
    expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
      "Medal Recommendation - Operation Overlord - ARCOMV - SSG.Kenton.W",
    );
  });

  test("preview, labeled selectable exports and protected links share the generated recommendation", async () => {
    const user = await ready();
    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    const submission = screen.getByRole("region", {
      name: "Recommendation Submission",
    });
    expect(
      within(preview).getByRole("heading", {
        name: "Army Commendation Medal With Valor",
      }),
    ).toBeVisible();
    expect(within(preview).getByRole("img")).toHaveAttribute(
      "src",
      "https://wiki.7cav.us/images/0/0f/ARCOMV.jpg",
    );
    expect(getCitationText()).toBe(citation);
    const profile = within(preview).getByRole("link", {
      name: "Specialist John Smith",
    });
    expect(profile).toHaveAttribute(
      "href",
      "https://7cav.us/rosters/profile/profile-1001/",
    );
    const ticket = within(submission).getByRole("link", {
      name: "Open Medal Recommendation Ticket",
    });
    expect(ticket).toHaveAttribute(
      "href",
      "https://7cav.us/tickets/categories/18/create",
    );
    for (const link of [profile, ticket]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    const titleField = screen.getByRole("textbox", {
      name: "Recommendation Title",
    });
    const bodyField = screen.getByRole("textbox", {
      name: "Recommendation Body",
    });
    expect(titleField).toHaveValue(title);
    expect(bodyField).toHaveValue(body);
    for (const field of [titleField, bodyField]) {
      expect(field).toHaveAttribute("readonly");
      expect(field).not.toBeDisabled();
      await user.click(field);
      field.setSelectionRange(0, field.value.length);
      expect(field.selectionEnd - field.selectionStart).toBe(
        field.value.length,
      );
    }
    for (const [first, next] of [
      [preview, submission],
      [titleField, bodyField],
      [bodyField, ticket],
    ])
      expect(
        first.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    const write = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    await user.click(screen.getByRole("button", { name: "Copy Title" }));
    expect(write).toHaveBeenLastCalledWith(title);
    expect(screen.getByRole("button", { name: "Title Copied" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Copy Body" }));
    expect(write).toHaveBeenLastCalledWith(body);
    expect(screen.getByRole("button", { name: "Body Copied" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Title Copied" })).toBeVisible();
    await submitRecommendation(user);
    expect(screen.getByRole("button", { name: "Copy Title" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy Body" })).toBeVisible();
  });

  test("the preview warning is discoverable by hover, keyboard focus and focus within without disrupting links", async () => {
    const user = await ready();
    const preview = screen.getByRole("region", {
      name: "Recommendation Preview",
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await user.hover(preview);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      previewWarning,
    );
    expect(preview).toHaveAccessibleDescription(previewWarning);
    await user.unhover(preview);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
    screen.getByRole("button", { name: "Generate Recommendation" }).focus();
    await user.tab();
    expect(preview).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      previewWarning,
    );
    await user.tab();
    const profile = within(preview).getByRole("link");
    expect(profile).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      previewWarning,
    );
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
    expect(profile).toHaveFocus();
    expect(profile).toHaveAttribute(
      "href",
      "https://7cav.us/rosters/profile/profile-1001/",
    );
    expect(profile).toHaveAttribute("target", "_blank");
    expect(profile).toHaveAttribute("rel", "noopener noreferrer");
    await user.tab();
    expect(screen.getByRole("button", { name: "Copy Title" })).toHaveFocus();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  test.each(["Title", "Body"])(
    "%s copy rejection preserves manual output, reports failure and permits retry",
    async (label) => {
      const user = await ready();
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockRejectedValue(new Error("denied"));
      await user.click(screen.getByRole("button", { name: `Copy ${label}` }));
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Copy failed. Select the text and copy it manually.",
      );
      expect(
        screen.queryByRole("button", { name: `${label} Copied` }),
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText(`Recommendation ${label}`)).toHaveValue(
        label === "Title" ? title : body,
      );
      write.mockResolvedValue();
      await user.click(screen.getByRole("button", { name: `Copy ${label}` }));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: `${label} Copied` }),
      ).toBeVisible();
    },
  );

  test("an unavailable clipboard reports failure and regeneration clears it", async () => {
    const user = await ready();
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    try {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: undefined,
      });
      await user.click(screen.getByRole("button", { name: "Copy Title" }));
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Copy failed. Select the text and copy it manually.",
      );
      expect(screen.getByLabelText("Recommendation Title")).toHaveValue(title);
      await submitRecommendation(user);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Copy Title" })).toBeVisible();
    } finally {
      Object.defineProperty(navigator, "clipboard", descriptor);
    }
  });

  test("worksheet and recipient edits clear all generated output and copy feedback together", async () => {
    const user = await ready();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await user.click(screen.getByRole("button", { name: "Copy Body" }));
    enter("Operation Title", "Fury");
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Recommendation Submission" }),
    ).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
      "Medal Recommendation - Operation Fury - ARCOMV - SPC.Smith.J",
    );
    expect(getCitationText()).toContain("Operation Fury");
    expect(screen.getByLabelText("Recommendation Body").value).toContain(
      getCitationText(),
    );
    expect(screen.getByRole("button", { name: "Copy Body" })).toBeVisible();
    enter("Recipient", "Doe");
    expect(
      screen.queryByLabelText("Recommendation Title"),
    ).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Doe.J" }));
    await submitRecommendation(user);
    expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
      "Medal Recommendation - Operation Fury - ARCOMV - SPC.Doe.J",
    );
    expect(screen.getByLabelText("Recommendation Body").value).toContain(
      "Specialist Jane Doe[/URL][/B]",
    );
    await selectAward(user, "Army Valorous Unit Award");
    expect(
      screen.queryByLabelText("Recommendation Body"),
    ).not.toBeInTheDocument();
  });

  test.each(["resolve", "reject"])(
    "late Overlord clipboard %s cannot update the replacement Fury snapshot",
    async (outcome) => {
      const user = await ready();
      let resolve, reject;
      const write = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(
        new Promise((done, fail) => {
          resolve = done;
          reject = fail;
        }),
      );
      expect(screen.getByLabelText("Recommendation Title")).toHaveValue(title);
      await user.click(screen.getByRole("button", { name: "Copy Title" }));
      expect(write).toHaveBeenLastCalledWith(title);
      expect(
        screen.queryByRole("button", { name: "Title Copied" }),
      ).not.toBeInTheDocument();
      enter("Operation Title", "Fury");
      await submitRecommendation(user);
      expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
        "Medal Recommendation - Operation Fury - ARCOMV - SPC.Smith.J",
      );
      const furyBody = screen.getByLabelText("Recommendation Body").value;
      expect(furyBody).toContain(
        "Operation Fury near Normandy on 11 August 2026.",
      );
      expect(furyBody).not.toContain("Operation Overlord");
      await act(async () => {
        if (outcome === "resolve") resolve();
        else reject(new Error("late failure"));
      });
      expect(screen.getByRole("button", { name: "Copy Title" })).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: "Title Copied" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
        "Medal Recommendation - Operation Fury - ARCOMV - SPC.Smith.J",
      );
      expect(screen.getByLabelText("Recommendation Body")).toHaveValue(
        furyBody,
      );
    },
  );

  test.each(["resolve", "reject"])(
    "late clipboard %s cannot update a freshly regenerated snapshot with unchanged content",
    async (outcome) => {
      const user = await ready();
      let resolve, reject;
      vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(
        new Promise((done, fail) => {
          resolve = done;
          reject = fail;
        }),
      );
      await user.click(screen.getByRole("button", { name: "Copy Title" }));
      expect(screen.getByRole("button", { name: "Copy Title" })).toBeDisabled();
      await submitRecommendation(user);
      await act(async () => {
        if (outcome === "resolve") resolve();
        else reject(new Error("late failure"));
      });
      expect(screen.getByRole("button", { name: "Copy Title" })).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: "Title Copied" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Recommendation Title")).toHaveValue(title);
      expect(screen.getByLabelText("Recommendation Body")).toHaveValue(body);
    },
  );

  test("an Operation Title with no normalized name blocks output until corrected", async () => {
    const user = await ready({ operationTitle: "Operation:" });
    const operationTitle = screen.getByRole("textbox", {
      name: "Operation Title",
    });
    expect(operationTitle).toHaveValue("Operation:");
    expect(operationTitle).toHaveAttribute("aria-invalid", "true");
    expect(operationTitle).toHaveAccessibleDescription(
      "Enter an operation name.",
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Recommendation Submission" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Recommendation Title"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Recommendation Body"),
    ).not.toBeInTheDocument();
    enter("Operation Title", "Operation: Hammer");
    await submitRecommendation(user);
    expect(operationTitle).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
      "Medal Recommendation - Operation Hammer - ARCOMV - SPC.Smith.J",
    );
    expect(getCitationText()).toContain(
      "in Operation Hammer near Normandy on 11 August 2026.",
    );
    expect(screen.getByLabelText("Recommendation Body").value).toContain(
      getCitationText(),
    );
  });

  test("bracket-bearing worksheet text blocks all generated output until corrected", async () => {
    const user = await ready({ location: "Normandy [/CENTER]" });
    const location = screen.getByRole("textbox", { name: "Location" });
    expect(location).toHaveValue("Normandy [/CENTER]");
    expect(location).toHaveAttribute("aria-invalid", "true");
    expect(location).toHaveAccessibleDescription(
      "Square brackets [ and ] are not allowed in recommendation text.",
    );
    expect(
      screen.queryByRole("region", { name: "Recommendation Preview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Recommendation Title"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Recommendation Body"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open Medal Recommendation Ticket" }),
    ).not.toBeInTheDocument();
    enter("Location", "Normandy");
    await submitRecommendation(user);
    expect(location).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Recommendation Body")).toHaveValue(body);
  });

  test.each(["", "   "])(
    "a selected recipient with blank username %j cannot reach export rendering",
    async (username) => {
      await ready({ recipient: makeRecipient({ user: { username } }) });
      const recipientField = screen.getByRole("textbox", { name: "Recipient" });
      expect(recipientField).toHaveAttribute("aria-invalid", "true");
      expect(recipientField).toHaveAccessibleDescription(
        /username is missing/i,
      );
      expect(
        screen.queryByRole("region", { name: "Recommendation Preview" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Recommendation Submission" }),
      ).not.toBeInTheDocument();
    },
  );

  test("DSSM pathway switching discards stale context and award changes clear submission", async () => {
    const user = userEvent.setup();
    renderClient({ medalFamily: "service", roster: [makeRecipient()] });
    await selectAward(user, "Defense Superior Service Medal");
    await selectRecipient(user);
    await selectComboboxOption(user, "Leadership Area", "Secondary Billet");
    enter("Role", "1IC");
    enter("Secondary Billet", "Military Police");
    await selectComboboxOption(user, "Service Start Month", "January");
    enter("Service Start Year", "2025");
    await selectComboboxOption(user, "Service End Month", "January");
    enter("Service End Year", "2026");
    enter(
      "Narrative",
      "leading the team. They completed their mission. Readiness improved.",
    );
    await submitRecommendation(user);
    expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
      "Medal Recommendation - Military Police - DSSM - SPC.Smith.J",
    );
    await selectComboboxOption(
      user,
      "Leadership Area",
      "Operations Leadership",
    );
    expect(
      screen.queryByLabelText("Recommendation Title"),
    ).not.toBeInTheDocument();
    enter("Operations Leadership", "AO Lead");
    enter("Operations AO", "Vietnam AO");
    await submitRecommendation(user);
    expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
      "Medal Recommendation - Vietnam AO - DSSM - SPC.Smith.J",
    );
    expect(screen.getByLabelText("Recommendation Body").value).not.toContain(
      "Military Police",
    );
    await selectAward(user, "Humanitarian Service Medal");
    expect(
      screen.queryByLabelText("Recommendation Title"),
    ).not.toBeInTheDocument();
    await submitRecommendation(user);
    expect(screen.getByLabelText("Recommendation Title")).toHaveValue(
      "Medal Recommendation - HSM - SPC.Smith.J",
    );
  });

  test("long titles truncate quietly while preview, body and warning highlights retain full prose", async () => {
    const user = await ready();
    enter("Operation Title", "Long ".repeat(70));
    enter(
      "Narrative",
      "Specialist John Smith led the the team!! The mission succeeded.",
    );
    await submitRecommendation(user);
    expect(screen.getByLabelText("Recommendation Title").value).toHaveLength(
      150,
    );
    expect(screen.getByLabelText("Recommendation Title").value).toMatch(
      /… - ARCOMV - SPC.Smith.J$/,
    );
    expect(getCitationText()).toContain(
      "Operation " + "Long ".repeat(70).trim(),
    );
    expect(getHighlightTexts()).toEqual(
      expect.arrayContaining(["the the", "!!"]),
    );
    expect(screen.getByLabelText("Recommendation Body").value).toContain(
      getCitationText(),
    );
    const submission = screen.getByRole("region", {
      name: "Recommendation Submission",
    });
    expect(within(submission).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(submission).queryByRole("status")).not.toBeInTheDocument();
    const titleField = within(submission).getByRole("textbox", {
      name: "Recommendation Title",
    });
    expect(titleField).not.toHaveAttribute("aria-invalid", "true");
    expect(titleField).not.toHaveAccessibleErrorMessage();
    expect(titleField).not.toHaveAccessibleDescription();
  });
});
