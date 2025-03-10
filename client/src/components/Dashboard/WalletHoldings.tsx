import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { formatADA, formatTokenAmount } from '@/lib/formatUtils';
import { Link } from 'wouter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Token {
  name: string;
  symbol: string;
  balance: string | number;
  valueUsd?: number | null;
  decimals?: number;
  unit?: string;
}

const WalletHoldings = () => {
  const { walletData } = useWallet();

  if (!walletData || !walletData.tokens) {
    return (
      <Card className="bg-white p-6">
        <h2 className="text-xl font-semibold mb-6">Token Holdings</h2>
        <div className="py-8 text-center text-gray-500">
          No token data available
        </div>
      </Card>
    );
  }

  // Get token color and symbol based on token name
  const getTokenDetails = (token: Token) => {
    if (!token || !token.symbol) {
      return { bg: 'bg-gray-100', textColor: 'text-gray-500', symbol: '?' };
    }

    const symbolMap: Record<string, { bg: string, textColor: string, symbol: string }> = {
      'ADA': { bg: 'bg-blue-100', textColor: 'text-[#2563EB]', symbol: '₳' },
      'HOSKY': { bg: 'bg-red-100', textColor: 'text-red-500', symbol: 'H' },
      'DJED': { bg: 'bg-green-100', textColor: 'text-green-500', symbol: 'D' },
      'SUNDAE': { bg: 'bg-purple-100', textColor: 'text-purple-500', symbol: 'S' },
      'MIN': { bg: 'bg-yellow-100', textColor: 'text-yellow-500', symbol: 'M' }
    };

    return symbolMap[token.symbol] || {
      bg: 'bg-gray-100',
      textColor: 'text-gray-500',
      symbol: token.symbol?.charAt(0)?.toUpperCase() || '?'
    };
  };

  // Function to format token balance
  const formatBalance = (token: Token) => {
    const rawBalance = Number(token.balance);
    const isAda = token.symbol === 'ADA';

    if (isAda) {
      return walletData.balance.ada;
    }

    // Apply token decimals to get actual balance
    const decimals = token.decimals || 6;
    const adjustedBalance = rawBalance / Math.pow(10, decimals);

    // Format with appropriate precision
    if (adjustedBalance < 0.0001) {
      return adjustedBalance.toExponential(4);
    } else if (adjustedBalance < 1) {
      return adjustedBalance.toFixed(6);
    } else {
      return adjustedBalance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      });
    }
  };

  return (
    <Card className="bg-white p-6">
      <h2 className="text-xl font-semibold mb-6">Token Holdings</h2>

      {Array.isArray(walletData.tokens) && walletData.tokens.length > 0 ? (
        walletData.tokens.map((token: Token, index: number) => {
          const { bg, textColor, symbol } = getTokenDetails(token);
          const displayName = token.name || 'Unknown Token';
          const isAda = token.symbol === 'ADA';

          return (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center min-w-0 max-w-[60%] cursor-help">
                      <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                        <span className={`${textColor} font-semibold`}>{symbol}</span>
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="font-medium truncate">{displayName}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {token.symbol || 'UNKNOWN'}
                          {token.unit && !isAda && ` • ${token.unit.slice(0, 8)}...${token.unit.slice(-4)}`}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" align="start" className="max-w-[600px] p-4 space-y-2">
                    <div>
                      <p className="font-medium text-sm">{displayName}</p>
                      <p className="text-xs text-gray-500">{token.symbol || 'UNKNOWN'}</p>
                    </div>
                    {token.unit && !isAda && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500">Token ID</p>
                        <div className="mt-1 bg-gray-50 rounded p-2">
                          <p className="text-xs font-mono break-all select-all w-full">{token.unit}</p>
                        </div>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-right cursor-help">
                      <div className="font-medium">
                        {isAda ? (
                          `₳${walletData.balance.ada}`
                        ) : (
                          formatBalance(token)
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        ≈ ${token.valueUsd ? formatADA(token.valueUsd) : '0.00'}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" align="end" className="max-w-[600px] p-4 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Balance</p>
                      <div className="mt-1 bg-gray-50 rounded p-2">
                        <p className="text-sm font-mono break-all select-all">{token.balance}</p>
                      </div>
                    </div>
                    {isAda && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">1 ADA = 1,000,000 lovelace</p>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })
      ) : (
        <div className="py-4 text-center text-gray-500">
          No tokens found in this wallet
        </div>
      )}

      {Array.isArray(walletData.tokens) && walletData.tokens.length > 5 && (
        <Link href="/holdings" className="mt-4 w-full py-2 text-sm font-medium text-[#2563EB] border border-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors text-center block">
          View All Tokens
        </Link>
      )}
    </Card>
  );
};

export default WalletHoldings;