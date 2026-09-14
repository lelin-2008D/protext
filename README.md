# HISAB (हिसाब) 🇳🇵

> **Simple, intelligent personal money tracker built for Nepal.**

Track your daily expenses and income effortlessly in plain language (English or Nepali transliterated). HISAB extracts the amounts, identifies transaction types, categorizes them automatically, updates your available balance in real time, and synchronizes across your iPhone, laptop, and all your devices.

---

## ✨ Features

- 🧠 **Natural Language Transaction Entry**:
  - Type `Coffee 120` ➔ Expense: Rs. 120, Food & Drinks
  - Type `Momo Rs 200` ➔ Expense: Rs. 200, Food & Drinks
  - Type `Paid 50 for bus` ➔ Expense: Rs. 50, Transport
  - Type `Bought books for 450` ➔ Expense: Rs. 450, Education
  - Type `Received salary 15000` ➔ Income: Rs. 15,000, Salary
  - Type `Dad gave me 2000` ➔ Income: Rs. 2,000, Gift
  - Type `Got 500 from freelancing` ➔ Income: Rs. 500, Freelance
- ⚖️ **Single Source of Truth Balance Formula**:
  $$\text{Available Balance} = \text{Starting Balance} + \text{Total Income} - \text{Total Expenses}$$
- 📱 **iPhone & Mobile First (PWA)**:
  - Installable via Safari (*Share ➔ Add to Home Screen*)
  - Safe-area insets & bottom navigation bar
  - Standalone app experience
- ⚡ **Offline-First Synchronization**:
  - Full offline storage via IndexedDB
  - Instant live typing previews
  - Pending sync queue with automatic background sync when internet restores
  - Live sync status badge (`Synced`, `Syncing...`, `Offline`, `Waiting to sync`)
- 📊 **Insightful Expense Analytics**:
  - Interactive category breakdown donut chart (Recharts)
  - Percentage & amount spending distribution
- 🔍 **History, Search & Filters**:
  - Filter by Type (All / Income / Expense), Category, and Search query
  - Full Edit and Delete workflows with confirmation prompts
- ⚙️ **Configurable & Extensible**:
  - Custom starting balance
  - Category manager with custom keyword detection
  - Dark / Light / System theme support
  - 1-click CSV Export for backups
- 🔒 **Secure Backend & Database Architecture**:
  - Small Express API with rate limiting and helmet security headers
  - Supabase PostgreSQL with Row Level Security (RLS)
  - Zero sensitive service keys exposed to browser

---

## 🏛 Architecture

```
  Browser / iPhone PWA
         │
         ▼
  React + Vite Frontend (Tailwind CSS, IndexedDB Cache)
         │
         ▼
  Express API (Node.js + TypeScript)
  ├── Rate Limiter & Auth Middleware
  ├── Rule-based NLP Parser (Extensible for AI)
  └── Transaction & Settings Services
         │
         ▼
  Supabase / PostgreSQL Database (RLS Enabled)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Run Backend & Frontend Locally
```bash
# Start backend (Port 5000)
npm run dev:server

# Start frontend (Port 5173)
npm run dev:client

# Or run both concurrently
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing

### Server Test Suite
Includes rule parser test cases (Nepali and English), authentication isolation, balance recalculations, and API endpoints:
```bash
npm --prefix server test
```

### Client Test Suite
Includes local parser verification and UI helper logic:
```bash
npm --prefix client test
```

---

## 🗄 Database Setup (Supabase / PostgreSQL)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and execute the script in [`supabase/schema.sql`](file:///c:/Users/sanju/OneDrive/Desktop/protext/supabase/schema.sql).
3. Copy your project URL, Anon Key, and Service Role Key.
4. Set backend `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_ORIGIN=http://localhost:5173
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
5. Set client `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_BASE_URL=http://localhost:5000
   ```

---

## 📱 iPhone PWA Installation

1. Open HISAB in Safari on your iPhone.
2. Tap the **Share** button (box with an upward arrow).
3. Tap **Add to Home Screen**.
4. Launch HISAB from your home screen for a full native app experience with offline support.

---

## 🚢 How to Deploy to GitHub Pages

### Option A: 1-Command Deploy (via `gh-pages`)
1. In your project root, run:
   ```bash
   npm run deploy
   ```
   This will automatically build the production client and push it to the `gh-pages` branch on your GitHub repository.

2. In your GitHub repository:
   - Go to **Settings** ➔ **Pages**.
   - Under **Branch**, select `gh-pages` and folder `/ (root)`.
   - Click **Save**.
   - Your app will be live at: `https://<username>.github.io/<repo-name>/`

---

### Option B: Push Source Code to GitHub
1. Stage and commit your changes:
   ```bash
   git add .
   git commit -m "feat: update HISAB"
   ```
2. Push to your repository:
   ```bash
   git push origin master
   ```

---

## ☁️ Backend Deployment
Deploy the `server/` directory to any Node.js hosting platform (e.g. Render, Railway, Fly.io, or VPS) and configure `VITE_API_BASE_URL` on the frontend.
