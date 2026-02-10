import { redirect } from "next/navigation";
import Home from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Home page", () => {
  it("redirects to /login", () => {
    Home();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
