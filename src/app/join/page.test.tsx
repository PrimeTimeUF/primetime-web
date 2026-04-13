import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JoinPage from "./page";

const mockPush = vi.fn();
const mockGetParam = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGetParam }),
}));

global.fetch = vi.fn();

describe("JoinPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error when code is missing", async () => {
    mockGetParam.mockReturnValue(null);

    render(<JoinPage />);

    await waitFor(() => {
      expect(screen.getByText(/Missing invitation code/i)).toBeInTheDocument();
    });
  });

  it("joins successfully and redirects to /student", async () => {
    const user = userEvent.setup();
    const timeoutSpy = vi.spyOn(global, "setTimeout");
    mockGetParam.mockReturnValue("abc123");
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    } as Response);

    render(<JoinPage />);
    await user.click(screen.getByRole("button", { name: /JOIN COURSE/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/enrollments", expect.objectContaining({ method: "POST" }));
      expect(screen.getByText(/Successfully joined/i)).toBeInTheDocument();
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1200);
    });
    timeoutSpy.mockRestore();
  });

  it("shows login guidance for unauthenticated users", async () => {
    const user = userEvent.setup();
    mockGetParam.mockReturnValue("abc123");
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    } as Response);

    render(<JoinPage />);
    await user.click(screen.getByRole("button", { name: /JOIN COURSE/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please log in as a student/i)).toBeInTheDocument();
    });
  });
});
