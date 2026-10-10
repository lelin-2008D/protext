import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ShoppingList, ShoppingItem, ShoppingListSummary, ShoppingListStatus, Transaction } from '../types/index.js';
import { useAuth } from './AuthContext.js';
import { useSync } from './SyncContext.js';
import { useTransactions } from './TransactionContext.js';
import { ApiService } from '../lib/api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  getLocalShoppingLists,
  saveLocalShoppingList,
  saveLocalShoppingLists,
  deleteLocalShoppingList,
  getLocalShoppingItems,
  saveLocalShoppingItem,
  saveLocalShoppingItems,
  deleteLocalShoppingItem,
  deleteLocalShoppingItemsByList,
  addToSyncQueue
} from '../lib/db.js';

interface PurchaseItemParams {
  itemId: string;
  actual_unit_price: number;
  quantity?: number;
  category_name?: string;
  purchase_date?: string;
}

interface ShoppingContextType {
  lists: ShoppingList[];
  items: ShoppingItem[];
  loading: boolean;
  activeLists: ShoppingList[];
  completedLists: ShoppingList[];
  archivedLists: ShoppingList[];
  // List operations
  createList: (title: string, description?: string) => Promise<ShoppingList>;
  updateList: (id: string, updates: Partial<ShoppingList>) => Promise<ShoppingList | void>;
  completeList: (id: string) => Promise<void>;
  archiveList: (id: string) => Promise<void>;
  reopenList: (id: string) => Promise<void>;
  deleteList: (id: string, deleteLinkedTransactions?: boolean) => Promise<void>;
  // Item operations
  addItem: (listId: string, itemData: {
    name: string;
    quantity?: number;
    unit?: string;
    estimated_unit_price?: number | null;
    notes?: string;
    category_name?: string;
  }) => Promise<ShoppingItem>;
  editItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  duplicateItem: (id: string) => Promise<ShoppingItem | null>;
  deleteItem: (id: string, deleteLinkedTransaction?: boolean) => Promise<void>;
  purchaseItem: (params: PurchaseItemParams) => Promise<{ item: ShoppingItem; transaction: Transaction }>;
  undoPurchase: (itemId: string) => Promise<void>;
  // Query & calculations
  getItemsForList: (listId: string) => ShoppingItem[];
  getListSummary: (listId: string) => ShoppingListSummary;
  refreshShoppingData: () => Promise<void>;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

export const ShoppingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isOnline } = useSync();
  const { transactions, addTransaction, editTransaction, deleteTransaction } = useTransactions();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Data: Local IndexedDB first, then cloud reconcile if online
  const loadData = useCallback(async () => {
    if (!user) {
      setLists([]);
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Instant local load
      const [localLists, localItems] = await Promise.all([
        getLocalShoppingLists(user.id),
        getLocalShoppingItems(user.id)
      ]);

      setLists(localLists || []);
      setItems(localItems || []);
      setLoading(false);

      // 2. Cloud fetch if online
      if (navigator.onLine) {
        try {
          const [remoteLists, remoteItems] = await Promise.all([
            ApiService.getShoppingLists(),
            ApiService.getShoppingItems()
          ]);

          if (remoteLists && remoteLists.length > 0) {
            setLists(remoteLists);
            await saveLocalShoppingLists(remoteLists);
          }
          if (remoteItems && remoteItems.length > 0) {
            setItems(remoteItems);
            await saveLocalShoppingItems(remoteItems);
          }
        } catch (apiErr) {
          console.warn('[ShoppingContext] Background fetch warning:', apiErr);
        }
      }
    } catch (err) {
      console.error('[ShoppingContext] Error loading shopping data:', err);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen to background sync completions
  useEffect(() => {
    const handleSyncComplete = async () => {
      if (user) {
        const [freshLists, freshItems] = await Promise.all([
          getLocalShoppingLists(user.id),
          getLocalShoppingItems(user.id)
        ]);
        if (freshLists) setLists(freshLists);
        if (freshItems) setItems(freshItems);
      }
    };

    window.addEventListener('hisab-shopping-sync-complete', handleSyncComplete);
    return () => {
      window.removeEventListener('hisab-shopping-sync-complete', handleSyncComplete);
    };
  }, [user]);

  // Supabase Realtime Channel
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user || user.id.startsWith('guest-')) {
      return;
    }

    const channel = supabase
      .channel(`realtime-shopping-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: `user_id=eq.${user.id}`
        },
        async (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          if (eventType === 'INSERT' && newRecord) {
            setLists(prev => {
              if (prev.some(l => l.id === newRecord.id)) return prev;
              return [newRecord, ...prev.filter(l => l.id !== newRecord.id)];
            });
            await saveLocalShoppingList(newRecord);
          } else if (eventType === 'UPDATE' && newRecord) {
            setLists(prev => prev.map(l => (l.id === newRecord.id ? newRecord : l)));
            await saveLocalShoppingList(newRecord);
          } else if (eventType === 'DELETE' && oldRecord) {
            setLists(prev => prev.filter(l => l.id !== oldRecord.id));
            await deleteLocalShoppingList(oldRecord.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `user_id=eq.${user.id}`
        },
        async (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          if (eventType === 'INSERT' && newRecord) {
            const formatted: ShoppingItem = {
              ...newRecord,
              quantity: Number(newRecord.quantity),
              estimated_unit_price: newRecord.estimated_unit_price != null ? Number(newRecord.estimated_unit_price) : null,
              actual_unit_price: newRecord.actual_unit_price != null ? Number(newRecord.actual_unit_price) : null
            };
            setItems(prev => {
              if (prev.some(i => i.id === formatted.id)) return prev;
              return [...prev, formatted];
            });
            await saveLocalShoppingItem(formatted);
          } else if (eventType === 'UPDATE' && newRecord) {
            const formatted: ShoppingItem = {
              ...newRecord,
              quantity: Number(newRecord.quantity),
              estimated_unit_price: newRecord.estimated_unit_price != null ? Number(newRecord.estimated_unit_price) : null,
              actual_unit_price: newRecord.actual_unit_price != null ? Number(newRecord.actual_unit_price) : null
            };
            setItems(prev => prev.map(i => (i.id === formatted.id ? formatted : i)));
            await saveLocalShoppingItem(formatted);
          } else if (eventType === 'DELETE' && oldRecord) {
            setItems(prev => prev.filter(i => i.id !== oldRecord.id));
            await deleteLocalShoppingItem(oldRecord.id);
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

  // BIDIRECTIONAL SYNC: Watch for changes in transactions that affect shopping items
  // Requirement 3.E:
  // "Editing a linked transaction from the main Transaction List must not silently leave the Shopping Planner showing conflicting purchase data.
  // Deleting a linked transaction must have a deliberate and consistent effect on the corresponding shopping item. Prefer reverting it to pending while retaining its price as a draft and clearly informing the user."
  const txMapRef = useRef<Map<string, Transaction>>(new Map());
  useEffect(() => {
    const txMap = new Map<string, Transaction>(transactions.map(t => [t.id, t]));
    txMapRef.current = txMap;

    // Check if any purchased shopping items have their linked transaction deleted or edited
    setItems(prevItems => {
      let changed = false;
      const updatedItems = prevItems.map(item => {
        if (!item.transaction_id || item.status !== 'purchased') {
          return item;
        }

        const linkedTx = txMap.get(item.transaction_id);

        if (!linkedTx) {
          // Transaction was deleted from main Transaction List!
          // Revert item to pending while retaining actual_unit_price as draft
          changed = true;
          const reverted: ShoppingItem = {
            ...item,
            status: 'pending',
            transaction_id: null,
            updated_at: new Date().toISOString()
          };
          void saveLocalShoppingItem(reverted);
          return reverted;
        }

        // If transaction amount or description changed externally, synchronize item actual price/totals if needed
        const expectedTotal = Math.round(Number(item.quantity || 1) * Number(item.actual_unit_price || 0) * 100) / 100;
        const actualTxAmount = Number(linkedTx.amount || 0);

        if (Math.abs(expectedTotal - actualTxAmount) > 0.01 && (item.quantity || 1) > 0) {
          // Price updated externally in transaction list!
          const newUnitPrice = Math.round((actualTxAmount / (item.quantity || 1)) * 100) / 100;
          changed = true;
          const synced: ShoppingItem = {
            ...item,
            actual_unit_price: newUnitPrice,
            category_name: linkedTx.category_name || item.category_name,
            purchase_date: linkedTx.date || item.purchase_date,
            updated_at: new Date().toISOString()
          };
          void saveLocalShoppingItem(synced);
          return synced;
        }

        return item;
      });

      return changed ? updatedItems : prevItems;
    });
  }, [transactions]);

  // Split lists by status
  const activeLists = useMemo(() => lists.filter(l => l.status === 'active'), [lists]);
  const completedLists = useMemo(() => lists.filter(l => l.status === 'completed'), [lists]);
  const archivedLists = useMemo(() => lists.filter(l => l.status === 'archived'), [lists]);

  // Helpers
  const getItemsForList = useCallback((listId: string): ShoppingItem[] => {
    return items
      .filter(i => i.list_id === listId && !i._isDeleted)
      .sort((a, b) => ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || (a.name.localeCompare(b.name)));
  }, [items]);

  const getListSummary = useCallback((listId: string): ShoppingListSummary => {
    const targetList = lists.find(l => l.id === listId) || {
      id: listId,
      user_id: user?.id || 'guest',
      title: 'Shopping List',
      status: 'active' as ShoppingListStatus
    };

    const listItems = items.filter(i => i.list_id === listId && !i._isDeleted);
    const totalItems = listItems.length;
    const purchasedItems = listItems.filter(i => i.status === 'purchased');
    const purchasedItemsCount = purchasedItems.length;
    const pendingItemsCount = totalItems - purchasedItemsCount;

    let estimatedTotal = 0;
    let actualPurchasedTotal = 0;
    let remainingEstimatedTotal = 0;

    for (const item of listItems) {
      const qty = Number(item.quantity) || 1;
      const estPrice = item.estimated_unit_price != null ? Number(item.estimated_unit_price) : null;
      const actPrice = item.actual_unit_price != null ? Number(item.actual_unit_price) : null;

      if (estPrice !== null && !isNaN(estPrice) && estPrice >= 0) {
        estimatedTotal += Math.round(qty * estPrice * 100) / 100;
      }

      if (item.status === 'purchased') {
        if (actPrice !== null && !isNaN(actPrice) && actPrice >= 0) {
          actualPurchasedTotal += Math.round(qty * actPrice * 100) / 100;
        }
      } else {
        // Pending item remaining estimate
        const priceForEstimate = estPrice !== null ? estPrice : (actPrice !== null ? actPrice : 0);
        remainingEstimatedTotal += Math.round(qty * priceForEstimate * 100) / 100;
      }
    }

    const progressPercentage = totalItems > 0 ? Math.round((purchasedItemsCount / totalItems) * 100) : 0;

    return {
      list: targetList,
      totalItems,
      purchasedItemsCount,
      pendingItemsCount,
      estimatedTotal: Math.round(estimatedTotal * 100) / 100,
      actualPurchasedTotal: Math.round(actualPurchasedTotal * 100) / 100,
      remainingEstimatedTotal: Math.round(remainingEstimatedTotal * 100) / 100,
      progressPercentage
    };
  }, [lists, items, user]);

  // ACTIONS: Lists
  const createList = useCallback(
    async (title: string, description?: string): Promise<ShoppingList> => {
      if (!user) throw new Error('User not logged in');

      const tempId = 'list-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      const newList: ShoppingList = {
        id: tempId,
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOfflinePending: !isOnline
      };

      setLists(prev => [newList, ...prev]);
      await saveLocalShoppingList(newList);

      if (isOnline) {
        try {
          const created = await ApiService.createShoppingList({
            title: newList.title,
            description: newList.description,
            status: newList.status
          });
          setLists(prev => prev.map(l => (l.id === tempId ? created : l)));
          await deleteLocalShoppingList(tempId);
          await saveLocalShoppingList(created);
          return created;
        } catch (err) {
          console.warn('[ShoppingContext] Online list create failed, enqueuing:', err);
          await addToSyncQueue({
            id: tempId,
            action: 'create',
            entity: 'shopping_list',
            data: newList
          });
        }
      } else {
        await addToSyncQueue({
          id: tempId,
          action: 'create',
          entity: 'shopping_list',
          data: newList
        });
      }

      return newList;
    },
    [user, isOnline]
  );

  const updateList = useCallback(
    async (id: string, updates: Partial<ShoppingList>): Promise<ShoppingList | void> => {
      if (!user) return;

      let updatedList: ShoppingList | null = null;
      setLists(prev =>
        prev.map(l => {
          if (l.id === id) {
            updatedList = {
              ...l,
              ...updates,
              updated_at: new Date().toISOString()
            };
            return updatedList;
          }
          return l;
        })
      );

      if (updatedList) {
        await saveLocalShoppingList(updatedList);
      }

      const queuePayload = { id, ...updates };
      if (isOnline) {
        try {
          await ApiService.updateShoppingList(id, updates);
        } catch (err) {
          console.warn('[ShoppingContext] Online list update failed, enqueuing:', err);
          await addToSyncQueue({
            id: `edit-list-${id}-${Date.now()}`,
            action: 'update',
            entity: 'shopping_list',
            data: queuePayload
          });
        }
      } else {
        await addToSyncQueue({
          id: `edit-list-${id}-${Date.now()}`,
          action: 'update',
          entity: 'shopping_list',
          data: queuePayload
        });
      }

      return updatedList || undefined;
    },
    [user, isOnline]
  );

  const completeList = useCallback(async (id: string): Promise<void> => {
    await updateList(id, { status: 'completed' });
  }, [updateList]);

  const archiveList = useCallback(async (id: string): Promise<void> => {
    await updateList(id, { status: 'archived' });
  }, [updateList]);

  const reopenList = useCallback(async (id: string): Promise<void> => {
    await updateList(id, { status: 'active' });
  }, [updateList]);

  const deleteList = useCallback(
    async (id: string, deleteLinkedTransactions = false): Promise<void> => {
      if (!user) return;

      const listItems = items.filter(i => i.list_id === id);

      if (deleteLinkedTransactions) {
        // Reverse all associated expenses
        for (const item of listItems) {
          if (item.transaction_id) {
            try {
              await deleteTransaction(item.transaction_id);
            } catch (err) {
              console.warn('[ShoppingContext] Failed deleting transaction during list delete:', err);
            }
          }
        }
      }

      // Remove items and list locally
      setLists(prev => prev.filter(l => l.id !== id));
      setItems(prev => prev.filter(i => i.list_id !== id));

      await deleteLocalShoppingList(id);
      await deleteLocalShoppingItemsByList(id);

      if (isOnline) {
        try {
          await ApiService.deleteShoppingList(id);
        } catch (err) {
          console.warn('[ShoppingContext] Online list delete failed, enqueuing:', err);
          await addToSyncQueue({
            id: `del-list-${id}-${Date.now()}`,
            action: 'delete',
            entity: 'shopping_list',
            data: { id }
          });
        }
      } else {
        await addToSyncQueue({
          id: `del-list-${id}-${Date.now()}`,
          action: 'delete',
          entity: 'shopping_list',
          data: { id }
        });
      }
    },
    [user, isOnline, items, deleteTransaction]
  );

  // ACTIONS: Items
  const addItem = useCallback(
    async (
      listId: string,
      itemData: {
        name: string;
        quantity?: number;
        unit?: string;
        estimated_unit_price?: number | null;
        notes?: string;
        category_name?: string;
      }
    ): Promise<ShoppingItem> => {
      if (!user) throw new Error('User not logged in');

      const tempId = 'item-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      const existingItems = items.filter(i => i.list_id === listId);
      const nextSortOrder = existingItems.length;

      const qty = itemData.quantity !== undefined && !isNaN(Number(itemData.quantity)) && Number(itemData.quantity) > 0
        ? Number(itemData.quantity)
        : 1;

      const estPrice = itemData.estimated_unit_price !== undefined && itemData.estimated_unit_price !== null && !isNaN(Number(itemData.estimated_unit_price))
        ? Math.max(0, Number(itemData.estimated_unit_price))
        : null;

      const newItem: ShoppingItem = {
        id: tempId,
        list_id: listId,
        user_id: user.id,
        name: itemData.name.trim(),
        quantity: qty,
        unit: itemData.unit?.trim() || null,
        estimated_unit_price: estPrice,
        actual_unit_price: null,
        notes: itemData.notes?.trim() || null,
        status: 'pending',
        purchase_date: null,
        transaction_id: null,
        category_name: itemData.category_name || 'Shopping',
        sort_order: nextSortOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOfflinePending: !isOnline
      };

      setItems(prev => [...prev, newItem]);
      await saveLocalShoppingItem(newItem);

      if (isOnline) {
        try {
          const created = await ApiService.createShoppingItem(newItem);
          setItems(prev => prev.map(i => (i.id === tempId ? created : i)));
          await deleteLocalShoppingItem(tempId);
          await saveLocalShoppingItem(created);
          return created;
        } catch (err) {
          console.warn('[ShoppingContext] Online item create failed, enqueuing:', err);
          await addToSyncQueue({
            id: tempId,
            action: 'create',
            entity: 'shopping_item',
            data: newItem
          });
        }
      } else {
        await addToSyncQueue({
          id: tempId,
          action: 'create',
          entity: 'shopping_item',
          data: newItem
        });
      }

      return newItem;
    },
    [user, isOnline, items]
  );

  const editItem = useCallback(
    async (id: string, updates: Partial<ShoppingItem>): Promise<void> => {
      if (!user) return;

      const currentItem = items.find(i => i.id === id);
      if (!currentItem) return;

      const updatedQty = updates.quantity !== undefined ? Number(updates.quantity) : currentItem.quantity;
      const updatedActualPrice = updates.actual_unit_price !== undefined
        ? (updates.actual_unit_price !== null ? Number(updates.actual_unit_price) : null)
        : currentItem.actual_unit_price;
      const updatedName = updates.name !== undefined ? updates.name.trim() : currentItem.name;
      const updatedUnit = updates.unit !== undefined ? (updates.unit?.trim() || null) : currentItem.unit;
      const updatedCategory = updates.category_name !== undefined ? updates.category_name : currentItem.category_name;
      const updatedDate = updates.purchase_date !== undefined ? updates.purchase_date : currentItem.purchase_date;

      const updatedItem: ShoppingItem = {
        ...currentItem,
        ...updates,
        name: updatedName,
        quantity: updatedQty,
        unit: updatedUnit,
        actual_unit_price: updatedActualPrice,
        category_name: updatedCategory,
        purchase_date: updatedDate,
        updated_at: new Date().toISOString()
      };

      // If item was already purchased and has linked transaction, keep transaction synchronized!
      if (currentItem.status === 'purchased' && currentItem.transaction_id && updatedActualPrice !== null && updatedActualPrice !== undefined) {
        const newTotal = Math.round(updatedQty * updatedActualPrice * 100) / 100;
        const newDescription = `${updatedName}${updatedUnit ? ` (${updatedQty} ${updatedUnit})` : ` (x${updatedQty})`}`;

        try {
          await editTransaction(currentItem.transaction_id, {
            amount: newTotal,
            description: newDescription,
            category_name: updatedCategory || 'Shopping',
            date: updatedDate || currentItem.purchase_date || new Date().toISOString().split('T')[0]
          });
        } catch (err) {
          console.warn('[ShoppingContext] Failed updating linked transaction:', err);
        }
      }

      setItems(prev => prev.map(i => (i.id === id ? updatedItem : i)));
      await saveLocalShoppingItem(updatedItem);

      const queuePayload = { id, ...updates };
      if (isOnline) {
        try {
          await ApiService.updateShoppingItem(id, updates);
        } catch (err) {
          console.warn('[ShoppingContext] Online item update failed, enqueuing:', err);
          await addToSyncQueue({
            id: `edit-item-${id}-${Date.now()}`,
            action: 'update',
            entity: 'shopping_item',
            data: queuePayload
          });
        }
      } else {
        await addToSyncQueue({
          id: `edit-item-${id}-${Date.now()}`,
          action: 'update',
          entity: 'shopping_item',
          data: queuePayload
        });
      }
    },
    [user, isOnline, items, editTransaction]
  );

  const duplicateItem = useCallback(
    async (id: string): Promise<ShoppingItem | null> => {
      const source = items.find(i => i.id === id);
      if (!source) return null;

      return addItem(source.list_id, {
        name: `${source.name} (Copy)`,
        quantity: source.quantity,
        unit: source.unit || undefined,
        estimated_unit_price: source.estimated_unit_price,
        notes: source.notes || undefined,
        category_name: source.category_name || 'Shopping'
      });
    },
    [items, addItem]
  );

  const deleteItem = useCallback(
    async (id: string, deleteLinkedTransaction = true): Promise<void> => {
      if (!user) return;

      const target = items.find(i => i.id === id);
      if (!target) return;

      if (deleteLinkedTransaction && target.transaction_id) {
        try {
          await deleteTransaction(target.transaction_id);
        } catch (err) {
          console.warn('[ShoppingContext] Failed deleting linked transaction for item:', err);
        }
      }

      setItems(prev => prev.filter(i => i.id !== id));
      await deleteLocalShoppingItem(id);

      if (isOnline) {
        try {
          await ApiService.deleteShoppingItem(id);
        } catch (err) {
          console.warn('[ShoppingContext] Online item delete failed, enqueuing:', err);
          await addToSyncQueue({
            id: `del-item-${id}-${Date.now()}`,
            action: 'delete',
            entity: 'shopping_item',
            data: { id }
          });
        }
      } else {
        await addToSyncQueue({
          id: `del-item-${id}-${Date.now()}`,
          action: 'delete',
          entity: 'shopping_item',
          data: { id }
        });
      }
    },
    [user, isOnline, items, deleteTransaction]
  );

  // CRITICAL REQUIREMENT 3.D & 3.E:
  // "When a user marks an item as purchased:
  // 1. Ask for or confirm its actual unit price
  // 2. Display quantity, unit price, calculated total, expense category, and purchase date
  // 4. Create the actual expense through HISAB's existing transaction creation system
  // 5. Update the item's purchase status and store durable reference to generated transaction
  // 6. Refresh list totals, dashboard expense totals, available balance, and main Transaction List"
  // "Repeated clicks, retries, network reconnects, and synchronization must never create duplicate transactions"
  const purchaseItem = useCallback(
    async (params: PurchaseItemParams): Promise<{ item: ShoppingItem; transaction: Transaction }> => {
      if (!user) throw new Error('User not logged in');

      const target = items.find(i => i.id === params.itemId);
      if (!target) throw new Error('Shopping item not found');

      const actualPrice = Number(params.actual_unit_price);
      if (isNaN(actualPrice) || actualPrice < 0) {
        throw new Error('Please enter a valid actual price (0 or greater).');
      }

      const quantity = params.quantity !== undefined && Number(params.quantity) > 0
        ? Number(params.quantity)
        : (target.quantity || 1);

      const totalAmount = Math.round(quantity * actualPrice * 100) / 100;
      const categoryName = params.category_name || target.category_name || 'Shopping';
      const purchaseDate = params.purchase_date || target.purchase_date || new Date().toISOString().split('T')[0];

      const itemUnit = target.unit ? ` ${target.unit}` : '';
      const description = `${target.name}${target.unit ? ` (${quantity}${itemUnit})` : ` (x${quantity})`}`;

      // Idempotency Guard:
      // If already purchased and has linked transaction that exists, update instead of creating duplicate!
      let generatedTx: Transaction;

      if (target.status === 'purchased' && target.transaction_id) {
        const existingTx = transactions.find(t => t.id === target.transaction_id);
        if (existingTx) {
          await editTransaction(target.transaction_id, {
            amount: totalAmount,
            description,
            category_name: categoryName,
            date: purchaseDate
          });
          generatedTx = {
            ...existingTx,
            amount: totalAmount,
            description,
            category_name: categoryName,
            date: purchaseDate
          };
        } else {
          // Re-create if missing
          generatedTx = await addTransaction({
            type: 'expense',
            amount: totalAmount,
            description,
            category_name: categoryName,
            date: purchaseDate,
            confidence: 1.0
          });
        }
      } else {
        // Create new standard expense transaction
        generatedTx = await addTransaction({
          type: 'expense',
          amount: totalAmount,
          description,
          category_name: categoryName,
          date: purchaseDate,
          confidence: 1.0
        });
      }

      const updatedItem: ShoppingItem = {
        ...target,
        status: 'purchased',
        quantity,
        actual_unit_price: actualPrice,
        category_name: categoryName,
        purchase_date: purchaseDate,
        transaction_id: generatedTx.id,
        updated_at: new Date().toISOString()
      };

      setItems(prev => prev.map(i => (i.id === target.id ? updatedItem : i)));
      await saveLocalShoppingItem(updatedItem);

      // Persist / sync item update
      const syncUpdates = {
        status: 'purchased' as const,
        quantity,
        actual_unit_price: actualPrice,
        category_name: categoryName,
        purchase_date: purchaseDate,
        transaction_id: generatedTx.id
      };

      if (isOnline) {
        try {
          await ApiService.updateShoppingItem(target.id, syncUpdates);
        } catch (err) {
          console.warn('[ShoppingContext] Online purchase item update failed, enqueuing:', err);
          await addToSyncQueue({
            id: `purchase-${target.id}-${Date.now()}`,
            action: 'update',
            entity: 'shopping_item',
            data: { id: target.id, ...syncUpdates }
          });
        }
      } else {
        await addToSyncQueue({
          id: `purchase-${target.id}-${Date.now()}`,
          action: 'update',
          entity: 'shopping_item',
          data: { id: target.id, ...syncUpdates }
        });
      }

      return { item: updatedItem, transaction: generatedTx };
    },
    [user, items, transactions, addTransaction, editTransaction, isOnline]
  );

  // Undo purchase: Revert item to pending, delete linked transaction once
  const undoPurchase = useCallback(
    async (itemId: string): Promise<void> => {
      if (!user) throw new Error('User not logged in');

      const target = items.find(i => i.id === itemId);
      if (!target) throw new Error('Shopping item not found');

      if (target.transaction_id) {
        try {
          await deleteTransaction(target.transaction_id);
        } catch (err) {
          console.warn('[ShoppingContext] Failed deleting transaction during undo purchase:', err);
        }
      }

      // Revert to pending while retaining actual_unit_price as draft
      const revertedItem: ShoppingItem = {
        ...target,
        status: 'pending',
        transaction_id: null,
        updated_at: new Date().toISOString()
      };

      setItems(prev => prev.map(i => (i.id === itemId ? revertedItem : i)));
      await saveLocalShoppingItem(revertedItem);

      const syncUpdates = {
        status: 'pending' as const,
        transaction_id: null
      };

      if (isOnline) {
        try {
          await ApiService.updateShoppingItem(itemId, syncUpdates);
        } catch (err) {
          console.warn('[ShoppingContext] Online undo purchase update failed, enqueuing:', err);
          await addToSyncQueue({
            id: `undo-${itemId}-${Date.now()}`,
            action: 'update',
            entity: 'shopping_item',
            data: { id: itemId, ...syncUpdates }
          });
        }
      } else {
        await addToSyncQueue({
          id: `undo-${itemId}-${Date.now()}`,
          action: 'update',
          entity: 'shopping_item',
          data: { id: itemId, ...syncUpdates }
        });
      }
    },
    [user, items, deleteTransaction, isOnline]
  );

  return (
    <ShoppingContext.Provider
      value={{
        lists,
        items,
        loading,
        activeLists,
        completedLists,
        archivedLists,
        createList,
        updateList,
        completeList,
        archiveList,
        reopenList,
        deleteList,
        addItem,
        editItem,
        duplicateItem,
        deleteItem,
        purchaseItem,
        undoPurchase,
        getItemsForList,
        getListSummary,
        refreshShoppingData: loadData
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
};

export const useShopping = () => {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error('useShopping must be used within a ShoppingProvider');
  }
  return context;
};
