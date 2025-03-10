import fetch from 'node-fetch';

interface TokenPrice {
  symbol: string;
  priceAda: number;
  priceUsd: number;
}

const MUESLISWAP_API_URL = 'https://analytics-api.muesliswap.com';
const COINGECKO_ADA_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd';

export async function getTokenPrices(): Promise<Map<string, TokenPrice>> {
  try {
    // Get ADA/USD price from CoinGecko
    const adaResponse = await fetch(COINGECKO_ADA_URL);
    if (!adaResponse.ok) {
      throw new Error(`CoinGecko API error: ${adaResponse.statusText}`);
    }
    const adaData = await adaResponse.json() as any;
    const adaUsdPrice = adaData?.cardano?.usd || 0;

    // Initialize prices map with ADA
    const prices = new Map<string, TokenPrice>();
    prices.set('ADA', {
      symbol: 'ADA',
      priceAda: 1,
      priceUsd: adaUsdPrice
    });

    // Get list of all tokens with prices
    const response = await fetch(`${MUESLISWAP_API_URL}/list`);
    if (!response.ok) {
      throw new Error(`MuesliSwap API error: ${response.statusText}`);
    }

    const data = await response.json() as any[];
    console.log('MuesliSwap API response:', data);

    // Process token data
    if (Array.isArray(data)) {
      for (const token of data) {
        if (token.price_ada) {
          const priceInAda = Number(token.price_ada);
          const symbol = token.ticker || token.token_name || 'UNKNOWN';

          // Skip if no valid price or symbol
          if (isNaN(priceInAda) || !symbol) continue;

          prices.set(symbol, {
            symbol,
            priceAda: priceInAda,
            priceUsd: priceInAda * adaUsdPrice
          });

          console.log(`Processed token ${symbol}:`, {
            priceAda: priceInAda,
            priceUsd: priceInAda * adaUsdPrice
          });
        }
      }
    }

    return prices;
  } catch (error) {
    console.error('Error fetching MuesliSwap prices:', error);
    // Return a map with just ADA price if API fails
    const prices = new Map<string, TokenPrice>();
    prices.set('ADA', {
      symbol: 'ADA',
      priceAda: 1,
      priceUsd: 0.5 // Fallback price if APIs fail
    });
    return prices;
  }
}