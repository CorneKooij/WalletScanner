import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Card } from "@/components/ui/card";
import { formatADA, formatTokenAmount } from "@/lib/formatUtils";
import {
  ArrowDown,
  ArrowUp,
  Clipboard,
  ExternalLink,
  Search,
  Shuffle,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TRANSACTION_TYPES = [
  "All",
  "Received",
  "Sent",
  "Swaps",
  "Staking",
  "NFT Activity",
];

const TransactionHistory = () => {
  const { walletData } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const itemsPerPage = 4;

  if (!walletData || !walletData.transactions) {
    return (
      <Card className="lg:col-span-2 bg-white p-6">
        <h2 className="text-xl font-semibold mb-6">Transaction History</h2>
        <div className="py-8 text-center text-gray-500">
          No transaction data available
        </div>
      </Card>
    );
  }

  // Filter transactions based on search term and selected type
  const filteredTransactions = Array.isArray(walletData.transactions)
    ? walletData.transactions.filter((tx) => {
        if (!tx) return false;

        const matchesSearch =
          searchTerm === "" ||
          (tx.type &&
            tx.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (tx.amount && tx.amount.toString().includes(searchTerm));

        const matchesType =
          selectedType === "All" ||
          (tx.type && tx.type.toLowerCase() === selectedType.toLowerCase());

        return matchesSearch && matchesType;
      })
    : [];

  // Paginate transactions
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / itemsPerPage)
  );
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get transaction icon and background color based on transaction type
  const getTransactionTypeDetails = (type: string) => {
    if (!type) {
      return {
        bg: "bg-gray-100",
        icon: <ArrowDown className="h-4 w-4 text-gray-500" />,
        label: "Unknown",
      };
    }

    switch (type.toLowerCase()) {
      case "received":
        return {
          bg: "bg-blue-100",
          icon: <ArrowDown className="h-4 w-4 text-primary" />,
          label: "Received",
        };
      case "sent":
        return {
          bg: "bg-red-100",
          icon: <ArrowUp className="h-4 w-4 text-destructive" />,
          label: "Sent",
        };
      case "swap":
        return {
          bg: "bg-purple-100",
          icon: <Shuffle className="h-4 w-4 text-info" />,
          label: "Swap",
        };
      case "stake_reward":
        return {
          bg: "bg-green-100",
          icon: <Zap className="h-4 w-4 text-success" />,
          label: "Stake Reward",
        };
      default:
        return {
          bg: "bg-gray-100",
          icon: <ArrowDown className="h-4 w-4 text-gray-500" />,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        };
    }
  };

  // Format transaction amount with appropriate styling
  const getFormattedAmount = (tx: any) => {
    if (!tx || !tx.amount) {
      return <span className="font-medium">₳0.00</span>;
    }

    if (tx.type === "received" || tx.type === "stake_reward") {
      return (
        <span className="text-success font-medium">
          +₳{formatTokenAmount(tx.amount, "ADA")}
        </span>
      );
    } else if (tx.type === "sent") {
      return (
        <span className="text-destructive font-medium">
          -₳{formatTokenAmount(tx.amount, "ADA")}
        </span>
      );
    } else if (tx.type === "swap") {
      return (
        <span className="text-info font-medium">
          ₳{formatTokenAmount(tx.amount, "ADA")} →{" "}
          {formatTokenAmount(
            tx.tokenAmount || "0",
            tx.tokenSymbol,
            tx.decimals
          )}{" "}
          {tx.tokenSymbol || "TOKEN"}
        </span>
      );
    }

    // Default to success color for other positive transactions
    return (
      <span className="text-success font-medium">
        ₳{formatTokenAmount(tx.amount, "ADA")}
      </span>
    );
  };

  // Handle copy address to clipboard
  const handleCopyAddress = (address: string) => {
    if (!address) {
      toast({
        title: "Error",
        description: "No address available to copy",
        variant: "destructive",
      });
      return;
    }

    try {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Address copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy address:", error);
      toast({
        title: "Copy failed",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="lg:col-span-2 bg-white p-6">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>

        <div className="flex flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Input
              type="text"
              placeholder="Search transactions"
              className="pl-9 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <Button
            variant="outline"
            className="w-24 h-10 shrink-0"
            onClick={() => setSearchTerm("")}
          >
            Clear
          </Button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {TRANSACTION_TYPES.map((type) => (
            <button
              key={type}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                selectedType === type
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {paginatedTransactions.length > 0 ? (
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium hidden sm:table-cell">
                  Address
                </th>
                <th className="pb-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.map((tx, index) => {
                const typeDetails = getTransactionTypeDetails(tx.type);
                return (
                  <tr key={index}>
                    <td className="py-3 pr-4">
                      <div>{tx.date || "Unknown date"}</div>
                      <div className="text-xs text-gray-500">
                        {tx.time || "--:--"}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center">
                        <div
                          className={`${typeDetails.bg} p-1.5 rounded-md mr-3`}
                        >
                          {typeDetails.icon}
                        </div>
                        <span>{typeDetails.label}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{getFormattedAmount(tx)}</td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center cursor-help">
                              <div className="text-sm text-gray-600 truncate max-w-[150px]">
                                {tx.address || "No address"}
                              </div>
                              {(tx.fullAddress || tx.address) && (
                                <button
                                  className="ml-2 text-gray-400 hover:text-gray-600"
                                  onClick={() =>
                                    handleCopyAddress(
                                      tx.fullAddress || tx.address
                                    )
                                  }
                                  title="Copy full address"
                                >
                                  <Clipboard className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            align="start"
                            className="max-w-[480px] p-4 space-y-2 bg-white border border-gray-200"
                          >
                            <div>
                              <p className="text-xs font-medium text-gray-600">
                                Full Address
                              </p>
                              <p className="text-xs mt-1 font-mono break-all select-all w-full text-gray-900">
                                {tx.fullAddress ||
                                  tx.address ||
                                  "No address available"}
                              </p>
                            </div>
                            {tx.explorerUrl && (
                              <div className="pt-2 border-t border-gray-200">
                                <a
                                  href={tx.explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center"
                                >
                                  View on Explorer{" "}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="py-3 text-right">
                      {tx.explorerUrl ? (
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-8 text-center text-gray-500">
            {searchTerm || selectedType !== "All"
              ? "No transactions match your search criteria"
              : "No transactions found in this wallet"}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{" "}
          {filteredTransactions.length} transactions
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TransactionHistory;
