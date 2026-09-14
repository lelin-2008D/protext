import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SyncStatus } from '../types/index.js';
import { getSyncQueue, removeFromSyncQueue } from '../lib/db.js';
import { ApiService } from '../lib/api.js';

interface SyncContextType {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'synced' : 'offline');
  const [pendingCount, setPendingCount] = useState<number>(0);

  const checkPendingQueue = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setPendingCount(queue.length);
      if (queue.length > 0 && navigator.onLine) {
        setSyncStatus('waiting');
      } else if (!navigator.onLine) {
        setSyncStatus('offline');
      } else {
        setSyncStatus('synced');
      }
    } catch {
      // ignore
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) {
        setSyncStatus('synced');
        setPendingCount(0);
        return;
      }

      setSyncStatus('syncing');

      for (const item of queue) {
        try {
          if (item.entity === 'transaction') {
            if (item.action === 'create') {
              await ApiService.createTransaction(item.data);
            } else if (item.action === 'update') {
              await ApiService.updateTransaction(item.data.id, item.data);
            } else if (item.action === 'delete') {
              await ApiService.deleteTransaction(item.data.id);
            }
          } else if (item.entity === 'settings' && item.action === 'update') {
            await ApiService.updateSettings(item.data);
          } else if (item.entity === 'category' && item.action === 'create') {
            await ApiService.createCategory(item.data);
          }

          // Successfully processed item
          await removeFromSyncQueue(item.id);
        } catch (err) {
          console.warn('[Sync] Failed to process queue item:', item, err);
          // Keep in queue for retry
        }
      }

      const remaining = await getSyncQueue();
      setPendingCount(remaining.length);
      setSyncStatus(remaining.length === 0 ? 'synced' : 'waiting');
    } catch (err) {
      console.error('[Sync] Error during sync process:', err);
      setSyncStatus('waiting');
    }
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

    // Initial check
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
