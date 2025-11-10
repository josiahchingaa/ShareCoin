import { NextRequest, NextResponse } from "next/server";
import YahooFinanceModule from "yahoo-finance2";

const yahooFinance = new (YahooFinanceModule as any)();
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

// Map common crypto symbols to CoinGecko IDs
const cryptoMap: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  USDC: "usd-coin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  LTC: "litecoin",
  UNI: "uniswap",
  LINK: "chainlink",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const type = searchParams.get("type"); // 'stock' or 'crypto'

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    // If type is specified, use that; otherwise try to detect
    if (type === "crypto" || (!type && cryptoMap[symbol])) {
      return await getCryptoPrice(symbol);
    } else {
      return await getStockPrice(symbol);
    }
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}

async function getStockPrice(symbol: string) {
  try {
    const quote: any = await yahooFinance.quote(symbol);

    if (!quote || !quote.regularMarketPrice) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({
      symbol: symbol,
      name: quote.longName || quote.shortName || symbol,
      price: quote.regularMarketPrice,
      currency: quote.currency || "USD",
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      type: "stock",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // If Yahoo Finance fails, return error
    console.error("Yahoo Finance error:", error);
    return NextResponse.json(
      { error: "Stock not found or API error" },
      { status: 404 }
    );
  }
}

async function getCryptoPrice(symbol: string) {
  try {
    const coinId = cryptoMap[symbol];
    if (!coinId) {
      return NextResponse.json(
        { error: "Cryptocurrency not supported" },
        { status: 404 }
      );
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error("CoinGecko API error");
    }

    const data = await response.json();

    if (!data[coinId]) {
      return NextResponse.json(
        { error: "Cryptocurrency not found" },
        { status: 404 }
      );
    }

    const price = data[coinId].usd;
    const change24h = data[coinId].usd_24h_change || 0;

    return NextResponse.json({
      symbol: symbol,
      name: getCryptoName(symbol),
      price: price,
      currency: "USD",
      change: (price * change24h) / 100,
      changePercent: change24h,
      type: "crypto",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("CoinGecko error:", error);
    return NextResponse.json(
      { error: "Cryptocurrency not found or API error" },
      { status: 404 }
    );
  }
}

function getCryptoName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    USDT: "Tether",
    BNB: "Binance Coin",
    SOL: "Solana",
    XRP: "XRP",
    USDC: "USD Coin",
    ADA: "Cardano",
    AVAX: "Avalanche",
    DOGE: "Dogecoin",
    DOT: "Polkadot",
    MATIC: "Polygon",
    LTC: "Litecoin",
    UNI: "Uniswap",
    LINK: "Chainlink",
  };
  return names[symbol] || symbol;
}
