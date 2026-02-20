import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "./Input";

describe("Input", () => {
  it("renders without label", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("associates label with input via auto-generated id", () => {
    render(<Input label="Full Name" />);
    const input = screen.getByLabelText("Full Name");
    expect(input).toHaveAttribute("id", "full-name");
  });

  it("uses provided id over auto-generated one", () => {
    render(<Input label="Email" id="custom-email-id" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "custom-email-id");
  });

  it("renders error message", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("sets aria-invalid when error is provided", () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("sets aria-describedby pointing to error element", () => {
    render(<Input label="Email" error="Required" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
    expect(screen.getByText("Required")).toHaveAttribute("id", "email-error");
  });

  it("does not set aria-invalid when no error", () => {
    render(<Input label="Email" />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("applies error border styles when error provided", () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByRole("textbox").className).toMatch(/border-red-500/);
  });

  it("applies normal border styles when no error", () => {
    render(<Input label="Email" />);
    expect(screen.getByRole("textbox").className).toMatch(/border-gray-300/);
  });

  it("accepts user input", async () => {
    render(<Input label="Name" />);
    const input = screen.getByLabelText("Name");
    await userEvent.type(input, "John");
    expect(input).toHaveValue("John");
  });

  it("calls onChange when typing", async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    await userEvent.type(screen.getByRole("textbox"), "a");
    expect(handleChange).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders password type input", () => {
    render(<Input label="Password" type="password" />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("merges custom className", () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole("textbox").className).toMatch(/custom-class/);
  });
});
