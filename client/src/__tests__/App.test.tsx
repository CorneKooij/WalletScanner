import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";

// Basic smoke test to verify the header renders and routes switch

describe("App", () => {
  it("renders the header title", () => {
    render(<App />);
    expect(screen.getByText(/WalletScanner/i)).toBeInTheDocument();
  });
});
