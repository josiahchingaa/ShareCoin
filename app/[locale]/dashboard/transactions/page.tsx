"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Search,
  ChevronLeft,
  ChevronDown,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  SlidersHorizontal,
  Home,
  History,
  Settings,
} from "lucide-react";

interface Transaction {
  id: string;
  transactionType: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  createdAt: string;
  processedAt: string | null;
  adminNote: string | null;
  currency: string;
  method: string;
}

// Skeleton Loading Component
function TransactionSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Mobile Header Skeleton */}
      <div className="lg:hidden">
        <div className="h-14 bg-[#1A1A1A]" />
      </div>

      {/* Stats Skeleton */}
      <div className="flex gap-3 overflow-x-auto px-4 py-4 lg:px-8 hide-scrollbar">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[140px] lg:w-auto lg:flex-1">
            <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
              <div className="h-3 w-16 bg-[#262626] rounded mb-3" />
              <div className="h-7 w-24 bg-[#262626] rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Skeleton */}
      <div className="px-4 lg:px-8 pb-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 bg-[#262626] rounded-full" />
          ))}
        </div>
      </div>

      {/* Transaction List Skeleton */}
      <div className="px-4 lg:px-8 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#262626] rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-[#262626] rounded mb-2" />
                <div className="h-3 w-32 bg-[#262626] rounded" />
              </div>
              <div className="text-right">
                <div className="h-5 w-20 bg-[#262626] rounded mb-2" />
                <div className="h-3 w-16 bg-[#262626] rounded" />
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
  filterStatus,
  setFilterStatus,
}: {
  isOpen: boolean;
  onClose: () => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
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
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Type Filter */}
        <div className="mb-6">
          <label className="text-sm text-[#808080] mb-3 block">Transaction Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'deposit', label: 'Deposits' },
              { value: 'withdrawal', label: 'Withdrawals' },
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

        {/* Status Filter */}
        <div className="mb-8">
          <label className="text-sm text-[#808080] mb-3 block">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  filterStatus === option.value
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
          Apply Filters
        </button>
      </div>
    </div>
  );
}

// Transaction Detail Modal
function TransactionDetailModal({
  transaction,
  onClose,
  t,
}: {
  transaction: Transaction | null;
  onClose: () => void;
  t: (key: string) => string;
}) {
  if (!transaction) return null;

  const isDeposit = transaction.transactionType === "DEPOSIT";
  const statusConfig = {
    COMPLETED: { color: '#00FF87', bg: 'rgba(0, 255, 135, 0.1)', icon: CheckCircle2, label: 'Completed' },
    PENDING: { color: '#FFB020', bg: 'rgba(255, 176, 32, 0.1)', icon: Clock, label: 'Pending' },
    FAILED: { color: '#FF4444', bg: 'rgba(255, 68, 68, 0.1)', icon: XCircle, label: 'Failed' },
    CANCELLED: { color: '#FF4444', bg: 'rgba(255, 68, 68, 0.1)', icon: XCircle, label: 'Cancelled' },
  };
  const status = statusConfig[transaction.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-[#404040] rounded-full mx-auto mb-6" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isDeposit ? 'bg-[#00FF87]/10' : 'bg-[#FF4444]/10'
          }`}>
            {isDeposit ? (
              <ArrowDownCircle className="w-8 h-8 text-[#00FF87]" />
            ) : (
              <ArrowUpCircle className="w-8 h-8 text-[#FF4444]" />
            )}
          </div>
          <p className="text-[#808080] text-sm mb-1">
            {isDeposit ? 'Deposit' : 'Withdrawal'}
          </p>
          <p className={`text-3xl font-bold ${isDeposit ? 'text-[#00FF87]' : 'text-[#FF4444]'}`}>
            {isDeposit ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
          </p>
        </div>

        {/* Status Badge */}
        <div
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl mx-auto w-fit mb-8"
          style={{ backgroundColor: status.bg }}
        >
          <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
          <span className="font-medium" style={{ color: status.color }}>{status.label}</span>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Transaction ID</span>
            <span className="text-white font-mono text-sm">{transaction.id.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Date</span>
            <span className="text-white">
              {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Time</span>
            <span className="text-white">
              {transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Method</span>
            <span className="text-white capitalize">{transaction.method || 'Bank Transfer'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#262626]">
            <span className="text-[#808080]">Currency</span>
            <span className="text-white">{transaction.currency || 'USD'}</span>
          </div>
          {transaction.adminNote && (
            <div className="py-3">
              <span className="text-[#808080] block mb-2">Note</span>
              <p className="text-white bg-[#1A1A1A] p-3 rounded-xl text-sm">{transaction.adminNote}</p>
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

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      fetchTransactions();
    }
  }, [session, fetchTransactions]);

  const filteredTransactions = (transactions || []).filter((tx) => {
    if (!tx || !tx.id) return false;

    const txType = tx.transactionType || "";
    const txStatus = tx.status || "";

    const matchesType =
      filterType === "all" ||
      (filterType === "deposit" && txType === "DEPOSIT") ||
      (filterType === "withdrawal" && txType === "WITHDRAWAL");

    const matchesStatus =
      filterStatus === "all" || txStatus === filterStatus.toUpperCase();

    const matchesSearch =
      searchTerm === "" ||
      (tx.amount?.toString() || "").includes(searchTerm) ||
      (tx.id || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  // Calculate stats
  const totalDeposits = (transactions || [])
    .filter((tx) => tx?.transactionType === "DEPOSIT" && tx?.status === "COMPLETED")
    .reduce((sum, tx) => sum + Number(tx?.amount || 0), 0);

  const totalWithdrawals = (transactions || [])
    .filter((tx) => tx?.transactionType === "WITHDRAWAL" && tx?.status === "COMPLETED")
    .reduce((sum, tx) => sum + Number(tx?.amount || 0), 0);

  const pendingCount = (transactions || []).filter((tx) => tx?.status === "PENDING").length;

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

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups: { [key: string]: Transaction[] }, tx) => {
    const date = new Date(tx.createdAt);
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
    groups[key].push(tx);
    return groups;
  }, {});

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <TransactionSkeleton />
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  const activeFiltersCount = (filterType !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  return (
    <DashboardLayout>
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="lg:hidden min-h-screen bg-[#0A0A0A] overflow-x-hidden max-w-full pb-[100px]">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">Transactions</h1>
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
                  placeholder="Search transactions..."
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
          {/* Total Deposits */}
          <div className="flex-shrink-0 w-[140px] snap-start">
            <div className="bg-gradient-to-br from-[#00FF87]/10 to-[#00FF87]/5 rounded-2xl p-4 border border-[#00FF87]/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#00FF87]" />
                <span className="text-xs text-[#808080]">Deposits</span>
              </div>
              <p className="text-xl font-bold text-[#00FF87]">
                ${totalDeposits >= 1000 ? `${(totalDeposits / 1000).toFixed(1)}k` : totalDeposits.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Withdrawals */}
          <div className="flex-shrink-0 w-[140px] snap-start">
            <div className="bg-gradient-to-br from-[#FF4444]/10 to-[#FF4444]/5 rounded-2xl p-4 border border-[#FF4444]/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-[#FF4444]" />
                <span className="text-xs text-[#808080]">Withdrawals</span>
              </div>
              <p className="text-xl font-bold text-[#FF4444]">
                ${totalWithdrawals >= 1000 ? `${(totalWithdrawals / 1000).toFixed(1)}k` : totalWithdrawals.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Pending */}
          <div className="flex-shrink-0 w-[140px] snap-start">
            <div className="bg-gradient-to-br from-[#FFB020]/10 to-[#FFB020]/5 rounded-2xl p-4 border border-[#FFB020]/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#FFB020]" />
                <span className="text-xs text-[#808080]">Pending</span>
              </div>
              <p className="text-xl font-bold text-[#FFB020]">{pendingCount}</p>
            </div>
          </div>

          {/* Net Flow */}
          <div className="flex-shrink-0 w-[140px] snap-start">
            <div className="bg-[#141414] rounded-2xl p-4 border border-[#262626]">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-[#00FF87]" />
                <span className="text-xs text-[#808080]">Net Flow</span>
              </div>
              <p className={`text-xl font-bold ${totalDeposits - totalWithdrawals >= 0 ? 'text-[#00FF87]' : 'text-[#FF4444]'}`}>
                {totalDeposits - totalWithdrawals >= 0 ? '+' : ''}${Math.abs(totalDeposits - totalWithdrawals).toLocaleString()}
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
              <span className="text-sm font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#00FF87] text-black text-xs font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Quick Filter Chips */}
            {[
              { value: 'all', label: 'All' },
              { value: 'deposit', label: 'Deposits' },
              { value: 'withdrawal', label: 'Withdrawals' },
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

            {/* Refresh Button */}
            <button
              onClick={() => fetchTransactions(true)}
              disabled={refreshing}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="px-4 pb-24">
          {Object.keys(groupedTransactions).length > 0 ? (
            Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date} className="mb-6">
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-medium text-[#808080]">{date}</h3>
                  <div className="flex-1 h-px bg-[#262626]" />
                </div>

                {/* Transactions */}
                <div className="space-y-3">
                  {txs.map((tx) => {
                    const isDeposit = tx.transactionType === "DEPOSIT";
                    const statusConfig = {
                      COMPLETED: { color: '#00FF87', label: 'Completed' },
                      PENDING: { color: '#FFB020', label: 'Pending' },
                      FAILED: { color: '#FF4444', label: 'Failed' },
                      CANCELLED: { color: '#FF4444', label: 'Cancelled' },
                    };
                    const status = statusConfig[tx.status] || statusConfig.PENDING;

                    return (
                      <button
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="w-full bg-[#141414] rounded-2xl p-4 border border-[#262626] hover:border-[#404040] transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isDeposit ? 'bg-[#00FF87]/10' : 'bg-[#FF4444]/10'
                          }`}>
                            {isDeposit ? (
                              <ArrowDownCircle className="w-6 h-6 text-[#00FF87]" />
                            ) : (
                              <ArrowUpCircle className="w-6 h-6 text-[#FF4444]" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-white font-medium">
                              {isDeposit ? 'Deposit' : 'Withdrawal'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${status.color}15`,
                                  color: status.color
                                }}
                              >
                                {status.label}
                              </span>
                              <span className="text-xs text-[#808080]">
                                {getRelativeTime(tx.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right flex-shrink-0">
                            <p className={`text-lg font-bold ${isDeposit ? 'text-[#00FF87]' : 'text-[#FF4444]'}`}>
                              {isDeposit ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                            </p>
                            <p className="text-xs text-[#808080] mt-1">{tx.currency || 'USD'}</p>
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
                <Wallet className="w-10 h-10 text-[#404040]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No transactions</h3>
              <p className="text-[#808080] text-center text-sm max-w-[250px]">
                {filterType !== 'all' || filterStatus !== 'all' || searchTerm
                  ? 'No transactions match your filters'
                  : 'Your transaction history will appear here'}
              </p>
              {(filterType !== 'all' || filterStatus !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
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
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {/* Transaction Detail Modal */}
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          t={t}
        />

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
            <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl bg-[#00FF87]/10">
              <History className="w-5 h-5 text-[#00FF87]" />
              <span className="text-[10px] font-semibold text-[#00FF87]">History</span>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {t("title")}
          </h2>
          <p className="text-[#808080]">
            View your deposit and withdrawal history
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#00FF87]/10 to-transparent rounded-2xl p-6 border border-[#00FF87]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#00FF87]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#00FF87]" />
              </div>
              <span className="text-[#808080] text-sm">Total Deposits</span>
            </div>
            <p className="text-2xl font-bold text-[#00FF87]">
              ${totalDeposits.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#FF4444]/10 to-transparent rounded-2xl p-6 border border-[#FF4444]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#FF4444]/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-[#FF4444]" />
              </div>
              <span className="text-[#808080] text-sm">Total Withdrawals</span>
            </div>
            <p className="text-2xl font-bold text-[#FF4444]">
              ${totalWithdrawals.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#FFB020]/10 to-transparent rounded-2xl p-6 border border-[#FFB020]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#FFB020]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FFB020]" />
              </div>
              <span className="text-[#808080] text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-[#FFB020]">{pendingCount}</p>
          </div>

          <div className="bg-[#141414] rounded-2xl p-6 border border-[#262626]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#00FF87]/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#00FF87]" />
              </div>
              <span className="text-[#808080] text-sm">Net Flow</span>
            </div>
            <p className={`text-2xl font-bold ${totalDeposits - totalWithdrawals >= 0 ? 'text-[#00FF87]' : 'text-[#FF4444]'}`}>
              {totalDeposits - totalWithdrawals >= 0 ? '+' : ''}${Math.abs(totalDeposits - totalWithdrawals).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#808080]" />
              <input
                type="text"
                placeholder="Search by ID or amount..."
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
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#808080] pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#262626] rounded-xl text-white focus:outline-none focus:border-[#00FF87] transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#808080] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#262626] flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Transaction History
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#00FF87]/10 text-[#00FF87] rounded-xl hover:bg-[#00FF87]/20 transition-colors">
              <Download className="w-4 h-4" />
              {tCommon("export")}
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
                    {t("date")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                    {t("amount")}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.transactionType === "DEPOSIT"
                                ? "bg-[#00FF87]/10"
                                : "bg-[#FF4444]/10"
                            }`}
                          >
                            {tx.transactionType === "DEPOSIT" ? (
                              <ArrowDownCircle className="w-5 h-5 text-[#00FF87]" />
                            ) : (
                              <ArrowUpCircle className="w-5 h-5 text-[#FF4444]" />
                            )}
                          </div>
                          <span className="text-white font-medium">
                            {t((tx.transactionType || "deposit").toLowerCase())}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#B3B3B3]">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : 'N/A'}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          tx.transactionType === "DEPOSIT"
                            ? "text-[#00FF87]"
                            : "text-[#FF4444]"
                        }`}
                      >
                        {tx.transactionType === "DEPOSIT" ? "+" : "-"}$
                        {tx.amount ? Number(tx.amount).toLocaleString() : '0'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            tx.status === "COMPLETED"
                              ? "bg-[#00FF87]/10 text-[#00FF87]"
                              : tx.status === "PENDING"
                              ? "bg-[#FFB020]/10 text-[#FFB020]"
                              : "bg-[#FF4444]/10 text-[#FF4444]"
                          }`}
                        >
                          {t((tx.status || "pending").toLowerCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#808080] text-sm">
                        {tx.adminNote || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-[#808080]"
                    >
                      {t("noTransactions")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal (Desktop) */}
      {selectedTransaction && (
        <div className="hidden lg:block">
          <TransactionDetailModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            t={t}
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
