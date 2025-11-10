"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Sparkline from "@/components/ui/Sparkline";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Plus,
  Grid3x3,
  List,
  ChevronDown,
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
  shortPrice?: number;
  buyPrice?: number;
  weekRange52Low?: number;
  weekRange52High?: number;
  sentiment?: number; // 0-100 percentage
  sentimentLabel?: "Buying" | "Selling" | "Neutral";
  sparklineData?: number[];
  isFavorite: boolean;
}

// Top 20 popular assets - Stocks, Crypto, Commodities
const POPULAR_ASSETS = [
  // Top Stocks
  { symbol: "AAPL", name: "Apple Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/apple.com" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/microsoft.com" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/google.com" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/amazon.com" },
  { symbol: "TSLA", name: "Tesla Motors, Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/tesla.com" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/nvidia.com" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/meta.com" },
  { symbol: "NFLX", name: "Netflix Inc.", type: "STOCK", logoUrl: "https://logo.clearbit.com/netflix.com" },
  { symbol: "AMD", name: "Advanced Micro Devices", type: "STOCK", logoUrl: "https://logo.clearbit.com/amd.com" },
  { symbol: "ORCL", name: "Oracle Corporation", type: "STOCK", logoUrl: "https://logo.clearbit.com/oracle.com" },
  // Top Cryptocurrencies
  { symbol: "BTC", name: "Bitcoin", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/btc@2x.png" },
  { symbol: "ETH", name: "Ethereum", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/eth@2x.png" },
  { symbol: "BNB", name: "Binance Coin", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/bnb@2x.png" },
  { symbol: "SOL", name: "Solana", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/sol@2x.png" },
  { symbol: "XRP", name: "XRP", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/xrp@2x.png" },
  { symbol: "ADA", name: "Cardano", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/ada@2x.png" },
  { symbol: "DOGE", name: "Dogecoin", type: "CRYPTO", logoUrl: "https://assets.coincap.io/assets/icons/doge@2x.png" },
  // Commodities
  { symbol: "GOLD", name: "Gold (Non Expiry)", type: "COMMODITY", logoUrl: "https://img.icons8.com/color/96/000000/gold-bars.png" },
  { symbol: "OIL", name: "Oil (Non Expiry)", type: "COMMODITY", logoUrl: "https://img.icons8.com/color/96/000000/oil-industry.png" },
  { symbol: "SILVER", name: "Silver", type: "COMMODITY", logoUrl: "https://img.icons8.com/fluency/96/000000/silver-bars.png" },
];

export default function WatchlistPageNew() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [assets, setAssets] = useState<WatchlistAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<WatchlistAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  const fetchWatchlist = async () => {
    try {
      // Fetch user's favorites from database
      const response = await fetch("/api/watchlist");
      const userFavorites = response.ok ? (await response.json()).watchlist : [];
      const favoriteSymbols = new Set(userFavorites.map((item: any) => item.symbol));

      // Combine popular assets with user favorites
      const allAssets = POPULAR_ASSETS.map((asset) => ({
        id: asset.symbol,
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.type as "STOCK" | "CRYPTO" | "COMMODITY" | "CURRENCY",
        logoUrl: asset.logoUrl,
        isFavorite: favoriteSymbols.has(asset.symbol),
        currentPrice: 0,
        change: 0,
        changePercent: 0,
      }));

      // Fetch price data for all assets
      const enhancedAssets = await Promise.all(
        allAssets.map((item) => fetchAssetData(item))
      );

      setAssets(enhancedAssets);
      setFilteredAssets(enhancedAssets);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetData = async (item: any): Promise<WatchlistAsset> => {
    try {
      const response = await fetch(
        `/api/prices?symbol=${item.symbol}&type=${item.assetType.toLowerCase()}`
      );
      if (response.ok) {
        const priceData = await response.json();

        // Generate mock sparkline data (7 days)
        const sparkline = generateSparklineData(priceData.price, priceData.changePercent);

        // Generate mock sentiment data
        const sentiment = Math.floor(Math.random() * 30) + 70; // 70-100% for demo

        return {
          id: item.id,
          symbol: item.symbol,
          name: priceData.name,
          assetType: item.assetType,
          logoUrl: item.logoUrl,
          currentPrice: priceData.price,
          change: priceData.change,
          changePercent: priceData.changePercent,
          sparklineData: sparkline,
          sentiment,
          sentimentLabel: sentiment >= 80 ? "Buying" : sentiment >= 50 ? "Neutral" : "Selling",
          isFavorite: item.isFavorite,
          // Mock 52-week range
          weekRange52Low: priceData.price * 0.7,
          weekRange52High: priceData.price * 1.3,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${item.symbol}:`, error);
    }

    return {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      assetType: item.assetType,
      logoUrl: item.logoUrl,
      currentPrice: 0,
      change: 0,
      changePercent: 0,
      isFavorite: item.isFavorite,
    };
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

  const refreshPrices = async () => {
    setRefreshing(true);
    await fetchWatchlist();
    setRefreshing(false);
  };

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      fetchWatchlist();
    }
  }, [session]);

  // Filter assets
  useEffect(() => {
    let filtered = assets;

    // Filter by type
    if (activeFilter !== "All" && activeFilter !== "Market Open") {
      filtered = filtered.filter((asset) => {
        if (activeFilter === "Stocks") return asset.assetType === "STOCK";
        if (activeFilter === "Crypto") return asset.assetType === "CRYPTO";
        if (activeFilter === "Commodities") return asset.assetType === "COMMODITY";
        if (activeFilter === "Currencies") return asset.assetType === "CURRENCY";
        return true;
      });
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  }, [activeFilter, searchQuery, assets]);

  const toggleFavorite = async (symbol: string) => {
    try {
      const asset = assets.find((a) => a.symbol === symbol);
      if (!asset) return;

      if (asset.isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
        if (response.ok) {
          // Update local state
          setAssets(assets.map((a) =>
            a.symbol === symbol ? { ...a, isFavorite: false } : a
          ));
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: asset.symbol,
            name: asset.name,
            assetType: asset.assetType,
          }),
        });
        if (response.ok) {
          // Update local state
          setAssets(assets.map((a) =>
            a.symbol === symbol ? { ...a, isFavorite: true } : a
          ));
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const filterTabs = [
    "All",
    "Market Open",
    "Stocks",
    "Crypto",
    "Commodities",
    "Currencies",
    "Smart Portfolios",
  ];

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
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
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-1">
              My Watchlist
            </h2>
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

            {/* Add Asset Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>

            {/* Settings Dropdown */}
            <button className="p-2 bg-background-card border border-border rounded-lg hover:border-primary transition-colors">
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            </button>
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
              placeholder="Search"
              className="w-full pl-12 pr-4 py-3 bg-background-card border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && filteredAssets.length > 0 && (
          <div className="bg-background-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-text-secondary">
                      Markets
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-text-secondary">
                      Change 1D
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-text-secondary hidden lg:table-cell">
                      Chart
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-text-secondary hidden md:table-cell">
                      Short
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-text-secondary hidden md:table-cell">
                      Buy
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-text-secondary hidden xl:table-cell">
                      52W Range
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-text-secondary hidden xl:table-cell">
                      Sentiment
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
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
                                  // Fallback to initials if image fails to load
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

                      {/* Short Price */}
                      <td className="p-4 text-center hidden md:table-cell">
                        <button className="px-3 py-1 bg-accent-red/20 text-accent-red rounded text-sm font-medium hover:bg-accent-red/30 transition-colors">
                          S
                        </button>
                        <div className="text-sm text-text-secondary mt-1">
                          {asset.currentPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Buy Price */}
                      <td className="p-4 text-center hidden md:table-cell">
                        <button className="px-3 py-1 bg-primary/20 text-primary rounded text-sm font-medium hover:bg-primary/30 transition-colors">
                          B
                        </button>
                        <div className="text-sm text-text-secondary mt-1">
                          {asset.currentPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* 52W Range */}
                      <td className="p-4 hidden xl:table-cell">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm text-text-secondary">
                            {asset.weekRange52Low?.toFixed(2)}
                          </span>
                          <div className="w-24 h-1 bg-background-main rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-accent-red via-warning to-accent-green"
                              style={{
                                width: asset.weekRange52Low && asset.weekRange52High
                                  ? `${((asset.currentPrice - asset.weekRange52Low) / (asset.weekRange52High - asset.weekRange52Low)) * 100}%`
                                  : "50%",
                              }}
                            />
                          </div>
                          <span className="text-sm text-text-secondary">
                            {asset.weekRange52High?.toFixed(2)}
                          </span>
                        </div>
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
                            asset.isFavorite ? "text-primary" : "text-text-secondary hover:text-primary"
                          }`}
                        >
                          <Star className={`w-5 h-5 ${asset.isFavorite ? "fill-current" : ""}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between p-4 border-t border-border text-sm text-text-secondary">
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-medium">zł0.00</span>
                  <span className="ml-1">Cash Available</span>
                </div>
                <div className="hidden md:block">
                  <span className="font-medium">zł0.00</span>
                  <span className="ml-1">Total Invested</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block">
                  <span className="font-medium">zł0.00</span>
                  <span className="ml-1">Profit/Loss</span>
                </div>
                <div>
                  <span className="font-medium">zł0.00</span>
                  <span className="ml-1">Portfolio Value</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAssets.length === 0 && (
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

        {/* Refresh Button (Floating) */}
        <button
          onClick={refreshPrices}
          disabled={refreshing}
          className="fixed bottom-8 right-8 p-4 bg-primary text-white rounded-full shadow-xl hover:bg-primary-hover transition-all disabled:opacity-50 hover:scale-110"
        >
          <RefreshCw
            className={`w-6 h-6 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </DashboardLayout>
  );
}
