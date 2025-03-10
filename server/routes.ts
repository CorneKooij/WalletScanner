import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getWalletInfo, getTokenMetadata, getTransactionDetails } from './services/blockfrostService';
import { getTokenPrices } from './services/muesliswapService';

export async function registerRoutes(app: Express): Promise<Server> {
  // Token prices endpoint
  app.get('/api/prices', async (req, res) => {
    try {
      const prices = await getTokenPrices();
      return res.json({
        prices: Array.from(prices.entries()).map(([symbol, data]) => ({
          symbol,
          ...data
        }))
      });
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return res.status(500).json({ message: 'Failed to fetch token prices' });
    }
  });

  // Wallet data endpoint
  app.get('/api/wallet/:address', async (req, res) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }

      if (!address.startsWith('addr1')) {
        return res.status(400).json({ message: 'Invalid Cardano address format' });
      }

      // Try to get wallet from storage first
      let wallet = await storage.getWalletByAddress(address);

      // Get current token prices
      const tokenPrices = await getTokenPrices();
      const adaPrice = tokenPrices.get('ADA')?.priceUsd || 0;

      // If wallet doesn't exist or data is stale, fetch from Blockfrost
      if (!wallet || isStaleData(wallet.lastUpdated)) {
        try {
          const walletData = await getWalletInfo(address);
          console.log('[Debug] Raw wallet data from Blockfrost:', walletData);

          // Create or update wallet
          if (!wallet) {
            wallet = await storage.createWallet({
              address: walletData.address,
              handle: null,
              lastUpdated: new Date()
            });

            // Store tokens with converted balances
            if (walletData.tokens) {
              for (const token of walletData.tokens) {
                const tokenPrice = tokenPrices.get(token.symbol);
                const isAda = token.symbol === 'ADA';
                const rawBalance = Number(token.quantity || 0);

                // Convert lovelace to ADA only once, right when we get the data
                const balance = isAda ? rawBalance / 1_000_000 : rawBalance;
                console.log(`[Debug] Token ${token.symbol}: Raw balance = ${rawBalance}, Converted = ${balance}`);

                await storage.createToken({
                  walletId: wallet.id,
                  name: token.name || 'Unknown Token',
                  symbol: token.symbol || 'UNKNOWN',
                  balance: String(balance), // Store the converted balance
                  valueUsd: tokenPrice ? balance * tokenPrice.priceUsd : null,
                  decimals: token.decimals || 0,
                  unit: token.unit
                });
              }
            }

            // Store transactions with converted amounts
            if (walletData.transactions) {
              for (const tx of walletData.transactions) {
                try {
                  const txDetails = await getTransactionDetails(tx.hash, walletData.address);
                  const isAda = txDetails.tokenSymbol === 'ADA';
                  const rawAmount = Number(txDetails.amount || 0);
                  const amount = isAda ? rawAmount / 1_000_000 : rawAmount;

                  await storage.createTransaction({
                    walletId: wallet.id,
                    type: txDetails.type || 'transfer',
                    amount: String(amount), // Store converted amount
                    date: new Date(tx.blockTime * 1000),
                    address: txDetails.counterpartyAddress ?
                      `${txDetails.counterpartyAddress.slice(0, 8)}...${txDetails.counterpartyAddress.slice(-8)}` :
                      null,
                    fullAddress: txDetails.counterpartyAddress,
                    tokenSymbol: txDetails.tokenSymbol || 'ADA',
                    tokenAmount: txDetails.tokenAmount || '0',
                    explorerUrl: `https://cardanoscan.io/transaction/${tx.hash}`
                  });
                } catch (txError) {
                  console.error(`Failed to process transaction ${tx.hash}:`, txError);
                }
              }
            }

            // Store balance history with converted balance
            if (walletData.balance) {
              const rawBalance = Number(walletData.balance);
              const balance = rawBalance / 1_000_000; // Convert lovelace to ADA
              console.log(`[Debug] Balance history: Raw = ${rawBalance}, Converted = ${balance}`);

              await storage.createBalanceHistory({
                walletId: wallet.id,
                date: new Date(),
                balance: String(balance) // Store converted balance
              });
            }
          } else {
            // Update existing wallet with fresh price data
            wallet = await storage.updateWallet(wallet.id, {
              ...wallet,
              lastUpdated: new Date()
            });
          }
        } catch (error) {
          console.error('Error fetching data from Blockfrost:', error);
          if (error.status_code === 404) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
          return res.status(500).json({ message: 'Failed to fetch blockchain data' });
        }
      }

      // Get wallet data - no need to convert since we store converted values
      const tokens = await storage.getTokensByWalletId(wallet.id);
      const transactions = await storage.getTransactionsByWalletId(wallet.id);
      const nfts = await storage.getNFTsByWalletId(wallet.id);
      const history = await storage.getBalanceHistoryByWalletId(wallet.id);

      // Update token values with current prices
      const updatedTokens = tokens.map(token => {
        const price = tokenPrices.get(token.symbol);
        console.log(`[Debug] Updating token ${token.symbol}: Balance = ${token.balance}, Price = ${price?.priceUsd}`);

        return {
          ...token,
          valueUsd: price ? Number(token.balance) * price.priceUsd : null
        };
      });

      // Find ADA token for total balance
      const adaToken = updatedTokens.find(t => t.symbol === 'ADA');
      const adaBalance = adaToken ? adaToken.balance : '0';
      console.log(`[Debug] Final ADA balance = ${adaBalance}`);

      return res.json({
        address: wallet.address,
        handle: null,
        balance: {
          ada: adaBalance,
          usd: Number(adaBalance) * adaPrice,
          adaPrice: adaPrice,
          percentChange: calculatePercentChange(history)
        },
        tokens: updatedTokens,
        transactions,
        nfts,
        balanceHistory: history
      });
    } catch (error) {
      console.error('Error processing wallet request:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function isStaleData(lastUpdated: Date | null): boolean {
  if (!lastUpdated) return true;
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return lastUpdated < thirtyMinutesAgo;
}

function calculatePercentChange(history: any[]): number {
  if (history.length < 2) return 0;
  const latest = Number(history[history.length - 1].balance);
  const previous = Number(history[0].balance);
  if (previous === 0) return 0;
  return Number(((latest - previous) / previous * 100).toFixed(1));
}