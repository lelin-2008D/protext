import { ParsedTransaction, Transaction, UserSettings, Category, Friend, FriendMoneyEntry, ShoppingList, ShoppingItem } from '../types/index.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

export function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  );
}

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
      if (params?.since) query = query.gt('updated_at', params.since);
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

  static async deleteUserData(resetSettings: boolean): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Delete friend money entries (child records)
      try {
        const { error: entriesError } = await supabase.from('friend_money_entries').delete().eq('user_id', user.id);
        if (entriesError && !isMissingTableError(entriesError)) {
          throw new Error(entriesError.message);
        }
      } catch (err: any) {
        if (!isMissingTableError(err)) throw err;
      }

      // 2. Delete friends (parent records)
      try {
        const { error: friendsError } = await supabase.from('friends').delete().eq('user_id', user.id);
        if (friendsError && !isMissingTableError(friendsError)) {
          throw new Error(friendsError.message);
        }
      } catch (err: any) {
        if (!isMissingTableError(err)) throw err;
      }

      // 3. Delete transactions
      const { error: transactionsError } = await supabase.from('transactions').delete().eq('user_id', user.id);
      if (transactionsError && !isMissingTableError(transactionsError)) {
        throw new Error(transactionsError.message);
      }

      // 4. Delete custom categories only (user_id = user.id)
      const { error: categoriesError } = await supabase.from('categories').delete().eq('user_id', user.id);
      if (categoriesError && !isMissingTableError(categoriesError)) {
        throw new Error(categoriesError.message);
      }

      // 5. Reset settings
      if (resetSettings) {
        const { error } = await supabase
          .from('settings')
          .update({
            starting_balance: 0,
            currency: 'NPR',
            theme: 'light',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        if (error && !isMissingTableError(error)) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('settings')
          .update({
            starting_balance: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        if (error && !isMissingTableError(error)) throw new Error(error.message);
      }
      return;
    }

    const res = await fetch(`${API_BASE}/api/settings/data`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ resetSettings })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to clear account data');
    }
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

  // Friends (Friend Money Calculator)
  static async getFriends(): Promise<Friend[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('friends').select('*').order('name');
      if (error) throw new Error(error.message);
      return data || [];
    }

    if (!API_BASE) return [];

    try {
      const res = await fetch(`${API_BASE}/api/friends`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch friends');
      }
      return data.data;
    } catch {
      return [];
    }
  }

  static async createFriend(friend: Omit<Friend, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Friend> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return friend as Friend;
      }
      const payload = {
        ...friend,
        user_id: user.id
      };
      const { data, error } = await supabase.from('friends').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    if (!API_BASE) {
      return friend as Friend;
    }

    const res = await fetch(`${API_BASE}/api/friends`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(friend)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create friend');
    }
    return data.data;
  }

  static async updateFriend(id: string, updates: Partial<Friend>): Promise<Friend> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { id, ...updates } as Friend;
      }
      const { data, error } = await supabase.from('friends').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    if (!API_BASE) {
      return { id, ...updates } as Friend;
    }

    const res = await fetch(`${API_BASE}/api/friends/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update friend');
    }
    return data.data;
  }

  static async deleteFriend(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('friends').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    if (!API_BASE) return;

    const res = await fetch(`${API_BASE}/api/friends/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete friend');
    }
  }

  // Friend Money Entries
  static async getFriendEntries(friendId?: string): Promise<FriendMoneyEntry[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('friend_money_entries').select('*').order('date', { ascending: false });
      if (friendId) {
        query = query.eq('friend_id', friendId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map((e: any) => ({
        ...e,
        amount: Number(e.amount)
      }));
    }

    if (!API_BASE) return [];

    try {
      const url = friendId ? `${API_BASE}/api/friends/${friendId}/entries` : `${API_BASE}/api/friends/entries`;
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch friend entries');
      }
      return (data.data || []).map((e: any) => ({
        ...e,
        amount: Number(e.amount)
      }));
    } catch {
      return [];
    }
  }

  static async createFriendEntry(entry: Omit<FriendMoneyEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FriendMoneyEntry> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return entry as FriendMoneyEntry;
      }
      const payload = {
        ...entry,
        user_id: user.id
      };
      const { data, error } = await supabase.from('friend_money_entries').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return {
        ...data,
        amount: Number(data.amount)
      };
    }

    if (!API_BASE) {
      return entry as FriendMoneyEntry;
    }

    const res = await fetch(`${API_BASE}/api/friends/${entry.friend_id}/entries`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(entry)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create friend entry');
    }
    return {
      ...data.data,
      amount: Number(data.data.amount)
    };
  }

  static async updateFriendEntry(id: string, updates: Partial<FriendMoneyEntry>): Promise<FriendMoneyEntry> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { id, ...updates } as FriendMoneyEntry;
      }
      const { data, error } = await supabase.from('friend_money_entries').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return {
        ...data,
        amount: Number(data.amount)
      };
    }

    if (!API_BASE) {
      return { id, ...updates } as FriendMoneyEntry;
    }

    const res = await fetch(`${API_BASE}/api/friends/entries/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update friend entry');
    }
    return {
      ...data.data,
      amount: Number(data.data.amount)
    };
  }

  static async deleteFriendEntry(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('friend_money_entries').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const res = await fetch(`${API_BASE}/api/friends/entries/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete friend entry');
    }
  }

  // SHOPPING LISTS
  static async getShoppingLists(): Promise<ShoppingList[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('shopping_lists').select('*').order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }

    if (!API_BASE) return [];

    try {
      const res = await fetch(`${API_BASE}/api/shopping/lists`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch shopping lists');
      }
      return data.data || [];
    } catch {
      return [];
    }
  }

  static async createShoppingList(list: Omit<ShoppingList, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ShoppingList> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return list as ShoppingList;
      }
      const payload = {
        ...list,
        user_id: user.id
      };
      const { data, error } = await supabase.from('shopping_lists').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    if (!API_BASE) {
      return list as ShoppingList;
    }

    const res = await fetch(`${API_BASE}/api/shopping/lists`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(list)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create shopping list');
    }
    return data.data;
  }

  static async updateShoppingList(id: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { id, ...updates } as ShoppingList;
      }
      const { data, error } = await supabase.from('shopping_lists').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    if (!API_BASE) {
      return { id, ...updates } as ShoppingList;
    }

    const res = await fetch(`${API_BASE}/api/shopping/lists/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update shopping list');
    }
    return data.data;
  }

  static async deleteShoppingList(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('shopping_lists').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    if (!API_BASE) return;

    const res = await fetch(`${API_BASE}/api/shopping/lists/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete shopping list');
    }
  }

  // SHOPPING ITEMS
  static async getShoppingItems(listId?: string): Promise<ShoppingItem[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('shopping_items').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
      if (listId) {
        query = query.eq('list_id', listId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map((i: any) => ({
        ...i,
        quantity: Number(i.quantity),
        estimated_unit_price: i.estimated_unit_price !== null && i.estimated_unit_price !== undefined ? Number(i.estimated_unit_price) : null,
        actual_unit_price: i.actual_unit_price !== null && i.actual_unit_price !== undefined ? Number(i.actual_unit_price) : null
      }));
    }

    if (!API_BASE) return [];

    try {
      const url = listId ? `${API_BASE}/api/shopping/lists/${listId}/items` : `${API_BASE}/api/shopping/items`;
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch shopping items');
      }
      return (data.data || []).map((i: any) => ({
        ...i,
        quantity: Number(i.quantity),
        estimated_unit_price: i.estimated_unit_price !== null && i.estimated_unit_price !== undefined ? Number(i.estimated_unit_price) : null,
        actual_unit_price: i.actual_unit_price !== null && i.actual_unit_price !== undefined ? Number(i.actual_unit_price) : null
      }));
    } catch {
      return [];
    }
  }

  static async createShoppingItem(item: Omit<ShoppingItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ShoppingItem> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return item as ShoppingItem;
      }
      const payload = {
        ...item,
        user_id: user.id
      };
      const { data, error } = await supabase.from('shopping_items').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return {
        ...data,
        quantity: Number(data.quantity),
        estimated_unit_price: data.estimated_unit_price !== null && data.estimated_unit_price !== undefined ? Number(data.estimated_unit_price) : null,
        actual_unit_price: data.actual_unit_price !== null && data.actual_unit_price !== undefined ? Number(data.actual_unit_price) : null
      };
    }

    if (!API_BASE) {
      return item as ShoppingItem;
    }

    const res = await fetch(`${API_BASE}/api/shopping/lists/${item.list_id}/items`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(item)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create shopping item');
    }
    return {
      ...data.data,
      quantity: Number(data.data.quantity),
      estimated_unit_price: data.data.estimated_unit_price !== null && data.data.estimated_unit_price !== undefined ? Number(data.data.estimated_unit_price) : null,
      actual_unit_price: data.data.actual_unit_price !== null && data.data.actual_unit_price !== undefined ? Number(data.data.actual_unit_price) : null
    };
  }

  static async updateShoppingItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { id, ...updates } as ShoppingItem;
      }
      const { data, error } = await supabase.from('shopping_items').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return {
        ...data,
        quantity: Number(data.quantity),
        estimated_unit_price: data.estimated_unit_price !== null && data.estimated_unit_price !== undefined ? Number(data.estimated_unit_price) : null,
        actual_unit_price: data.actual_unit_price !== null && data.actual_unit_price !== undefined ? Number(data.actual_unit_price) : null
      };
    }

    if (!API_BASE) {
      return { id, ...updates } as ShoppingItem;
    }

    const res = await fetch(`${API_BASE}/api/shopping/items/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update shopping item');
    }
    return {
      ...data.data,
      quantity: Number(data.data.quantity),
      estimated_unit_price: data.data.estimated_unit_price !== null && data.data.estimated_unit_price !== undefined ? Number(data.data.estimated_unit_price) : null,
      actual_unit_price: data.data.actual_unit_price !== null && data.data.actual_unit_price !== undefined ? Number(data.data.actual_unit_price) : null
    };
  }

  static async deleteShoppingItem(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('shopping_items').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    if (!API_BASE) return;

    const res = await fetch(`${API_BASE}/api/shopping/items/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete shopping item');
    }
  }
}

