import fetch from 'node-fetch';

interface TokenPrice {
  symbol: string;
  priceAda: number;
  priceUsd: number;
}

const MUESLISWAP_API_URL = 'https://analytics.muesliswap.com/price';
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

    // Get token prices from MuesliSwap
    const response = await fetch(MUESLISWAP_API_URL);
    if (!response.ok) {
      throw new Error(`MuesliSwap API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const prices = new Map<string, TokenPrice>();

    // Add ADA price first
    prices.set('ADA', {
      symbol: 'ADA',
      priceAda: 1,
      priceUsd: adaUsdPrice
    });

    // Process MuesliSwap price data
    if (data && typeof data === 'object') {
      for (const [policyId, tokenData] of Object.entries(data)) {
        if (typeof tokenData === 'object' && tokenData !== null) {
          const tokenInfo = tokenData as any;
          if (tokenInfo.price_ada && tokenInfo.ticker) {
            const priceInAda = Number(tokenInfo.price_ada);
            prices.set(tokenInfo.ticker, {
              symbol: tokenInfo.ticker,
              priceAda: priceInAda,
              priceUsd: priceInAda * adaUsdPrice
            });
          }
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
