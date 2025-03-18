import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  getWalletInfo,
  getTokenMetadata,
  getTransactionDetails,
} from "./services/blockfrostService";
import { getTokenPrices } from "./services/muesliswapService";
import path from "path";
import { formatTokenAmount } from "../client/src/lib/formatUtils";
import { NextFunction, Request, Response } from "express";

// Middleware to disable caching for API routes
const noCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(noCacheMiddleware); // Apply no-cache middleware to all routes

  // Serve static files in production/local environment
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../public")));
  }

  app.get("/api/prices", async (req, res) => {
    console.log("GET /api/prices");
    try {
      const prices = await getTokenPrices();
      console.log("Fetched token prices:", prices);
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

  app.get("/api/wallet/:address", async (req, res) => {
    try {
      const { address } = req.params;

      if (!address) {
        console.log("Wallet address is required");
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const prices = await getTokenPrices();
      const adaPrice = prices.get("ADA")?.priceUsd || 0;

      // Format token data
      const response = await fetch(
        `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`,
        {
          headers: {
            project_id: process.env.VITE_BLOCKFROST_API_KEY || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Blockfrost API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Raw Blockfrost response:", data);

      if (!data.amount || !Array.isArray(data.amount)) {
        throw new Error("Invalid response format from Blockfrost");
      }

      // Process tokens with better type handling
      const tokens = await Promise.all(
        data.amount.map(async (token: any) => {
          // Base token structure with defaults
          const baseToken = {
            unit: token.unit || "",
            quantity: token.quantity || "0",
            balance: token.quantity || "0",
            name: "Unknown",
            symbol: "",
            decimals: 0,
            valueUsd: null,
            isNFT: false,
          };

          // Handle ADA (lovelace)
          if (token.unit === "lovelace") {
            const quantity = BigInt(token.quantity || "0");
            const adaAmount = Number(quantity) / 1_000_000;
            return {
              ...baseToken,
              balance: adaAmount.toString(),
              name: "Cardano",
              symbol: "ADA",
              decimals: 6,
              valueUsd: adaAmount * adaPrice,
            };
          }

          try {
            // Fetch asset metadata
            const assetInfo = await fetch(
              `https://cardano-mainnet.blockfrost.io/api/v0/assets/${token.unit}`,
              {
                headers: {
                  project_id: process.env.VITE_BLOCKFROST_API_KEY || "",
                },
              }
            );

            if (!assetInfo.ok) {
              throw new Error("Failed to fetch asset metadata");
            }

            const metadata = await assetInfo.json();
            console.log(`Metadata for ${token.unit}:`, metadata);

            // Check if token is an NFT
            const isNFT =
              token.quantity === "1" &&
              (!metadata.metadata?.decimals ||
                metadata.metadata?.decimals === 0);

            // Get token decimals
            const decimals = metadata.metadata?.decimals || 0;

            // Calculate token balance based on decimals
            const rawBalance = BigInt(token.quantity || "0");
            const balance =
              decimals > 0
                ? (Number(rawBalance) / Math.pow(10, decimals)).toString()
                : rawBalance.toString();

            return {
              ...baseToken,
              balance,
              name:
                metadata.onchain_metadata?.name ||
                metadata.metadata?.name ||
                token.unit.slice(56).replace(/[0-9a-f]/g, ""),
              symbol:
                metadata.onchain_metadata?.ticker ||
                metadata.metadata?.ticker ||
                token.unit.slice(0, 5),
              decimals,
              isNFT,
              image: metadata.onchain_metadata?.image,
              description: metadata.onchain_metadata?.description,
            };
          } catch (error) {
            console.error(
              `Error fetching metadata for token ${token.unit}:`,
              error
            );
            return baseToken;
          }
        })
      );

      // Calculate ADA balance
      const adaToken = tokens.find((t) => t.symbol === "ADA");
      const adaBalance = adaToken ? parseFloat(adaToken.balance) : 0;

      // Separate NFTs from regular tokens
      const nfts = tokens.filter((t) => t.isNFT);
      const regularTokens = tokens.filter((t) => !t.isNFT);

      const formattedData = {
        address,
        balance: {
          ada: formatADA(adaBalance),
          usd: adaBalance * adaPrice,
          adaPrice,
          percentChange: 0,
        },
        tokens: regularTokens,
        nfts,
        transactions: [], // You can add transaction processing here if needed
      };

      console.log("Formatted response:", formattedData);
      return res.json(formattedData);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      return res.status(500).json({ message: "Failed to fetch wallet data" });
    }
  });

  const httpServer = createServer(app);
  // Add a catch-all route to serve the SPA for any non-API routes
  if (process.env.NODE_ENV === "production" || !process.env.REPL_ID) {
    app.get("*", (req, res) => {
      // Skip API routes
      if (req.path.startsWith("/api")) return;

      res.sendFile(path.join(__dirname, "../public/index.html"));
    });
  }

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
