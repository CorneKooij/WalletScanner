import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  getWalletInfo,
  getTokenMetadata,
  getTransactionDetails,
} from "./services/blockfrostService";
import { getTokenPrices, getFallbackTokenPrices } from "./services/muesliswapService";
import { formatTokenAmount } from "../client/src/lib/formatUtils";
import { getWalletNFTs, getNFTTransactionHistory } from "./services/nftService";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/prices", async (req, res) => {
    try {
      const prices = await getTokenPrices();
      return res.json({
        prices: Array.from(prices.entries()).map(([symbol, data]) => ({
          symbol,
          ...data,
        })),
      });
    } catch (error) {
      console.error("Error fetching token prices:", error);
      return res.status(500).json({ message: "Failed to fetch token prices" });
    }
  });

  // Basic wallet info endpoint - high priority data
  app.get("/api/wallet/:address/info", async (req, res) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      if (!address.startsWith("addr1")) {
        return res
          .status(400)
          .json({ message: "Invalid Cardano address format" });
      }

      let wallet = await storage.getWalletByAddress(address);
      let tokenPrices = await getTokenPrices();
      const adaPrice = tokenPrices.get("ADA")?.priceUsd || 0;

      if (!wallet || isStaleData(wallet.lastUpdated)) {
        try {
          const walletData = await getWalletInfo(address);

          if (!wallet) {
            wallet = await storage.createWallet({
              address: walletData.address,
              handle: null,
              lastUpdated: new Date(),
            });

            if (walletData.tokens) {
              for (const token of walletData.tokens) {
                let tokenPrice = tokenPrices.get(token.symbol);
                const isLovelace = token.unit === "lovelace";
                const rawBalance = Number(token.quantity || 0);

                if (isLovelace) {
                  const formattedBalance = formatTokenAmount(
                    rawBalance,
                    "ADA",
                    6
                  );
                  await storage.createToken({
                    walletId: wallet.id,
                    name: "Cardano",
                    symbol: "ADA",
                    balance: String(rawBalance), // Raw lovelace
                    formattedBalance, // Formatted ADA amount
                    valueUsd: (rawBalance / 1_000_000) * adaPrice,
                    decimals: 6,
                    unit: token.unit,
                  });
                } else {
                  const tokenSymbol = token.symbol || "UNKNOWN";
                  const decimals = token.decimals || 0; // Default to 0 for non-decimal tokens
                  const formattedBalance = formatTokenAmount(
                    rawBalance,
                    tokenSymbol,
                    decimals
                  );

                  let valueUsd = null;
                  if (!tokenPrice) {
                    // Fallback to CoinGecko if MuesliSwap doesn't have the price
                    const fallbackPrices = await getFallbackTokenPrices(walletData.tokens);
                    tokenPrice = fallbackPrices.get(token.symbol);
                  }

                  if (tokenPrice) {
                    if (decimals === 0) {
                      valueUsd = rawBalance * tokenPrice.priceAda * adaPrice;
                    } else {
                      valueUsd =
                        (rawBalance / Math.pow(10, decimals)) *
                        tokenPrice.priceAda *
                        adaPrice;
                    }
                  }

                  await storage.createToken({
                    walletId: wallet.id,
                    name: token.name || "Unknown Token",
                    symbol: tokenSymbol,
                    balance: String(rawBalance), // Raw balance
                    formattedBalance, // Pre-calculated formatted balance
                    valueUsd: valueUsd ? String(valueUsd) : null,
                    decimals,
                    unit: token.unit,
                  });
                }
              }
            }

            if (walletData.balance) {
              await storage.createBalanceHistory({
                walletId: wallet.id,
                date: new Date(),
                balance: String(walletData.balance),
              });
            }
          } else {
            wallet = await storage.updateWallet(wallet.id, {
              ...wallet,
              lastUpdated: new Date(),
            });
          }
        } catch (error) {
          console.error("Error fetching data from Blockfrost:", error);
          if ((error as any).status_code === 404) {
            return res.status(404).json({ message: "Wallet not found" });
          }
          return res
            .status(500)
            .json({ message: "Failed to fetch blockchain data" });
        }
      }

      const tokens = await storage.getTokensByWalletId(wallet.id);
      const history = await storage.getBalanceHistoryByWalletId(wallet.id);

      // Update USD values only, use pre-calculated formatted balances
      const updatedTokens = tokens.map((token) => {
        const price = tokenPrices.get(token.symbol);
        const rawBalance = Number(token.balance);
        const isAda = token.symbol === "ADA";

        let valueUsd = null;
        if (isAda) {
          valueUsd = (rawBalance / 1_000_000) * adaPrice;
        } else if (price) {
          if (token.decimals === 0) {
            valueUsd = rawBalance * price.priceAda * adaPrice;
          } else {
            valueUsd =
              (rawBalance / Math.pow(10, token.decimals)) *
              price.priceAda *
              adaPrice;
          }
        }

        return {
          ...token,
          valueUsd: valueUsd ? String(valueUsd) : null,
        };
      });

      // Get ADA balance from formatted value
      const adaToken = updatedTokens.find((t) => t.symbol === "ADA");
      const adaBalance = adaToken?.formattedBalance || "0";

      return res.json({
        address: wallet.address,
        handle: wallet.handle,
        balance: {
          ada: adaBalance,
          usd: Number(adaBalance) * adaPrice,
          adaPrice,
          percentChange: calculatePercentChange(history),
        },
        tokens: updatedTokens,
        balanceHistory: history,
      });
    } catch (error) {
      console.error("Error processing wallet info request:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Transactions endpoint - lower priority data
  app.get("/api/wallet/:address/transactions", async (req, res) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const wallet = await storage.getWalletByAddress(address);

      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      // Get transactions from storage
      const transactions = await storage.getTransactionsByWalletId(wallet.id);

      // If there are no transactions yet, fetch them from Blockfrost
      if (transactions.length === 0) {
        try {
          const walletData = await getWalletInfo(address);

          if (walletData.transactions) {
            for (const tx of walletData.transactions) {
              try {
                const txDetails = await getTransactionDetails(tx.hash, address);

                await storage.createTransaction({
                  walletId: wallet.id,
                  type: txDetails.type || "transfer",
                  amount: txDetails.amount,
                  date: new Date(tx.blockTime * 1000),
                  address: txDetails.counterpartyAddress
                    ? `${txDetails.counterpartyAddress.slice(
                        0,
                        8
                      )}...${txDetails.counterpartyAddress.slice(-8)}`
                    : null,
                  fullAddress: txDetails.counterpartyAddress,
                  tokenSymbol:
                    txDetails.unit === "lovelace"
                      ? "ADA"
                      : txDetails.tokenSymbol,
                  tokenAmount: txDetails.tokenAmount,
                  explorerUrl: `https://cardanoscan.io/transaction/${tx.hash}`,
                });
              } catch (txError) {
                console.error(
                  `Failed to process transaction ${tx.hash}:`,
                  txError
                );
              }
            }
          }

          // Fetch updated transactions
          const updatedTransactions = await storage.getTransactionsByWalletId(
            wallet.id
          );
          return res.json(updatedTransactions);
        } catch (error) {
          console.error(
            "Error fetching transaction data from Blockfrost:",
            error
          );
          return res
            .status(500)
            .json({ message: "Failed to fetch transaction data" });
        }
      }

      return res.json(transactions);
    } catch (error) {
      console.error("Error processing transactions request:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // NFTs endpoint - lower priority data
  app.get("/api/wallet/:address/nfts", async (req, res) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const wallet = await storage.getWalletByAddress(address);

      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      // Get NFTs from storage
      const nfts = await storage.getNFTsByWalletId(wallet.id);

      return res.json(nfts);
    } catch (error) {
      console.error("Error processing NFTs request:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // NFT-specific endpoints
  app.get("/api/wallet/:address/nfts/details", async (req, res) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      // Fetch NFTs directly from Blockfrost with enhanced metadata
      const nfts = await getWalletNFTs(address);
      return res.json(nfts);
    } catch (error) {
      console.error("Error processing NFT details request:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get transaction history for a specific NFT
  app.get("/api/nft/:assetId/transactions", async (req, res) => {
    try {
      const { assetId } = req.params;

      if (!assetId) {
        return res.status(400).json({ message: "Asset ID is required" });
      }

      const transactions = await getNFTTransactionHistory(assetId);
      return res.json(transactions);
    } catch (error) {
      console.error("Error processing NFT transaction history request:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Legacy endpoint for backward compatibility
  app.get("/api/wallet/:address", async (req, res) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      if (!address.startsWith("addr1")) {
        return res
          .status(400)
          .json({ message: "Invalid Cardano address format" });
      }

      const wallet = await storage.getWalletByAddress(address);

      if (!wallet) {
        return res.status(404).json({
          message: "Wallet not found. Use /api/wallet/:address/info first.",
        });
      }

      const tokens = await storage.getTokensByWalletId(wallet.id);
      const transactions = await storage.getTransactionsByWalletId(wallet.id);
      const nfts = await storage.getNFTsByWalletId(wallet.id);
      const history = await storage.getBalanceHistoryByWalletId(wallet.id);

      // Get token prices
      let tokenPrices = await getTokenPrices();
      const adaPrice = tokenPrices.get("ADA")?.priceUsd || 0;

      // Update USD values
      const updatedTokens = tokens.map((token) => {
        const price = tokenPrices.get(token.symbol);
        const rawBalance = Number(token.balance);
        const isAda = token.symbol === "ADA";

        let valueUsd = null;
        if (isAda) {
          valueUsd = (rawBalance / 1_000_000) * adaPrice;
        } else if (price) {
          if (token.decimals === 0) {
            valueUsd = rawBalance * price.priceAda * adaPrice;
          } else {
            valueUsd =
              (rawBalance / Math.pow(10, token.decimals)) *
              price.priceAda *
              adaPrice;
          }
        }

        return {
          ...token,
          valueUsd: valueUsd ? String(valueUsd) : null,
        };
      });

      // Get ADA balance from formatted value
      const adaToken = updatedTokens.find((t) => t.symbol === "ADA");
      const adaBalance = adaToken?.formattedBalance || "0";

      return res.json({
        address: wallet.address,
        handle: wallet.handle,
        balance: {
          ada: adaBalance,
          usd: Number(adaBalance) * adaPrice,
          adaPrice,
          percentChange: calculatePercentChange(history),
        },
        tokens: updatedTokens,
        transactions,
        nfts,
        balanceHistory: history,
      });
    } catch (error) {
      console.error("Error processing wallet request:", error);
      return res.status(500).json({ message: "Internal server error" });
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
  return Number((((latest - previous) / previous) * 100).toFixed(1));
}

function formatADA(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}
