"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Search,
  RefreshCw,
} from "lucide-react";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  assetType: "STOCK" | "CRYPTO";
  logoUrl?: string;
  addedAt: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

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
      const response = await fetch("/api/watchlist");
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist);
        // Fetch current prices for all items
        await fetchPricesForWatchlist(data.watchlist);
      }
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricesForWatchlist = async (items: WatchlistItem[]) => {
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const response = await fetch(
            `/api/prices?symbol=${item.symbol}&type=${item.assetType.toLowerCase()}`
          );
          if (response.ok) {
            const priceData = await response.json();
            return {
              ...item,
              currentPrice: priceData.price,
              change: priceData.change,
              changePercent: priceData.changePercent,
            };
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${item.symbol}:`, error);
        }
        return item;
      })
    );
    setWatchlist(updatedItems);
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    await fetchPricesForWatchlist(watchlist);
    setRefreshing(false);
  };

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      fetchWatchlist();
    }
  }, [session]);

  const searchAsset = async () => {
    if (!searchSymbol.trim()) return;

    setSearching(true);
    setSearchResults(null);

    try {
      // Try to fetch price data for the symbol
      const stockRes = await fetch(
        `/api/prices?symbol=${searchSymbol.toUpperCase()}&type=stock`
      );
      const cryptoRes = await fetch(
        `/api/prices?symbol=${searchSymbol.toUpperCase()}&type=crypto`
      );

      if (stockRes.ok) {
        const data = await stockRes.json();
        setSearchResults({ ...data, assetType: "STOCK" });
      } else if (cryptoRes.ok) {
        const data = await cryptoRes.json();
        setSearchResults({ ...data, assetType: "CRYPTO" });
      } else {
        setSearchResults({ error: "Asset not found" });
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({ error: "Failed to search" });
    } finally {
      setSearching(false);
    }
  };

  const addToWatchlist = async () => {
    if (!searchResults || searchResults.error) return;

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: searchResults.symbol,
          name: searchResults.name,
          assetType: searchResults.assetType,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setSearchSymbol("");
        setSearchResults(null);
        await fetchWatchlist();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add to watchlist");
      }
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      alert("Failed to add to watchlist");
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      const response = await fetch(`/api/watchlist?symbol=${symbol}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWatchlist(watchlist.filter((item) => item.symbol !== symbol));
      }
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    }
  };

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Watchlist
            </h2>
            <p className="text-text-secondary">
              Track your favorite assets with real-time prices
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshPrices}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary hover:border-accent-gold transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-accent-gold text-background-primary rounded-lg hover:bg-accent-gold/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Asset
            </button>
          </div>
        </div>

        {/* Watchlist Grid */}
        {watchlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent-gold/20 flex items-center justify-center">
                      <Star className="w-6 h-6 text-accent-gold fill-accent-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        {item.symbol}
                      </h3>
                      <p className="text-sm text-text-secondary">{item.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(item.symbol)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent-red/20 rounded"
                  >
                    <X className="w-5 h-5 text-accent-red" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">
                      Current Price
                    </div>
                    <div className="text-2xl font-bold text-text-primary">
                      {item.currentPrice !== undefined ? (
                        `$${item.currentPrice.toLocaleString()}`
                      ) : (
                        <span className="text-text-secondary text-base">
                          Loading...
                        </span>
                      )}
                    </div>
                  </div>

                  {item.changePercent !== undefined && (
                    <div className="flex items-center gap-2">
                      {item.changePercent >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-accent-green" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-accent-red" />
                      )}
                      <span
                        className={`font-medium ${
                          item.changePercent >= 0
                            ? "text-accent-green"
                            : "text-accent-red"
                        }`}
                      >
                        {item.changePercent >= 0 ? "+" : ""}
                        {item.changePercent.toFixed(2)}%
                      </span>
                      <span className="text-sm text-text-secondary">
                        {item.change !== undefined
                          ? `(${item.change >= 0 ? "+" : ""}$${item.change.toFixed(
                              2
                            )})`
                          : ""}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.assetType === "CRYPTO"
                          ? "bg-accent-blue/20 text-accent-blue"
                          : "bg-accent-green/20 text-accent-green"
                      }`}
                    >
                      {item.assetType}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-background-secondary border border-border rounded-xl p-12 text-center">
            <Star className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No Assets in Watchlist
            </h3>
            <p className="text-text-secondary mb-6">
              Add assets to track their prices in real-time
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-background-primary rounded-lg hover:bg-accent-gold/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Asset
            </button>
          </div>
        )}

        {/* Add Asset Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background-secondary border border-border rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary">
                  Add to Watchlist
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchSymbol("");
                    setSearchResults(null);
                  }}
                  className="p-1 hover:bg-background-primary rounded"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Asset Symbol (e.g., AAPL, BTC, ETH)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchSymbol}
                      onChange={(e) =>
                        setSearchSymbol(e.target.value.toUpperCase())
                      }
                      onKeyPress={(e) => e.key === "Enter" && searchAsset()}
                      placeholder="Enter symbol..."
                      className="flex-1 px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
                    />
                    <button
                      onClick={searchAsset}
                      disabled={searching || !searchSymbol.trim()}
                      className="px-6 py-3 bg-accent-gold text-background-primary rounded-lg hover:bg-accent-gold/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {searching ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {searchResults && (
                  <div className="p-4 bg-background-primary border border-border rounded-lg">
                    {searchResults.error ? (
                      <div className="text-center text-accent-red">
                        {searchResults.error}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-bold text-text-primary">
                              {searchResults.name}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {searchResults.symbol}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              searchResults.assetType === "CRYPTO"
                                ? "bg-accent-blue/20 text-accent-blue"
                                : "bg-accent-green/20 text-accent-green"
                            }`}
                          >
                            {searchResults.assetType}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-text-primary mb-2">
                          ${searchResults.price.toLocaleString()}
                        </div>
                        <div
                          className={`text-sm font-medium ${
                            searchResults.changePercent >= 0
                              ? "text-accent-green"
                              : "text-accent-red"
                          }`}
                        >
                          {searchResults.changePercent >= 0 ? "+" : ""}
                          {searchResults.changePercent.toFixed(2)}%
                        </div>
                        <button
                          onClick={addToWatchlist}
                          className="w-full mt-4 px-4 py-3 bg-accent-gold text-background-primary rounded-lg hover:bg-accent-gold/90 transition-colors font-medium"
                        >
                          Add to Watchlist
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
