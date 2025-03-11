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

  const getTokenDetails = (token: Token) => {
    if (!token || !token.symbol) {
      return { bg: 'bg-gray-100', textColor: 'text-gray-500', symbol: '?' };
    }

    const symbolMap: Record<string, { bg: string, textColor: string, symbol: string }> = {
      'ADA': { bg: 'bg-blue-100', textColor: 'text-primary', symbol: '₳' },
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

  const getTokenBalance = (token: Token) => {
    const isAda = token.symbol === 'ADA';

    if (isAda) {
      return walletData.balance.ada;
    }

    // Use token.decimals property from blockchain data to determine formatting
    if (token.decimals === 0) {
      // Tokens with zero decimal places show as whole numbers
      return String(Math.floor(Number(token.balance)));
    }

    // For tokens with decimals, format appropriately using the token's own decimal places
    return formatTokenAmount(token.balance, token.symbol, token.decimals);
  };

  return (
    <Card className="bg-white p-6">
      <h2 className="text-xl font-semibold mb-6">Token Holdings</h2>

      <div className="space-y-4">
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
                          <div className="font-medium truncate max-w-[120px]">{displayName}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {token.symbol || 'UNKNOWN'}
                            {token.unit && !isAda && (
                              <span className="ml-2 text-gray-400 truncate max-w-[120px]">
                                • {token.unit.slice(0, 8)}...{token.unit.slice(-4)}
                              </span>
                            )}
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
                      <div className="text-right cursor-help min-w-[100px]">
                        <div className="font-medium text-right truncate max-w-[100px]">
                          {isAda ? (
                            <span className="text-primary">₳{walletData.balance.ada}</span>
                          ) : (
                            getTokenBalance(token)
                          )}
                        </div>
                        <div className="text-xs text-gray-500 text-right">
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
      </div>

      {Array.isArray(walletData.tokens) && walletData.tokens.length > 5 && (
        <Link href="/holdings">
          <a className="mt-6 block w-full py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors text-center">
            View All Tokens
          </a>
        </Link>
      )}
    </Card>
  );
};

export default WalletHoldings;