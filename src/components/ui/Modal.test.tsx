import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

describe("Modal", () => {
  it("does not render content when closed", () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()}>
        <Modal.Content>
          <Modal.Title>Hidden Modal</Modal.Title>
        </Modal.Content>
      </Modal>
    );
    expect(screen.queryByText("Hidden Modal")).not.toBeInTheDocument();
  });

  it("renders content when open", () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        <Modal.Content>
          <Modal.Title>Open Modal</Modal.Title>
        </Modal.Content>
      </Modal>
    );
    expect(screen.getByText("Open Modal")).toBeInTheDocument();
  });

  it("renders Modal.Description when open", () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        <Modal.Content>
          <Modal.Title>Title</Modal.Title>
          <Modal.Description>Some description</Modal.Description>
        </Modal.Content>
      </Modal>
    );
    expect(screen.getByText("Some description")).toBeInTheDocument();
  });

  it("renders close button inside content", () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        <Modal.Content>
          <Modal.Title>Title</Modal.Title>
        </Modal.Content>
      </Modal>
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal open={true} onOpenChange={onOpenChange}>
        <Modal.Content>
          <Modal.Title>Title</Modal.Title>
        </Modal.Content>
      </Modal>
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders Modal.Footer with children", () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        <Modal.Content>
          <Modal.Title>Title</Modal.Title>
          <Modal.Footer>
            <button>Cancel</button>
            <button>Confirm</button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("renders a trigger button that opens the modal", async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal open={false} onOpenChange={onOpenChange}>
        <Modal.Trigger>
          <button>Open</button>
        </Modal.Trigger>
        <Modal.Content>
          <Modal.Title>Title</Modal.Title>
        </Modal.Content>
      </Modal>
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("renders Modal.Title with correct heading styles", () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()}>
        <Modal.Content>
          <Modal.Title>My Modal</Modal.Title>
        </Modal.Content>
      </Modal>
    );
    const title = screen.getByText("My Modal");
    expect(title.className).toMatch(/font-semibold/);
  });

  it("renders Modal.Close wrapping a button that triggers onOpenChange", async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal open={true} onOpenChange={onOpenChange}>
        <Modal.Content>
          <Modal.Title>Title</Modal.Title>
          <Modal.Footer>
            <Modal.Close>
              <button>Cancel</button>
            </Modal.Close>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
