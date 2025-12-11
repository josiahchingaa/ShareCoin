"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Brain,
  TrendingUp,
  Sparkles,
  RefreshCw,
  BarChart3,
  ChevronLeft,
  Home,
  History,
  Settings,
  Download,
  Zap,
  PieChart,
  Activity,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AnalyticsData {
  summary: string;
  topHoldings?: Array<{
    symbol: string;
    name: string;
    type: string;
    invested: string;
  }>;
  metrics?: {
    totalAssets: number;
    totalInvested: string;
    totalTrades: number;
  };
  generatedAt?: string;
  error?: string;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  const fetchAnalytics = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      fetchAnalytics();
    }
  }, [session]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Mobile skeleton
  const MobileSkeleton = () => (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 h-14 border-b border-[#1A1A1A]" />
      <div className="px-4 py-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Brain className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <div className="text-center mb-8">
          <div className="h-6 w-40 bg-[#262626] rounded mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-56 bg-[#262626] rounded mx-auto animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[120px] h-24 bg-[#141414] rounded-2xl animate-pulse border border-[#262626]" />
          ))}
        </div>
        <div className="mt-4 bg-[#141414] rounded-2xl p-4 border border-[#262626] animate-pulse">
          <div className="h-5 w-32 bg-[#262626] rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-[#262626] rounded" />
            <div className="h-4 w-5/6 bg-[#262626] rounded" />
            <div className="h-4 w-4/5 bg-[#262626] rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  if (status === "loading" || loading) {
    return (
      <>
        {/* Mobile Loading */}
        <div className="lg:hidden">
          <MobileSkeleton />
        </div>
        {/* Desktop Loading */}
        <div className="hidden lg:flex min-h-screen items-center justify-center bg-background-primary">
          <div className="text-center">
            <Brain className="w-16 h-16 text-accent-gold mx-auto mb-4 animate-pulse" />
            <div className="text-text-primary text-xl">Analyzing your portfolio...</div>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
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
            <h1 className="text-lg font-semibold text-white">AI Analytics</h1>
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* AI Badge */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-sm text-amber-500 w-fit mx-auto">
            <Sparkles className="w-4 h-4" />
            Powered by Groq Llama 3.3
          </div>
        </div>

        {/* Metrics Cards - Horizontal Scroll */}
        {analytics?.metrics && (
          <div className="px-4 py-4">
            <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
              {/* Total Assets */}
              <div className="flex-shrink-0 w-[130px] snap-start bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 border border-blue-500/20">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center mb-3">
                  <PieChart className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-[#808080] text-xs font-medium mb-1">Assets</p>
                <p className="text-xl font-bold text-white">{analytics.metrics.totalAssets}</p>
              </div>

              {/* Total Invested */}
              <div className="flex-shrink-0 w-[130px] snap-start bg-gradient-to-br from-[#00FF87]/10 to-[#00FF87]/5 rounded-2xl p-4 border border-[#00FF87]/20">
                <div className="w-9 h-9 rounded-xl bg-[#00FF87]/15 flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4 text-[#00FF87]" />
                </div>
                <p className="text-[#808080] text-xs font-medium mb-1">Invested</p>
                <p className="text-xl font-bold text-[#00FF87]">
                  ${Number(analytics.metrics.totalInvested) >= 1000
                    ? `${(Number(analytics.metrics.totalInvested) / 1000).toFixed(1)}k`
                    : Number(analytics.metrics.totalInvested).toLocaleString()}
                </p>
              </div>

              {/* Total Trades */}
              <div className="flex-shrink-0 w-[130px] snap-start bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl p-4 border border-amber-500/20">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[#808080] text-xs font-medium mb-1">Trades</p>
                <p className="text-xl font-bold text-amber-400">{analytics.metrics.totalTrades}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Summary Card */}
        {analytics && (
          <div className="px-4 mb-4">
            <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[#262626] flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-500" />
                <h2 className="text-white font-semibold">Portfolio Analysis</h2>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold text-white mb-3">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold text-white mb-2 mt-4">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-white mb-2 mt-3">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-[#B3B3B3] text-sm mb-3 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside text-[#B3B3B3] text-sm mb-3 space-y-1">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-[#B3B3B3]">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">{children}</strong>
                      ),
                    }}
                  >
                    {analytics.summary}
                  </ReactMarkdown>
                </div>

                {analytics.generatedAt && (
                  <div className="mt-4 pt-4 border-t border-[#262626]">
                    <p className="text-[#808080] text-xs">
                      Generated {formatDate(analytics.generatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top Holdings */}
        {analytics?.topHoldings && analytics.topHoldings.length > 0 && (
          <div className="px-4 mb-4">
            <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#262626]">
                <h2 className="text-white font-semibold">Top Holdings</h2>
              </div>

              <div className="divide-y divide-[#262626]">
                {analytics.topHoldings.map((holding, index) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{holding.name}</p>
                        <p className="text-[#808080] text-xs">{holding.symbol} • {holding.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        ${Number(holding.invested).toLocaleString()}
                      </p>
                      <p className="text-[#808080] text-xs">Invested</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analytics?.summary && !loading && (
          <div className="px-4">
            <div className="bg-[#141414] rounded-2xl border border-[#262626] p-12 text-center">
              <Brain className="w-16 h-16 text-[#404040] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Analytics Yet</h3>
              <p className="text-[#808080] text-sm">
                Start trading to see AI-powered insights
              </p>
            </div>
          </div>
        )}

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
      <div className="hidden lg:block min-h-screen bg-background-primary p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-8 h-8 text-accent-gold" />
                  <h1 className="text-3xl font-bold text-text-primary">
                    AI Analytics
                  </h1>
                </div>
                <p className="text-text-secondary">
                  AI-powered insights and analysis of your investment portfolio
                </p>
              </div>
              <button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary hover:border-accent-gold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Powered by Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/30 rounded-full text-sm text-accent-gold">
              <Sparkles className="w-4 h-4" />
              Powered by AI (Groq Llama 3.3)
            </div>
          </div>

          {/* Metrics Cards */}
          {analytics?.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-background-secondary border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Total Assets</span>
                  <BarChart3 className="w-5 h-5 text-accent-blue" />
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {analytics.metrics.totalAssets}
                </div>
              </div>

              <div className="bg-background-secondary border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Total Invested</span>
                  <TrendingUp className="w-5 h-5 text-accent-green" />
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  ${Number(analytics.metrics.totalInvested).toLocaleString()}
                </div>
              </div>

              <div className="bg-background-secondary border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Total Trades</span>
                  <Sparkles className="w-5 h-5 text-accent-gold" />
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {analytics.metrics.totalTrades}
                </div>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {analytics && (
            <div className="bg-background-secondary border border-border rounded-xl p-8 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-6 h-6 text-accent-gold" />
                <h2 className="text-2xl font-bold text-text-primary">
                  Portfolio Analysis
                </h2>
              </div>

              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-text-primary mb-4">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold text-text-primary mb-3 mt-6">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold text-text-primary mb-2 mt-4">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-text-secondary mb-4 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-text-secondary">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-text-primary">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {analytics.summary}
                </ReactMarkdown>
              </div>

              {analytics.generatedAt && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-text-secondary text-sm">
                    Analysis generated on {formatDate(analytics.generatedAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Top Holdings */}
          {analytics?.topHoldings && analytics.topHoldings.length > 0 && (
            <div className="bg-background-secondary border border-border rounded-xl p-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Top Holdings
              </h2>

              <div className="space-y-4">
                {analytics.topHoldings.map((holding, index) => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-4 bg-background-primary rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">
                          {holding.name}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {holding.symbol} • {holding.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-text-primary">
                        ${Number(holding.invested).toLocaleString()}
                      </div>
                      <div className="text-sm text-text-secondary">Invested</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!analytics?.topHoldings && !loading && (
            <div className="bg-background-secondary border border-border rounded-xl p-12 text-center">
              <Brain className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No Analytics Available Yet
              </h3>
              <p className="text-text-secondary">
                Start trading to see AI-powered insights about your portfolio
              </p>
            </div>
          )}
        </div>
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
    </>
  );
}
