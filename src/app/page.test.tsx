import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders without crashing", () => {
    render(<Home />);
    expect(screen.getByText("Primary Button")).toBeInTheDocument();
  });
});
