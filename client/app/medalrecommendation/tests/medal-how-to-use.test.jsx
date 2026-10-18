import { render, screen, within } from "@testing-library/react";
import MedalHowToUsePage from "../how-to-use/page";

describe("Medal Recommendation How to Use guide", () => {
  test("explains eligibility, approval, follow-up responsibilities and links to the SOP", () => {
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
    expect(introduction).toHaveTextContent(
      /does not.*eligibility.*guarantee approval/i,
    );
    expect(introduction).toHaveTextContent(/comply.*Awards & Decorations SOP/i);
    expect(introduction).toHaveTextContent(/subject to review and approval/i);
    expect(introduction).toHaveTextContent(
      /monitor.*ticket.*respond promptly/i,
    );
    expect(introduction).toHaveTextContent(/supporting evidence.*corrections/i);
    expect(introduction).toHaveTextContent(
      /questions.*eligibility.*award selection.*submission.*chain of command/i,
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
    });
  });

  test("preserves article guidance, conditional Service starters, and the manual submission boundary", () => {
    render(<MedalHowToUsePage />);
    const steps = within(
      screen.getByRole("list", { name: "Recommendation steps" }),
    ).getAllByRole("listitem");
    expect(steps[3]).toHaveTextContent(/article.*\ba\b.*\ban\b/i);
    expect(steps[3]).toHaveTextContent(/placeholder.*grammatical/i);
    expect(steps[4]).toHaveTextContent(/Service Medals.*sentence starter/i);
    expect(steps[4]).toHaveTextContent(/continue directly.*displayed text/i);
    expect(steps[4]).toHaveTextContent(/do not repeat the starter/i);
    expect(steps[5]).toHaveTextContent(
      /generating.*does not submit.*approval/i,
    );
    expect(steps[6]).toHaveTextContent(
      /copy.*Recommendation Title.*Open Medal Recommendation Ticket.*paste.*title/i,
    );
    expect(steps[6]).toHaveTextContent(
      /return to the Aid.*copy.*Recommendation Body.*paste.*message field/i,
    );
    expect(steps[6]).toHaveTextContent(/BBCode-formatted Body/i);
    expect(steps[6]).toHaveTextContent(/review.*ticket.*before submitting/i);
    expect(steps[6]).toHaveTextContent(/does not automatically.*submit/i);
    expect(steps[6]).toHaveTextContent(/final submission yourself/i);
  });

  test("explains recommender authority, restricted exceptions and distinct combat and service deadlines", () => {
    render(<MedalHowToUsePage />);
    const requirements = within(
      screen.getByRole("region", {
        name: /Review the Medal Requirements$/,
      }),
    ).getByRole("region", { name: "What You Do" });
    expect(requirements).toHaveTextContent(
      /outrank the recipient by Regiment billet/i,
    );
    expect(requirements).toHaveTextContent(/witnessed the action/i);
    expect(requirements).toHaveTextContent(
      /temporary operation billets do not override Regiment billets/i,
    );
    expect(requirements).toHaveTextContent(
      /lower- or equal-billet.*superiors.*combat medals/i,
    );
    expect(requirements).toHaveTextContent(
      /three independent eyewitness statements/i,
    );
    expect(requirements).toHaveTextContent(/operation's OIC approval/i);
    expect(requirements).toHaveTextContent(
      /submitting on someone else's behalf/i,
    );
    expect(requirements).toHaveTextContent(
      /link the original author's MILPAC/i,
    );
    expect(requirements).toHaveTextContent(/state that they have signed off/i);
    expect(requirements).toHaveTextContent(
      /accept responsibility.*recommendation.*compliance with medal standards/i,
    );
    expect(requirements).toHaveTextContent(/SOP.*chain of command.*exception/i);
    expect(requirements).toHaveTextContent(
      /Combat Medal.*one week.*After Action Report \(AAR\) posting/i,
    );
    expect(requirements).toHaveTextContent(
      /Service Medals.*action.*last 30 days.*waived.*Chief of Staff \(COS\).*designate/i,
    );
    expect(requirements).toHaveTextContent(
      /medal's criteria.*narrative guidance.*eligibility guidance/i,
    );
    expect(
      screen.getByRole("region", { name: /Review the Medal Requirements$/ }),
    ).toHaveTextContent(
      /cannot independently determine.*deserves an award.*eligibility/i,
    );
  });

  test("requires review of nonblocking warnings and directs copying to the Title and Body controls", () => {
    render(<MedalHowToUsePage />);
    const review = within(
      screen.getByRole("region", {
        name: /Generate and Review Your Recommendation$/,
      }),
    ).getByRole("region", { name: "What You Do" });
    expect(review).toHaveTextContent(
      /review all validation warnings.*do not prevent.*generated/i,
    );
    expect(review).toHaveTextContent(/do not copy.*Recommendation Preview/i);
    expect(review).toHaveTextContent(
      /use.*Recommendation Title.*Recommendation Body copy controls/i,
    );
    expect(review).toHaveTextContent(/corrections.*generate.*again/i);
  });

  test("places witness information and the egregious-error correction deadline in submission guidance", () => {
    render(<MedalHowToUsePage />);
    const submission = within(
      screen.getByRole("region", { name: /Submit Your Recommendation$/ }),
    ).getByRole("region", { name: "What You Do" });
    expect(submission).toHaveTextContent(/include the names.*witnesses/i);
    expect(submission).toHaveTextContent(
      /supporting witness statements required by the SOP/i,
    );
    expect(submission).toHaveTextContent(/does not collect.*automatically/i);
    expect(submission).toHaveTextContent(
      /S1.*egregious errors.*up to three days.*correct.*ticket is closed/i,
    );
    expect(submission).toHaveTextContent(/monitor.*ticket.*corrections/i);
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
