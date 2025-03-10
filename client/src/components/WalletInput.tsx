import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";

const WalletInput = () => {
  const [walletId, setWalletId] = useState("");
  const { setWalletData, isLoading } = useWallet();
  const { toast } = useToast();

  // Validate Cardano wallet address (basic validation)
  const isValidWalletAddress = (address: string) => {
    // Cardano addresses start with addr1 and are typically 98-103 characters long
    const basicRegex = /^addr1[a-zA-Z0-9]{95,100}$/;
    // But we also allow short handles for testing purposes
    return basicRegex.test(address) || address.length > 3;
  };

  const handleLookup = async () => {
    if (!walletId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet ID or handle",
        variant: "destructive",
      });
      return;
    }

    if (!isValidWalletAddress(walletId)) {
      toast({
        title: "Invalid Wallet Address",
        description: "Please enter a valid Cardano wallet address or handle",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/wallet/${encodeURIComponent(walletId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch wallet data");
      }
      
      const data = await response.json();
      setWalletData(data);
      
      toast({
        title: "Wallet Found",
        description: "Successfully loaded wallet data",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch wallet data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full md:w-96">
      <div className="relative">
        <input 
          type="text" 
          id="wallet-input" 
          placeholder="Enter Cardano Wallet ID or Handle" 
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all"
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
        />
        <button 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#2563EB] text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleLookup}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Lookup"}
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500">Example: addr1q9u5n39xmgzwzfsxnkgqt3fragk32k4uv4qcwmza0hq2luyr2wfvwkxmp4j2mztw6jm2tmxwdrgxj3pwmcx4au4k5mqhtez9t</p>
    </div>
  );
};

export default WalletInput;
