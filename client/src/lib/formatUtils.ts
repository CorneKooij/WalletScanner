/**
 * Formats ADA or USD values to a readable string
 */
export const formatADA = (value: number | string, decimals = 2): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0.00';
  return numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formats token amount based on the token's decimal places from metadata
 */
export const formatTokenAmount = (amount: string | number, symbol = 'ADA', decimals?: number): string => {
  if (!amount) return '0';

  // Parse the raw amount, handling scientific notation
  let rawAmount = typeof amount === 'string' ? 
    parseFloat(amount.includes('e') ? amount : amount.replace(/,/g, '')) : 
    amount;

  if (isNaN(rawAmount)) return '0';

  // Special handling for ADA which always has 6 decimals (lovelace conversion)
  if (symbol.toUpperCase() === 'ADA') {
    const adaAmount = rawAmount / 1_000_000;
    return adaAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  }

  // For tokens with zero decimals, return the raw amount with no processing
  if (decimals === 0) {
    return String(rawAmount);
  }

  // For tokens with decimal places (like IAGON, WMTX)
  const tokenDecimals = decimals || 6; // Default to 6 if not specified
  const expectedMagnitude = Math.pow(10, tokenDecimals - 1);
  const needsAdjustment = rawAmount > expectedMagnitude;

  const finalAmount = needsAdjustment ? 
    rawAmount / Math.pow(10, tokenDecimals) : 
    rawAmount;

  return finalAmount.toLocaleString(undefined, {
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