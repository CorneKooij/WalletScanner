import fetch from 'node-fetch';

interface TokenPrice {
  symbol: string;
  priceAda: number;
  priceUsd: number;
}

const MINSWAP_API_URL = 'https://api-mainnet-prod.minswap.org/coinmarketcap/v2/pairs';

export async function getTokenPrices(): Promise<Map<string, TokenPrice>> {
  try {
    const response = await fetch(MINSWAP_API_URL);
    if (!response.ok) {
      throw new Error(`MinSwap API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const prices = new Map<string, TokenPrice>();

    // Process pairs data
    if (data.pairs) {
      for (const pair of data.pairs) {
        if (pair.baseToken?.symbol && pair.quoteToken?.symbol === 'ADA') {
          prices.set(pair.baseToken.symbol, {
            symbol: pair.baseToken.symbol,
            priceAda: 1 / Number(pair.lastPrice || 0),
            priceUsd: (1 / Number(pair.lastPrice || 0)) * (data.cardanoUsdPrice || 0)
          });
        }
      }
    }

    // Add ADA price
    if (data.cardanoUsdPrice) {
      prices.set('ADA', {
        symbol: 'ADA',
        priceAda: 1,
        priceUsd: data.cardanoUsdPrice
      });
    }

    return prices;
  } catch (error) {
    console.error('Error fetching MinSwap prices:', error);
    return new Map();
  }
}