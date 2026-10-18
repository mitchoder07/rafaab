# Rafaab: Shop Smarter, Live Better 🛒
Rafaab is a premium, full-stack e-commerce marketplace designed to give Nigerians a smarter, faster, and more enjoyable shopping experience.

Built from scratch, Rafaab isn't just a store. It's a multi-vendor platform that combines the best ideas from major marketplaces and elevates them with AI, real-time tracking, and a seamless seller dashboard.

# 🚀 Key Features
🤖 AI-Powered Shopping Assistant (Rafi): A built-in AI assistant (powered by Gemini 2.0 Flash) that doesn't just help you find products. It answers ANY question, from product recommendations to coding advice. It's like having ChatGPT integrated directly into the shopping experience.

🏪 Multi-Seller Marketplace: Anyone can become a seller. Sellers get a dedicated dashboard to manage products, track orders, monitor earnings, and request payouts. Admins have a central panel to approve applications, set commission rates, and manage the platform.

📦 Real-Time Order Tracking: Customers get a visual tracking timeline for every order, from "Order Placed" through "Processing," "Shipped," "Out for Delivery," to "Delivered."

⚡ Flash Sales with Live Countdowns: Time-limited deals with real-time countdown timers that create urgency and excitement, fully manageable by sellers and admins.

💳 Full Payment Integration: Secure card payments via Paystack, alongside support for bank transfers and cash on delivery. The platform automatically calculates commissions (10% platform fee, 90% to sellers) and manages payout releases.

🌗 Dark/Light Mode & Fully Responsive: A polished, modern UI built with Tailwind CSS and Framer Motion, ensuring a flawless experience on both mobile and desktop.

# 🛠 Tech Stack
Frontend:

Next.js 16 (App Router)

React 19

TypeScript

Tailwind CSS

shadcn/ui (Component Library)

Zustand (State Management)

Framer Motion (Animations)

Backend & Database:

Next.js API Routes

Prisma ORM

PostgreSQL (hosted on Neon)

# AI & Integrations:

Gemini 2.0 Flash (via OpenAI-compatible API)

Paystack (Payments)

# Deployment:

Vercel

# 📂 Project Structure
text
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── (auth)/           # Authentication routes
│   ├── (shop)/           # Customer-facing storefront
│   ├── admin/            # Admin dashboard
│   ├── seller/           # Seller dashboard
│   └── api/              # Backend API endpoints
├── components/           # Reusable UI components (shadcn/ui)
├── lib/                  # Utility functions, Prisma client, AI config
├── prisma/               # Database schema and migrations
└── public/               # Static assets
💻 Getting Started (Local Development)
Prerequisites
Node.js (v18 or higher)

PostgreSQL database (or a Neon account)

Paystack API Keys

Gemini API Key

Installation
Clone the repository:

# bash
git clone https://github.com/mitchoder07/rafaab.git
cd rafaab
Install dependencies:

bash:
npm install
Set up environment variables:
Create a .env file in the root directory and add the following:

env:
DATABASE_URL="your_postgresql_connection_string"
NEXTAUTH_SECRET="your_nextauth_secret"
PAYSTACK_SECRET_KEY="your_paystack_secret_key"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="your_paystack_public_key"
GEMINI_API_KEY="your_gemini_api_key"
Initialize the database:

bash
npx prisma generate
npx prisma db push
Run the development server:

bash
npm run dev
Open http://localhost:3000 in your browser.

🔐 Demo Accounts
To test the platform without creating a new account, use these credentials:

# Role	Email	Password
Customer	demo@rafaab.com	demo1234
Seller	seller1@rafaab.com	seller1234
Admin	admin@rafaab.com	admin1234
# 🌍 Live Demo:
Check out the live deployment here: https://rafaab.vercel.app

# 🤝 Contributing:
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

# 📝 License:
This project is licensed under the MIT License.

# 🤖 Built by Abdullah Yusuf (Upin)
Frontend Engineer & UI/UX Designer

Portfolio: https://up1n-portfolio.vercel.app

LinkedIn: https://www.linkedin.com/in/abdullah-yusuf-83a524440

GitHub: https://github.com/mitchoder07
