import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";

const WalletInput = () => {
  const [walletId, setWalletId] = useState("");
  const { setWalletData, isLoading } = useWallet();
  const { toast } = useToast();

  // Validate Cardano wallet address or handle
  const isValidInput = (input: string) => {
    // Handle validation
    if (input.startsWith('$')) {
      return input.length > 1; // At least one character after $
    }

    // Strip $ if present for handle validation
    const handle = input.startsWith('$') ? input.slice(1) : input;

    // Handle format (3+ characters)
    if (handle.length >= 3 && !handle.includes(' ')) {
      return true;
    }

    // Cardano address validation (basic)
    const addressRegex = /^addr1[a-zA-Z0-9]{95,100}$/;
    return addressRegex.test(input);
  };

  const handleLookup = async () => {
    const input = walletId.trim();

    if (!input) {
      toast({
        title: "Error",
        description: "Please enter a wallet address or handle",
        variant: "destructive",
      });
      return;
    }

    if (!isValidInput(input)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid Cardano address or handle",
        variant: "destructive",
      });
      return;
    }

    try {
      // If input starts with $, remove it before sending to API
      const searchTerm = input.startsWith('$') ? input.slice(1) : input;
      const response = await fetch(`/api/wallet/${encodeURIComponent(searchTerm)}`);

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
    }
  };

  return (
    <div className="w-full md:w-96">
      <div className="relative">
        <input 
          type="text" 
          id="wallet-input" 
          placeholder="Enter Cardano address or $handle" 
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
      <div className="mt-1 flex items-center">
        <p className="text-xs text-gray-500 mr-1">Examples:</p>
        <div className="text-xs text-gray-500 flex items-center space-x-2">
          <span title="addr1q9u5n39xmgzwzfsxnkgqt3fragk32k4uv4qcwmza0hq2luyr2wfvwkxmp4j2mztw6jm2tmxwdrgxj3pwmcx4au4k5mqhtez9t">
            addr1q9u5n39x...mqhtez9t
          </span>
          <span>or</span>
          <span>$charles</span>
        </div>
      </div>
    </div>
  );
};

export default WalletInput;