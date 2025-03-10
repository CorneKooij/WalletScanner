import fetch from 'node-fetch';

interface TokenPrice {
  symbol: string;
  priceAda: number;
  priceUsd: number;
}

const MINSWAP_API_URL = 'https://api-mainnet-prod.minswap.org/v2/analytics/pairs';

export async function getTokenPrices(): Promise<Map<string, TokenPrice>> {
  try {
    const response = await fetch(MINSWAP_API_URL);
    if (!response.ok) {
      throw new Error(`MinSwap API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const prices = new Map<string, TokenPrice>();

    // Add ADA price first (hardcoded for now as MinSwap API is unstable)
    prices.set('ADA', {
      symbol: 'ADA',
      priceAda: 1,
      priceUsd: 2.15 // Using a fixed value for now
    });

    // Process pairs data
    if (data.pairs && Array.isArray(data.pairs)) {
      for (const pair of data.pairs) {
        if (pair.baseToken?.symbol && pair.quoteToken?.symbol === 'ADA') {
          const lastPrice = Number(pair.lastPrice || 0);
          if (lastPrice > 0) {
            prices.set(pair.baseToken.symbol, {
              symbol: pair.baseToken.symbol,
              priceAda: 1 / lastPrice,
              priceUsd: (1 / lastPrice) * (prices.get('ADA')?.priceUsd || 2.15)
            });
          }
        }
      }
    }

    return prices;
  } catch (error) {
    console.error('Error fetching MinSwap prices:', error);
    // Return a map with just ADA price if API fails
    const prices = new Map<string, TokenPrice>();
    prices.set('ADA', {
      symbol: 'ADA',
      priceAda: 1,
      priceUsd: 2.15 // Using a fixed value for now
    });
    return prices;
  }
}