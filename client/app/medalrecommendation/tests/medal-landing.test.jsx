import { render, screen, within } from "@testing-library/react";
import MedalRecommendationPage from "../page";

describe("Medal Recommendation Aid landing page", () => {
  test("exposes the two worksheet families as accessible workflow links", () => {
    render(<MedalRecommendationPage />);

    expect(
      screen.getByRole("heading", { name: "Medal Recommendation Aid" }),
    ).toBeVisible();
    expect(
      screen.getByText("Making Medal Recommendations Easier"),
    ).toBeVisible();

    const operationLink = screen.getByRole("link", {
      name: /Operation Medals/i,
    });
    const serviceLink = screen.getByRole("link", {
      name: /Service Medals/i,
    });

    expect(operationLink).toHaveAttribute(
      "href",
      "/medalrecommendation/operation",
    );
    expect(serviceLink).toHaveAttribute("href", "/medalrecommendation/service");

    expect(
      within(operationLink).getByRole("heading", {
        name: "Operation Medals",
      }),
    ).toBeVisible();
    expect(
      within(operationLink).getByText(
        "Create recommendations recognizing actions performed during operations.",
      ),
    ).toBeVisible();
    expect(
      within(serviceLink).getByRole("heading", { name: "Service Medals" }),
    ).toBeVisible();
    expect(
      within(serviceLink).getByText(
        "Create recommendations recognizing service and contributions to the Regiment.",
      ),
    ).toBeVisible();

    const howTo = screen.getByRole("link", { name: "How to Use This Tool" });
    expect(howTo).toHaveAttribute("href", "/medalrecommendation/how-to-use");
    expect(howTo).not.toHaveAttribute("aria-disabled", "true");
    expect(howTo).not.toHaveAttribute("disabled");
    for (const [link, asset] of [
      [operationLink, "bronze-star.png"],
      [serviceLink, "distinguished-service-medal.png"],
    ]) {
      const medal = within(link).getByRole("presentation", { hidden: true });
      const imageUrl = new URL(medal.getAttribute("src"), "http://localhost");
      expect(imageUrl.pathname).toBe("/_next/image");
      expect(imageUrl.searchParams.get("url")).toBe(
        `/medalrecommendation/${asset}`,
      );
      expect(medal).toHaveAttribute("alt", "");
      expect(
        link.compareDocumentPosition(howTo) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
});
