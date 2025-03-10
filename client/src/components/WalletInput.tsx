import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const WalletInput = () => {
  const [walletId, setWalletId] = useState("");
  const { setWalletData, isLoading, setIsLoading } = useWallet();
  const { toast } = useToast();

  // Validate Cardano wallet address
  const isValidAddress = (address: string) => {
    // Cardano addresses start with addr1 and are typically 98-103 characters long
    const addressRegex = /^addr1[a-zA-Z0-9]{95,100}$/;
    return addressRegex.test(address);
  };

  const handleLookup = async () => {
    const input = walletId.trim();

    if (!input) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    if (!isValidAddress(input)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Cardano wallet address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/wallet/${encodeURIComponent(input)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch wallet data");
      }

      const data = await response.json();
      setWalletData(data);

      toast({
        title: "Success",
        description: "Successfully loaded wallet data",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch wallet data",
        variant: "destructive",
      });
      setWalletData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full md:w-96">
      <div className="relative">
        <input 
          type="text" 
          id="wallet-input" 
          placeholder="Enter Cardano wallet address" 
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all"
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          disabled={isLoading}
        />
        <button 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#2563EB] text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
          onClick={handleLookup}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </>
          ) : (
            'Lookup'
          )}
        </button>
      </div>
      <div className="mt-1 flex items-center">
        <p className="text-xs text-gray-500 mr-1">Example:</p>
        <div className="text-xs text-gray-500">
          <span title="addr1q9u5n39xmgzwzfsxnkgqt3fragk32k4uv4qcwmza0hq2luyr2wfvwkxmp4j2mztw6jm2tmxwdrgxj3pwmcx4au4k5mqhtez9t">
            addr1q9u5n39x...mqhtez9t
          </span>
        </div>
      </div>
    </div>
  );
};

export default WalletInput;