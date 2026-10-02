# Rollback & Recovery Procedures: HISAB

This document outlines the rollback capabilities, disaster recovery procedures, and recovery limitations across all layers of the **HISAB** application.

---

## 1. Current Rollback Capabilities Overview

| Component | Rollback Capability Status | Mechanism |
| :--- | :--- | :--- |
| **Frontend (GitHub Pages via Actions)** | **Supported** | Re-deploy previous GitHub Actions workflow run, or revert git commit on `main` |
| **Frontend (Manual `gh-pages` branch)** | **Supported** | Revert git commit and execute `npm run deploy` |
| **Backend API (Node.js)** | **NOT IMPLEMENTED IN REPOSITORY** | Depends entirely on external hosting platform (Render/Railway/Fly.io) |
| **Database Migrations (Supabase)** | **NOT IMPLEMENTED IN REPOSITORY** | No down-migrations exist; requires manual SQL restoration |
| **Client Local Cache (IndexedDB)** | **Partial / Self-healing** | IndexedDB versioned schema (`hisab_db`, v2); data persists across code rollbacks |

---

## 2. Frontend Rollback Procedures

### 2.1 Instant Rollback via GitHub Actions (Zero-code Re-deployment)
If a faulty deployment occurs and the previous build artifact was working:

1. Navigate to the GitHub repository: `https://github.com/lelin-2008D/protext/actions`.
2. Select the **Deploy Frontend to GitHub Pages** workflow.
3. Locate the last known **successful** run before the faulty deployment.
4. Click on the run, then click **Re-run all jobs** (or re-run the `deploy` job).
5. GitHub Pages will immediately redeploy the prior verified artifact (`client/dist`) within 1–2 minutes without changing Git commit history.

---

### 2.2 Rollback via Git Revert (Standard Engineering Practice)
If the code on `main` contains a bug that must be formally reverted:

1. Identify the faulty commit hash using `git log`:
   ```bash
   git log -n 5 --oneline
   ```
2. Revert the commit:
   ```bash
   git revert <commit-hash> -m "revert: rollback faulty release"
   ```
3. Push to `main`:
   ```bash
   git push origin main
   ```
4. GitHub Actions will trigger automatically, build the reverted codebase, and deploy it to GitHub Pages.

---

### 2.3 Manual `gh-pages` CLI Rollback
If deploying via `npm run deploy`:

1. Check out the previous stable commit or tag:
   ```bash
   git checkout <stable-commit-or-tag>
   ```
2. Rebuild and force-push to `gh-pages`:
   ```bash
   npm run deploy
   ```
3. Return to `main`:
   ```bash
   git checkout main
   ```

---

## 3. Database Migration Rollback Considerations

> [!WARNING]
> **NO AUTOMATED DATABASE ROLLBACK SCRIPTS EXIST IN THIS REPOSITORY.**
> The database schema is maintained purely as a single monolithic script in [`supabase/schema.sql`](file:///c:/Users/sanju/OneDrive/Desktop/protext/supabase/schema.sql). There are no down-migration files (`.down.sql`), no migration tracking table, and no CLI migration tool (Prisma, Drizzle, Knex, Flyway, or Supabase CLI).

### 3.1 Handling Database Rollbacks
- Because tables are created using `CREATE TABLE IF NOT EXISTS`, rolling back frontend or backend code does not automatically roll back schema changes.
- **Breaking Column or Table Drops**:
  - If a column or table must be removed or renamed, it must be performed manually in the Supabase SQL Editor.
  - **Caution**: Dropping columns (e.g. `ALTER TABLE public.transactions DROP COLUMN raw_input`) will cause permanent data loss unless backed up.
- **Supabase Point-in-Time Recovery (PITR)**:
  - If using Supabase Pro/Team tier, database rollbacks can be performed using Supabase Point-in-Time Recovery (PITR) via the Supabase Dashboard (Database ➔ Backups).
  - On the Free tier, only daily scheduled backups or manual SQL dumps are available.

---

## 4. Configuration & Secrets Rollback

If a deployment fails due to invalid secrets or environment configuration:

1. **Frontend Secrets (GitHub Actions)**:
   - Go to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
   - Update `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` to their correct previous values.
   - Re-run the deployment workflow in GitHub Actions.
2. **Backend Configuration**:
   - Update the environment variables in your hosting provider dashboard (Render/Railway/Fly.io).
   - Trigger a restart/redeploy in the hosting provider dashboard.

---

## 5. Deployment Failure Recovery Protocol

When an incident occurs in production:

```
[Incident Detected]
       │
       ▼
Is it a Frontend Bug? ──YES──► Re-run prior successful workflow in GitHub Actions
       │                        OR `git revert <commit>` and push to main.
      NO
       │
Is it a Supabase Config/Auth Error? ──YES──► Verify VITE_SUPABASE_* secrets in GitHub.
       │                                     Verify RLS policies in Supabase SQL editor.
      NO
       │
Is it a Database Schema Incompatibility? ──YES──► Check Supabase logs; manually apply missing
       │                                           schema clauses from supabase/schema.sql.
      NO
       │
Is it Backend API failure (if deployed)? ──YES──► Check hosting provider logs; roll back service
                                                   revision in hosting platform dashboard.
```

---

## 6. What is Explicitly NOT Implemented

The following enterprise rollback mechanisms are **not implemented** in the repository and must be acknowledged during release planning:

- [ ] Automated blue/green or canary deployment switching.
- [ ] Automated database down-migrations (`down.sql`).
- [ ] Automated health-check-based automatic rollback (automatic circuit breaker).
- [ ] Backend CI/CD deployment or rollback automation.
- [ ] Multi-region redundancy or failover.
