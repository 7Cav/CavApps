import { render, screen, within } from "@testing-library/react";
import MedalRecommendationLayout from "../layout";
import MedalRecommendationPage from "../page";
import OperationPage from "../operation/page";
import ServicePage from "../service/page";
import HowToUsePage from "../how-to-use/page";
import Logo from "../../theme/adrLogo";
import { mockMedalPageFetch } from "./test-helpers.js";

// Next.js loads fonts at build time; these tests exercise page behavior.
vi.mock("next/font/google", () => ({ Oswald: () => ({ className: "" }) }));

// The legacy SVG uses JSX in a .js file. Compile that real source with the
// existing Vite transformer here, without changing the application's test setup.
vi.mock("../../theme/adrLogo", async () => {
  const React = await import("react");
  const { default: source } = await import("../../theme/adrLogo.js?raw");
  const { transformWithOxc } = await import("vite");
  const { code } = await transformWithOxc(source, "adrLogo.jsx", {
    lang: "jsx",
    jsx: { runtime: "classic" },
  });
  const component = code
    .replace(/import \* as React from ["']react["'];/, "")
    .replace("export default Logo;", "return Logo;");
  return { default: new Function("React", component)(React) };
});

describe("Medal Recommendation shared branding", () => {
  test.each([
    ["landing", MedalRecommendationPage],
    ["Operation", OperationPage],
    ["Service", ServicePage],
    ["How to Use", HowToUsePage],
  ])(
    "%s route renders one branded banner returning to CavApps",
    async (_name, Page) => {
      mockMedalPageFetch();
      render(
        <MedalRecommendationLayout>{await Page()}</MedalRecommendationLayout>,
      );
      const banner = screen.getByRole("banner", { name: "CavApps" });
      expect(screen.getAllByRole("banner", { name: "CavApps" })).toHaveLength(
        1,
      );
      expect(
        within(banner).getByText("Medal Recommendation Aid"),
      ).toBeInTheDocument();
      expect(
        within(banner).getByRole("link", {
          name: /7th Cavalry Gaming.*Return to CavApps/,
        }),
      ).toHaveAttribute("href", "/");
      expect(screen.getAllByRole("main")).toHaveLength(1);
    },
  );

  test("the original ADR and Roster History subtitle remains vector artwork without an override", () => {
    const { container, rerender } = render(<Logo />);
    const original = container.querySelector(
      '[aria-label="Active Duty Roster"]',
    );
    expect(original).toBeInTheDocument();
    expect(original.querySelector("path")).toBeInTheDocument();
    const originalSubtitle = original.outerHTML;
    const wordmark = container.querySelector(
      '[aria-label="7TH CAVALRY GAMING"]',
    ).outerHTML;
    rerender(<Logo subtitle="Medal Recommendation Aid" />);
    expect(screen.getByText("Medal Recommendation Aid")).toBeInTheDocument();
    expect(
      container.querySelector('[aria-label="Active Duty Roster"]'),
    ).toBeNull();
    expect(
      container.querySelector('[aria-label="7TH CAVALRY GAMING"]').outerHTML,
    ).toBe(wordmark);
    rerender(<Logo />);
    expect(
      container.querySelector('[aria-label="Active Duty Roster"]').outerHTML,
    ).toBe(originalSubtitle);
  });
});
