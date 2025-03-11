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

                if (isLovelace) {
                  await storage.createToken({
                    walletId: wallet.id,
                    name: 'Cardano',
                    symbol: 'ADA',
                    balance: String(rawBalance), // Store raw lovelace amount
                    valueUsd: (rawBalance / 1_000_000) * adaPrice, // Convert to ADA for USD value
                    decimals: 6,
                    unit: token.unit
                  });
                } else {
                  const tokenSymbol = token.symbol || 'UNKNOWN';
                  const decimals = token.decimals || 0; // Default to 0 decimals unless specified

                  // Calculate USD value based on token type
                  let valueUsd = null;
                  if (tokenPrice) {
                    if (decimals === 0) {
                      // For non-decimal tokens (HONEY, TALOS), use raw balance
                      valueUsd = rawBalance * tokenPrice.priceAda * adaPrice;
                    } else {
                      // For decimal tokens (IAGON, WMTX), adjust by decimals
                      valueUsd = (rawBalance / Math.pow(10, decimals)) * tokenPrice.priceAda * adaPrice;
                    }
                  }

                  await storage.createToken({
                    walletId: wallet.id,
                    name: token.name || 'Unknown Token',
                    symbol: tokenSymbol,
                    balance: String(rawBalance), // Always store raw balance
                    valueUsd: valueUsd ? String(valueUsd) : null,
                    decimals,
                    unit: token.unit
                  });
                }
              }
            }

            if (walletData.transactions) {
              for (const tx of walletData.transactions) {
                try {
                  const txDetails = await getTransactionDetails(tx.hash, address);

                  await storage.createTransaction({
                    walletId: wallet.id,
                    type: txDetails.type || 'transfer',
                    amount: txDetails.amount,
                    date: new Date(tx.blockTime * 1000),
                    address: txDetails.counterpartyAddress ?
                      `${txDetails.counterpartyAddress.slice(0, 8)}...${txDetails.counterpartyAddress.slice(-8)}` :
                      null,
                    fullAddress: txDetails.counterpartyAddress,
                    tokenSymbol: txDetails.unit === 'lovelace' ? 'ADA' : txDetails.tokenSymbol,
                    tokenAmount: txDetails.tokenAmount,
                    explorerUrl: `https://cardanoscan.io/transaction/${tx.hash}`
                  });
                } catch (txError) {
                  console.error(`Failed to process transaction ${tx.hash}:`, txError);
                }
              }
            }

            if (walletData.balance) {
              await storage.createBalanceHistory({
                walletId: wallet.id,
                date: new Date(),
                balance: String(walletData.balance)
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
          if ((error as any).status_code === 404) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
          return res.status(500).json({ message: 'Failed to fetch blockchain data' });
        }
      }

      const tokens = await storage.getTokensByWalletId(wallet.id);
      const transactions = await storage.getTransactionsByWalletId(wallet.id);
      const nfts = await storage.getNFTsByWalletId(wallet.id);
      const history = await storage.getBalanceHistoryByWalletId(wallet.id);

      // Return the stored values without recalculation
      const updatedTokens = tokens.map(token => {
        // Only update USD values based on current prices, no balance adjustments
        const price = tokenPrices.get(token.symbol);
        const rawBalance = Number(token.balance);
        const isAda = token.symbol === 'ADA';

        let valueUsd = null;
        if (isAda) {
          valueUsd = (rawBalance / 1_000_000) * adaPrice;
        } else if (price) {
          if (token.decimals === 0) {
            // For non-decimal tokens, use raw balance
            valueUsd = rawBalance * price.priceAda * adaPrice;
          } else {
            // For decimal tokens, adjust by decimals
            valueUsd = (rawBalance / Math.pow(10, token.decimals)) * price.priceAda * adaPrice;
          }
        }

        return {
          ...token,
          valueUsd: valueUsd ? String(valueUsd) : null
        };
      });

      // Get ADA balance from stored raw value
      const adaToken = updatedTokens.find(t => t.symbol === 'ADA');
      const adaBalance = adaToken ? 
        formatADA(Number(adaToken.balance) / 1_000_000) : 
        '0';

      return res.json({
        address: wallet.address,
        handle: wallet.handle,
        balance: {
          ada: adaBalance,
          usd: Number(adaBalance) * adaPrice,
          adaPrice,
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

function formatADA(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}