import { useEffect, useRef } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { formatADA, formatTokenAmount } from '@/lib/formatUtils';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Shuffle } from 'lucide-react';
import Chart from 'chart.js/auto';

interface Token {
  name: string;
  symbol: string;
  balance: string | number;
  valueUsd?: number | null;
  decimals?: number;
  unit?: string;
}

const WalletOverview = () => {
  const { walletData, isLoading } = useWallet();
  const tokenChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const chartColorsRef = useRef<string[]>([
    '#2563EB', // Primary
    '#34D399', // Success
    '#6366F1', // Info
    '#FB923C', // Warning
    '#F472B6', // Pink
    '#FBBF24', // Yellow
    '#EC4899', // Hot Pink
    '#8B5CF6', // Violet
    '#D1D5DB'  // Gray (for Others)
  ]);

  useEffect(() => {
    if (!tokenChartRef.current || !walletData?.tokens || isLoading) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const processedTokens = walletData.tokens
      .filter(token => {
        if (!token || !token.balance) return false;
        const rawBalance = Number(token.balance);
        return rawBalance > 0;
      })
      .map(token => {
        const isAda = token.symbol === 'ADA';
        const rawBalance = Number(token.balance);

        let valueInAda = 0;
        let displayAmount = '';

        if (isAda) {
          valueInAda = Number(walletData.balance.ada);
          displayAmount = `${valueInAda} ADA`;
        } else {
          // ADA special case
          if (token.symbol === 'ADA') {
            displayAmount = `${formatADA(rawBalance / 1_000_000)} ADA`;
            valueInAda = rawBalance / 1_000_000;
          } 
          // Handle other tokens based on their decimals property
          else {
            // Check if token has zero decimals from token data
            const hasZeroDecimals = token.decimals === 0;

            // Display whole numbers for tokens with zero decimals
            if (hasZeroDecimals) {
              displayAmount = `${Math.floor(rawBalance)} ${token.symbol}`;
            }
            // For tokens with decimals, format according to their decimals property
            else {
              const maxDecimals = token.decimals || 6; // Default to 6 if not specified
              displayAmount = `${Number(rawBalance).toLocaleString(undefined, {
                maximumFractionDigits: maxDecimals
              })} ${token.symbol}`;
            }
          }
          valueInAda = token.valueUsd && walletData.balance.adaPrice
            ? Number((token.valueUsd / walletData.balance.adaPrice).toFixed(6))
            : 0;
        }

        return {
          name: token.name || token.symbol,
          symbol: token.symbol,
          valueInAda,
          displayAmount,
          usdValue: token.valueUsd ? formatADA(token.valueUsd) : '0.00'
        };
      })
      .filter(token => token.valueInAda > 0)
      .sort((a, b) => b.valueInAda - a.valueInAda);

    const totalValue = processedTokens.reduce((sum, token) => sum + token.valueInAda, 0);

    // Filter tokens with significant value (>= 1% of total)
    const significantTokens = processedTokens.filter(token =>
      (token.valueInAda / totalValue) >= 0.01
    );

    const otherTokens = processedTokens.filter(token =>
      (token.valueInAda / totalValue) < 0.01
    );

    // Prepare chart data
    const chartData = significantTokens.map(token => ({
      name: token.name,
      symbol: token.symbol,
      value: token.valueInAda,
      percentage: (token.valueInAda / totalValue * 100),
      displayAmount: token.displayAmount,
      adaEquivalent: `₳${token.valueInAda.toFixed(2)}`,
      usdValue: token.usdValue
    }));

    // Add "Others" category if there are small-value tokens
    if (otherTokens.length > 0) {
      const othersValue = otherTokens.reduce((sum, token) => sum + token.valueInAda, 0);
      chartData.push({
        name: `Other Tokens (${otherTokens.length})`,
        symbol: 'OTHERS',
        value: othersValue,
        percentage: (othersValue / totalValue * 100),
        displayAmount: `${otherTokens.length} tokens`,
        adaEquivalent: `₳${othersValue.toFixed(2)}`,
        usdValue: formatADA(othersValue * walletData.balance.adaPrice)
      });
    }

    // Create chart
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
                  text: `${item.name} • ${item.adaEquivalent}`,
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
              title: (items) => items[0] ? chartData[items[0].dataIndex].name : '',
              label: (context) => {
                const item = chartData[context.dataIndex];
                return [
                  `Amount: ${item.displayAmount}`,
                  `Value: ${item.adaEquivalent}`,
                  `USD: $${item.usdValue}`,
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
            displayColors: false
          }
        }
      }
    });
  }, [walletData, isLoading]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Total Balance Card */}
      <Card className="bg-white p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-gray-500 font-medium">Total Balance</h2>
          <div className="bg-success/10 text-success text-sm font-medium px-2 py-1 rounded">
            +{walletData?.balance.percentChange}% ↑
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">
            ₳{walletData?.balance.ada || '0'}
          </span>
          <span className="text-gray-500 text-sm ml-2">ADA</span>
        </div>
        <div className="text-gray-500 text-sm mt-1">
          ≈ ${formatADA(walletData?.balance.usd || 0)} USD
        </div>
        <div className="text-gray-400 text-xs mt-2">
          1 ADA = ${formatADA(walletData?.balance.adaPrice || 0)} USD
        </div>
      </Card>

      {/* Token Distribution Card */}
      <Card className="bg-white p-6">
        <h2 className="text-gray-500 font-medium mb-4">Token Distribution</h2>
        <div className="h-72 relative">
          <canvas ref={tokenChartRef} id="token-distribution-chart" />
        </div>
      </Card>

      {/* Recent Activity Card */}
      <Card className="bg-white p-6">
        <h2 className="text-gray-500 font-medium mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {walletData?.transactions?.slice(0, 3).map((tx, index) => {
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
                  {formatAmount(tx)}
                </div>
              </div>
            );
          })}
        </div>
        <button
          className="mt-4 text-primary text-sm font-medium hover:underline"
          onClick={() => window.location.href = "/transactions"}
        >
          View all transactions →
        </button>
      </Card>
    </div>
  );
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'received':
      return {
        bg: 'bg-blue-100',
        icon: <ArrowDown className="h-4 w-4 text-primary" />,
        color: 'text-success'
      };
    case 'sent':
      return {
        bg: 'bg-red-100',
        icon: <ArrowUp className="h-4 w-4 text-destructive" />,
        color: 'text-destructive'
      };
    case 'swap':
      return {
        bg: 'bg-purple-100',
        icon: <Shuffle className="h-4 w-4 text-info" />,
        color: 'text-info'
      };
    default:
      return {
        bg: 'bg-gray-100',
        icon: <ArrowDown className="h-4 w-4 text-gray-500" />,
        color: 'text-gray-500'
      };
  }
};

const formatAmount = (tx: any) => {
  if (!tx.amount) return '₳0.00';

  if (tx.type === 'received') {
    return (
      <span className="text-success font-medium">
        +₳{formatTokenAmount(tx.amount, 'ADA')}
      </span>
    );
  } else if (tx.type === 'sent') {
    return (
      <span className="text-destructive font-medium">
        -₳{formatTokenAmount(tx.amount, 'ADA')}
      </span>
    );
  } else if (tx.type === 'swap') {
    return (
      <span className="text-info font-medium">
        ₳{formatTokenAmount(tx.amount, 'ADA')} → {formatTokenAmount(tx.tokenAmount || '0', tx.tokenSymbol)} {tx.tokenSymbol}
      </span>
    );
  }
  // Default to green for other positive transactions
  return <span className="text-success font-medium">₳{formatTokenAmount(tx.amount, 'ADA')}</span>;
};

export default WalletOverview;