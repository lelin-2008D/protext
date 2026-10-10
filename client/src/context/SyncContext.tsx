import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SyncStatus } from '../types/index.js';
import {
  getSyncQueue,
  bulkRemoveFromSyncQueue,
  collapseSyncQueue,
  deleteLocalTransaction,
  saveLocalTransaction,
  saveLocalSettings,
  saveLocalFriend,
  deleteLocalFriend,
  saveLocalFriendEntry,
  deleteLocalFriendEntry,
  saveLocalShoppingList,
  deleteLocalShoppingList,
  saveLocalShoppingItem,
  deleteLocalShoppingItem
} from '../lib/db.js';
import { ApiService, isMissingTableError } from '../lib/api.js';

interface SyncContextType {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);



export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => (typeof navigator !== 'undefined' && navigator.onLine ? 'synced' : 'offline'));
  const [pendingCount, setPendingCount] = useState<number>(0);

  // In-flight sync mutex guard to prevent duplicate simultaneous sync runs
  const inFlightSyncPromiseRef = useRef<Promise<void> | null>(null);

  const checkPendingQueue = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setPendingCount(queue.length);
      if (queue.length > 0 && navigator.onLine) {
        setSyncStatus(prev => (prev === 'syncing' ? prev : 'waiting'));
      } else if (!navigator.onLine) {
        setSyncStatus('offline');
      } else {
        setSyncStatus(prev => (prev === 'syncing' ? prev : 'synced'));
      }
    } catch {
      // ignore
    }
  }, []);

  const executeSyncProcess = async (): Promise<void> => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    try {
      const rawQueue = await getSyncQueue();
      if (rawQueue.length === 0) {
        setSyncStatus('synced');
        setPendingCount(0);
        return;
      }

      setSyncStatus('syncing');

      // 1. Collapse redundant queue actions (e.g. create + update -> single create; update + delete -> single delete)
      const { collapsedItems, redundantQueueIds } = collapseSyncQueue(rawQueue);

      if (redundantQueueIds.length > 0) {
        await bulkRemoveFromSyncQueue(redundantQueueIds);
      }

      // 2. Order items systematically by dependency tier
      // Categories -> Settings -> Friends -> Friend Entries -> Shopping Lists -> Shopping Items -> Transactions -> Deletions
      const getTier = (item: any): number => {
        if (item.action === 'delete') {
          if (item.entity === 'shopping_item') return 5.5;
          if (item.entity === 'shopping_list') return 6;
          if (item.entity === 'friend_entry') return 6.5;
          if (item.entity === 'friend') return 7;
          return 8;
        }
        if (item.entity === 'category') return 1;
        if (item.entity === 'settings') return 2;
        if (item.entity === 'friend') return 3;
        if (item.entity === 'friend_entry') return 4;
        if (item.entity === 'shopping_list') return 4.2;
        if (item.entity === 'shopping_item') return 4.6;
        return 5; // transactions and others
      };

      const sortedItems = [...collapsedItems].sort((a, b) => getTier(a) - getTier(b));

      // 3. Process ordered entity mutations with ID mapping
      const successfulQueueIds: string[] = [];
      const tempFriendIdMap = new Map<string, string>();
      const tempShoppingListIdMap = new Map<string, string>();

      for (const item of sortedItems) {
        try {
          if (item.entity === 'transaction') {
            if (item.action === 'create') {
              const created = await ApiService.createTransaction(item.data);
              if (created && created.id) {
                if (item.data?.id && item.data.id !== created.id) {
                  await deleteLocalTransaction(item.data.id);
                }
                await saveLocalTransaction({ ...created, _isOfflinePending: false });
              }
            } else if (item.action === 'update') {
              const updated = await ApiService.updateTransaction(item.data.id, item.data);
              if (updated) {
                await saveLocalTransaction({ ...updated, _isOfflinePending: false });
              }
            } else if (item.action === 'delete') {
              await ApiService.deleteTransaction(item.data.id);
              await deleteLocalTransaction(item.data.id);
            }
          } else if (item.entity === 'settings' && item.action === 'update') {
            const updated = await ApiService.updateSettings(item.data);
            if (updated) {
              await saveLocalSettings(updated);
            }
          } else if (item.entity === 'category' && item.action === 'create') {
            await ApiService.createCategory(item.data);
          } else if (item.entity === 'friend') {
            if (item.action === 'create') {
              const created = await ApiService.createFriend(item.data);
              if (created && created.id) {
                if (item.data?.id && item.data.id !== created.id) {
                  tempFriendIdMap.set(item.data.id, created.id);
                  await deleteLocalFriend(item.data.id);
                }
                await saveLocalFriend({ ...created, _isOfflinePending: false });
              }
            } else if (item.action === 'update') {
              const updated = await ApiService.updateFriend(item.data.id, item.data);
              if (updated) {
                await saveLocalFriend({ ...updated, _isOfflinePending: false });
              }
            } else if (item.action === 'delete') {
              await ApiService.deleteFriend(item.data.id);
              await deleteLocalFriend(item.data.id);
            }
          } else if (item.entity === 'friend_entry') {
            if (item.action === 'create') {
              const entryPayload = { ...item.data };
              // Remap temporary parent friend_id if newly assigned
              if (entryPayload.friend_id && tempFriendIdMap.has(entryPayload.friend_id)) {
                entryPayload.friend_id = tempFriendIdMap.get(entryPayload.friend_id)!;
              }

              const created = await ApiService.createFriendEntry(entryPayload);
              if (created && created.id) {
                if (item.data?.id && item.data.id !== created.id) {
                  await deleteLocalFriendEntry(item.data.id);
                }
                await saveLocalFriendEntry({ ...created, _isOfflinePending: false });
              }
            } else if (item.action === 'update') {
              const updated = await ApiService.updateFriendEntry(item.data.id, item.data);
              if (updated) {
                await saveLocalFriendEntry({ ...updated, _isOfflinePending: false });
              }
            } else if (item.action === 'delete') {
              await ApiService.deleteFriendEntry(item.data.id);
              await deleteLocalFriendEntry(item.data.id);
            }
          } else if (item.entity === 'shopping_list') {
            if (item.action === 'create') {
              const created = await ApiService.createShoppingList(item.data);
              if (created && created.id) {
                if (item.data?.id && item.data.id !== created.id) {
                  tempShoppingListIdMap.set(item.data.id, created.id);
                  await deleteLocalShoppingList(item.data.id);
                }
                await saveLocalShoppingList({ ...created, _isOfflinePending: false });
              }
            } else if (item.action === 'update') {
              const updated = await ApiService.updateShoppingList(item.data.id, item.data);
              if (updated) {
                await saveLocalShoppingList({ ...updated, _isOfflinePending: false });
              }
            } else if (item.action === 'delete') {
              await ApiService.deleteShoppingList(item.data.id);
              await deleteLocalShoppingList(item.data.id);
            }
          } else if (item.entity === 'shopping_item') {
            if (item.action === 'create') {
              const itemPayload = { ...item.data };
              if (itemPayload.list_id && tempShoppingListIdMap.has(itemPayload.list_id)) {
                itemPayload.list_id = tempShoppingListIdMap.get(itemPayload.list_id)!;
              }
              const created = await ApiService.createShoppingItem(itemPayload);
              if (created && created.id) {
                if (item.data?.id && item.data.id !== created.id) {
                  await deleteLocalShoppingItem(item.data.id);
                }
                await saveLocalShoppingItem({ ...created, _isOfflinePending: false });
              }
            } else if (item.action === 'update') {
              const updated = await ApiService.updateShoppingItem(item.data.id, item.data);
              if (updated) {
                await saveLocalShoppingItem({ ...updated, _isOfflinePending: false });
              }
            } else if (item.action === 'delete') {
              await ApiService.deleteShoppingItem(item.data.id);
              await deleteLocalShoppingItem(item.data.id);
            }
          }

          successfulQueueIds.push(item.id);
        } catch (err: any) {
          // If table does not exist in remote Supabase schema cache, evict item gracefully so sync does not stall forever
          if (isMissingTableError(err)) {
            console.warn(`[Sync] Table for entity "${item.entity}" not found in database schema cache. Evicting from queue:`, item.id);
            successfulQueueIds.push(item.id);
          } else {
            console.warn('[Sync] Failed processing queue item:', item.id, err);
          }
        }
      }

      // 4. Bulk remove all successfully processed queue items in one fast IndexedDB transaction
      if (successfulQueueIds.length > 0) {
        await bulkRemoveFromSyncQueue(successfulQueueIds);
        // Dispatch sync event so TransactionContext, FriendMoneyContext, and ShoppingContext update local state
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hisab-sync-complete'));
          window.dispatchEvent(new CustomEvent('hisab-friend-sync-complete'));
          window.dispatchEvent(new CustomEvent('hisab-shopping-sync-complete'));
        }
      }

      const remaining = await getSyncQueue();
      setPendingCount(remaining.length);
      setSyncStatus(remaining.length === 0 ? 'synced' : 'waiting');
    } catch (err) {
      console.error('[Sync] Error during background sync process:', err);
      setSyncStatus('waiting');
    }
  };

  const syncDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSync = useCallback((): Promise<void> => {
    // Return active in-flight sync if currently running
    if (inFlightSyncPromiseRef.current) {
      return inFlightSyncPromiseRef.current;
    }

    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
    }

    const syncPromise = new Promise<void>((resolve) => {
      syncDebounceTimerRef.current = setTimeout(() => {
        executeSyncProcess()
          .finally(() => {
            inFlightSyncPromiseRef.current = null;
          })
          .then(resolve);
      }, 100);
    });

    inFlightSyncPromiseRef.current = syncPromise;
    return syncPromise;
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    const handleDataReset = () => {
      setPendingCount(0);
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('hisab-data-reset', handleDataReset);

    // Initial check on mount
    checkPendingQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hisab-data-reset', handleDataReset);
    };
  }, [checkPendingQueue, triggerSync]);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        syncStatus,
        pendingCount,
        triggerSync
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
