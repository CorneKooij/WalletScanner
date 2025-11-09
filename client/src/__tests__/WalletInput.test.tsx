import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WalletInput from "@/components/WalletInput";

// Mocks
vi.mock("wouter", () => ({ useLocation: () => ["", vi.fn()] }));
vi.mock("@/contexts/WalletContext", () => ({
  useWallet: () => ({
    setWalletData: vi.fn(),
    isLoading: false,
    setIsLoading: vi.fn(),
    setTransactionsLoading: vi.fn(),
    setNftsLoading: vi.fn(),
  }),
}));

const toastFn = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastFn }) }));

describe("WalletInput", () => {
  it("shows error toast for invalid address", async () => {
    render(<WalletInput />);
    const input = screen.getByPlaceholderText(/Enter Cardano wallet address/i);
    await userEvent.type(input, "abc");
    await userEvent.click(screen.getByText(/Lookup/i));
    expect(toastFn).toHaveBeenCalled();
    const firstCall = toastFn.mock.calls[0][0];
    expect(firstCall.variant).toBe("destructive");
  });
});
