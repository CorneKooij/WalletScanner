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
 * @param symbol The token symbol to determine formatting
 * @returns Formatted token amount as string
 */
export const formatTokenAmount = (amount: string | number, symbol = 'ADA'): string => {
  // Convert to number and handle scientific notation
  let numAmount = typeof amount === 'string' ? 
    parseFloat(amount.includes('e') ? amount : amount.replace(/,/g, '')) : 
    amount;

  if (isNaN(numAmount)) return '0';

  // Special handling for different tokens
  switch(symbol.toUpperCase()) {
    case 'ADA':
      // Convert from lovelace to ADA
      numAmount = numAmount / 1_000_000;
      return numAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      });

    case 'IAG':
      // Show IAG with full decimal precision
      return numAmount.toLocaleString(undefined, {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      });

    case 'HONEY':
    case '389A81D09F92E156649049E15DB6E82F8D945BD1520033A0734088BD686F6E65792E':
    case 'TALOS':
    case 'CHARLES':
    case 'CHAD':
      // Show raw values without decimal adjustment for these tokens
      return Math.floor(numAmount).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });

    case 'WMTX':
      // Keep all decimals for WMTX
      return numAmount.toLocaleString(undefined, {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      });

    default:
      // For unknown tokens, show up to 6 decimals if present
      return numAmount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      });
  }
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