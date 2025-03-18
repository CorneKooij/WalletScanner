import { useWallet } from "@/contexts/WalletContext";
import { formatADA, formatTokenAmount } from "@/lib/formatUtils";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import TabNavigation from "@/components/Dashboard/TabNavigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const Holdings = () => {
  const { walletData } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");

  // Early return for loading/no data state
  if (!walletData || !walletData.tokens) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Alert className="max-w-lg">
          <Search className="h-6 w-6 mr-2" />
          <AlertTitle>No wallet data</AlertTitle>
          <AlertDescription>
            Please enter a Cardano wallet ID or handle in the search box above
            to view holdings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get token color and symbol based on token name
  const getTokenDetails = (token: any) => {
    const symbolMap: Record<
      string,
      { bg: string; textColor: string; symbol: string }
    > = {
      ADA: { bg: "bg-blue-100", textColor: "text-[#2563EB]", symbol: "₳" },
      HOSKY: { bg: "bg-red-100", textColor: "text-red-500", symbol: "H" },
      DJED: { bg: "bg-green-100", textColor: "text-green-500", symbol: "D" },
      SUNDAE: {
        bg: "bg-purple-100",
        textColor: "text-purple-500",
        symbol: "S",
      },
      MIN: { bg: "bg-yellow-100", textColor: "text-yellow-500", symbol: "M" },
    };

    return (
      symbolMap[token.symbol] || {
        bg: "bg-gray-100",
        textColor: "text-gray-500",
        symbol: token.symbol.charAt(0),
      }
    );
  };

  // Filter tokens based on search term with null check
  const filteredTokens = (walletData.tokens || []).filter((token) =>
    token
      ? token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
      : false
  );

  const tokenRows = useMemo(() => {
    if (!walletData?.tokens) return [];

    return walletData.tokens
      .filter((token) => token && token.balance && token.symbol) // Add stricter null checks
      .map((token) => ({
        name: token.name || "Unknown",
        symbol: token.symbol || "",
        balance: token.balance || "0",
        valueUsd: token.valueUsd || 0,
        decimals: token.decimals || 0,
        unit: token.unit || "",
      }));
  }, [walletData?.tokens]);

  return (
    <main>
      <TabNavigation />

      <Card className="bg-white p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Token Holdings</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search tokens"
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {filteredTokens.map((token, index) => {
            const { bg, textColor, symbol } = getTokenDetails(token);
            const isAda = token.symbol === "ADA";
            const displayName = token.name || "Unknown";

            // Check if token has a very long symbol that might cause overflow
            const hasLongSymbol = token.symbol && token.symbol.length > 15;

            return (
              <Card
                key={index}
                className="relative p-4 border border-gray-200 rounded-lg flex items-center"
              >
                <div
                  className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}
                >
                  <span className={`${textColor} font-semibold`}>{symbol}</span>
                </div>

                <div className="min-w-0 flex-grow pr-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="font-medium truncate max-w-[120px]">
                            {displayName}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {hasLongSymbol
                              ? token.symbol.substring(0, 15) + "..."
                              : token.symbol}
                          </div>
                          {token.unit && !isAda && (
                            <div className="text-xs text-gray-400 truncate max-w-[120px]">
                              {token.unit.slice(0, 8)}...{token.unit.slice(-4)}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="start"
                        className="max-w-[400px] p-4"
                      >
                        <div>
                          <p className="font-medium text-sm">{displayName}</p>
                          <p className="text-xs text-gray-500">
                            {token.symbol}
                          </p>
                        </div>
                        {token.unit && !isAda && (
                          <div className="pt-2 border-t border-gray-100 mt-2">
                            <p className="text-xs font-medium text-gray-500">
                              Token ID
                            </p>
                            <div className="mt-1 bg-gray-50 rounded p-2">
                              <p className="text-xs font-mono break-all select-all">
                                {token.unit}
                              </p>
                            </div>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="text-right flex-shrink-0 w-[100px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="font-medium text-right truncate">
                            {isAda ? (
                              <span className="text-[#2563EB]">
                                ₳{walletData.balance.ada}
                              </span>
                            ) : (
                              formatTokenAmount(
                                token.balance,
                                token.symbol,
                                token.decimals
                              )
                            )}
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            ≈ $
                            {token.valueUsd
                              ? formatADA(token.valueUsd)
                              : "0.00"}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        align="end"
                        className="max-w-[400px] p-4"
                      >
                        <div>
                          <p className="text-xs font-medium text-gray-500">
                            Balance
                          </p>
                          <div className="mt-1 bg-gray-50 rounded p-2">
                            <p className="text-sm font-mono break-all select-all">
                              {token.balance}
                            </p>
                          </div>
                        </div>
                        {token.valueUsd && (
                          <div className="pt-2 mt-2">
                            <p className="text-xs font-medium text-gray-500">
                              USD Value
                            </p>
                            <div className="mt-1 bg-gray-50 rounded p-2">
                              <p className="text-sm font-mono">
                                ${formatADA(token.valueUsd)}
                              </p>
                            </div>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">
              No tokens found matching your search.
            </p>
          </div>
        )}
      </Card>
    </main>
  );
};

export default Holdings;
