# Pre-Release & Deployment Checklist: HISAB

This is the operational checklist to execute before, during, and after any release of the **HISAB** application. Every step is tailored to the project's actual architecture and verified toolchain.

---

## 1. Pre-Flight Code & Build Validation

- [ ] **Clean Working Directory**: Ensure git working tree is clean (`git status` shows no uncommitted changes or untracked temporary files).
- [ ] **Workspace Test Execution**:
  - Run full test suite across both workspaces:
    ```bash
    npm run test
    ```
  - Verify that:
    - Client Vitest suite passes (minimum 32 unit/integration tests).
    - Server Vitest suite passes (minimum 31 parser and API tests).
- [ ] **Client Typecheck & Build**:
  - Run client compilation:
    ```bash
    npm --prefix client run build
    ```
  - Verify `client/dist/` is generated cleanly with no TypeScript compiler errors.
- [ ] **Server Typecheck & Build**:
  - Run server compilation:
    ```bash
    npm --prefix server run build
    ```
  - Verify `server/dist/` is generated cleanly with `index.js`, `app.js`, and route files.

---

## 2. Environment & Secrets Verification

- [ ] **GitHub Repository Secrets**:
  - Check **Settings** ➔ **Secrets and variables** ➔ **Actions**:
    - `VITE_SUPABASE_URL` is configured and points to active Supabase project.
    - `VITE_SUPABASE_ANON_KEY` is valid and active.
- [ ] **Backend Secrets (If Deployed)**:
  - `SUPABASE_SERVICE_ROLE_KEY` is securely set on the hosting provider (never in public repositories or client `.env`).
  - `CLIENT_ORIGIN` matches the deployed frontend URL (`https://lelin-2008D.github.io`).
  - `PORT` and `NODE_ENV=production` are properly assigned.

---

## 3. Database & Migration Validation

- [ ] **Schema Compatibility Check**:
  - If new tables, columns, or RLS policies were introduced (e.g. `friends`, `friend_money_entries`, `starting_balance`):
    - [ ] Manually verify or execute the updated DDL in the [Supabase SQL Editor](https://app.supabase.com).
    - [ ] Verify that `handle_new_user()` trigger is intact on `auth.users`.
- [ ] **Row Level Security (RLS)**:
  - Confirm RLS is enabled on all tables: `profiles`, `settings`, `categories`, `transactions`, `friends`, `friend_money_entries`.
  - Confirm policies allow authenticated users (`auth.uid() = user_id`) to perform CRUD operations.
- [ ] **Database Backup**:
  - Take a manual snapshot or verify the automated daily backup exists in the Supabase Dashboard before applying schema changes.

---

## 4. API & Cross-Layer Compatibility

- [ ] **CORS Origin Alignment**:
  - Confirm backend `allowedOrigins` in `server/src/app.ts` permits the production frontend origin (`*.github.io` or custom domain).
- [ ] **Client API Base Endpoint**:
  - If using the Express backend in production: confirm `VITE_API_BASE_URL` is set to the HTTPS backend endpoint.
  - If running in serverless/offline direct Supabase mode: confirm `client/src/lib/api.ts` correctly queries Supabase directly.
- [ ] **Base Path Consistency**:
  - Confirm `client/vite.config.ts` has `base: '/protext/'` for GitHub Pages (or `/` for custom root domains).

---

## 5. Deployment Execution

- [ ] **Trigger Release**:
  - Push tested commits to the `main` branch:
    ```bash
    git push origin main
    ```
  - Or manually dispatch the workflow via GitHub Actions (**Actions** ➔ **Deploy Frontend to GitHub Pages** ➔ **Run workflow**).
- [ ] **Monitor Pipeline**:
  - Ensure all GitHub Actions jobs (`build-and-deploy`) succeed with green checks.
  - Check build duration (typically 30–60 seconds).

---

## 6. Post-Deployment Smoke Testing & Health Checks

- [ ] **HTTP Availability**:
  - Open `https://lelin-2008D.github.io/protext/` in a browser.
  - Confirm the page loads with HTTP 200 and the preloader transitions to the dashboard smoothly.
- [ ] **PWA & Service Worker**:
  - Check browser console: Verify Service Worker registers without registration errors.
  - Check DevTools Application ➔ Manifest: Verify manifest icon and theme colors are loaded.
- [ ] **Authentication Flow**:
  - Log in with a test account or guest mode.
  - Verify session token is acquired and profile data loads without console errors.
- [ ] **Transaction Creation & Animation**:
  - Type a quick transaction (e.g. `Tea 30`) and click **Save Transaction**.
  - Verify celebratory save animation plays smoothly.
  - Verify balance recalculates: $\text{Balance} = \text{Starting Balance} + \text{Income} - \text{Expenses}$.
- [ ] **Mobile Layout Check (iPhone XR / 375px–414px Viewports)**:
  - Open responsive mode in browser DevTools.
  - Confirm Recent Transactions displays clean rows without text squishing or `CATEGORAMOUNT` collisions.
  - Confirm Quick Entry bar wraps cleanly.
- [ ] **Offline Resilience Test**:
  - In DevTools ➔ Network, toggle to **Offline**.
  - Add a transaction: verify it is stored in IndexedDB (`hisab_db`) and sync badge shows `Offline (1 pending)`.
  - Toggle back to **Online**: verify sync badge switches to `Synced` and data syncs.
- [ ] **Backend Health (If Backend Deployed)**:
  - Run:
    ```bash
    curl -f https://<backend-host>/api/health
    ```
  - Confirm response has status `"healthy"`.

---

## 7. Rollback Readiness Confirmation

- [ ] Note down the previous successful Git commit hash: `git rev-parse HEAD~1`.
- [ ] Note down the previous successful GitHub Actions run URL.
- [ ] Confirm the deployment operator has permissions to revert commits on `main` or re-run prior GitHub Actions jobs if a critical issue arises.
