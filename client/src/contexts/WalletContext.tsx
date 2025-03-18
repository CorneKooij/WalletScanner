import { createContext, useContext, ReactNode, useState } from "react";
import { formatADA } from "@/lib/formatUtils";

interface Token {
  unit: string;
  quantity: string;
  balance: string;
  name: string;
  symbol: string;
  decimals: number;
  valueUsd: number | null;
  isNFT?: boolean;
}

interface WalletData {
  address: string;
  balance: {
    ada: string;
    usd: number;
    adaPrice: number;
    percentChange: number;
  };
  tokens: Token[];
  nfts: Token[];
  transactions: any[];
}

interface WalletContextType {
  walletData: WalletData | null;
  setWalletData: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processWalletData = (rawData: any) => {
    if (!rawData || !rawData.amount) return null;

    // Find ADA amount
    const lovelaceAmount = rawData.amount.find(
      (amt: any) => amt.unit === "lovelace"
    );
    const adaAmount = lovelaceAmount
      ? parseInt(lovelaceAmount.quantity) / 1_000_000
      : 0;

    // Process tokens
    const tokens = rawData.amount.map((token: any) => ({
      unit: token.unit,
      quantity: token.quantity,
      balance:
        token.unit === "lovelace"
          ? (parseInt(token.quantity) / 1_000_000).toString()
          : token.quantity,
      name: token.unit === "lovelace" ? "Cardano" : token.unit,
      symbol: token.unit === "lovelace" ? "ADA" : token.unit.slice(0, 5),
      decimals: token.unit === "lovelace" ? 6 : 0,
      valueUsd: token.unit === "lovelace" ? adaAmount * 0.5 : null, // Default ADA price if not available
    }));

    return {
      address: rawData.address,
      balance: {
        ada: formatADA(adaAmount),
        usd: adaAmount * 0.5, // Default ADA price if not available
        adaPrice: 0.5, // Default ADA price
        percentChange: 0,
      },
      tokens,
      nfts: [], // Will be populated later
      transactions: [], // Will be populated later
    };
  };

  const handleSetWalletData = (data: any) => {
    const processed = processWalletData(data);
    setWalletData(processed);
  };

  return (
    <WalletContext.Provider
      value={{
        walletData,
        setWalletData: handleSetWalletData,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
