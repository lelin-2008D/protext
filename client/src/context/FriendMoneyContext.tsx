import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Friend, FriendMoneyEntry, FriendSummary, FriendEntryType } from '../types/index.js';
import { useAuth } from './AuthContext.js';
import { useSync } from './SyncContext.js';
import { ApiService } from '../lib/api.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  getLocalFriends,
  saveLocalFriend,
  saveLocalFriends,
  deleteLocalFriend,
  getLocalFriendEntries,
  saveLocalFriendEntry,
  saveLocalFriendEntries,
  deleteLocalFriendEntry,
  deleteLocalFriendEntriesByFriend,
  addToSyncQueue
} from '../lib/db.js';

interface FriendMoneyTotals {
  totalGiven: number;
  totalReturned: number;
  remaining: number;
}

interface FriendMoneyContextType {
  friends: Friend[];
  friendEntries: FriendMoneyEntry[];
  loading: boolean;
  totals: FriendMoneyTotals;
  addFriend: (data: { name: string; note?: string }) => Promise<Friend>;
  editFriend: (id: string, updates: { name: string; note?: string }) => Promise<void>;
  deleteFriend: (id: string) => Promise<void>;
  addFriendEntry: (data: {
    friend_id: string;
    type: FriendEntryType;
    amount: number;
    date?: string;
    note?: string;
  }) => Promise<FriendMoneyEntry>;
  editFriendEntry: (id: string, updates: Partial<FriendMoneyEntry>) => Promise<void>;
  deleteFriendEntry: (id: string) => Promise<void>;
  getFriendSummary: (friendId: string) => FriendSummary | null;
  getEntriesForFriend: (friendId: string) => FriendMoneyEntry[];
  refreshFriendData: () => Promise<void>;
}

const FriendMoneyContext = createContext<FriendMoneyContextType | undefined>(undefined);

export const FriendMoneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isOnline } = useSync();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendEntries, setFriendEntries] = useState<FriendMoneyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Data: Local IndexedDB first, then cloud reconcile if online
  const loadData = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setFriendEntries([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Local instant load from IndexedDB
      const [localFriends, localEntries] = await Promise.all([
        getLocalFriends(user.id),
        getLocalFriendEntries(user.id)
      ]);

      setFriends(localFriends || []);
      setFriendEntries(localEntries || []);
      setLoading(false);

      // 2. Cloud fetch if online
      if (navigator.onLine) {
        try {
          const [remoteFriends, remoteEntries] = await Promise.all([
            ApiService.getFriends(),
            ApiService.getFriendEntries()
          ]);

          if (remoteFriends && remoteFriends.length > 0) {
            setFriends(remoteFriends);
            await saveLocalFriends(remoteFriends);
          }
          if (remoteEntries && remoteEntries.length > 0) {
            setFriendEntries(remoteEntries);
            await saveLocalFriendEntries(remoteEntries);
          }
        } catch (apiErr) {
          console.warn('[FriendMoneyContext] Background fetch warning:', apiErr);
        }
      }
    } catch (err) {
      console.error('[FriendMoneyContext] Error loading friend data:', err);
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
        const [freshFriends, freshEntries] = await Promise.all([
          getLocalFriends(user.id),
          getLocalFriendEntries(user.id)
        ]);
        if (freshFriends) setFriends(freshFriends);
        if (freshEntries) setFriendEntries(freshEntries);
      }
    };

    window.addEventListener('hisab-friend-sync-complete', handleSyncComplete);
    return () => {
      window.removeEventListener('hisab-friend-sync-complete', handleSyncComplete);
    };
  }, [user]);

  // Multi-device Realtime subscriptions for friends and entries
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user || user.id.startsWith('guest-')) {
      return;
    }

    const friendsChannel = supabase
      .channel(`realtime-friends-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `user_id=eq.${user.id}`
        },
        async payload => {
          const { eventType, new: newRecord, old: oldRecord } = payload as any;
          if (eventType === 'INSERT' && newRecord) {
            setFriends(prev => {
              if (prev.some(f => f.id === newRecord.id)) return prev;
              const filtered = prev.filter(f => f.id !== newRecord.id && !(f._isOfflinePending && f.name === newRecord.name));
              return [...filtered, newRecord].sort((a, b) => a.name.localeCompare(b.name));
            });
            await saveLocalFriend(newRecord);
          } else if (eventType === 'UPDATE' && newRecord) {
            setFriends(prev => prev.map(f => (f.id === newRecord.id ? newRecord : f)).sort((a, b) => a.name.localeCompare(b.name)));
            await saveLocalFriend(newRecord);
          } else if (eventType === 'DELETE' && oldRecord) {
            setFriends(prev => prev.filter(f => f.id !== oldRecord.id));
            await deleteLocalFriend(oldRecord.id);
          }
        }
      )
      .subscribe();

    const entriesChannel = supabase
      .channel(`realtime-friend-entries-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_money_entries',
          filter: `user_id=eq.${user.id}`
        },
        async payload => {
          const { eventType, new: newRecord, old: oldRecord } = payload as any;
          if (eventType === 'INSERT' && newRecord) {
            const formatted: FriendMoneyEntry = {
              ...newRecord,
              amount: Number(newRecord.amount)
            };
            setFriendEntries(prev => {
              if (prev.some(e => e.id === formatted.id)) return prev;
              const filtered = prev.filter(e => e.id !== formatted.id && !(e._isOfflinePending && e.friend_id === formatted.friend_id && e.amount === formatted.amount));
              return [formatted, ...filtered].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
            });
            await saveLocalFriendEntry(formatted);
          } else if (eventType === 'UPDATE' && newRecord) {
            const formatted: FriendMoneyEntry = {
              ...newRecord,
              amount: Number(newRecord.amount)
            };
            setFriendEntries(prev => prev.map(e => (e.id === formatted.id ? formatted : e)));
            await saveLocalFriendEntry(formatted);
          } else if (eventType === 'DELETE' && oldRecord) {
            setFriendEntries(prev => prev.filter(e => e.id !== oldRecord.id));
            await deleteLocalFriendEntry(oldRecord.id);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(friendsChannel);
        supabase.removeChannel(entriesChannel);
      }
    };
  }, [user]);

  // Overall totals across all friends
  const totals = useMemo<FriendMoneyTotals>(() => {
    let totalGiven = 0;
    let totalReturned = 0;

    for (const entry of friendEntries) {
      const amt = Number(entry.amount || 0);
      if (entry.type === 'given') {
        totalGiven += amt;
      } else if (entry.type === 'returned') {
        totalReturned += amt;
      }
    }

    return {
      totalGiven,
      totalReturned,
      remaining: Math.max(0, totalGiven - totalReturned)
    };
  }, [friendEntries]);

  // Helper to calculate summary for a single friend
  const getFriendSummary = useCallback(
    (friendId: string): FriendSummary | null => {
      const friend = friends.find(f => f.id === friendId);
      if (!friend) return null;

      const entries = friendEntries.filter(e => e.friend_id === friendId);
      let totalGiven = 0;
      let totalReturned = 0;

      for (const entry of entries) {
        const amt = Number(entry.amount || 0);
        if (entry.type === 'given') {
          totalGiven += amt;
        } else if (entry.type === 'returned') {
          totalReturned += amt;
        }
      }

      return {
        friend,
        totalGiven,
        totalReturned,
        remaining: Math.max(0, totalGiven - totalReturned),
        entriesCount: entries.length
      };
    },
    [friends, friendEntries]
  );

  const getEntriesForFriend = useCallback(
    (friendId: string): FriendMoneyEntry[] => {
      return friendEntries
        .filter(e => e.friend_id === friendId)
        .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    },
    [friendEntries]
  );

  // ACTION: Add Friend
  const addFriend = useCallback(
    async (data: { name: string; note?: string }): Promise<Friend> => {
      if (!user) throw new Error('User not logged in');
      const cleanName = data.name.trim();
      if (!cleanName) throw new Error('Friend name is required');

      const tempId = 'fr-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      const newFriend: Friend = {
        id: tempId,
        user_id: user.id,
        name: cleanName,
        note: data.note?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOfflinePending: !isOnline
      };

      // 1. Optimistically update local state & IndexedDB
      setFriends(prev => [...prev, newFriend].sort((a, b) => a.name.localeCompare(b.name)));
      await saveLocalFriend(newFriend);

      // 2. Sync to API / Enqueue
      if (isOnline) {
        try {
          const created = await ApiService.createFriend({
            name: cleanName,
            note: data.note?.trim() || null
          });
          setFriends(prev => prev.map(f => (f.id === tempId ? created : f)).sort((a, b) => a.name.localeCompare(b.name)));
          await deleteLocalFriend(tempId);
          await saveLocalFriend(created);
          return created;
        } catch (err) {
          console.warn('[FriendMoneyContext] Online creation failed, enqueuing:', err);
          await addToSyncQueue({
            id: tempId,
            action: 'create',
            entity: 'friend',
            data: newFriend
          });
        }
      } else {
        await addToSyncQueue({
          id: tempId,
          action: 'create',
          entity: 'friend',
          data: newFriend
        });
      }

      return newFriend;
    },
    [user, isOnline]
  );

  // ACTION: Edit Friend
  const editFriend = useCallback(
    async (id: string, updates: { name: string; note?: string }): Promise<void> => {
      if (!user) return;
      const cleanName = updates.name.trim();
      if (!cleanName) throw new Error('Friend name is required');

      let updatedFriend: Friend | null = null;
      setFriends(prev =>
        prev.map(f => {
          if (f.id === id) {
            updatedFriend = {
              ...f,
              name: cleanName,
              note: updates.note !== undefined ? updates.note?.trim() || null : f.note,
              updated_at: new Date().toISOString()
            };
            return updatedFriend;
          }
          return f;
        }).sort((a, b) => a.name.localeCompare(b.name))
      );

      if (updatedFriend) {
        await saveLocalFriend(updatedFriend);
      }

      const payload = {
        name: cleanName,
        note: updates.note?.trim() || null
      };

      if (isOnline) {
        try {
          await ApiService.updateFriend(id, payload);
        } catch (err) {
          await addToSyncQueue({
            id: `edit-fr-${id}-${Date.now()}`,
            action: 'update',
            entity: 'friend',
            data: { id, ...payload }
          });
        }
      } else {
        await addToSyncQueue({
          id: `edit-fr-${id}-${Date.now()}`,
          action: 'update',
          entity: 'friend',
          data: { id, ...payload }
        });
      }
    },
    [user, isOnline]
  );

  // ACTION: Delete Friend
  const deleteFriend = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;

      setFriends(prev => prev.filter(f => f.id !== id));
      setFriendEntries(prev => prev.filter(e => e.friend_id !== id));
      await deleteLocalFriend(id);
      await deleteLocalFriendEntriesByFriend(id);

      if (isOnline) {
        try {
          await ApiService.deleteFriend(id);
        } catch (err) {
          await addToSyncQueue({
            id: `del-fr-${id}-${Date.now()}`,
            action: 'delete',
            entity: 'friend',
            data: { id }
          });
        }
      } else {
        await addToSyncQueue({
          id: `del-fr-${id}-${Date.now()}`,
          action: 'delete',
          entity: 'friend',
          data: { id }
        });
      }
    },
    [user, isOnline]
  );

  // ACTION: Add Friend Money Entry
  const addFriendEntry = useCallback(
    async (data: {
      friend_id: string;
      type: FriendEntryType;
      amount: number;
      date?: string;
      note?: string;
    }): Promise<FriendMoneyEntry> => {
      if (!user) throw new Error('User not logged in');
      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      // Edge case check: Amount returned cannot exceed the remaining given balance
      if (data.type === 'returned') {
        const summary = getFriendSummary(data.friend_id);
        const currentRemaining = summary ? summary.remaining : 0;
        if (numAmount > currentRemaining) {
          throw new Error(
            `Amount returned (Rs. ${numAmount.toLocaleString('en-IN')}) cannot exceed the amount currently owed (Rs. ${currentRemaining.toLocaleString('en-IN')}).`
          );
        }
      }

      const tempId = 'fre-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      const newEntry: FriendMoneyEntry = {
        id: tempId,
        friend_id: data.friend_id,
        user_id: user.id,
        type: data.type,
        amount: numAmount,
        date: data.date || new Date().toISOString().split('T')[0],
        note: data.note?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOfflinePending: !isOnline
      };

      // 1. Optimistic update
      setFriendEntries(prev => [newEntry, ...prev].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)));
      await saveLocalFriendEntry(newEntry);

      const payload = {
        friend_id: data.friend_id,
        type: data.type,
        amount: numAmount,
        date: newEntry.date,
        note: newEntry.note
      };

      // 2. Sync / Queue
      if (isOnline) {
        try {
          const created = await ApiService.createFriendEntry(payload);
          setFriendEntries(prev => prev.map(e => (e.id === tempId ? created : e)).sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)));
          await deleteLocalFriendEntry(tempId);
          await saveLocalFriendEntry(created);
          return created;
        } catch (err) {
          console.warn('[FriendMoneyContext] Online entry creation failed, enqueuing:', err);
          await addToSyncQueue({
            id: tempId,
            action: 'create',
            entity: 'friend_entry',
            data: newEntry
          });
        }
      } else {
        await addToSyncQueue({
          id: tempId,
          action: 'create',
          entity: 'friend_entry',
          data: newEntry
        });
      }

      return newEntry;
    },
    [user, isOnline, getFriendSummary]
  );

  // ACTION: Edit Friend Money Entry
  const editFriendEntry = useCallback(
    async (id: string, updates: Partial<FriendMoneyEntry>): Promise<void> => {
      if (!user) return;

      const existing = friendEntries.find(e => e.id === id);
      if (!existing) return;

      const targetType = updates.type || existing.type;
      const targetAmount = updates.amount !== undefined ? Number(updates.amount) : existing.amount;

      if (isNaN(targetAmount) || targetAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      // If updating a returned entry, verify remaining balance headroom
      if (targetType === 'returned') {
        const friendId = updates.friend_id || existing.friend_id;
        const allFriendEntries = friendEntries.filter(e => e.friend_id === friendId && e.id !== id);
        let totalGiven = 0;
        let otherReturned = 0;
        for (const e of allFriendEntries) {
          if (e.type === 'given') totalGiven += Number(e.amount || 0);
          else if (e.type === 'returned') otherReturned += Number(e.amount || 0);
        }
        const maxReturnable = Math.max(0, totalGiven - otherReturned);
        if (targetAmount > maxReturnable) {
          throw new Error(
            `Amount returned (Rs. ${targetAmount.toLocaleString('en-IN')}) cannot exceed the maximum returnable balance (Rs. ${maxReturnable.toLocaleString('en-IN')}).`
          );
        }
      }

      let updatedEntry: FriendMoneyEntry | null = null;
      setFriendEntries(prev =>
        prev.map(e => {
          if (e.id === id) {
            updatedEntry = {
              ...e,
              ...updates,
              amount: targetAmount,
              note: updates.note !== undefined ? updates.note?.trim() || null : e.note,
              updated_at: new Date().toISOString()
            };
            return updatedEntry;
          }
          return e;
        }).sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
      );

      if (updatedEntry) {
        await saveLocalFriendEntry(updatedEntry);
      }

      const payload = {
        ...updates,
        amount: targetAmount,
        note: updates.note !== undefined ? updates.note?.trim() || null : existing.note
      };

      if (isOnline) {
        try {
          await ApiService.updateFriendEntry(id, payload);
        } catch (err) {
          await addToSyncQueue({
            id: `edit-fre-${id}-${Date.now()}`,
            action: 'update',
            entity: 'friend_entry',
            data: { id, ...payload }
          });
        }
      } else {
        await addToSyncQueue({
          id: `edit-fre-${id}-${Date.now()}`,
          action: 'update',
          entity: 'friend_entry',
          data: { id, ...payload }
        });
      }
    },
    [user, isOnline, friendEntries]
  );

  // ACTION: Delete Friend Money Entry
  const deleteFriendEntry = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;

      setFriendEntries(prev => prev.filter(e => e.id !== id));
      await deleteLocalFriendEntry(id);

      if (isOnline) {
        try {
          await ApiService.deleteFriendEntry(id);
        } catch (err) {
          await addToSyncQueue({
            id: `del-fre-${id}-${Date.now()}`,
            action: 'delete',
            entity: 'friend_entry',
            data: { id }
          });
        }
      } else {
        await addToSyncQueue({
          id: `del-fre-${id}-${Date.now()}`,
          action: 'delete',
          entity: 'friend_entry',
          data: { id }
        });
      }
    },
    [user, isOnline]
  );

  const refreshFriendData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return (
    <FriendMoneyContext.Provider
      value={{
        friends,
        friendEntries,
        loading,
        totals,
        addFriend,
        editFriend,
        deleteFriend,
        addFriendEntry,
        editFriendEntry,
        deleteFriendEntry,
        getFriendSummary,
        getEntriesForFriend,
        refreshFriendData
      }}
    >
      {children}
    </FriendMoneyContext.Provider>
  );
};

export const useFriendMoney = () => {
  const context = useContext(FriendMoneyContext);
  if (!context) {
    throw new Error('useFriendMoney must be used within a FriendMoneyProvider');
  }
  return context;
};
