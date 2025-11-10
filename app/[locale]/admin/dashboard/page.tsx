"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  HeadphonesIcon,
  Activity,
  ChevronRight,
  ArrowDownUp,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingKyc: 0,
    openTickets: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    // Fetch admin stats
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchStats();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-primary text-xl">{tCommon("loading")}</div>
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient-gold mb-2">
              {t("dashboard")}
            </h1>
            <p className="text-text-secondary">
              Welcome back, {session.user?.name}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-6 py-3 bg-background-secondary border border-border rounded-lg text-text-primary hover:border-accent-gold transition-all"
          >
            {tAuth("logout")}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent-blue" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.totalUsers}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              {t("totalUsers")}
            </h3>
          </div>

          {/* Active Users */}
          <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-green/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-accent-green" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.activeUsers}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              {t("activeUsers")}
            </h3>
          </div>

          {/* Pending KYC */}
          <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-accent-gold" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.pendingKyc}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              {t("pendingKyc")}
            </h3>
          </div>

          {/* Open Tickets */}
          <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-red/20 flex items-center justify-center">
                <HeadphonesIcon className="w-6 h-6 text-accent-red" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.openTickets}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              {t("openTickets")}
            </h3>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Management */}
          <Link href="/admin/users">
            <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {t("userManagement")}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Manage user accounts, roles, and permissions
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-text-secondary" />
              </div>
            </div>
          </Link>

          {/* Transactions */}
          <Link href="/admin/transactions">
            <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    Transactions
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Manage deposits and withdrawals
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-text-secondary" />
              </div>
            </div>
          </Link>

          {/* Trades */}
          <Link href="/admin/trades">
            <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    Trades
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Add and manage user trades
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-text-secondary" />
              </div>
            </div>
          </Link>

          {/* Portfolios */}
          <Link href="/admin/portfolios">
            <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    Portfolios
                  </h3>
                  <p className="text-text-secondary text-sm">
                    View all customer portfolios and holdings
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-text-secondary" />
              </div>
            </div>
          </Link>

          {/* KYC Reviews */}
          <Link href="/admin/kyc">
            <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {t("kyc")}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Review and approve pending KYC submissions
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-text-secondary" />
              </div>
            </div>
          </Link>

          {/* Support Tickets */}
          <Link href="/admin/support">
            <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {t("support")}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Respond to customer support tickets
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-text-secondary" />
              </div>
            </div>
          </Link>

          {/* Activity Logs */}
          <Link href="/admin/logs">
            <div className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {t("logs")}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    View system activity and audit logs
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-text-secondary" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
