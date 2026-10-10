import { Transaction, UserSettings, Category, Friend, FriendMoneyEntry, ShoppingList, ShoppingItem } from '../types/index.js';
import { getSupabaseAdmin } from './supabase.js';
import { DEFAULT_CATEGORIES } from './parser/ruleParser.js';

// In-memory store used for development testing or as mock database when Supabase is not connected
const memoryTransactions = new Map<string, Transaction[]>();
const memorySettings = new Map<string, UserSettings>();
const memoryCategories = new Map<string, Category[]>();
const memoryFriends = new Map<string, Friend[]>();
const memoryFriendEntries = new Map<string, FriendMoneyEntry[]>();
const memoryShoppingLists = new Map<string, ShoppingList[]>();
const memoryShoppingItems = new Map<string, ShoppingItem[]>();

export class StoreService {
  // TRANSACTIONS
  static async getTransactions(userId: string, since?: string): Promise<Transaction[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (since) {
        query = query.gt('updated_at', since);
      }

      const { data, error } = await query
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
    let list = memoryTransactions.get(userId) || [];
    if (since) {
      list = list.filter(t => (t.updated_at || '') > since);
    }
    return list;
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
        .upsert(
          {
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
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

  static async clearUserData(userId: string, resetSettings: boolean): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const isMissingTable = (error: any) => {
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
      };

      try {
        const { error: entriesError } = await supabase.from('friend_money_entries').delete().eq('user_id', userId);
        if (entriesError && !isMissingTable(entriesError)) throw new Error(entriesError.message);
      } catch (err: any) {
        if (!isMissingTable(err)) throw err;
      }

      try {
        const { error: friendsError } = await supabase.from('friends').delete().eq('user_id', userId);
        if (friendsError && !isMissingTable(friendsError)) throw new Error(friendsError.message);
      } catch (err: any) {
        if (!isMissingTable(err)) throw err;
      }

      const { error: transactionsError } = await supabase.from('transactions').delete().eq('user_id', userId);
      if (transactionsError && !isMissingTable(transactionsError)) throw new Error(transactionsError.message);

      const { error: categoriesError } = await supabase.from('categories').delete().eq('user_id', userId);
      if (categoriesError && !isMissingTable(categoriesError)) throw new Error(categoriesError.message);

      if (resetSettings) {
        const { error } = await supabase
          .from('settings')
          .update({
            starting_balance: 0,
            currency: 'NPR',
            theme: 'light',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        if (error && !isMissingTable(error)) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('settings')
          .update({
            starting_balance: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        if (error && !isMissingTable(error)) throw new Error(error.message);
      }
      return;
    }

    memoryTransactions.delete(userId);
    memoryCategories.delete(userId);
    memoryFriends.delete(userId);
    memoryFriendEntries.delete(userId);

    if (resetSettings) {
      memorySettings.delete(userId);
    } else {
      const current = await this.getSettings(userId);
      memorySettings.set(userId, { ...current, starting_balance: 0, updated_at: new Date().toISOString() });
    }
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

  // FRIENDS
  static async getFriends(userId: string): Promise<Friend[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw new Error(error.message);
      return data || [];
    }

    const list = memoryFriends.get(userId) || [];
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async createFriend(userId: string, friend: Omit<Friend, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Friend> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('friends')
        .insert({
          ...friend,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const newFriend: Friend = {
      id: 'fr-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      user_id: userId,
      name: friend.name,
      note: friend.note || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const current = memoryFriends.get(userId) || [];
    memoryFriends.set(userId, [...current, newFriend]);
    return newFriend;
  }

  static async updateFriend(userId: string, id: string, updates: Partial<Friend>): Promise<Friend | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('friends')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const list = memoryFriends.get(userId) || [];
    const index = list.findIndex(f => f.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    memoryFriends.set(userId, list);
    return updated;
  }

  static async deleteFriend(userId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      return true;
    }

    const list = memoryFriends.get(userId) || [];
    const filtered = list.filter(f => f.id !== id);
    if (filtered.length === list.length) return false;
    memoryFriends.set(userId, filtered);

    // Also delete associated entries
    const entries = memoryFriendEntries.get(userId) || [];
    memoryFriendEntries.set(userId, entries.filter(e => e.friend_id !== id));
    return true;
  }

  // FRIEND MONEY ENTRIES
  static async getFriendEntries(userId: string, friendId?: string): Promise<FriendMoneyEntry[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase
        .from('friend_money_entries')
        .select('*')
        .eq('user_id', userId);

      if (friendId) {
        query = query.eq('friend_id', friendId);
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(e => ({
        ...e,
        amount: Number(e.amount)
      }));
    }

    let list = memoryFriendEntries.get(userId) || [];
    if (friendId) {
      list = list.filter(e => e.friend_id === friendId);
    }
    return list.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }

  static async createFriendEntry(
    userId: string,
    entry: Omit<FriendMoneyEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<FriendMoneyEntry> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('friend_money_entries')
        .insert({
          ...entry,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        ...data,
        amount: Number(data.amount)
      };
    }

    const newEntry: FriendMoneyEntry = {
      id: 'fre-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      friend_id: entry.friend_id,
      user_id: userId,
      type: entry.type,
      amount: Number(entry.amount),
      date: entry.date || new Date().toISOString().split('T')[0],
      note: entry.note || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const list = memoryFriendEntries.get(userId) || [];
    memoryFriendEntries.set(userId, [newEntry, ...list]);
    return newEntry;
  }

  static async updateFriendEntry(
    userId: string,
    id: string,
    updates: Partial<FriendMoneyEntry>
  ): Promise<FriendMoneyEntry | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('friend_money_entries')
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
        amount: Number(data.amount)
      };
    }

    const list = memoryFriendEntries.get(userId) || [];
    const index = list.findIndex(e => e.id === id);
    if (index === -1) return null;

    const updated: FriendMoneyEntry = {
      ...list[index],
      ...updates,
      amount: updates.amount !== undefined ? Number(updates.amount) : list[index].amount,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    memoryFriendEntries.set(userId, list);
    return updated;
  }

  static async deleteFriendEntry(userId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('friend_money_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      return true;
    }

    const list = memoryFriendEntries.get(userId) || [];
    const filtered = list.filter(e => e.id !== id);
    if (filtered.length === list.length) return false;
    memoryFriendEntries.set(userId, filtered);
    return true;
  }

  // SHOPPING LISTS
  static async getShoppingLists(userId: string): Promise<ShoppingList[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    }

    const list = memoryShoppingLists.get(userId) || [];
    return [...list].sort((a, b) => (b.updated_at || b.created_at || '') > (a.updated_at || a.created_at || '') ? 1 : -1);
  }

  static async getShoppingListById(userId: string, id: string): Promise<ShoppingList | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return data;
    }

    const list = memoryShoppingLists.get(userId) || [];
    return list.find(l => l.id === id) || null;
  }

  static async createShoppingList(
    userId: string,
    data: { title: string; description?: string | null; status?: 'active' | 'completed' | 'archived' }
  ): Promise<ShoppingList> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: created, error } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description || null,
          status: data.status || 'active'
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return created;
    }

    const newList: ShoppingList = {
      id: 'list-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      user_id: userId,
      title: data.title,
      description: data.description || null,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const current = memoryShoppingLists.get(userId) || [];
    memoryShoppingLists.set(userId, [newList, ...current]);
    return newList;
  }

  static async updateShoppingList(
    userId: string,
    id: string,
    updates: Partial<ShoppingList>
  ): Promise<ShoppingList | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('shopping_lists')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const list = memoryShoppingLists.get(userId) || [];
    const index = list.findIndex(l => l.id === id);
    if (index === -1) return null;

    const updated: ShoppingList = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    memoryShoppingLists.set(userId, list);
    return updated;
  }

  static async deleteShoppingList(userId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      return true;
    }

    const list = memoryShoppingLists.get(userId) || [];
    const filtered = list.filter(l => l.id !== id);
    if (filtered.length === list.length) return false;
    memoryShoppingLists.set(userId, filtered);

    // Also cascade delete items belonging to this list in memory
    const items = memoryShoppingItems.get(userId) || [];
    memoryShoppingItems.set(userId, items.filter(i => i.list_id !== id));

    return true;
  }

  // SHOPPING ITEMS
  static async getShoppingItems(userId: string, listId?: string): Promise<ShoppingItem[]> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      let query = supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId);

      if (listId) {
        query = query.eq('list_id', listId);
      }

      const { data, error } = await query
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []).map(i => ({
        ...i,
        quantity: Number(i.quantity),
        estimated_unit_price: i.estimated_unit_price !== null && i.estimated_unit_price !== undefined ? Number(i.estimated_unit_price) : null,
        actual_unit_price: i.actual_unit_price !== null && i.actual_unit_price !== undefined ? Number(i.actual_unit_price) : null
      }));
    }

    let items = memoryShoppingItems.get(userId) || [];
    if (listId) {
      items = items.filter(i => i.list_id === listId);
    }
    return [...items].sort((a, b) => ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || (a.name.localeCompare(b.name)));
  }

  static async getShoppingItemById(userId: string, id: string): Promise<ShoppingItem | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return {
        ...data,
        quantity: Number(data.quantity),
        estimated_unit_price: data.estimated_unit_price !== null && data.estimated_unit_price !== undefined ? Number(data.estimated_unit_price) : null,
        actual_unit_price: data.actual_unit_price !== null && data.actual_unit_price !== undefined ? Number(data.actual_unit_price) : null
      };
    }

    const items = memoryShoppingItems.get(userId) || [];
    return items.find(i => i.id === id) || null;
  }

  static async createShoppingItem(
    userId: string,
    data: Omit<ShoppingItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<ShoppingItem> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: created, error } = await supabase
        .from('shopping_items')
        .insert({
          list_id: data.list_id,
          user_id: userId,
          name: data.name,
          quantity: data.quantity,
          unit: data.unit || null,
          estimated_unit_price: data.estimated_unit_price ?? null,
          actual_unit_price: data.actual_unit_price ?? null,
          notes: data.notes || null,
          status: data.status || 'pending',
          purchase_date: data.purchase_date || null,
          transaction_id: data.transaction_id || null,
          category_id: data.category_id || null,
          category_name: data.category_name || 'Shopping',
          sort_order: data.sort_order ?? 0
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        ...created,
        quantity: Number(created.quantity),
        estimated_unit_price: created.estimated_unit_price !== null && created.estimated_unit_price !== undefined ? Number(created.estimated_unit_price) : null,
        actual_unit_price: created.actual_unit_price !== null && created.actual_unit_price !== undefined ? Number(created.actual_unit_price) : null
      };
    }

    const newItem: ShoppingItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      list_id: data.list_id,
      user_id: userId,
      name: data.name,
      quantity: Number(data.quantity),
      unit: data.unit || null,
      estimated_unit_price: data.estimated_unit_price !== undefined && data.estimated_unit_price !== null ? Number(data.estimated_unit_price) : null,
      actual_unit_price: data.actual_unit_price !== undefined && data.actual_unit_price !== null ? Number(data.actual_unit_price) : null,
      notes: data.notes || null,
      status: data.status || 'pending',
      purchase_date: data.purchase_date || null,
      transaction_id: data.transaction_id || null,
      category_id: data.category_id || null,
      category_name: data.category_name || 'Shopping',
      sort_order: data.sort_order ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const items = memoryShoppingItems.get(userId) || [];
    memoryShoppingItems.set(userId, [...items, newItem]);
    return newItem;
  }

  static async updateShoppingItem(
    userId: string,
    id: string,
    updates: Partial<ShoppingItem>
  ): Promise<ShoppingItem | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('shopping_items')
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
        quantity: Number(data.quantity),
        estimated_unit_price: data.estimated_unit_price !== null && data.estimated_unit_price !== undefined ? Number(data.estimated_unit_price) : null,
        actual_unit_price: data.actual_unit_price !== null && data.actual_unit_price !== undefined ? Number(data.actual_unit_price) : null
      };
    }

    const items = memoryShoppingItems.get(userId) || [];
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;

    const updated: ShoppingItem = {
      ...items[index],
      ...updates,
      quantity: updates.quantity !== undefined ? Number(updates.quantity) : items[index].quantity,
      estimated_unit_price: updates.estimated_unit_price !== undefined
        ? (updates.estimated_unit_price !== null ? Number(updates.estimated_unit_price) : null)
        : items[index].estimated_unit_price,
      actual_unit_price: updates.actual_unit_price !== undefined
        ? (updates.actual_unit_price !== null ? Number(updates.actual_unit_price) : null)
        : items[index].actual_unit_price,
      updated_at: new Date().toISOString()
    };
    items[index] = updated;
    memoryShoppingItems.set(userId, items);
    return updated;
  }

  static async deleteShoppingItem(userId: string, id: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
      return true;
    }

    const items = memoryShoppingItems.get(userId) || [];
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) return false;
    memoryShoppingItems.set(userId, filtered);
    return true;
  }

  // Clear memory for test isolation
  static clearMemory() {
    memoryTransactions.clear();
    memorySettings.clear();
    memoryCategories.clear();
    memoryFriends.clear();
    memoryFriendEntries.clear();
    memoryShoppingLists.clear();
    memoryShoppingItems.clear();
  }
}

