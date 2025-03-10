import { useEffect, useRef } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { formatADA, formatTokenAmount } from '@/lib/formatUtils';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Shuffle, Loader2 } from 'lucide-react';
import Chart from 'chart.js/auto';

interface Token {
  name: string;
  symbol: string;
  balance: string | number;
  valueUsd?: number | null;
  decimals?: number;
  unit?: string;
}

interface Transaction {
  type: string;
  amount: number;
  date: string;
  time: string;
  tokenAmount?: number;
  tokenSymbol?: string;
}

const WalletOverview = () => {
  const { walletData, isLoading } = useWallet();
  const tokenChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const chartColorsRef = useRef<string[]>([
    '#2563EB', // ADA Blue
    '#34D399', // Green
    '#6366F1', // Purple
    '#FB923C', // Orange
    '#F472B6', // Pink
    '#FBBF24', // Yellow
    '#EC4899', // Hot Pink
    '#8B5CF6', // Violet
    '#D1D5DB'  // Gray (for Others)
  ]);

const trimTokenName = (name: string, maxLength = 15) => {
    if (!name) return 'Unknown';
    const cleanName = name.replace(/[^\x20-\x7E]/g, '');
    if (cleanName.length <= maxLength) return cleanName;
    return `${cleanName.substring(0, maxLength)}...`;
  };

  // Get full token name without truncation
  const getFullTokenName = (name: string) => {
    if (!name) return 'Unknown';
    return name.replace(/[^\x20-\x7E]/g, '').trim();
  };

  const isValidToken = (token: Token) => {
    if (!token || !token.balance) return false;
    if (Number(token.balance) <= 0) return false;

    if (token.unit?.startsWith('f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a')) {
      return false;
    }

    if (token.decimals === 0 && Number(token.balance) === 1) {
      return false;
    }

    return true;
  };

  const getTokenValue = (token: Token) => {
    if (!token || !token.balance) return 0;

    if (token.symbol === 'ADA') {
      return Number(token.balance);
    }

    if (token.valueUsd && walletData?.balance.usd) {
      const adaPriceUsd = walletData.balance.usd / Number(walletData.balance.ada);
      return token.valueUsd / adaPriceUsd;
    }

    return Number(token.balance);
  };

  useEffect(() => {
    if (!tokenChartRef.current || !walletData?.tokens || isLoading) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const validTokens = walletData.tokens
      .filter(isValidToken)
      .map(token => {
        const valueInAda = getTokenValue(token);
        const displayAmount = formatTokenAmount(token.balance, token.symbol);

        return {
          name: trimTokenName(token.name || token.symbol),
          fullName: getFullTokenName(token.name || token.symbol),
          symbol: token.symbol,
          valueInAda,
          displayAmount: `${displayAmount} ${token.symbol}`
        };
      })
      .filter(token => token.valueInAda > 0)
      .sort((a, b) => b.valueInAda - a.valueInAda);

    const totalValue = validTokens.reduce((sum, token) => sum + token.valueInAda, 0);

    const significantTokens = validTokens.filter(token => 
      (token.valueInAda / totalValue) >= 0.01
    );

    const otherTokens = validTokens.filter(token => 
      (token.valueInAda / totalValue) < 0.01
    );

    const chartData = significantTokens.map(token => ({
      name: token.name,
      fullName: token.fullName,
      symbol: token.symbol,
      value: token.valueInAda,
      percentage: (token.valueInAda / totalValue * 100),
      displayAmount: token.displayAmount,
      adaValue: formatTokenAmount(token.valueInAda, 'ADA')
    }));

    if (otherTokens.length > 0) {
      const othersValue = otherTokens.reduce((sum, token) => sum + token.valueInAda, 0);
      chartData.push({
        name: 'Others',
        fullName: `Other Tokens (${otherTokens.length})`,
        symbol: 'OTHERS',
        value: othersValue,
        percentage: (othersValue / totalValue * 100),
        displayAmount: `${otherTokens.length} tokens`,
        adaValue: formatTokenAmount(othersValue, 'ADA')
      });
    }

    chartInstanceRef.current = new Chart(tokenChartRef.current, {
      type: 'doughnut',
      data: {
        labels: chartData.map(item => item.name),
        datasets: [{
          data: chartData.map(item => item.value),
          backgroundColor: chartColorsRef.current.slice(0, chartData.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 20,
              boxWidth: 12,
              font: {
                size: 11,
                family: "'Inter', system-ui, sans-serif"
              },
              generateLabels: (chart) => {
                return chartData.map((item, i) => ({
                  text: `${item.name} • ₳${item.adaValue}`,
                  fillStyle: chartColorsRef.current[i],
                  hidden: false,
                  lineWidth: 0,
                  index: i
                }));
              }
            }
          },
          tooltip: {
            enabled: true,
            position: 'nearest',
            callbacks: {
              title: (items) => {
                const item = chartData[items[0].dataIndex];
                return item.fullName;
              },
              label: (context) => {
                const item = chartData[context.dataIndex];
                return [
                  `Symbol: ${item.symbol || 'Unknown'}`,
                  `Balance: ${item.displayAmount}`,
                  `Value: ₳${item.adaValue}`,
                  `Share: ${item.percentage.toFixed(1)}%`
                ];
              }
            },
            titleFont: {
              size: 14,
              weight: 'bold',
              family: "'Inter', system-ui, sans-serif"
            },
            bodyFont: {
              size: 13,
              family: "'Inter', system-ui, sans-serif"
            },
            padding: 16,
            bodySpacing: 8,
            displayColors: false,
            boxPadding: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            titleColor: '#000',
            bodyColor: '#4B5563',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            cornerRadius: 8,
            titleAlign: 'left',
            bodyAlign: 'left',
            boxWidth: 320,
            boxHeight: 'auto',
            titleMarginBottom: 10,
            usePointStyle: true
          }
        }
      }
    });
  }, [walletData, isLoading]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'received':
        return {
          bg: 'bg-blue-100',
          icon: <ArrowUp className="h-4 w-4 text-[#2563EB]" />,
          color: 'text-[#34D399]'
        };
      case 'sent':
        return {
          bg: 'bg-red-100',
          icon: <ArrowDown className="h-4 w-4 text-[#EF4444]" />,
          color: 'text-[#EF4444]'
        };
      case 'swap':
        return {
          bg: 'bg-purple-100',
          icon: <Shuffle className="h-4 w-4 text-[#6366F1]" />,
          color: 'text-[#6366F1]'
        };
      default:
        return {
          bg: 'bg-gray-100',
          icon: <ArrowDown className="h-4 w-4 text-gray-500" />,
          color: 'text-gray-500'
        };
    }
  };

  const formatTransactionAmount = (tx: Transaction) => {
    if (!tx.amount) return '₳0.00';

    if (tx.type === 'received') {
      return `+₳${formatTokenAmount(tx.amount, 'ADA')}`;
    } else if (tx.type === 'sent') {
      return `-₳${formatTokenAmount(tx.amount, 'ADA')}`;
    } else if (tx.type === 'swap') {
      return `₳${formatTokenAmount(tx.amount, 'ADA')} → ${formatTokenAmount(tx.tokenAmount || 0, tx.tokenSymbol || '')} ${tx.tokenSymbol}`;
    }
    return `₳${formatTokenAmount(tx.amount, 'ADA')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card className="bg-white p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-gray-500 font-medium">Total Balance</h2>
          <div className="bg-[#34D399]/10 text-[#34D399] text-sm font-medium px-2 py-1 rounded">
            +{walletData?.balance.percentChange}% ↑
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">
            ₳{formatTokenAmount(walletData?.balance.ada || 0, 'ADA')}
          </span>
          <span className="text-gray-500 text-sm ml-2">ADA</span>
        </div>
        <div className="text-gray-500 text-sm mt-1">≈ ${formatADA(walletData?.balance.usd || 0)} USD</div>
      </Card>

      <Card className="bg-white p-6">
        <h2 className="text-gray-500 font-medium mb-4">Token Distribution</h2>
        <div className="h-72 relative">
          <canvas ref={tokenChartRef} id="token-distribution-chart" />
        </div>
      </Card>

      <Card className="bg-white p-6">
        <h2 className="text-gray-500 font-medium mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {walletData?.transactions?.slice(0, 3).map((tx: Transaction, index: number) => {
            const txStyle = getTransactionIcon(tx.type);
            return (
              <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                <div className="flex items-center">
                  <div className={`${txStyle.bg} p-1.5 rounded-md mr-3`}>
                    {txStyle.icon}
                  </div>
                  <div>
                    <div className="font-medium">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
                    <div className="text-xs text-gray-500">{tx.date}, {tx.time}</div>
                  </div>
                </div>
                <div className={txStyle.color + " font-medium"}>
                  {formatTransactionAmount(tx)}
                </div>
              </div>
            );
          })}
        </div>
        <button
          className="mt-4 text-[#2563EB] text-sm font-medium"
          onClick={() => window.location.href = "/transactions"}
        >
          View all transactions →
        </button>
      </Card>
    </div>
  );
};

export default WalletOverview;