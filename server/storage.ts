import {
  wallets, tokens, transactions, nfts, balanceHistory,
  type Wallet, type InsertWallet,
  type Token, type InsertToken,
  type Transaction, type InsertTransaction,
  type NFT, type InsertNFT,
  type BalanceHistory, type InsertBalanceHistory
} from "@shared/schema";

export interface IStorage {
  // Wallet methods
  getWalletById(id: number): Promise<Wallet | undefined>;
  getWalletByAddress(address: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, wallet: Partial<Wallet>): Promise<Wallet>;
  
  // Token methods
  getTokenById(id: number): Promise<Token | undefined>;
  getTokensByWalletId(walletId: number): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(id: number, token: Partial<Token>): Promise<Token>;
  
  // Transaction methods
  getTransactionById(id: number): Promise<Transaction | undefined>;
  getTransactionsByWalletId(walletId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // NFT methods
  getNFTById(id: number): Promise<NFT | undefined>;
  getNFTsByWalletId(walletId: number): Promise<NFT[]>;
  createNFT(nft: InsertNFT): Promise<NFT>;
  
  // Balance history methods
  getBalanceHistoryByWalletId(walletId: number): Promise<BalanceHistory[]>;
  createBalanceHistory(history: InsertBalanceHistory): Promise<BalanceHistory>;
}

export class MemStorage implements IStorage {
  private walletsData: Map<number, Wallet>;
  private tokensData: Map<number, Token>;
  private transactionsData: Map<number, Transaction>;
  private nftsData: Map<number, NFT>;
  private balanceHistoryData: Map<number, BalanceHistory>;
  private currentWalletId: number;
  private currentTokenId: number;
  private currentTransactionId: number;
  private currentNFTId: number;
  private currentBalanceHistoryId: number;

  constructor() {
    this.walletsData = new Map();
    this.tokensData = new Map();
    this.transactionsData = new Map();
    this.nftsData = new Map();
    this.balanceHistoryData = new Map();
    this.currentWalletId = 1;
    this.currentTokenId = 1;
    this.currentTransactionId = 1;
    this.currentNFTId = 1;
    this.currentBalanceHistoryId = 1;
  }

  // Wallet methods
  async getWalletById(id: number): Promise<Wallet | undefined> {
    return this.walletsData.get(id);
  }

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    return Array.from(this.walletsData.values()).find(
      wallet => wallet.address === address
    );
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const id = this.currentWalletId++;
    const newWallet = { ...wallet, id };
    this.walletsData.set(id, newWallet);
    return newWallet;
  }

  async updateWallet(id: number, wallet: Partial<Wallet>): Promise<Wallet> {
    const existingWallet = this.walletsData.get(id);
    if (!existingWallet) {
      throw new Error(`Wallet with ID ${id} not found`);
    }
    const updatedWallet = { ...existingWallet, ...wallet };
    this.walletsData.set(id, updatedWallet);
    return updatedWallet;
  }

  // Token methods
  async getTokenById(id: number): Promise<Token | undefined> {
    return this.tokensData.get(id);
  }

  async getTokensByWalletId(walletId: number): Promise<Token[]> {
    return Array.from(this.tokensData.values()).filter(
      token => token.walletId === walletId
    );
  }

  async createToken(token: InsertToken): Promise<Token> {
    const id = this.currentTokenId++;
    const newToken = { ...token, id };
    this.tokensData.set(id, newToken);
    return newToken;
  }

  async updateToken(id: number, token: Partial<Token>): Promise<Token> {
    const existingToken = this.tokensData.get(id);
    if (!existingToken) {
      throw new Error(`Token with ID ${id} not found`);
    }
    const updatedToken = { ...existingToken, ...token };
    this.tokensData.set(id, updatedToken);
    return updatedToken;
  }

  // Transaction methods
  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactionsData.get(id);
  }

  async getTransactionsByWalletId(walletId: number): Promise<Transaction[]> {
    return Array.from(this.transactionsData.values())
      .filter(tx => tx.walletId === walletId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction = { ...transaction, id };
    this.transactionsData.set(id, newTransaction);
    return newTransaction;
  }

  // NFT methods
  async getNFTById(id: number): Promise<NFT | undefined> {
    return this.nftsData.get(id);
  }

  async getNFTsByWalletId(walletId: number): Promise<NFT[]> {
    return Array.from(this.nftsData.values()).filter(
      nft => nft.walletId === walletId
    );
  }

  async createNFT(nft: InsertNFT): Promise<NFT> {
    const id = this.currentNFTId++;
    const newNFT = { ...nft, id };
    this.nftsData.set(id, newNFT);
    return newNFT;
  }

  // Balance history methods
  async getBalanceHistoryByWalletId(walletId: number): Promise<BalanceHistory[]> {
    return Array.from(this.balanceHistoryData.values())
      .filter(history => history.walletId === walletId)
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date ascending
  }

  async createBalanceHistory(history: InsertBalanceHistory): Promise<BalanceHistory> {
    const id = this.currentBalanceHistoryId++;
    const newHistory = { ...history, id };
    this.balanceHistoryData.set(id, newHistory);
    return newHistory;
  }
}

export const storage = new MemStorage();
