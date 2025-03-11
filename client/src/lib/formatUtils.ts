/**
 * Formats ADA or USD values to a readable string
 * @param value Number or string to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string
 */
export const formatADA = (value: number | string, decimals = 2): string => {
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Handle NaN or invalid values
  if (isNaN(numValue)) return '0.00';

  return numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formats token amount based on the token's requirements
 * @param amount The raw token amount (string or number)
 * @param symbol The token symbol for reference
 * @param decimals The number of decimal places for the token (optional)
 * @returns Formatted token amount as string
 */
export const formatTokenAmount = (amount: string | number, symbol?: string, decimals?: number): string => {
  if (!amount) return '0';

  // Convert to number and handle scientific notation
  const numAmount = typeof amount === 'string' ? 
    parseFloat(amount.includes('e') ? amount : amount.replace(/,/g, '')) : 
    amount;

  if (isNaN(numAmount)) return '0';

  // Handle ADA specially (always 6 decimals)
  if (symbol === 'ADA') {
    const adaAmount = numAmount / 1_000_000; // Convert from lovelace to ADA
    return adaAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  }

  // Token has zero decimals (from token metadata)
  if (decimals === 0) {
    return Math.floor(numAmount).toLocaleString();
  }

  // Use token's decimal places if provided, otherwise default to 6
  const maxDecimals = decimals !== undefined ? decimals : 6;

  // Format based on the token's magnitude
  if (numAmount < 0.01) {
    return numAmount.toLocaleString(undefined, { 
      maximumFractionDigits: maxDecimals 
    });
  } else if (numAmount < 1) {
    return numAmount.toLocaleString(undefined, { 
      maximumFractionDigits: Math.min(4, maxDecimals) 
    });
  } else {
    return numAmount.toLocaleString(undefined, { 
      maximumFractionDigits: Math.min(2, maxDecimals) 
    });
  }
};

/**
 * Shortens an address for display
 * @param address Full address string
 * @param prefixLength Length of prefix to show (default: 6)
 * @param suffixLength Length of suffix to show (default: 6)
 * @returns Shortened address with ellipsis
 */
export const shortenAddress = (address: string, prefixLength = 6, suffixLength = 6): string => {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength + 3) return address;
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};

/**
 * Converts a block timestamp to a human-readable date and time
 * @param timestamp Block timestamp in seconds
 * @returns Object with formatted date and time
 */
export const timestampToDateTime = (timestamp: number): { date: string; time: string } => {
  const date = new Date(timestamp * 1000);

  return {
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  };
};