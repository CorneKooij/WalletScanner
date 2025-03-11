import { useWallet } from "@/contexts/WalletContext";
import { formatADA, formatTokenAmount } from "@/lib/formatUtils";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useState } from "react";
import TabNavigation from "@/components/Dashboard/TabNavigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Holdings = () => {
  const { walletData } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");

  if (!walletData) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Alert className="max-w-lg">
          <Search className="h-6 w-6 mr-2" />
          <AlertTitle>No wallet data</AlertTitle>
          <AlertDescription>
            Please enter a Cardano wallet ID or handle in the search box above to view holdings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get token color and symbol based on token name
  const getTokenDetails = (token: any) => {
    const symbolMap: Record<string, { bg: string, textColor: string, symbol: string }> = {
      'ADA': { bg: 'bg-blue-100', textColor: 'text-[#2563EB]', symbol: '₳' },
      'HOSKY': { bg: 'bg-red-100', textColor: 'text-red-500', symbol: 'H' },
      'DJED': { bg: 'bg-green-100', textColor: 'text-green-500', symbol: 'D' },
      'SUNDAE': { bg: 'bg-purple-100', textColor: 'text-purple-500', symbol: 'S' },
      'MIN': { bg: 'bg-yellow-100', textColor: 'text-yellow-500', symbol: 'M' }
    };

    return symbolMap[token.symbol] || { bg: 'bg-gray-100', textColor: 'text-gray-500', symbol: token.symbol.charAt(0) };
  };

  // Filter tokens based on search term
  const filteredTokens = walletData.tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTokens.map((token, index) => {
            const { bg, textColor, symbol } = getTokenDetails(token);
            return (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center mr-3`}>
                      <span className={`${textColor} font-semibold text-lg`}>{symbol}</span>
                    </div>
                    <div>
                      <div className="font-medium">{token.name}</div>
                      <div className="text-xs text-gray-500">{token.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <div className="font-medium truncate max-w-[120px] text-right">
                      {token.symbol === 'ADA' ? (
                        <span className="text-[#2563EB]">₳{walletData.balance.ada}</span>
                      ) : (
                        formatTokenAmount(token.balance, token.symbol, token.decimals)
                      )}
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      ≈ ${token.valueUsd ? formatADA(token.valueUsd) : '0.00'}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No tokens found matching your search.</p>
          </div>
        )}
      </Card>
    </main>
  );
};

export default Holdings;