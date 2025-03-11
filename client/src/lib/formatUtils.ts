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
 * Formats token amount based on the token's decimal places from metadata
 * @param amount The raw token amount (string or number)
 * @param symbol The token symbol for reference
 * @param decimals The number of decimal places from token metadata
 * @returns Formatted token amount as string
 */
export const formatTokenAmount = (amount: string | number, symbol = 'ADA', decimals?: number): string => {
  if (!amount) return '0';

  // Convert to number and handle scientific notation
  let numAmount = typeof amount === 'string' ? 
    parseFloat(amount.includes('e') ? amount : amount.replace(/,/g, '')) : 
    amount;

  if (isNaN(numAmount)) return '0';

  // Special handling for ADA which always has 6 decimals (lovelace conversion)
  if (symbol.toUpperCase() === 'ADA') {
    // Convert from lovelace to ADA
    numAmount = numAmount / 1_000_000;
    return numAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  }

  // For tokens with zero decimals (indivisible tokens)
  if (decimals === 0) {
    // Display raw amount without any decimal adjustment
    return Math.floor(numAmount).toString();
  }

  // For tokens with decimal places, divide by the appropriate power of 10
  const tokenDecimals = decimals || 6; // Default to 6 if not specified
  numAmount = numAmount / Math.pow(10, tokenDecimals);

  return numAmount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: tokenDecimals
  });
};

/**
 * Shortens an address for display
 */
export const shortenAddress = (address: string, prefixLength = 6, suffixLength = 6): string => {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength + 3) return address;
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};

/**
 * Converts a block timestamp to a human-readable date and time
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