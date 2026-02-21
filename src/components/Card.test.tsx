import { render, screen } from "@testing-library/react";
import Card from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies default styles", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toMatch(/rounded-xl/);
    expect(card.className).toMatch(/border/);
    expect(card.className).toMatch(/bg-white/);
  });

  it("merges custom className", () => {
    render(<Card data-testid="card" className="custom-class">Content</Card>);
    expect(screen.getByTestId("card").className).toMatch(/custom-class/);
  });

  describe("Card.Header", () => {
    it("renders children", () => {
      render(<Card.Header>Header Content</Card.Header>);
      expect(screen.getByText("Header Content")).toBeInTheDocument();
    });

    it("applies margin-bottom styles", () => {
      render(<Card.Header data-testid="header">Header</Card.Header>);
      expect(screen.getByTestId("header").className).toMatch(/mb-4/);
    });

    it("merges custom className", () => {
      render(<Card.Header data-testid="header" className="custom-header">Header</Card.Header>);
      expect(screen.getByTestId("header").className).toMatch(/custom-header/);
    });
  });

  describe("Card.Title", () => {
    it("renders as h3", () => {
      render(<Card.Title>My Title</Card.Title>);
      expect(screen.getByRole("heading", { level: 3, name: "My Title" })).toBeInTheDocument();
    });

    it("applies title styles", () => {
      render(<Card.Title>Title</Card.Title>);
      expect(screen.getByRole("heading").className).toMatch(/font-semibold/);
    });
  });

  describe("Card.Description", () => {
    it("renders children", () => {
      render(<Card.Description>A description</Card.Description>);
      expect(screen.getByText("A description")).toBeInTheDocument();
    });

    it("applies description styles", () => {
      render(<Card.Description>Desc</Card.Description>);
      expect(screen.getByText("Desc").className).toMatch(/text-gray-500/);
    });
  });

  describe("Card.Content", () => {
    it("renders children", () => {
      render(<Card.Content>Main content</Card.Content>);
      expect(screen.getByText("Main content")).toBeInTheDocument();
    });
  });

  describe("Card.Footer", () => {
    it("renders children", () => {
      render(<Card.Footer>Footer</Card.Footer>);
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("applies footer layout styles", () => {
      render(<Card.Footer data-testid="footer">Footer</Card.Footer>);
      const footer = screen.getByTestId("footer");
      expect(footer.className).toMatch(/mt-4/);
      expect(footer.className).toMatch(/flex/);
    });
  });

  it("composes all subcomponents together", () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Course Name</Card.Title>
          <Card.Description>Course description</Card.Description>
        </Card.Header>
        <Card.Content>Content here</Card.Content>
        <Card.Footer>
          <button>Action</button>
        </Card.Footer>
      </Card>
    );
    expect(screen.getByRole("heading", { name: "Course Name" })).toBeInTheDocument();
    expect(screen.getByText("Course description")).toBeInTheDocument();
    expect(screen.getByText("Content here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});
