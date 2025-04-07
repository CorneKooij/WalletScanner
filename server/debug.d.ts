/**
 * Declaration file for debug.js
 */

/**
 * Detects if an asset is likely an NFT
 */
export function detectNFT(asset: any): {
  isLikelyNFT: boolean;
  reasons: string[];
};

/**
 * Logs information about NFTs
 */
export function logNFTInfo(assets: any[]): void;
