import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = "https://newsapi.org/v2/top-headlines";

interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "ALL";

    // Check if we have cached news (less than 30 minutes old)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    let cachedNews = await prisma.newsCache.findMany({
      where: {
        category: category === "ALL" ? undefined : category as any,
        cachedAt: {
          gte: thirtyMinutesAgo,
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 20,
    });

    // If we have cached news, return it
    if (cachedNews.length > 0) {
      return NextResponse.json({ articles: cachedNews, source: "cache" });
    }

    // Otherwise, fetch from NewsAPI
    let newsQuery = "";
    let newsCategory = "";

    switch (category) {
      case "CRYPTO":
        newsQuery = "cryptocurrency OR bitcoin OR ethereum OR blockchain";
        newsCategory = "CRYPTO";
        break;
      case "STOCKS":
        newsQuery = "stock market OR nasdaq OR dow jones OR S&P 500";
        newsCategory = "STOCKS";
        break;
      case "ECONOMY":
        newsCategory = "ECONOMY";
        break;
      default:
        // Mix of business and technology
        newsCategory = "GENERAL";
    }

    const url = new URL(NEWS_API_URL);
    url.searchParams.set("apiKey", NEWS_API_KEY || "");

    if (newsQuery) {
      url.searchParams.set("q", newsQuery);
      url.searchParams.set("category", "business");
    } else if (category === "ECONOMY") {
      url.searchParams.set("category", "business");
    } else {
      url.searchParams.set("category", "business");
    }

    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "20");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error("NewsAPI error:", response.status, response.statusText);

      // Return cached news even if old, or empty array
      if (cachedNews.length === 0) {
        cachedNews = await prisma.newsCache.findMany({
          where: {
            category: category === "ALL" ? undefined : (newsCategory as any),
          },
          orderBy: {
            publishedAt: "desc",
          },
          take: 20,
        });
      }

      return NextResponse.json({
        articles: cachedNews,
        source: "cache_fallback",
        error: "API rate limit reached, showing cached news"
      });
    }

    const data = await response.json();
    const articles: NewsArticle[] = data.articles || [];

    // Cache the news in database
    if (articles.length > 0) {
      // Clear old cache for this category (older than 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.newsCache.deleteMany({
        where: {
          category: newsCategory as any,
          cachedAt: {
            lt: yesterday,
          },
        },
      });

      // Cache new articles
      const cachePromises = articles.map((article) =>
        prisma.newsCache.upsert({
          where: {
            url: article.url,
          },
          create: {
            title: article.title,
            description: article.description || "",
            url: article.url,
            source: article.source.name,
            category: newsCategory as any,
            imageUrl: article.urlToImage,
            publishedAt: new Date(article.publishedAt),
            relatedSymbols: [], // Could be enhanced with AI later
          },
          update: {
            cachedAt: new Date(),
          },
        })
      );

      await Promise.all(cachePromises);

      // Fetch the newly cached articles
      cachedNews = await prisma.newsCache.findMany({
        where: {
          category: category === "ALL" ? undefined : (newsCategory as any),
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 20,
      });
    }

    return NextResponse.json({ articles: cachedNews, source: "api" });
  } catch (error) {
    console.error("Error fetching news:", error);

    // On error, try to return cached news
    try {
      const cachedNews = await prisma.newsCache.findMany({
        orderBy: {
          publishedAt: "desc",
        },
        take: 20,
      });

      return NextResponse.json({
        articles: cachedNews,
        source: "cache_error",
        error: "Failed to fetch fresh news, showing cached content"
      });
    } catch (dbError) {
      return NextResponse.json(
        { error: "Internal server error", articles: [] },
        { status: 500 }
      );
    }
  }
}
