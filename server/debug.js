/**
 * NFT Debug Utility
 *
 * This file helps debug how NFTs are processed in the application.
 */

// Simple function to check if an asset might be an NFT based on various conditions
const detectNFT = (asset) => {
  // Criteria that might indicate an NFT:
  // 1. Quantity is 1 (standard for NFTs)
  // 2. Has onchain_metadata - but only if quantity is 1

  const possibleNFT = {
    isLikelyNFT: false,
    reasons: [],
  };

  // Check quantity - this is the primary indicator of an NFT
  if (asset.quantity === "1") {
    possibleNFT.isLikelyNFT = true;
    possibleNFT.reasons.push("quantity is 1");

    // Only add metadata as a supporting reason if quantity is 1
    if (
      asset.onchain_metadata ||
      (asset.metadata && (asset.metadata.image || asset.metadata.attributes))
    ) {
      possibleNFT.reasons.push("has metadata");
    }
  } else {
    // If quantity > 1, it's likely a fungible token, not an NFT
    possibleNFT.isLikelyNFT = false;
    possibleNFT.reasons.push(`quantity is ${asset.quantity} (fungible token)`);
  }

  return possibleNFT;
};

// Log information about NFTs
const logNFTInfo = (assets) => {
  console.log("\n========== NFT DETECTION DEBUGGING ==========");

  // Only consider tokens with quantity "1" as potential NFTs
  const nftAssets = assets.filter((asset) => asset.quantity === "1");
  const fungibleAssets = assets.filter((asset) => asset.quantity !== "1");

  if (nftAssets.length) {
    console.log(
      `Found ${nftAssets.length} potential NFT assets (quantity = 1):`
    );
    nftAssets.forEach((asset, index) => {
      console.log(`\nNFT Asset #${index + 1}:`);
      console.log(`- Asset: ${asset.asset}`);
      console.log(`- Policy ID: ${asset.policy_id}`);
      console.log(`- Asset Name: ${asset.asset_name}`);
      console.log(`- Quantity: ${asset.quantity}`);

      // Try to decode asset name if it's hex
      if (asset.asset_name) {
        try {
          const decoded = Buffer.from(asset.asset_name, "hex").toString();
          console.log(`- Decoded Name: ${decoded}`);
        } catch (e) {
          console.log(`- Decoded Name: [not hex encoded]`);
        }
      }

      // Log metadata
      if (asset.metadata) {
        console.log(`- Metadata Name: ${asset.metadata.name}`);
        console.log(`- Has Image: ${!!asset.metadata.image}`);
        console.log(
          `- Has Attributes: ${
            !!asset.metadata.attributes &&
            Object.keys(asset.metadata.attributes).length > 0
          }`
        );
      }

      // Log onchain metadata
      if (asset.onchain_metadata) {
        console.log(`- Has Onchain Metadata: true`);
        console.log(`- Onchain Name: ${asset.onchain_metadata.name}`);
        console.log(`- Onchain Image: ${!!asset.onchain_metadata.image}`);
      } else {
        console.log(`- Has Onchain Metadata: false`);
      }

      // Analyze if it should be detected as NFT
      const detection = detectNFT(asset);
      console.log(`- Should detect as NFT: ${detection.isLikelyNFT}`);
      console.log(`- Detection reasons: ${detection.reasons.join(", ")}`);
    });
  } else {
    console.log("No NFT assets found in the dataset.");
  }

  if (fungibleAssets.length) {
    console.log(
      `\nFound ${fungibleAssets.length} fungible tokens (quantity > 1):`
    );
    fungibleAssets.forEach((asset, index) => {
      console.log(`\nToken #${index + 1}:`);
      console.log(`- Asset: ${asset.asset}`);
      console.log(`- Quantity: ${asset.quantity}`);
      // Try to decode asset name if it's hex
      if (asset.asset_name) {
        try {
          const decoded = Buffer.from(asset.asset_name, "hex").toString();
          console.log(`- Decoded Name: ${decoded}`);
        } catch (e) {
          console.log(`- Asset Name: ${asset.asset_name}`);
        }
      }
    });
  }

  console.log("\n==============================================\n");
};

// Export utility functions
export { detectNFT, logNFTInfo };
