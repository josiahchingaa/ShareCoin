"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, TrendingUp, Sparkles, RefreshCw, BarChart3 } from "lucide-react";
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <Brain className="w-16 h-16 text-accent-gold mx-auto mb-4 animate-pulse" />
          <div className="text-text-primary text-xl">Analyzing your portfolio...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-primary p-4 lg:p-8">
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
  );
}
