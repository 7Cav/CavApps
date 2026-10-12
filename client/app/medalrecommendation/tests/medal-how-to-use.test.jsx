import { render, screen, within } from "@testing-library/react";
import MedalHowToUsePage from "../how-to-use/page";

describe("Medal Recommendation How to Use guide", () => {
  test("introduces the guide with the approved approval, follow-up, and SOP guidance", () => {
    render(<MedalHowToUsePage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "How to Use This Tool" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "A step-by-step guide to preparing and submitting a medal recommendation.",
      ),
    ).toBeVisible();

    const introduction = screen.getByRole("region", {
      name: "Before You Begin",
    });
    expect(
      within(introduction).getByText(
        "The Medal Recommendation Aid helps you prepare a recommendation, but successfully generating one does not guarantee approval. All recommendations remain subject to the Regiment's eligibility requirements, review, and approval procedures. After submitting your recommendation, you may be asked to provide supporting evidence, additional justification, or witnesses, so be sure to monitor your ticket and respond to any follow-up requests.",
      ),
    ).toBeVisible();
    expect(introduction).toHaveTextContent(
      "Before starting, familiarize yourself with the current Awards & Decorations SOP on the 7th Cavalry Wiki. If you have questions about eligibility, award selection, or submission procedures, consult your chain of command.",
    );
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
    const steps = within(
      screen.getByRole("list", { name: "Recommendation steps" }),
    ).getAllByRole("listitem");
    const titles = [
      "Select a Medal",
      "Review the Medal Requirements",
      "Select Your Recipients",
      "Complete the Worksheet",
      "Write Your Narrative",
      "Generate and Review Your Recommendation",
      "Submit Your Recommendation",
    ];
    expect(steps).toHaveLength(7);
    steps.forEach((step, index) => {
      expect(within(step).getByRole("heading", { level: 2 })).toHaveTextContent(
        `Step ${index + 1}${titles[index]}`,
      );
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
      expect(within(step).queryByRole("link")).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/Clear Worksheet/i)).not.toBeInTheDocument();
  });

  test("preserves article guidance, conditional Service starters, and the manual submission boundary", () => {
    render(<MedalHowToUsePage />);
    const steps = within(
      screen.getByRole("list", { name: "Recommendation steps" }),
    ).getAllByRole("listitem");
    expect(steps[3]).toHaveTextContent(
      'Some entries become part of a generated sentence and may require you to include the appropriate article, such as "a" or "an." Pay close attention to each field\'s placeholder text and ensure your entries make grammatical sense.',
    );
    expect(steps[4]).toHaveTextContent(
      "For Service Medals that provide a required sentence starter, continue directly from the displayed text. Do not repeat the starter or begin an unrelated sentence. Your narrative should complete the opening naturally.",
    );
    expect(steps[5]).toHaveTextContent(
      "Generating a recommendation does not submit it or indicate approval.",
    );
    expect(steps[6]).toHaveTextContent(
      "Copy the generated Recommendation Title, then select Open Medal Recommendation Ticket. Paste the title into the appropriate ticket field.",
    );
    expect(steps[6]).toHaveTextContent(
      "Return to the Aid, copy the Recommendation Body, and paste it into the ticket's message field. Review the completed ticket before submitting it through the forums.",
    );
    expect(steps[6]).toHaveTextContent(
      "The Aid does not automatically create, send, or submit the ticket. You must complete the final submission yourself.",
    );
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
