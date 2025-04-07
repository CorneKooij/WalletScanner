import { useWallet } from "@/contexts/WalletContext";
import TabNavigation from "@/components/Dashboard/TabNavigation";
import WalletOverview from "@/components/Dashboard/WalletOverview";
import BalanceHistory from "@/components/Dashboard/BalanceHistory";
import TransactionHistory from "@/components/Dashboard/TransactionHistory";
import WalletHoldings from "@/components/Dashboard/WalletHoldings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { walletData, isLoading, transactionsLoading, nftsLoading } =
    useWallet();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <TabNavigation />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-100 h-48 rounded-lg"></div>
          <div className="bg-gray-100 h-48 rounded-lg"></div>
          <div className="bg-gray-100 h-48 rounded-lg"></div>
        </div>
        <div className="bg-gray-100 h-64 rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-100 h-96 rounded-lg"></div>
          <div className="bg-gray-100 h-96 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Alert className="max-w-lg">
          <Search className="h-6 w-6 mr-2" />
          <AlertTitle>No wallet data</AlertTitle>
          <AlertDescription>
            Please enter a Cardano wallet ID or handle in the search box above
            to view the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main>
      <TabNavigation />
      <WalletOverview />
      <BalanceHistory />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {transactionsLoading ? (
          <div className="lg:col-span-2 border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <TransactionHistory />
        )}

        <WalletHoldings />
      </div>
    </main>
  );
};

export default Dashboard;
