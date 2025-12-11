"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Sparkline from "@/components/ui/Sparkline";
import {
  Star,
  Search,
  Plus,
  Grid3x3,
  List,
  ChevronDown,
  ChevronLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Home,
  History,
  Settings,
  Download,
  X,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface WatchlistAsset {
  id: string;
  symbol: string;
  name: string;
  assetType: "STOCK" | "CRYPTO" | "COMMODITY" | "CURRENCY";
  logoUrl?: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  weekRange52Low?: number;
  weekRange52High?: number;
  sentiment?: number;
  sentimentLabel?: "Buying" | "Selling" | "Neutral";
  sparklineData?: number[];
  isFavorite: boolean;
}

// Comprehensive list of popular assets - 100+ stocks and crypto
const ALL_ASSETS = [
  // Top Tech Stocks
  { symbol: "AAPL", name: "Apple Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/apple.com" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/microsoft.com" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/google.com" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/amazon.com" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/tesla.com" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/nvidia.com" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/meta.com" },
  { symbol: "NFLX", name: "Netflix Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/netflix.com" },
  { symbol: "AMD", name: "Advanced Micro Devices", type: "STOCK", logoUrl: "https://logo.clearbit.com/amd.com" },
  { symbol: "ORCL", name: "Oracle Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/oracle.com" },
  { symbol: "CRM", name: "Salesforce Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/salesforce.com" },
  { symbol: "ADBE", name: "Adobe Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/adobe.com" },
  { symbol: "INTC", name: "Intel Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/intel.com" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/cisco.com" },
  { symbol: "IBM", name: "IBM Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/ibm.com" },
  { symbol: "QCOM", name: "Qualcomm Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/qualcomm.com" },
  { symbol: "TXN", name: "Texas Instruments", type: "STOCK", logoUrl: "https://logo.clearbit.com/ti.com" },
  { symbol: "AVGO", name: "Broadcom Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/broadcom.com" },
  { symbol: "NOW", name: "ServiceNow Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/servicenow.com" },
  { symbol: "SHOP", name: "Shopify Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/shopify.com" },

  // Finance & Banking
  { symbol: "JPM", name: "JPMorgan Chase & Co.", type: "STOCK", logoUrl: "https://logo.clearbit.com/jpmorganchase.com" },
  { symbol: "V", name: "Visa Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/visa.com" },
  { symbol: "MA", name: "Mastercard Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/mastercard.com" },
  { symbol: "BAC", name: "Bank of America", type: "STOCK", logoUrl: "https://logo.clearbit.com/bankofamerica.com" },
  { symbol: "WFC", name: "Wells Fargo & Co.", type: "STOCK", logoUrl: "https://logo.clearbit.com/wellsfargo.com" },
  { symbol: "GS", name: "Goldman Sachs", type: "STOCK", logoUrl: "https://logo.clearbit.com/goldmansachs.com" },
  { symbol: "MS", name: "Morgan Stanley", type: "STOCK", logoUrl: "https://logo.clearbit.com/morganstanley.com" },
  { symbol: "AXP", name: "American Express", type: "STOCK", logoUrl: "https://logo.clearbit.com/americanexpress.com" },
  { symbol: "BLK", name: "BlackRock Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/blackrock.com" },
  { symbol: "PYPL", name: "PayPal Holdings", type: "STOCK", logoUrl: "https://logo.clearbit.com/paypal.com" },
  { symbol: "SQ", name: "Block Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/block.xyz" },
  { symbol: "COIN", name: "Coinbase Global", type: "STOCK", logoUrl: "https://logo.clearbit.com/coinbase.com" },

  // Healthcare & Pharma
  { symbol: "JNJ", name: "Johnson & Johnson", type: "STOCK", logoUrl: "https://logo.clearbit.com/jnj.com" },
  { symbol: "UNH", name: "UnitedHealth Group", type: "STOCK", logoUrl: "https://logo.clearbit.com/unitedhealthgroup.com" },
  { symbol: "PFE", name: "Pfizer Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/pfizer.com" },
  { symbol: "ABBV", name: "AbbVie Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/abbvie.com" },
  { symbol: "MRK", name: "Merck & Co.", type: "STOCK", logoUrl: "https://logo.clearbit.com/merck.com" },
  { symbol: "LLY", name: "Eli Lilly and Co.", type: "STOCK", logoUrl: "https://logo.clearbit.com/lilly.com" },
  { symbol: "TMO", name: "Thermo Fisher Scientific", type: "STOCK", logoUrl: "https://logo.clearbit.com/thermofisher.com" },
  { symbol: "ABT", name: "Abbott Laboratories", type: "STOCK", logoUrl: "https://logo.clearbit.com/abbott.com" },
  { symbol: "BMY", name: "Bristol-Myers Squibb", type: "STOCK", logoUrl: "https://logo.clearbit.com/bms.com" },
  { symbol: "AMGN", name: "Amgen Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/amgen.com" },

  // Consumer & Retail
  { symbol: "WMT", name: "Walmart Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/walmart.com" },
  { symbol: "HD", name: "The Home Depot", type: "STOCK", logoUrl: "https://logo.clearbit.com/homedepot.com" },
  { symbol: "COST", name: "Costco Wholesale", type: "STOCK", logoUrl: "https://logo.clearbit.com/costco.com" },
  { symbol: "NKE", name: "Nike Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/nike.com" },
  { symbol: "MCD", name: "McDonald's Corp.", type: "STOCK", logoUrl: "https://logo.clearbit.com/mcdonalds.com" },
  { symbol: "SBUX", name: "Starbucks Corp.", type: "STOCK", logoUrl: "https://logo.clearbit.com/starbucks.com" },
  { symbol: "TGT", name: "Target Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/target.com" },
  { symbol: "LOW", name: "Lowe's Companies", type: "STOCK", logoUrl: "https://logo.clearbit.com/lowes.com" },
  { symbol: "PG", name: "Procter & Gamble", type: "STOCK", logoUrl: "https://logo.clearbit.com/pg.com" },
  { symbol: "KO", name: "Coca-Cola Company", type: "STOCK", logoUrl: "https://logo.clearbit.com/coca-cola.com" },
  { symbol: "PEP", name: "PepsiCo Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/pepsico.com" },
  { symbol: "DIS", name: "Walt Disney Co.", type: "STOCK", logoUrl: "https://logo.clearbit.com/disney.com" },

  // Energy
  { symbol: "XOM", name: "Exxon Mobil Corp.", type: "STOCK", logoUrl: "https://logo.clearbit.com/exxonmobil.com" },
  { symbol: "CVX", name: "Chevron Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/chevron.com" },
  { symbol: "COP", name: "ConocoPhillips", type: "STOCK", logoUrl: "https://logo.clearbit.com/conocophillips.com" },
  { symbol: "SLB", name: "Schlumberger Ltd.", type: "STOCK", logoUrl: "https://logo.clearbit.com/slb.com" },
  { symbol: "EOG", name: "EOG Resources", type: "STOCK", logoUrl: "https://logo.clearbit.com/eogresources.com" },

  // Industrial
  { symbol: "CAT", name: "Caterpillar Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/cat.com" },
  { symbol: "BA", name: "Boeing Company", type: "STOCK", logoUrl: "https://logo.clearbit.com/boeing.com" },
  { symbol: "HON", name: "Honeywell International", type: "STOCK", logoUrl: "https://logo.clearbit.com/honeywell.com" },
  { symbol: "UPS", name: "United Parcel Service", type: "STOCK", logoUrl: "https://logo.clearbit.com/ups.com" },
  { symbol: "RTX", name: "RTX Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/rtx.com" },
  { symbol: "LMT", name: "Lockheed Martin", type: "STOCK", logoUrl: "https://logo.clearbit.com/lockheedmartin.com" },
  { symbol: "GE", name: "General Electric", type: "STOCK", logoUrl: "https://logo.clearbit.com/ge.com" },
  { symbol: "MMM", name: "3M Company", type: "STOCK", logoUrl: "https://logo.clearbit.com/3m.com" },

  // Telecom & Media
  { symbol: "T", name: "AT&T Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/att.com" },
  { symbol: "VZ", name: "Verizon Communications", type: "STOCK", logoUrl: "https://logo.clearbit.com/verizon.com" },
  { symbol: "TMUS", name: "T-Mobile US", type: "STOCK", logoUrl: "https://logo.clearbit.com/t-mobile.com" },
  { symbol: "CMCSA", name: "Comcast Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/comcast.com" },

  // Automotive
  { symbol: "F", name: "Ford Motor Company", type: "STOCK", logoUrl: "https://logo.clearbit.com/ford.com" },
  { symbol: "GM", name: "General Motors", type: "STOCK", logoUrl: "https://logo.clearbit.com/gm.com" },
  { symbol: "RIVN", name: "Rivian Automotive", type: "STOCK", logoUrl: "https://logo.clearbit.com/rivian.com" },
  { symbol: "LCID", name: "Lucid Group", type: "STOCK", logoUrl: "https://logo.clearbit.com/lucidmotors.com" },

  // Airlines & Travel
  { symbol: "DAL", name: "Delta Air Lines", type: "STOCK", logoUrl: "https://logo.clearbit.com/delta.com" },
  { symbol: "UAL", name: "United Airlines", type: "STOCK", logoUrl: "https://logo.clearbit.com/united.com" },
  { symbol: "AAL", name: "American Airlines", type: "STOCK", logoUrl: "https://logo.clearbit.com/aa.com" },
  { symbol: "LUV", name: "Southwest Airlines", type: "STOCK", logoUrl: "https://logo.clearbit.com/southwest.com" },
  { symbol: "ABNB", name: "Airbnb Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/airbnb.com" },
  { symbol: "UBER", name: "Uber Technologies", type: "STOCK", logoUrl: "https://logo.clearbit.com/uber.com" },
  { symbol: "LYFT", name: "Lyft Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/lyft.com" },

  // Gaming & Entertainment
  { symbol: "EA", name: "Electronic Arts", type: "STOCK", logoUrl: "https://logo.clearbit.com/ea.com" },
  { symbol: "ATVI", name: "Activision Blizzard", type: "STOCK", logoUrl: "https://logo.clearbit.com/activisionblizzard.com" },
  { symbol: "TTWO", name: "Take-Two Interactive", type: "STOCK", logoUrl: "https://logo.clearbit.com/take2games.com" },
  { symbol: "RBLX", name: "Roblox Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/roblox.com" },
  { symbol: "SPOT", name: "Spotify Technology", type: "STOCK", logoUrl: "https://logo.clearbit.com/spotify.com" },

  // E-commerce & Social
  { symbol: "BABA", name: "Alibaba Group", type: "STOCK", logoUrl: "https://logo.clearbit.com/alibaba.com" },
  { symbol: "JD", name: "JD.com Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/jd.com" },
  { symbol: "PDD", name: "PDD Holdings", type: "STOCK", logoUrl: "https://logo.clearbit.com/pinduoduo.com" },
  { symbol: "SNAP", name: "Snap Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/snap.com" },
  { symbol: "PINS", name: "Pinterest Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/pinterest.com" },
  { symbol: "TWTR", name: "Twitter Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/twitter.com" },

  // Semiconductors
  { symbol: "TSM", name: "Taiwan Semiconductor", type: "STOCK", logoUrl: "https://logo.clearbit.com/tsmc.com" },
  { symbol: "ASML", name: "ASML Holding", type: "STOCK", logoUrl: "https://logo.clearbit.com/asml.com" },
  { symbol: "MU", name: "Micron Technology", type: "STOCK", logoUrl: "https://logo.clearbit.com/micron.com" },
  { symbol: "AMAT", name: "Applied Materials", type: "STOCK", logoUrl: "https://logo.clearbit.com/appliedmaterials.com" },
  { symbol: "LRCX", name: "Lam Research", type: "STOCK", logoUrl: "https://logo.clearbit.com/lamresearch.com" },
  { symbol: "KLAC", name: "KLA Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/kla.com" },
  { symbol: "ARM", name: "ARM Holdings", type: "STOCK", logoUrl: "https://logo.clearbit.com/arm.com" },

  // Cloud & Software
  { symbol: "SNOW", name: "Snowflake Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/snowflake.com" },
  { symbol: "PLTR", name: "Palantir Technologies", type: "STOCK", logoUrl: "https://logo.clearbit.com/palantir.com" },
  { symbol: "DDOG", name: "Datadog Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/datadoghq.com" },
  { symbol: "ZS", name: "Zscaler Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/zscaler.com" },
  { symbol: "CRWD", name: "CrowdStrike Holdings", type: "STOCK", logoUrl: "https://logo.clearbit.com/crowdstrike.com" },
  { symbol: "OKTA", name: "Okta Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/okta.com" },
  { symbol: "NET", name: "Cloudflare Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/cloudflare.com" },
  { symbol: "MDB", name: "MongoDB Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/mongodb.com" },
  { symbol: "TEAM", name: "Atlassian Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/atlassian.com" },
  { symbol: "ZM", name: "Zoom Video", type: "STOCK", logoUrl: "https://logo.clearbit.com/zoom.us" },
  { symbol: "DOCU", name: "DocuSign Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/docusign.com" },

  // Top Cryptocurrencies
  { symbol: "BTC", name: "Bitcoin", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/btc@2x.png" },
  { symbol: "ETH", name: "Ethereum", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/eth@2x.png" },
  { symbol: "BNB", name: "Binance Coin", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/bnb@2x.png" },
  { symbol: "SOL", name: "Solana", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/sol@2x.png" },
  { symbol: "XRP", name: "XRP", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/xrp@2x.png" },
  { symbol: "ADA", name: "Cardano", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/ada@2x.png" },
  { symbol: "DOGE", name: "Dogecoin", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/doge@2x.png" },
  { symbol: "AVAX", name: "Avalanche", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/avax@2x.png" },
  { symbol: "DOT", name: "Polkadot", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/dot@2x.png" },
  { symbol: "MATIC", name: "Polygon", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/matic@2x.png" },
  { symbol: "LINK", name: "Chainlink", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/link@2x.png" },
  { symbol: "UNI", name: "Uniswap", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/uni@2x.png" },
  { symbol: "LTC", name: "Litecoin", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/ltc@2x.png" },
  { symbol: "ATOM", name: "Cosmos", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/atom@2x.png" },
  { symbol: "XLM", name: "Stellar", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/xlm@2x.png" },
  { symbol: "TRX", name: "TRON", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/trx@2x.png" },
  { symbol: "ETC", name: "Ethereum Classic", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/etc@2x.png" },
  { symbol: "FIL", name: "Filecoin", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/fil@2x.png" },
  { symbol: "NEAR", name: "NEAR Protocol", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/near@2x.png" },
  { symbol: "APT", name: "Aptos", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/apt@2x.png" },
  { symbol: "SHIB", name: "Shiba Inu", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/shib@2x.png" },
  { symbol: "ARB", name: "Arbitrum", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/arb@2x.png" },
  { symbol: "OP", name: "Optimism", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/op@2x.png" },
  { symbol: "INJ", name: "Injective", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/inj@2x.png" },
  { symbol: "AAVE", name: "Aave", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/aave@2x.png" },
  { symbol: "GRT", name: "The Graph", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/grt@2x.png" },
  { symbol: "ALGO", name: "Algorand", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/algo@2x.png" },
  { symbol: "FTM", name: "Fantom", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/ftm@2x.png" },
  { symbol: "VET", name: "VeChain", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/vet@2x.png" },
  { symbol: "SAND", name: "The Sandbox", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/sand@2x.png" },
  { symbol: "MANA", name: "Decentraland", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/mana@2x.png" },
  { symbol: "AXS", name: "Axie Infinity", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/axs@2x.png" },

  // Commodities
  { symbol: "GOLD", name: "Gold", type: "COMMODITY", logoUrl: "https://img.icons8.com/color/96/000000/gold-bars.png" },
  { symbol: "SILVER", name: "Silver", type: "COMMODITY", logoUrl: "https://img.icons8.com/fluency/96/000000/silver-bars.png" },
  { symbol: "OIL", name: "Crude Oil", type: "COMMODITY", logoUrl: "https://img.icons8.com/color/96/000000/oil-industry.png" },
  { symbol: "NATGAS", name: "Natural Gas", type: "COMMODITY", logoUrl: "https://img.icons8.com/color/96/000000/gas-industry.png" },
  { symbol: "COPPER", name: "Copper", type: "COMMODITY", logoUrl: "https://img.icons8.com/color/96/000000/copper-ore.png" },
  { symbol: "PLATINUM", name: "Platinum", type: "COMMODITY", logoUrl: "https://img.icons8.com/color/96/000000/platinum.png" },
];

const ITEMS_PER_PAGE = 25;

export default function WatchlistPageNew() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [allAssets, setAllAssets] = useState<WatchlistAsset[]>([]);
  const [displayedAssets, setDisplayedAssets] = useState<WatchlistAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [favoriteSymbols, setFavoriteSymbols] = useState<Set<string>>(new Set());

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  // Store all cached prices
  const [cachedPrices, setCachedPrices] = useState<Record<string, any>>({});

  // Initial load - fetch favorites and ALL prices from cache
  const initializeWatchlist = async () => {
    try {
      // Fetch user's favorites and cached prices in parallel
      const [favResponse, pricesResponse] = await Promise.all([
        fetch("/api/watchlist"),
        fetch("/api/prices/bulk") // GET cached prices from database
      ]);

      const userFavorites = favResponse.ok ? (await favResponse.json()).watchlist : [];
      const favorites = new Set<string>(userFavorites.map((item: any) => item.symbol));
      setFavoriteSymbols(favorites);

      // Get cached prices
      let prices: Record<string, any> = {};
      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json();
        prices = pricesData.prices || {};
        setCachedPrices(prices);
        console.log(`Loaded ${Object.keys(prices).length} cached prices`);
      }

      // Initialize all assets with favorite status and cached prices
      const initializedAssets = ALL_ASSETS.map((asset) => {
        const cachedPrice = prices[asset.symbol];
        return {
          id: asset.symbol,
          symbol: asset.symbol,
          name: cachedPrice?.name || asset.name,
          assetType: asset.type as "STOCK" | "CRYPTO" | "COMMODITY" | "CURRENCY",
          logoUrl: asset.logoUrl,
          isFavorite: favorites.has(asset.symbol),
          currentPrice: cachedPrice?.price || 0,
          change: cachedPrice?.change || 0,
          changePercent: cachedPrice?.changePercent || 0,
          sentiment: cachedPrice?.sentimentPercentage || Math.floor(Math.random() * 30) + 70,
          sentimentLabel: cachedPrice?.sentimentLabel || "Neutral",
          sparklineData: generateSparklineData(cachedPrice?.price || 100, cachedPrice?.changePercent || 0),
          weekRange52Low: cachedPrice?.fiftyTwoWeekLow || (cachedPrice?.price || 100) * 0.7,
          weekRange52High: cachedPrice?.fiftyTwoWeekHigh || (cachedPrice?.price || 100) * 1.3,
        };
      });

      setAllAssets(initializedAssets);

      // Load first batch (already enriched with prices)
      const filteredList = getFilteredAssetListFromAssets(initializedAssets);
      setDisplayedAssets(filteredList.slice(0, ITEMS_PER_PAGE));
      setHasMore(filteredList.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Failed to initialize watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to filter from already loaded assets
  const getFilteredAssetListFromAssets = (assets: WatchlistAsset[]) => {
    let filtered = assets;

    if (activeFilter !== "All" && activeFilter !== "Market Open") {
      filtered = filtered.filter((asset) => {
        if (activeFilter === "Stocks") return asset.assetType === "STOCK";
        if (activeFilter === "Crypto") return asset.assetType === "CRYPTO";
        if (activeFilter === "Commodities") return asset.assetType === "COMMODITY";
        if (activeFilter === "Currencies") return asset.assetType === "CURRENCY";
        return true;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const loadMoreAssets = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    // Get filtered list from already loaded assets
    const filteredList = getFilteredAssetListFromAssets(allAssets);
    const nextBatch = filteredList.slice(start, end);

    if (nextBatch.length === 0) {
      setHasMore(false);
      setLoadingMore(false);
      return;
    }

    // No API calls needed - data is already loaded!
    setDisplayedAssets((prev) => [...prev, ...nextBatch]);
    setPage((prev) => prev + 1);
    setHasMore(end < filteredList.length);
    setLoadingMore(false);
  };

  const generateSparklineData = (price: number, changePercent: number): number[] => {
    const data = [];
    const days = 7;
    const volatility = Math.abs(changePercent) / 100;

    for (let i = 0; i < days; i++) {
      const randomChange = (Math.random() - 0.5) * volatility;
      const value = price * (1 + randomChange - (changePercent / 100) * ((days - i) / days));
      data.push(value);
    }

    return data;
  };

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      initializeWatchlist();
    }
  }, [session]);

  // Reset and reload when filter or search changes - use cached data
  useEffect(() => {
    if (loading || !session || allAssets.length === 0) return;

    // Use already-loaded assets with cached prices
    const filteredList = getFilteredAssetListFromAssets(allAssets);
    const firstBatch = filteredList.slice(0, ITEMS_PER_PAGE);

    setPage(1);
    setDisplayedAssets(firstBatch);
    setHasMore(filteredList.length > ITEMS_PER_PAGE);
  }, [activeFilter, searchQuery, allAssets]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreAssets();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, loading, page]);

  const toggleFavorite = async (symbol: string) => {
    try {
      const asset = displayedAssets.find((a) => a.symbol === symbol) ||
                   allAssets.find((a) => a.symbol === symbol);
      if (!asset) return;

      if (favoriteSymbols.has(symbol)) {
        const response = await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
        if (response.ok) {
          setFavoriteSymbols((prev) => {
            const newSet = new Set(prev);
            newSet.delete(symbol);
            return newSet;
          });
          setDisplayedAssets((prev) =>
            prev.map((a) => (a.symbol === symbol ? { ...a, isFavorite: false } : a))
          );
        }
      } else {
        const assetInfo = ALL_ASSETS.find((a) => a.symbol === symbol);
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: symbol,
            name: assetInfo?.name || asset.name,
            assetType: assetInfo?.type || asset.assetType,
          }),
        });
        if (response.ok) {
          setFavoriteSymbols((prev) => new Set(prev).add(symbol));
          setDisplayedAssets((prev) =>
            prev.map((a) => (a.symbol === symbol ? { ...a, isFavorite: true } : a))
          );
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const filterTabs = [
    "All",
    "Stocks",
    "Crypto",
    "Commodities",
  ];

  // Mobile skeleton
  const MobileSkeleton = () => (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 h-14 border-b border-[#1A1A1A]" />
      <div className="px-4 py-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-[#141414] rounded-2xl p-4 border border-[#262626] animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#262626] rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-16 bg-[#262626] rounded mb-2" />
                <div className="h-3 w-24 bg-[#262626] rounded" />
              </div>
              <div className="text-right">
                <div className="h-5 w-20 bg-[#262626] rounded mb-2" />
                <div className="h-3 w-12 bg-[#262626] rounded ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        {/* Mobile Loading */}
        <div className="lg:hidden">
          <MobileSkeleton />
        </div>
        {/* Desktop Loading */}
        <div className="hidden lg:flex min-h-screen items-center justify-center">
          <div className="text-text-primary text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="lg:hidden min-h-screen bg-[#0A0A0A] pb-[100px]">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">Watchlist</h1>
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-xs font-bold text-[#00FF87]">{ALL_ASSETS.length}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#808080]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-12 pr-12 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-white placeholder-[#808080] focus:outline-none focus:border-[#00FF87] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5 text-[#808080]" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips - Horizontal Scroll */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {filterTabs.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? "bg-[#00FF87] text-black"
                    : "bg-[#141414] text-[#B3B3B3] border border-[#262626]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Assets List - Mobile Cards */}
        <div className="px-4 space-y-3">
          {displayedAssets.length > 0 ? (
            displayedAssets.map((asset) => {
              const isPositive = asset.changePercent >= 0;
              const isFav = asset.isFavorite || favoriteSymbols.has(asset.symbol);

              return (
                <div
                  key={asset.id}
                  className="bg-[#141414] rounded-2xl p-4 border border-[#262626] active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Asset Icon */}
                    <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {asset.logoUrl ? (
                        <img
                          src={asset.logoUrl}
                          alt={asset.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#00FF87]">
                          {asset.symbol.substring(0, 2)}
                        </span>
                      )}
                    </div>

                    {/* Asset Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{asset.symbol}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          asset.assetType === 'CRYPTO'
                            ? 'bg-purple-500/20 text-purple-400'
                            : asset.assetType === 'COMMODITY'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {asset.assetType}
                        </span>
                      </div>
                      <p className="text-[#808080] text-sm truncate">{asset.name}</p>
                    </div>

                    {/* Price & Change */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-bold">
                        ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center justify-end gap-1 ${
                        isPositive ? 'text-[#00FF87]' : 'text-[#FF4444]'
                      }`}>
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span className="text-sm font-medium">
                          {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Favorite */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(asset.symbol);
                      }}
                      className="p-2 -mr-2"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          isFav ? 'text-[#00FF87] fill-[#00FF87]' : 'text-[#404040]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mini Sparkline */}
                  {asset.sparklineData && (
                    <div className="mt-3 pt-3 border-t border-[#262626]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[10px] text-[#808080] uppercase">Sentiment</p>
                            <p className={`text-sm font-medium ${
                              asset.sentiment && asset.sentiment > 50 ? 'text-[#00FF87]' : 'text-[#FF4444]'
                            }`}>
                              {asset.sentiment}% {asset.sentimentLabel}
                            </p>
                          </div>
                        </div>
                        <div className="w-20">
                          <Sparkline
                            data={asset.sparklineData}
                            color={isPositive ? "green" : "red"}
                            width={80}
                            height={24}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#141414] flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-[#404040]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No assets found</h3>
              <p className="text-[#808080] text-center text-sm max-w-[250px]">
                Try adjusting your search or filters
              </p>
              {(searchQuery || activeFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('All');
                  }}
                  className="mt-4 px-6 py-2 bg-[#00FF87] text-black font-medium rounded-full"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Load More */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-[#808080]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
          {!hasMore && displayedAssets.length > 0 && (
            <p className="text-[#808080] text-sm">
              All {displayedAssets.length} assets loaded
            </p>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/[0.08] z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around py-2 px-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2 px-4">
              <Home className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">Home</span>
            </Link>
            <Link href="/dashboard/trades" className="flex flex-col items-center gap-1 py-2 px-4">
              <TrendingUp className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">Trades</span>
            </Link>
            <Link
              href="/dashboard/deposit"
              className="flex items-center justify-center w-12 h-12 -mt-4 rounded-xl bg-gradient-to-br from-accent-green to-emerald-500 shadow-lg shadow-accent-green/30"
            >
              <Download className="w-5 h-5 text-background-main" />
            </Link>
            <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 py-2 px-4">
              <History className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">History</span>
            </Link>
            <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 py-2 px-4">
              <Settings className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">Settings</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* ==================== DESKTOP VIEW ==================== */}
      <div className="hidden lg:block p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-1">
              My Watchlist
            </h2>
            <p className="text-text-secondary text-sm">
              {ALL_ASSETS.length} assets available
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-background-card border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded ${
                  viewMode === "table"
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {filterTabs.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-primary text-white"
                  : "bg-background-card text-text-secondary hover:text-text-primary border border-border hover:border-primary"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks, crypto, commodities..."
              className="w-full pl-12 pr-4 py-3 bg-background-card border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && displayedAssets.length > 0 && (
          <div className="bg-background-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">
                      Markets
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-text-secondary">
                      Price
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-text-secondary">
                      Change 1D
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-text-secondary hidden lg:table-cell">
                      Chart
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-text-secondary hidden xl:table-cell">
                      Sentiment
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-border hover:bg-background-elevated transition-colors cursor-pointer"
                    >
                      {/* Asset Name & Logo */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {asset.logoUrl ? (
                              <img
                                src={asset.logoUrl}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.parentElement!.innerHTML = `<span class="text-primary font-bold text-sm">${asset.symbol.substring(0, 2)}</span>`;
                                }}
                              />
                            ) : (
                              <span className="text-primary font-bold text-sm">
                                {asset.symbol.substring(0, 2)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary">
                              {asset.symbol}
                            </div>
                            <div className="text-sm text-text-secondary truncate">
                              {asset.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-4 text-right">
                        <div className="font-semibold text-text-primary">
                          ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Change 1D */}
                      <td className="p-4 text-right">
                        <div
                          className={`font-semibold ${
                            asset.changePercent >= 0
                              ? "text-accent-green"
                              : "text-accent-red"
                          }`}
                        >
                          {asset.changePercent >= 0 ? "+" : ""}
                          {asset.changePercent.toFixed(2)}%
                        </div>
                        <div className="text-sm text-text-secondary">
                          {asset.changePercent >= 0 ? "▲" : "▼"} {Math.abs(asset.change).toFixed(2)}
                        </div>
                      </td>

                      {/* Chart */}
                      <td className="p-4 text-center hidden lg:table-cell">
                        {asset.sparklineData && (
                          <Sparkline
                            data={asset.sparklineData}
                            color={asset.changePercent >= 0 ? "green" : "red"}
                            width={80}
                            height={30}
                          />
                        )}
                      </td>

                      {/* Sentiment */}
                      <td className="p-4 hidden xl:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="text-right">
                            <div className="font-semibold text-text-primary">
                              {asset.sentiment}%
                            </div>
                            <div className="text-xs text-primary">
                              {asset.sentimentLabel}
                            </div>
                          </div>
                          <div className="w-20 h-2 bg-background-main rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${asset.sentiment}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Favorite Star */}
                      <td className="p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(asset.symbol);
                          }}
                          className={`hover:scale-110 transition-transform ${
                            asset.isFavorite || favoriteSymbols.has(asset.symbol)
                              ? "text-primary"
                              : "text-text-secondary hover:text-primary"
                          }`}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              asset.isFavorite || favoriteSymbols.has(asset.symbol) ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more assets...</span>
            </div>
          )}
          {!hasMore && displayedAssets.length > 0 && (
            <p className="text-text-secondary text-sm">
              All {displayedAssets.length} assets loaded
            </p>
          )}
        </div>

        {/* Empty State */}
        {displayedAssets.length === 0 && !loading && (
          <div className="bg-background-card border border-border rounded-lg p-12 text-center">
            <Search className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No Assets Found
            </h3>
            <p className="text-text-secondary">
              Try a different search term or filter
            </p>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </DashboardLayout>
  );
}
