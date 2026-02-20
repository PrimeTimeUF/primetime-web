import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("defaults to primary variant", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/bg-black/);
    expect(btn.className).toMatch(/text-white/);
  });

  it("applies secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/bg-gray-100/);
    expect(btn.className).toMatch(/text-black/);
  });

  it("applies ghost variant styles", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toMatch(/bg-transparent/);
  });

  it("applies sm size styles", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button").className).toMatch(/text-xs/);
  });

  it("applies lg size styles", () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button").className).toMatch(/text-base/);
  });

  it("applies full width when fullWidth is true", () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByRole("button").className).toMatch(/w-full/);
  });

  it("does not apply w-full by default", () => {
    render(<Button>Normal</Button>);
    expect(screen.getByRole("button").className).not.toMatch(/w-full/);
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("disables the button when isLoading is true", () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables the button when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders iconBefore when provided", () => {
    render(<Button iconBefore={<span data-testid="icon-before" />}>With Icon</Button>);
    expect(screen.getByTestId("icon-before")).toBeInTheDocument();
  });

  it("renders iconAfter when provided", () => {
    render(<Button iconAfter={<span data-testid="icon-after" />}>With Icon</Button>);
    expect(screen.getByTestId("icon-after")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole("button").className).toMatch(/custom-class/);
  });

  it("forwards button type attribute", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
