import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import TabNavigation from "@/components/Dashboard/TabNavigation";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search } from "lucide-react";

const NFTs = () => {
  const { walletData } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");

  if (!walletData) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Alert className="max-w-lg">
          <Search className="h-6 w-6 mr-2" />
          <AlertTitle>No wallet data</AlertTitle>
          <AlertDescription>
            Please enter a Cardano wallet ID or handle in the search box above to view NFTs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if wallet has NFTs
  if (!walletData.nfts || walletData.nfts.length === 0) {
    return (
      <main>
        <TabNavigation />
        <Card className="bg-white p-6">
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">No NFTs Found</h2>
            <p className="text-gray-500">This wallet does not contain any NFTs.</p>
          </div>
        </Card>
      </main>
    );
  }

  // Filter NFTs based on search term
  const filteredNFTs = walletData.nfts.filter(nft => 
    nft.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    nft.collection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main>
      <TabNavigation />
      
      <Card className="bg-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">NFT Collection</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search NFTs" 
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNFTs.map((nft, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative pb-[100%]">
                <img 
                  src={nft.image} 
                  alt={nft.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=NFT+Image+Unavailable"}
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1">{nft.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Collection: {nft.collection}</p>
                <div className="mt-2">
                  {nft.attributes && nft.attributes.map((attr, i) => (
                    <span key={i} className="inline-block bg-gray-100 text-xs rounded-full px-2 py-1 mr-1 mb-1">
                      {attr.trait}: {attr.value}
                    </span>
                  ))}
                </div>
                {nft.policyId && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 truncate">
                      Policy ID: {nft.policyId}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        {filteredNFTs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No NFTs found matching your search.</p>
          </div>
        )}
      </Card>
    </main>
  );
};

export default NFTs;
