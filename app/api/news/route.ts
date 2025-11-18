import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import Parser from "rss-parser";

const prisma = new PrismaClient();
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ]
  }
});

// RSS Feed URLs for different categories
// Note: Only using feeds that provide images
// More feeds = more articles available for infinite scroll
const RSS_FEEDS = {
  CRYPTO: [
    'https://cointelegraph.com/rss',
    'https://cointelegraph.com/rss/category/latest-news',
    'https://cointelegraph.com/rss/category/analysis',
    'https://cointelegraph.com/rss/category/blockchain',
    'https://cointelegraph.com/rss/category/market-analysis',
    'https://decrypt.co/feed',
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://www.theblock.co/rss.xml',
    'https://bitcoinmagazine.com/.rss/full/',
    'https://cryptoslate.com/feed/',
    'https://www.newsbtc.com/feed/',
  ],
  STOCKS: [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.bloomberg.com/technology/news.rss',
    'https://feeds.bloomberg.com/wealth/news.rss',
    'https://feeds.bloomberg.com/companies/news.rss',
    'https://feeds.bloomberg.com/industries/news.rss',
  ],
  ECONOMY: [
    'https://feeds.bloomberg.com/economics/news.rss',
    'https://feeds.bloomberg.com/politics/news.rss',
    'https://feeds.bloomberg.com/businessweek/news.rss',
    'https://feeds.bloomberg.com/bpol/news.rss',
  ],
  ALL: [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://cointelegraph.com/rss',
    'https://decrypt.co/feed',
  ]
};

interface RSSArticle {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  mediaContent?: any;
  mediaThumbnail?: any;
  enclosure?: {
    url: string;
    type: string;
  };
}

function extractImageFromRSS(item: any): string | null {
  // Try multiple methods to extract image

  // Method 1: media:content
  if (item.mediaContent && item.mediaContent.$) {
    return item.mediaContent.$.url;
  }

  // Method 2: media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$) {
    return item.mediaThumbnail.$.url;
  }

  // Method 3: enclosure
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }

  // Method 4: Parse from content
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  // Method 5: Parse from contentSnippet or description
  if (item.contentSnippet) {
    const imgMatch = item.contentSnippet.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  return null;
}

async function fetchRSSFeed(url: string, category: string): Promise<any[]> {
  try {
    console.log(`Fetching RSS feed: ${url}`);
    const feed = await parser.parseURL(url);

    return feed.items.slice(0, 10).map((item: any) => ({
      title: item.title || '',
      description: item.contentSnippet || item.content || '',
      url: item.link || '',
      source: feed.title || new URL(url).hostname,
      category: category,
      imageUrl: extractImageFromRSS(item),
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(item.pubDate || Date.now()),
    }));
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "ALL";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const skip = (page - 1) * limit;

    console.log(`Fetching news for category: ${category}, page: ${page}, limit: ${limit}`);

    // Check if we have cached news (less than 24 hours old for RSS)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get total count for pagination - ONLY articles with images
    const totalCount = await prisma.newsCache.count({
      where: {
        category: category === "ALL" ? undefined : category as any,
        cachedAt: {
          gte: twentyFourHoursAgo,
        },
        imageUrl: {
          not: null,
        },
      },
    });

    let cachedNews = await prisma.newsCache.findMany({
      where: {
        category: category === "ALL" ? undefined : category as any,
        cachedAt: {
          gte: twentyFourHoursAgo,
        },
        imageUrl: {
          not: null,
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      skip: skip,
      take: limit,
    });

    // If we have cached news, return it
    if (cachedNews.length > 0) {
      console.log(`Returning ${cachedNews.length} cached articles`);
      return NextResponse.json({
        articles: cachedNews,
        source: "cache",
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore: skip + cachedNews.length < totalCount
        }
      });
    }

    // Otherwise, fetch from RSS feeds
    console.log("Cache miss, fetching from RSS feeds...");
    const feeds = RSS_FEEDS[category as keyof typeof RSS_FEEDS] || RSS_FEEDS.ALL;

    // Fetch all feeds in parallel
    const feedPromises = feeds.map(feedUrl => fetchRSSFeed(feedUrl, category));
    const feedResults = await Promise.all(feedPromises);

    // Flatten and combine all articles
    let allArticles = feedResults.flat();

    // Remove duplicates by URL and filter articles WITHOUT images
    const seen = new Set();
    allArticles = allArticles.filter(article => {
      if (!article.imageUrl) return false; // Skip articles without images
      if (seen.has(article.url)) return false; // Skip duplicates
      seen.add(article.url);
      return true;
    });

    console.log(`Fetched ${allArticles.length} articles from RSS feeds (after deduplication and image filter)`);

    // Cache the news in database
    if (allArticles.length > 0) {
      // Clear old cache for this category (older than 48 hours to accumulate more articles)
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await prisma.newsCache.deleteMany({
        where: {
          category: category as any,
          cachedAt: {
            lt: twoDaysAgo,
          },
        },
      });

      // Cache new articles
      const cachePromises = allArticles.map((article) =>
        prisma.newsCache.upsert({
          where: {
            url: article.url,
          },
          create: {
            title: article.title,
            description: article.description || "",
            url: article.url,
            source: article.source,
            category: article.category as any,
            imageUrl: article.imageUrl,
            publishedAt: article.publishedAt,
            relatedSymbols: [],
          },
          update: {
            cachedAt: new Date(),
          },
        })
      );

      await Promise.all(cachePromises);

      // Fetch the newly cached articles with pagination - ONLY with images
      const newTotalCount = await prisma.newsCache.count({
        where: {
          category: category === "ALL" ? undefined : (category as any),
          imageUrl: {
            not: null,
          },
        },
      });

      cachedNews = await prisma.newsCache.findMany({
        where: {
          category: category === "ALL" ? undefined : (category as any),
          imageUrl: {
            not: null,
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        skip: skip,
        take: limit,
      });

      console.log(`Returning ${cachedNews.length} articles`);
      return NextResponse.json({
        articles: cachedNews,
        source: "rss",
        pagination: {
          page,
          limit,
          total: newTotalCount,
          hasMore: skip + cachedNews.length < newTotalCount
        }
      });
    }

    console.log(`Returning ${cachedNews.length} articles`);
    return NextResponse.json({
      articles: cachedNews,
      source: "rss",
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false
      }
    });
  } catch (error) {
    console.error("Error fetching news:", error);

    // On error, try to return cached news
    try {
      const cachedNews = await prisma.newsCache.findMany({
        orderBy: {
          publishedAt: "desc",
        },
        take: 30,
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
