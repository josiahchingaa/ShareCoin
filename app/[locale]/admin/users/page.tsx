"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accountType: string | null;
  kycStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [session]);

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, isActive: !currentStatus } : user
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive) ||
      (filterStatus === "pending_kyc" && user.kycStatus === "PENDING") ||
      (filterStatus === "approved_kyc" && user.kycStatus === "APPROVED");

    return matchesSearch && matchesFilter;
  });

  if (status === "loading" || loading) {
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
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-text-secondary hover:text-accent-gold transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gradient-gold mb-2">
            {t("userManagement")}
          </h1>
          <p className="text-text-secondary">
            Manage user accounts, roles, and permissions
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-background-secondary border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending_kyc">Pending KYC</option>
                <option value="approved_kyc">Approved KYC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-primary border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Account Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    KYC Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-text-secondary"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-background-primary transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
                            <span className="text-accent-gold font-semibold">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-text-primary font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-text-secondary text-sm flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.accountType === "CRYPTO"
                              ? "bg-accent-blue/20 text-accent-blue"
                              : "bg-accent-green/20 text-accent-green"
                          }`}
                        >
                          {user.accountType || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.kycStatus === "APPROVED"
                              ? "bg-accent-green/20 text-accent-green"
                              : user.kycStatus === "PENDING"
                              ? "bg-accent-gold/20 text-accent-gold"
                              : "bg-accent-red/20 text-accent-red"
                          }`}
                        >
                          {user.kycStatus === "APPROVED" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {user.kycStatus === "PENDING" && (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {user.kycStatus === "REJECTED" && (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-accent-green/20 text-accent-green"
                              : "bg-accent-red/20 text-accent-red"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="px-4 py-2 text-sm bg-accent-gold/20 text-accent-gold rounded-lg hover:bg-accent-gold/30 transition-colors"
                          >
                            {t("viewDetails")}
                          </Link>
                          <button
                            onClick={() =>
                              handleToggleActive(user.id, user.isActive)
                            }
                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                              user.isActive
                                ? "bg-accent-red/20 text-accent-red hover:bg-accent-red/30"
                                : "bg-accent-green/20 text-accent-green hover:bg-accent-green/30"
                            }`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">Total Users</div>
            <div className="text-2xl font-bold text-text-primary">
              {users.length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">
              Active Users
            </div>
            <div className="text-2xl font-bold text-accent-green">
              {users.filter((u) => u.isActive).length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">
              Pending KYC
            </div>
            <div className="text-2xl font-bold text-accent-gold">
              {users.filter((u) => u.kycStatus === "PENDING").length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">
              Approved KYC
            </div>
            <div className="text-2xl font-bold text-accent-green">
              {users.filter((u) => u.kycStatus === "APPROVED").length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
