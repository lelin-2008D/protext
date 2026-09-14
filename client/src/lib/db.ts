import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, UserSettings, Category } from '../types/index.js';

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'transaction' | 'settings' | 'category';
  data?: any;
  timestamp: number;
}

interface HisabDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-user': string;
      'by-pending': number;
    };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  categories: {
    key: string;
    value: Category;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-timestamp': number;
    };
  };
}

const DB_NAME = 'hisab_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HisabDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<HisabDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HisabDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Transactions Store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-user', 'user_id');
          txStore.createIndex('by-pending', '_isOfflinePending');
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'user_id' });
        }

        // Categories Store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // Sync Queue Store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-timestamp', 'timestamp');
        }
      }
    });
  }
  return dbPromise;
}

// TRANSACTION LOCAL CACHE HELPERS
export async function getLocalTransactions(userId: string): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('transactions', 'by-user', userId);
  return all
    .filter(t => !t._isDeleted)
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

export async function saveLocalTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function saveLocalTransactions(txs: Transaction[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('transactions', 'readwrite');
  for (const item of txs) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function deleteLocalTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

// SETTINGS LOCAL CACHE HELPERS
export async function getLocalSettings(userId: string): Promise<UserSettings | undefined> {
  const db = await getDB();
  return db.get('settings', userId);
}

export async function saveLocalSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// SYNC QUEUE HELPERS
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'timestamp'>): Promise<void> {
  const db = await getDB();
  await db.put('syncQueue', {
    ...item,
    timestamp: Date.now()
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-timestamp');
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function clearLocalDB(): Promise<void> {
  const db = await getDB();
  await db.clear('transactions');
  await db.clear('settings');
  await db.clear('syncQueue');
}
