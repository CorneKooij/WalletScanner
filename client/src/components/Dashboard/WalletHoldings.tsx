import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { formatADA } from '@/lib/formatUtils';

const WalletHoldings = () => {
  const { walletData } = useWallet();

  if (!walletData) {
    return null;
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

  return (
    <Card className="bg-white p-6">
      <h2 className="text-xl font-semibold mb-6">Token Holdings</h2>
      
      {walletData.tokens.map((token, index) => {
        const { bg, textColor, symbol } = getTokenDetails(token);
        return (
          <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mr-3`}>
                <span className={`${textColor} font-semibold`}>{symbol}</span>
              </div>
              <div>
                <div className="font-medium">{token.name}</div>
                <div className="text-xs text-gray-500">{token.symbol}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{token.balance.toLocaleString()}</div>
              <div className="text-xs text-gray-500">≈ ${formatADA(token.valueUsd)}</div>
            </div>
          </div>
        );
      })}
      
      {walletData.tokens.length > 5 && (
        <button 
          className="mt-4 w-full py-2 text-sm font-medium text-[#2563EB] border border-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors"
          onClick={() => window.location.href = "/holdings"}
        >
          View All Tokens
        </button>
      )}
    </Card>
  );
};

export default WalletHoldings;
