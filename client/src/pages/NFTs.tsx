import * as React from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, AlertTriangle } from "lucide-react";
import NFTGallery from "@/components/NFT/NFTGallery";
import TabNavigation from "@/components/Dashboard/TabNavigation";

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading the NFT gallery. Please try again
              later.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

const NFTs = () => {
  const { walletData, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <TabNavigation />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <TabNavigation />
        <Alert className="max-w-lg mt-8">
          <Search className="h-6 w-6 mr-2" />
          <AlertTitle>No wallet data</AlertTitle>
          <AlertDescription>
            Please enter a Cardano wallet ID or handle in the search box above
            to view NFTs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main>
      <TabNavigation />
      <ErrorBoundary>
        <NFTGallery />
      </ErrorBoundary>
    </main>
  );
};

export default NFTs;
