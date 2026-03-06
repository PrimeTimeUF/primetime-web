import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AudioPlayer from "./AudioPlayer";

// Mock HTMLAudioElement methods
let audioHandlers: Record<string, (() => void)[]> = {};
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  audioHandlers = {};

  vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(mockPlay);
  vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(mockPause);

  Object.defineProperty(window.HTMLMediaElement.prototype, "duration", {
    get: () => 120,
    configurable: true,
  });

  Object.defineProperty(window.HTMLMediaElement.prototype, "currentTime", {
    get: () => 0,
    set: vi.fn(),
    configurable: true,
  });
});

describe("AudioPlayer", () => {
  it("renders the 'Listen Instead' heading", () => {
    render(<AudioPlayer src="/test.mp3" />);
    expect(screen.getByText("Listen Instead")).toBeInTheDocument();
  });

  it("renders play button with loading text initially", () => {
    render(<AudioPlayer src="/test.mp3" />);
    expect(screen.getByText("Loading audio...")).toBeInTheDocument();
  });

  it("shows 'Play Audio Version' after metadata loads", () => {
    render(<AudioPlayer src="/test.mp3" />);
    const audio = document.querySelector("audio")!;
    act(() => {
      fireEvent.loadedMetadata(audio);
    });
    expect(screen.getByText("Play Audio Version")).toBeInTheDocument();
  });

  it("disables play button while loading", () => {
    render(<AudioPlayer src="/test.mp3" />);
    const button = screen.getByRole("button", { name: /loading audio/i });
    expect(button).toBeDisabled();
  });

  it("enables play button after metadata loads", () => {
    render(<AudioPlayer src="/test.mp3" />);
    const audio = document.querySelector("audio")!;
    act(() => {
      fireEvent.loadedMetadata(audio);
    });
    const button = screen.getByRole("button", { name: /play audio version/i });
    expect(button).not.toBeDisabled();
  });

  it("renders all speed buttons", () => {
    render(<AudioPlayer src="/test.mp3" />);
    expect(screen.getByText("1x")).toBeInTheDocument();
    expect(screen.getByText("1.25x")).toBeInTheDocument();
    expect(screen.getByText("1.5x")).toBeInTheDocument();
    expect(screen.getByText("2x")).toBeInTheDocument();
  });

  it("highlights 1x speed by default", () => {
    render(<AudioPlayer src="/test.mp3" />);
    const btn1x = screen.getByText("1x");
    expect(btn1x).toHaveClass("bg-black", "text-white");
  });

  it("switches highlighted speed button on click", async () => {
    render(<AudioPlayer src="/test.mp3" />);
    const btn2x = screen.getByText("2x");
    await act(async () => {
      fireEvent.click(btn2x);
    });
    expect(btn2x).toHaveClass("bg-black", "text-white");
    expect(screen.getByText("1x")).not.toHaveClass("bg-black");
  });

  it("renders time display as 0:00 initially", () => {
    render(<AudioPlayer src="/test.mp3" />);
    const timeDisplays = screen.getAllByText("0:00");
    expect(timeDisplays.length).toBeGreaterThanOrEqual(1);
  });

  it("sets audio src attribute", () => {
    render(<AudioPlayer src="/test-audio.mp3" />);
    const audio = document.querySelector("audio")!;
    expect(audio.getAttribute("src")).toBe("/test-audio.mp3");
  });

  it("calls play on click after loading", async () => {
    render(<AudioPlayer src="/test.mp3" />);
    const audio = document.querySelector("audio")!;
    act(() => {
      fireEvent.loadedMetadata(audio);
    });
    const button = screen.getByRole("button", { name: /play audio version/i });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(mockPlay).toHaveBeenCalled();
  });

  it("shows Pause text after playing", async () => {
    render(<AudioPlayer src="/test.mp3" />);
    const audio = document.querySelector("audio")!;
    act(() => {
      fireEvent.loadedMetadata(audio);
    });
    const button = screen.getByRole("button", { name: /play audio version/i });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("renders Speed label", () => {
    render(<AudioPlayer src="/test.mp3" />);
    expect(screen.getByText("Speed:")).toBeInTheDocument();
  });
});
