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
  deleteLocalFriendEntry
} from '../lib/db.js';
import { ApiService } from '../lib/api.js';

interface SyncContextType {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

// Concurrency limit for parallel sync of independent entities
const MAX_CONCURRENT_SYNC = 4;

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item)).then(res => {
      results.push(res);
    });
    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
      for (let i = executing.length - 1; i >= 0; i--) {
        // Remove settled promises
        executing.splice(i, 1);
      }
    }
  }

  await Promise.all(executing);
  return results;
}

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

      // 2. Process independent entity mutations concurrently
      const successfulQueueIds: string[] = [];

      await mapConcurrent(collapsedItems, MAX_CONCURRENT_SYNC, async item => {
        try {
          if (item.entity === 'transaction') {
            if (item.action === 'create') {
              const created = await ApiService.createTransaction(item.data);
              if (created && created.id) {
                // If the created transaction was given a new ID by server/Supabase, remove tempId
                if (item.data?.id && item.data.id !== created.id) {
                  await deleteLocalTransaction(item.data.id);
                  await saveLocalTransaction({ ...created, _isOfflinePending: false });
                } else {
                  await saveLocalTransaction({ ...created, _isOfflinePending: false });
                }
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
                  await deleteLocalFriend(item.data.id);
                  await saveLocalFriend({ ...created, _isOfflinePending: false });
                } else {
                  await saveLocalFriend({ ...created, _isOfflinePending: false });
                }
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
              const created = await ApiService.createFriendEntry(item.data);
              if (created && created.id) {
                if (item.data?.id && item.data.id !== created.id) {
                  await deleteLocalFriendEntry(item.data.id);
                  await saveLocalFriendEntry({ ...created, _isOfflinePending: false });
                } else {
                  await saveLocalFriendEntry({ ...created, _isOfflinePending: false });
                }
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
          }

          successfulQueueIds.push(item.id);
        } catch (err) {
          console.warn('[Sync] Failed processing queue item:', item.id, err);
          // Item stays in queue for subsequent retry
        }
      });

      // 3. Bulk remove all successfully processed queue items in one fast IndexedDB transaction
      if (successfulQueueIds.length > 0) {
        await bulkRemoveFromSyncQueue(successfulQueueIds);
        // Dispatch sync event so TransactionContext and FriendMoneyContext update local state
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hisab-sync-complete'));
          window.dispatchEvent(new CustomEvent('hisab-friend-sync-complete'));
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

  const triggerSync = useCallback((): Promise<void> => {
    // If a sync process is already actively running, return the existing in-flight promise
    if (inFlightSyncPromiseRef.current) {
      return inFlightSyncPromiseRef.current;
    }

    const syncPromise = executeSyncProcess().finally(() => {
      inFlightSyncPromiseRef.current = null;
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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    checkPendingQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
