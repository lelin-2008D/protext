# Build System & Artifacts Specification: HISAB

This document describes the exact, verified build pipeline, prerequisites, dependency management, commands, and generated build artifacts for both the `client` and `server` workspaces in the **HISAB** repository.

---

## 1. Build Prerequisites

| Prerequisite | Minimum Required Version | Verified in Repository |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (Local) / `20.x` (CI Runner) | Verified in `README.md` and `.github/workflows/deploy.yml` |
| **npm** | `>= 9.0.0` | Verified in `README.md` and monorepo workspaces |
| **Operating System** | Platform-agnostic (Windows, macOS, Linux, Ubuntu) | Built and verified on Windows 11 and Ubuntu (GitHub Actions) |

---

## 2. Monorepo Structure & Dependency Installation

HISAB uses npm workspaces (`package.json` at root defines `"workspaces": ["server", "client"]`).

### 2.1 Full Installation (Root + Workspaces)
To install dependencies across the monorepo:
```bash
# Root-level install using npm workspaces
npm install
```
Or install workspaces explicitly:
```bash
npm --prefix server install
npm --prefix client install
```

### 2.2 Clean Installation in CI
As defined in `.github/workflows/deploy.yml`:
```bash
npm --prefix client ci || npm --prefix client install
```

---

## 3. Verified Build Commands

### 3.1 Unified Monorepo Build
From the repository root:
```bash
# Builds both backend and frontend in sequence
npm run build
```
*Script mapping in root `package.json`:*
`"build": "npm run build:server && npm run build:client"`

---

### 3.2 Frontend Build (`client/`)

```bash
# From root:
npm run build:client

# Or directly from client directory:
cd client
npm run build
```
*Script mapping in `client/package.json`:*
`"build": "tsc && vite build"`

#### Build Execution Details:
1. **Type Checking**: Executes `tsc` (TypeScript compiler) using `client/tsconfig.json` and `client/tsconfig.node.json`. Validates types without emitting JS (`"noEmit": true`).
2. **Bundling**: Executes `vite build` using `client/vite.config.ts`.
3. **PWA Generation**: `vite-plugin-pwa` compiles the service worker (`sw.js`) and precaches static assets with `workbox`.

#### Environment Injected During Frontend Build:
- `NODE_ENV=production`
- `GITHUB_ACTIONS=true` (or unset if local)
- `VITE_SUPABASE_URL` (injected via CLI or `.env.production`)
- `VITE_SUPABASE_ANON_KEY` (injected via CLI or `.env.production`)
- `VITE_API_BASE_URL` (optional backend endpoint)

---

### 3.3 Backend Build (`server/`)

```bash
# From root:
npm run build:server

# Or directly from server directory:
cd server
npm run build
```
*Script mapping in `server/package.json`:*
`"build": "tsc"`

#### Build Execution Details:
1. **TypeScript Compilation**: `tsc` compiles TypeScript files in `server/src/` down to JavaScript into `server/dist/` targeting Node.js (`"module": "NodeNext"`, `"target": "ES2022"` in `server/tsconfig.json`).

---

## 4. Generated Build Artifacts

### 4.1 Frontend Artifacts (`client/dist/`)

The output of `npm --prefix client run build` is placed in `client/dist/`:

| Artifact | Typical Size | Description |
| :--- | :--- | :--- |
| `index.html` | ~2.3 KB | Entry HTML page with preloader, theme roots, and PWA metadata |
| `manifest.webmanifest` | ~0.55 KB | PWA Web App Manifest (standalone display, theme color, icons) |
| `sw.js` | ~1.5 KB | Service worker handling offline caching and cache cleanup |
| `workbox-*.js` | ~15 KB | Google Workbox runtime library for offline asset caching |
| `assets/index-*.js` | ~1,030 KB (~269 KB gzip) | Minified React application bundle, libraries (Recharts, Supabase, Lucide) |
| `assets/index-*.css` | ~68 KB (~12 KB gzip) | Compiled Tailwind CSS styles, custom keyframe animations |
| `icons/` | ~100 KB | PWA home screen icons (192x192, 512x512 maskable) |

### 4.2 Backend Artifacts (`server/dist/`)

The output of `npm --prefix server run build` is placed in `server/dist/`:

| Artifact | Description |
| :--- | :--- |
| `server/dist/index.js` | Server entry point (starts Express server on `PORT`) |
| `server/dist/app.js` | Express app initialization, CORS, Helmet, and route registration |
| `server/dist/config.js` | Environment configuration parser |
| `server/dist/routes/*.js` | Route handlers (`health.js`, `parse.js`, `transactions.js`, `settings.js`, `categories.js`, `friends.js`) |
| `server/dist/services/*.js` | Service layer logic (`store.js`, `supabase.js`, `parser/*.js`) |
| `server/dist/middleware/*.js` | Express middleware (`auth.js`, `rateLimiter.js`, `errorHandler.js`) |

---

## 5. Build Verification Process (Reproduced in Project)

Both build pipelines were executed and verified locally:
1. **Client Build Verification**:
   - Command: `npm --prefix client run build`
   - Result: Successful compilation (`built in ~6.2s`, `✓ 2297 modules transformed`).
   - Vitest suite: 32 tests passed across 6 test files (`npm --prefix client test`).
2. **Server Build Verification**:
   - Command: `npm --prefix server run build`
   - Result: Successful compilation (`tsc` output clean).
   - Vitest suite: 31 tests passed across 4 test files (`npm --prefix server test`).
