# Rafaab — Setup, Local Development & Deployment Guide

## 📦 Getting the Code onto Your Local Machine (VS Code)

### Option A: Download as ZIP (easiest)
If your platform has a file browser/download feature in the preview panel, download the entire project folder as a ZIP, then:
1. Unzip it somewhere like `C:\Projects\rafaab` (Windows) or `~/Projects/rafaab` (Mac/Linux)
2. Open VS Code → File → Open Folder → select the `rafaab` folder

### Option B: Clone via Git (best for keeping in sync)
In this sandbox, initialize git and push to your GitHub, then clone locally:

```bash
# 1. In the sandbox terminal:
cd /home/z/my-project
git init
git add -A
git commit -m "Rafaab e-commerce platform"

# 2. Create an empty repo on github.com (don't add a README)
# 3. Push to it:
git remote add origin https://github.com/YOUR_USERNAME/rafaab.git
git branch -M main
git push -u origin main

# 4. On your local machine:
git clone https://github.com/YOUR_USERNAME/rafaab.git
cd rafaab
```

### Then install dependencies & run locally:
```bash
bun install          # or: npm install
bun run db:push      # creates the SQLite database
bun run prisma/seed.ts   # seeds products, categories, demo users
bun run dev          # starts on http://localhost:3000
```

**Demo accounts (seeded):**
- Customer: `demo@rafaab.com` / `demo1234`
- Admin/Seller: `admin@rafaab.com` / `admin1234`

---

## 💳 Paystack Payment Setup (FREE test keys)

1. Go to **https://paystack.com** → Sign up (free, no card required)
2. Dashboard → **Settings → API Keys & Webhooks**
3. Copy your **Test** Secret Key (`sk_test_...`) and **Test** Public Key (`pk_test_...`)
4. Paste them into your `.env` file:
   ```
   PAYSTACK_SECRET_KEY=sk_test_your_real_key_here
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_real_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
5. In your Paystack dashboard, set the **Callback URL** to your deployed URL (e.g. `https://your-app.vercel.app`)

**Test cards** (Paystack test mode):
- Successful: `4084 0840 8408 4081`, any future expiry, any CVV
- Declined: `4084 0840 8408 4080`

When ready to go live: verify your business on Paystack, then swap the test keys for **live** keys (`sk_live_...`).

---

## 🚀 Free Deployment Options

### ⚠️ Important: SQLite vs Serverless
This project currently uses **SQLite** (a local file). Serverless platforms (Vercel, Netlify) reset their filesystem on every request, so **SQLite won't persist data there**. You have two paths:

### Path 1: Vercel + PostgreSQL (recommended, 100% free tier)

**Step 1 — Get a free PostgreSQL database:**
- Go to **https://neon.tech** or **https://supabase.com** (both free)
- Create a project → copy the connection string (looks like `postgresql://user:pass@host/db`)

**Step 2 — Switch Prisma to PostgreSQL:**
In `prisma/schema.prisma`, change:
```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```
Then in your `.env`:
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```
Run:
```bash
bun run db:push
bun run prisma/seed.ts
```

**Step 3 — Deploy to Vercel:**
1. Push your code to GitHub (see Option B above)
2. Go to **https://vercel.com** → Sign in with GitHub → New Project
3. Import your `rafaab` repo
4. Add Environment Variables (Settings → Environment Variables):
   - `DATABASE_URL` = your PostgreSQL connection string
   - `PAYSTACK_SECRET_KEY` = `sk_test_...`
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` = `pk_test_...`
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
5. Deploy → Vercel auto-builds and gives you a free `*.vercel.app` URL

**Free tier limits:** Vercel Hobby = 100GB bandwidth, 1000 builds/month. Neon free = 0.5GB storage, always available. More than enough for starting out.

### Path 2: Railway (easiest, has free trial)

1. Go to **https://railway.app** → Sign in with GitHub
2. New Project → Deploy from GitHub repo → select `rafaab`
3. Add a PostgreSQL database: New → Database → PostgreSQL
4. Railway gives you a `DATABASE_URL` — connect it to your app
5. Set the same env vars as above
6. Railway auto-deploys on every git push

**Note:** Railway's free trial gives ~$5 credit (~500 hours). After that it's ~$5/month.

### Path 3: Render (free tier with caveats)

1. **https://render.com** → New → Web Service → connect GitHub
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add a PostgreSQL database (Render has free PostgreSQL for 90 days)
5. Add env vars

**Free tier:** Web services spin down after 15 min of inactivity (cold starts ~30s).

---

## 📁 Project Structure

```
rafaab/
├── prisma/
│   ├── schema.prisma       # Database models
│   └── seed.ts             # Seeds products, users, orders
├── src/
│   ├── app/
│   │   ├── page.tsx        # Main SPA entry (single / route)
│   │   ├── layout.tsx      # Root layout + theme provider
│   │   ├── globals.css     # Rafaab brand theme
│   │   └── api/            # All API routes
│   │       ├── products/   # Product CRUD + filtering
│   │       ├── orders/     # Order creation + tracking
│   │       ├── paystack/   # ← initialize + verify payment
│   │       ├── admin/      # Seller dashboard APIs
│   │       ├── ai-chat/    # AI shopping assistant (LLM)
│   │       └── auth/       # Login/register/session
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   └── rafaab/         # Custom components (header, footer, views)
│   └── lib/                # Shared utilities (db, auth, paystack, store)
├── package.json
└── .env                    # Your secrets (never commit this!)
```

---

## 🔄 Keeping Your Local & Deployed Versions in Sync

```bash
# Make changes locally → push to GitHub
git add -A
git commit -m "your change"
git push

# Vercel/Railway auto-deploys from GitHub
# Pull changes back to sandbox:
git pull
```

---

## 💰 Cost Summary

| Platform | Free Tier | Paid When |
|----------|-----------|-----------|
| **Vercel** | Hobby (free forever) | You need team features / high traffic |
| **Neon** (PostgreSQL) | Free 0.5GB | You need >0.5GB data |
| **Supabase** (PostgreSQL) | Free 500MB | You need >500MB or high API usage |
| **Paystack** | Free (test mode) | 1.5% per live transaction (only when you make sales!) |
| **GitHub** | Free (public + private repos) | You need advanced CI/CD |

**Total to start: ₦0** — you only pay Paystack's 1.5% when a customer actually pays you. That's the beauty of it.
