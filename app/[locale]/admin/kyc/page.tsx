"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileCheck,
  FileX,
  FileClock,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Download,
  Filter,
} from "lucide-react";

interface KYCDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  uploadedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    kycStatus: string;
    createdAt: string;
  };
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminKYCPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDocument, setSelectedDocument] =
    useState<KYCDocument | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(`/api/admin/kyc?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch KYC documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchDocuments();
    }
  }, [session, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const openReviewModal = (
    document: KYCDocument,
    action: "APPROVED" | "REJECTED"
  ) => {
    setSelectedDocument(document);
    setReviewAction(action);
    setRejectionReason("");
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (!selectedDocument) return;

    if (reviewAction === "REJECTED" && !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/kyc/${selectedDocument.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: reviewAction,
            rejectionReason: reviewAction === "REJECTED" ? rejectionReason : null,
          }),
        }
      );

      if (response.ok) {
        setShowReviewModal(false);
        fetchDocuments();
      }
    } catch (error) {
      console.error("Failed to review document:", error);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "GOVERNMENT_ID":
        return "Government ID";
      case "PROOF_OF_ADDRESS":
        return "Proof of Address";
      case "WEALTH_STATEMENT":
        return "Wealth Statement";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-accent-gold/20 text-accent-gold";
      case "APPROVED":
        return "bg-accent-green/20 text-accent-green";
      case "REJECTED":
        return "bg-accent-red/20 text-accent-red";
      default:
        return "bg-text-secondary/20 text-text-secondary";
    }
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
              KYC Management
            </h1>
            <p className="text-text-secondary">
              Review and approve customer KYC documents
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                <FileClock className="w-6 h-6 text-accent-gold" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.pending}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Pending Review
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-green/20 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-accent-green" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.approved}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Approved
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-red/20 flex items-center justify-center">
                <FileX className="w-6 h-6 text-accent-red" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.rejected}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Rejected
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
                placeholder="Search by user name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-background-primary transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-text-primary font-medium">
                          {doc.user.firstName} {doc.user.lastName}
                        </div>
                        <div className="text-text-secondary text-sm">
                          {doc.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-primary">
                        {getDocumentTypeLabel(doc.documentType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-text-secondary text-sm">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-background-primary border border-border rounded-lg text-text-secondary hover:text-accent-gold hover:border-accent-gold transition-all"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        {doc.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => openReviewModal(doc, "APPROVED")}
                              className="p-2 bg-background-primary border border-border rounded-lg text-text-secondary hover:text-accent-green hover:border-accent-green transition-all"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openReviewModal(doc, "REJECTED")}
                              className="p-2 bg-background-primary border border-border rounded-lg text-text-secondary hover:text-accent-red hover:border-accent-red transition-all"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-text-secondary">
            No KYC documents found
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {reviewAction === "APPROVED" ? "Approve" : "Reject"} Document
            </h3>

            <div className="mb-4">
              <p className="text-text-secondary mb-2">
                <strong>User:</strong> {selectedDocument.user.firstName}{" "}
                {selectedDocument.user.lastName}
              </p>
              <p className="text-text-secondary mb-2">
                <strong>Document:</strong>{" "}
                {getDocumentTypeLabel(selectedDocument.documentType)}
              </p>
            </div>

            {reviewAction === "REJECTED" && (
              <div className="mb-4">
                <label className="block text-text-primary text-sm font-medium mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors resize-none"
                  placeholder="Explain why this document is being rejected..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary hover:border-text-secondary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                className={`flex-1 px-4 py-3 rounded-lg text-white transition-all ${
                  reviewAction === "APPROVED"
                    ? "bg-accent-green hover:bg-accent-green/90"
                    : "bg-accent-red hover:bg-accent-red/90"
                }`}
              >
                {reviewAction === "APPROVED" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
