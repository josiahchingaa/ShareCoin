"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Shield,
  Users,
  Clock,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";

interface ActivityLog {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string | null;
  description: string;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actorRole: string | null;
  actor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
}

interface Stats {
  totalLogs: number;
  adminActions: number;
  customerActions: number;
  last24Hours: number;
}

export default function AdminLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLogs: 0,
    adminActions: 0,
    customerActions: 0,
    last24Hours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("ALL");
  const [actorRoleFilter, setActorRoleFilter] = useState("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (actionTypeFilter !== "ALL") params.set("actionType", actionTypeFilter);
      if (actorRoleFilter !== "ALL") params.set("actorRole", actorRoleFilter);
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(`/api/admin/logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchLogs();
    }
  }, [session, actionTypeFilter, actorRoleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionTypeIcon = (actionType: string) => {
    if (actionType.includes("KYC")) {
      return <Shield className="w-5 h-5" />;
    }
    if (actionType.includes("USER")) {
      return <Users className="w-5 h-5" />;
    }
    return <Activity className="w-5 h-5" />;
  };

  const getActionTypeColor = (actionType: string) => {
    if (actionType.includes("APPROVED")) {
      return "text-accent-green";
    }
    if (actionType.includes("REJECTED") || actionType.includes("DELETED")) {
      return "text-accent-red";
    }
    if (actionType.includes("CREATED") || actionType.includes("ADDED")) {
      return "text-accent-blue";
    }
    return "text-accent-gold";
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

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
              Activity Logs
            </h1>
            <p className="text-text-secondary">
              Monitor system activity and audit trails
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-accent-gold" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.totalLogs}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Total Logs
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent-blue" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.adminActions}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Admin Actions
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-green/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent-green" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.customerActions}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Customer Actions
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-red/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent-red" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.last24Hours}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Last 24 Hours
            </h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary border border-border rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search logs by description or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
              />
            </div>
          </form>

          {/* Action Type Filter */}
          <div className="relative">
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="pl-4 pr-10 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="ALL">All Actions</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="USER_DELETED">User Deleted</option>
              <option value="KYC_APPROVED">KYC Approved</option>
              <option value="KYC_REJECTED">KYC Rejected</option>
              <option value="TRADE_ADDED">Trade Added</option>
              <option value="TRANSACTION_ADDED">Transaction Added</option>
              <option value="TRANSACTION_UPDATED">Transaction Updated</option>
              <option value="SUPPORT_REPLY">Support Reply</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>

          {/* Actor Role Filter */}
          <div className="relative">
            <select
              value={actorRoleFilter}
              onChange={(e) => setActorRoleFilter(e.target.value)}
              className="pl-4 pr-10 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
        {logs.length > 0 ? (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-6 hover:bg-background-primary transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-background-primary border border-border flex items-center justify-center flex-shrink-0 ${getActionTypeColor(
                      log.actionType
                    )}`}
                  >
                    {getActionTypeIcon(log.actionType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className={`font-semibold ${getActionTypeColor(
                              log.actionType
                            )}`}
                          >
                            {formatActionType(log.actionType)}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-text-secondary/20 text-text-secondary">
                            {log.targetType}
                          </span>
                        </div>
                        <p className="text-text-primary text-sm mb-2">
                          {log.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                      {log.actor && (
                        <span>
                          <strong>By:</strong> {log.actor.firstName}{" "}
                          {log.actor.lastName} ({log.actor.email})
                        </span>
                      )}
                      <span>
                        <strong>Role:</strong> {log.actorRole || "System"}
                      </span>
                      <span>
                        <strong>Time:</strong>{" "}
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {log.ipAddress && (
                        <span>
                          <strong>IP:</strong> {log.ipAddress}
                        </span>
                      )}
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-text-secondary cursor-pointer hover:text-accent-gold">
                          Show metadata
                        </summary>
                        <pre className="mt-2 p-3 bg-background-primary border border-border rounded text-xs text-text-secondary overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-text-secondary">
            No activity logs found
          </div>
        )}
      </div>
    </div>
  );
}
