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

  if (isNaN(numAmount)) return '0';

  // Default decimals for different tokens
  const tokenDecimals: Record<string, number> = {
    'ADA': 6,      // 1 ADA = 1,000,000 lovelace
    'TALOS': 6,    // Known to have 6 decimals
    'CHARLES': 6,  // Known to have 6 decimals
    'HONEY': 6,    // Known to have 6 decimals
    'MIN': 6,      // Known to have 6 decimals
    'IAG': 6       // Known to have 6 decimals
  };

  const decimals = tokenDecimals[symbol] || 6; // Default to 6 if not specified

  // Adjust the amount based on decimals
  const adjustedAmount = numAmount / Math.pow(10, decimals);

  // Format based on the adjusted amount
  if (Math.abs(adjustedAmount) < 0.000001) {
    // Very small numbers in scientific notation
    return adjustedAmount.toExponential(2);
  } else if (Math.abs(adjustedAmount) < 0.01) {
    // Small numbers with more decimals
    return adjustedAmount.toFixed(6);
  } else if (Math.abs(adjustedAmount) < 1) {
    // Numbers less than 1
    return adjustedAmount.toFixed(4);
  } else if (Math.abs(adjustedAmount) < 1000) {
    // Regular numbers
    return adjustedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else {
    // Large numbers
    return adjustedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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