# RAYANA — Moroccan E-Commerce Platform

**RAYANA** is a high-converting, lightweight, secure, and production-ready single-merchant e-commerce platform specifically tailored for the Moroccan retail market.

Built around high-performing landing pages, independent pack/bundle customization, Cash on Delivery (COD) workflows, local carrier tracking, and authentic review moderation.

---

## 🌟 Key Highlights & Moroccan Market Optimizations

1. **High-Converting Moroccan COD Checkout:**
   - No customer registration or password required.
   - Minimal checkout: Full Name, Phone (normalized +212 Moroccan mobile validation), and searchable Moroccan Cities list (Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, etc.).
   - Authoritative server-side price computation (the client never dictates price).
   - Idempotent order placement preventing accidental double submissions.

2. **Advanced Pack & Bundle Engine:**
   - Single offers, Duo packs (e.g. 2 pieces for 169 MAD), and Trio packs.
   - **Independent Piece Customization:** The customer selects colors and sizes independently for every piece in the pack (e.g. Piece 1: Black / M, Piece 2: Beige / XL).
   - Atomic database transactions with real-time stock deduction and inventory ledger tracking.

3. **Internationalization & Direction (RTL):**
   - French (`fr` - default), Arabic (`ar` - genuine RTL layout `dir="rtl"`), and English (`en`).
   - Moroccan Dirham (`MAD` / `د.م.`) currency formatting.

4. **Structured Landing Page Builder:**
   - Lightweight section-based visual builder: Announcement bar, Hero, Benefits, Pack Selector, COD Checkout Form, Verified Reviews, Guarantee, and FAQs.
   - Version history, draft/preview, instant publish, and page duplication.
   - Design token customization (Moroccan emerald primary `#0F4C3A`, terracotta accent, corner radius).

5. **Moroccan Shipping & COD Reconciliation:**
   - Carrier configuration (Amana Express, Cathedis, OzAleph).
   - Order lifecycle: `NEW` ➔ `CONTACTED` ➔ `CONFIRMED` ➔ `READY` ➔ `SHIPPED` ➔ `DELIVERED` (or `CANCELLED` / `RETURNED`).
   - Financial lifecycle: `UNPAID` ➔ `COLLECTED_BY_CARRIER` ➔ `SETTLED`.
   - 1-click CSV export for courier manifest preparation.
   - Direct COD reconciliation: track collected cash from couriers against shipping fees and bank deposits.

6. **Customer Trust & After-Sales (SAV):**
   - Verified customer reviews through 192-bit cryptographic, time-limited invitation links after delivery.
   - Customer return and size-exchange request portal with secure Order Number + Phone lookup.
   - Complete moderation and decision queue in the admin dashboard.

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions, React 19)
- **Styling:** Tailwind CSS, Material Design 3 tokens, Radix UI primitives, Lucide icons
- **Database:** PostgreSQL 16 + Drizzle ORM (type-safe queries, migrations, atomic transactions)
- **Security:** HTTP-only SameSite cookies, bcryptjs (12 salt rounds), brute-force lockout, parameterized queries
- **Testing:** Vitest (Integration, Unit, and 30-step End-to-End lifecycle tests)
- **Deployment:** Docker, Docker Compose, Caddy Reverse Proxy (Automatic HTTPS, zstd/gzip compression)

---

## 🚀 Quick Start (Development)

### 1. Prerequisites
- Node.js 20+ (v22/v26 tested)
- Docker & Docker Compose (for PostgreSQL)

### 2. Environment Setup
```bash
cp .env.example .env.local
```

### 3. Start Database
```bash
docker run -d --name rayana-postgres -e POSTGRES_USER=rayana -e POSTGRES_PASSWORD=rayana_secret -e POSTGRES_DB=rayana_db -p 5432:5432 postgres:16-alpine
```

### 4. Run Migrations & Seed Data
```bash
# Push SQL migrations to PostgreSQL
npx drizzle-kit migrate

# Seed catalog, flagship product, pack offers, Moroccan carriers & reviews
npx tsx scripts/seed.ts
```

### 5. Run Development Server
```bash
npm run dev
```

Visit:
- **Public Storefront:** [http://localhost:3000/fr](http://localhost:3000/fr)
- **Arabic Storefront (RTL):** [http://localhost:3000/ar](http://localhost:3000/ar)
- **Admin Dashboard:** [http://localhost:3000/fr/admin](http://localhost:3000/fr/admin)
  - **Email:** `admin@rayana.ma`
  - **Password:** `RayanaAdmin2026!Secure`

---

## 🧪 Testing Suite

Run all automated unit and integration tests:
```bash
npx vitest run
```

Test coverage includes:
- `tests/morocco-phone.test.ts`: Moroccan phone number normalization (+212 6xx, 06xx, 07xx, 05xx)
- `tests/order-engine.test.ts`: Pack engine, independent variants, stock deduction, and idempotency
- `tests/auth.test.ts`: Password hashing, session creation, lockout, and revocation
- `tests/full-e2e-scenario.test.ts`: Complete Section 23 30-step end-to-end lifecycle test

---

## 🐳 Production Deployment (Docker + Caddy)

To deploy the entire production stack on a VPS:

```bash
docker compose up -d --build
```

Services started:
1. `rayana-app`: Next.js standalone container (port 3000 internal, non-root user `nextjs`)
2. `rayana-db`: PostgreSQL 16 Alpine with persistent volume `rayana_pgdata`
3. `rayana-proxy`: Caddy server on ports 80/443 with automatic TLS certificate provisioning

### Database Backup & Restore
- **Backup:**
  ```bash
  bash scripts/backup.sh
  ```
- **Restore:**
  ```bash
  bash scripts/restore.sh ./backups/rayana_backup_YYYYMMDD_HHMMSS.sql.gz
  ```
