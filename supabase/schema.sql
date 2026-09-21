-- HISAB Database Schema for Supabase / PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    starting_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'NPR',
    theme TEXT NOT NULL DEFAULT 'light',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CATEGORIES TABLE
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

-- 4. TRANSACTIONS TABLE
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

-- INDEXES for fast querying & user isolation
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PROFILES
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- POLICIES FOR SETTINGS
CREATE POLICY "Users can view own settings"
    ON public.settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- POLICIES FOR CATEGORIES
CREATE POLICY "Users can view system and own categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- POLICIES FOR TRANSACTIONS
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- TRIGGER FOR NEW USER SETUP (Auto creates profile & settings & user default categories)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    );

    -- Create default settings
    INSERT INTO public.settings (user_id, starting_balance, currency, created_at, updated_at)
    VALUES (NEW.id, 0.00, 'NPR', NOW(), NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DEFAULT GLOBAL / SYSTEM CATEGORIES SEED
INSERT INTO public.categories (user_id, name, type, keywords, icon, color, is_default)
VALUES
    -- Expense categories
    (NULL, 'Food & Drinks', 'expense', ARRAY['coffee', 'tea', 'momo', 'lunch', 'dinner', 'breakfast', 'khaja', 'coke', 'snack', 'restaurant', 'cafe', 'chowmein', 'burger', 'pizza', 'groceries', 'bhat', 'tarkari', 'chiya'], 'Utensils', '#F97316', true),
    (NULL, 'Transport', 'expense', ARRAY['bus', 'taxi', 'petrol', 'fuel', 'bike', 'scooter', 'pathao', 'indrive', 'micro', 'auto', 'tempo', 'fare', 'toll', 'parking'], 'Bus', '#3B82F6', true),
    (NULL, 'Education', 'expense', ARRAY['books', 'college', 'course', 'tuition', 'school', 'exam', 'stationery', 'copy', 'pen', 'notes', 'fee', 'semester'], 'GraduationCap', '#8B5CF6', true),
    (NULL, 'Shopping', 'expense', ARRAY['shirt', 'shoes', 'clothes', 'pants', 'jacket', 'daraz', 'shopping', 'watch', 'bag', 'sunglasses'], 'ShoppingBag', '#EC4899', true),
    (NULL, 'Home', 'expense', ARRAY['rent', 'furniture', 'maintenance', 'repair', 'room', 'flat', 'gas', 'cylinder', 'cooker'], 'Home', '#10B981', true),
    (NULL, 'Bills', 'expense', ARRAY['internet', 'wifi', 'electricity', 'water', 'recharge', 'ntc', 'ncell', 'worldlink', 'vianet', 'khanepani', 'bijuli'], 'Receipt', '#6366F1', true),
    (NULL, 'Entertainment', 'expense', ARRAY['netflix', 'movie', 'cinema', 'qfx', 'game', 'spotify', 'concert', 'outing', 'party'], 'Film', '#A855F7', true),
    (NULL, 'Health', 'expense', ARRAY['medicine', 'doctor', 'hospital', 'pharmacy', 'checkup', 'clinic', 'tablet', 'syrup', 'dentist'], 'HeartPulse', '#EF4444', true),
    (NULL, 'Other', 'expense', ARRAY['other', 'misc', 'miscellaneous', 'cash'], 'MoreHorizontal', '#64748B', true),

    -- Income categories
    (NULL, 'Salary', 'income', ARRAY['salary', 'job', 'monthly', 'paycheck', 'bonus', 'overtime'], 'Briefcase', '#22C55E', true),
    (NULL, 'Freelance', 'income', ARRAY['freelance', 'freelancing', 'client', 'project', 'gig', 'upwork', 'fiverr', 'consulting'], 'Laptop', '#06B6D4', true),
    (NULL, 'Gift', 'income', ARRAY['gift', 'dad', 'mom', 'brother', 'sister', 'uncle', 'aunt', 'dakshina', 'dashain', 'tihar', 'birthday', 'baba', 'aama'], 'Gift', '#F59E0B', true),
    (NULL, 'Refund', 'income', ARRAY['refund', 'return', 'cashback', 'reimbursement'], 'RotateCcw', '#14B8A6', true),
    (NULL, 'Other Income', 'income', ARRAY['income', 'interest', 'dividend', 'rent received', 'sold'], 'Wallet', '#84CC16', true)
ON CONFLICT DO NOTHING;

-- 5. FRIENDS TABLE (Friend Money Calculator)
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. FRIEND MONEY ENTRIES TABLE
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

-- INDEXES for Friends & Friend Entries
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_money_entries_friend_id ON public.friend_money_entries(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_money_entries_user_id ON public.friend_money_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_money_entries_date ON public.friend_money_entries(date DESC);

-- ENABLE ROW LEVEL SECURITY (RLS) FOR FRIENDS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_money_entries ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR FRIENDS
CREATE POLICY "Users can view own friends"
    ON public.friends FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own friends"
    ON public.friends FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friends"
    ON public.friends FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own friends"
    ON public.friends FOR DELETE
    USING (auth.uid() = user_id);

-- POLICIES FOR FRIEND MONEY ENTRIES
CREATE POLICY "Users can view own friend money entries"
    ON public.friend_money_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own friend money entries"
    ON public.friend_money_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friend money entries"
    ON public.friend_money_entries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own friend money entries"
    ON public.friend_money_entries FOR DELETE
    USING (auth.uid() = user_id);
