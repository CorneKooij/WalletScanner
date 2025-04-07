import { BlockFrostAPI } from "@blockfrost/blockfrost-js";

// Import debug utilities
import { detectNFT, logNFTInfo } from "../debug.js";

const apiKey = process.env.BLOCKFROST_API_KEY;
if (!apiKey) {
  console.error("BLOCKFROST_API_KEY environment variable is not set");
  console.error(
    "Please add BLOCKFROST_API_KEY to your .env file or environment variables"
  );
  process.exit(1);
}

const blockfrost = new BlockFrostAPI({
  projectId: apiKey,
  network: "mainnet",
});

// Cache with TTL for NFTs to improve performance
const NFT_CACHE = new Map<string, { timestamp: number; data: CardanoNFT[] }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export interface CardanoNFT {
  asset: string;
  policy_id: string;
  asset_name?: string;
  fingerprint: string;
  quantity: string;
  initial_mint_tx_hash: string;
  mint_or_burn_count: number;
  onchain_metadata?: {
    name?: string;
    image?: string;
    mediaType?: string;
    files?: Array<{
      name?: string;
      mediaType?: string;
      src?: string;
    }>;
    attributes?: Record<string, any>;
    [key: string]: any;
  };
  metadata?: {
    name: string;
    description?: string;
    image?: string;
    attributes?: Record<string, any>; // Make attributes optional
  };
  imageUrl?: string;
}

// Custom function to check if an asset is likely an NFT
const isLikelyNFT = (asset: any): boolean => {
  // Only count as NFT if quantity is exactly 1
  // Many fungible tokens have metadata but aren't NFTs
  if (asset.quantity === "1") {
    return true;
  }

  return false;
};

// Helper function to convert IPFS URLs to gateway URLs
const resolveIpfsUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;

  // Convert ipfs:// URLs to use a public gateway
  if (url.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`;
  }

  // Handle Cardano-specific IPFS references (often without protocol)
  if (url.startsWith("Qm") && url.length >= 46) {
    return `https://ipfs.io/ipfs/${url}`;
  }

  return url;
};

// Process NFT metadata to prepare it for display
const processNftMetadata = (nft: CardanoNFT): CardanoNFT => {
  // Create a processed copy of the NFT
  const processedNft = { ...nft };

  // Try to get the name from onchain_metadata or generate a fallback
  let name = nft.onchain_metadata?.name || `NFT ${nft.asset_name?.slice(0, 8)}`;

  // Try to decode the asset name if it's hex-encoded (common for Cardano)
  if (nft.asset_name && !name) {
    try {
      name = Buffer.from(nft.asset_name, "hex").toString();
      // If we successfully decoded and it looks like text, use it
      if (!/^\s*$/.test(name) && /^[\x20-\x7E]+$/.test(name)) {
        console.log(
          `[NFT Service] Decoded asset name: ${name} from ${nft.asset_name}`
        );
      } else {
        name = `NFT ${nft.asset_name?.slice(0, 8)}`;
      }
    } catch (e) {
      console.log(
        `[NFT Service] Could not decode asset name: ${nft.asset_name}`
      );
      name = `NFT ${nft.asset_name?.slice(0, 8)}`;
    }
  }

  // Try to get the image from onchain_metadata
  let imageUrl = nft.onchain_metadata?.image;

  // If no image directly in metadata, check files array
  if (
    !imageUrl &&
    nft.onchain_metadata?.files &&
    nft.onchain_metadata.files.length > 0
  ) {
    const imageFile = nft.onchain_metadata.files.find(
      (file) =>
        file.mediaType?.startsWith("image/") ||
        (file.src &&
          (file.src.endsWith(".png") ||
            file.src.endsWith(".jpg") ||
            file.src.endsWith(".jpeg")))
    );

    if (imageFile) {
      imageUrl = imageFile.src;
    }
  }

  // Resolve IPFS URLs to gateway URLs
  imageUrl = resolveIpfsUrl(imageUrl);

  // Create a simplified metadata object
  processedNft.metadata = {
    name,
    description: nft.onchain_metadata?.description,
    image: imageUrl,
    attributes: nft.onchain_metadata?.attributes || {},
  };

  // Add image URL directly to the NFT object for easy access
  processedNft.imageUrl = imageUrl;

  return processedNft;
};

// Get NFTs for a specific wallet address from Blockfrost
export const getWalletNFTs = async (address: string): Promise<CardanoNFT[]> => {
  try {
    console.log(`[NFT Service] Fetching NFTs for address: ${address}`);

    // Check cache first
    if (NFT_CACHE.has(address)) {
      const cached = NFT_CACHE.get(address);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[NFT Service] Returning cached NFTs for ${address}`);
        return cached.data;
      }
    }

    // Get UTXOs for the address
    const utxos = await blockfrost.addressesUtxos(address);

    // Extract unique asset IDs from UTXOs (excluding ADA/lovelace)
    const assetUnits = new Set<string>();
    utxos.forEach((utxo) => {
      utxo.amount.forEach((amt) => {
        if (amt.unit !== "lovelace") {
          assetUnits.add(amt.unit);
        }
      });
    });

    console.log(`[NFT Service] Found ${assetUnits.size} assets for ${address}`);

    // Filter for NFTs (quantity = 1) and get detailed metadata
    const nfts: CardanoNFT[] = [];
    const allAssets: any[] = [];

    for (const unit of assetUnits) {
      try {
        // Get detailed asset information including metadata
        const assetDetails = await blockfrost.assetsById(unit);
        allAssets.push(assetDetails); // Collect all assets for debugging

        // Check if this asset is likely an NFT
        if (isLikelyNFT(assetDetails)) {
          // Convert Blockfrost asset type to our CardanoNFT type
          const nftData: CardanoNFT = {
            asset: assetDetails.asset,
            policy_id: assetDetails.policy_id,
            asset_name: assetDetails.asset_name || undefined,
            fingerprint: assetDetails.fingerprint,
            quantity: assetDetails.quantity,
            initial_mint_tx_hash: assetDetails.initial_mint_tx_hash,
            mint_or_burn_count: assetDetails.mint_or_burn_count,
            onchain_metadata: assetDetails.onchain_metadata || undefined,
          };

          nfts.push(processNftMetadata(nftData));
        }
      } catch (error) {
        console.error(
          `[NFT Service] Error fetching details for asset ${unit}:`,
          error
        );
        // Continue with next asset
      }
    }

    // Debug: Log information about NFTs found
    if (allAssets.length > 0) {
      logNFTInfo(allAssets);
    }

    // Update cache
    NFT_CACHE.set(address, { timestamp: Date.now(), data: nfts });

    console.log(`[NFT Service] Processed ${nfts.length} NFTs for ${address}`);
    return nfts;
  } catch (error) {
    console.error("[NFT Service] Error fetching NFTs:", error);
    return [];
  }
};

// Get transaction history for a specific NFT
export const getNFTTransactionHistory = async (assetId: string) => {
  try {
    return await blockfrost.assetsTransactions(assetId, { order: "desc" });
  } catch (error) {
    console.error(
      `[NFT Service] Error fetching transaction history for ${assetId}:`,
      error
    );
    return [];
  }
};

// Validate NFT metadata against expected schema
export const validateNFTMetadata = (nft: CardanoNFT): boolean => {
  const REQUIRED_FIELDS = ["name"];

  // Check if metadata exists
  if (!nft.metadata) return false;

  // Check required fields
  return REQUIRED_FIELDS.every((field) => field in (nft.metadata || {}));
};
