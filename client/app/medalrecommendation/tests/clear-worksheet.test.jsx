import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  enterWorksheetField as enter,
  fillOperationWorksheet,
  makeRecipient,
  makeRecipientRoster,
  renderClient,
  renderPageWithRoster,
  renderServiceClient,
  selectAward,
  selectComboboxOption,
  selectRecipient,
  selectAllRecipients,
  submitRecommendation,
} from "./test-helpers.js";

const narrative =
  "Specialist John Smith secured the crossing. The team repelled the attack. The mission succeeded.";

const operationValues = {
  combatElement: "a rifleman",
  operationTitle: "Overlord",
  location: "Normandy",
  operationDate: "2026-08-11",
  narrative,
};

async function clearWorksheet(user) {
  await user.click(screen.getByRole("button", { name: "Clear Worksheet" }));
  const dialog = screen.getByRole("dialog", { name: "Clear worksheet?" });
  await user.click(
    within(dialog).getByRole("button", { name: "Clear Worksheet" }),
  );
  expect(dialog).not.toBeInTheDocument();
}

function expectCleared() {
  expect(
    screen.getAllByRole("textbox", { name: /^Recipient(?: \d+)?$/ }),
  ).toHaveLength(1);
  expect(screen.getByRole("textbox", { name: "Recipient" })).toHaveValue("");
  expect(screen.getByLabelText("Narrative", { exact: true })).toHaveValue("");
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
  expect(
    screen.queryByRole("button", { name: /Cop(y|ied)/ }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("status", { name: "Narrative Warnings" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("Your generated recommendation will appear here."),
  ).toBeVisible();
}

describe("Clear Worksheet", () => {
  test.each([
    ["Operation", "Army Commendation Medal With Valor"],
    ["Service", "Superior Unit Award"],
  ])(
    "%s confirmation preserves the worksheet and export feedback until explicitly confirmed",
    async (family, award) => {
      const user = userEvent.setup();
      renderClient({
        medalFamily: family.toLowerCase(),
        roster: [makeRecipient()],
      });
      await selectAward(user, award);
      await selectRecipient(user);
      if (family === "Operation") {
        await fillOperationWorksheet(user, operationValues);
      } else {
        await selectComboboxOption(user, "Service / Contributions", "Service");
        enter("Benefitted Unit", "S3 Operations");
        enter("Awarded Department / Unit", "S6 Development");
        enter(
          "Narrative",
          "supporting training. The team completed every task. Readiness improved.",
        );
      }
      await submitRecommendation(user);
      vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
      await user.click(screen.getByRole("button", { name: "Copy Body" }));

      const trigger = screen.getByRole("button", { name: "Clear Worksheet" });
      const copied = screen.getByRole("button", { name: "Body Copied" });
      const preview = screen.getByRole("region", {
        name: "Recommendation Preview",
      });
      const citation = preview.textContent;
      const fields = [
        "Recipient",
        "Narrative",
        "Recommendation Title",
        "Recommendation Body",
        ...(family === "Operation"
          ? ["Combat Element", "Operation Title", "Location", "Operation Date"]
          : ["Benefitted Unit", "Awarded Department / Unit"]),
      ].map((label) => {
        const field = screen.getByLabelText(label, { exact: true });
        return [field, field.value];
      });
      function expectPreserved() {
        for (const [field, value] of fields) {
          expect(field).toBeInTheDocument();
          expect(field).toHaveValue(value);
        }
        expect(preview).toBeInTheDocument();
        expect(preview.textContent).toBe(citation);
        expect(copied).toBeInTheDocument();
      }

      for (const dismissal of ["Cancel", "Escape", "Close dialog"]) {
        await user.click(trigger);
        const dialog = screen.getByRole("dialog", { name: "Clear worksheet?" });
        expect(dialog).toHaveAccessibleName(/clear worksheet/i);
        expect(dialog).toHaveAccessibleDescription();
        expect(dialog).toHaveAccessibleDescription(/remove.*information/i);
        expect(dialog).toHaveAccessibleDescription(
          /selected medal.*(?:remain|preserv|unchanged)/i,
        );
        expect(
          within(dialog).getByRole("button", { name: "Cancel" }),
        ).toHaveFocus();
        expectPreserved();
        if (dismissal === "Escape") {
          await user.tab();
          expect(
            within(dialog).getByRole("button", { name: "Clear Worksheet" }),
          ).toHaveFocus();
          await user.keyboard("{Escape}");
        } else {
          await user.click(
            within(dialog).getByRole("button", { name: dismissal }),
          );
        }
        expect(dialog).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
        expectPreserved();
      }

      await clearWorksheet(user);
      expectCleared();
      expect(copied).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
        award,
      );
      if (family === "Service") {
        expect(
          screen.getByRole("combobox", { name: "Narrative Opening" }),
        ).toHaveTextContent("Distinguished");
      }
    },
  );

  test.each(["resolve", "reject"])(
    "Operation reset clears multiple recipients and export feedback, then ignores a late clipboard %s",
    async (outcome) => {
      const user = userEvent.setup();
      await renderPageWithRoster([
        makeRecipient(),
        makeRecipient({
          user: { userId: "2", username: "Doe.J" },
          realName: "Jane Doe",
        }),
      ]);
      const initialRequests = globalThis.fetch.mock.calls.slice();
      await selectAward(user, "Army Commendation Medal With Valor");
      const guidance = screen.getByRole("region", {
        name: "Award Guidance",
      }).textContent;
      await selectRecipient(user);
      await user.click(screen.getByRole("button", { name: "Add Recipient" }));
      enter("Recipient 2", "Doe");
      await user.click(
        screen.getByRole("button", { name: "Doe.J", exact: true }),
      );
      await fillOperationWorksheet(user, operationValues);
      await submitRecommendation(user);
      expect(screen.getByLabelText("Recommendation Title").value).toContain(
        "Operation Overlord",
      );
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      await user.click(screen.getByRole("button", { name: "Copy Body" }));
      expect(screen.getByRole("button", { name: "Body Copied" })).toBeVisible();
      let resolve, reject;
      write.mockReturnValueOnce(
        new Promise((done, fail) => {
          resolve = done;
          reject = fail;
        }),
      );
      await user.click(screen.getByRole("button", { name: "Copy Title" }));

      await clearWorksheet(user);
      expectCleared();
      expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
        "Army Commendation Medal With Valor",
      );
      expect(
        screen.getByRole("region", { name: "Award Guidance" }).textContent,
      ).toBe(guidance);
      for (const label of [
        "Combat Element",
        "Operation Title",
        "Location",
        "Operation Date",
      ]) {
        expect(screen.getByLabelText(label, { exact: true })).toHaveValue("");
      }
      await clearWorksheet(user);
      expectCleared();
      expect(globalThis.fetch.mock.calls).toEqual(initialRequests);

      await selectRecipient(user);
      await fillOperationWorksheet(user, {
        ...operationValues,
        operationTitle: "Fury",
      });
      await submitRecommendation(user);
      const title = screen.getByLabelText("Recommendation Title").value;
      const body = screen.getByLabelText("Recommendation Body").value;
      expect(title).toBe(
        "Medal Recommendation - Operation Fury - ARCOMV - SPC.Smith.J",
      );
      expect(body).toContain("Operation Fury");
      expect(body).not.toContain("Overlord");
      await act(async () => {
        if (outcome === "resolve") resolve();
        else reject(new Error("late clipboard failure"));
      });
      expect(screen.getByRole("button", { name: "Copy Title" })).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: "Title Copied" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Recommendation Title")).toHaveValue(title);
      expect(screen.getByLabelText("Recommendation Body")).toHaveValue(body);
      enter("Location", "Caen");
      expect(
        screen.queryByLabelText("Recommendation Body"),
      ).not.toBeInTheDocument();
    },
  );

  test("Service reset clears conditional fields, dates and copy failure while retaining the medal's required opening", async () => {
    const user = userEvent.setup();
    renderServiceClient({ roster: [makeRecipient()] });
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
      "leading the team. They completed the mission. Readiness improved.",
    );
    const requiredOpening = screen.getByText(
      /Specialist John Smith distinguished/,
    ).textContent;
    await submitRecommendation(user);
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    await user.click(screen.getByRole("button", { name: "Copy Body" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Copy failed");
    await clearWorksheet(user);
    expectCleared();
    expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
      "Defense Superior Service Medal",
    );
    expect(
      screen.getByRole("combobox", { name: "Leadership Area" }),
    ).not.toHaveTextContent("Secondary Billet");
    expect(
      screen.queryByLabelText("Secondary Billet", { exact: true }),
    ).not.toBeInTheDocument();
    for (const label of ["Service Start Year", "Service End Year"]) {
      expect(screen.getByLabelText(label)).toHaveValue("");
    }
    for (const label of ["Service Start Month", "Service End Month"]) {
      expect(
        screen.getByRole("combobox", { name: label }),
      ).not.toHaveTextContent("January");
    }
    await selectRecipient(user);
    expect(screen.getByText(requiredOpening)).toBeVisible();
    expect(screen.getByText(requiredOpening)).not.toHaveAttribute(
      "contenteditable",
    );
    await selectComboboxOption(user, "Leadership Area", "Secondary Billet");
    expect(screen.getByLabelText("Role", { exact: true })).toHaveValue("");
    expect(
      screen.getByLabelText("Secondary Billet", { exact: true }),
    ).toHaveValue("");
  });

  test("Operation Unit reset clears Bulk selection, search text, choices and validation without changing the four-recipient rule", async () => {
    const user = userEvent.setup();
    renderClient({ roster: makeRecipientRoster(4) });
    await selectAward(user, "Meritorious Unit Commendation");
    await selectAllRecipients(user);
    await selectComboboxOption(user, "Skillful / Heroic", "Heroic");
    enter("Combat Unit", "Alpha Squad");
    enter("Narrative", "A short narrative!!");
    enter("Recipient 4", "unfinished search");
    await submitRecommendation(user);
    expect(
      screen.getByText(
        "Complete all required fields before generating a recommendation.",
      ),
    ).toBeVisible();
    expect(
      screen.getByLabelText("Operation Title", { exact: true }),
    ).toHaveAttribute("aria-invalid", "true");
    await clearWorksheet(user);
    expectCleared();
    expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
      "Meritorious Unit Commendation",
    );
    expect(
      screen.getByRole("combobox", { name: "Skillful / Heroic" }),
    ).not.toHaveTextContent("Heroic");
    expect(screen.getByLabelText("Combat Unit", { exact: true })).toHaveValue(
      "",
    );
    expect(
      screen.getByLabelText("Operation Title", { exact: true }),
    ).not.toHaveAttribute("aria-invalid", "true");
    await user.click(
      screen.getByRole("button", { name: "Bulk Add Recipients" }),
    );
    for (const checkbox of within(screen.getByRole("dialog")).getAllByRole(
      "checkbox",
    )) {
      expect(checkbox).not.toBeChecked();
    }
    await user.click(
      screen.getByRole("button", { name: "Cancel", exact: true }),
    );
    await submitRecommendation(user);
    expect(
      screen.getByText(
        "At least 4 recipients are required for this Unit Award.",
      ),
    ).toBeVisible();
  });

  test("Service Unit reset clears compact Bulk recipients and restores the default group narrative starter", async () => {
    const user = userEvent.setup();
    renderServiceClient({ roster: makeRecipientRoster(9) });
    await selectAward(user, "Superior Unit Award");
    await selectAllRecipients(user);
    await user.click(screen.getByRole("button", { name: /\+ 1 more/ }));
    await selectComboboxOption(
      user,
      "Service / Contributions",
      "Contributions",
    );
    await selectComboboxOption(user, "Narrative Opening", "Contributed");
    enter("Benefitted Unit", "S3 Operations");
    enter("Awarded Department / Unit", "S6 Development");
    enter(
      "Narrative",
      "supporting training. The team completed every task. Readiness improved.",
    );
    await submitRecommendation(user);
    expect(screen.getByLabelText("Recommendation Body").value).toContain(
      "S6 Development contributed themselves by",
    );
    await clearWorksheet(user);
    expectCleared();
    expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
      "Superior Unit Award",
    );
    expect(
      screen.queryByRole("button", { name: "Show less" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Service / Contributions" }),
    ).not.toHaveTextContent("Contributions");
    expect(
      screen.getByRole("combobox", { name: "Narrative Opening" }),
    ).toHaveTextContent("Distinguished");
    for (const label of ["Benefitted Unit", "Awarded Department / Unit"]) {
      expect(screen.getByLabelText(label, { exact: true })).toHaveValue("");
    }
    enter("Awarded Department / Unit", "New Section");
    expect(
      screen.getByText("New Section distinguished themselves by"),
    ).toBeVisible();
    expect(
      screen.queryByText(/S6 Development contributed/),
    ).not.toBeInTheDocument();
  });
});
