import { useState, useEffect } from "react";
import * as React from "react";
import { useWallet } from "@/contexts/WalletContext";
import NFTCard from "@/components/NFT/NFTCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load NFTs: {this.state.error?.message || "Unknown error"}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

interface NFT {
  asset: string;
  policy_id: string;
  asset_name?: string;
  fingerprint: string;
  quantity: string;
  metadata?: {
    name: string;
    description?: string;
    image?: string;
    attributes?: Record<string, any>;
  };
  imageUrl?: string;
  onchain_metadata?: any;
}

const NFTGallery = () => {
  const { walletData, nftsLoading, setNftsLoading } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNFTs() {
      if (!walletData?.address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setNftsLoading(true);

        console.log("Fetching NFTs for address:", walletData.address);

        const response = await fetch(
          `/api/wallet/${encodeURIComponent(walletData.address)}/nfts/details`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch NFTs");
        }

        const data = await response.json();
        console.log(`Received ${data.length} NFTs from API`);

        // Log the first few NFTs for debugging
        if (data.length > 0) {
          console.log("First NFT sample:", data[0]);
        }

        setNfts(data);
      } catch (err) {
        console.error("Error fetching NFTs:", err);
        setError("Failed to load NFTs. Please try again later.");
      } finally {
        setIsLoading(false);
        setNftsLoading(false);
      }
    }

    fetchNFTs();
  }, [walletData?.address, setNftsLoading]);

  if (isLoading || nftsLoading) {
    return (
      <div className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-6">NFT Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 overflow-hidden bg-white"
            >
              <Skeleton className="w-full h-48" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!nfts.length) {
    return (
      <div className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-6">NFT Collection</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">No NFTs found in this wallet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">
        NFT Collection ({nfts.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <NFTCard key={nft.asset} nft={nft} />
        ))}
      </div>
    </div>
  );
};

export default NFTGallery;
