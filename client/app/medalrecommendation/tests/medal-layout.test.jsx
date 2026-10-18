import { render, screen, within } from "@testing-library/react";
import MedalRecommendationLayout from "../layout";
import MedalRecommendationPage from "../page";
import OperationPage from "../operation/page";
import ServicePage from "../service/page";
import HowToUsePage from "../how-to-use/page";
import Logo from "../../theme/adrLogo";
import { mockMedalPageFetch } from "./test-helpers.js";

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
        within(banner).getByLabelText("Medal Recommendation Aid"),
      ).toBeInTheDocument();
      expect(
        within(banner).getByRole("link", {
          name: /7th Cavalry Gaming.*Return to CavApps/,
        }),
      ).toHaveAttribute("href", "/");
      expect(screen.getAllByRole("main")).toHaveLength(1);
    },
  );

  test("switches between outlined ADR and Medal subtitles while retaining the vector wordmark", () => {
    const { container, rerender } = render(<Logo />);
    const expectOutlinedArtwork = (label) => {
      const artwork = screen.getByLabelText(label);
      expect(artwork.querySelector("path")).toHaveAttribute(
        "d",
        expect.stringMatching(/\S/),
      );
      expect(artwork.querySelector("text")).not.toBeInTheDocument();
    };

    expectOutlinedArtwork("Active Duty Roster");
    expectOutlinedArtwork("7TH CAVALRY GAMING");
    expect(
      screen.queryByLabelText("Medal Recommendation Aid"),
    ).not.toBeInTheDocument();

    rerender(<Logo subtitle="Medal Recommendation Aid" />);
    expectOutlinedArtwork("Medal Recommendation Aid");
    expectOutlinedArtwork("7TH CAVALRY GAMING");
    expect(
      screen.queryByLabelText("Active Duty Roster"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("text")).not.toBeInTheDocument();

    rerender(<Logo />);
    expectOutlinedArtwork("Active Duty Roster");
    expectOutlinedArtwork("7TH CAVALRY GAMING");
    expect(
      screen.queryByLabelText("Medal Recommendation Aid"),
    ).not.toBeInTheDocument();
  });

  test("other custom subtitles and SVG props retain their existing behavior", () => {
    const { container } = render(
      <Logo subtitle="Custom subtitle" width="250" height="50" />,
    );
    expect(screen.getByText("Custom subtitle").tagName).toBe("text");
    expect(container.querySelector("svg")).toHaveAttribute("width", "250");
    expect(container.querySelector("svg")).toHaveAttribute("height", "50");
    expect(
      container.querySelector('[aria-label="Active Duty Roster"]'),
    ).not.toBeInTheDocument();
  });
});
