import { createContext, useContext, ReactNode, useState } from "react";

interface WalletContextType {
  walletData: any | null;
  setWalletData: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  transactionsLoading: boolean;
  setTransactionsLoading: (loading: boolean) => void;
  nftsLoading: boolean;
  setNftsLoading: (loading: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [nftsLoading, setNftsLoading] = useState(false);

  return (
    <WalletContext.Provider
      value={{
        walletData,
        setWalletData,
        isLoading,
        setIsLoading,
        transactionsLoading,
        setTransactionsLoading,
        nftsLoading,
        setNftsLoading,
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
