"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Search,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Trade {
  id: string;
  type: "BUY" | "SELL";
  asset: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fees: number;
  profitLoss?: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  executedAt: string;
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
    trade.type,
    trade.asset,
    new Date(trade.executedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    trade.quantity.toFixed(4),
    `$${trade.pricePerUnit.toLocaleString()}`,
    `$${trade.totalAmount.toLocaleString()}`,
    trade.profitLoss !== undefined
      ? `${trade.profitLoss >= 0 ? "+" : ""}$${trade.profitLoss.toLocaleString()}`
      : "-",
    trade.status,
  ]);

  // Add table
  autoTable(doc, {
    head: [["Type", "Asset", "Date", "Quantity", "Price", "Total", "P/L", "Status"]],
    body: tableData,
    startY: 45,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [212, 175, 55], textColor: [20, 20, 20] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });

  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  const totalPL = trades
    .filter(t => t.profitLoss !== undefined)
    .reduce((sum, t) => sum + (t.profitLoss || 0), 0);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Trades: ${trades.length}`, 14, finalY + 15);
  doc.text(`Buy Orders: ${trades.filter(t => t.type === "BUY").length}`, 14, finalY + 22);
  doc.text(`Sell Orders: ${trades.filter(t => t.type === "SELL").length}`, 14, finalY + 29);
  doc.text(
    `Total P/L: ${totalPL >= 0 ? "+" : ""}$${totalPL.toLocaleString()}`,
    14,
    finalY + 36
  );

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
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch("/api/trades");
        if (response.ok) {
          const data = await response.json();
          setTrades(data.trades);
        }
      } catch (error) {
        console.error("Failed to fetch trades:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "CUSTOMER") {
      fetchTrades();
    }
  }, [session]);

  const filteredTrades = trades.filter((trade) => {
    const matchesType =
      filterType === "all" ||
      (filterType === "buy" && trade.type === "BUY") ||
      (filterType === "sell" && trade.type === "SELL");

    const matchesStatus =
      filterStatus === "all" || trade.status === filterStatus.toUpperCase();

    const matchesSearch =
      searchTerm === "" ||
      trade.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  const totalProfitLoss = trades
    .filter((t) => t.profitLoss !== undefined)
    .reduce((sum, t) => sum + (t.profitLoss || 0), 0);

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-text-primary text-xl">{tCommon("loading")}</div>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            {t("title")}
          </h2>
          <p className="text-text-secondary">
            View your complete trading history and performance
          </p>
        </div>

        {/* Filters */}
        <div className="bg-background-secondary border border-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by asset or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
              />
            </div>

            {/* Type Filter */}
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

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text-primary">
              Trade History
            </h3>
            <button
              onClick={() => exportTradesToPDF(filteredTrades, session?.user?.name || "User")}
              className="flex items-center gap-2 px-4 py-2 bg-accent-gold/20 text-accent-gold rounded-lg hover:bg-accent-gold/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t("exportPDF")}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-primary border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    {t("type")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    {t("asset")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    {t("date")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                    {t("quantity")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                    {t("price")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                    {t("total")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                    P/L
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                    {t("status")}
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
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              trade.type === "BUY"
                                ? "bg-accent-green/20"
                                : "bg-accent-red/20"
                            }`}
                          >
                            {trade.type === "BUY" ? (
                              <TrendingUp className="w-5 h-5 text-accent-green" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-accent-red" />
                            )}
                          </div>
                          <span
                            className={`font-medium ${
                              trade.type === "BUY"
                                ? "text-accent-green"
                                : "text-accent-red"
                            }`}
                          >
                            {t(trade.type.toLowerCase())}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center">
                            <span className="text-accent-gold font-semibold text-xs">
                              {trade.asset.substring(0, 2)}
                            </span>
                          </div>
                          <span className="text-text-primary font-medium">
                            {trade.asset}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm">
                        {new Date(trade.executedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-text-primary">
                        {trade.quantity.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right text-text-primary">
                        ${trade.pricePerUnit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-text-primary font-semibold">
                        ${trade.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {trade.profitLoss !== undefined ? (
                          <span
                            className={`font-medium ${
                              trade.profitLoss >= 0
                                ? "text-accent-green"
                                : "text-accent-red"
                            }`}
                          >
                            {trade.profitLoss >= 0 ? "+" : ""}$
                            {trade.profitLoss.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-text-secondary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            trade.status === "COMPLETED"
                              ? "bg-accent-green/20 text-accent-green"
                              : trade.status === "PENDING"
                              ? "bg-accent-gold/20 text-accent-gold"
                              : "bg-accent-red/20 text-accent-red"
                          }`}
                        >
                          {t(trade.status.toLowerCase())}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-text-secondary"
                    >
                      {t("noTrades")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="text-text-secondary text-sm mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-text-primary">
              {trades.length}
            </div>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="text-text-secondary text-sm mb-1">Buy Orders</div>
            <div className="text-2xl font-bold text-accent-green">
              {trades.filter((t) => t.type === "BUY").length}
            </div>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="text-text-secondary text-sm mb-1">Sell Orders</div>
            <div className="text-2xl font-bold text-accent-red">
              {trades.filter((t) => t.type === "SELL").length}
            </div>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="text-text-secondary text-sm mb-1">Total P/L</div>
            <div
              className={`text-2xl font-bold ${
                totalProfitLoss >= 0 ? "text-accent-green" : "text-accent-red"
              }`}
            >
              {totalProfitLoss >= 0 ? "+" : ""}$
              {totalProfitLoss.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
