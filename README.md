# CoinShares - VIP Investor Portal

> **Professional portfolio clarity, without the complexity.**

A private web platform for VIP clients to deposit funds and passively monitor their investments while our team executes all trading decisions on their behalf.

## 🎯 Project Overview

This is a **trust-focused transparency platform** (not a trading platform) that provides institutional-grade portfolio monitoring for high-net-worth individuals who want professional investment management without the complexity of trading interfaces.

### Key Features

- 🎨 **CoinShares-inspired dark theme** - Elegant, institutional aesthetic
- 👥 **Two-role system** - Admin (full access) & Customer (view-only)
- 💰 **Account type selection** - Crypto or Stock portfolio (set during registration)
- 🌍 **Multi-language support** - English, German, French, Spanish
- 📊 **Real-time portfolio tracking** - Performance metrics, P/L analysis
- 📈 **Trade & transaction history** - Full transparency
- 🔐 **KYC workflow** - Document upload and admin approval
- 📧 **Support ticketing system** - Client-admin messaging
- 📝 **Immutable audit trail** - All admin actions logged

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Portfolio charts
- **next-intl** - Internationalization

### Backend
- **Next.js API Routes** - Serverless API
- **PostgreSQL** - Production database
- **Prisma** - Type-safe ORM
- **NextAuth.js** - Authentication
- **Postmark** - Transactional emails

### Infrastructure
- **Domain:** coinshares.app (Namecheap)
- **Hosting:** Ubuntu 22.04 VPS (147.93.123.174)
- **Database:** PostgreSQL 14+ (`coinshares_app`)
- **Repository:** [GitHub](https://github.com/josiahchingaa/ShareCoin)

## 📁 Project Structure

```
coinshares-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Client dashboard
│   ├── (admin)/           # Admin console
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
├── lib/                   # Utilities and helpers
│   └── prisma.ts         # Prisma client singleton
├── prisma/
│   └── schema.prisma     # Database schema (11 tables)
├── public/               # Static assets
├── .env.example          # Environment variables template
├── DATABASE_SCHEMA.md    # Database documentation
├── MASTER_PLAN.md        # Project requirements
└── README.md            # This file
```

## 🗄️ Database Schema

The application uses 11 PostgreSQL tables:

1. **users** - User accounts (Admin & Customer)
2. **portfolios** - Portfolio values and P/L metrics
3. **holdings** - Individual assets in portfolios
4. **trades** - Trading history (admin-executed)
5. **transactions** - Deposits and withdrawals
6. **kyc_documents** - KYC verification files
7. **support_tickets** & **support_messages** - Client-admin communication
8. **watchlist_items** - Favorite assets
9. **activity_logs** - Immutable audit trail
10. **portfolio_snapshots** - Daily portfolio snapshots for charts
11. **news_cache** - Market news (optional)

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed schema documentation.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:josiahchingaa/ShareCoin.git
   cd ShareCoin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

5. **Push database schema** (from server)
   ```bash
   # On the VPS server:
   cd /var/www/coinshares-app
   npm run prisma:push
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:migrate   # Create migration
npm run prisma:studio    # Open Prisma Studio (database GUI)
```

## 🔐 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://admin:PASSWORD@HOST:5432/coinshares_app"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Postmark Email
POSTMARK_API_KEY="your-postmark-api-key"
POSTMARK_FROM_EMAIL="admin@coinshares.app"

# Financial Modeling Prep API
FMP_API_KEY="your-fmp-api-key"
```

## 🌍 Multi-Language Support

The application supports 4 languages:
- 🇬🇧 English (default)
- 🇩🇪 German
- 🇫🇷 French
- 🇪🇸 Spanish

Language can be changed in user settings.

## 🎨 Design System

### Color Palette
- **Background Primary:** `#1a1a1a`
- **Background Secondary:** `#2a2a2a`
- **Text Primary:** `#f5f5f5`
- **Text Secondary:** `#a0a0a0`
- **Accent Green (Gains):** `#00d4aa` / `#22c55e`
- **Accent Red (Losses):** `#ef4444` / `#ff6b6b`
- **Accent Gold (Premium):** `#d4af37` / `#f59e0b`

### Typography
- **Headings:** Inter (clean, modern)
- **Body:** Inter (readability)
- **Numbers:** Tabular numerals (aligned columns)

## 📚 Documentation

- [MASTER_PLAN.md](./MASTER_PLAN.md) - Complete project requirements
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database design documentation

## 🚢 Deployment

### Production Deployment to VPS

1. **SSH into server**
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@147.93.123.174
   ```

2. **Clone repository** (if not exists)
   ```bash
   cd /var/www
   git clone git@github.com:josiahchingaa/ShareCoin.git coinshares-app
   cd coinshares-app
   ```

3. **Install dependencies**
   ```bash
   npm install --production
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

5. **Push database schema**
   ```bash
   npm run prisma:push
   ```

6. **Build application**
   ```bash
   npm run build
   ```

7. **Start with PM2**
   ```bash
   pm2 start npm --name "coinshares-app" -- start
   pm2 save
   ```

8. **Configure Nginx** (separate from senditnow/heatmail)
   ```nginx
   server {
       listen 80;
       server_name coinshares.app www.coinshares.app;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **SSL with Certbot**
   ```bash
   sudo certbot --nginx -d coinshares.app -d www.coinshares.app
   ```

## 🔧 Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Convention
```
type(scope): description

Examples:
feat(auth): add account type selection
fix(portfolio): correct P/L calculation
docs(readme): update deployment instructions
```

## 📝 TODO: Upcoming Features

- [ ] Set up internationalization (i18n)
- [ ] Create authentication pages (login, register, account type selection)
- [ ] Build client dashboard (portfolio, trades, transactions)
- [ ] Build admin console (user management, KYC review)
- [ ] Integrate Financial Modeling Prep API
- [ ] Set up Postmark email templates
- [ ] Add file upload for KYC documents
- [ ] Implement support ticketing system
- [ ] Create AI analytics summaries
- [ ] Add watchlist functionality

## 🐛 Known Issues

- PostgreSQL remote connection disabled (by design for security)
- Prisma migrations must be run from server
- Postmark sender email not yet verified

## 📞 Support

For questions or issues, contact the development team or open an issue on GitHub.

## 📄 License

This project is private and proprietary. All rights reserved.

---

**Built with** ❤️ **by the CoinShares Team**

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*
