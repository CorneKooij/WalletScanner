import { useEffect, useRef } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { formatADA, formatTokenAmount } from '@/lib/formatUtils';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Shuffle } from 'lucide-react';
import Chart from 'chart.js/auto';

interface Token {
  symbol: string;
  balance: string | number;
  valueUsd?: number;
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
  const { walletData } = useWallet();
  const tokenChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const chartColorsRef = useRef<string[]>(['#2563EB', '#34D399', '#6366F1', '#EF4444', '#D1D5DB']);

  // Create and update token distribution chart
  const createTokenDistributionChart = () => {
    if (!tokenChartRef.current || !walletData?.tokens) return;

    // Cleanup previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Calculate token values in ADA equivalent for proper distribution
    const tokenValues = {
      ada: parseFloat(formatTokenAmount(walletData.balance.ada || 0, 'ADA')),
      other: 0
    };

    // Group other tokens
    const otherTokens: { [key: string]: number } = {};
    walletData.tokens.forEach(token => {
      if (!token.symbol || token.symbol === 'ADA') return;

      const value = parseFloat(formatTokenAmount(token.balance || 0, token.symbol));
      if (value >= (tokenValues.ada * 0.05)) { // Only show tokens that are at least 5% of ADA value
        otherTokens[token.symbol] = value;
      } else {
        tokenValues.other += value;
      }
    });

    // Sort tokens by value and take top 3
    const sortedTokens = Object.entries(otherTokens)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    // Add remaining tokens to 'other'
    Object.entries(otherTokens)
      .slice(3)
      .forEach(([,value]) => {
        tokenValues.other += value;
      });

    // Calculate total for percentages
    const total = tokenValues.ada + 
      sortedTokens.reduce((sum, [,value]) => sum + value, 0) + 
      tokenValues.other;

    // Calculate percentages
    const percentages = {
      ada: Math.round((tokenValues.ada / total) * 100) || 0,
      ...Object.fromEntries(
        sortedTokens.map(([symbol, value]) => [
          symbol.toLowerCase(),
          Math.round((value / total) * 100) || 0
        ])
      ),
      other: Math.round((tokenValues.other / total) * 100) || 0
    };

    // Create chart data
    const labels = ['ADA', ...sortedTokens.map(([symbol]) => symbol), 'Others'];
    const data = [percentages.ada, ...sortedTokens.map(([symbol]) => percentages[symbol.toLowerCase()]), percentages.other];

    chartInstanceRef.current = new Chart(tokenChartRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: chartColorsRef.current,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        }
      }
    });

    // Store the generated data for the legend
    return {
      labels,
      percentages,
      colors: chartColorsRef.current.slice(0, labels.length)
    };
  };

  useEffect(() => {
    if (walletData) {
      createTokenDistributionChart();
    }
  }, [walletData]);

  if (!walletData) {
    return null;
  }

  // Get transaction icon and color based on type
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

  // Format transaction amount based on type
  const formatTransactionAmount = (tx: Transaction) => {
    if (tx.type === 'received') {
      return `+₳${formatTokenAmount(tx.amount, 'ADA')}`;
    } else if (tx.type === 'sent') {
      return `-₳${formatTokenAmount(tx.amount, 'ADA')}`;
    } else if (tx.type === 'swap') {
      return `₳${formatTokenAmount(tx.amount, 'ADA')} → ${formatTokenAmount(tx.tokenAmount || 0, tx.tokenSymbol || '')} ${tx.tokenSymbol}`;
    }
    return `₳${formatTokenAmount(tx.amount, 'ADA')}`;
  };

  const recentTransactions = walletData.transactions.slice(0, 3);
  const chartData = createTokenDistributionChart();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Total Balance Card */}
      <Card className="bg-white p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-gray-500 font-medium">Total Balance</h2>
          <div className="bg-[#34D399]/10 text-[#34D399] text-sm font-medium px-2 py-1 rounded">
            +{walletData.balance.percentChange}% ↑
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">₳{formatTokenAmount(walletData.balance.ada, 'ADA')}</span>
          <span className="text-gray-500 text-sm ml-2">ADA</span>
        </div>
        <div className="text-gray-500 text-sm mt-1">≈ ${formatADA(walletData.balance.usd)} USD</div>
      </Card>

      {/* Recent Activity Card */}
      <Card className="bg-white p-6">
        <h2 className="text-gray-500 font-medium mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentTransactions.map((tx: Transaction, index: number) => {
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

      {/* Token Distribution Card */}
      <Card className="bg-white p-6">
        <h2 className="text-gray-500 font-medium mb-4">Token Distribution</h2>
        <div className="h-48 relative">
          <canvas ref={tokenChartRef} id="token-distribution-chart"></canvas>
        </div>
        {chartData && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {chartData.labels.map((label, index) => (
              <div key={label} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: chartData.colors[index] }}
                />
                <span>
                  {label} ({index < chartData.labels.length - 1 ? 
                    chartData.percentages[label.toLowerCase()] : 
                    chartData.percentages.other}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WalletOverview;