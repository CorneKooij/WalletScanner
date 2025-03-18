import fetch from "node-fetch";

interface TokenPrice {
  symbol: string;
  priceAda: number;
  priceUsd: number;
}

const MUESLISWAP_API_URL = "https://api.muesliswap.com/list";
const COINGECKO_ADA_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd";

export async function getTokenPrices(): Promise<Map<string, TokenPrice>> {
  try {
    const adaResponse = await fetch(COINGECKO_ADA_URL);
    const adaData = await adaResponse.json();
    const adaUsdPrice = adaData?.cardano?.usd || 0;

    const prices = new Map<string, TokenPrice>();
    prices.set("ADA", {
      symbol: "ADA",
      priceAda: 1,
      priceUsd: adaUsdPrice,
    });

    const response = await fetch(MUESLISWAP_API_URL);
    const data = await response.json();

    data.forEach((token: any) => {
      const symbol = token.info?.symbol || token.info?.ticker;
      const priceInAda = Number(token.price?.price || token.price?.price_ada);
      if (symbol && !isNaN(priceInAda)) {
        const priceInUsd = priceInAda * adaUsdPrice;
        prices.set(symbol, {
          symbol,
          priceAda: priceInAda,
          priceUsd: priceInUsd,
        });
      }
    });

    return prices;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    const prices = new Map<string, TokenPrice>();
    prices.set("ADA", {
      symbol: "ADA",
      priceAda: 1,
      priceUsd: 0.5,
    });
    return prices;
  }
}
