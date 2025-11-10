"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Newspaper, TrendingUp, DollarSign, Globe, ExternalLink, RefreshCw } from "lucide-react";

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

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated" && session?.user?.role !== "CUSTOMER") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  const fetchNews = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const response = await fetch(`/api/news?category=${categoryFilter}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "CUSTOMER") {
      fetchNews();
    }
  }, [session, categoryFilter]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CRYPTO":
        return <TrendingUp className="w-5 h-5" />;
      case "STOCKS":
        return <DollarSign className="w-5 h-5" />;
      case "ECONOMY":
        return <Globe className="w-5 h-5" />;
      default:
        return <Newspaper className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "CRYPTO":
        return "text-accent-blue";
      case "STOCKS":
        return "text-accent-green";
      case "ECONOMY":
        return "text-accent-gold";
      default:
        return "text-text-secondary";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    }
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-background-primary">
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
      <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Market News
              </h1>
              <p className="text-text-secondary">
                Stay informed with the latest financial news and market updates
              </p>
            </div>
            <button
              onClick={() => fetchNews(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-3 bg-background-secondary border border-border rounded-lg text-text-primary hover:border-accent-gold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-3 flex-wrap">
            {["ALL", "CRYPTO", "STOCKS", "ECONOMY"].map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  categoryFilter === category
                    ? "bg-accent-gold text-white"
                    : "bg-background-secondary border border-border text-text-secondary hover:border-accent-gold hover:text-text-primary"
                }`}
              >
                {category === "ALL" ? "All News" : category.charAt(0) + category.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* News Articles */}
        <div className="space-y-6">
          {articles.length > 0 ? (
            articles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-background-secondary border border-border rounded-xl overflow-hidden hover:border-accent-gold transition-all group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  {article.imageUrl && (
                    <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className={`flex-1 p-6 ${!article.imageUrl ? 'md:w-full' : ''}`}>
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          article.category
                        )} bg-background-primary`}
                      >
                        {getCategoryIcon(article.category)}
                        {article.category}
                      </span>
                      <span className="text-text-secondary text-sm">
                        {article.source}
                      </span>
                      <span className="text-text-secondary text-sm">•</span>
                      <span className="text-text-secondary text-sm">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent-gold transition-colors">
                      {article.title}
                    </h2>

                    {/* Description */}
                    {article.description && (
                      <p className="text-text-secondary mb-4 line-clamp-2">
                        {article.description}
                      </p>
                    )}

                    {/* Read More Link */}
                    <div className="flex items-center gap-2 text-accent-gold text-sm font-medium">
                      <span>Read full article</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="bg-background-secondary border border-border rounded-xl p-12 text-center">
              <Newspaper className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No news articles available
              </h3>
              <p className="text-text-secondary mb-6">
                Try refreshing or selecting a different category
              </p>
              <button
                onClick={() => fetchNews(true)}
                className="px-6 py-3 bg-accent-gold text-white rounded-lg hover:bg-accent-gold/90 transition-all"
              >
                Refresh News
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
