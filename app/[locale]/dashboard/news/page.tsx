"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  TrendingUp,
  DollarSign,
  Globe,
  Clock,
  ChevronLeft,
  Home,
  History,
  Settings,
  Download,
  Newspaper,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  imageUrl: string | null;
  publishedAt: string;
}

export default function NewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cryptoArticles, setCryptoArticles] = useState<NewsArticle[]>([]);
  const [stocksArticles, setStocksArticles] = useState<NewsArticle[]>([]);
  const [economyArticles, setEconomyArticles] = useState<NewsArticle[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  const fetchAllNews = useCallback(async (pageNum: number) => {
    if (pageNum > 1) setLoadingMore(true);
    else setLoading(true);

    try {
      // Fetch all 3 categories in parallel
      const [cryptoRes, stocksRes, economyRes] = await Promise.all([
        fetch(`/api/news?category=CRYPTO&page=${pageNum}&limit=10`),
        fetch(`/api/news?category=STOCKS&page=${pageNum}&limit=10`),
        fetch(`/api/news?category=ECONOMY&page=${pageNum}&limit=10`),
      ]);

      const [cryptoData, stocksData, economyData] = await Promise.all([
        cryptoRes.ok ? cryptoRes.json() : { articles: [], pagination: { hasMore: false } },
        stocksRes.ok ? stocksRes.json() : { articles: [], pagination: { hasMore: false } },
        economyRes.ok ? economyRes.json() : { articles: [], pagination: { hasMore: false } },
      ]);

      // API now filters for images, so we get all articles with images
      const cryptoArticlesData = cryptoData.articles || [];
      const stocksArticlesData = stocksData.articles || [];
      const economyArticlesData = economyData.articles || [];

      console.log(`Page ${pageNum}: Crypto=${cryptoArticlesData.length}, Stocks=${stocksArticlesData.length}, Economy=${economyArticlesData.length}`);

      if (pageNum === 1) {
        setCryptoArticles(cryptoArticlesData);
        setStocksArticles(stocksArticlesData);
        setEconomyArticles(economyArticlesData);
      } else {
        setCryptoArticles(prev => [...prev, ...cryptoArticlesData]);
        setStocksArticles(prev => [...prev, ...stocksArticlesData]);
        setEconomyArticles(prev => [...prev, ...economyArticlesData]);
      }

      // Has more if ANY category has more
      const anyHasMore = cryptoData.pagination?.hasMore ||
                        stocksData.pagination?.hasMore ||
                        economyData.pagination?.hasMore;
      setHasMore(anyHasMore);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      fetchAllNews(1);
    }
  }, [session]);

  // Infinite scroll
  useEffect(() => {
    if (!session?.user?.role) return;

    const handleScroll = () => {
      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      const bottomPosition = document.documentElement.offsetHeight - 500;

      console.log(`Scroll: ${Math.round(scrollPosition)} / ${Math.round(bottomPosition)}, hasMore: ${hasMore}, loading: ${loadingMore}, page: ${page}`);

      if (scrollPosition >= bottomPosition) {
        if (!loadingMore && hasMore) {
          console.log(`🚀 Loading page ${page + 1}...`);
          fetchAllNews(page + 1);
        } else {
          console.log(`❌ Cannot load: loadingMore=${loadingMore}, hasMore=${hasMore}`);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page, session, fetchAllNews]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CRYPTO":
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case "STOCKS":
        return <DollarSign className="w-4 h-4 text-primary" />;
      case "ECONOMY":
        return <Globe className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  const renderArticleCard = (article: NewsArticle) => (
    <a
      key={article.id}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="bg-background-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300 h-full">
        {/* Image */}
        {article.imageUrl && (
          <div className="relative h-48 bg-background-elevated overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-2">
            {getCategoryIcon(article.category)}
            <span className="text-xs font-bold text-primary uppercase">
              {article.category}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mb-2 text-xs text-text-tertiary">
            <span className="font-medium">{article.source}</span>
            <span>•</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-text-primary leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-3">
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
              {article.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );

  // Combine all articles from all categories into one array
  const allArticles = [
    ...cryptoArticles,
    ...stocksArticles,
    ...economyArticles,
  ];

  // Distribute articles into rows of 3
  const rows = [];
  for (let i = 0; i < allArticles.length; i += 3) {
    rows.push(allArticles.slice(i, i + 3));
  }

  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const categories = [
    { id: "ALL", label: "All", icon: Newspaper },
    { id: "CRYPTO", label: "Crypto", icon: TrendingUp },
    { id: "STOCKS", label: "Stocks", icon: DollarSign },
    { id: "ECONOMY", label: "Economy", icon: Globe },
  ];

  // Filter articles by category
  const filteredArticles = activeCategory === "ALL"
    ? allArticles
    : allArticles.filter(a => a.category === activeCategory);

  // Mobile skeleton
  const MobileSkeleton = () => (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 h-14 border-b border-[#1A1A1A]" />
      <div className="px-4 py-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#141414] rounded-2xl overflow-hidden border border-[#262626] animate-pulse">
            <div className="h-48 bg-[#262626]" />
            <div className="p-4">
              <div className="h-3 w-20 bg-[#262626] rounded mb-3" />
              <div className="h-5 w-full bg-[#262626] rounded mb-2" />
              <div className="h-5 w-3/4 bg-[#262626] rounded mb-3" />
              <div className="h-4 w-full bg-[#262626] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Mobile article card
  const renderMobileCard = (article: NewsArticle) => (
    <a
      key={article.id}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#141414] rounded-2xl overflow-hidden border border-[#262626] active:scale-[0.98] transition-all"
    >
      {/* Image */}
      {article.imageUrl && (
        <div className="relative h-48 bg-[#1A1A1A] overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              article.category === 'CRYPTO'
                ? 'bg-purple-500/80 text-white'
                : article.category === 'STOCKS'
                ? 'bg-blue-500/80 text-white'
                : 'bg-amber-500/80 text-black'
            }`}>
              {article.category}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-2 text-xs text-[#808080]">
          <span className="font-medium text-[#00FF87]">{article.source}</span>
          <span>•</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold leading-tight mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-sm text-[#808080] leading-relaxed line-clamp-2">
            {article.description}
          </p>
        )}

        {/* Read More */}
        <div className="flex items-center gap-1 mt-3 text-[#00FF87] text-sm font-medium">
          <span>Read more</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
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
          <div className="text-text-primary text-xl">Loading news...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* ==================== MOBILE VIEW ==================== */}
      <div className="lg:hidden min-h-screen bg-[#0A0A0A] pb-[100px]">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-semibold text-white">Market News</h1>
            <button
              onClick={() => fetchAllNews(1)}
              disabled={loading}
              className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#00FF87] text-black"
                    : "bg-[#141414] text-[#B3B3B3] border border-[#262626]"
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-4 text-sm text-[#808080]">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Live updates</span>
            </div>
            <span>•</span>
            <span>{filteredArticles.length} articles</span>
          </div>
        </div>

        {/* News List */}
        <div className="px-4 space-y-4">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => renderMobileCard(article))
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#141414] flex items-center justify-center mb-4">
                <Newspaper className="w-10 h-10 text-[#404040]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No articles found</h3>
              <p className="text-[#808080] text-center text-sm max-w-[250px]">
                {activeCategory !== "ALL"
                  ? `No ${activeCategory.toLowerCase()} news available`
                  : "No news articles available at the moment"}
              </p>
            </div>
          )}
        </div>

        {/* Loading More */}
        {loadingMore && (
          <div className="py-8 flex items-center justify-center gap-2 text-[#808080]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more...</span>
          </div>
        )}

        {/* End of Feed */}
        {!loading && !loadingMore && filteredArticles.length > 0 && !hasMore && (
          <div className="py-8 text-center text-[#808080] text-sm">
            You've reached the end
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
      <div className="hidden lg:block p-4 lg:p-8 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Market News
          </h1>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock className="w-4 h-4" />
            <span>Live updates from Bloomberg, Reuters, CNBC & more</span>
          </div>
        </div>

        {/* News Grid - 3 columns per row */}
        <div className="space-y-6">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {row.map((article) => renderArticleCard(article))}
            </div>
          ))}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-text-secondary">Loading more articles...</span>
            </div>
          </div>
        )}

        {/* No More Articles */}
        {!loading && !loadingMore && rows.length > 0 && !hasMore && (
          <div className="py-12 text-center text-text-secondary">
            You've reached the end of the news feed
          </div>
        )}

        {/* No Articles */}
        {!loading && rows.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-text-secondary text-lg">No articles available</p>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </DashboardLayout>
  );
}
