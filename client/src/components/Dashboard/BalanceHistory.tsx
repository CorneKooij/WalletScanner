import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import Chart from 'chart.js/auto';

// Time periods for the chart
const TIME_PERIODS = ['1D', '1W', '1M', '3M', '1Y', 'All'];

const BalanceHistory = () => {
  const { walletData } = useWallet();
  const [selectedPeriod, setSelectedPeriod] = useState('1D');
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const createBalanceHistoryChart = () => {
    if (!chartRef.current || !walletData?.balanceHistory) return;

    // Cleanup previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Filter data based on selected period
    let historyData = [...walletData.balanceHistory];
    
    // Apply time period filter
    if (selectedPeriod !== 'All') {
      const now = new Date();
      let filterDate = new Date();
      
      switch (selectedPeriod) {
        case '1D':
          filterDate.setDate(now.getDate() - 1);
          break;
        case '1W':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '1M':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3M':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case '1Y':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      historyData = historyData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= filterDate;
      });
    }

    const labels = historyData.map(item => item.date);
    const data = historyData.map(item => item.balance);

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'ADA Balance',
          data,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#2563EB'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `₳${context.raw.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return `₳${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    if (walletData) {
      createBalanceHistoryChart();
    }
  }, [walletData, selectedPeriod]);

  if (!walletData) {
    return null;
  }

  return (
    <Card className="bg-white p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h2 className="text-xl font-semibold mb-2 sm:mb-0">Balance History</h2>
        <div className="flex space-x-2">
          {TIME_PERIODS.map(period => (
            <button
              key={period}
              className={`px-3 py-1 text-sm rounded-md ${
                selectedPeriod === period 
                  ? 'bg-[#2563EB] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 relative">
        <canvas ref={chartRef} id="balance-history-chart"></canvas>
      </div>
    </Card>
  );
};

export default BalanceHistory;
