import { render, screen, within } from "@testing-library/react";
import MedalRecommendationPage from "../page";

describe("Medal Recommendation Aid landing page", () => {
  test("exposes the two worksheet families as accessible workflow links", () => {
    render(<MedalRecommendationPage />);

    expect(
      screen.getByRole("heading", { name: "Medal Recommendation Aid" }),
    ).toBeVisible();
    expect(
      screen.getByText("Create and review a medal recommendation."),
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
  });
});
