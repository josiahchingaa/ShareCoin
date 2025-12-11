"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  ChevronLeft,
  Home,
  History,
  Settings,
  Download,
  TrendingUp,
  ArrowLeft,
  Headphones,
  MessageCircle,
} from "lucide-react";

interface SupportMessage {
  id: string;
  senderId: string;
  senderRole: "ADMIN" | "CUSTOMER";
  message: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH";
  category: string | null;
  createdAt: string;
  updatedAt: string;
  lastReplyAt: string | null;
  closedAt: string | null;
  messages: SupportMessage[];
}

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("support");
  const tCommon = useTranslations("common");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "NORMAL" as "LOW" | "NORMAL" | "HIGH",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch("/api/support/tickets");
        if (response.ok) {
          const data = await response.json();
          setTickets(data.tickets);
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "CUSTOMER") {
      fetchTickets();
    }
  }, [session]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });

      if (response.ok) {
        const data = await response.json();
        setTickets([data.ticket, ...tickets]);
        setNewTicket({ subject: "", message: "", priority: "NORMAL" });
        setShowNewTicketForm(false);
      }
    } catch (error) {
      console.error("Failed to create ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
        setReplyMessage("");
        // Update ticket in list
        setTickets(
          tickets.map((t) => (t.id === selectedTicket.id ? data.ticket : t))
        );
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  // Mobile views state
  const [mobileView, setMobileView] = useState<'list' | 'detail' | 'new'>('list');

  // Mobile skeleton
  const MobileSkeleton = () => (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 h-14 border-b border-[#1A1A1A]" />
      <div className="px-4 py-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#141414] rounded-2xl p-4 border border-[#262626] animate-pulse">
            <div className="flex items-start justify-between mb-2">
              <div className="h-5 w-40 bg-[#262626] rounded" />
              <div className="h-6 w-16 bg-[#262626] rounded-full" />
            </div>
            <div className="h-4 w-full bg-[#262626] rounded mb-2" />
            <div className="h-3 w-24 bg-[#262626] rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        {/* Mobile Loading */}
        <div className="lg:hidden">
          <MobileSkeleton />
        </div>
        {/* Desktop Loading */}
        <div className="hidden lg:flex min-h-screen items-center justify-center">
          <div className="text-text-primary text-xl">{tCommon("loading")}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  // Mobile ticket detail view
  const MobileTicketDetail = () => (
    <div className="min-h-screen bg-[#0A0A0A] pb-[100px]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => {
              setMobileView('list');
              setSelectedTicket(null);
            }}
            className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white truncate max-w-[200px]">
            {selectedTicket?.subject || 'Ticket'}
          </h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            selectedTicket?.status === 'OPEN'
              ? 'bg-[#00FF87]/20 text-[#00FF87]'
              : 'bg-[#808080]/20 text-[#808080]'
          }`}>
            {selectedTicket?.status}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-4 space-y-3" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
        {selectedTicket?.messages.map((msg) => {
          const isAdmin = msg.senderRole === "ADMIN";
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] ${
                isAdmin
                  ? 'bg-[#141414] border border-[#262626]'
                  : 'bg-[#00FF87]/10 border border-[#00FF87]/20'
              } rounded-2xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium ${isAdmin ? 'text-blue-400' : 'text-[#00FF87]'}`}>
                    {isAdmin ? 'Support Team' : 'You'}
                  </span>
                  <span className="text-[10px] text-[#808080]">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-white text-sm">{msg.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Input */}
      {selectedTicket?.status === 'OPEN' && (
        <div className="fixed bottom-[84px] left-0 right-0 px-4 py-3 bg-[#0A0A0A] border-t border-[#1A1A1A]">
          <form onSubmit={handleReply} className="flex gap-2">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-white placeholder-[#808080] focus:outline-none focus:border-[#00FF87]"
            />
            <button
              type="submit"
              className="w-12 h-12 rounded-2xl bg-[#00FF87] flex items-center justify-center"
            >
              <Send className="w-5 h-5 text-black" />
            </button>
          </form>
        </div>
      )}
    </div>
  );

  // Mobile new ticket form
  const MobileNewTicket = () => (
    <div className="min-h-screen bg-[#0A0A0A] pb-[100px]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setMobileView('list')}
            className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">New Ticket</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6">
        <form onSubmit={(e) => {
          handleCreateTicket(e);
          setMobileView('list');
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Subject</label>
            <input
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-white placeholder-[#808080] focus:outline-none focus:border-[#00FF87]"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'NORMAL', 'HIGH'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewTicket({ ...newTicket, priority: p })}
                  className={`py-3 rounded-xl font-medium text-sm transition-all ${
                    newTicket.priority === p
                      ? p === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : p === 'NORMAL' ? 'bg-[#00FF87]/20 text-[#00FF87] border border-[#00FF87]/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-[#141414] text-[#808080] border border-[#262626]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Message</label>
            <textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              className="w-full px-4 py-3 bg-[#141414] border border-[#262626] rounded-2xl text-white placeholder-[#808080] focus:outline-none focus:border-[#00FF87] resize-none"
              rows={8}
              placeholder="Describe your issue in detail..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#00FF87] text-black font-semibold rounded-2xl active:scale-[0.98] transition-transform"
          >
            Submit Ticket
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="lg:hidden min-h-screen bg-[#0A0A0A]">
        {mobileView === 'detail' && selectedTicket ? (
          <MobileTicketDetail />
        ) : mobileView === 'new' ? (
          <MobileNewTicket />
        ) : (
          /* Ticket List */
          <div className="pb-[100px]">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
              <div className="flex items-center justify-between px-4 h-14">
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-lg font-semibold text-white">Support</h1>
                <button
                  onClick={() => setMobileView('new')}
                  className="w-10 h-10 rounded-full bg-[#00FF87] flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="px-4 py-4">
              <div className="flex gap-3">
                <div className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                  <p className="text-[#808080] text-xs mb-1">Open Tickets</p>
                  <p className="text-2xl font-bold text-[#00FF87]">
                    {tickets.filter(t => t.status === 'OPEN').length}
                  </p>
                </div>
                <div className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#262626]">
                  <p className="text-[#808080] text-xs mb-1">Closed</p>
                  <p className="text-2xl font-bold text-white">
                    {tickets.filter(t => t.status === 'CLOSED').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="px-4 space-y-3">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setMobileView('detail');
                    }}
                    className="w-full bg-[#141414] rounded-2xl p-4 border border-[#262626] text-left active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium line-clamp-1 flex-1 mr-3">
                        {ticket.subject}
                      </h4>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'OPEN'
                          ? 'bg-[#00FF87]/20 text-[#00FF87]'
                          : 'bg-[#808080]/20 text-[#808080]'
                      }`}>
                        {ticket.status === 'OPEN' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-[#808080] text-sm line-clamp-2 mb-2">
                      {ticket.messages[0]?.message || 'No message'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#808080]">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-[#00FF87]">
                        {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-[#141414] flex items-center justify-center mb-4">
                    <Headphones className="w-10 h-10 text-[#404040]" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No tickets yet</h3>
                  <p className="text-[#808080] text-center text-sm max-w-[250px] mb-4">
                    Create a support ticket to get help from our team
                  </p>
                  <button
                    onClick={() => setMobileView('new')}
                    className="px-6 py-3 bg-[#00FF87] text-black font-medium rounded-full"
                  >
                    Create Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/[0.08] z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around py-2 px-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2 px-4">
              <Home className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">Home</span>
            </Link>
            <Link href="/dashboard/trades" className="flex flex-col items-center gap-1 py-2 px-4">
              <TrendingUp className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">Trades</span>
            </Link>
            <Link
              href="/dashboard/deposit"
              className="flex items-center justify-center w-12 h-12 -mt-4 rounded-xl bg-gradient-to-br from-accent-green to-emerald-500 shadow-lg shadow-accent-green/30"
            >
              <Download className="w-5 h-5 text-background-main" />
            </Link>
            <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 py-2 px-4">
              <History className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">History</span>
            </Link>
            <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 py-2 px-4">
              <Settings className="w-5 h-5 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary">Settings</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* ==================== DESKTOP VIEW ==================== */}
      <div className="hidden lg:block p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              {t("title")}
            </h2>
            <p className="text-text-secondary">
              Get help from our support team
            </p>
          </div>
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t("newTicket")}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">
                  {t("tickets")}
                </h3>
              </div>

              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full p-4 text-left hover:bg-background-primary transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? "bg-accent-gold/10 border-l-4 border-accent-gold"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-text-primary font-medium line-clamp-1">
                          {ticket.subject}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.status === "OPEN"
                              ? "bg-accent-green/20 text-accent-green"
                              : "bg-text-secondary/20 text-text-secondary"
                          }`}
                        >
                          {ticket.status === "OPEN" ? (
                            <Clock className="w-3 h-3 mr-1" />
                          ) : (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {t(ticket.status.toLowerCase())}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm line-clamp-2 mb-2">
                        {ticket.messages[0]?.message || "No message"}
                      </p>
                      <div className="text-xs text-text-secondary">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-text-secondary">
                    No tickets yet. Create one to get started.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Detail / New Ticket Form */}
          <div className="lg:col-span-2">
            {showNewTicketForm ? (
              <div className="bg-background-secondary border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-text-primary">
                    {t("newTicket")}
                  </h3>
                  <button
                    onClick={() => setShowNewTicketForm(false)}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t("subject")}
                    </label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, subject: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Priority
                    </label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) =>
                        setNewTicket({
                          ...newTicket,
                          priority: e.target.value as "LOW" | "NORMAL" | "HIGH",
                        })
                      }
                      className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t("message")}
                    </label>
                    <textarea
                      value={newTicket.message}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, message: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors resize-none"
                      rows={8}
                      placeholder="Describe your issue in detail..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? tCommon("loading") : tCommon("submit")}
                  </button>
                </form>
              </div>
            ) : selectedTicket ? (
              <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
                {/* Ticket Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-text-primary mb-2">
                        {selectedTicket.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span>
                          Created:{" "}
                          {new Date(selectedTicket.createdAt).toLocaleString()}
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            selectedTicket.status === "OPEN"
                              ? "bg-accent-green/20 text-accent-green"
                              : "bg-text-secondary/20 text-text-secondary"
                          }`}
                        >
                          {t(selectedTicket.status.toLowerCase())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                  {selectedTicket.messages.map((msg) => {
                    const isAdmin = msg.senderRole === "ADMIN";
                    const isCurrentUser = msg.senderId === session.user?.id;

                    return (
                      <div key={msg.id} className="flex gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAdmin
                              ? "bg-accent-blue/20"
                              : "bg-accent-gold/20"
                          }`}
                        >
                          <span
                            className={`font-semibold ${
                              isAdmin ? "text-accent-blue" : "text-accent-gold"
                            }`}
                          >
                            {isAdmin ? "A" : session.user?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-background-primary border border-border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-text-primary">
                                {isAdmin ? "Support Team" : "You"}
                              </span>
                              <span className="text-xs text-text-secondary">
                                {new Date(msg.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-text-primary">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                {selectedTicket.status === "OPEN" && (
                  <div className="p-6 border-t border-border">
                    <form onSubmit={handleReply} className="flex gap-3">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="flex-1 px-4 py-3 bg-background-primary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent-gold transition-colors"
                        placeholder={t("reply")}
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-background-secondary border border-border rounded-xl p-12 text-center">
                <MessageSquare className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  No Ticket Selected
                </h3>
                <p className="text-text-secondary mb-6">
                  Select a ticket from the list or create a new one
                </p>
                <button
                  onClick={() => setShowNewTicketForm(true)}
                  className="px-6 py-3 bg-accent-gold text-background-primary rounded-lg font-medium hover:bg-accent-gold/90 transition-colors"
                >
                  {t("newTicket")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
