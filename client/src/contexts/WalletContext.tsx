import { createContext, useContext, ReactNode, useState } from 'react';

interface WalletContextType {
  walletData: any | null;
  setWalletData: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletData, setWalletData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <WalletContext.Provider value={{ walletData, setWalletData, isLoading, setIsLoading }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
