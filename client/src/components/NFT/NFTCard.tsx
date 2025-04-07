import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MoreHorizontal, Info } from "lucide-react";

interface NFTAttributes {
  [key: string]: any;
}

interface NFT {
  asset: string;
  policy_id: string;
  asset_name?: string;
  fingerprint: string;
  quantity: string;
  metadata?: {
    name: string;
    description?: string;
    image?: string;
    attributes?: NFTAttributes;
  };
  imageUrl?: string;
  onchain_metadata?: any; // Add this to access raw onchain metadata
}

interface NFTCardProps {
  nft: NFT;
}

const NFTCard = ({ nft }: NFTCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Try to extract the best possible name for the NFT
  const name =
    nft.metadata?.name ||
    nft.onchain_metadata?.name ||
    nft.asset_name ||
    "Unnamed NFT";

  // Try to extract the best possible image URL
  const imageUrl =
    nft.imageUrl ||
    nft.metadata?.image ||
    nft.onchain_metadata?.image ||
    "/placeholder-nft.svg";

  // Get attributes from metadata or create an empty object
  const attributes =
    nft.metadata?.attributes || nft.onchain_metadata?.attributes || {};

  const fetchTransactionHistory = async () => {
    if (transactions.length > 0) return; // Already loaded

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/nft/${encodeURIComponent(nft.asset)}/transactions`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transaction history");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = () => {
    setShowDetails(true);
    fetchTransactionHistory();
  };

  // Function to format attribute values for display
  const formatAttributeValue = (value: any): string => {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (value === null || value === undefined) return "None";
    return String(value);
  };

  // Function to get color for attribute badges
  const getAttributeColor = (key: string): string => {
    // Simple hash function to generate consistent colors
    const hash = Array.from(key).reduce(
      (acc, char) => char.charCodeAt(0) + acc,
      0
    );
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-yellow-100 text-yellow-800",
      "bg-red-100 text-red-800",
      "bg-indigo-100 text-indigo-800",
      "bg-pink-100 text-pink-800",
      "bg-gray-100 text-gray-800",
    ];
    return colors[hash % colors.length];
  };

  // Try to decode hex-encoded asset name if present
  const decodedAssetName = (() => {
    try {
      if (nft.asset_name) {
        return Buffer.from(nft.asset_name, "hex").toString();
      }
      return null;
    } catch (e) {
      return nft.asset_name;
    }
  })();

  // Display name in this priority: metadata name > decoded asset name > fallback
  const displayName = name !== "Unnamed NFT" ? name : decodedAssetName || name;

  return (
    <>
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-square w-full bg-gray-100 relative overflow-hidden">
          <img
            src={imageUrl}
            alt={displayName}
            className="object-cover w-full h-full"
            onError={(e) => {
              // Replace broken images with a placeholder
              (e.target as HTMLImageElement).src = "/placeholder-nft.svg";
            }}
          />
        </div>
        <div className="p-4">
          <h3 className="font-medium text-lg truncate" title={displayName}>
            {displayName}
          </h3>

          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(attributes)
              .slice(0, 3)
              .map(([key, value]) => (
                <span
                  key={key}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getAttributeColor(
                    key
                  )}`}
                  title={`${key}: ${formatAttributeValue(value)}`}
                >
                  {key}: {formatAttributeValue(value).substring(0, 10)}
                  {formatAttributeValue(value).length > 10 ? "..." : ""}
                </span>
              ))}
            {Object.keys(attributes).length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                +{Object.keys(attributes).length - 3} more
              </span>
            )}
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleViewDetails}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {displayName}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {nft.fingerprint}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={displayName}
                className="object-contain w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-nft.svg";
                }}
              />
            </div>

            <div>
              {(nft.metadata?.description ||
                nft.onchain_metadata?.description) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Description
                  </h4>
                  <p className="text-sm">
                    {nft.metadata?.description ||
                      nft.onchain_metadata?.description}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Policy ID
                </h4>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                  {nft.policy_id}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Asset
                </h4>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                  {nft.asset}
                </div>
              </div>

              {nft.asset_name && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Asset Name
                  </h4>
                  <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                    {decodedAssetName || nft.asset_name}
                    {decodedAssetName &&
                      decodedAssetName !== nft.asset_name && (
                        <div className="mt-1 text-gray-500">
                          Hex: {nft.asset_name}
                        </div>
                      )}
                  </div>
                </div>
              )}

              {Object.keys(attributes).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Attributes
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(attributes).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">{key}</div>
                        <div
                          className="text-sm font-medium truncate"
                          title={formatAttributeValue(value)}
                        >
                          {formatAttributeValue(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {transactions.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Transaction History
              </h4>
              <div className="border rounded-md divide-y">
                {transactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.tx_hash} className="p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <div className="font-mono text-xs truncate max-w-[180px]">
                        {tx.tx_hash}
                      </div>
                      <a
                        href={`https://cardanoscan.io/transaction/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs flex items-center"
                      >
                        View <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(tx.block_time * 1000).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-sm text-gray-500 mt-2">
                Loading transaction history...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NFTCard;
