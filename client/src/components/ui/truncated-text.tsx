
import * as React from "react";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { toast } from "./use-toast";

interface TruncatedTextProps {
  text: string;
  startChars?: number;
  endChars?: number;
  className?: string;
  copyable?: boolean;
}

export function TruncatedText({
  text,
  startChars = 8,
  endChars = 8,
  className,
  copyable = true,
}: TruncatedTextProps) {
  if (!text) return null;
  
  const shouldTruncate = text.length > startChars + endChars + 3;
  const displayText = shouldTruncate
    ? `${text.slice(0, startChars)}...${text.slice(-endChars)}`
    : text;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Copied to clipboard",
      duration: 2000,
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1", className)}>
            <span className="truncate">{displayText}</span>
            {copyable && (
              <Copy
                onClick={handleCopy}
                className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-foreground"
              />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
