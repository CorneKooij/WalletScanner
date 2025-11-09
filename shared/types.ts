import { z } from "zod";

// --- Blockfrost API Response Types (Simplified) ---

export const TokenSchema = z.object({
  unit: z.string(),
  quantity: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  policyId: z.string().optional(),
});

export type Token = z.infer<typeof TokenSchema>;

export const TransactionSummarySchema = z.object({
  hash: z.string(),
  blockHeight: z.number(),
  blockTime: z.number(),
});

export type TransactionSummary = z.infer<typeof TransactionSummarySchema>;

export const WalletDataSchema = z.object({
  address: z.string(),
  handle: z.string().nullable(),
  tokens: z.array(TokenSchema),
  transactions: z.array(TransactionSummarySchema),
});

export type WalletData = z.infer<typeof WalletDataSchema>;

// --- NFT Types ---

export const NFTAttributeSchema = z.object({
  trait_type: z.string(),
  value: z.any(), // Keeping any for now as attribute values can be complex
});

export const NFTMetadataSchema = z.object({
  name: z.string(),
  image: z.string(),
  mediaType: z.string().optional(),
  description: z.string().optional(),
  attributes: z.array(NFTAttributeSchema).optional(),
  onchain_metadata: z.any().optional(), // Raw metadata can be anything
});

export type NFTMetadata = z.infer<typeof NFTMetadataSchema>;

export const NFTDataSchema = z.object({
  assetId: z.string(),
  policyId: z.string(),
  name: z.string(),
  collection: z.string().optional(),
  metadata: NFTMetadataSchema,
});

export type NFTData = z.infer<typeof NFTDataSchema>;

// --- Transaction Detail Type ---

export const TransactionDetailSchema = z.object({
  hash: z.string(),
  blockHeight: z.number(),
  blockTime: z.number(),
  fees: z.string(),
  type: z.enum(["sent", "received", "self-transfer", "stake_reward", "transfer"]),
  amount: z.string(),
  tokenSymbol: z.string(),
  tokenAmount: z.string(),
  counterpartyAddress: z.string().nullable(),
  inputs: z.array(z.any()), // Keeping any for now as Blockfrost UTXO types are complex
  outputs: z.array(z.any()), // Keeping any for now as Blockfrost UTXO types are complex
});

export type TransactionDetail = z.infer<typeof TransactionDetailSchema>;
