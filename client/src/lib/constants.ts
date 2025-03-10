// API endpoints
export const API_ENDPOINTS = {
  WALLET: '/api/wallet',
};

// Cardano explorer URL
export const CARDANO_EXPLORER_URL = 'https://cardanoscan.io';

// Default wallet data when no wallet is loaded
export const DEFAULT_WALLET_DATA = null;

// Token types and colors
export const TOKEN_COLORS = {
  ADA: { bg: 'bg-blue-100', color: 'text-[#2563EB]' },
  HOSKY: { bg: 'bg-red-100', color: 'text-red-500' },
  DJED: { bg: 'bg-green-100', color: 'text-green-500' },
  SUNDAE: { bg: 'bg-purple-100', color: 'text-purple-500' },
  DEFAULT: { bg: 'bg-gray-100', color: 'text-gray-500' }
};

// Transaction types
export const TRANSACTION_TYPES = {
  RECEIVED: 'received',
  SENT: 'sent',
  SWAP: 'swap',
  STAKE_REWARD: 'stake_reward',
  NFT_PURCHASE: 'nft_purchase',
  NFT_SALE: 'nft_sale'
};

// Time periods for balance history
export const TIME_PERIODS = ['1D', '1W', '1M', '3M', '1Y', 'All'];

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#2563EB',
  SECONDARY: '#34D399',
  ACCENT: '#6366F1',
  BACKGROUND: 'rgba(37, 99, 235, 0.1)'
};
