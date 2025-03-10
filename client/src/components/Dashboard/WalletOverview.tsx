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

  // Convert token distribution to chart data
  const createTokenDistributionChart = () => {
    if (!tokenChartRef.current || !walletData?.tokens) return;

    // Cleanup previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Convert raw token balances to USD values
    const tokenDistributionData = {
      ada: parseFloat(formatTokenAmount(walletData.balance.ada, 'ADA')),
      hosky: parseFloat(formatTokenAmount(walletData.tokens.find(t => t.symbol === 'HOSKY')?.balance || '0', 'HOSKY')),
      djed: parseFloat(formatTokenAmount(walletData.tokens.find(t => t.symbol === 'DJED')?.balance || '0', 'DJED')),
      others: walletData.tokens
        .filter(t => !['ADA', 'HOSKY', 'DJED'].includes(t.symbol))
        .reduce((sum, token) => sum + parseFloat(formatTokenAmount(token.balance, token.symbol)), 0)
    };

    const total = Object.values(tokenDistributionData).reduce((a, b) => a + b, 0);

    // Calculate percentages
    const percentages = {
      ada: Math.round((tokenDistributionData.ada / total) * 100) || 0,
      hosky: Math.round((tokenDistributionData.hosky / total) * 100) || 0,
      djed: Math.round((tokenDistributionData.djed / total) * 100) || 0,
      others: Math.round((tokenDistributionData.others / total) * 100) || 0
    };

    // Ensure percentages add up to 100%
    const sum = Object.values(percentages).reduce((a, b) => a + b, 0);
    if (sum < 100) {
      percentages.ada += (100 - sum);
    }

    chartInstanceRef.current = new Chart(tokenChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['ADA', 'HOSKY', 'DJED', 'Others'],
        datasets: [{
          data: [percentages.ada, percentages.hosky, percentages.djed, percentages.others],
          backgroundColor: ['#2563EB', '#34D399', '#6366F1', '#D1D5DB'],
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
        <div className="h-48 relative">
          <canvas ref={tokenChartRef} id="token-distribution-chart"></canvas>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#2563EB] rounded-full mr-2"></div>
            <span>ADA ({walletData.tokenDistribution?.ada || 0}%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#34D399] rounded-full mr-2"></div>
            <span>HOSKY ({walletData.tokenDistribution?.hosky || 0}%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#6366F1] rounded-full mr-2"></div>
            <span>DJED ({walletData.tokenDistribution?.djed || 0}%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span>Others ({walletData.tokenDistribution?.others || 0}%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WalletOverview;