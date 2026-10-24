import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderClient,
  renderServiceClient,
  selectAward,
  selectServiceAward,
} from "./test-helpers.js";

describe.each([
  [
    "Operation",
    renderClient,
    selectAward,
    "Operation Medal Recommendation",
    "Prepare a recommendation to recognize a fellow trooper.",
    "Select an Operation Medal",
  ],
  [
    "Service",
    renderServiceClient,
    selectServiceAward,
    "Service Medal Recommendation",
    "Prepare a recommendation to recognize a fellow trooper.",
    "Select a Service Medal",
  ],
])(
  "%s Medal worksheet navigation",
  (
    _family,
    renderWorksheet,
    selectMedal,
    pageTitle,
    pageDescription,
    awardPlaceholder,
  ) => {
    test("provides a reliable return route to medal selection", () => {
      renderWorksheet();

      expect(
        screen.getByRole("link", { name: "Medal Recommendation Aid" }),
      ).toHaveAttribute("href", "/medalrecommendation");
    });

    test("renders the family header and shared workbench structure", async () => {
      const user = userEvent.setup();
      renderWorksheet();

      expect(screen.getByRole("heading", { name: pageTitle })).toBeVisible();
      expect(
        screen.queryByText(`${_family} Medals`, { exact: true }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(pageDescription)).toBeVisible();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Recommendation Worksheet",
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Recommendation Output",
        }),
      ).toBeVisible();
      for (const name of ["Status", "Recommendation Preview"]) {
        expect(screen.getByRole("heading", { level: 3, name })).toBeVisible();
      }
      expect(
        screen.getByText("Your generated recommendation will appear here."),
      ).toBeVisible();

      const award = screen.getByRole("combobox", { name: "Award" });
      await selectMedal(user);

      const guidance = screen.getByRole("heading", {
        name: "Award Guidance",
      });
      const recipient = screen.getByRole("textbox", { name: "Recipient" });

      expect(award.compareDocumentPosition(guidance)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(guidance.compareDocumentPosition(recipient)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    test("renders the family-specific Award placeholder", () => {
      renderWorksheet();

      expect(screen.getByRole("combobox", { name: "Award" })).toHaveTextContent(
        awardPlaceholder,
      );
    });
  },
);
