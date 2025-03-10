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
 * Formats token amount based on the token's decimal places
 * @param amount The raw token amount (string or number)
 * @param symbol The token symbol to determine decimals
 * @returns Formatted token amount as string
 */
export const formatTokenAmount = (amount: string | number, symbol = 'ADA'): string => {
  // Convert to number and handle scientific notation
  let numAmount = typeof amount === 'string' ? 
    parseFloat(amount.includes('e') ? amount : amount.replace(/,/g, '')) : 
    amount;

  // Get token-specific decimals and whether to apply decimal adjustment
  let decimals = 0;
  let needsAdjustment = false;

  switch(symbol?.toUpperCase()) {
    case 'ADA':
    case 'LOVELACE':
      decimals = 6;
      needsAdjustment = true; // ADA needs adjustment (1 ADA = 1,000,000 lovelace)
      break;
    case 'IAGON':
    case 'WMT':
    case 'MIN':
    case 'DJED':
    case 'SHEN':
      decimals = 6;
      needsAdjustment = true; // These tokens use 6 decimals adjustment
      break;
    case 'HOSKY':
      decimals = 8;
      needsAdjustment = true; // HOSKY uses 8 decimals adjustment
      break;
    default:
      decimals = 2; // Default to 2 decimals display, no adjustment needed
      needsAdjustment = false;
  }

  // Only adjust amount if the token needs decimal adjustment
  if (needsAdjustment && decimals > 0) {
    numAmount = numAmount / Math.pow(10, decimals);
  }

  // Format with appropriate decimal places
  return numAmount.toLocaleString(undefined, {
    minimumFractionDigits: decimals > 2 ? 2 : decimals,
    maximumFractionDigits: decimals > 2 ? 2 : decimals
  });
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