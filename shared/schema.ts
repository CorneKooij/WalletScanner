import { pgTable, text, serial, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Wallet table
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  handle: text("handle"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Token table
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  walletId: serial("wallet_id").references(() => wallets.id),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  balance: numeric("balance").notNull(),
  valueUsd: numeric("value_usd"),
});

// Transaction table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: serial("wallet_id").references(() => wallets.id),
  type: text("type").notNull(), // 'received', 'sent', 'swap', 'stake_reward'
  amount: numeric("amount").notNull(),
  date: timestamp("date").notNull(),
  address: text("address"),
  fullAddress: text("full_address"),
  tokenSymbol: text("token_symbol"),
  tokenAmount: numeric("token_amount"),
  explorerUrl: text("explorer_url"),
});

// NFT table
export const nfts = pgTable("nfts", {
  id: serial("id").primaryKey(),
  walletId: serial("wallet_id").references(() => wallets.id),
  name: text("name").notNull(),
  collection: text("collection"),
  image: text("image"),
  policyId: text("policy_id"),
  attributes: jsonb("attributes"),
});

// Balance history table
export const balanceHistory = pgTable("balance_history", {
  id: serial("id").primaryKey(),
  walletId: serial("wallet_id").references(() => wallets.id),
  date: timestamp("date").notNull(),
  balance: numeric("balance").notNull(),
});

// Insert Schemas
export const insertWalletSchema = createInsertSchema(wallets);
export const insertTokenSchema = createInsertSchema(tokens);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertNftSchema = createInsertSchema(nfts);
export const insertBalanceHistorySchema = createInsertSchema(balanceHistory);

// Types
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type NFT = typeof nfts.$inferSelect;
export type InsertNFT = z.infer<typeof insertNftSchema>;

export type BalanceHistory = typeof balanceHistory.$inferSelect;
export type InsertBalanceHistory = z.infer<typeof insertBalanceHistorySchema>;
