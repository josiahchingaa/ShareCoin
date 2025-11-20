#!/bin/bash

echo "Populating price cache with all assets..."

curl -s -X POST "https://coinshares.app/api/prices/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [
      "AAPL","MSFT","GOOGL","AMZN","TSLA","NVDA","META","NFLX","AMD","ORCL",
      "CRM","ADBE","INTC","CSCO","IBM","QCOM","TXN","AVGO","NOW","SHOP",
      "JPM","V","MA","BAC","WFC","GS","MS","AXP","BLK","PYPL","SQ","COIN",
      "JNJ","UNH","PFE","ABBV","MRK","LLY","TMO","ABT","BMY","AMGN",
      "WMT","HD","COST","NKE","MCD","SBUX","TGT","LOW","PG","KO","PEP","DIS",
      "XOM","CVX","COP","SLB","EOG",
      "CAT","BA","HON","UPS","RTX","LMT","GE","MMM",
      "T","VZ","TMUS","CMCSA",
      "F","GM","RIVN","LCID",
      "DAL","UAL","AAL","LUV","ABNB","UBER","LYFT",
      "EA","ATVI","TTWO","RBLX","SPOT",
      "BABA","JD","PDD","SNAP","PINS",
      "TSM","ASML","MU","AMAT","LRCX","KLAC","ARM",
      "SNOW","PLTR","DDOG","ZS","CRWD","OKTA","NET","MDB","TEAM","ZM","DOCU",
      "BTC","ETH","BNB","SOL","XRP","ADA","DOGE","AVAX","DOT","MATIC","LINK",
      "UNI","LTC","ATOM","XLM","TRX","ETC","FIL","NEAR","APT","SHIB","ARB",
      "OP","INJ","AAVE","GRT","ALGO","FTM","VET","SAND","MANA","AXS",
      "GOLD","SILVER","OIL","NATGAS","COPPER","PLATINUM"
    ]
  }' | head -c 200

echo ""
echo "Cache population initiated!"
