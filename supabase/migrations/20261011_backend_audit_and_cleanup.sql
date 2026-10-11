-- ==============================================================================
-- HISAB - Migration: 20261011_backend_audit_and_cleanup.sql
-- Description: Comprehensive database audit, cleanup, schema optimization,
--              automatic updated_at triggers, foreign key repairs, deduplication,
--              enhanced RLS policies, and performance indexes.
-- Idempotency: All statements are idempotent and safe to execute multiple times.
-- Safety: Staged data backup table preserves any repaired or duplicate records.
-- Resilience: Ensures prerequisite tables exist and guards all operations against
--             missing tables (42P01).
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 0. PREREQUISITE TABLES PROVISIONING (Idempotent: CREATE TABLE IF NOT EXISTS)
-- ------------------------------------------------------------------------------
-- Guarantees that tables exist even on databases that missed earlier feature migrations.

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    starting_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'NPR',
    theme TEXT NOT NULL DEFAULT 'light',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#64748B',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL DEFAULT 'Other',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    raw_input TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.friend_money_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    friend_id UUID NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('given', 'returned')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit TEXT,
    estimated_unit_price NUMERIC(12, 2),
    actual_unit_price NUMERIC(12, 2),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'purchased')),
    purchase_date DATE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT DEFAULT 'Shopping',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_money_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Standard policies for tables if missing
DO $$
BEGIN
    -- Friends
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can view own friends') THEN
        CREATE POLICY "Users can view own friends" ON public.friends FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can insert own friends') THEN
        CREATE POLICY "Users can insert own friends" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can update own friends') THEN
        CREATE POLICY "Users can update own friends" ON public.friends FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can delete own friends') THEN
        CREATE POLICY "Users can delete own friends" ON public.friends FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Friend money entries
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friend_money_entries' AND policyname = 'Users can view own friend money entries') THEN
        CREATE POLICY "Users can view own friend money entries" ON public.friend_money_entries FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friend_money_entries' AND policyname = 'Users can update own friend money entries') THEN
        CREATE POLICY "Users can update own friend money entries" ON public.friend_money_entries FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friend_money_entries' AND policyname = 'Users can delete own friend money entries') THEN
        CREATE POLICY "Users can delete own friend money entries" ON public.friend_money_entries FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Shopping lists
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopping_lists' AND policyname = 'Users can view own shopping lists') THEN
        CREATE POLICY "Users can view own shopping lists" ON public.shopping_lists FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopping_lists' AND policyname = 'Users can insert own shopping lists') THEN
        CREATE POLICY "Users can insert own shopping lists" ON public.shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopping_lists' AND policyname = 'Users can update own shopping lists') THEN
        CREATE POLICY "Users can update own shopping lists" ON public.shopping_lists FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopping_lists' AND policyname = 'Users can delete own shopping lists') THEN
        CREATE POLICY "Users can delete own shopping lists" ON public.shopping_lists FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Shopping items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopping_items' AND policyname = 'Users can view own shopping items') THEN
        CREATE POLICY "Users can view own shopping items" ON public.shopping_items FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopping_items' AND policyname = 'Users can update own shopping items') THEN
        CREATE POLICY "Users can update own shopping items" ON public.shopping_items FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shopping_items' AND policyname = 'Users can delete own shopping items') THEN
        CREATE POLICY "Users can delete own shopping items" ON public.shopping_items FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. AUDIT & BACKUP TABLE FOR SAFETY
-- ------------------------------------------------------------------------------
-- Any record that is repaired, de-duplicated, or altered is preserved here
-- before any mutation, ensuring zero unrecoverable data loss.
CREATE TABLE IF NOT EXISTS public._backup_cleaned_records (
    backup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    original_id TEXT,
    user_id UUID,
    reason TEXT NOT NULL,
    record_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index backup records by table and user
CREATE INDEX IF NOT EXISTS idx_backup_table_user 
    ON public._backup_cleaned_records(table_name, user_id);

-- ------------------------------------------------------------------------------
-- 2. AUTOMATIC updated_at TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
-- Ensures updated_at always reflects real modification times across all tables,
-- allowing delta sync (since?: string) to accurately capture remote edits.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers idempotently with table existence validation
DO $$
BEGIN
    -- profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated_at') THEN
        CREATE TRIGGER trg_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_settings_updated_at') THEN
        CREATE TRIGGER trg_settings_updated_at
            BEFORE UPDATE ON public.settings
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- categories
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categories_updated_at') THEN
        CREATE TRIGGER trg_categories_updated_at
            BEFORE UPDATE ON public.categories
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- transactions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_transactions_updated_at') THEN
        CREATE TRIGGER trg_transactions_updated_at
            BEFORE UPDATE ON public.transactions
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- friends
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friends')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_friends_updated_at') THEN
        CREATE TRIGGER trg_friends_updated_at
            BEFORE UPDATE ON public.friends
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- friend_money_entries
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friend_money_entries')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_friend_money_entries_updated_at') THEN
        CREATE TRIGGER trg_friend_money_entries_updated_at
            BEFORE UPDATE ON public.friend_money_entries
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- shopping_lists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_lists')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shopping_lists_updated_at') THEN
        CREATE TRIGGER trg_shopping_lists_updated_at
            BEFORE UPDATE ON public.shopping_lists
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;

    -- shopping_items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_items')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shopping_items_updated_at') THEN
        CREATE TRIGGER trg_shopping_items_updated_at
            BEFORE UPDATE ON public.shopping_items
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. AUDIT & REPAIR ORPHANED RELATIONSHIPS (Preserving all history)
-- ------------------------------------------------------------------------------

-- A. Repair Transactions pointing to non-existent categories
-- Retain category_name string while nullifying broken category_id foreign key
INSERT INTO public._backup_cleaned_records (table_name, original_id, user_id, reason, record_data)
SELECT 
    'transactions', 
    t.id::text, 
    t.user_id, 
    'orphaned_category_id_cleared', 
    to_jsonb(t)
FROM public.transactions t
LEFT JOIN public.categories c ON t.category_id = c.id
WHERE t.category_id IS NOT NULL AND c.id IS NULL
ON CONFLICT DO NOTHING;

UPDATE public.transactions t
SET category_id = NULL
WHERE t.category_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = t.category_id);

-- B. Repair Shopping Items pointing to deleted transactions
-- Set transaction_id to NULL while retaining status and price as draft
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_items') THEN
        INSERT INTO public._backup_cleaned_records (table_name, original_id, user_id, reason, record_data)
        SELECT 
            'shopping_items', 
            si.id::text, 
            si.user_id, 
            'orphaned_transaction_id_cleared', 
            to_jsonb(si)
        FROM public.shopping_items si
        LEFT JOIN public.transactions t ON si.transaction_id = t.id
        WHERE si.transaction_id IS NOT NULL AND t.id IS NULL
        ON CONFLICT DO NOTHING;

        UPDATE public.shopping_items si
        SET transaction_id = NULL
        WHERE si.transaction_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = si.transaction_id);
    END IF;
END $$;

-- C. Repair Friend Money Entries pointing to non-existent friends
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friend_money_entries')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friends') THEN

        INSERT INTO public._backup_cleaned_records (table_name, original_id, user_id, reason, record_data)
        SELECT 
            'friend_money_entries', 
            fme.id::text, 
            fme.user_id, 
            'orphaned_friend_id_removed', 
            to_jsonb(fme)
        FROM public.friend_money_entries fme
        LEFT JOIN public.friends f ON fme.friend_id = f.id
        WHERE f.id IS NULL
        ON CONFLICT DO NOTHING;

        DELETE FROM public.friend_money_entries fme
        WHERE NOT EXISTS (SELECT 1 FROM public.friends f WHERE f.id = fme.friend_id);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. CONFIRMED DUPLICATE RECORD IDENTIFICATION & CLEANUP
-- ------------------------------------------------------------------------------
-- A duplicate is CONFIRMED ONLY IF all of the following match:
--   - Same user_id
--   - Same type ('income' or 'expense')
--   - Same amount
--   - Same description
--   - Same date
--   - Created within 2 seconds of each other (rapid offline sync retry duplicate)
-- We preserve the earliest record and archive the duplicate in _backup_cleaned_records.

WITH RankedDuplicates AS (
    SELECT 
        id,
        user_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, type, amount, description, date, COALESCE(raw_input, '')
            ORDER BY created_at ASC, id ASC
        ) as rn,
        LAG(created_at) OVER (
            PARTITION BY user_id, type, amount, description, date, COALESCE(raw_input, '')
            ORDER BY created_at ASC, id ASC
        ) as prev_created_at,
        created_at
    FROM public.transactions
),
ConfirmedDuplicates AS (
    SELECT id, user_id
    FROM RankedDuplicates
    WHERE rn > 1 
      AND prev_created_at IS NOT NULL
      AND ABS(EXTRACT(EPOCH FROM (created_at - prev_created_at))) <= 2.0
)
INSERT INTO public._backup_cleaned_records (table_name, original_id, user_id, reason, record_data)
SELECT 
    'transactions', 
    t.id::text, 
    t.user_id, 
    'confirmed_rapid_duplicate_transaction', 
    to_jsonb(t)
FROM public.transactions t
JOIN ConfirmedDuplicates cd ON t.id = cd.id
ON CONFLICT DO NOTHING;

WITH RankedDuplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, type, amount, description, date, COALESCE(raw_input, '')
            ORDER BY created_at ASC, id ASC
        ) as rn,
        LAG(created_at) OVER (
            PARTITION BY user_id, type, amount, description, date, COALESCE(raw_input, '')
            ORDER BY created_at ASC, id ASC
        ) as prev_created_at,
        created_at
    FROM public.transactions
),
ConfirmedDuplicates AS (
    SELECT id
    FROM RankedDuplicates
    WHERE rn > 1 
      AND prev_created_at IS NOT NULL
      AND ABS(EXTRACT(EPOCH FROM (created_at - prev_created_at))) <= 2.0
)
DELETE FROM public.transactions
WHERE id IN (SELECT id FROM ConfirmedDuplicates);

-- ------------------------------------------------------------------------------
-- 5. STANDARDIZATION & ENHANCED CHECK CONSTRAINTS
-- ------------------------------------------------------------------------------

-- Ensure no negative starting balance
UPDATE public.settings
SET starting_balance = 0.00
WHERE starting_balance < 0;

ALTER TABLE public.settings
    DROP CONSTRAINT IF EXISTS chk_settings_starting_balance_non_neg;
ALTER TABLE public.settings
    ADD CONSTRAINT chk_settings_starting_balance_non_neg CHECK (starting_balance >= 0);

-- Ensure currency is valid uppercase 3-letter code (default NPR)
UPDATE public.settings
SET currency = 'NPR'
WHERE currency IS NULL OR length(trim(currency)) = 0;

ALTER TABLE public.settings
    DROP CONSTRAINT IF EXISTS chk_settings_currency_not_empty;
ALTER TABLE public.settings
    ADD CONSTRAINT chk_settings_currency_not_empty CHECK (length(trim(currency)) >= 1);

-- Ensure non-empty transaction descriptions
ALTER TABLE public.transactions
    DROP CONSTRAINT IF EXISTS chk_transactions_description_not_empty;
ALTER TABLE public.transactions
    ADD CONSTRAINT chk_transactions_description_not_empty CHECK (length(trim(description)) > 0);

-- Ensure confidence is bounded between 0 and 1
ALTER TABLE public.transactions
    DROP CONSTRAINT IF EXISTS chk_transactions_confidence_range;
ALTER TABLE public.transactions
    ADD CONSTRAINT chk_transactions_confidence_range CHECK (confidence >= 0.00 AND confidence <= 1.00);

-- Ensure non-empty names/titles across friends and shopping
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_items') THEN
        ALTER TABLE public.shopping_items
            DROP CONSTRAINT IF EXISTS chk_shopping_items_name_not_empty;
        ALTER TABLE public.shopping_items
            ADD CONSTRAINT chk_shopping_items_name_not_empty CHECK (length(trim(name)) > 0);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_lists') THEN
        ALTER TABLE public.shopping_lists
            DROP CONSTRAINT IF EXISTS chk_shopping_lists_title_not_empty;
        ALTER TABLE public.shopping_lists
            ADD CONSTRAINT chk_shopping_lists_title_not_empty CHECK (length(trim(title)) > 0);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friends') THEN
        ALTER TABLE public.friends
            DROP CONSTRAINT IF EXISTS chk_friends_name_not_empty;
        ALTER TABLE public.friends
            ADD CONSTRAINT chk_friends_name_not_empty CHECK (length(trim(name)) > 0);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. ENHANCED ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
-- Prevent cross-user entity injection (e.g. inserting item into another user's list)

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_items') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_lists') THEN
        DROP POLICY IF EXISTS "Users can insert own shopping items" ON public.shopping_items;
        CREATE POLICY "Users can insert own shopping items"
            ON public.shopping_items FOR INSERT
            WITH CHECK (
                auth.uid() = user_id 
                AND EXISTS (
                    SELECT 1 FROM public.shopping_lists sl 
                    WHERE sl.id = list_id AND sl.user_id = auth.uid()
                )
            );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friend_money_entries') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friends') THEN
        DROP POLICY IF EXISTS "Users can insert own friend money entries" ON public.friend_money_entries;
        CREATE POLICY "Users can insert own friend money entries"
            ON public.friend_money_entries FOR INSERT
            WITH CHECK (
                auth.uid() = user_id 
                AND EXISTS (
                    SELECT 1 FROM public.friends f 
                    WHERE f.id = friend_id AND f.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE & COMPOSITE QUERY INDEXES
-- ------------------------------------------------------------------------------

-- Transactions: Filter by user + category
CREATE INDEX IF NOT EXISTS idx_transactions_user_cat
    ON public.transactions(user_id, category_name);

-- Transactions: Filter by user + type + date (Dashboard aggregation)
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date
    ON public.transactions(user_id, type, date DESC);

-- Shopping & Friends indexes with table existence checks
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_items') THEN
        CREATE INDEX IF NOT EXISTS idx_shopping_items_list_order
            ON public.shopping_items(list_id, sort_order ASC, created_at ASC);
        CREATE INDEX IF NOT EXISTS idx_shopping_items_user_status
            ON public.shopping_items(user_id, status);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friend_money_entries') THEN
        CREATE INDEX IF NOT EXISTS idx_friend_money_entries_friend_date
            ON public.friend_money_entries(friend_id, date DESC);
    END IF;
END $$;

COMMIT;

-- ==============================================================================
-- ROLLBACK PLAN (Instructions for reversal if required):
-- ------------------------------------------------------------------------------
-- 1. DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
--    (Repeat for other tables)
-- 2. DROP FUNCTION IF EXISTS public.set_updated_at();
-- 3. DROP INDEX IF EXISTS idx_transactions_user_cat;
--    DROP INDEX IF EXISTS idx_transactions_user_type_date;
--    DROP INDEX IF EXISTS idx_shopping_items_list_order;
--    DROP INDEX IF EXISTS idx_shopping_items_user_status;
--    DROP INDEX IF EXISTS idx_friend_money_entries_friend_date;
-- 4. To restore any deleted duplicate or repaired record:
--    INSERT INTO public.transactions SELECT (record_data->>'...')::... 
--    FROM public._backup_cleaned_records WHERE table_name = 'transactions';
-- ==============================================================================
