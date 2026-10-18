import { render, screen, within } from "@testing-library/react";
import MedalHowToUsePage from "../how-to-use/page";

describe("Medal Recommendation How to Use guide", () => {
  test("renders the guide heading, introduction section, and external SOP link", () => {
    render(<MedalHowToUsePage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "How to Use This Tool" }),
    ).toBeVisible();
    const introduction = screen.getByRole("region", {
      name: "Before You Begin",
    });
    expect(introduction).toBeVisible();
    const sop = within(introduction).getByRole("link", {
      name: "Awards & Decorations SOP",
    });
    expect(sop).toHaveAttribute(
      "href",
      "https://wiki.7cav.us/wiki/Awards_and_Decorations",
    );
    expect(sop).toHaveAttribute("target", "_blank");
    expect(sop.rel.split(/\s+/)).toEqual(
      expect.arrayContaining(["noopener", "noreferrer"]),
    );
  });

  test("presents exactly seven ordered steps with user responsibilities before tool responsibilities", () => {
    render(<MedalHowToUsePage />);
    const orderedSteps = screen.getByRole("list", {
      name: "Recommendation steps",
    });
    expect(orderedSteps.tagName).toBe("OL");
    const steps = within(orderedSteps).getAllByRole("listitem");
    expect(steps).toHaveLength(7);
    steps.forEach((step) => {
      const heading = within(step).getByRole("heading", { level: 2 });
      expect(heading).toBeVisible();
      expect(heading).toHaveAccessibleName();
      const responsibilities = within(step).getAllByRole("heading", {
        level: 3,
      });
      expect(responsibilities.map((heading) => heading.textContent)).toEqual([
        "What You Do",
        "What the Tool Does",
      ]);
      for (const name of ["What You Do", "What the Tool Does"]) {
        expect(within(step).getByRole("region", { name })).toBeVisible();
      }
    });
  });

  test("provides feature-home links above the guide and after the final step", () => {
    render(<MedalHowToUsePage />);
    const top = screen.getByRole("link", {
      name: "Medal Recommendation Aid",
      exact: true,
    });
    const bottom = screen.getByRole("link", {
      name: "Return to Home",
      exact: true,
    });
    const steps = screen.getByRole("list", { name: "Recommendation steps" });
    for (const link of [top, bottom]) {
      expect(link).toHaveAttribute("href", "/medalrecommendation");
      expect(within(link).queryByRole("button")).not.toBeInTheDocument();
    }
    expect(
      top.compareDocumentPosition(steps) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      steps.compareDocumentPosition(bottom) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
