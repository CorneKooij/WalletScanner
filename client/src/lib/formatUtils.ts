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
 * Formats token amount based on the token's decimal places (e.g., ADA has 6 decimals)
 * @param amount The raw token amount (string or number)
 * @param symbol The token symbol to determine decimals
 * @param decimals Optional override for decimal places
 * @returns Formatted token amount as string
 */
export const formatTokenAmount = (amount: string | number, symbol = 'ADA'): string => {
  // Convert to number
  let numAmount = typeof amount === 'string' ? Number(amount) : amount;

  // Get token-specific decimals
  let decimals = 0;
  switch(symbol?.toUpperCase()) {
    case 'ADA':
    case 'LOVELACE':
      decimals = 6; // ADA uses 6 decimals (1 ADA = 1,000,000 lovelace)
      break;
    case 'DJED':
    case 'SHEN':
      decimals = 6; // Stablecoins typically use 6 decimals
      break;
    case 'HOSKY':
    case 'SNEK':
      decimals = 8; // Some tokens use 8 decimals
      break;
    default:
      decimals = 0; // Default to 0 decimals for unknown tokens
  }

  // Adjust amount based on decimals
  if (decimals > 0) {
    numAmount = numAmount / Math.pow(10, decimals);
  }

  // Format the result
  // Use more decimals for very small values
  const displayDecimals = numAmount < 0.01 && numAmount > 0 ? 6 : 2;
  return formatADA(numAmount, displayDecimals);
};

/**
 * Formats a date string in the format YYYY-MM-DD to MMM DD, YYYY
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
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
  if (address === 'Contract' || address === 'Stake Pool') return address;
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