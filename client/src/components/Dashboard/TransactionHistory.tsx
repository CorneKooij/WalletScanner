import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { formatADA } from '@/lib/formatUtils';
import { ArrowDown, ArrowUp, Clipboard, Search, Shuffle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Transaction types for filtering
const TRANSACTION_TYPES = ['All', 'Received', 'Sent', 'Swaps', 'Staking', 'NFT Activity'];

const TransactionHistory = () => {
  const { walletData } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const itemsPerPage = 4;

  if (!walletData) {
    return null;
  }

  // Filter transactions based on search term and selected type
  const filteredTransactions = walletData.transactions.filter(tx => {
    const matchesSearch = 
      searchTerm === '' || 
      tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount.toString().includes(searchTerm);
    
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
          icon: <ArrowUp className="h-4 w-4 text-[#2563EB]" />,
          label: 'Received'
        };
      case 'sent':
        return {
          bg: 'bg-red-100',
          icon: <ArrowDown className="h-4 w-4 text-[#EF4444]" />,
          label: 'Sent'
        };
      case 'swap':
        return {
          bg: 'bg-purple-100',
          icon: <Shuffle className="h-4 w-4 text-[#6366F1]" />,
          label: 'Swap'
        };
      case 'stake_reward':
        return {
          bg: 'bg-green-100',
          icon: <Zap className="h-4 w-4 text-[#34D399]" />,
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
      return <span className="text-[#34D399] font-medium">+₳{formatADA(tx.amount)}</span>;
    } else if (tx.type === 'sent') {
      return <span className="text-[#EF4444] font-medium">-₳{formatADA(tx.amount)}</span>;
    } else if (tx.type === 'swap') {
      return <span className="text-[#6366F1] font-medium">₳{formatADA(tx.amount)} → {tx.tokenAmount} {tx.tokenSymbol}</span>;
    }
    return <span className="font-medium">₳{formatADA(tx.amount)}</span>;
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
    <Card className="lg:col-span-2 bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search transactions" 
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none"
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
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
              selectedType === type 
                ? 'bg-[#2563EB] text-white' 
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
                <tr key={index}>
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
                      <div 
                        className="text-sm text-gray-600 truncate max-w-[150px]" 
                        title={tx.fullAddress || tx.address}
                      >
                        {tx.address}
                      </div>
                      <button 
                        className="ml-2 text-gray-400 hover:text-gray-600" 
                        onClick={() => handleCopyAddress(tx.fullAddress || tx.address)}
                        title="Copy full address"
                      >
                        <Clipboard className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] text-sm">View</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
        </div>
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button 
            className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  );
};

export default TransactionHistory;
