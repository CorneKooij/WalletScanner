import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchWalletData } from "./services/cardanoApi";

import { getWalletInfo, getTokenMetadata, getTransactionDetails } from './services/blockfrostService';

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
      
      // If wallet doesn't exist or data is stale, fetch from Blockfrost
      if (!wallet || isStaleData(wallet.lastUpdated)) {
        try {
          const walletData = await getWalletInfo(address);
          
          // Store or update wallet data in storage
          if (!wallet) {
            wallet = await storage.createWallet({
              address: walletData.address,
              handle: null, // Blockfrost doesn't provide handle info
              lastUpdated: new Date()
            });
            
            // Store tokens
            const tokens = walletData.tokens || [];
            for (const token of tokens) {
              await storage.createToken({
                walletId: wallet.id,
                name: token.name || 'Unknown Token',
                symbol: token.symbol || 'UNKNOWN',
                balance: token.quantity || '0',
                valueUsd: null // We would need a price feed service for this
              });
            }
            
            // Store transactions
            const transactions = walletData.transactions || [];
            for (const tx of transactions) {
              try {
                const txDetails = await getTransactionDetails(tx.hash, address);
                
                // Create explorer URL
                const explorerUrl = `https://cardanoscan.io/transaction/${tx.hash}`;
                
                // Create a shortened version of the counterparty address for display
                let displayAddress = null;
                if (txDetails.counterpartyAddress) {
                  const addr = txDetails.counterpartyAddress;
                  displayAddress = addr.substring(0, 8) + '...' + addr.substring(addr.length - 8);
                }
                
                // Store the transaction
                await storage.createTransaction({
                  walletId: wallet.id,
                  type: txDetails.type || 'transfer',
                  amount: txDetails.amount || txDetails.fees || '0',
                  date: new Date(tx.blockTime * 1000),
                  address: displayAddress,
                  fullAddress: txDetails.counterpartyAddress,
                  tokenSymbol: txDetails.tokenSymbol || 'ADA',
                  tokenAmount: txDetails.tokenAmount || '0',
                  explorerUrl: explorerUrl
                });
              } catch (txError) {
                console.error(`Failed to process transaction ${tx.hash}:`, txError);
                // Continue with next transaction
              }
            }
            
            // Store balance history (using current balance as we don't have historical data)
            await storage.createBalanceHistory({
              walletId: wallet.id,
              date: new Date(),
              balance: walletData.balance
            });
          } else {
            // Update wallet
            wallet = await storage.updateWallet(wallet.id, {
              ...wallet,
              lastUpdated: new Date()
            });
          }
        } catch (error: any) {
          console.error('Error fetching data from Blockfrost:', error);
          if (error.status_code === 404 || error.message === 'Wallet address not found') {
            return res.status(404).json({ message: 'Wallet not found or invalid address' });
          } else if (error.status_code === 403 || error.status_code === 401) {
            return res.status(500).json({ message: 'API authentication error. Please check your Blockfrost API key.' });
          } else if (error.status_code === 429) {
            return res.status(429).json({ message: 'Too many requests. Please try again later.' });
          }
          return res.status(500).json({ message: 'Failed to fetch blockchain data' });
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
