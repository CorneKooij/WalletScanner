
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = useCallback(async (text: string, message = "Copied to clipboard") => {
    if (!navigator.clipboard) {
      toast({
        title: "Error",
        description: "Clipboard API not available",
        variant: "destructive",
      });
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast({
        description: message,
        duration: 2000,
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      
      return true;
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  return { isCopied, copyToClipboard };
}
