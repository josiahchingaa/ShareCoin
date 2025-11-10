"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Holding {
  symbol: string;
  assetName: string;
  assetType: string;
  quantity: number;
  totalInvested: number;
  averagePrice: number;
}

interface Portfolio {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
  holdings: Holding[];
  totalAssets: number;
  totalInvested: number;
  totalTrades: number;
}

interface Stats {
  totalAUM: number;
  totalUsers: number;
  activeUsers: number;
}

export default function AdminPortfoliosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAUM: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await fetch("/api/admin/portfolios");
        if (response.ok) {
          const data = await response.json();
          setPortfolios(data.portfolios);
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch portfolios:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchPortfolios();
    }
  }, [session]);

  const togglePortfolio = (userId: string) => {
    setExpandedPortfolios((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const filteredPortfolios = portfolios.filter((portfolio) => {
    const matchesSearch =
      searchTerm === "" ||
      portfolio.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portfolio.user.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      portfolio.user.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
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
              Portfolio Management
            </h1>
            <p className="text-text-secondary">
              View all customer portfolios and holdings
            </p>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent-gold" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                ${stats.totalAUM.toLocaleString()}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Total AUM (Assets Under Management)
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent-blue" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.totalUsers}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Total Customers
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-green/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent-green" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.activeUsers}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Active Portfolios
            </h3>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-background-secondary border border-border rounded-xl p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
          />
        </div>
      </div>

      {/* Portfolios List */}
      <div className="space-y-4">
        {filteredPortfolios.length > 0 ? (
          filteredPortfolios.map((portfolio) => (
            <div
              key={portfolio.user.id}
              className="bg-background-secondary border border-border rounded-xl overflow-hidden"
            >
              {/* Portfolio Header */}
              <div
                onClick={() => togglePortfolio(portfolio.user.id)}
                className="p-6 cursor-pointer hover:bg-background-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent-gold/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-accent-gold" />
                    </div>
                    <div>
                      <div className="text-text-primary font-semibold text-lg">
                        {portfolio.user.firstName} {portfolio.user.lastName}
                      </div>
                      <div className="text-text-secondary text-sm">
                        {portfolio.user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-text-secondary text-sm mb-1">
                        Total Invested
                      </div>
                      <div className="text-text-primary font-semibold text-lg">
                        ${portfolio.totalInvested.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-text-secondary text-sm mb-1">
                        Assets
                      </div>
                      <div className="text-text-primary font-semibold text-lg">
                        {portfolio.totalAssets}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-text-secondary text-sm mb-1">
                        Trades
                      </div>
                      <div className="text-text-primary font-semibold text-lg">
                        {portfolio.totalTrades}
                      </div>
                    </div>

                    <div className="ml-4">
                      {expandedPortfolios.has(portfolio.user.id) ? (
                        <ChevronUp className="w-6 h-6 text-text-secondary" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-text-secondary" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Holdings */}
              {expandedPortfolios.has(portfolio.user.id) && (
                <div className="border-t border-border">
                  {portfolio.holdings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-background-primary border-b border-border">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                              Asset
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                              Type
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                              Avg Price
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                              Total Invested
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {portfolio.holdings.map((holding) => (
                            <tr
                              key={holding.symbol}
                              className="hover:bg-background-primary transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-text-primary font-medium">
                                    {holding.symbol}
                                  </div>
                                  <div className="text-text-secondary text-sm">
                                    {holding.assetName}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    holding.assetType === "CRYPTO"
                                      ? "bg-accent-blue/20 text-accent-blue"
                                      : "bg-accent-green/20 text-accent-green"
                                  }`}
                                >
                                  {holding.assetType}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-text-primary">
                                {holding.quantity.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 8,
                                })}
                              </td>
                              <td className="px-6 py-4 text-right text-text-primary">
                                $
                                {holding.averagePrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-text-primary">
                                $
                                {holding.totalInvested.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center text-text-secondary">
                      No holdings yet. User hasn't made any trades.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-background-secondary border border-border rounded-xl p-12 text-center text-text-secondary">
            No portfolios found
          </div>
        )}
      </div>
    </div>
  );
}
