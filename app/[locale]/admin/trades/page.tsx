"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Plus,
  X,
  Edit2,
  Trash2,
  RefreshCw,
  DollarSign,
} from "lucide-react";

// Predefined assets list
const CRYPTO_ASSETS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "BNB", name: "Binance Coin" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "XLM", name: "Stellar" },
  { symbol: "ATOM", name: "Cosmos" },
];

const STOCK_ASSETS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "WMT", name: "Walmart Inc." },
  { symbol: "PG", name: "Procter & Gamble" },
  { symbol: "MA", name: "Mastercard Inc." },
  { symbol: "UNH", name: "UnitedHealth Group" },
  { symbol: "HD", name: "Home Depot Inc." },
];

const COMMODITY_ASSETS = [
  { symbol: "GOLD", name: "Gold" },
  { symbol: "SILVER", name: "Silver" },
  { symbol: "OIL", name: "Crude Oil" },
  { symbol: "NATGAS", name: "Natural Gas" },
  { symbol: "COPPER", name: "Copper" },
  { symbol: "PLATINUM", name: "Platinum" },
];

interface Trade {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tradeType: "BUY" | "SELL";
  assetType: "CRYPTO" | "STOCK" | "COMMODITY";
  symbol: string;
  assetName: string;
  quantity: number;
  pricePerUnit: number;
  totalValue: number;
  adminNote: string | null;
  executedBy: string | null;
  executedAt: string;
  createdAt: string;
}

export default function AdminTradesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAssetType, setFilterAssetType] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Price fetching state
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [editCurrentPrice, setEditCurrentPrice] = useState<number | null>(null);
  const [editPriceLoading, setEditPriceLoading] = useState(false);

  // Input mode: "quantity" means user enters quantity, "usd" means user enters USD amount
  const [inputMode, setInputMode] = useState<"quantity" | "usd">("quantity");
  const [usdAmount, setUsdAmount] = useState("");
  const [editInputMode, setEditInputMode] = useState<"quantity" | "usd">("quantity");
  const [editUsdAmount, setEditUsdAmount] = useState("");

  const [newTrade, setNewTrade] = useState({
    userId: "",
    tradeType: "BUY" as "BUY" | "SELL",
    assetType: "CRYPTO" as "CRYPTO" | "STOCK" | "COMMODITY",
    symbol: "",
    assetName: "",
    quantity: "",
    pricePerUnit: "",
    adminNote: "",
  });

  const [editTrade, setEditTrade] = useState({
    id: "",
    userId: "",
    tradeType: "BUY" as "BUY" | "SELL",
    assetType: "CRYPTO" as "CRYPTO" | "STOCK" | "COMMODITY",
    symbol: "",
    assetName: "",
    quantity: "",
    pricePerUnit: "",
    adminNote: "",
  });

  // Get assets list based on selected type
  const getAssetsList = (assetType: string) => {
    switch (assetType) {
      case "CRYPTO":
        return CRYPTO_ASSETS;
      case "STOCK":
        return STOCK_ASSETS;
      case "COMMODITY":
        return COMMODITY_ASSETS;
      default:
        return [];
    }
  };

  // Fetch current price for a symbol
  const fetchPrice = useCallback(async (symbol: string, assetType: string) => {
    if (!symbol) return null;

    try {
      const type = assetType.toLowerCase();
      const response = await fetch(`/api/prices?symbol=${symbol}&type=${type}`);
      if (response.ok) {
        const data = await response.json();
        return data.price;
      }
    } catch (error) {
      console.error("Failed to fetch price:", error);
    }
    return null;
  }, []);

  // Handle asset selection for new trade
  const handleAssetSelect = async (symbol: string) => {
    const assets = getAssetsList(newTrade.assetType);
    const asset = assets.find(a => a.symbol === symbol);

    if (asset) {
      setNewTrade(prev => ({
        ...prev,
        symbol: asset.symbol,
        assetName: asset.name,
      }));

      // Fetch current price
      setPriceLoading(true);
      const price = await fetchPrice(asset.symbol, newTrade.assetType);
      if (price) {
        setCurrentPrice(price);
        setNewTrade(prev => ({
          ...prev,
          pricePerUnit: price.toString(),
        }));
      }
      setPriceLoading(false);
    }
  };

  // Handle asset selection for edit trade
  const handleEditAssetSelect = async (symbol: string) => {
    const assets = getAssetsList(editTrade.assetType);
    const asset = assets.find(a => a.symbol === symbol);

    if (asset) {
      setEditTrade(prev => ({
        ...prev,
        symbol: asset.symbol,
        assetName: asset.name,
      }));

      // Fetch current price
      setEditPriceLoading(true);
      const price = await fetchPrice(asset.symbol, editTrade.assetType);
      if (price) {
        setEditCurrentPrice(price);
        setEditTrade(prev => ({
          ...prev,
          pricePerUnit: price.toString(),
        }));
      }
      setEditPriceLoading(false);
    }
  };

  // Refresh price for new trade
  const refreshPrice = async () => {
    if (!newTrade.symbol) return;

    setPriceLoading(true);
    const price = await fetchPrice(newTrade.symbol, newTrade.assetType);
    if (price) {
      setCurrentPrice(price);
      setNewTrade(prev => ({
        ...prev,
        pricePerUnit: price.toString(),
      }));
      // Recalculate based on input mode
      if (inputMode === "usd" && usdAmount) {
        const qty = parseFloat(usdAmount) / price;
        setNewTrade(prev => ({ ...prev, quantity: qty.toFixed(8) }));
      }
    }
    setPriceLoading(false);
  };

  // Refresh price for edit trade
  const refreshEditPrice = async () => {
    if (!editTrade.symbol) return;

    setEditPriceLoading(true);
    const price = await fetchPrice(editTrade.symbol, editTrade.assetType);
    if (price) {
      setEditCurrentPrice(price);
      setEditTrade(prev => ({
        ...prev,
        pricePerUnit: price.toString(),
      }));
      // Recalculate based on input mode
      if (editInputMode === "usd" && editUsdAmount) {
        const qty = parseFloat(editUsdAmount) / price;
        setEditTrade(prev => ({ ...prev, quantity: qty.toFixed(8) }));
      }
    }
    setEditPriceLoading(false);
  };

  // Handle quantity change - calculate USD
  const handleQuantityChange = (value: string) => {
    setNewTrade(prev => ({ ...prev, quantity: value }));
    if (value && currentPrice) {
      const total = parseFloat(value) * currentPrice;
      setUsdAmount(total.toFixed(2));
    } else {
      setUsdAmount("");
    }
  };

  // Handle USD amount change - calculate quantity
  const handleUsdChange = (value: string) => {
    setUsdAmount(value);
    if (value && currentPrice) {
      const qty = parseFloat(value) / currentPrice;
      setNewTrade(prev => ({ ...prev, quantity: qty.toFixed(8) }));
    } else {
      setNewTrade(prev => ({ ...prev, quantity: "" }));
    }
  };

  // Handle quantity change for edit - calculate USD
  const handleEditQuantityChange = (value: string) => {
    setEditTrade(prev => ({ ...prev, quantity: value }));
    if (value && editCurrentPrice) {
      const total = parseFloat(value) * editCurrentPrice;
      setEditUsdAmount(total.toFixed(2));
    } else {
      setEditUsdAmount("");
    }
  };

  // Handle USD amount change for edit - calculate quantity
  const handleEditUsdChange = (value: string) => {
    setEditUsdAmount(value);
    if (value && editCurrentPrice) {
      const qty = parseFloat(value) / editCurrentPrice;
      setEditTrade(prev => ({ ...prev, quantity: qty.toFixed(8) }));
    } else {
      setEditTrade(prev => ({ ...prev, quantity: "" }));
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tradesRes, usersRes] = await Promise.all([
          fetch("/api/admin/trades"),
          fetch("/api/admin/users"),
        ]);

        if (tradesRes.ok) {
          const data = await tradesRes.json();
          setTrades(data.trades);
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users.filter((u: any) => u.role === "CUSTOMER"));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchData();
    }
  }, [session]);

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTrade,
          quantity: parseFloat(newTrade.quantity),
          pricePerUnit: currentPrice || parseFloat(newTrade.pricePerUnit),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTrades([data.trade, ...trades]);
        setNewTrade({
          userId: "",
          tradeType: "BUY",
          assetType: "CRYPTO",
          symbol: "",
          assetName: "",
          quantity: "",
          pricePerUnit: "",
          adminNote: "",
        });
        setCurrentPrice(null);
        setUsdAmount("");
        setInputMode("quantity");
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Failed to add trade:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = async (trade: Trade) => {
    setEditTrade({
      id: trade.id,
      userId: trade.user.id,
      tradeType: trade.tradeType,
      assetType: trade.assetType as "CRYPTO" | "STOCK" | "COMMODITY",
      symbol: trade.symbol,
      assetName: trade.assetName,
      quantity: trade.quantity.toString(),
      pricePerUnit: trade.pricePerUnit.toString(),
      adminNote: trade.adminNote || "",
    });
    setEditInputMode("quantity");
    setEditUsdAmount((trade.quantity * trade.pricePerUnit).toFixed(2));
    setShowEditModal(true);

    // Fetch current price for the asset
    setEditPriceLoading(true);
    const price = await fetchPrice(trade.symbol, trade.assetType);
    if (price) {
      setEditCurrentPrice(price);
    } else {
      // Fallback to trade's stored price
      setEditCurrentPrice(trade.pricePerUnit);
    }
    setEditPriceLoading(false);
  };

  const handleEditTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await fetch(`/api/admin/trades/${editTrade.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editTrade,
          quantity: parseFloat(editTrade.quantity),
          pricePerUnit: editCurrentPrice || parseFloat(editTrade.pricePerUnit),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTrades(trades.map((t) => (t.id === editTrade.id ? data.trade : t)));
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Failed to edit trade:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (tradeId: string) => {
    setTradeToDelete(tradeId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTrade = async () => {
    if (!tradeToDelete) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/admin/trades/${tradeToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTrades(trades.filter((t) => t.id !== tradeToDelete));
        setShowDeleteConfirm(false);
        setTradeToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete trade:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      searchTerm === "" ||
      trade.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.assetName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" || trade.tradeType === filterType.toUpperCase();

    const matchesAssetType =
      filterAssetType === "all" ||
      trade.assetType === filterAssetType.toUpperCase();

    return matchesSearch && matchesType && matchesAssetType;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-primary p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Trade Management
            </h1>
            <p className="text-text-secondary">
              Add and manage user trades (buy/sell orders)
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Trade
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">
              Total Trades
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {trades.length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">Buy Orders</div>
            <div className="text-2xl font-bold text-accent-green">
              {trades.filter((t) => t.tradeType === "BUY").length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">Sell Orders</div>
            <div className="text-2xl font-bold text-accent-red">
              {trades.filter((t) => t.tradeType === "SELL").length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">
              Total Volume
            </div>
            <div className="text-2xl font-bold text-text-primary">
              $
              {trades
                .reduce((sum, t) => sum + t.totalValue, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary border border-border rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by user or asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
            />
          </div>

          {/* Trade Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="buy">Buy Orders</option>
              <option value="sell">Sell Orders</option>
            </select>
          </div>

          {/* Asset Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <select
              value={filterAssetType}
              onChange={(e) => setFilterAssetType(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Assets</option>
              <option value="crypto">Crypto</option>
              <option value="stock">Stocks</option>
              <option value="commodity">Commodities</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-primary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  Asset
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                  Quantity
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                  Price/Unit
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                  Total Value
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTrades.length > 0 ? (
                filteredTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="hover:bg-background-primary transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-text-primary font-medium">
                          {trade.user.firstName} {trade.user.lastName}
                        </div>
                        <div className="text-text-secondary text-sm">
                          {trade.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {trade.tradeType === "BUY" ? (
                          <TrendingUp className="w-5 h-5 text-accent-green" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-accent-red" />
                        )}
                        <span
                          className={`font-medium ${
                            trade.tradeType === "BUY"
                              ? "text-accent-green"
                              : "text-accent-red"
                          }`}
                        >
                          {trade.tradeType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-text-primary font-medium">
                          {trade.symbol}
                        </div>
                        <div className="text-text-secondary text-sm">
                          {trade.assetName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-text-primary">
                      {trade.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-text-primary">
                      ${trade.pricePerUnit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-text-primary">
                      ${trade.totalValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-sm">
                      {new Date(trade.executedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(trade)}
                          className="p-2 text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(trade.id)}
                          className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-text-secondary"
                  >
                    No trades found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text-primary">
                Add New Trade
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTrade} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* User Selection */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Customer
                  </label>
                  <select
                    value={newTrade.userId}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, userId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="">Select a customer</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trade Type */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Trade Type
                  </label>
                  <select
                    value={newTrade.tradeType}
                    onChange={(e) =>
                      setNewTrade({
                        ...newTrade,
                        tradeType: e.target.value as "BUY" | "SELL",
                      })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>

                {/* Asset Type */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Asset Type
                  </label>
                  <select
                    value={newTrade.assetType}
                    onChange={(e) => {
                      setNewTrade({
                        ...newTrade,
                        assetType: e.target.value as "CRYPTO" | "STOCK" | "COMMODITY",
                        symbol: "",
                        assetName: "",
                        quantity: "",
                        pricePerUnit: "",
                      });
                      setCurrentPrice(null);
                      setUsdAmount("");
                    }}
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="CRYPTO">Crypto</option>
                    <option value="STOCK">Stock</option>
                    <option value="COMMODITY">Commodity</option>
                  </select>
                </div>

                {/* Asset Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Select Asset
                  </label>
                  <select
                    value={newTrade.symbol}
                    onChange={(e) => handleAssetSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="">Select an asset</option>
                    {getAssetsList(newTrade.assetType).map((asset) => (
                      <option key={asset.symbol} value={asset.symbol}>
                        {asset.symbol} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Price Display */}
                {newTrade.symbol && (
                  <div className="col-span-2">
                    <div className="bg-background-primary border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-text-secondary text-sm mb-1">
                            Current Market Price
                          </div>
                          <div className="text-xl font-bold text-accent-gold">
                            {priceLoading ? (
                              <span className="text-text-secondary">Loading...</span>
                            ) : currentPrice ? (
                              `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
                            ) : (
                              <span className="text-text-secondary">Price unavailable</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={refreshPrice}
                          disabled={priceLoading}
                          className="p-2 text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Refresh price"
                        >
                          <RefreshCw className={`w-5 h-5 ${priceLoading ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Mode Toggle */}
                {currentPrice && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Enter by
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setInputMode("quantity")}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          inputMode === "quantity"
                            ? "bg-accent-gold text-background-primary"
                            : "bg-background-primary border border-border text-text-primary hover:border-accent-gold"
                        }`}
                      >
                        Quantity ({newTrade.symbol})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode("usd")}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          inputMode === "usd"
                            ? "bg-accent-gold text-background-primary"
                            : "bg-background-primary border border-border text-text-primary hover:border-accent-gold"
                        }`}
                      >
                        USD Amount
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity or USD Input based on mode */}
                {currentPrice && inputMode === "quantity" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Quantity ({newTrade.symbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newTrade.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                      placeholder={`Enter ${newTrade.symbol} amount`}
                      required
                    />
                    {usdAmount && (
                      <div className="mt-2 text-text-secondary text-sm">
                        = ${parseFloat(usdAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                    )}
                  </div>
                )}

                {currentPrice && inputMode === "usd" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      USD Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                      <input
                        type="number"
                        step="any"
                        value={usdAmount}
                        onChange={(e) => handleUsdChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                        placeholder="Enter USD amount"
                        required
                      />
                    </div>
                    {newTrade.quantity && (
                      <div className="mt-2 text-text-secondary text-sm">
                        = {parseFloat(newTrade.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {newTrade.symbol}
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden price field - auto-filled from market price */}
                <input
                  type="hidden"
                  value={newTrade.pricePerUnit}
                />

                {/* Admin Note */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Admin Note (Optional)
                  </label>
                  <textarea
                    value={newTrade.adminNote}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, adminNote: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors resize-none"
                    rows={3}
                    placeholder="Add any notes about this trade..."
                  />
                </div>

                {/* Total Value Display */}
                {newTrade.quantity && currentPrice && (
                  <div className="col-span-2 bg-accent-gold/10 border border-accent-gold/30 rounded-lg p-4">
                    <div className="text-text-secondary text-sm mb-1">
                      Trade Summary
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-text-secondary text-xs">Quantity</div>
                        <div className="text-lg font-semibold text-text-primary">
                          {parseFloat(newTrade.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {newTrade.symbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-text-secondary text-xs">Price per Unit</div>
                        <div className="text-lg font-semibold text-text-primary">
                          ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-accent-gold/30">
                      <div className="text-text-secondary text-xs">Total Value</div>
                      <div className="text-2xl font-bold text-accent-gold">
                        ${(parseFloat(newTrade.quantity) * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-background-primary border border-border text-text-primary rounded-lg font-medium hover:bg-background-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Adding..." : "Add Trade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text-primary">
                Edit Trade
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditTrade} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* User Selection */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Customer
                  </label>
                  <select
                    value={editTrade.userId}
                    onChange={(e) =>
                      setEditTrade({ ...editTrade, userId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="">Select a customer</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trade Type */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Trade Type
                  </label>
                  <select
                    value={editTrade.tradeType}
                    onChange={(e) =>
                      setEditTrade({
                        ...editTrade,
                        tradeType: e.target.value as "BUY" | "SELL",
                      })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>

                {/* Asset Type */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Asset Type
                  </label>
                  <select
                    value={editTrade.assetType}
                    onChange={(e) => {
                      setEditTrade({
                        ...editTrade,
                        assetType: e.target.value as "CRYPTO" | "STOCK" | "COMMODITY",
                        symbol: "",
                        assetName: "",
                        quantity: "",
                        pricePerUnit: "",
                      });
                      setEditCurrentPrice(null);
                      setEditUsdAmount("");
                    }}
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="CRYPTO">Crypto</option>
                    <option value="STOCK">Stock</option>
                    <option value="COMMODITY">Commodity</option>
                  </select>
                </div>

                {/* Asset Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Select Asset
                  </label>
                  <select
                    value={editTrade.symbol}
                    onChange={(e) => handleEditAssetSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="">Select an asset</option>
                    {getAssetsList(editTrade.assetType).map((asset) => (
                      <option key={asset.symbol} value={asset.symbol}>
                        {asset.symbol} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Price Display */}
                {editTrade.symbol && (
                  <div className="col-span-2">
                    <div className="bg-background-primary border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-text-secondary text-sm mb-1">
                            Current Market Price
                          </div>
                          <div className="text-xl font-bold text-accent-gold">
                            {editPriceLoading ? (
                              <span className="text-text-secondary">Loading...</span>
                            ) : editCurrentPrice ? (
                              `$${editCurrentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
                            ) : (
                              <span className="text-text-secondary">Price unavailable</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={refreshEditPrice}
                          disabled={editPriceLoading}
                          className="p-2 text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Refresh price"
                        >
                          <RefreshCw className={`w-5 h-5 ${editPriceLoading ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Mode Toggle */}
                {editCurrentPrice && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Enter by
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditInputMode("quantity")}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          editInputMode === "quantity"
                            ? "bg-accent-gold text-background-primary"
                            : "bg-background-primary border border-border text-text-primary hover:border-accent-gold"
                        }`}
                      >
                        Quantity ({editTrade.symbol})
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditInputMode("usd")}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          editInputMode === "usd"
                            ? "bg-accent-gold text-background-primary"
                            : "bg-background-primary border border-border text-text-primary hover:border-accent-gold"
                        }`}
                      >
                        USD Amount
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity or USD Input based on mode */}
                {editCurrentPrice && editInputMode === "quantity" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Quantity ({editTrade.symbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editTrade.quantity}
                      onChange={(e) => handleEditQuantityChange(e.target.value)}
                      className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                      placeholder={`Enter ${editTrade.symbol} amount`}
                      required
                    />
                    {editUsdAmount && (
                      <div className="mt-2 text-text-secondary text-sm">
                        = ${parseFloat(editUsdAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                    )}
                  </div>
                )}

                {editCurrentPrice && editInputMode === "usd" && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      USD Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                      <input
                        type="number"
                        step="any"
                        value={editUsdAmount}
                        onChange={(e) => handleEditUsdChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                        placeholder="Enter USD amount"
                        required
                      />
                    </div>
                    {editTrade.quantity && (
                      <div className="mt-2 text-text-secondary text-sm">
                        = {parseFloat(editTrade.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {editTrade.symbol}
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden price field */}
                <input type="hidden" value={editTrade.pricePerUnit} />

                {/* Trade Summary */}
                {editTrade.quantity && editCurrentPrice && (
                  <div className="col-span-2 bg-accent-gold/10 border border-accent-gold/30 rounded-lg p-4">
                    <div className="text-text-secondary text-sm mb-1">
                      Trade Summary
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-text-secondary text-xs">Quantity</div>
                        <div className="text-lg font-semibold text-text-primary">
                          {parseFloat(editTrade.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {editTrade.symbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-text-secondary text-xs">Price per Unit</div>
                        <div className="text-lg font-semibold text-text-primary">
                          ${editCurrentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-accent-gold/30">
                      <div className="text-text-secondary text-xs">Total Value</div>
                      <div className="text-2xl font-bold text-accent-gold">
                        ${(parseFloat(editTrade.quantity) * editCurrentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Note */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Admin Note (Optional)
                  </label>
                  <textarea
                    value={editTrade.adminNote}
                    onChange={(e) =>
                      setEditTrade({ ...editTrade, adminNote: e.target.value })
                    }
                    rows={3}
                    placeholder="Add any internal notes..."
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-background-primary border border-border text-text-primary rounded-lg font-medium hover:border-accent-gold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-text-primary mb-4">
                Delete Trade
              </h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to delete this trade? This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setTradeToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-background-primary border border-border text-text-primary rounded-lg font-medium hover:border-accent-gold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTrade}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-accent-red text-white rounded-lg font-medium hover:bg-accent-red/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
