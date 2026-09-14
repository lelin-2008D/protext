export type TransactionType = 'income' | 'expense';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'waiting';

export interface Category {
  id?: string;
  user_id?: string | null;
  name: string;
  type: TransactionType;
  keywords: string[];
  icon?: string;
  color?: string;
  is_default?: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id?: string | null;
  category_name: string;
  date: string;
  confidence: number;
  raw_input?: string | null;
  created_at?: string;
  updated_at?: string;
  // Offline sync metadata
  _isOfflinePending?: boolean;
  _isDeleted?: boolean;
}

export interface ParsedTransaction {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  categoryId?: string | null;
  confidence: number;
  date: string;
  rawInput: string;
}

export interface UserSettings {
  id?: string;
  user_id: string;
  starting_balance: number;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
}
