import { render, screen } from "@testing-library/react";
import LandingPage from "./page";

vi.mock("@/components/ui/hero-ascii", () => ({
  default: ({ isDark }: { isDark?: boolean }) => (
    <div data-testid="hero-ascii" data-dark={isDark} />
  ),
}));

vi.mock("@/components/ui/landing-sections", () => ({
  default: ({ isDark }: { isDark?: boolean }) => (
    <div data-testid="landing-sections" data-dark={isDark} />
  ),
}));

describe("Home page", () => {
  it("renders the hero and landing sections", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("hero-ascii")).toBeDefined();
    expect(screen.getByTestId("landing-sections")).toBeDefined();
  });

  it("passes isDark=true to child components by default", () => {
    render(<LandingPage />);
    expect(screen.getByTestId("hero-ascii").getAttribute("data-dark")).toBe("true");
    expect(screen.getByTestId("landing-sections").getAttribute("data-dark")).toBe("true");
  });
});
