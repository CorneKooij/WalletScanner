import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import TabNavigation from "@/components/Dashboard/TabNavigation";
import { Card } from "@/components/ui/card";
import { formatADA, formatTokenAmount } from "@/lib/formatUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowDown, ArrowUp, Clipboard, Search, Shuffle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TRANSACTION_TYPES = ['All', 'Received', 'Sent', 'Swaps', 'Staking', 'NFT Activity'];

const Transactions = () => {
  const { walletData } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const itemsPerPage = 10;

  if (!walletData) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Alert className="max-w-lg">
          <Search className="h-6 w-6 mr-2" />
          <AlertTitle>No wallet data</AlertTitle>
          <AlertDescription>
            Please enter a Cardano wallet ID or handle in the search box above to view transactions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter transactions based on search term and selected type
  const filteredTransactions = walletData.transactions.filter(tx => {
    const matchesSearch = 
      searchTerm === '' || 
      tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount.toString().includes(searchTerm) ||
      (tx.address && tx.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = 
      selectedType === 'All' || 
      tx.type.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesType;
  });

  // Paginate transactions
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Get transaction icon and background color based on transaction type
  const getTransactionTypeDetails = (type: string) => {
    switch (type.toLowerCase()) {
      case 'received':
        return {
          bg: 'bg-blue-100',
          icon: <ArrowUp className="h-4 w-4 text-primary" />,
          label: 'Received'
        };
      case 'sent':
        return {
          bg: 'bg-red-100',
          icon: <ArrowDown className="h-4 w-4 text-destructive" />,
          label: 'Sent'
        };
      case 'swap':
        return {
          bg: 'bg-purple-100',
          icon: <Shuffle className="h-4 w-4 text-info" />,
          label: 'Swap'
        };
      case 'stake_reward':
        return {
          bg: 'bg-green-100',
          icon: <Zap className="h-4 w-4 text-success" />,
          label: 'Stake Reward'
        };
      default:
        return {
          bg: 'bg-gray-100',
          icon: <ArrowDown className="h-4 w-4 text-gray-500" />,
          label: type.charAt(0).toUpperCase() + type.slice(1)
        };
    }
  };

  // Format transaction amount with appropriate styling
  const getFormattedAmount = (tx: any) => {
    if (tx.type === 'received' || tx.type === 'stake_reward') {
      return (
        <span className="text-success font-medium">
          +₳{formatTokenAmount(tx.amount, 'ADA')}
        </span>
      );
    } else if (tx.type === 'sent') {
      return (
        <span className="text-destructive font-medium">
          -₳{formatTokenAmount(tx.amount, 'ADA')}
        </span>
      );
    } else if (tx.type === 'swap') {
      return (
        <span className="text-info font-medium">
          ₳{formatTokenAmount(tx.amount, 'ADA')} → {formatTokenAmount(tx.tokenAmount || '0', tx.tokenSymbol)} {tx.tokenSymbol}
        </span>
      );
    }
    return <span className="font-medium">₳{formatTokenAmount(tx.amount, 'ADA')}</span>;
  };

  // Handle copy address to clipboard
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Address copied to clipboard",
    });
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <TabNavigation />

      <Card className="bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Transactions</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search transactions" 
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {TRANSACTION_TYPES.map(type => (
            <button
              key={type}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedType === type 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium hidden sm:table-cell">Address</th>
                <th className="pb-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.map((tx, index) => {
                const typeDetails = getTransactionTypeDetails(tx.type);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div>{tx.date}</div>
                      <div className="text-xs text-gray-500">{tx.time}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center">
                        <div className={`${typeDetails.bg} p-1.5 rounded-md mr-3`}>
                          {typeDetails.icon}
                        </div>
                        <span>{typeDetails.label}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {getFormattedAmount(tx)}
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 truncate w-24">{tx.address}</span>
                        <button 
                          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors" 
                          onClick={() => handleCopyAddress(tx.fullAddress)}
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <a 
                        href={tx.explorerUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary text-sm hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedTransactions.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No transactions found matching your search.</p>
          </div>
        )}

        {paginatedTransactions.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
};

export default Transactions;