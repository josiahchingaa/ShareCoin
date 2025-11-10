"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Filter,
  Search,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: string;
  processedAt: string | null;
  notes: string | null;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/transactions");
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "CUSTOMER") {
      fetchTransactions();
    }
  }, [session]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType =
      filterType === "all" ||
      (filterType === "deposit" && tx.type === "DEPOSIT") ||
      (filterType === "withdrawal" && tx.type === "WITHDRAWAL");

    const matchesStatus =
      filterStatus === "all" || tx.status === filterStatus.toUpperCase();

    const matchesSearch =
      searchTerm === "" ||
      tx.amount.toString().includes(searchTerm) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

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
            View your deposit and withdrawal history
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
                placeholder="Search by ID or amount..."
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
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
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
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text-primary">
              Transaction History
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-gold/20 text-accent-gold rounded-lg hover:bg-accent-gold/30 transition-colors">
              <Download className="w-4 h-4" />
              {tCommon("export")}
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
                    {t("date")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                    {t("amount")}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                    {t("status")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-background-primary transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === "DEPOSIT"
                                ? "bg-accent-green/20"
                                : "bg-accent-red/20"
                            }`}
                          >
                            {tx.type === "DEPOSIT" ? (
                              <ArrowDownCircle className="w-5 h-5 text-accent-green" />
                            ) : (
                              <ArrowUpCircle className="w-5 h-5 text-accent-red" />
                            )}
                          </div>
                          <span className="text-text-primary font-medium">
                            {t(tx.type.toLowerCase())}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          tx.type === "DEPOSIT"
                            ? "text-accent-green"
                            : "text-accent-red"
                        }`}
                      >
                        {tx.type === "DEPOSIT" ? "+" : "-"}$
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            tx.status === "COMPLETED"
                              ? "bg-accent-green/20 text-accent-green"
                              : tx.status === "PENDING"
                              ? "bg-accent-gold/20 text-accent-gold"
                              : "bg-accent-red/20 text-accent-red"
                          }`}
                        >
                          {t(tx.status.toLowerCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm">
                        {tx.notes || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-text-secondary"
                    >
                      {t("noTransactions")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="text-text-secondary text-sm mb-1">
              Total Deposits
            </div>
            <div className="text-2xl font-bold text-accent-green">
              $
              {transactions
                .filter(
                  (tx) => tx.type === "DEPOSIT" && tx.status === "COMPLETED"
                )
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toLocaleString()}
            </div>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="text-text-secondary text-sm mb-1">
              Total Withdrawals
            </div>
            <div className="text-2xl font-bold text-accent-red">
              $
              {transactions
                .filter(
                  (tx) => tx.type === "WITHDRAWAL" && tx.status === "COMPLETED"
                )
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toLocaleString()}
            </div>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="text-text-secondary text-sm mb-1">
              Pending Transactions
            </div>
            <div className="text-2xl font-bold text-accent-gold">
              {transactions.filter((tx) => tx.status === "PENDING").length}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
