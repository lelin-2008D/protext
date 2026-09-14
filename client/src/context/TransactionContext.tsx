import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, UserSettings, Category } from '../types/index.js';
import { useAuth } from './AuthContext.js';
import { useSync } from './SyncContext.js';
import { ApiService } from '../lib/api.js';
import {
  getLocalTransactions,
  saveLocalTransaction,
  saveLocalTransactions,
  deleteLocalTransaction,
  getLocalSettings,
  saveLocalSettings,
  addToSyncQueue
} from '../lib/db.js';
import { DEFAULT_CLIENT_CATEGORIES } from '../lib/parserLocal.js';

interface CategoryTotal {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  color: string;
  count: number;
  percentage: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  categories: Category[];
  settings: UserSettings;
  loading: boolean;
  startingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
  categoryTotals: CategoryTotal[];
  addTransaction: (data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Transaction>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateStartingBalance: (amount: number) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  addCustomCategory: (cat: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isOnline, triggerSync } = useSync();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CLIENT_CATEGORIES);
  const [settings, setSettings] = useState<UserSettings>({
    user_id: user?.id || 'guest',
    starting_balance: 0,
    currency: 'NPR',
    theme: 'light'
  });
  const [loading, setLoading] = useState(true);

  // Load initial data from local DB and remote API
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Load from local IndexedDB first for instant rendering
      const localTxs = await getLocalTransactions(user.id);
      const localSet = await getLocalSettings(user.id);

      if (localTxs.length > 0) {
        setTransactions(localTxs);
      }
      if (localSet) {
        setSettings(localSet);
      }

      // 2. If online, fetch fresh data from API
      if (navigator.onLine) {
        try {
          const [remoteTxs, remoteSet, remoteCats] = await Promise.all([
            ApiService.getTransactions(),
            ApiService.getSettings(),
            ApiService.getCategories()
          ]);

          if (remoteTxs) {
            setTransactions(remoteTxs);
            await saveLocalTransactions(remoteTxs);
          }
          if (remoteSet) {
            setSettings(remoteSet);
            await saveLocalSettings(remoteSet);
          }
          if (remoteCats && remoteCats.length > 0) {
            setCategories(remoteCats);
          }
        } catch (apiErr) {
          console.warn('[TransactionContext] Could not fetch remote data, relying on local cache:', apiErr);
        }
      }
    } catch (err) {
      console.error('[TransactionContext] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply theme to document
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // RECALCULATE BALANCES (Single Reliable Source of Truth - Formula in Requirement 16)
  const startingBalance = settings.starting_balance || 0;

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  // Available Balance = Starting Balance + Total Income - Total Expenses
  const availableBalance = useMemo(() => {
    return startingBalance + totalIncome - totalExpenses;
  }, [startingBalance, totalIncome, totalExpenses]);

  // Category Totals summary for breakdown & pie chart
  const categoryTotals = useMemo(() => {
    const expenseTxs = transactions.filter(t => t.type === 'expense');
    const totalExp = expenseTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const map = new Map<string, { amount: number; count: number; color: string }>();

    for (const tx of expenseTxs) {
      const catName = tx.category_name || 'Other';
      const current = map.get(catName) || {
        amount: 0,
        count: 0,
        color: categories.find(c => c.name === catName)?.color || '#64748B'
      };
      current.amount += Number(tx.amount || 0);
      current.count += 1;
      map.set(catName, current);
    }

    const result: CategoryTotal[] = [];
    map.forEach((val, name) => {
      result.push({
        name,
        amount: val.amount,
        type: 'expense',
        color: val.color,
        count: val.count,
        percentage: totalExp > 0 ? Math.round((val.amount / totalExp) * 100) : 0
      });
    });

    return result.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  // ACTION: Add Transaction
  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Transaction> => {
    if (!user) throw new Error('User not logged in');

    const tempId = 'tx-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    const newTx: Transaction = {
      ...data,
      id: tempId,
      user_id: user.id,
      amount: Number(data.amount),
      category_name: data.category_name || 'Other',
      date: data.date || new Date().toISOString().split('T')[0],
      confidence: data.confidence ?? 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _isOfflinePending: !isOnline
    };

    // 1. Optimistically update local state & IndexedDB
    setTransactions(prev => [newTx, ...prev]);
    await saveLocalTransaction(newTx);

    // 2. Send to API if online, otherwise enqueue
    if (isOnline) {
      try {
        const created = await ApiService.createTransaction(data);
        // Replace temp transaction with real server response
        setTransactions(prev => prev.map(t => (t.id === tempId ? created : t)));
        await deleteLocalTransaction(tempId);
        await saveLocalTransaction(created);
        return created;
      } catch (err) {
        console.warn('[TransactionContext] Online creation failed, enqueuing for background sync:', err);
        await addToSyncQueue({
          id: tempId,
          action: 'create',
          entity: 'transaction',
          data: newTx
        });
      }
    } else {
      await addToSyncQueue({
        id: tempId,
        action: 'create',
        entity: 'transaction',
        data: newTx
      });
    }

    return newTx;
  };

  // ACTION: Edit Transaction
  const editTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
    if (!user) return;

    // 1. Optimistically update local state & IndexedDB
    let updatedTx: Transaction | null = null;
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          updatedTx = {
            ...t,
            ...updates,
            amount: updates.amount !== undefined ? Number(updates.amount) : t.amount,
            updated_at: new Date().toISOString()
          };
          return updatedTx;
        }
        return t;
      })
    );

    if (updatedTx) {
      await saveLocalTransaction(updatedTx);
    }

    // 2. Persist to API or enqueue
    if (isOnline) {
      try {
        await ApiService.updateTransaction(id, updates);
      } catch (err) {
        console.warn('[TransactionContext] Edit API call failed, enqueuing:', err);
        await addToSyncQueue({
          id: `edit-${id}-${Date.now()}`,
          action: 'update',
          entity: 'transaction',
          data: { id, ...updates }
        });
      }
    } else {
      await addToSyncQueue({
        id: `edit-${id}-${Date.now()}`,
        action: 'update',
        entity: 'transaction',
        data: { id, ...updates }
      });
    }
  };

  // ACTION: Delete Transaction
  const deleteTransaction = async (id: string): Promise<void> => {
    if (!user) return;

    // 1. Optimistically remove from state & IndexedDB
    setTransactions(prev => prev.filter(t => t.id !== id));
    await deleteLocalTransaction(id);

    // 2. Delete from API or enqueue
    if (isOnline) {
      try {
        await ApiService.deleteTransaction(id);
      } catch (err) {
        console.warn('[TransactionContext] Delete API call failed, enqueuing:', err);
        await addToSyncQueue({
          id: `del-${id}-${Date.now()}`,
          action: 'delete',
          entity: 'transaction',
          data: { id }
        });
      }
    } else {
      await addToSyncQueue({
        id: `del-${id}-${Date.now()}`,
        action: 'delete',
        entity: 'transaction',
        data: { id }
      });
    }
  };

  // ACTION: Update Starting Balance
  const updateStartingBalance = async (amount: number): Promise<void> => {
    if (!user) return;
    const newSettings: UserSettings = {
      ...settings,
      starting_balance: Number(amount)
    };

    setSettings(newSettings);
    await saveLocalSettings(newSettings);

    if (isOnline) {
      try {
        await ApiService.updateSettings({ starting_balance: Number(amount) });
      } catch (err) {
        await addToSyncQueue({
          id: `settings-sb-${Date.now()}`,
          action: 'update',
          entity: 'settings',
          data: { starting_balance: Number(amount) }
        });
      }
    } else {
      await addToSyncQueue({
        id: `settings-sb-${Date.now()}`,
        action: 'update',
        entity: 'settings',
        data: { starting_balance: Number(amount) }
      });
    }
  };

  // ACTION: Update Theme
  const updateTheme = async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
    if (!user) return;
    const newSettings: UserSettings = {
      ...settings,
      theme
    };

    setSettings(newSettings);
    await saveLocalSettings(newSettings);

    if (isOnline) {
      try {
        await ApiService.updateSettings({ theme });
      } catch {
        // ignore
      }
    }
  };

  // ACTION: Add Custom Category
  const addCustomCategory = async (cat: Omit<Category, 'id' | 'user_id'>): Promise<void> => {
    if (!user) return;
    const tempCat: Category = {
      ...cat,
      id: 'cat-' + Math.random().toString(36).substring(2, 8),
      user_id: user.id
    };

    setCategories(prev => [...prev, tempCat]);

    if (isOnline) {
      try {
        const created = await ApiService.createCategory(cat);
        setCategories(prev => prev.map(c => (c.id === tempCat.id ? created : c)));
      } catch (err) {
        console.warn('[TransactionContext] Category API call failed:', err);
      }
    }
  };

  const refreshData = async () => {
    await loadData();
    if (isOnline) {
      await triggerSync();
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        categories,
        settings,
        loading,
        startingBalance,
        totalIncome,
        totalExpenses,
        availableBalance,
        categoryTotals,
        addTransaction,
        editTransaction,
        deleteTransaction,
        updateStartingBalance,
        updateTheme,
        addCustomCategory,
        refreshData
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
