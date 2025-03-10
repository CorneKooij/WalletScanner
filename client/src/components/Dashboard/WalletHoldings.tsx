import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { formatADA, formatTokenAmount } from '@/lib/formatUtils';
import { Link } from 'wouter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const getTokenDetails = (token: any) => {
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
      symbol: token.symbol?.charAt(0) || '?' 
    };
  };

  // Function to display token balance with proper formatting
  const getFormattedBalance = (token: any): string => {
    if (!token || token.balance === undefined || token.balance === null) {
      return '0';
    }
    
    try {
      return formatTokenAmount(token.balance, token.symbol);
    } catch (error) {
      console.error('Error formatting token balance:', error);
      return '0';
    }
  };

  return (
    <Card className="bg-white p-6">
      <h2 className="text-xl font-semibold mb-6">Token Holdings</h2>
      
      {Array.isArray(walletData.tokens) && walletData.tokens.length > 0 ? (
        walletData.tokens.map((token, index) => {
          const { bg, textColor, symbol } = getTokenDetails(token);
          return (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mr-3`}>
                  <span className={`${textColor} font-semibold`}>{symbol}</span>
                </div>
                <div>
                  <div className="font-medium">{token.name || 'Unknown Token'}</div>
                  <div className="text-xs text-gray-500">{token.symbol || 'UNKNOWN'}</div>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-right cursor-help">
                      <div className="font-medium">
                        {token.symbol === 'ADA' ? '₳' : ''}{getFormattedBalance(token)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ≈ ${token.valueUsd ? formatADA(token.valueUsd) : '0.00'}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Raw balance: {token.balance || '0'}</p>
                    {token.symbol === 'ADA' && <p>1 ADA = 1,000,000 lovelace</p>}
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
