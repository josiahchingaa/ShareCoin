"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface PortfolioData {
  totalValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercentage: number;
  dailyChange: number;
  dailyChangePercentage: number;
  holdings: Array<{
    asset: string;
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

const COLORS = ["#00FF87", "#00E67A", "#00CC6D", "#FFB020", "#FF4444"];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch("/api/portfolio");
        if (response.ok) {
          const data = await response.json();
          setPortfolio(data);
        }
      } catch (error) {
        console.error("Failed to fetch portfolio:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "CUSTOMER") {
      fetchPortfolio();
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-primary text-xl">{tCommon("loading")}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <img
              src="https://coinshares.com/icons/coinshares-logo-white.svg"
              alt="CoinShares"
              className="h-8 w-auto"
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/15 text-primary-electric font-medium border-l-3 border-primary shadow-glow-blue-subtle"
            >
              <LayoutDashboard className="w-5 h-5" />
              {t("title")}
            </Link>
            <Link
              href="/dashboard/watchlist"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-background-primary transition-colors"
            >
              <Star className="w-5 h-5" />
              Watchlist
            </Link>
            <Link
              href="/dashboard/news"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-background-primary transition-colors"
            >
              <Newspaper className="w-5 h-5" />
              Market News
            </Link>
            <Link
              href="/dashboard/transactions"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-background-primary transition-colors"
            >
              <History className="w-5 h-5" />
              Transactions
            </Link>
            <Link
              href="/dashboard/trades"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-background-primary transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              Trade History
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-background-primary transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <Link
              href="/dashboard/support"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-background-primary transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Support
            </Link>
          </nav>

          {/* Logout Button */}
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
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-background-card border-b border-border p-4 flex items-center justify-between shadow-glow-blue-subtle">
          <img
            src="https://coinshares.com/icons/coinshares-logo-white.svg"
            alt="CoinShares"
            className="h-6 w-auto"
          />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-text-primary hover:text-primary transition-colors"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h2 className="text-4xl font-bold text-text-primary mb-2">
              {t("welcome")}, {session.user?.name?.split(" ")[0]}!
            </h2>
            <p className="text-text-secondary text-lg">{t("portfolio")}</p>
          </div>

          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
            {/* Total Value */}
            <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-blue-subtle transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-lg bg-primary/15 flex items-center justify-center shadow-glow-blue-subtle">
                  <Wallet className="w-7 h-7 text-primary-electric" />
                </div>
              </div>
              <h3 className="text-text-tertiary text-xs font-medium mb-2 uppercase tracking-wide">
                {t("totalValue")}
              </h3>
              <p className="text-4xl font-bold text-text-primary tabular-nums">
                ${portfolio?.totalValue.toLocaleString() || "0"}
              </p>
            </div>

            {/* Profit/Loss */}
            <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-blue-subtle transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-glow-blue-subtle ${
                    (portfolio?.profitLoss || 0) >= 0
                      ? "bg-accent-green/20"
                      : "bg-accent-red/20"
                  }`}
                >
                  {(portfolio?.profitLoss || 0) >= 0 ? (
                    <TrendingUp className="w-7 h-7 text-accent-green" />
                  ) : (
                    <TrendingDown className="w-7 h-7 text-accent-red" />
                  )}
                </div>
              </div>
              <h3 className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wide">
                {t("profitLoss")}
              </h3>
              <p
                className={`text-4xl font-bold tabular-nums ${
                  (portfolio?.profitLoss || 0) >= 0
                    ? "text-accent-green"
                    : "text-accent-red"
                }`}
              >
                {(portfolio?.profitLoss || 0) >= 0 ? "+" : ""}$
                {portfolio?.profitLoss.toLocaleString() || "0"}
              </p>
              <p
                className={`text-sm mt-2 font-medium ${
                  (portfolio?.profitLossPercentage || 0) >= 0
                    ? "text-accent-green"
                    : "text-accent-red"
                }`}
              >
                {(portfolio?.profitLossPercentage || 0) >= 0 ? "+" : ""}
                {portfolio?.profitLossPercentage.toFixed(2)}%
              </p>
            </div>

            {/* Daily Change */}
            <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-blue-subtle transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-glow-blue-subtle ${
                    (portfolio?.dailyChange || 0) >= 0
                      ? "bg-accent-green/20"
                      : "bg-accent-red/20"
                  }`}
                >
                  {(portfolio?.dailyChange || 0) >= 0 ? (
                    <ArrowUpRight className="w-7 h-7 text-accent-green" />
                  ) : (
                    <ArrowDownRight className="w-7 h-7 text-accent-red" />
                  )}
                </div>
              </div>
              <h3 className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wide">
                {t("dailyChange")}
              </h3>
              <p
                className={`text-4xl font-bold tabular-nums ${
                  (portfolio?.dailyChange || 0) >= 0
                    ? "text-accent-green"
                    : "text-accent-red"
                }`}
              >
                {(portfolio?.dailyChange || 0) >= 0 ? "+" : ""}$
                {portfolio?.dailyChange.toLocaleString() || "0"}
              </p>
              <p
                className={`text-sm mt-2 font-medium ${
                  (portfolio?.dailyChangePercentage || 0) >= 0
                    ? "text-accent-green"
                    : "text-accent-red"
                }`}
              >
                {(portfolio?.dailyChangePercentage || 0) >= 0 ? "+" : ""}
                {portfolio?.dailyChangePercentage.toFixed(2)}%
              </p>
            </div>

            {/* Total Invested */}
            <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-blue-subtle transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-lg bg-primary/15 flex items-center justify-center shadow-glow-blue-subtle">
                  <Wallet className="w-7 h-7 text-electric-blue" />
                </div>
              </div>
              <h3 className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wide">
                Total Invested
              </h3>
              <p className="text-4xl font-bold text-text-primary tabular-nums">
                ${portfolio?.totalInvested.toLocaleString() || "0"}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Chart */}
            <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-blue-subtle transition-all duration-300">
              <h3 className="text-xl font-semibold text-text-primary mb-6">
                {t("performance")} - {t("last30Days")}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={portfolio?.performance || []}>
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF87" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00FF87" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#808080"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#808080" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "1px solid #00FF87",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00FF87"
                    strokeWidth={3}
                    dot={false}
                    fill="url(#greenGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Allocation Chart */}
            <div className="bg-background-card border border-border rounded-xl p-6 hover:shadow-glow-blue-subtle transition-all duration-300">
              <h3 className="text-xl font-semibold text-text-primary mb-6">
                {t("allocation")}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={portfolio?.holdings || []}
                    dataKey="allocation"
                    nameKey="asset"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.asset} ${entry.allocation}%`}
                    labelLine={{ stroke: "#64748B" }}
                  >
                    {(portfolio?.holdings || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "1px solid #00FF87",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-background-card border border-border rounded-xl overflow-hidden hover:shadow-glow-blue-subtle transition-all duration-300">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-text-primary">
                {t("holdings")}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-main border-b border-border">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t("asset")}
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t("quantity")}
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t("price")}
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t("value")}
                    </th>
                    <th className="px-6 py-5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {t("change24h")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {portfolio?.holdings && portfolio.holdings.length > 0 ? (
                    portfolio.holdings.map((holding, index) => (
                      <tr
                        key={index}
                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center shadow-glow-blue-subtle group-hover:bg-primary/25 transition-all">
                              <span className="text-primary-electric font-semibold text-sm">
                                {holding.asset.substring(0, 2)}
                              </span>
                            </div>
                            <span className="text-text-primary font-semibold text-base">
                              {holding.asset}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right text-text-primary font-medium tabular-nums">
                          {holding.quantity.toFixed(4)}
                        </td>
                        <td className="px-6 py-5 text-right text-text-primary font-medium tabular-nums">
                          ${holding.currentPrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-right text-text-primary font-bold text-base tabular-nums">
                          ${holding.value.toLocaleString()}
                        </td>
                        <td
                          className={`px-6 py-5 text-right font-semibold text-base tabular-nums ${
                            holding.change24h >= 0
                              ? "text-accent-green"
                              : "text-accent-red"
                          }`}
                        >
                          {holding.change24h >= 0 ? "+" : ""}
                          {holding.change24h.toFixed(2)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-text-secondary"
                      >
                        {t("noHoldings")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
