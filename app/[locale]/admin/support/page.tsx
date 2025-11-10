"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Send,
  X,
  AlertCircle,
} from "lucide-react";

interface SupportMessage {
  id: string;
  senderId: string;
  senderRole: string;
  message: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  lastReplyAt: string | null;
  closedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  messages: SupportMessage[];
}

interface Stats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<Stats>({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(`/api/admin/support?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchTickets();
    }
  }, [session, statusFilter, priorityFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const openTicket = async (ticket: SupportTicket) => {
    try {
      const response = await fetch(`/api/admin/support/${ticket.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
        setTicketMessages(data.ticket.messages);
        setShowTicketModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch ticket details:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const response = await fetch(
        `/api/admin/support/${selectedTicket.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: replyMessage }),
        }
      );

      if (response.ok) {
        setReplyMessage("");
        // Refresh ticket details
        const detailsResponse = await fetch(
          `/api/admin/support/${selectedTicket.id}`
        );
        if (detailsResponse.ok) {
          const data = await detailsResponse.json();
          setTicketMessages(data.ticket.messages);
          setSelectedTicket(data.ticket);
        }
        fetchTickets(); // Refresh ticket list
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/support/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          const detailsResponse = await fetch(`/api/admin/support/${ticketId}`);
          if (detailsResponse.ok) {
            const data = await detailsResponse.json();
            setSelectedTicket(data.ticket);
          }
        }
      }
    } catch (error) {
      console.error("Failed to update ticket status:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-accent-red/20 text-accent-red";
      case "HIGH":
        return "bg-orange-500/20 text-orange-500";
      case "NORMAL":
        return "bg-accent-blue/20 text-accent-blue";
      case "LOW":
        return "bg-text-secondary/20 text-text-secondary";
      default:
        return "bg-text-secondary/20 text-text-secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-accent-gold/20 text-accent-gold";
      case "IN_PROGRESS":
        return "bg-accent-blue/20 text-accent-blue";
      case "RESOLVED":
        return "bg-accent-green/20 text-accent-green";
      case "CLOSED":
        return "bg-text-secondary/20 text-text-secondary";
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
              Support Tickets
            </h1>
            <p className="text-text-secondary">
              Manage and respond to customer support requests
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-accent-gold" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.open}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">Open</h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent-blue" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.inProgress}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              In Progress
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent-green/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-accent-green" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.resolved}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">
              Resolved
            </h3>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-text-secondary/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-text-secondary" />
              </div>
              <span className="text-3xl font-bold text-text-primary">
                {stats.closed}
              </span>
            </div>
            <h3 className="text-text-secondary text-sm font-medium">Closed</h3>
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
                placeholder="Search by subject or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-10 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-4 pr-10 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="ALL">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => openTicket(ticket)}
              className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-gold transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {ticket.subject}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                    <span>
                      {ticket.user.firstName} {ticket.user.lastName}
                    </span>
                    <span>•</span>
                    <span>{ticket.user.email}</span>
                    <span>•</span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {ticket.messages.length > 0 && (
                    <p className="text-text-secondary text-sm line-clamp-2">
                      {ticket.messages[0].message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span className="text-text-secondary text-sm">
                    {ticket.messages.length} message
                    {ticket.messages.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-background-secondary border border-border rounded-xl p-12 text-center text-text-secondary">
            No support tickets found
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        selectedTicket.priority
                      )}`}
                    >
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="p-2 hover:bg-background-primary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateTicketStatus(selectedTicket.id, "IN_PROGRESS")
                  }
                  disabled={selectedTicket.status === "IN_PROGRESS"}
                  className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm hover:bg-accent-blue/90 transition-all disabled:opacity-50"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() =>
                    updateTicketStatus(selectedTicket.id, "RESOLVED")
                  }
                  disabled={selectedTicket.status === "RESOLVED"}
                  className="px-4 py-2 bg-accent-green text-white rounded-lg text-sm hover:bg-accent-green/90 transition-all disabled:opacity-50"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() =>
                    updateTicketStatus(selectedTicket.id, "CLOSED")
                  }
                  disabled={selectedTicket.status === "CLOSED"}
                  className="px-4 py-2 bg-background-primary border border-border rounded-lg text-text-primary text-sm hover:border-text-secondary transition-all disabled:opacity-50"
                >
                  Close Ticket
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {ticketMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderRole === "ADMIN"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.senderRole === "ADMIN"
                        ? "bg-accent-gold/20 text-text-primary"
                        : "bg-background-primary border border-border text-text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold">
                        {message.senderRole === "ADMIN"
                          ? "Admin"
                          : `${selectedTicket.user.firstName} ${selectedTicket.user.lastName}`}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Section */}
            {selectedTicket.status !== "CLOSED" && (
              <div className="p-6 border-t border-border">
                <div className="flex gap-3">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors resize-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyMessage.trim()}
                    className="px-6 bg-accent-gold text-white rounded-lg hover:bg-accent-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
