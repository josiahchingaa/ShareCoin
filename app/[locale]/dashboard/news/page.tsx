"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, DollarSign, Globe, Clock } from "lucide-react";

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

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
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
      <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
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
    </DashboardLayout>
  );
}
