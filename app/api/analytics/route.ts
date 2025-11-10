import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch user's trades for analysis
    const trades = await prisma.trade.findMany({
      where: { userId: session.user.id },
      orderBy: { executedAt: "desc" },
      take: 50, // Last 50 trades
    });

    if (trades.length === 0) {
      return NextResponse.json({
        summary: "No trading activity yet. Once you start trading, AI-powered insights will appear here.",
        topGainers: [],
        topLosers: [],
        recommendations: [],
      });
    }

    // Calculate portfolio metrics
    const holdings = new Map();
    let totalInvested = 0;

    trades.forEach((trade) => {
      const existing = holdings.get(trade.symbol);

      if (trade.tradeType === "BUY") {
        if (existing) {
          existing.quantity += Number(trade.quantity);
          existing.totalInvested += Number(trade.totalValue);
        } else {
          holdings.set(trade.symbol, {
            symbol: trade.symbol,
            name: trade.assetName,
            type: trade.assetType,
            quantity: Number(trade.quantity),
            totalInvested: Number(trade.totalValue),
          });
        }
        totalInvested += Number(trade.totalValue);
      } else if (trade.tradeType === "SELL") {
        if (existing) {
          existing.quantity -= Number(trade.quantity);
          if (existing.quantity <= 0) {
            holdings.delete(trade.symbol);
          }
        }
      }
    });

    // Prepare data for AI analysis
    const holdingsArray = Array.from(holdings.values()).filter(
      (h) => h.quantity > 0
    );

    const portfolioSummary = {
      totalAssets: holdingsArray.length,
      totalInvested: totalInvested.toFixed(2),
      totalTrades: trades.length,
      recentTrades: trades.slice(0, 10).map((t) => ({
        type: t.tradeType,
        asset: t.assetName,
        symbol: t.symbol,
        quantity: Number(t.quantity),
        value: Number(t.totalValue),
        date: t.executedAt.toISOString().split("T")[0],
      })),
      holdings: holdingsArray.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        type: h.type,
        invested: h.totalInvested.toFixed(2),
      })),
    };

    // Create AI prompt
    const prompt = `You are a professional financial analyst providing portfolio insights. Analyze this investment portfolio and provide a concise, professional summary.

Portfolio Data:
- Total Assets: ${portfolioSummary.totalAssets}
- Total Invested: $${portfolioSummary.totalInvested}
- Total Trades: ${portfolioSummary.totalTrades}

Current Holdings:
${portfolioSummary.holdings.map((h) => `- ${h.name} (${h.symbol}): $${h.invested} invested`).join("\n")}

Recent Trades:
${portfolioSummary.recentTrades
  .map((t) => `- ${t.type} ${t.quantity} ${t.asset} on ${t.date}`)
  .join("\n")}

Provide a professional analysis in this exact format:

**Portfolio Summary**
[2-3 sentences about overall portfolio health and activity]

**Key Observations**
- [First observation]
- [Second observation]
- [Third observation]

**Portfolio Composition**
[Brief analysis of asset allocation and diversification]

**Recent Activity**
[Summary of recent trading patterns]

Keep it concise, professional, and investor-friendly. No jargon, no trading advice.`;

    // Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a professional financial analyst. Provide clear, concise portfolio insights without giving trading advice.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("Groq API error:", response.status, response.statusText);
      return NextResponse.json({
        summary:
          "AI analysis temporarily unavailable. Your portfolio contains " +
          holdingsArray.length +
          " assets with a total investment of $" +
          totalInvested.toFixed(2) +
          ".",
        error: "AI service unavailable",
      });
    }

    const data = await response.json();
    const aiSummary = data.choices[0]?.message?.content || "No analysis available";

    // Find top performers (by invested amount)
    const topAssets = holdingsArray
      .sort((a, b) => b.totalInvested - a.totalInvested)
      .slice(0, 5);

    return NextResponse.json({
      summary: aiSummary,
      topHoldings: topAssets.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        type: h.type,
        invested: h.totalInvested.toFixed(2),
      })),
      metrics: {
        totalAssets: holdingsArray.length,
        totalInvested: totalInvested.toFixed(2),
        totalTrades: trades.length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
}
