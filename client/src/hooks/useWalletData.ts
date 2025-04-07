import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";

// Basic wallet info type
interface WalletInfo {
  address: string;
  handle: string | null;
  balance: {
    ada: string;
    usd: number;
    adaPrice: number;
    percentChange: number;
  };
  tokens: any[];
}

// Fetch basic wallet info (high priority)
const fetchWalletInfo = async (address: string): Promise<WalletInfo> => {
  const response = await fetch(
    `/api/wallet/${encodeURIComponent(address)}/info`
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch wallet data");
  }
  return response.json();
};

// Fetch transaction history (lower priority)
const fetchTransactions = async (address: string): Promise<any[]> => {
  const response = await fetch(
    `/api/wallet/${encodeURIComponent(address)}/transactions`
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch transaction data");
  }
  return response.json();
};

// Fetch NFTs (lower priority)
const fetchNFTs = async (address: string): Promise<any[]> => {
  const response = await fetch(
    `/api/wallet/${encodeURIComponent(address)}/nfts`
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch NFT data");
  }
  return response.json();
};

export const useWalletData = (address: string | null) => {
  const {
    setWalletData,
    setIsLoading,
    setTransactionsLoading,
    setNftsLoading,
  } = useWallet();

  // Query for basic wallet info (high priority)
  const walletInfoQuery = useQuery({
    queryKey: ["walletInfo", address],
    queryFn: () => fetchWalletInfo(address!),
    enabled: !!address,
    staleTime: 30 * 60 * 1000, // 30 minutes
    onSuccess: (data) => {
      setWalletData({
        ...data,
        transactions: [],
        nfts: [],
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Query for transactions (lower priority, starts after wallet info loads)
  const transactionsQuery = useQuery({
    queryKey: ["transactions", address],
    queryFn: () => fetchTransactions(address!),
    enabled: !!address && walletInfoQuery.isSuccess,
    staleTime: 30 * 60 * 1000, // 30 minutes
    onSuccess: (transactions) => {
      setWalletData((prev) => ({
        ...prev,
        transactions,
      }));
    },
    onSettled: () => {
      setTransactionsLoading(false);
    },
  });

  // Query for NFTs (lower priority, starts after wallet info loads)
  const nftsQuery = useQuery({
    queryKey: ["nfts", address],
    queryFn: () => fetchNFTs(address!),
    enabled: !!address && walletInfoQuery.isSuccess,
    staleTime: 30 * 60 * 1000, // 30 minutes
    onSuccess: (nfts) => {
      setWalletData((prev) => ({
        ...prev,
        nfts,
      }));
    },
    onSettled: () => {
      setNftsLoading(false);
    },
  });

  return {
    walletInfo: walletInfoQuery.data,
    transactions: transactionsQuery.data || [],
    nfts: nftsQuery.data || [],
    isLoadingWalletInfo: walletInfoQuery.isLoading,
    isLoadingTransactions: transactionsQuery.isLoading,
    isLoadingNFTs: nftsQuery.isLoading,
    hasWalletInfoError: walletInfoQuery.isError,
    hasTransactionsError: transactionsQuery.isError,
    hasNFTsError: nftsQuery.isError,
    walletInfoError: walletInfoQuery.error,
    transactionsError: transactionsQuery.error,
    nftsError: nftsQuery.error,
  };
};
