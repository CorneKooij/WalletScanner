import { useEffect, useRef } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { formatADA, formatTokenAmount } from '@/lib/formatUtils';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Shuffle } from 'lucide-react';
import Chart from 'chart.js/auto';

interface Token {
  symbol: string;
  name: string;
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
  const chartColorsRef = useRef<string[]>([
    '#2563EB', // ADA Blue
    '#34D399', // Green
    '#6366F1', // Purple
    '#F472B6', // Pink
    '#FB923C', // Orange
    '#FBBF24', // Yellow
    '#EC4899', // Hot Pink
    '#8B5CF6', // Violet
    '#D1D5DB'  // Gray (for Others)
  ]);

  // Create and update token distribution chart
  const createTokenDistributionChart = () => {
    if (!tokenChartRef.current || !walletData?.tokens) return;

    // Cleanup previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Calculate token values in USD for proper distribution
    const adaValueUsd = walletData.balance.usd || 0;
    const tokenValues: { [key: string]: { value: number, name: string } } = {
      ADA: { value: adaValueUsd, name: 'ADA' }
    };

    // Calculate USD values for all tokens
    walletData.tokens.forEach(token => {
      if (!token.symbol || token.symbol === 'ADA' || !token.valueUsd) return;
      tokenValues[token.symbol] = {
        value: token.valueUsd,
        name: token.name || token.symbol
      };
    });

    // Sort tokens by value and filter out insignificant ones (less than 1% of total value)
    const totalValue = Object.values(tokenValues).reduce((sum, { value }) => sum + value, 0);
    const significantTokens = Object.entries(tokenValues)
      .filter(([, { value }]) => (value / totalValue) >= 0.01) // Only show tokens that are at least 1% of total value
      .sort(([, a], [, b]) => b.value - a.value);

    // Calculate "Others" value for remaining tokens
    const otherTokens = Object.entries(tokenValues)
      .filter(([, { value }]) => (value / totalValue) < 0.01);
    const othersValue = otherTokens.reduce((sum, [, { value }]) => sum + value, 0);

    // Calculate percentages
    const percentages: { [key: string]: number } = {};
    significantTokens.forEach(([symbol, { value }]) => {
      percentages[symbol] = Math.round((value / totalValue) * 100);
    });
    if (othersValue > 0) {
      percentages['Others'] = Math.round((othersValue / totalValue) * 100);
    }

    // Prepare chart data
    const labels = [...significantTokens.map(([, { name }]) => name)];
    if (othersValue > 0) labels.push('Others');

    const data = [...significantTokens.map(([, { value }]) => value)];
    if (othersValue > 0) data.push(othersValue);

    // Create chart
    chartInstanceRef.current = new Chart(tokenChartRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: chartColorsRef.current.slice(0, labels.length),
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
              boxWidth: 12,
              padding: 15,
              font: {
                size: 11
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels?.length && data.datasets.length) {
                  return data.labels.map((label, index) => {
                    const percentage = percentages[significantTokens[index]?.[0] || 'Others'];
                    return {
                      text: `${label} (${percentage}%)`,
                      fillStyle: chartColorsRef.current[index],
                      lineWidth: 0,
                      index
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `${context.label}: $${formatADA(value)} (${percentages[significantTokens[context.dataIndex]?.[0] || 'Others']}%)`;
              }
            }
          }
        }
      }
    });
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
        <div className="h-64 relative"> {/* Increased height to accommodate legend */}
          <canvas ref={tokenChartRef} id="token-distribution-chart"></canvas>
        </div>
      </Card>
    </div>
  );
};

export default WalletOverview;