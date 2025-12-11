"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  ChevronLeft,
  ChevronDown,
  X,
  RefreshCw,
  SlidersHorizontal,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Trade {
  id: string;
  tradeType: "BUY" | "SELL";
  symbol: string;
  assetName: string;
  assetType: "CRYPTO" | "STOCK";
  quantity: number;
  pricePerUnit: number;
  totalValue: number;
  adminNote?: string;
  executedAt: string;
}

// Asset logos mapping
const ASSET_LOGOS: { [key: string]: string } = {
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
  XRP: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
  ADA: "https://cryptologos.cc/logos/cardano-ada-logo.png",
  DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
  DOT: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
  MATIC: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  LINK: "https://cryptologos.cc/logos/chainlink-link-logo.png",
  UNI: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
  AVAX: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  LTC: "https://cryptologos.cc/logos/litecoin-ltc-logo.png",
  AAPL: "https://logo.clearbit.com/apple.com",
  GOOGL: "https://logo.clearbit.com/google.com",
  MSFT: "https://logo.clearbit.com/microsoft.com",
  AMZN: "https://logo.clearbit.com/amazon.com",
  TSLA: "https://logo.clearbit.com/tesla.com",
  META: "https://logo.clearbit.com/meta.com",
  NVDA: "https://logo.clearbit.com/nvidia.com",
};

// Skeleton Loading Component
function TradeSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Mobile Header Skeleton */}
      <div className="lg:hidden">
        <div className="h-14 bg-[#1A1A1A]" />
      </div>

      {/* Stats Skeleton */}
      <div className="flex gap-3 overflow-x-auto px-4 py-4 lg:px-8 hide-scrollbar">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-[120px] lg:w-auto lg:flex-1">
            <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
              <div className="h-3 w-12 bg-[#262626] rounded mb-3" />
              <div className="h-7 w-16 bg-[#262626] rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Skeleton */}
      <div className="px-4 lg:px-8 pb-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-20 bg-[#262626] rounded-full" />
          ))}
        </div>
      </div>

      {/* Trade List Skeleton */}
      <div className="px-4 lg:px-8 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#262626] rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-20 bg-[#262626] rounded mb-2" />
                <div className="h-3 w-28 bg-[#262626] rounded" />
              </div>
              <div className="text-right">
                <div className="h-5 w-16 bg-[#262626] rounded mb-2" />
                <div className="h-3 w-12 bg-[#262626] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Filter Modal Component
function FilterModal({
  isOpen,
  onClose,
  filterType,
  setFilterType,
}: {
  isOpen: boolean;
  onClose: () => void;
  filterType: string;
  setFilterType: (v: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Filter Trades</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Type Filter */}
        <div className="mb-8">
          <label className="text-sm text-[#808080] mb-3 block">Trade Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'all', label: 'All Trades' },
              { value: 'buy', label: 'Buy Orders' },
              { value: 'sell', label: 'Sell Orders' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterType(option.value)}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  filterType === option.value
                    ? 'bg-[#00FF87] text-black'
                    : 'bg-[#1A1A1A] text-white border border-[#262626]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-[#00FF87] text-black font-semibold rounded-2xl"
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
}

// Trade Detail Modal
function TradeDetailModal({
  trade,
  onClose,
}: {
  trade: Trade | null;
  onClose: () => void;
}) {
  if (!trade) return null;

  const isBuy = trade.tradeType === "BUY";
  const symbol = trade.symbol || trade.assetName?.split(' ')[0] || '??';
  const logoUrl = ASSET_LOGOS[symbol.toUpperCase()];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-[#404040] rounded-full mx-auto mb-6" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#1A1A1A] border border-[#262626]">
            {logoUrl ? (
              <img src={logoUrl} alt={symbol} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-[#00FF87]">{symbol.substring(0, 2)}</span>
            )}
          </div>
          <p className="text-[#808080] text-sm mb-1">{symbol}</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isBuy ? 'bg-[#00FF87]/10 text-[#00FF87]' : 'bg-[#FF4444]/10 text-[#FF4444]'
            }`}>
              {isBuy ? 'BUY' : 'SELL'}
            </span>
          </div>
          <p className="text-3xl font-bold text-white">
            ${Number(trade.totalValue || 0).toLocaleString()}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl mx-auto w-fit mb-8 bg-[#00FF87]/10">
          <CheckCircle2 className="w-5 h-5 text-[#00FF87]" />
          <span className="font-medium text-[#00FF87]">Completed</span>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Trade ID</span>
            <span className="text-white font-mono text-sm">{trade.id.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Asset</span>
            <span className="text-white">{trade.assetName || symbol}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Type</span>
            <span className="text-white">{trade.assetType || 'CRYPTO'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Quantity</span>
            <span className="text-white font-mono">{Number(trade.quantity || 0).toFixed(6)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Price per Unit</span>
            <span className="text-white">${Number(trade.pricePerUnit || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Date</span>
            <span className="text-white">
              {trade.executedAt ? new Date(trade.executedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Time</span>
            <span className="text-white">
              {trade.executedAt ? new Date(trade.executedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }) : 'N/A'}
            </span>
          </div>
          {trade.adminNote && (
            <div className="py-3">
              <span className="text-[#808080] block mb-2">Note</span>
              <p className="text-white bg-[#1A1A1A] p-3 rounded-xl text-sm">{trade.adminNote}</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-[#1A1A1A] text-white font-semibold rounded-2xl border border-[#262626]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

const exportTradesToPDF = (trades: Trade[], userName: string) => {
  const doc = new jsPDF();

  // Add header
  doc.setFontSize(20);
  doc.text("CoinShares - Trade History", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Account: ${userName}`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`, 14, 38);

  // Prepare table data
  const tableData = trades.map(trade => [
    trade.tradeType || "N/A",
    trade.symbol || trade.assetName || "N/A",
    trade.executedAt ? new Date(trade.executedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) : "N/A",
    Number(trade.quantity || 0).toFixed(4),
    `$${Number(trade.pricePerUnit || 0).toLocaleString()}`,
    `$${Number(trade.totalValue || 0).toLocaleString()}`,
    "COMPLETED",
  ]);

  // Add table
  autoTable(doc, {
    head: [["Type", "Asset", "Date", "Quantity", "Price", "Total", "Status"]],
    body: tableData,
    startY: 45,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [0, 255, 135], textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY || 45;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Trades: ${trades.length}`, 14, finalY + 15);
  doc.text(`Buy Orders: ${trades.filter(t => t.tradeType === "BUY").length}`, 14, finalY + 22);
  doc.text(`Sell Orders: ${trades.filter(t => t.tradeType === "SELL").length}`, 14, finalY + 29);

  // Save PDF
  doc.save(`CoinShares-Trades-${new Date().toISOString().split("T")[0]}.pdf`);
};

export default function TradesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("trades");
  const tCommon = useTranslations("common");

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  const fetchTrades = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/trades");
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error("Failed to fetch trades:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      fetchTrades();
    }
  }, [session, fetchTrades]);

  const filteredTrades = (trades || []).filter((trade) => {
    if (!trade || !trade.id) return false;

    const tradeType = trade.tradeType || "";
    const symbol = trade.symbol || trade.assetName || "";

    const matchesType =
      filterType === "all" ||
      (filterType === "buy" && tradeType === "BUY") ||
      (filterType === "sell" && tradeType === "SELL");

    const matchesSearch =
      searchTerm === "" ||
      symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trade.id || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  // Calculate stats
  const totalTrades = (trades || []).length;
  const buyOrders = (trades || []).filter((t) => t?.tradeType === "BUY").length;
  const sellOrders = (trades || []).filter((t) => t?.tradeType === "SELL").length;
  const totalVolume = (trades || []).reduce((sum, t) => sum + Number(t?.totalValue || 0), 0);

  // Get relative time
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group trades by date
  const groupedTrades = filteredTrades.reduce((groups: { [key: string]: Trade[] }, trade) => {
    const date = new Date(trade.executedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(trade);
    return groups;
  }, {});

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <TradeSkeleton />
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  const activeFiltersCount = filterType !== 'all' ? 1 : 0;

  return (
    <DashboardLayout>
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="lg:hidden min-h-screen bg-[#0A0A0A] overflow-x-hidden max-w-full pb-24">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">Trade History</h1>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Search Bar (Expandable) */}
          {showSearch && (
            <div className="px-4 pb-3 animate-slide-down">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#808080]" />
                <input
                  type="text"
                  placeholder="Search trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-12 pr-12 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-white placeholder-[#808080] focus:outline-none focus:border-[#00FF87] transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-[#808080]" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards - Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto px-4 py-4 hide-scrollbar snap-x snap-mandatory">
          {/* Total Trades */}
          <div className="flex-shrink-0 w-[120px] snap-start">
            <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-[#00FF87]" />
                <span className="text-xs text-[#808080]">Total</span>
              </div>
              <p className="text-xl font-bold text-white">{totalTrades}</p>
            </div>
          </div>

          {/* Buy Orders */}
          <div className="flex-shrink-0 w-[120px] snap-start">
            <div className="bg-gradient-to-br from-[#00FF87]/10 to-[#00FF87]/5 rounded-2xl p-4 border border-[#00FF87]/20">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-[#00FF87]" />
                <span className="text-xs text-[#808080]">Buy</span>
              </div>
              <p className="text-xl font-bold text-[#00FF87]">{buyOrders}</p>
            </div>
          </div>

          {/* Sell Orders */}
          <div className="flex-shrink-0 w-[120px] snap-start">
            <div className="bg-gradient-to-br from-[#FF4444]/10 to-[#FF4444]/5 rounded-2xl p-4 border border-[#FF4444]/20">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-[#FF4444]" />
                <span className="text-xs text-[#808080]">Sell</span>
              </div>
              <p className="text-xl font-bold text-[#FF4444]">{sellOrders}</p>
            </div>
          </div>

          {/* Volume */}
          <div className="flex-shrink-0 w-[140px] snap-start">
            <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#00FF87]" />
                <span className="text-xs text-[#808080]">Volume</span>
              </div>
              <p className="text-xl font-bold text-white">
                ${totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                activeFiltersCount > 0
                  ? 'bg-[#00FF87]/10 border-[#00FF87] text-[#00FF87]'
                  : 'bg-[#141414] border-[#262626] text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#00FF87] text-black text-xs font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Quick Filter Chips */}
            {[
              { value: 'all', label: 'All' },
              { value: 'buy', label: 'Buy' },
              { value: 'sell', label: 'Sell' },
            ].map((chip) => (
              <button
                key={chip.value}
                onClick={() => setFilterType(chip.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterType === chip.value
                    ? 'bg-[#00FF87] text-black'
                    : 'bg-[#141414] text-[#B3B3B3] border border-[#262626]'
                }`}
              >
                {chip.label}
              </button>
            ))}

            {/* Export Button */}
            <button
              onClick={() => exportTradesToPDF(filteredTrades, session?.user?.name || "User")}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] border border-[#262626] text-white"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">PDF</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchTrades(true)}
              disabled={refreshing}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Trade List */}
        <div className="px-4 pb-24">
          {Object.keys(groupedTrades).length > 0 ? (
            Object.entries(groupedTrades).map(([date, trades]) => (
              <div key={date} className="mb-6">
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-medium text-[#808080]">{date}</h3>
                  <div className="flex-1 h-px bg-[#262626]" />
                </div>

                {/* Trades */}
                <div className="space-y-3">
                  {trades.map((trade) => {
                    const isBuy = trade.tradeType === "BUY";
                    const symbol = trade.symbol || trade.assetName?.split(' ')[0] || '??';
                    const logoUrl = ASSET_LOGOS[symbol.toUpperCase()];

                    return (
                      <button
                        key={trade.id}
                        onClick={() => setSelectedTrade(trade)}
                        className="w-full bg-[#141414] rounded-2xl p-4 border border-[#262626] hover:border-[#404040] transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          {/* Asset Icon */}
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#1A1A1A] border border-[#262626]">
                            {logoUrl ? (
                              <img src={logoUrl} alt={symbol} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-[#00FF87]">{symbol.substring(0, 2)}</span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{symbol}</p>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                isBuy
                                  ? 'bg-[#00FF87]/10 text-[#00FF87]'
                                  : 'bg-[#FF4444]/10 text-[#FF4444]'
                              }`}>
                                {isBuy ? 'BUY' : 'SELL'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#808080]">
                                {Number(trade.quantity || 0).toFixed(4)} units
                              </span>
                              <span className="text-xs text-[#808080]">•</span>
                              <span className="text-xs text-[#808080]">
                                {getRelativeTime(trade.executedAt)}
                              </span>
                            </div>
                          </div>

                          {/* Value */}
                          <div className="text-right flex-shrink-0">
                            <p className={`text-lg font-bold ${isBuy ? 'text-[#00FF87]' : 'text-[#FF4444]'}`}>
                              ${Number(trade.totalValue || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-[#808080] mt-1">
                              @${Number(trade.pricePerUnit || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#141414] flex items-center justify-center mb-4">
                <TrendingUp className="w-10 h-10 text-[#404040]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No trades yet</h3>
              <p className="text-[#808080] text-center text-sm max-w-[250px]">
                {filterType !== 'all' || searchTerm
                  ? 'No trades match your filters'
                  : 'Your trade history will appear here'}
              </p>
              {(filterType !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setSearchTerm('');
                  }}
                  className="mt-4 px-6 py-2 bg-[#00FF87] text-black font-medium rounded-full"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Modal */}
        <FilterModal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filterType={filterType}
          setFilterType={setFilterType}
        />

        {/* Trade Detail Modal */}
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      </div>

      {/* ==================== DESKTOP VIEW ==================== */}
      <div className="hidden lg:block p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {t("title")}
          </h2>
          <p className="text-[#808080]">
            View your complete trading history and performance
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#262626]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#00FF87]/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#00FF87]" />
              </div>
              <span className="text-[#808080] text-sm">Total Trades</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalTrades}</p>
          </div>

          <div className="bg-gradient-to-br from-[#00FF87]/10 to-transparent rounded-2xl p-6 border border-[#00FF87]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#00FF87]/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-[#00FF87]" />
              </div>
              <span className="text-[#808080] text-sm">Buy Orders</span>
            </div>
            <p className="text-2xl font-bold text-[#00FF87]">{buyOrders}</p>
          </div>

          <div className="bg-gradient-to-br from-[#FF4444]/10 to-transparent rounded-2xl p-6 border border-[#FF4444]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#FF4444]/20 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-[#FF4444]" />
              </div>
              <span className="text-[#808080] text-sm">Sell Orders</span>
            </div>
            <p className="text-2xl font-bold text-[#FF4444]">{sellOrders}</p>
          </div>

          <div className="bg-[#141414] rounded-2xl p-6 border border-[#262626]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#00FF87]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#00FF87]" />
              </div>
              <span className="text-[#808080] text-sm">Total Volume</span>
            </div>
            <p className="text-2xl font-bold text-white">${totalVolume.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#808080]" />
              <input
                type="text"
                placeholder="Search by asset or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white placeholder-[#808080] focus:outline-none focus:border-[#00FF87] transition-colors"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white focus:outline-none focus:border-[#00FF87] transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="buy">Buy Orders</option>
                <option value="sell">Sell Orders</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#808080] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#262626] flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Trade History
            </h3>
            <button
              onClick={() => exportTradesToPDF(filteredTrades, session?.user?.name || "User")}
              className="flex items-center gap-2 px-4 py-2 bg-[#00FF87]/10 text-[#00FF87] rounded-xl hover:bg-[#00FF87]/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t("exportPDF")}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A0A0A] border-b border-[#262626]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    {t("type")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    {t("asset")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    {t("date")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                    {t("quantity")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                    {t("price")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                    {t("total")}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                    {t("status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredTrades.length > 0 ? (
                  filteredTrades.map((trade) => {
                    const symbol = trade.symbol || trade.assetName?.split(' ')[0] || '??';
                    const logoUrl = ASSET_LOGOS[symbol.toUpperCase()];

                    return (
                      <tr
                        key={trade.id}
                        className="hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                        onClick={() => setSelectedTrade(trade)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                trade.tradeType === "BUY"
                                  ? "bg-[#00FF87]/10"
                                  : "bg-[#FF4444]/10"
                              }`}
                            >
                              {trade.tradeType === "BUY" ? (
                                <TrendingUp className="w-5 h-5 text-[#00FF87]" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-[#FF4444]" />
                              )}
                            </div>
                            <span
                              className={`font-medium ${
                                trade.tradeType === "BUY"
                                  ? "text-[#00FF87]"
                                  : "text-[#FF4444]"
                              }`}
                            >
                              {t((trade.tradeType || "buy").toLowerCase())}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center overflow-hidden">
                              {logoUrl ? (
                                <img src={logoUrl} alt={symbol} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <span className="text-[#00FF87] font-semibold text-xs">
                                  {symbol.substring(0, 2)}
                                </span>
                              )}
                            </div>
                            <span className="text-white font-medium">
                              {symbol}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#B3B3B3] text-sm">
                          {trade.executedAt ? new Date(trade.executedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right text-white font-mono">
                          {Number(trade.quantity || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-right text-white">
                          ${Number(trade.pricePerUnit || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-white font-semibold">
                          ${Number(trade.totalValue || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#00FF87]/10 text-[#00FF87]">
                            {t("completed")}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-[#808080]"
                    >
                      {t("noTrades")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trade Detail Modal (Desktop) */}
      {selectedTrade && (
        <div className="hidden lg:block">
          <TradeDetailModal
            trade={selectedTrade}
            onClose={() => setSelectedTrade(null)}
          />
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        /* Prevent horizontal scroll on mobile */
        @media (max-width: 1023px) {
          html, body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
}
