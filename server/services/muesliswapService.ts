import fetch from 'node-fetch';

interface TokenPrice {
  symbol: string;
  priceAda: number;
  priceUsd: number;
}

const MUESLISWAP_API_URL = 'https://api.muesliswap.com/list';
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

    // Get token prices from MuesliSwap
    const response = await fetch(MUESLISWAP_API_URL);
    if (!response.ok) {
      throw new Error(`MuesliSwap API error: ${response.statusText}`);
    }

    const data = await response.json() as any[];
    console.log('MuesliSwap API response status:', response.status);
    console.log('Number of tokens in response:', data?.length);
    console.log('First few tokens:', data?.slice(0, 5));

    // Process token data
    if (Array.isArray(data)) {
      for (const token of data) {
        try {
          // Log raw token data for debugging
          console.log('Processing token:', {
            ticker: token.ticker,
            price_ada: token.price_ada,
            name: token.name
          });

          if (!token.price_ada || !token.ticker) {
            console.log('Skipping token due to missing data:', token);
            continue;
          }

          const priceInAda = Number(token.price_ada);
          if (isNaN(priceInAda)) {
            console.log('Invalid price for token:', token);
            continue;
          }

          const symbol = token.ticker;
          const priceInUsd = priceInAda * adaUsdPrice;

          prices.set(symbol, {
            symbol,
            priceAda: priceInAda,
            priceUsd: priceInUsd
          });

          // Log successful price addition
          console.log(`Added price for ${symbol}:`, {
            priceAda: priceInAda,
            priceUsd: priceInUsd
          });
        } catch (tokenError) {
          console.error('Error processing token:', tokenError, token);
        }
      }
    }

    // Log summary of all prices
    console.log('Available token prices:', 
      Array.from(prices.entries())
        .map(([symbol, data]) => `${symbol}: ${data.priceAda} ADA`)
        .join(', ')
    );

    return prices;
  } catch (error) {
    console.error('Error fetching token prices:', error);
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