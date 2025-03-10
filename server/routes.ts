import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchWalletData } from "./services/cardanoApi";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get('/api/wallet/:address', async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Try to get wallet from storage first
      let wallet = await storage.getWalletByAddress(address);
      
      // If wallet doesn't exist or data is stale, fetch from API
      if (!wallet || isStaleData(wallet.lastUpdated)) {
        const walletData = await fetchWalletData(address);
        
        if (!walletData) {
          return res.status(404).json({ message: 'Wallet not found or invalid address' });
        }
        
        // Store or update wallet data in storage
        if (!wallet) {
          wallet = await storage.createWallet({
            address: walletData.address,
            handle: walletData.handle || null,
            lastUpdated: new Date()
          });
          
          // Store tokens
          for (const token of walletData.tokens) {
            await storage.createToken({
              walletId: wallet.id,
              name: token.name,
              symbol: token.symbol,
              balance: token.balance,
              valueUsd: token.valueUsd || 0
            });
          }
          
          // Store transactions
          for (const tx of walletData.transactions) {
            await storage.createTransaction({
              walletId: wallet.id,
              type: tx.type,
              amount: tx.amount,
              date: new Date(tx.timestamp * 1000),
              address: tx.address,
              fullAddress: tx.fullAddress,
              tokenSymbol: tx.tokenSymbol,
              tokenAmount: tx.tokenAmount || 0,
              explorerUrl: tx.explorerUrl
            });
          }
          
          // Store NFTs
          for (const nft of walletData.nfts || []) {
            await storage.createNFT({
              walletId: wallet.id,
              name: nft.name,
              collection: nft.collection || '',
              image: nft.image || '',
              policyId: nft.policyId || '',
              attributes: nft.attributes || []
            });
          }
          
          // Store balance history
          for (const history of walletData.balanceHistory) {
            await storage.createBalanceHistory({
              walletId: wallet.id,
              date: new Date(history.date),
              balance: history.balance
            });
          }
        } else {
          // Update wallet
          wallet = await storage.updateWallet(wallet.id, {
            ...wallet,
            lastUpdated: new Date()
          });
          
          // For simplicity, in a real app we would update tokens, transactions, NFTs, etc.
        }
      }
      
      // Return wallet data
      const tokens = await storage.getTokensByWalletId(wallet.id);
      const transactions = await storage.getTransactionsByWalletId(wallet.id);
      const nfts = await storage.getNFTsByWalletId(wallet.id);
      const history = await storage.getBalanceHistoryByWalletId(wallet.id);
      
      // Calculate total balance in ADA and USD
      const adaToken = tokens.find(t => t.symbol === 'ADA');
      const totalAdaBalance = adaToken?.balance || 0;
      const totalUsdBalance = tokens.reduce((sum, token) => sum + (Number(token.valueUsd) || 0), 0);
      
      // Calculate token distribution percentages
      const tokenDistribution = calculateTokenDistribution(tokens);
      
      // Format transactions for display
      const formattedTransactions = transactions.map(tx => ({
        ...tx,
        date: formatDate(tx.date),
        time: formatTime(tx.date)
      }));
      
      // Format balance history for chart
      const formattedHistory = history.map(h => ({
        date: formatChartDate(h.date),
        balance: Number(h.balance)
      }));
      
      // Return combined data
      return res.json({
        address: wallet.address,
        handle: wallet.handle,
        balance: {
          ada: Number(totalAdaBalance),
          usd: totalUsdBalance,
          percentChange: calculatePercentChange(formattedHistory)
        },
        tokens,
        transactions: formattedTransactions,
        nfts,
        balanceHistory: formattedHistory,
        tokenDistribution
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      return res.status(500).json({ message: 'Failed to fetch wallet data' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Helper functions
function isStaleData(lastUpdated: Date): boolean {
  // Consider data stale if it's older than 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return lastUpdated < thirtyMinutesAgo;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatChartDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function calculatePercentChange(history: any[]): number {
  if (history.length < 2) return 0;
  
  const latest = history[history.length - 1].balance;
  const previous = history[0].balance;
  
  if (previous === 0) return 0;
  
  return Number(((latest - previous) / previous * 100).toFixed(1));
}

function calculateTokenDistribution(tokens: any[]): any {
  const total = tokens.reduce((sum, token) => sum + Number(token.valueUsd || 0), 0);
  
  if (total === 0) return { ada: 0, hosky: 0, djed: 0, others: 0 };
  
  const ada = tokens.find(t => t.symbol === 'ADA')?.valueUsd || 0;
  const hosky = tokens.find(t => t.symbol === 'HOSKY')?.valueUsd || 0;
  const djed = tokens.find(t => t.symbol === 'DJED')?.valueUsd || 0;
  const others = total - ada - hosky - djed;
  
  return {
    ada: Math.round((ada / total) * 100),
    hosky: Math.round((hosky / total) * 100),
    djed: Math.round((djed / total) * 100),
    others: Math.round((others / total) * 100)
  };
}
