/**
 * Formats ADA or USD values to a readable string
 * @param value Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string
 */
export const formatADA = (value: number, decimals = 2): string => {
  return value.toLocaleString(undefined, {
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
