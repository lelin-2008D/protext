import { Transaction, UserSettings, Category } from '../types/index.js';
import { getSupabaseAdmin } from './supabase.js';
import { DEFAULT_CATEGORIES } from './parser/ruleParser.js';

// In-memory store used for development testing or as mock database when Supabase is not connected
const memoryTransactions = new Map<string, Transaction[]>();
const memorySettings = new Map<string, UserSettings>();
const memoryCategories = new Map<string, Category[]>();

export class StoreService {
  // TRANSACTIONS
  static async getTransactions(userId: string): Promise<Transaction[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(t => ({
        ...t,
        amount: Number(t.amount),
        confidence: Number(t.confidence)
      }));
    }

    // Memory fallback
    return memoryTransactions.get(userId) || [];
  }

  static async getTransactionById(userId: string, id: string): Promise<Transaction | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return {
        ...data,
        amount: Number(data.amount),
        confidence: Number(data.confidence)
      };
    }

    const list = memoryTransactions.get(userId) || [];
    return list.find(t => t.id === id) || null;
  }

  static async createTransaction(
    userId: string,
    data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Transaction> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: created, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          category_id: data.category_id || null,
          category_name: data.category_name || 'Other',
          date: data.date || new Date().toISOString().split('T')[0],
          confidence: data.confidence ?? 1.0,
          raw_input: data.raw_input || null
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        ...created,
        amount: Number(created.amount),
        confidence: Number(created.confidence)
      };
    }

    // Memory fallback
    const newTx: Transaction = {
      id: 'tx-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      user_id: userId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      category_id: data.category_id || null,
      category_name: data.category_name || 'Other',
      date: data.date || new Date().toISOString().split('T')[0],
      confidence: data.confidence ?? 1.0,
      raw_input: data.raw_input || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const current = memoryTransactions.get(userId) || [];
    memoryTransactions.set(userId, [newTx, ...current]);
    return newTx;
  }

  static async updateTransaction(
    userId: string,
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Transaction | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        ...data,
        amount: Number(data.amount),
        confidence: Number(data.confidence)
      };
    }

    // Memory fallback
    const list = memoryTransactions.get(userId) || [];
    const index = list.findIndex(t => t.id === id);
    if (index === -1) return null;

    const updatedTx: Transaction = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updatedTx;
    memoryTransactions.set(userId, list);
    return updatedTx;
  }

  static async deleteTransaction(userId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      return true;
    }

    // Memory fallback
    const list = memoryTransactions.get(userId) || [];
    const filtered = list.filter(t => t.id !== id);
    if (filtered.length === list.length) return false;
    memoryTransactions.set(userId, filtered);
    return true;
  }

  // SETTINGS
  static async getSettings(userId: string): Promise<UserSettings> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        return {
          ...data,
          starting_balance: Number(data.starting_balance)
        };
      }

      // If settings row not found, create default
      const { data: created, error: insertError } = await supabase
        .from('settings')
        .insert({ user_id: userId, starting_balance: 0.00, currency: 'NPR', theme: 'light' })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);
      return {
        ...created,
        starting_balance: Number(created.starting_balance)
      };
    }

    // Memory fallback
    let settings = memorySettings.get(userId);
    if (!settings) {
      settings = {
        user_id: userId,
        starting_balance: 0,
        currency: 'NPR',
        theme: 'light',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memorySettings.set(userId, settings);
    }
    return settings;
  }

  static async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        ...data,
        starting_balance: Number(data.starting_balance)
      };
    }

    // Memory fallback
    const current = await this.getSettings(userId);
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };
    memorySettings.set(userId, updated);
    return updated;
  }

  // CATEGORIES
  static async getCategories(userId?: string): Promise<Category[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase.from('categories').select('*');
      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query.order('name');
      if (error) throw new Error(error.message);
      return data || [];
    }

    // Memory fallback
    const userCats = userId ? memoryCategories.get(userId) || [] : [];
    return [...DEFAULT_CATEGORIES, ...userCats];
  }

  static async createCategory(userId: string, category: Omit<Category, 'id' | 'user_id'>): Promise<Category> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    // Memory fallback
    const newCat: Category = {
      ...category,
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      user_id: userId
    };

    const current = memoryCategories.get(userId) || [];
    memoryCategories.set(userId, [...current, newCat]);
    return newCat;
  }

  // Clear memory for test isolation
  static clearMemory() {
    memoryTransactions.clear();
    memorySettings.clear();
    memoryCategories.clear();
  }
}
