# Deployment Process & Architecture: HISAB

This document details the exact, verified deployment procedures, hosting infrastructure, prerequisites, verification checks, and known deployment failure points for the **HISAB** application.

---

## 1. Actual Deployment Architecture

```
                          ┌────────────────────────────────────────────────────────┐
                          │                      GITHUB                            │
                          │                                                        │
                          │  1. Push to 'main' branch                              │
                          │  2. GitHub Actions (.github/workflows/deploy.yml)     │
                          │     ├── Checkout repository                            │
                          │     ├── Setup Node.js 20                               │
                          │     ├── Build client (Vite + Tailwind + PWA)           │
                          │     │   └── Injects VITE_SUPABASE_* secrets            │
                          │     └── Deploy via actions/deploy-pages@v4             │
                          │                                                        │
                          └──────────────────────────┬─────────────────────────────┘
                                                     │
                                                     ▼
                                      ┌──────────────────────────────┐
                                      │        GITHUB PAGES          │
                                      │   (Static Frontend Hosting)  │
                                      │  https://<user>.github.io/   │
                                      │          /protext/           │
                                      └──────────────┬───────────────┘
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             │                                               │
                             ▼                                               ▼
              ┌─────────────────────────────┐                 ┌─────────────────────────────┐
              │      SUPABASE CLOUD         │                 │    NODE.JS BACKEND API      │
              │ (Auth + PostgreSQL Database)│                 │   (Optional / Unhosted)     │
              │  - User Auth (JWT)          │                 │  - Express REST API         │
              │  - Row Level Security (RLS) │                 │  - Port 5000 / Dynamic      │
              │  - Tables: transactions,    │                 │  - Rate Limiter & Helmet    │
              │    categories, friends, etc.│                 │  - [NEEDS HOSTING SETUP]    │
              └─────────────────────────────┘                 └─────────────────────────────┘
```

---

## 2. Deployment Prerequisites

### 2.1 For Frontend Deployment (GitHub Pages)
1. **GitHub Repository Settings**:
   - Navigate to **Settings** ➔ **Pages**.
   - Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
2. **GitHub Repository Secrets**:
   The following secrets must be defined under **Settings** ➔ **Secrets and variables** ➔ **Actions**:
   - `VITE_SUPABASE_URL`: e.g. `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anonymous API key

### 2.2 For Database Setup (Supabase)
1. A Supabase project created on [supabase.com](https://supabase.com).
2. SQL script from [`supabase/schema.sql`](file:///c:/Users/sanju/OneDrive/Desktop/protext/supabase/schema.sql) executed in the Supabase SQL Editor.

### 2.3 For Backend Deployment (Node.js API)
- A Node.js hosting platform account (e.g. Render, Railway, Fly.io, or VPS).
- Note: Backend deployment is currently **manual/external** (no CI/CD workflow exists in the repository for the backend).

---

## 3. Exact Verified Deployment Steps

### Method A: Automated GitHub Actions Deployment (Recommended)

1. **Commit and push changes to `main` branch**:
   ```bash
   git add .
   git commit -m "chore: release version X.Y.Z"
   git push origin main
   ```
2. **Monitor Workflow**:
   - Open GitHub repository ➔ **Actions** tab.
   - Select workflow **Deploy Frontend to GitHub Pages**.
   - Verify all jobs complete successfully:
     - `Checkout Repository`
     - `Setup Node.js`
     - `Install Client Dependencies`
     - `Build React Frontend`
     - `Upload Pages Artifact`
     - `Deploy to GitHub Pages`
3. **Access Live Application**:
   - URL: `https://lelin-2008D.github.io/protext/` (or repository owner URL).

---

### Method B: Manual CLI Deployment via `gh-pages`

The root and client `package.json` contain a manual deployment script using the `gh-pages` package:

1. **Build and Deploy**:
   ```bash
   # From repository root:
   npm run deploy
   ```
   *Execution trace:*
   - Runs `npm --prefix client run deploy`.
   - Executes `npm run build` (runs `tsc` and `vite build`).
   - Executes `gh-pages -d dist`, pushing the compiled `dist/` directory to the `gh-pages` branch on the remote GitHub repository.
2. **Configure GitHub Pages Branch**:
   - In GitHub Settings ➔ Pages, set Source to **Deploy from a branch** ➔ select `gh-pages` branch with `/ (root)` folder.

---

### Method C: Database Schema Deployment (Supabase)

Because automated database migrations (e.g. Prisma, Flyway, Supabase CLI) are **not configured** in this repository:

1. Open the [Supabase Dashboard](https://app.supabase.com).
2. Navigate to your project ➔ **SQL Editor**.
3. Create a new query, paste the entire contents of [`supabase/schema.sql`](file:///c:/Users/sanju/OneDrive/Desktop/protext/supabase/schema.sql), and click **Run**.
4. Confirm tables created:
   - `public.profiles`
   - `public.settings`
   - `public.categories`
   - `public.transactions`
   - `public.friends`
   - `public.friend_money_entries`
5. Confirm triggers created:
   - `on_auth_user_created` on `auth.users` executing `public.handle_new_user()`.
6. Confirm RLS is enabled on all 6 tables.

---

### Method D: Backend API Deployment (Manual)

If hosting the Express server independently:

1. Connect the repository `server/` root to your platform (e.g. Render Web Service).
2. Set configuration:
   - **Environment**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (runs `node dist/index.js`)
3. Set environment variables:
   - `PORT=5000` (or platform default `$PORT`)
   - `NODE_ENV=production`
   - `CLIENT_ORIGIN=https://lelin-2008D.github.io`
   - `SUPABASE_URL=https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
4. Update frontend:
   - Add `VITE_API_BASE_URL=https://your-backend.onrender.com` to GitHub Actions secrets or frontend `.env`.

---

## 4. Health Checks & Verification Steps

| Check Target | Method | Expected Result |
| :--- | :--- | :--- |
| **Frontend PWA Availability** | `curl -I https://lelin-2008D.github.io/protext/` | HTTP `200 OK`, `content-type: text/html` |
| **PWA Service Worker** | `curl -I https://lelin-2008D.github.io/protext/sw.js` | HTTP `200 OK`, `content-type: application/javascript` |
| **Backend Health Endpoint** | `curl https://<backend-host>/api/health` | `{"success": true, "data": {"status": "healthy", "service": "HISAB API", ...}}` |
| **Supabase Connectivity** | Authenticate via HISAB login modal | Session created, user profile initialized in `public.profiles` |
| **Offline Sync Cache** | Inspect DevTools ➔ Application ➔ IndexedDB | `hisab_db` created with object stores: `transactions`, `categories`, `settings`, `friends`, `syncQueue` |

---

## 5. Common Deployment Failure Points Found in Project

1. **Incorrect Base Path (`base`) on GitHub Pages**:
   - In `client/vite.config.ts`, `base` is hardcoded to `/protext/` when `GITHUB_ACTIONS || NODE_ENV === 'production'`.
   - **Failure Point**: If the repository is renamed, forked under another name, or deployed to a custom root domain (e.g. `https://myhisab.com/`), assets will return HTTP 404 because they look for `/protext/assets/...`.
   - **Mitigation**: Update `base` in `client/vite.config.ts` if deploying to a custom domain or different repository name.

2. **Missing GitHub Action Secrets**:
   - If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not set in GitHub repository secrets, Vite builds with empty strings.
   - **Failure Point**: The frontend falls back to offline-only guest mode; cloud sync and Supabase auth will not function.

3. **CORS Rejection on Backend API**:
   - `server/src/app.ts` strictly validates origins in production:
     `origin.endsWith('.github.io') || allowedOrigins.includes(origin)`.
   - **Failure Point**: If frontend is deployed on a custom domain without setting `CLIENT_ORIGIN` in backend environment variables, API requests will fail with `Origin <origin> not allowed by CORS`.

4. **Missing Database Tables / Schema Divergence**:
   - Code in `client/src/lib/api.ts` specifically handles `isMissingTableError` (`code === 'PGRST205' || code === '42P01'`).
   - **Failure Point**: If a developer adds a feature (like `friends` or `starting_balance`) and commits code without running the SQL updates in Supabase, the frontend gracefully falls back to local storage, masking that the cloud database is broken.

5. **Old Service Worker Cache Stale Assets**:
   - The PWA registers `workbox` with `skipWaiting: true` and `clientsClaim: true`.
   - **Failure Point**: Users may need one page reload after a new deployment for the latest bundle to take active control.
