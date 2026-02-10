import { render } from "@testing-library/react";
import Home from "./page";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Home page", () => {
  it("redirects to /login", () => {
    render(<Home />);
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
