import { NextRequest, NextResponse } from "next/server";
import YahooFinanceModule from "yahoo-finance2";
import prisma from "@/lib/prisma";

const yahooFinance = new (YahooFinanceModule as any)();

// SERVER-SIDE CACHE: Stores prices for 5 minutes to avoid hitting API rate limits
const priceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Map crypto symbols to CoinGecko IDs - Extended list
const cryptoMap: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin", SOL: "solana",
  XRP: "ripple", ADA: "cardano", DOGE: "dogecoin", AVAX: "avalanche-2",
  DOT: "polkadot", MATIC: "polygon-ecosystem-token", LINK: "chainlink", UNI: "uniswap",
  ATOM: "cosmos", LTC: "litecoin", TRX: "tron", SHIB: "shiba-inu",
  BCH: "bitcoin-cash", XLM: "stellar", ETC: "ethereum-classic", FIL: "filecoin",
  NEAR: "near", APT: "aptos", ARB: "arbitrum", OP: "optimism",
  INJ: "injective-protocol", AAVE: "aave", GRT: "the-graph", ALGO: "algorand",
  FTM: "fantom", VET: "vechain", SAND: "the-sandbox", MANA: "decentraland",
  AXS: "axie-infinity",
};

const commodityMap: Record<string, string> = {
  GOLD: "GC=F",
  SILVER: "SI=F",
  OIL: "CL=F",
  NATGAS: "NG=F",
  COPPER: "HG=F",
  PLATINUM: "PL=F",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function convertRatingToSentiment(rating: string | null): { percentage: number; label: string } | null {
  if (!rating) return null;
  const numericRating = parseFloat(rating);
  if (isNaN(numericRating)) return null;
  const percentage = Math.max(0, Math.min(100, 100 - ((numericRating - 1) * 33.33)));
  let label = "Neutral";
  if (percentage >= 70) label = "Bullish";
  else if (percentage < 40) label = "Bearish";
  return { percentage: Math.round(percentage), label };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: "symbols array is required" }, { status: 400 });
    }

    // Check server-side cache first
    const cacheKey = "bulk_prices_all";
    const cached = priceCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log("[BULK API] Returning cached prices (age: " + Math.round((now - cached.timestamp) / 1000) + "s)");
      return NextResponse.json({ prices: cached.data, cached: true });
    }

    console.log("[BULK API] Cache miss or expired, fetching fresh prices...");

    // Group symbols by type
    const stocks: string[] = [];
    const cryptos: string[] = [];
    const commodities: string[] = [];

    symbols.forEach((item: string | { symbol: string; type?: string }) => {
      // Support both string format and object format
      const sym = (typeof item === 'string' ? item : item.symbol).toUpperCase();
      const type = typeof item === 'object' ? item.type : undefined;

      if (type === "CRYPTO" || cryptoMap[sym]) {
        cryptos.push(sym);
      } else if (type === "COMMODITY" || commodityMap[sym]) {
        commodities.push(sym);
      } else {
        stocks.push(sym);
      }
    });

    // Fetch all data in parallel
    const results = await Promise.all([
      fetchStocksBulk(stocks),
      fetchCryptosBulk(cryptos),
      fetchCommoditiesBulk(commodities),
    ]);

    // Combine results
    const combined = {
      ...results[0],
      ...results[1],
      ...results[2],
    };

    // Store in server-side cache
    priceCache.set(cacheKey, { data: combined, timestamp: now });
    console.log("[BULK API] Cached " + Object.keys(combined).length + " prices for 5 minutes");

    // Also save to database for persistent caching
    await savePricesToDatabase(combined);

    return NextResponse.json({ prices: combined, cached: false, savedToDatabase: true });
  } catch (error) {
    console.error("Bulk prices error:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}

async function fetchStocksBulk(symbols: string[]): Promise<Record<string, any>> {
  if (symbols.length === 0) return {};

  try {
    // Yahoo Finance supports multiple symbols in one call
    const quotes: any = await yahooFinance.quote(symbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const results: Record<string, any> = {};

    for (const quote of quotesArray) {
      if (!quote || !quote.symbol) continue;

      const symbol = quote.symbol;
      let sentiment = convertRatingToSentiment(quote.averageAnalystRating);

      // Fallback sentiment from 52-week momentum
      if (!sentiment && quote.fiftyTwoWeekHigh && quote.fiftyTwoWeekLow && quote.fiftyTwoWeekHigh !== quote.fiftyTwoWeekLow) {
        const rangePosition = ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100;
        const trendAdjustment = Math.max(-15, Math.min(15, (quote.regularMarketChangePercent || 0) * 3));
        const sentimentPercentage = Math.round(Math.max(0, Math.min(100, rangePosition + trendAdjustment)));
        sentiment = {
          percentage: sentimentPercentage,
          label: sentimentPercentage >= 70 ? "Bullish" : sentimentPercentage < 40 ? "Bearish" : "Neutral"
        };
      }

      // Last fallback: Use daily price change as simple sentiment indicator
      if (!sentiment && quote.regularMarketChangePercent != null) {
        // Map price change to sentiment: -10% = 0%, 0% = 50%, +10% = 100%
        const sentimentPercentage = Math.round(Math.max(0, Math.min(100, 50 + (quote.regularMarketChangePercent * 5))));
        sentiment = {
          percentage: sentimentPercentage,
          label: sentimentPercentage >= 70 ? "Bullish" : sentimentPercentage < 40 ? "Bearish" : "Neutral"
        };
      }

      results[symbol] = {
        symbol,
        name: quote.longName || quote.shortName || symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        sentimentPercentage: sentiment?.percentage !== undefined ? sentiment.percentage : null,
        sentimentLabel: sentiment?.label || null,
        sparkline: [], // Skip sparklines for bulk to save time
      };
    }

    return results;
  } catch (error) {
    console.error("Failed to fetch stocks bulk:", error);
    return {};
  }
}

async function fetchCryptosBulk(symbols: string[]): Promise<Record<string, any>> {
  if (symbols.length === 0) return {};

  try {
    // Map symbols to CoinGecko IDs
    const coinIds = symbols.map(s => cryptoMap[s]).filter(Boolean);
    if (coinIds.length === 0) return {};

    // CoinGecko supports multiple coins in one call
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url);
    if (!response.ok) return {};

    const data = await response.json();
    const results: Record<string, any> = {};

    // Reverse map: coinId -> symbol
    const idToSymbol: Record<string, string> = {};
    Object.entries(cryptoMap).forEach(([sym, id]) => {
      idToSymbol[id] = sym;
    });

    for (const coin of data) {
      const symbol = idToSymbol[coin.id];
      if (!symbol) continue;

      // Skip coins with null prices (migrated/delisted coins)
      if (coin.current_price == null || coin.current_price === 0) {
        console.log(`[CRYPTO BULK] Skipping ${symbol} - null/zero price (possibly migrated)`);
        continue;
      }

      // Calculate sentiment from sentiment votes (primary method)
      let sentiment = null;
      if (coin.sentiment_votes_up_percentage != null) {
        const percentage = Math.round(coin.sentiment_votes_up_percentage);
        sentiment = {
          percentage,
          label: percentage >= 70 ? "Bullish" : percentage < 40 ? "Bearish" : "Neutral"
        };
        console.log(`[${symbol}] Sentiment from votes: ${percentage}%`);
      }

      // Fallback: Calculate sentiment from ATH/ATL position if no sentiment votes
      if (!sentiment && coin.ath && coin.atl && coin.ath !== coin.atl) {
        const rangePosition = ((coin.current_price - coin.atl) / (coin.ath - coin.atl)) * 100;
        const trendAdjustment = Math.max(-15, Math.min(15, (coin.price_change_percentage_24h || 0) * 3));
        const sentimentPercentage = Math.round(Math.max(0, Math.min(100, rangePosition + trendAdjustment)));
        sentiment = {
          percentage: sentimentPercentage,
          label: sentimentPercentage >= 70 ? "Bullish" : sentimentPercentage < 40 ? "Bearish" : "Neutral"
        };
        console.log(`[${symbol}] Sentiment from ATH/ATL: ${sentimentPercentage}% (range: ${rangePosition.toFixed(1)}%, trend: ${trendAdjustment.toFixed(1)}%)`);
      }

      // Last fallback: Use 24h price change as simple sentiment indicator
      if (!sentiment && coin.price_change_percentage_24h != null) {
        // Map price change to sentiment: -10% = 0%, 0% = 50%, +10% = 100%
        const sentimentPercentage = Math.round(Math.max(0, Math.min(100, 50 + (coin.price_change_percentage_24h * 5))));
        sentiment = {
          percentage: sentimentPercentage,
          label: sentimentPercentage >= 70 ? "Bullish" : sentimentPercentage < 40 ? "Bearish" : "Neutral"
        };
        console.log(`[${symbol}] Sentiment from 24h change: ${sentimentPercentage}%`);
      }

      if (!sentiment) {
        console.log(`[${symbol}] WARNING: No sentiment calculated! votes=${coin.sentiment_votes_up_percentage}, ath=${coin.ath}, atl=${coin.atl}, change24h=${coin.price_change_percentage_24h}`);
      }

      results[symbol] = {
        symbol,
        name: coin.name,
        price: coin.current_price || 0,
        change: coin.price_change_24h || 0,
        changePercent: coin.price_change_percentage_24h || 0,
        volume: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        ath: coin.ath || null,
        atl: coin.atl || null,
        sentimentPercentage: sentiment?.percentage !== undefined ? sentiment.percentage : null,
        sentimentLabel: sentiment?.label || null,
        sparkline: [],
      };
    }

    return results;
  } catch (error) {
    console.error("Failed to fetch cryptos bulk:", error);
    return {};
  }
}

async function fetchCommoditiesBulk(symbols: string[]): Promise<Record<string, any>> {
  if (symbols.length === 0) return {};

  try {
    // Map to Yahoo Finance symbols
    const yahooSymbols = symbols.map(s => commodityMap[s] || s);

    const quotes: any = await yahooFinance.quote(yahooSymbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const results: Record<string, any> = {};

    // Reverse map
    const yahooToOriginal: Record<string, string> = {};
    Object.entries(commodityMap).forEach(([orig, yahoo]) => {
      yahooToOriginal[yahoo] = orig;
    });

    for (const quote of quotesArray) {
      if (!quote || !quote.symbol) continue;

      const originalSymbol = yahooToOriginal[quote.symbol] || quote.symbol;

      // Calculate momentum sentiment from 52-week range
      let sentiment = null;
      if (quote.fiftyTwoWeekHigh && quote.fiftyTwoWeekLow && quote.fiftyTwoWeekHigh !== quote.fiftyTwoWeekLow) {
        const rangePosition = ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100;
        const trendAdjustment = Math.max(-15, Math.min(15, (quote.regularMarketChangePercent || 0) * 3));
        const sentimentPercentage = Math.round(Math.max(0, Math.min(100, rangePosition + trendAdjustment)));
        sentiment = {
          percentage: sentimentPercentage,
          label: sentimentPercentage >= 70 ? "Bullish" : sentimentPercentage < 40 ? "Bearish" : "Neutral"
        };
      }

      // Fallback: Use daily price change as simple sentiment indicator
      if (!sentiment && quote.regularMarketChangePercent != null) {
        // Map price change to sentiment: -10% = 0%, 0% = 50%, +10% = 100%
        const sentimentPercentage = Math.round(Math.max(0, Math.min(100, 50 + (quote.regularMarketChangePercent * 5))));
        sentiment = {
          percentage: sentimentPercentage,
          label: sentimentPercentage >= 70 ? "Bullish" : sentimentPercentage < 40 ? "Bearish" : "Neutral"
        };
      }

      results[originalSymbol] = {
        symbol: originalSymbol,
        name: quote.longName || quote.shortName || originalSymbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
        sentimentPercentage: sentiment?.percentage !== undefined ? sentiment.percentage : null,
        sentimentLabel: sentiment?.label || null,
        sparkline: [],
      };
    }

    return results;
  } catch (error) {
    console.error("Failed to fetch commodities bulk:", error);
    return {};
  }
}

// Save prices to database for persistent caching
async function savePricesToDatabase(prices: Record<string, any>) {
  const entries = Object.values(prices);
  let saved = 0;

  for (const price of entries) {
    try {
      await prisma.priceCache.upsert({
        where: { symbol: price.symbol },
        update: {
          name: price.name,
          assetType: price.symbol in cryptoMap ? "CRYPTO" : price.symbol in commodityMap ? "COMMODITY" : "STOCK",
          price: price.price || 0,
          change: price.change || 0,
          changePercent: price.changePercent || 0,
          volume: price.volume || null,
          marketCap: price.marketCap || null,
          high24h: price.fiftyTwoWeekHigh || price.ath || null,
          low24h: price.fiftyTwoWeekLow || price.atl || null,
        },
        create: {
          symbol: price.symbol,
          name: price.name,
          assetType: price.symbol in cryptoMap ? "CRYPTO" : price.symbol in commodityMap ? "COMMODITY" : "STOCK",
          price: price.price || 0,
          change: price.change || 0,
          changePercent: price.changePercent || 0,
          volume: price.volume || null,
          marketCap: price.marketCap || null,
          high24h: price.fiftyTwoWeekHigh || price.ath || null,
          low24h: price.fiftyTwoWeekLow || price.atl || null,
        },
      });
      saved++;
    } catch (error) {
      console.error(`Failed to save ${price.symbol} to database:`, error);
    }
  }

  console.log(`[BULK API] Saved ${saved}/${entries.length} prices to database`);
}

// GET - Retrieve all cached prices from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // STOCK, CRYPTO, COMMODITY, or all

    // First try to get from database
    let whereClause: any = {};
    if (type) {
      whereClause.assetType = type.toUpperCase();
    }

    const dbPrices = await prisma.priceCache.findMany({
      where: whereClause,
      orderBy: { symbol: "asc" }
    });

    if (dbPrices.length > 0) {
      // Check if cache is stale (older than 10 minutes)
      const now = new Date();
      const oldestUpdate = dbPrices.reduce((oldest, p) => {
        const updateTime = new Date(p.updatedAt);
        return updateTime < oldest ? updateTime : oldest;
      }, now);

      const cacheAgeMinutes = Math.round((now.getTime() - oldestUpdate.getTime()) / 60000);
      const isStale = cacheAgeMinutes > 10;

      // Convert to response format
      const pricesMap: Record<string, any> = {};
      dbPrices.forEach(p => {
        pricesMap[p.symbol] = {
          symbol: p.symbol,
          name: p.name,
          price: Number(p.price),
          change: Number(p.change),
          changePercent: Number(p.changePercent),
          volume: p.volume ? Number(p.volume) : 0,
          marketCap: p.marketCap ? Number(p.marketCap) : 0,
          fiftyTwoWeekHigh: p.high24h ? Number(p.high24h) : null,
          fiftyTwoWeekLow: p.low24h ? Number(p.low24h) : null,
          // Generate sentiment from change percent
          sentimentPercentage: Math.round(Math.max(0, Math.min(100, 50 + (Number(p.changePercent) * 5)))),
          sentimentLabel: Number(p.changePercent) >= 4 ? "Bullish" : Number(p.changePercent) <= -4 ? "Bearish" : "Neutral",
          sparkline: [],
        };
      });

      return NextResponse.json({
        prices: pricesMap,
        cached: true,
        fromDatabase: true,
        cacheAgeMinutes,
        isStale,
        count: dbPrices.length,
      });
    }

    // No database cache, return empty
    return NextResponse.json({
      prices: {},
      cached: false,
      fromDatabase: true,
      message: "No cached prices available. Call POST to fetch prices.",
      count: 0,
    });

  } catch (error) {
    console.error("GET cached prices error:", error);
    return NextResponse.json({ error: "Failed to fetch cached prices" }, { status: 500 });
  }
}
