"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, ReactNode } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  History,
  Settings,
  HelpCircle,
  LogOut,
  TrendingUp,
  Star,
  Newspaper,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const navLinks = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: t("title"),
      exact: true,
    },
    {
      href: "/dashboard/watchlist",
      icon: Star,
      label: "Watchlist",
    },
    {
      href: "/dashboard/news",
      icon: Newspaper,
      label: "Market News",
    },
    {
      href: "/dashboard/transactions",
      icon: History,
      label: "Transactions",
    },
    {
      href: "/dashboard/trades",
      icon: TrendingUp,
      label: "Trade History",
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      label: "Settings",
    },
    {
      href: "/dashboard/support",
      icon: HelpCircle,
      label: "Support",
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-gradient-gold">
              {tCommon("appName")}
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              {session?.user?.email}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = link.exact
                ? pathname === link.href
                : isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-accent-gold/20 text-accent-gold font-medium"
                      : "text-text-secondary hover:bg-background-primary"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-accent-red hover:bg-accent-red/10 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              {tAuth("logout")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-background-secondary border-b border-border p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gradient-gold">
            {tCommon("appName")}
          </h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-text-primary"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Page Content */}
        {children}
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
