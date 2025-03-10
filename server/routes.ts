import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getWalletInfo, getTokenMetadata, getTransactionDetails } from './services/blockfrostService';
import { getTokenPrices } from './services/muesliswapService';

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.get('/api/wallet/:address', async (req, res) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }

      if (!address.startsWith('addr1')) {
        return res.status(400).json({ message: 'Invalid Cardano address format' });
      }

      let wallet = await storage.getWalletByAddress(address);
      const tokenPrices = await getTokenPrices();
      const adaPrice = tokenPrices.get('ADA')?.priceUsd || 0;

      if (!wallet || isStaleData(wallet.lastUpdated)) {
        try {
          const walletData = await getWalletInfo(address);

          if (!wallet) {
            wallet = await storage.createWallet({
              address: walletData.address,
              handle: null,
              lastUpdated: new Date()
            });

            if (walletData.tokens) {
              for (const token of walletData.tokens) {
                const tokenPrice = tokenPrices.get(token.symbol);
                const isLovelace = token.unit === 'lovelace';
                const rawBalance = Number(token.quantity || 0);

                await storage.createToken({
                  walletId: wallet.id,
                  name: token.name || 'Unknown Token',
                  symbol: isLovelace ? 'ADA' : (token.symbol || 'UNKNOWN'),
                  balance: String(rawBalance), // Store raw value without conversion
                  valueUsd: null, // Don't store USD value, calculate it in response
                  decimals: token.decimals || 0,
                  unit: token.unit
                });
              }
            }

            if (walletData.transactions) {
              for (const tx of walletData.transactions) {
                try {
                  const txDetails = await getTransactionDetails(tx.hash, walletData.address);
                  const isLovelace = txDetails.unit === 'lovelace';
                  const rawAmount = Number(txDetails.amount || 0);
                  const amount = isLovelace ? rawAmount / 1_000_000 : rawAmount;

                  await storage.createTransaction({
                    walletId: wallet.id,
                    type: txDetails.type || 'transfer',
                    amount: String(amount), // Store converted amount for transactions
                    date: new Date(tx.blockTime * 1000),
                    address: txDetails.counterpartyAddress ?
                      `${txDetails.counterpartyAddress.slice(0, 8)}...${txDetails.counterpartyAddress.slice(-8)}` :
                      null,
                    fullAddress: txDetails.counterpartyAddress,
                    tokenSymbol: isLovelace ? 'ADA' : (txDetails.tokenSymbol || 'UNKNOWN'),
                    tokenAmount: txDetails.tokenAmount || '0',
                    explorerUrl: `https://cardanoscan.io/transaction/${tx.hash}`
                  });
                } catch (txError) {
                  console.error(`Failed to process transaction ${tx.hash}:`, txError);
                }
              }
            }

            if (walletData.balance) {
              const rawBalance = Number(walletData.balance);
              await storage.createBalanceHistory({
                walletId: wallet.id,
                date: new Date(),
                balance: String(rawBalance) // Store raw value without conversion
              });
            }
          } else {
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

      const tokens = await storage.getTokensByWalletId(wallet.id);
      const transactions = await storage.getTransactionsByWalletId(wallet.id);
      const nfts = await storage.getNFTsByWalletId(wallet.id);
      const history = await storage.getBalanceHistoryByWalletId(wallet.id);

      // Convert raw values for display
      const updatedTokens = tokens.map(token => {
        const price = tokenPrices.get(token.symbol);
        const rawBalance = Number(token.balance);
        const isAda = token.symbol === 'ADA';

        if (isAda) {
          const adaBalance = rawBalance / 1_000_000;
          return {
            ...token,
            balance: String(adaBalance),
            valueUsd: price ? adaBalance * price.priceUsd : null
          };
        }

        return {
          ...token,
          balance: String(rawBalance),
          valueUsd: price ? rawBalance * price.priceUsd : null
        };
      });

      // Get ADA balance
      const adaToken = updatedTokens.find(t => t.symbol === 'ADA');
      const adaBalance = adaToken ? adaToken.balance : '0';

      // Convert history from lovelace to ADA
      const convertedHistory = history.map(h => ({
        ...h,
        balance: String(Number(h.balance) / 1_000_000)
      }));

      return res.json({
        address: wallet.address,
        handle: null,
        balance: {
          ada: adaBalance,
          usd: Number(adaBalance) * adaPrice,
          adaPrice,
          percentChange: calculatePercentChange(convertedHistory)
        },
        tokens: updatedTokens,
        transactions,
        nfts,
        balanceHistory: convertedHistory
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