import { ParsedTransaction, Transaction, UserSettings, Category } from '../types/index.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

export class ApiService {
  private static authToken: string | null = null;

  static setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  // Health check
  static async checkHealth(): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('settings').select('id', { head: true, count: 'exact' });
        return !error;
      } catch {
        return false;
      }
    }

    if (!API_BASE) return false;

    try {
      const res = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  // NLP Parse
  static async parseText(text: string, customCategories?: Category[]): Promise<ParsedTransaction> {
    if (!API_BASE) {
      throw new Error('Server NLP parsing unavailable in standalone mode. Please use client parsing.');
    }

    const res = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text, customCategories })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to parse text on server');
    }
    return data.data;
  }

  // Transactions
  static async getTransactions(params?: { type?: string; category?: string; search?: string; since?: string }): Promise<Transaction[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('transactions').select('*').order('date', { ascending: false });
      if (params?.type) query = query.eq('type', params.type);
      if (params?.category) query = query.eq('category_name', params.category);
      if (params?.since) query = query.gte('date', params.since);
      if (params?.search) query = query.ilike('description', `%${params.search}%`);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    }

    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.since) query.set('since', params.since);

    const url = `${API_BASE}/api/transactions${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch transactions');
    }
    return data.data;
  }

  static async createTransaction(tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode: transaction is saved in local IndexedDB
        return tx as Transaction;
      }
      const payload = {
        ...tx,
        user_id: user.id
      };
      const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const res = await fetch(`${API_BASE}/api/transactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(tx)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create transaction');
    }
    return data.data;
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { id, ...updates } as Transaction;
      }
      const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update transaction');
    }
    return data.data;
  }

  static async deleteTransaction(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete transaction');
    }
  }

  // Settings
  static async getSettings(): Promise<UserSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { user_id: 'guest', starting_balance: 0, currency: 'NPR', theme: 'light' };
      }
      const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data || { user_id: user.id, starting_balance: 0, currency: 'NPR', theme: 'light' };
    }

    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch settings');
    }
    return data.data;
  }

  static async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode: settings are saved locally in IndexedDB / localStorage
        return updates as UserSettings;
      }
      const { data, error } = await supabase.from('settings').upsert({
        ...updates,
        user_id: user.id
      }, { onConflict: 'user_id' }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update settings');
    }
    return data.data;
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw new Error(error.message);
      return data || [];
    }

    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch categories');
    }
    return data.data;
  }

  static async createCategory(cat: Omit<Category, 'id' | 'user_id'>): Promise<Category> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return cat as Category;
      }
      const payload = {
        ...cat,
        user_id: user.id
      };
      const { data, error } = await supabase.from('categories').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(cat)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create category');
    }
    return data.data;
  }
}

