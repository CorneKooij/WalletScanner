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

  // Special handling for ADA/lovelace as it's a known case
  if (symbol?.toUpperCase() === 'ADA' || symbol?.toUpperCase() === 'LOVELACE') {
    numAmount = numAmount / 1_000_000; // Convert from lovelace to ADA
    return numAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  }

  // For other tokens, detect if the value needs decimal adjustment
  // This assumes large integer values (> 1M) might be in smallest units
  if (numAmount > 1_000_000 && Number.isInteger(numAmount)) {
    const magnitude = Math.floor(Math.log10(numAmount));
    if (magnitude >= 6) {
      numAmount = numAmount / Math.pow(10, 6);
    }
  }

  // Format with appropriate decimal places based on the value
  const magnitude = Math.abs(numAmount);
  let decimals = 2; // Default decimal places

  if (magnitude < 0.01) {
    decimals = 8; // More decimals for very small values
  } else if (magnitude < 1) {
    decimals = 6; // More decimals for small values
  } else if (magnitude >= 1000) {
    decimals = 2; // Fewer decimals for large values
  }

  return numAmount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
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