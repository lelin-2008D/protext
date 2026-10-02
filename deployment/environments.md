# Environments & Configuration Specification: HISAB

This document outlines the environment configurations, variables, secrets management, and external service dependencies for the **HISAB (हिसाब)** project. All information is strictly verified against codebase files (`package.json`, `client/vite.config.ts`, `client/.env.example`, `server/.env.example`, `server/src/config.ts`, `server/src/app.ts`, and `.github/workflows/deploy.yml`).

---

## 1. Environment Definitions

| Environment | Scope / Architecture | Hosting Infrastructure | Verification Status |
| :--- | :--- | :--- | :--- |
| **Development** | Local full-stack execution (`client` on Vite dev server, `server` on tsx watch, Supabase cloud or local memory store) | Local machine (`localhost`) | **VERIFIED** in `package.json`, `client/vite.config.ts`, `server/src/index.ts` |
| **Staging / Preview** | No formal staging environment or dedicated preview pipeline is defined in repository code | N/A | **VERIFIED ABSENT** (No staging workflows, branches, or configs exist) |
| **Production (Frontend)** | Static Single Page Application (SPA) + Progressive Web App (PWA) compiled to static assets | **GitHub Pages** (`https://lelin-2008D.github.io/protext/`) | **VERIFIED** in `.github/workflows/deploy.yml` & `client/vite.config.ts` |
| **Production (Backend)** | Express Node.js REST API with rate limiting and helmet headers | Node.js hosting platform (e.g. Render, Railway, Fly.io, or VPS) | **UNKNOWN / NEEDS CONFIRMATION** (No hosting provider config exists in repository) |
| **Production (Database)** | Managed PostgreSQL with Row Level Security (RLS) and Auth | **Supabase** cloud instance | **VERIFIED** in `supabase/schema.sql` and `server/src/services/supabase.ts` |

---

## 2. Environment Variables & Purpose

### 2.1 Frontend Variables (`client/`)

Vite exposes environment variables prefixed with `VITE_` to client-side bundles via `import.meta.env`.

| Variable Name | Required | Default / Fallback | Purpose & Behavior in Code |
| :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | **Yes** (for online cloud sync) | None (`undefined`) | Supabase Project REST/Auth API URL (`https://<project>.supabase.co`). Used by `@supabase/supabase-js` in `client/src/lib/supabase.ts`. If unset or dummy (`https://your-project.supabase.co`), client runs in offline-only / guest mode. |
| `VITE_SUPABASE_ANON_KEY` | **Yes** (for online cloud sync) | None (`undefined`) | Public anonymous client API key. Safe for browser distribution. Used to authenticate requests under Supabase Row Level Security (RLS). |
| `VITE_API_BASE_URL` | **No** (Optional) | In dev: `http://localhost:5000`<br>In prod: `""` (empty string) | Root URL for the custom Express backend API (`client/src/lib/api.ts`). In production, if unset, defaults to `""` (relative path) or Supabase direct client calls. |
| `GITHUB_ACTIONS` | Automatic in CI | `undefined` | Set by GitHub Actions runners. Used by `client/vite.config.ts` to set base public path to `/protext/` instead of `/`. |
| `NODE_ENV` | Automatic in build | `development` | Set to `production` during `vite build`. Controls base path resolution and minification. |

### 2.2 Backend Variables (`server/`)

Backend environment variables are loaded via `dotenv` in `server/src/config.ts`.

| Variable Name | Required | Default / Fallback | Purpose & Behavior in Code |
| :--- | :---: | :--- | :--- |
| `PORT` | **No** | `5000` | Port on which the Express HTTP server listens (`server/src/index.ts`). |
| `NODE_ENV` | **No** | `development` | Runtime environment mode. Controls CORS enforcement: in `production`, origin is restricted to `allowedOrigins` or `.github.io` domains (`server/src/app.ts`). |
| `CLIENT_ORIGIN` | **Yes** (in production) | `http://localhost:5173` | Allowed frontend origin for Cross-Origin Resource Sharing (CORS). Must match the deployed frontend URL (`https://lelin-2008D.github.io` or custom domain). |
| `SUPABASE_URL` | **Yes** (for cloud database) | `""` | Supabase project API URL (`https://<project>.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** (for cloud database) | `""` | **CRITICAL SECRET**: Supabase Service Role Key. Bypasses Row Level Security (RLS) for backend operations in `server/src/services/supabase.ts`. **MUST NEVER BE EXPOSED TO THE FRONTEND OR CLIENT REPOSITORY**. |
| `SUPABASE_JWT_SECRET` | **No** (Optional) | `""` | Secret key for verifying Supabase auth JWT signatures locally (`server/src/config.ts`). |

---

## 3. Configuration Differences Across Environments

| Feature / Behavior | Development | Production |
| :--- | :--- | :--- |
| **Vite Base Path (`base`)** | `/` (root) | `/protext/` (repository path on GitHub Pages) |
| **API Proxy** | Vite dev server proxies `/api` requests to `http://localhost:5000` | No local proxy; requests must resolve to `VITE_API_BASE_URL` or direct Supabase client |
| **Server CORS Policy** | Permissive: allows localhost ports `5173`, `3000`, `4173`, `127.0.0.1:5173` | Strict: rejects origins not matching `CLIENT_ORIGIN`, explicit allowed origins list, or `.github.io` domain |
| **Storage & Persistence** | Local IndexedDB (`hisab_db`) + In-memory store fallback if Supabase keys missing | Local IndexedDB (`hisab_db`) + Supabase cloud PostgreSQL tables |
| **PWA Service Worker** | Auto-update enabled, skips waiting in workbox cache | Service worker precaches 9 production asset entries (`dist/sw.js`) and caches Google Fonts |

---

## 4. Secrets Handling & Storage

### 4.1 Frontend Secrets
- `VITE_SUPABASE_ANON_KEY` is a public anonymous key meant for browser execution. It is governed by Supabase Row Level Security (RLS) and is not a private master secret.
- In GitHub Actions (`.github/workflows/deploy.yml`), both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are passed via GitHub Repository Secrets:
  - `${{ secrets.VITE_SUPABASE_URL }}`
  - `${{ secrets.VITE_SUPABASE_ANON_KEY }}`

### 4.2 Backend Secrets
- `SUPABASE_SERVICE_ROLE_KEY` has administrative privileges and bypasses RLS.
- This secret **must only** be injected into backend production container/hosting provider environment settings (e.g. Render/Railway environment dashboard).
- Local `.env` files are ignored by git in `.gitignore` (`.env`, `.env.local`, `.env.production`).

---

## 5. Required Services & External Dependencies

1. **Supabase Cloud Infrastructure** (External SaaS)
   - **PostgreSQL Database**: Hosts `profiles`, `settings`, `categories`, `transactions`, `friends`, and `friend_money_entries`.
   - **Supabase Auth**: Manages user registration, JWT generation, password resets, and session tokens.
2. **GitHub Infrastructure**
   - **GitHub Actions**: Runs the frontend build and artifact publishing runner (`ubuntu-latest`).
   - **GitHub Pages**: Static edge hosting for the React frontend PWA.
3. **Google Fonts CDN**
   - Runtime cache configured in `client/vite.config.ts` (`https://fonts.googleapis.com/*`).

---

## 6. What is Verified vs. Unknown

### Verified from Codebase:
- [x] Frontend runs on GitHub Pages at `/protext/` base path.
- [x] GitHub Actions workflow exists and deploys `client/dist` to GitHub Pages on push to `main`.
- [x] Backend is an Express app with helmet, rate-limiting, and CORS origin restrictions.
- [x] Supabase RLS policies and SQL schema are codified in `supabase/schema.sql`.
- [x] Client supports full offline operations via IndexedDB even when backend or Supabase is unavailable.

### Unknown / Needs Confirmation:
- [?] **Production Backend Hosting Provider**: No configuration file exists in the repo indicating where `server/` is hosted in production (e.g. Render, Fly.io, Railway, AWS, DigitalOcean).
- [?] **Production Backend URL**: The production value for `VITE_API_BASE_URL` is not specified in `.github/workflows/deploy.yml` or any checked-in configuration.
- [?] **Staging Environment**: No staging environment or pipeline exists.
