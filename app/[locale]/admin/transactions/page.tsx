"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Filter,
  Check,
  X,
  Plus,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";

interface Transaction {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  transactionType: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  currency: string;
  method: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  receiptUrl: string | null;
  blockchainTxId: string | null;
  bankReference: string | null;
  adminNote: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    userId: "",
    transactionType: "DEPOSIT",
    amount: "",
    currency: "USD",
    method: "",
    blockchainTxId: "",
    bankReference: "",
    adminNote: "",
  });
  const [editTransaction, setEditTransaction] = useState({
    id: "",
    userId: "",
    transactionType: "DEPOSIT",
    amount: "",
    currency: "USD",
    method: "",
    blockchainTxId: "",
    bankReference: "",
    adminNote: "",
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
    const fetchData = async () => {
      try {
        const [transactionsRes, usersRes] = await Promise.all([
          fetch("/api/admin/transactions"),
          fetch("/api/admin/users"),
        ]);

        if (transactionsRes.ok) {
          const data = await transactionsRes.json();
          setTransactions(data.transactions);
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchData();
    }
  }, [session]);

  const handleApprove = async (transactionId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/transactions/${transactionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTransactions(
          transactions.map((t) =>
            t.id === transactionId ? data.transaction : t
          )
        );
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error("Failed to approve transaction:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (transactionId: string, reason: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/transactions/${transactionId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTransactions(
          transactions.map((t) =>
            t.id === transactionId ? data.transaction : t
          )
        );
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error("Failed to reject transaction:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions([data.transaction, ...transactions]);
        setShowAddModal(false);
        setNewTransaction({
          userId: "",
          transactionType: "DEPOSIT",
          amount: "",
          currency: "USD",
          method: "",
          blockchainTxId: "",
          bankReference: "",
          adminNote: "",
        });
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditTransaction({
      id: transaction.id,
      userId: transaction.user.id,
      transactionType: transaction.transactionType,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      method: transaction.method,
      blockchainTxId: transaction.blockchainTxId || "",
      bankReference: transaction.bankReference || "",
      adminNote: transaction.adminNote || "",
    });
    setShowEditModal(true);
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/transactions/${editTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editTransaction,
          amount: parseFloat(editTransaction.amount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(
          transactions.map((t) =>
            t.id === editTransaction.id ? data.transaction : t
          )
        );
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Failed to edit transaction:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/transactions/${transactionToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTransactions(transactions.filter((t) => t.id !== transactionToDelete));
        setShowDeleteConfirm(false);
        setTransactionToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      searchTerm === "" ||
      tx.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" || tx.transactionType === filterType.toUpperCase();

    const matchesStatus =
      filterStatus === "all" || tx.status === filterStatus.toUpperCase();

    return matchesSearch && matchesType && matchesStatus;
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
              Transaction Management
            </h1>
            <p className="text-text-secondary">
              Manage all user deposits and withdrawals
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">
              Total Transactions
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {transactions.length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">Pending</div>
            <div className="text-2xl font-bold text-accent-gold">
              {transactions.filter((t) => t.status === "PENDING").length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">Completed</div>
            <div className="text-2xl font-bold text-accent-green">
              {transactions.filter((t) => t.status === "COMPLETED").length}
            </div>
          </div>
          <div className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="text-text-secondary text-sm mb-1">
              Total Volume
            </div>
            <div className="text-2xl font-bold text-text-primary">
              $
              {transactions
                .filter((t) => t.status === "COMPLETED")
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary border border-border rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by user or transaction ID..."
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
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-primary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  Type
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  Method
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                  Actions
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
                      <div>
                        <div className="text-text-primary font-medium">
                          {tx.user.firstName} {tx.user.lastName}
                        </div>
                        <div className="text-text-secondary text-sm">
                          {tx.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tx.transactionType === "DEPOSIT" ? (
                          <ArrowDownCircle className="w-5 h-5 text-accent-green" />
                        ) : (
                          <ArrowUpCircle className="w-5 h-5 text-accent-red" />
                        )}
                        <span className="text-text-primary">
                          {tx.transactionType}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-semibold ${
                        tx.transactionType === "DEPOSIT"
                          ? "text-accent-green"
                          : "text-accent-red"
                      }`}
                    >
                      {tx.transactionType === "DEPOSIT" ? "+" : "-"}$
                      {tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {tx.method}
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
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-sm">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedTransaction(tx)}
                          className="p-2 text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(tx)}
                          className="p-2 text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tx.id)}
                          className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {tx.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(tx.id)}
                              disabled={actionLoading}
                              className="p-2 text-accent-green hover:bg-accent-green/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleReject(tx.id, "Rejected by admin")
                              }
                              disabled={actionLoading}
                              className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-text-secondary"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text-primary">
                Add Transaction
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  User *
                </label>
                <select
                  value={newTransaction.userId}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, userId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                  required
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Transaction Type *
                  </label>
                  <select
                    value={newTransaction.transactionType}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        transactionType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, amount: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Currency *
                  </label>
                  <input
                    type="text"
                    value={newTransaction.currency}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, currency: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Method *
                  </label>
                  <select
                    value={newTransaction.method}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, method: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="">Select Method</option>
                    <option value="WIRE_TRANSFER">Wire Transfer</option>
                    <option value="ACH">ACH</option>
                    <option value="CRYPTO_TRANSFER">Crypto Transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Blockchain TX ID (Optional)
                </label>
                <input
                  type="text"
                  value={newTransaction.blockchainTxId}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      blockchainTxId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Bank Reference (Optional)
                </label>
                <input
                  type="text"
                  value={newTransaction.bankReference}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      bankReference: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={newTransaction.adminNote}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, adminNote: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-background-primary border border-border text-text-primary rounded-lg font-medium hover:border-accent-gold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Adding..." : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text-primary">
                Edit Transaction
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  User *
                </label>
                <select
                  value={editTransaction.userId}
                  onChange={(e) =>
                    setEditTransaction({ ...editTransaction, userId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                  required
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Transaction Type *
                  </label>
                  <select
                    value={editTransaction.transactionType}
                    onChange={(e) =>
                      setEditTransaction({
                        ...editTransaction,
                        transactionType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTransaction.amount}
                    onChange={(e) =>
                      setEditTransaction({ ...editTransaction, amount: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Currency *
                  </label>
                  <input
                    type="text"
                    value={editTransaction.currency}
                    onChange={(e) =>
                      setEditTransaction({ ...editTransaction, currency: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Method *
                  </label>
                  <select
                    value={editTransaction.method}
                    onChange={(e) =>
                      setEditTransaction({ ...editTransaction, method: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    required
                  >
                    <option value="">Select Method</option>
                    <option value="WIRE_TRANSFER">Wire Transfer</option>
                    <option value="ACH">ACH</option>
                    <option value="CRYPTO_TRANSFER">Crypto Transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Blockchain TX ID (Optional)
                </label>
                <input
                  type="text"
                  value={editTransaction.blockchainTxId}
                  onChange={(e) =>
                    setEditTransaction({
                      ...editTransaction,
                      blockchainTxId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Bank Reference (Optional)
                </label>
                <input
                  type="text"
                  value={editTransaction.bankReference}
                  onChange={(e) =>
                    setEditTransaction({
                      ...editTransaction,
                      bankReference: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={editTransaction.adminNote}
                  onChange={(e) =>
                    setEditTransaction({ ...editTransaction, adminNote: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-background-primary border border-border text-text-primary rounded-lg font-medium hover:border-accent-gold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-text-primary mb-4">
                Delete Transaction
              </h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to delete this transaction? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setTransactionToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-background-primary border border-border text-text-primary rounded-lg font-medium hover:border-accent-gold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTransaction}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-accent-red text-white rounded-lg font-medium hover:bg-accent-red/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text-primary">
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-text-secondary text-sm mb-1">
                    Transaction ID
                  </div>
                  <div className="text-text-primary font-mono text-sm">
                    {selectedTransaction.id}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm mb-1">
                    Status
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTransaction.status === "COMPLETED"
                        ? "bg-accent-green/20 text-accent-green"
                        : selectedTransaction.status === "PENDING"
                        ? "bg-accent-gold/20 text-accent-gold"
                        : "bg-accent-red/20 text-accent-red"
                    }`}
                  >
                    {selectedTransaction.status}
                  </span>
                </div>
                <div>
                  <div className="text-text-secondary text-sm mb-1">User</div>
                  <div className="text-text-primary">
                    {selectedTransaction.user.firstName}{" "}
                    {selectedTransaction.user.lastName}
                  </div>
                  <div className="text-text-secondary text-sm">
                    {selectedTransaction.user.email}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm mb-1">Type</div>
                  <div className="text-text-primary">
                    {selectedTransaction.transactionType}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm mb-1">
                    Amount
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      selectedTransaction.transactionType === "DEPOSIT"
                        ? "text-accent-green"
                        : "text-accent-red"
                    }`}
                  >
                    {selectedTransaction.transactionType === "DEPOSIT"
                      ? "+"
                      : "-"}
                    ${selectedTransaction.amount.toLocaleString()}{" "}
                    {selectedTransaction.currency}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm mb-1">
                    Method
                  </div>
                  <div className="text-text-primary">
                    {selectedTransaction.method}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm mb-1">
                    Created At
                  </div>
                  <div className="text-text-primary text-sm">
                    {new Date(
                      selectedTransaction.createdAt
                    ).toLocaleString()}
                  </div>
                </div>
                {selectedTransaction.processedAt && (
                  <div>
                    <div className="text-text-secondary text-sm mb-1">
                      Processed At
                    </div>
                    <div className="text-text-primary text-sm">
                      {new Date(
                        selectedTransaction.processedAt
                      ).toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedTransaction.blockchainTxId && (
                  <div className="col-span-2">
                    <div className="text-text-secondary text-sm mb-1">
                      Blockchain TX ID
                    </div>
                    <div className="text-text-primary font-mono text-sm break-all">
                      {selectedTransaction.blockchainTxId}
                    </div>
                  </div>
                )}
                {selectedTransaction.bankReference && (
                  <div className="col-span-2">
                    <div className="text-text-secondary text-sm mb-1">
                      Bank Reference
                    </div>
                    <div className="text-text-primary font-mono text-sm">
                      {selectedTransaction.bankReference}
                    </div>
                  </div>
                )}
                {selectedTransaction.adminNote && (
                  <div className="col-span-2">
                    <div className="text-text-secondary text-sm mb-1">
                      Admin Note
                    </div>
                    <div className="text-text-primary text-sm">
                      {selectedTransaction.adminNote}
                    </div>
                  </div>
                )}
              </div>

              {selectedTransaction.status === "PENDING" && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => handleApprove(selectedTransaction.id)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                  >
                    Approve Transaction
                  </button>
                  <button
                    onClick={() =>
                      handleReject(selectedTransaction.id, "Rejected by admin")
                    }
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-accent-red text-white rounded-lg font-medium hover:bg-accent-red/90 transition-colors disabled:opacity-50"
                  >
                    Reject Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
