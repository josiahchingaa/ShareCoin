# 🎯 CoinShares - Feature Requirements & Requests

**Last Updated:** November 17, 2025
**Status:** Organizing from scratch
**Project:** CoinShares VIP Investor Portal

---

## 📋 CURRENT STATUS

### What's Working:
✅ Site is LIVE at https://coinshares.app
✅ Basic authentication (login/register)
✅ Dashboard with portfolio overview
✅ Watchlist with 20 assets (logos, sparklines)
✅ News feed (single column layout)
✅ Transactions page
✅ Admin panel
✅ Database connected
✅ Green theme (#00FF87)

### What Needs to be Fixed/Changed:
🔴 Browser showing old cached version
🔴 Need 100 assets in watchlist (currently 20)
🔴 Need Bloomberg-style 3-column news layout
🔴 Need yellow/gold accent color (not green)

---

## 🎨 DESIGN REQUIREMENTS

### Color Scheme
- **Primary Background:** Black
- **Accent Color:** Yellow/Gold (specify exact hex: `#________`)
- **Text Colors:**
  - Primary: White
  - Secondary: Gray
- **Button Colors:** Yellow/Gold
- **Chart Colors:** (specify if needed)

### Layout Requirements

#### Watchlist Page:
- [ ] Display 100 popular assets (stocks + crypto + commodities)
- [ ] Show asset logos
- [ ] Show sparkline charts
- [ ] Show 52-week range
- [ ] Show buy/sell buttons (yellow/gold color)
- [ ] Show sentiment indicators
- [ ] Filterable by asset type (All/Stocks/Crypto/Commodities/Currencies)
- [ ] Grid or List view toggle

#### News Page:
- [ ] Bloomberg-style 3-column layout:
  - Column 1: Crypto News
  - Column 2: Stocks News
  - Column 3: Economy News
- [ ] Each column shows 5-10 articles
- [ ] Article cards with:
  - Headline
  - Source
  - Published time
  - Category badge (yellow/gold)
  - Image thumbnail
  - "Read more" link
- [ ] Refresh button to fetch new articles
- [ ] Auto-refresh every 30 minutes

#### Dashboard Page:
- [ ] Portfolio overview chart
- [ ] Total value display (large, prominent)
- [ ] Profit/Loss indicators (green/red)
- [ ] Top holdings list (5-10 assets)
- [ ] Recent transactions (last 5)
- [ ] Quick action buttons (yellow/gold)

#### Other Pages:
- Transactions page: (current design OK? specify changes)
- Settings page: (current design OK? specify changes)
- Support page: (current design OK? specify changes)

---

## ⚡ FUNCTIONALITY REQUIREMENTS

### Must-Have Features:
- [ ] **100 Assets in Watchlist**
  - Mix of: 40 stocks, 30 crypto, 20 commodities, 10 currencies
  - Real logos from Clearbit or similar
  - Real-time or cached prices

- [ ] **3-Column News Layout**
  - Fetch from NewsAPI
  - Separate by category
  - Cache for 30 minutes

- [ ] **Yellow/Gold Theme**
  - Replace all green (#00FF87) with yellow/gold
  - Update buttons, links, accents
  - Update charts and graphs

### Nice-to-Have Features:
- [ ] Export portfolio to PDF
- [ ] Price alerts
- [ ] Email notifications
- [ ] Real-time price updates (WebSocket)
- [ ] Advanced charts with TradingView
- [ ] Mobile responsive design improvements

---

## 🚀 DEPLOYMENT CHECKLIST

When deploying to production:
- [ ] Commit all changes to git
- [ ] Push to GitHub (josiahchingaa/ShareCoin)
- [ ] Create deployment tarball (exclude node_modules, .git, .next)
- [ ] Transfer to server via SCP
- [ ] Extract on server
- [ ] Run `npm install` (if package.json changed)
- [ ] Run `npm run build`
- [ ] Restart PM2: `pm2 restart coinshares`
- [ ] Clear Nginx cache if needed
- [ ] Test in browser (hard refresh: Ctrl+Shift+R)

---

## 📝 SPECIFIC REQUESTS

### Request 1: 100 Assets in Watchlist
**Priority:** HIGH
**Details:**
- Expand from 20 to 100 assets
- Include top stocks: AAPL, MSFT, GOOGL, AMZN, TSLA, etc.
- Include top crypto: BTC, ETH, BNB, SOL, ADA, etc.
- Include commodities: Gold, Silver, Oil, etc.
- Include currencies: EUR/USD, GBP/USD, etc.
- Each with logo, sparkline, 52W range, sentiment

**Files to modify:**
- `app/[locale]/dashboard/watchlist/page.tsx`

---

### Request 2: Bloomberg-Style 3-Column News
**Priority:** HIGH
**Details:**
- Replace single-column layout with 3 columns
- Left: Crypto news (Bitcoin, Ethereum, etc.)
- Center: Stock news (NYSE, NASDAQ, etc.)
- Right: Economy news (GDP, inflation, Fed, etc.)
- Each column independent scroll
- Yellow/gold category badges

**Files to modify:**
- `app/[locale]/dashboard/news/page.tsx`
- `app/api/news/route.ts` (if needed)

---

### Request 3: Yellow/Gold Theme
**Priority:** HIGH
**Details:**
- Replace accent-green (#00FF87) with yellow/gold
- Exact color: (specify hex code: `#________`)
- Update all buttons, links, badges, charts
- Update gradient classes

**Files to modify:**
- `styles/design-system.css`
- `tailwind.config.ts`
- All component files using `accent-green`

---

## 🔧 TECHNICAL NOTES

### Server Information:
- **Server IP:** 147.93.123.174
- **SSH Key:** C:\Users\Admin\.ssh\id_ed25519
- **App Directory:** /var/www/coinshares
- **PM2 Process:** coinshares
- **Nginx Config:** /etc/nginx/sites-available/coinshares.app
- **Database:** PostgreSQL (147.93.123.174:5432)

### Local Development:
- **Directory:** c:\Users\Admin\CascadeProjects\Coinshares App
- **Dev Command:** npm run dev
- **Build Command:** npm run build
- **Port:** 3000 (local), 3000 (server, proxied via Nginx to 443)

### GitHub Repository:
- **Repo:** josiahchingaa/ShareCoin
- **Branch:** main
- **Last Pushed Commit:** 8aacbe5
- **Local Latest:** 6fd7876 (6 commits ahead)

---

## ❓ QUESTIONS TO ANSWER

Before implementing, please specify:

1. **Exact Yellow/Gold Color:**
   - Hex code: `#________`
   - Or choose from:
     - Bitcoin Gold: `#F7931A`
     - Metallic Gold: `#D4AF37`
     - Amber: `#FFBF00`
     - Golden Yellow: `#FFDF00`
     - Your custom: `#________`

2. **100 Assets Breakdown:**
   - How many stocks? (suggested: 40)
   - How many crypto? (suggested: 30)
   - How many commodities? (suggested: 20)
   - How many currencies? (suggested: 10)
   - Specific assets you want included?

3. **News Layout:**
   - How many articles per column? (suggested: 8-10)
   - Should columns be equal width or different?
   - Should there be a "Load More" button?
   - Should articles auto-refresh?

4. **Other Changes:**
   - Any other pages that need updates?
   - Any specific features you remember from before?
   - Any new features you want to add?

---

## 📌 NEXT STEPS

1. **You:** Fill in the questions above (color codes, asset counts, etc.)
2. **Me:** Implement all requested features based on your specifications
3. **Test:** Review locally at http://localhost:3000
4. **Deploy:** Push to production server
5. **Verify:** Hard refresh browser to see changes

---

## 💡 TIPS FOR FUTURE REQUESTS

When adding new requirements:
1. Add them under "SPECIFIC REQUESTS" section
2. Mark priority (HIGH/MEDIUM/LOW)
3. Describe in detail what you want
4. Mention any specific files if you know them
5. Update the checklist when completed

This way, every session will have a clear reference point!

---

**Note:** Keep this file updated as the single source of truth for what you want built.
