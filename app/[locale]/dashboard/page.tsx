"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X,
  LayoutDashboard,
  History,
  Settings,
  HelpCircle,
  LogOut,
  Star,
  Newspaper,
  RefreshCw,
  Download,
  Activity,
  Home,
  PieChart as PieChartIcon,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  Zap,
  BarChart3,
  CircleDollarSign,
  Layers,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";

// Asset logo mapping
const ASSET_LOGOS: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  DOT: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  LTC: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  UNI: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  ATOM: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
  XLM: "https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png",
  AAPL: "https://companieslogo.com/img/orig/AAPL-bf1a4314.png",
  MSFT: "https://companieslogo.com/img/orig/MSFT-a203b22d.png",
  GOOGL: "https://companieslogo.com/img/orig/GOOG-0ed88f7c.png",
  AMZN: "https://companieslogo.com/img/orig/AMZN-e9f942e4.png",
  NVDA: "https://companieslogo.com/img/orig/NVDA-220571ec.png",
  META: "https://companieslogo.com/img/orig/META-4767da84.png",
  TSLA: "https://companieslogo.com/img/orig/TSLA-6da550db.png",
  JPM: "https://companieslogo.com/img/orig/JPM-b4c0be67.png",
  V: "https://companieslogo.com/img/orig/V-05b48fa6.png",
  GOLD: "https://img.icons8.com/color/48/gold-bars.png",
  SILVER: "https://img.icons8.com/color/48/silver-bars.png",
  OIL: "https://img.icons8.com/color/48/oil-industry.png",
  USD: "https://img.icons8.com/color/48/us-dollar-circled.png",
  EUR: "https://img.icons8.com/color/48/euro-circled.png",
  GBP: "https://img.icons8.com/color/48/british-pound.png",
};

// Stock symbols that need special styling (white background, padding)
const STOCK_SYMBOLS = new Set(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V']);

interface PortfolioData {
  totalValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercentage: number;
  dailyChange: number;
  dailyChangePercentage: number;
  holdings: Array<{
    asset: string;
    symbol?: string;
    quantity: number;
    currentPrice: number;
    value: number;
    change24h: number;
    allocation: number;
  }>;
  performance: Array<{
    date: string;
    value: number;
  }>;
}

const COLORS = [
  "#00FF87",
  "#3B82F6",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#10B981",
  "#F97316",
  "#6366F1",
  "#EF4444",
];

// Mini sparkline component
const MiniSparkline = ({ data, positive }: { data: number[], positive?: boolean }) => {
  const sparkColor = positive ? "#00FF87" : "#EF4444";
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <div className="w-16 h-6 sm:w-20 sm:h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`sparkGradient-${positive ? 'pos' : 'neg'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={sparkColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={sparkColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={sparkColor}
            strokeWidth={1.5}
            fill={`url(#sparkGradient-${positive ? 'pos' : 'neg'})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Mobile skeleton loading
const MobileSkeleton = () => (
  <div className="min-h-screen bg-background-main">
    <div className="sticky top-0 z-30 bg-background-main/80 backdrop-blur-xl border-b border-white/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="w-24 h-5 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
    <div className="px-4 py-6">
      <div className="text-center">
        <div className="w-32 h-4 bg-white/5 rounded mx-auto mb-3 animate-pulse" />
        <div className="w-48 h-10 bg-white/5 rounded mx-auto mb-3 animate-pulse" />
        <div className="w-36 h-8 bg-white/5 rounded-full mx-auto animate-pulse" />
      </div>
    </div>
    <div className="px-4">
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-36 h-28 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
    <div className="px-4 mt-6">
      <div className="h-52 bg-white/5 rounded-2xl animate-pulse" />
    </div>
  </div>
);

// Desktop skeleton
const DesktopSkeleton = () => (
  <div className="min-h-screen flex">
    <div className="hidden lg:block w-64 bg-background-secondary border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
      </div>
      <nav className="p-4 space-y-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </nav>
    </div>
    <div className="flex-1 p-8">
      <div className="mb-8">
        <div className="h-10 w-64 bg-white/10 rounded mb-2 animate-pulse" />
        <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);

// Time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Format currency
const formatCurrency = (value: number, compact = false) => {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [hideBalance, setHideBalance] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  const fetchPortfolio = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/portfolio");
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      fetchPortfolio();
    }
  }, [session]);

  // Generate sparkline data
  const sparklineData = useMemo(() => {
    const baseValue = portfolio?.totalValue || 100000;
    return Array.from({ length: 7 }, (_, i) =>
      baseValue * (0.95 + Math.random() * 0.1)
    );
  }, [portfolio?.totalValue]);

  // Filter performance data
  const filteredPerformance = useMemo(() => {
    if (!portfolio?.performance) return [];
    const data = portfolio.performance;
    const periodDays: Record<string, number> = {
      '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, 'ALL': data.length,
    };
    return data.slice(-periodDays[chartPeriod]);
  }, [portfolio?.performance, chartPeriod]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-text-secondary animate-pulse">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (loading) {
    return (
      <>
        <div className="lg:hidden"><MobileSkeleton /></div>
        <div className="hidden lg:block"><DesktopSkeleton /></div>
      </>
    );
  }

  const isPositive = (portfolio?.profitLoss || 0) >= 0;
  const isDailyPositive = (portfolio?.dailyChange || 0) >= 0;

  return (
    <>
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="lg:hidden fixed inset-0 flex flex-col bg-background-main">
        {/* Premium Mobile Header - Fixed at top */}
        <header className="flex-shrink-0 bg-[#0A0A0A] border-b border-[#1A1A1A] z-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center active:scale-95 transition-transform"
              >
                {menuOpen ? (
                  <X className="w-5 h-5 text-text-primary" />
                ) : (
                  <Menu className="w-5 h-5 text-text-primary" />
                )}
              </button>
              <img
                src="https://coinshares.com/icons/coinshares-logo-white.svg"
                alt="CoinShares"
                className="h-5 w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPortfolio(true)}
                disabled={refreshing}
                className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-text-secondary ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="relative w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center active:scale-95 transition-transform">
                <Bell className="w-5 h-5 text-text-secondary" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent-green ring-2 ring-background-main" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Hero Section - Portfolio Value */}
          <section className={`px-4 pt-6 pb-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Greeting */}
          <p className="text-text-tertiary text-sm mb-1">
            {getGreeting()}, {session.user?.name?.split(" ")[0] || "there"}
          </p>

          {/* Total Value */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-[42px] font-bold text-text-primary tabular-nums tracking-tight">
              {hideBalance ? '•••••••' : formatCurrency(portfolio?.totalValue || 0)}
            </h1>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-2 rounded-full hover:bg-white/5 active:scale-95 transition-all"
            >
              {hideBalance ? (
                <EyeOff className="w-5 h-5 text-text-tertiary" />
              ) : (
                <Eye className="w-5 h-5 text-text-tertiary" />
              )}
            </button>
          </div>

          {/* Profit/Loss Badge */}
          <div className="flex justify-center">
            <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full ${
              isPositive
                ? 'bg-accent-green/10 border border-accent-green/20'
                : 'bg-accent-red/10 border border-accent-red/20'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isPositive ? 'bg-accent-green/20' : 'bg-accent-red/20'
              }`}>
                {isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-accent-green" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-accent-red" />
                )}
              </div>
              <span className={`font-semibold text-sm ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                {hideBalance ? '••••' : `${isPositive ? '+' : ''}${formatCurrency(portfolio?.profitLoss || 0)}`}
              </span>
              <span className={`text-xs font-medium ${isPositive ? 'text-accent-green/80' : 'text-accent-red/80'}`}>
                ({isPositive ? '+' : ''}{(portfolio?.profitLossPercentage || 0).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-6">
            <Link
              href="/dashboard/deposit"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-accent-green to-emerald-500 text-background-main font-semibold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-accent-green/20"
            >
              <Download className="w-4 h-4" />
              Deposit
            </Link>
            <Link
              href="/dashboard/withdraw"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-text-primary font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              <Upload className="w-4 h-4" />
              Withdraw
            </Link>
          </div>
        </section>

        {/* Stats Cards - Horizontal Scroll */}
        <section className="mt-2 -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Profit/Loss Card */}
            <div className={`flex-shrink-0 w-[140px] snap-start bg-gradient-to-br ${
              isPositive ? 'from-accent-green/10 to-accent-green/5' : 'from-accent-red/10 to-accent-red/5'
            } backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 transition-all duration-300`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                isPositive ? 'bg-accent-green/15' : 'bg-accent-red/15'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-accent-green" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-accent-red" />
                )}
              </div>
              <p className="text-text-tertiary text-[11px] font-medium uppercase tracking-wider mb-1">
                Profit/Loss
              </p>
              <p className={`text-lg font-bold tabular-nums ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                {hideBalance ? '••••' : `${isPositive ? '+' : ''}${formatCurrency(portfolio?.profitLoss || 0, true)}`}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${isPositive ? 'text-accent-green/70' : 'text-accent-red/70'}`}>
                {isPositive ? '+' : ''}{(portfolio?.profitLossPercentage || 0).toFixed(2)}%
              </p>
            </div>

            {/* Daily Change Card */}
            <div className={`flex-shrink-0 w-[140px] snap-start bg-gradient-to-br ${
              isDailyPositive ? 'from-blue-500/10 to-blue-500/5' : 'from-orange-500/10 to-orange-500/5'
            } backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 transition-all duration-300`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                isDailyPositive ? 'bg-blue-500/15' : 'bg-orange-500/15'
              }`}>
                <Zap className={`w-4 h-4 ${isDailyPositive ? 'text-blue-400' : 'text-orange-400'}`} />
              </div>
              <p className="text-text-tertiary text-[11px] font-medium uppercase tracking-wider mb-1">
                24h Change
              </p>
              <p className={`text-lg font-bold tabular-nums ${isDailyPositive ? 'text-blue-400' : 'text-orange-400'}`}>
                {hideBalance ? '••••' : `${isDailyPositive ? '+' : ''}${formatCurrency(portfolio?.dailyChange || 0, true)}`}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${isDailyPositive ? 'text-blue-400/70' : 'text-orange-400/70'}`}>
                {isDailyPositive ? '+' : ''}{(portfolio?.dailyChangePercentage || 0).toFixed(2)}%
              </p>
            </div>

            {/* Total Invested Card */}
            <div className="flex-shrink-0 w-[140px] snap-start bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center mb-3">
                <CircleDollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-text-tertiary text-[11px] font-medium uppercase tracking-wider mb-1">
                Invested
              </p>
              <p className="text-lg font-bold text-purple-400 tabular-nums">
                {hideBalance ? '••••' : formatCurrency(portfolio?.totalInvested || 0, true)}
              </p>
              <p className="text-xs text-purple-400/70 font-medium mt-0.5">
                ROI: {isPositive ? '+' : ''}{(portfolio?.profitLossPercentage || 0).toFixed(1)}%
              </p>
            </div>

            {/* Holdings Count Card */}
            <div className="flex-shrink-0 w-[140px] snap-start bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-text-tertiary text-[11px] font-medium uppercase tracking-wider mb-1">
                Assets
              </p>
              <p className="text-lg font-bold text-amber-400 tabular-nums">
                {portfolio?.holdings?.length || 0}
              </p>
              <p className="text-xs text-amber-400/70 font-medium mt-0.5">
                Active holdings
              </p>
            </div>
          </div>
        </section>

        {/* Performance Chart */}
        <section className="px-4 mt-4">
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-green" />
                <h3 className="text-sm font-semibold text-text-primary">Performance</h3>
              </div>
              {/* Period Selector */}
              <div className="flex gap-0.5 bg-white/[0.03] p-0.5 rounded-lg">
                {(['1W', '1M', '3M', '1Y'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      chartPeriod === period
                        ? 'bg-accent-green text-background-main'
                        : 'text-text-tertiary active:bg-white/5'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="h-[180px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredPerformance}>
                  <defs>
                    <linearGradient id="mobileGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00FF87" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#00FF87" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#525252"
                    tick={{ fontSize: 10, fill: '#808080' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#525252"
                    tick={{ fontSize: 10, fill: '#808080' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(20, 20, 20, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#808080', fontSize: '11px' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#00FF87"
                    strokeWidth={2}
                    fill="url(#mobileGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Holdings Section */}
        <section className="px-4 mt-4">
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">Holdings</h3>
                <span className="text-xs text-text-tertiary bg-white/[0.05] px-2 py-0.5 rounded-full">
                  {portfolio?.holdings?.length || 0}
                </span>
              </div>
              <Link
                href="/dashboard/trades"
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Holdings List */}
            {portfolio?.holdings && portfolio.holdings.length > 0 ? (
              <div className="divide-y divide-white/[0.04]">
                {portfolio.holdings.slice(0, 5).map((holding, index) => {
                  const symbol = holding.symbol || holding.asset.split(' ')[0];
                  const logoUrl = ASSET_LOGOS[symbol.toUpperCase()];
                  const isHoldingPositive = holding.change24h >= 0;
                  const isStock = STOCK_SYMBOLS.has(symbol.toUpperCase());

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3.5 active:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          isStock ? (
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5">
                              <img
                                src={logoUrl}
                                alt={holding.asset}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <img
                              src={logoUrl}
                              alt={holding.asset}
                              className="w-10 h-10 rounded-full object-cover bg-white/5"
                            />
                          )
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {holding.asset.substring(0, 2)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-semibold text-sm">
                            {holding.asset}
                          </p>
                          <p className="text-text-tertiary text-xs">
                            {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-text-primary font-semibold text-sm tabular-nums">
                          {hideBalance ? '••••' : formatCurrency(holding.value)}
                        </p>
                        <div className={`flex items-center justify-end gap-0.5 ${
                          isHoldingPositive ? 'text-accent-green' : 'text-accent-red'
                        }`}>
                          {isHoldingPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span className="text-xs font-medium tabular-nums">
                            {Math.abs(holding.change24h).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-primary/50" />
                </div>
                <p className="text-text-primary font-semibold mb-1">No holdings yet</p>
                <p className="text-text-tertiary text-sm mb-4">Start by making a deposit</p>
                <Link
                  href="/dashboard/deposit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-background-main rounded-xl font-semibold text-sm active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  Make Deposit
                </Link>
              </div>
            )}
          </div>

          {/* Allocation Mini Chart */}
          {portfolio?.holdings && portfolio.holdings.length > 0 && (
            <div className="mt-4 bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">Allocation</h3>
              </div>
              <div className="flex items-center gap-4">
                {/* Mini Pie */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolio.holdings}
                        dataKey="allocation"
                        nameKey="asset"
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {portfolio.holdings.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {portfolio.holdings.slice(0, 4).map((holding, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-text-secondary text-xs truncate max-w-[80px]">
                          {holding.asset}
                        </span>
                      </div>
                      <span className="text-text-primary text-xs font-semibold tabular-nums">
                        {holding.allocation?.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {portfolio.holdings.length > 4 && (
                    <p className="text-text-tertiary text-xs">
                      +{portfolio.holdings.length - 4} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        </div>
        {/* End Scrollable Content Area */}

        {/* Mobile Side Menu */}
        <div
          className={`fixed inset-0 z-[60] transition-all duration-300 ${
            menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div
            className={`absolute top-0 left-0 bottom-0 w-[280px] bg-background-card border-r border-white/[0.06] transition-transform duration-300 ${
              menuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="px-5 py-5 border-b border-white/[0.06]">
                <img
                  src="https://coinshares.com/icons/coinshares-logo-white.svg"
                  alt="CoinShares"
                  className="h-6 w-auto"
                />
              </div>

              {/* Nav Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', active: true },
                  { href: '/dashboard/watchlist', icon: Star, label: 'Watchlist' },
                  { href: '/dashboard/news', icon: Newspaper, label: 'Market News' },
                  { href: '/dashboard/transactions', icon: History, label: 'Transactions' },
                  { href: '/dashboard/trades', icon: TrendingUp, label: 'Trade History' },
                  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
                  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                  { href: '/dashboard/support', icon: HelpCircle, label: 'Support' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      item.active
                        ? 'bg-primary/15 text-primary'
                        : 'text-text-secondary active:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}

                {/* Quick Actions */}
                <div className="pt-4 mt-4 border-t border-white/[0.06]">
                  <p className="px-4 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                    Quick Actions
                  </p>
                  <Link
                    href="/dashboard/deposit"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-accent-green active:bg-accent-green/10 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Deposit Crypto</span>
                  </Link>
                  <Link
                    href="/dashboard/withdraw"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary active:bg-white/5 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">Withdraw</span>
                  </Link>
                </div>
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-white/[0.06]">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-accent-red w-full active:bg-accent-red/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{tAuth("logout")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation - Fixed at bottom of flex container */}
        <nav className="flex-shrink-0 bg-[#0A0A0A] border-t border-white/[0.08]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around py-2 px-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl bg-primary/10">
              <Home className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-semibold text-primary">Home</span>
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
      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-background-secondary border-r border-border flex-shrink-0">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border">
              <img
                src="https://coinshares.com/icons/coinshares-logo-white.svg"
                alt="CoinShares"
                className="h-8 w-auto"
              />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/15 text-primary font-medium"
              >
                <LayoutDashboard className="w-5 h-5" />
                {t("title")}
              </Link>
              {[
                { href: '/dashboard/watchlist', icon: Star, label: 'Watchlist' },
                { href: '/dashboard/news', icon: Newspaper, label: 'Market News' },
                { href: '/dashboard/transactions', icon: History, label: 'Transactions' },
                { href: '/dashboard/trades', icon: TrendingUp, label: 'Trade History' },
                { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                { href: '/dashboard/support', icon: HelpCircle, label: 'Support' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-background-primary transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}

              {/* Quick Actions */}
              <div className="pt-4 mt-4 border-t border-border">
                <p className="px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  Quick Actions
                </p>
                <Link
                  href="/dashboard/deposit"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-accent-green/10 hover:text-accent-green transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Deposit Crypto
                </Link>
                <Link
                  href="/dashboard/withdraw"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Withdraw
                </Link>
              </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                {tAuth("logout")}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-1">
                  {getGreeting()}, {session.user?.name?.split(" ")[0]}!
                </h2>
                <p className="text-text-secondary">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-text-secondary bg-background-card px-4 py-2 rounded-lg border border-border">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  <span>Live</span>
                  {lastUpdated && (
                    <span className="text-text-tertiary">
                      • Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fetchPortfolio(true)}
                  disabled={refreshing}
                  className="p-2 bg-background-card border border-border rounded-lg hover:border-primary transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 text-text-secondary ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              {/* Total Value */}
              <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-green-subtle transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <MiniSparkline data={sparklineData} positive />
                </div>
                <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-1">{t("totalValue")}</p>
                <p className="text-3xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(portfolio?.totalValue || 0)}
                </p>
              </div>

              {/* Profit/Loss */}
              <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-green-subtle transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPositive ? 'bg-accent-green/20' : 'bg-accent-red/20'}`}>
                    {isPositive ? <TrendingUp className="w-6 h-6 text-accent-green" /> : <TrendingDown className="w-6 h-6 text-accent-red" />}
                  </div>
                  <MiniSparkline data={sparklineData} positive={isPositive} />
                </div>
                <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-1">{t("profitLoss")}</p>
                <p className={`text-3xl font-bold tabular-nums ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(portfolio?.profitLoss || 0)}
                </p>
                <p className={`text-sm mt-1 font-medium ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isPositive ? '+' : ''}{(portfolio?.profitLossPercentage || 0).toFixed(2)}%
                </p>
              </div>

              {/* Daily Change */}
              <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-green-subtle transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDailyPositive ? 'bg-accent-green/20' : 'bg-accent-red/20'}`}>
                    {isDailyPositive ? <ArrowUpRight className="w-6 h-6 text-accent-green" /> : <ArrowDownRight className="w-6 h-6 text-accent-red" />}
                  </div>
                  <MiniSparkline data={sparklineData.slice(-5)} positive={isDailyPositive} />
                </div>
                <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-1">{t("dailyChange")}</p>
                <p className={`text-3xl font-bold tabular-nums ${isDailyPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isDailyPositive ? '+' : ''}{formatCurrency(portfolio?.dailyChange || 0)}
                </p>
                <p className={`text-sm mt-1 font-medium ${isDailyPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isDailyPositive ? '+' : ''}{(portfolio?.dailyChangePercentage || 0).toFixed(2)}%
                </p>
              </div>

              {/* Total Invested */}
              <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-green-subtle transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-tertiary uppercase">ROI</div>
                    <div className={`text-sm font-semibold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                      {isPositive ? '+' : ''}{(portfolio?.profitLossPercentage || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <p className="text-text-tertiary text-xs font-medium uppercase tracking-wide mb-1">Total Invested</p>
                <p className="text-3xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(portfolio?.totalInvested || 0)}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Performance Chart */}
              <div className="bg-background-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-text-primary">{t("performance")}</h3>
                  <div className="flex gap-1 bg-background-main p-1 rounded-lg">
                    {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setChartPeriod(period)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          chartPeriod === period
                            ? 'bg-primary text-background-main'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredPerformance}>
                    <defs>
                      <linearGradient id="desktopGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF87" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FF87" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#808080" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#808080" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={50} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        padding: '8px 12px',
                      }}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#808080' }}
                      formatter={(value: number) => [formatCurrency(value), 'Value']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#00FF87" strokeWidth={2} fill="url(#desktopGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Allocation Chart */}
              <div className="bg-background-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-6">{t("allocation")}</h3>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <Pie
                          data={portfolio?.holdings || []}
                          dataKey="allocation"
                          nameKey="asset"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {(portfolio?.holdings || []).map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            zIndex: 100,
                          }}
                          wrapperStyle={{ zIndex: 100 }}
                          itemStyle={{ color: '#ffffff' }}
                          labelStyle={{ color: '#808080' }}
                          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                      <span className="text-text-tertiary text-xs uppercase">Total</span>
                      <span className="text-text-primary text-xl font-bold">
                        {formatCurrency(portfolio?.totalValue || 0, true)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {(portfolio?.holdings || []).map((holding, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-text-primary text-sm">{holding.asset}</span>
                        </div>
                        <span className="text-text-primary font-semibold text-sm tabular-nums">
                          {holding.allocation?.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                    {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
                      <div className="text-center py-8">
                        <PieChartIcon className="w-12 h-12 text-text-tertiary/30 mx-auto mb-3" />
                        <p className="text-text-secondary">No holdings yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-background-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">{t("holdings")}</h3>
                <span className="text-sm text-text-tertiary">{portfolio?.holdings?.length || 0} assets</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-main border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("asset")}</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("quantity")}</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("price")}</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("value")}</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">{t("change24h")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {portfolio?.holdings && portfolio.holdings.length > 0 ? (
                      portfolio.holdings.map((holding, index) => {
                        const symbol = holding.symbol || holding.asset.split(' ')[0];
                        const logoUrl = ASSET_LOGOS[symbol.toUpperCase()];
                        const isStock = STOCK_SYMBOLS.has(symbol.toUpperCase());
                        return (
                          <tr key={index} className="hover:bg-primary/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {logoUrl ? (
                                  isStock ? (
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5">
                                      <img src={logoUrl} alt={holding.asset} className="w-full h-full object-contain" />
                                    </div>
                                  ) : (
                                    <img src={logoUrl} alt={holding.asset} className="w-10 h-10 rounded-full object-cover bg-white/10" />
                                  )
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                                    <span className="text-primary font-semibold text-sm">{holding.asset.substring(0, 2)}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-text-primary font-semibold block">{holding.asset}</span>
                                  <span className="text-text-tertiary text-xs">{symbol.toUpperCase()}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-text-primary font-medium tabular-nums">
                              {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                            </td>
                            <td className="px-6 py-4 text-right text-text-primary font-medium tabular-nums">
                              {formatCurrency(holding.currentPrice)}
                            </td>
                            <td className="px-6 py-4 text-right text-text-primary font-bold tabular-nums">
                              {formatCurrency(holding.value)}
                            </td>
                            <td className={`px-6 py-4 text-right font-semibold tabular-nums ${holding.change24h >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                              <div className="flex items-center justify-end gap-1">
                                {holding.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {Math.abs(holding.change24h).toFixed(2)}%
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                              <Wallet className="w-10 h-10 text-primary/50" />
                            </div>
                            <p className="text-text-secondary font-medium text-lg mb-1">No holdings yet</p>
                            <p className="text-text-tertiary text-sm mb-4">Start building your portfolio by making a deposit</p>
                            <Link
                              href="/dashboard/deposit"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background-main rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                            >
                              <Download className="w-5 h-5" />
                              Make Your First Deposit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
