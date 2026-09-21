import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, UserSettings, Category, Friend, FriendMoneyEntry } from '../types/index.js';

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'transaction' | 'settings' | 'category' | 'friend' | 'friend_entry';
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
  friends: {
    key: string;
    value: Friend;
    indexes: {
      'by-user': string;
    };
  };
  friend_entries: {
    key: string;
    value: FriendMoneyEntry;
    indexes: {
      'by-friend': string;
      'by-user': string;
      'by-date': string;
    };
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
const DB_VERSION = 2;

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

        // Friends Store
        if (!db.objectStoreNames.contains('friends')) {
          const friendStore = db.createObjectStore('friends', { keyPath: 'id' });
          friendStore.createIndex('by-user', 'user_id');
        }

        // Friend Entries Store
        if (!db.objectStoreNames.contains('friend_entries')) {
          const entryStore = db.createObjectStore('friend_entries', { keyPath: 'id' });
          entryStore.createIndex('by-friend', 'friend_id');
          entryStore.createIndex('by-user', 'user_id');
          entryStore.createIndex('by-date', 'date');
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

// Bulk put transactions in a single IndexedDB transaction
export async function saveLocalTransactions(txs: Transaction[]): Promise<void> {
  if (!txs || txs.length === 0) return;
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

export async function bulkDeleteLocalTransactions(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const db = await getDB();
  const tx = db.transaction('transactions', 'readwrite');
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
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

// Bulk delete queue items in a single IndexedDB transaction
export async function bulkRemoveFromSyncQueue(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const db = await getDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
}

// Collapse redundant pending queue operations safely without altering final intended state
export function collapseSyncQueue(items: SyncQueueItem[]): {
  collapsedItems: SyncQueueItem[];
  redundantQueueIds: string[];
} {
  if (!items || items.length <= 1) {
    return { collapsedItems: items || [], redundantQueueIds: [] };
  }

  const map = new Map<string, SyncQueueItem>();
  const redundantQueueIds: string[] = [];

  for (const item of items) {
    // Unique key per entity target
    const targetId = item.data?.id || item.id;
    const entityKey = `${item.entity}:${targetId}`;

    const existing = map.get(entityKey);

    if (!existing) {
      map.set(entityKey, { ...item });
      continue;
    }

    // Existing action + New action coalescing
    if (existing.action === 'create') {
      if (item.action === 'update') {
        // create + update => merged create
        existing.data = { ...existing.data, ...item.data };
        existing.timestamp = item.timestamp;
        redundantQueueIds.push(item.id);
      } else if (item.action === 'delete') {
        // create + delete offline => completely discard from server sync!
        redundantQueueIds.push(existing.id, item.id);
        map.delete(entityKey);
      }
    } else if (existing.action === 'update') {
      if (item.action === 'update') {
        // update + update => merged single update
        existing.data = { ...existing.data, ...item.data };
        existing.timestamp = item.timestamp;
        redundantQueueIds.push(item.id);
      } else if (item.action === 'delete') {
        // update + delete => single delete action
        existing.action = 'delete';
        existing.data = { id: targetId };
        existing.timestamp = item.timestamp;
        redundantQueueIds.push(item.id);
      }
    } else if (existing.action === 'delete') {
      // already deleting, subsequent actions are redundant
      redundantQueueIds.push(item.id);
    } else {
      map.set(entityKey, { ...item });
    }
  }

  return {
    collapsedItems: Array.from(map.values()),
    redundantQueueIds
  };
}

// SYNC TIMESTAMP HELPERS FOR INCREMENTAL DELTA
const LAST_SYNC_KEY_PREFIX = 'hisab_last_sync_';

export function getLastSyncTime(userId: string): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY_PREFIX + userId);
  } catch {
    return null;
  }
}

export function saveLastSyncTime(userId: string, timestamp: string): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY_PREFIX + userId, timestamp);
  } catch {
    // ignore
  }
}

export function clearLastSyncTime(userId: string): void {
  try {
    localStorage.removeItem(LAST_SYNC_KEY_PREFIX + userId);
  } catch {
    // ignore
  }
}

// FRIENDS LOCAL CACHE HELPERS
export async function getLocalFriends(userId: string): Promise<Friend[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('friends', 'by-user', userId);
  return all
    .filter(f => !f._isDeleted)
    .sort((a, b) => (a.name.localeCompare(b.name)));
}

export async function saveLocalFriend(friend: Friend): Promise<void> {
  const db = await getDB();
  await db.put('friends', friend);
}

export async function saveLocalFriends(friends: Friend[]): Promise<void> {
  if (!friends || friends.length === 0) return;
  const db = await getDB();
  const tx = db.transaction('friends', 'readwrite');
  for (const item of friends) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function deleteLocalFriend(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('friends', id);
  // Clean up associated entries locally
  await deleteLocalFriendEntriesByFriend(id);
}

// FRIEND MONEY ENTRIES LOCAL CACHE HELPERS
export async function getLocalFriendEntries(userId: string, friendId?: string): Promise<FriendMoneyEntry[]> {
  const db = await getDB();
  let entries: FriendMoneyEntry[] = [];
  if (friendId) {
    entries = await db.getAllFromIndex('friend_entries', 'by-friend', friendId);
  } else {
    entries = await db.getAllFromIndex('friend_entries', 'by-user', userId);
  }
  return entries
    .filter(e => !e._isDeleted && e.user_id === userId)
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

export async function saveLocalFriendEntry(entry: FriendMoneyEntry): Promise<void> {
  const db = await getDB();
  await db.put('friend_entries', entry);
}

export async function saveLocalFriendEntries(entries: FriendMoneyEntry[]): Promise<void> {
  if (!entries || entries.length === 0) return;
  const db = await getDB();
  const tx = db.transaction('friend_entries', 'readwrite');
  for (const item of entries) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function deleteLocalFriendEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('friend_entries', id);
}

export async function deleteLocalFriendEntriesByFriend(friendId: string): Promise<void> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('friend_entries', 'by-friend', friendId);
  if (entries.length === 0) return;
  const tx = db.transaction('friend_entries', 'readwrite');
  for (const entry of entries) {
    await tx.store.delete(entry.id);
  }
  await tx.done;
}

export async function clearLocalDB(): Promise<void> {
  const db = await getDB();
  await db.clear('transactions');
  await db.clear('settings');
  await db.clear('syncQueue');
  try {
    if (db.objectStoreNames.contains('friends')) {
      await db.clear('friends');
    }
    if (db.objectStoreNames.contains('friend_entries')) {
      await db.clear('friend_entries');
    }
  } catch {
    // ignore
  }
}
