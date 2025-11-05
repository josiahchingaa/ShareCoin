# VIP INVESTOR PORTAL — DATABASE SCHEMA
**Version 2.0 | November 2025**

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Database Tables](#database-tables)
3. [Relationships Diagram](#relationships-diagram)
4. [Indexes & Performance](#indexes--performance)
5. [Data Types & Constraints](#data-types--constraints)
6. [Security Considerations](#security-considerations)
7. [Migration Strategy](#migration-strategy)

---

## 🎯 OVERVIEW

### Database: PostgreSQL
**Why PostgreSQL:**
- ACID compliance (critical for financial data)
- Excellent JSON support (flexible for storing metadata)
- Strong audit trail capabilities
- Production-proven reliability
- Already configured and ready to use

### ORM: Prisma
**Benefits:**
- Type-safe database queries
- Automatic migrations
- Excellent developer experience
- Built-in connection pooling

---

## 📊 DATABASE TABLES

### 1. users
**Purpose:** Store all user accounts (both Admin and Customer roles)

```prisma
model User {
  id                String         @id @default(uuid())
  email             String         @unique
  password_hash     String         // bcrypt hashed
  role              Role           @default(CUSTOMER)

  // Personal Information
  first_name        String
  last_name         String
  phone             String?
  address           String?
  city              String?
  country           String?
  nationality       String?
  timezone          String         @default("UTC")
  language          Language       @default(EN)
  profile_photo_url String?

  // Account Configuration
  account_type      AccountType?   // CRYPTO or STOCK (set during registration)

  // KYC Status
  kyc_status        KYCStatus      @default(PENDING)
  kyc_rejection_reason String?
  kyc_approved_at   DateTime?
  kyc_approved_by   String?        // Admin user ID who approved

  // Notification Preferences
  email_weekly_summary      Boolean  @default(true)
  email_trade_alerts        Boolean  @default(true)
  email_transaction_alerts  Boolean  @default(true)
  toast_notifications       Boolean  @default(true)

  // Account Status
  is_active         Boolean        @default(true)
  email_verified    Boolean        @default(false)
  last_login_at     DateTime?

  // Timestamps
  created_at        DateTime       @default(now())
  updated_at        DateTime       @updatedAt

  // Relations
  portfolio         Portfolio?
  trades            Trade[]
  transactions      Transaction[]
  kyc_documents     KYCDocument[]
  support_tickets   SupportTicket[]
  watchlist_items   WatchlistItem[]
  activity_logs     ActivityLog[]

  @@index([email])
  @@index([role])
  @@index([kyc_status])
  @@map("users")
}

enum Role {
  ADMIN
  CUSTOMER
}

enum AccountType {
  CRYPTO    // Deposits/withdrawals in crypto only
  STOCK     // Deposits/withdrawals in fiat only
}

enum Language {
  EN        // English
  DE        // German
  FR        // French
  ES        // Spanish
}

enum KYCStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

### 2. portfolios
**Purpose:** Store each client's portfolio value and performance metrics

```prisma
model Portfolio {
  id                    String    @id @default(uuid())
  user_id               String    @unique
  user                  User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // Current Values (in USD)
  total_value           Decimal   @default(0) @db.Decimal(18, 2)
  crypto_value          Decimal   @default(0) @db.Decimal(18, 2)
  stock_value           Decimal   @default(0) @db.Decimal(18, 2)
  cash_value            Decimal   @default(0) @db.Decimal(18, 2)

  // Performance Metrics (in USD)
  total_invested        Decimal   @default(0) @db.Decimal(18, 2)
  total_profit_loss     Decimal   @default(0) @db.Decimal(18, 2)

  daily_pnl             Decimal   @default(0) @db.Decimal(18, 2)
  daily_pnl_percent     Decimal   @default(0) @db.Decimal(10, 4)

  monthly_pnl           Decimal   @default(0) @db.Decimal(18, 2)
  monthly_pnl_percent   Decimal   @default(0) @db.Decimal(10, 4)

  all_time_pnl          Decimal   @default(0) @db.Decimal(18, 2)
  all_time_pnl_percent  Decimal   @default(0) @db.Decimal(10, 4)

  // Timestamps
  last_updated          DateTime  @default(now())
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  // Relations
  holdings              Holding[]
  portfolio_snapshots   PortfolioSnapshot[]

  @@index([user_id])
  @@map("portfolios")
}
```

---

### 3. holdings
**Purpose:** Store individual assets in each portfolio

```prisma
model Holding {
  id                String      @id @default(uuid())
  portfolio_id      String
  portfolio         Portfolio   @relation(fields: [portfolio_id], references: [id], onDelete: Cascade)

  // Asset Information
  asset_type        AssetType   // CRYPTO or STOCK
  symbol            String      // BTC, ETH, AAPL, TSLA, etc.
  name              String      // Bitcoin, Ethereum, Apple Inc., etc.
  logo_url          String?

  // Holdings Data
  quantity          Decimal     @db.Decimal(18, 8)
  average_buy_price Decimal     @db.Decimal(18, 2)
  current_price     Decimal     @db.Decimal(18, 2)
  total_value       Decimal     @db.Decimal(18, 2)

  // Performance
  profit_loss       Decimal     @db.Decimal(18, 2)
  profit_loss_percent Decimal   @db.Decimal(10, 4)

  // Timestamps
  last_price_update DateTime    @default(now())
  created_at        DateTime    @default(now())
  updated_at        DateTime    @updatedAt

  @@unique([portfolio_id, symbol])
  @@index([portfolio_id])
  @@index([symbol])
  @@map("holdings")
}

enum AssetType {
  CRYPTO
  STOCK
}
```

---

### 4. trades
**Purpose:** Record all trading activity (admin-executed)

```prisma
model Trade {
  id                String      @id @default(uuid())
  user_id           String
  user              User        @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // Trade Details
  trade_type        TradeType   // BUY or SELL
  asset_type        AssetType   // CRYPTO or STOCK
  symbol            String      // BTC, AAPL, etc.
  asset_name        String      // Bitcoin, Apple Inc., etc.

  quantity          Decimal     @db.Decimal(18, 8)
  price_per_unit    Decimal     @db.Decimal(18, 2)
  total_value       Decimal     @db.Decimal(18, 2)

  // Metadata
  admin_note        String?     // Optional explanation (e.g., "Portfolio rebalancing")
  executed_by       String?     // Admin user ID

  // Timestamps
  executed_at       DateTime    @default(now())
  created_at        DateTime    @default(now())

  @@index([user_id])
  @@index([symbol])
  @@index([executed_at])
  @@map("trades")
}

enum TradeType {
  BUY
  SELL
}
```

---

### 5. transactions
**Purpose:** Track deposits and withdrawals

```prisma
model Transaction {
  id                  String              @id @default(uuid())
  user_id             String
  user                User                @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // Transaction Details
  transaction_type    TransactionType     // DEPOSIT or WITHDRAWAL
  amount              Decimal             @db.Decimal(18, 2)
  currency            String              // USD, EUR, BTC, ETH, etc.

  // Method (filtered by account_type)
  method              TransactionMethod

  // Status
  status              TransactionStatus   @default(PENDING)

  // Proof/Receipt
  receipt_url         String?             // Link to bank ref or blockchain TX
  blockchain_tx_id    String?             // For crypto transactions
  bank_reference      String?             // For fiat transactions

  // Metadata
  admin_note          String?
  processed_by        String?             // Admin user ID

  // Timestamps
  processed_at        DateTime?
  created_at          DateTime            @default(now())
  updated_at          DateTime            @updatedAt

  @@index([user_id])
  @@index([status])
  @@index([created_at])
  @@map("transactions")
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
}

enum TransactionMethod {
  WIRE_TRANSFER       // Fiat only
  ACH                 // Fiat only
  CRYPTO_TRANSFER     // Crypto only (BTC, ETH, USDT, etc.)
  CARD                // Fiat only (if added later)
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

### 6. kyc_documents
**Purpose:** Store uploaded KYC verification documents

```prisma
model KYCDocument {
  id                String              @id @default(uuid())
  user_id           String
  user              User                @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // Document Details
  document_type     KYCDocumentType
  file_url          String              // S3/Cloudflare R2 URL
  file_name         String
  file_size         Int                 // bytes
  mime_type         String              // image/jpeg, application/pdf

  // Review Status
  status            KYCDocStatus        @default(PENDING)
  rejection_reason  String?
  reviewed_by       String?             // Admin user ID
  reviewed_at       DateTime?

  // Timestamps
  uploaded_at       DateTime            @default(now())
  created_at        DateTime            @default(now())

  @@index([user_id])
  @@index([status])
  @@map("kyc_documents")
}

enum KYCDocumentType {
  GOVERNMENT_ID         // Passport or Driver's License
  PROOF_OF_ADDRESS      // Utility bill, bank statement
  WEALTH_STATEMENT      // Source of funds
}

enum KYCDocStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

### 7. support_tickets
**Purpose:** Client-admin messaging system

```prisma
model SupportTicket {
  id                String              @id @default(uuid())
  user_id           String
  user              User                @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // Ticket Details
  subject           String
  status            TicketStatus        @default(OPEN)
  priority          TicketPriority      @default(NORMAL)
  category          TicketCategory?

  // Timestamps
  last_reply_at     DateTime?
  closed_at         DateTime?
  created_at        DateTime            @default(now())
  updated_at        DateTime            @updatedAt

  // Relations
  messages          SupportMessage[]

  @@index([user_id])
  @@index([status])
  @@index([created_at])
  @@map("support_tickets")
}

model SupportMessage {
  id                String              @id @default(uuid())
  ticket_id         String
  ticket            SupportTicket       @relation(fields: [ticket_id], references: [id], onDelete: Cascade)

  // Message Details
  sender_id         String              // User ID (could be client or admin)
  sender_role       Role                // ADMIN or CUSTOMER
  message           String              @db.Text

  // Attachments (optional)
  attachment_url    String?
  attachment_name   String?

  // Timestamps
  created_at        DateTime            @default(now())

  @@index([ticket_id])
  @@index([created_at])
  @@map("support_messages")
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum TicketCategory {
  KYC
  BILLING
  TECHNICAL
  GENERAL
}
```

---

### 8. watchlist_items
**Purpose:** Client's favorite/starred assets

```prisma
model WatchlistItem {
  id                String      @id @default(uuid())
  user_id           String
  user              User        @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // Asset Details
  asset_type        AssetType   // CRYPTO or STOCK
  symbol            String      // BTC, AAPL, etc.
  name              String      // Bitcoin, Apple Inc.
  logo_url          String?

  // Timestamps
  added_at          DateTime    @default(now())

  @@unique([user_id, symbol])
  @@index([user_id])
  @@map("watchlist_items")
}
```

---

### 9. activity_logs
**Purpose:** Immutable audit trail for all admin actions

```prisma
model ActivityLog {
  id                String      @id @default(uuid())

  // Actor Information
  actor_id          String?     // Admin user ID (null for system actions)
  actor_role        Role?

  // Action Details
  action_type       ActionType
  target_type       String      // users, trades, transactions, kyc_documents, etc.
  target_id         String?     // ID of affected record

  // Context
  description       String      // Human-readable description
  metadata          Json?       // Before/after values, additional context
  ip_address        String?
  user_agent        String?

  // Timestamps
  created_at        DateTime    @default(now())

  @@index([actor_id])
  @@index([action_type])
  @@index([created_at])
  @@map("activity_logs")
}

enum ActionType {
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  KYC_APPROVED
  KYC_REJECTED
  TRADE_ADDED
  TRANSACTION_ADDED
  TRANSACTION_UPDATED
  PNL_ADJUSTED
  SUPPORT_REPLY
  SETTINGS_CHANGED
  LOGIN
  LOGOUT
}
```

---

### 10. portfolio_snapshots
**Purpose:** Daily snapshots for performance charts

```prisma
model PortfolioSnapshot {
  id                String      @id @default(uuid())
  portfolio_id      String
  portfolio         Portfolio   @relation(fields: [portfolio_id], references: [id], onDelete: Cascade)

  // Snapshot Values (in USD)
  total_value       Decimal     @db.Decimal(18, 2)
  crypto_value      Decimal     @db.Decimal(18, 2)
  stock_value       Decimal     @db.Decimal(18, 2)
  cash_value        Decimal     @db.Decimal(18, 2)

  total_pnl         Decimal     @db.Decimal(18, 2)
  total_pnl_percent Decimal     @db.Decimal(10, 4)

  // Timestamp (daily at midnight UTC)
  snapshot_date     DateTime    @db.Date
  created_at        DateTime    @default(now())

  @@unique([portfolio_id, snapshot_date])
  @@index([portfolio_id])
  @@index([snapshot_date])
  @@map("portfolio_snapshots")
}
```

---

### 11. news_cache (Optional)
**Purpose:** Cache news articles to reduce API calls

```prisma
model NewsCache {
  id                String      @id @default(uuid())

  // Article Details
  title             String
  description       String      @db.Text
  url               String      @unique
  source            String
  category          NewsCategory

  // Asset Relations
  related_symbols   String[]    // Array of symbols (BTC, AAPL, etc.)

  // Image
  image_url         String?

  // Timestamps
  published_at      DateTime
  cached_at         DateTime    @default(now())

  @@index([category])
  @@index([published_at])
  @@map("news_cache")
}

enum NewsCategory {
  CRYPTO
  STOCKS
  ECONOMY
  GENERAL
}
```

---

## 🔗 RELATIONSHIPS DIAGRAM

```
users (1) ─── (1) portfolio
  │
  ├─── (many) trades
  ├─── (many) transactions
  ├─── (many) kyc_documents
  ├─── (many) support_tickets
  ├─── (many) watchlist_items
  └─── (many) activity_logs

portfolio (1) ─── (many) holdings
  └─── (many) portfolio_snapshots

support_tickets (1) ─── (many) support_messages
```

---

## ⚡ INDEXES & PERFORMANCE

### Critical Indexes:
- `users.email` (unique) — Login queries
- `users.role` — Admin/customer filtering
- `users.kyc_status` — KYC queue
- `trades.user_id` — User trade history
- `trades.executed_at` — Chronological sorting
- `transactions.user_id` — User transaction history
- `transactions.status` — Pending transaction queue
- `activity_logs.created_at` — Recent activity
- `portfolio_snapshots.snapshot_date` — Chart data retrieval

### Composite Indexes (for common queries):
- `(portfolio_id, symbol)` on holdings — Prevent duplicate holdings
- `(user_id, symbol)` on watchlist_items — Prevent duplicate watchlist entries
- `(portfolio_id, snapshot_date)` on portfolio_snapshots — Unique daily snapshots

---

## 🔢 DATA TYPES & CONSTRAINTS

### Decimal Precision:
- **Money values:** `Decimal(18, 2)` — Up to $9,999,999,999,999.99
- **Crypto quantities:** `Decimal(18, 8)` — Supports satoshi precision
- **Percentages:** `Decimal(10, 4)` — Up to 999,999.9999%

### Validation Rules:
- Email: Must be valid format + unique
- Passwords: Min 8 chars, hashed with bcrypt (12 rounds)
- Phone: Optional, international format
- Quantities: Must be > 0
- Prices: Must be >= 0
- Account type: Cannot be changed after selection

---

## 🔒 SECURITY CONSIDERATIONS

### Sensitive Data:
- **Passwords:** Hashed with bcrypt (never stored plain)
- **KYC documents:** Stored in private S3 bucket with signed URLs (expire after 1 hour)
- **Personal data:** Address, phone, nationality encrypted at rest
- **Session tokens:** Secure, httpOnly, 24-hour expiry

### Access Control:
- Clients can only query their own data (enforced at API level)
- Admin actions logged in activity_logs (immutable)
- Database backups encrypted
- PostgreSQL connection uses SSL/TLS

---

## 🚀 MIGRATION STRATEGY

### Phase 1: Core Tables
1. Create `users` table
2. Create `portfolios` table
3. Create `holdings` table
4. Create `trades` table
5. Create `transactions` table

### Phase 2: Compliance & Support
6. Create `kyc_documents` table
7. Create `support_tickets` & `support_messages` tables
8. Create `activity_logs` table

### Phase 3: Features & Optimization
9. Create `watchlist_items` table
10. Create `portfolio_snapshots` table
11. Create `news_cache` table (optional)

### Seed Data:
- Create first admin user (email: admin@example.com)
- Sample portfolio types for testing
- Initial KYC statuses

---

## 📝 NOTES FOR DEVELOPERS

### Important:
1. **Never delete data** — Use soft deletes or archive tables
2. **Always log admin actions** in activity_logs
3. **Validate account_type** before processing transactions (crypto clients can't deposit fiat)
4. **Cache portfolio calculations** — Recalculate only when trades/transactions change
5. **Daily snapshots** — Run cron job at midnight UTC to create portfolio_snapshots

### Prisma Best Practices:
- Use transactions for multi-table updates
- Enable query logging in development
- Use `prisma migrate dev` for local development
- Use `prisma migrate deploy` for production
- Always test migrations on staging first

---

**END OF DATABASE SCHEMA**
