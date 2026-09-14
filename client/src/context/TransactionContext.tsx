import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, UserSettings, Category } from '../types/index.js';
import { useAuth } from './AuthContext.js';
import { useSync } from './SyncContext.js';
import { ApiService } from '../lib/api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  getLocalTransactions,
  saveLocalTransaction,
  saveLocalTransactions,
  deleteLocalTransaction,
  getLocalSettings,
  saveLocalSettings,
  addToSyncQueue,
  getLastSyncTime,
  saveLastSyncTime
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

const THEME_STORAGE_KEY = 'hisab_theme';

const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'system';
};

const applyThemeToDOM = (theme: 'light' | 'dark' | 'system') => {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isOnline, triggerSync } = useSync();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CLIENT_CATEGORIES);
  const [settings, setSettings] = useState<UserSettings>(() => ({
    user_id: user?.id || 'guest',
    starting_balance: 0,
    currency: 'NPR',
    theme: getInitialTheme()
  }));
  const [loading, setLoading] = useState(true);

  // Apply initial theme immediately
  useEffect(() => {
    applyThemeToDOM(settings.theme);
  }, []);

  // Theme change listener & system watcher
  useEffect(() => {
    applyThemeToDOM(settings.theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, settings.theme);
    } catch {
      // ignore
    }

    if (settings.theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        applyThemeToDOM('system');
      };
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [settings.theme]);

  // Fast Non-Blocking Startup & Incremental Delta Synchronization
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      // Step 1: Instant local load from IndexedDB (Zero network blocking)
      const localTxs = await getLocalTransactions(user.id);
      const localSet = await getLocalSettings(user.id);

      if (localTxs && localTxs.length > 0) {
        setTransactions(localTxs);
      }
      if (localSet) {
        const currentTheme = getInitialTheme();
        const resolvedTheme = localSet.theme || currentTheme;
        setSettings({ ...localSet, theme: resolvedTheme });
        applyThemeToDOM(resolvedTheme);
      }

      // Render local state immediately
      setLoading(false);

      // Step 2: Background cloud reconciliation (Incremental Delta Sync)
      if (navigator.onLine) {
        const lastSync = getLastSyncTime(user.id);
        const syncStartTime = new Date().toISOString();

        try {
          if (lastSync && localTxs && localTxs.length > 0) {
            // Fetch ONLY delta changes since last sync timestamp
            const deltaTxs = await ApiService.getTransactions({ since: lastSync });

            if (deltaTxs && deltaTxs.length > 0) {
              setTransactions(prev => {
                const deltaMap = new Map(deltaTxs.map(t => [t.id, t]));
                // Update modified items, filter out replaced items
                const updatedList = prev.map(t => deltaMap.get(t.id) || t);
                // Add newly inserted items
                const existingIds = new Set(prev.map(t => t.id));
                const newItems = deltaTxs.filter(t => !existingIds.has(t.id));
                return [...newItems, ...updatedList].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
              });

              await saveLocalTransactions(deltaTxs);
            }
          } else {
            // First time sync / empty cache: fetch full baseline
            const [remoteTxs, remoteSet, remoteCats] = await Promise.all([
              ApiService.getTransactions(),
              ApiService.getSettings().catch(() => null),
              ApiService.getCategories().catch(() => null)
            ]);

            if (remoteTxs) {
              setTransactions(remoteTxs);
              await saveLocalTransactions(remoteTxs);
            }
            if (remoteSet) {
              const currentTheme = getInitialTheme();
              const resolvedTheme = remoteSet.theme || currentTheme;
              setSettings({ ...remoteSet, theme: resolvedTheme });
              applyThemeToDOM(resolvedTheme);
              await saveLocalSettings({ ...remoteSet, theme: resolvedTheme });
            }
            if (remoteCats && remoteCats.length > 0) {
              setCategories(remoteCats);
            }
          }

          saveLastSyncTime(user.id, syncStartTime);
        } catch (apiErr) {
          console.warn('[TransactionContext] Background delta sync error:', apiErr);
        }
      }
    } catch (err) {
      console.error('[TransactionContext] Error during startup data load:', err);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Multi-Device Realtime Cloud Updates (Supabase Realtime)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user || user.id.startsWith('guest-')) {
      return;
    }

    const channel = supabase
      .channel(`realtime-tx-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        async payload => {
          const { eventType, new: newRecord, old: oldRecord } = payload as any;

          if (eventType === 'INSERT' && newRecord) {
            const formatted: Transaction = {
              ...newRecord,
              amount: Number(newRecord.amount),
              confidence: Number(newRecord.confidence)
            };

            setTransactions(prev => {
              // Deduplicate if already present locally
              if (prev.some(t => t.id === formatted.id)) return prev;
              // Remove matching pending offline temp items if any
              const filtered = prev.filter(t => t.id !== formatted.id && !(t._isOfflinePending && t.description === formatted.description && t.amount === formatted.amount));
              return [formatted, ...filtered].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
            });
            await saveLocalTransaction(formatted);
          } else if (eventType === 'UPDATE' && newRecord) {
            const formatted: Transaction = {
              ...newRecord,
              amount: Number(newRecord.amount),
              confidence: Number(newRecord.confidence)
            };

            setTransactions(prev => prev.map(t => (t.id === formatted.id ? formatted : t)));
            await saveLocalTransaction(formatted);
          } else if (eventType === 'DELETE' && oldRecord) {
            setTransactions(prev => prev.filter(t => t.id !== oldRecord.id));
            await deleteLocalTransaction(oldRecord.id);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

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

  // ACTION: Add Transaction (Optimistic & Stable Callback)
  const addTransaction = useCallback(
    async (
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
    },
    [user, isOnline]
  );

  // ACTION: Edit Transaction (Optimistic & Stable Callback)
  const editTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>): Promise<void> => {
      if (!user) return;

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
    },
    [user, isOnline]
  );

  // ACTION: Delete Transaction (Optimistic & Stable Callback)
  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;

      setTransactions(prev => prev.filter(t => t.id !== id));
      await deleteLocalTransaction(id);

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
    },
    [user, isOnline]
  );

  // ACTION: Update Starting Balance
  const updateStartingBalance = useCallback(
    async (amount: number): Promise<void> => {
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
    },
    [user, settings, isOnline]
  );

  // ACTION: Update Theme
  const updateTheme = useCallback(
    async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
      applyThemeToDOM(theme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // ignore
      }

      const newSettings: UserSettings = {
        ...settings,
        theme
      };

      setSettings(newSettings);

      if (user) {
        await saveLocalSettings(newSettings);
        if (isOnline) {
          try {
            await ApiService.updateSettings({ theme });
          } catch {
            // ignore
          }
        }
      }
    },
    [user, settings, isOnline]
  );

  // ACTION: Add Custom Category
  const addCustomCategory = useCallback(
    async (cat: Omit<Category, 'id' | 'user_id'>): Promise<void> => {
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
    },
    [user, isOnline]
  );

  const refreshData = useCallback(async () => {
    await loadData();
    if (isOnline) {
      await triggerSync();
    }
  }, [loadData, isOnline, triggerSync]);

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
