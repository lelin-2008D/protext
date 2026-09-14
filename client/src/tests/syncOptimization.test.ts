import { describe, it, expect } from 'vitest';
import { collapseSyncQueue, SyncQueueItem } from '../lib/db.js';

describe('Sync Queue Optimization & Coalescing', () => {
  it('collapses multiple updates into a single final update with merged fields', () => {
    const rawQueue: SyncQueueItem[] = [
      {
        id: 'queue-1',
        action: 'update',
        entity: 'transaction',
        data: { id: 'tx-100', amount: 500, description: 'Lunch' },
        timestamp: 1000
      },
      {
        id: 'queue-2',
        action: 'update',
        entity: 'transaction',
        data: { id: 'tx-100', amount: 600 },
        timestamp: 2000
      }
    ];

    const { collapsedItems, redundantQueueIds } = collapseSyncQueue(rawQueue);

    expect(collapsedItems.length).toBe(1);
    expect(collapsedItems[0].action).toBe('update');
    expect(collapsedItems[0].data.amount).toBe(600);
    expect(collapsedItems[0].data.description).toBe('Lunch');
    expect(redundantQueueIds).toEqual(['queue-2']);
  });

  it('collapses create followed by update into a single create with final data', () => {
    const rawQueue: SyncQueueItem[] = [
      {
        id: 'queue-create',
        action: 'create',
        entity: 'transaction',
        data: { id: 'temp-tx-1', amount: 200, description: 'Momo' },
        timestamp: 1000
      },
      {
        id: 'queue-update',
        action: 'update',
        entity: 'transaction',
        data: { id: 'temp-tx-1', amount: 250, description: 'Buff Momo' },
        timestamp: 2000
      }
    ];

    const { collapsedItems, redundantQueueIds } = collapseSyncQueue(rawQueue);

    expect(collapsedItems.length).toBe(1);
    expect(collapsedItems[0].action).toBe('create');
    expect(collapsedItems[0].data.amount).toBe(250);
    expect(collapsedItems[0].data.description).toBe('Buff Momo');
    expect(redundantQueueIds).toEqual(['queue-update']);
  });

  it('discards offline create followed by offline delete (no cloud action needed)', () => {
    const rawQueue: SyncQueueItem[] = [
      {
        id: 'queue-create',
        action: 'create',
        entity: 'transaction',
        data: { id: 'temp-tx-2', amount: 100, description: 'Tea' },
        timestamp: 1000
      },
      {
        id: 'queue-delete',
        action: 'delete',
        entity: 'transaction',
        data: { id: 'temp-tx-2' },
        timestamp: 2000
      }
    ];

    const { collapsedItems, redundantQueueIds } = collapseSyncQueue(rawQueue);

    expect(collapsedItems.length).toBe(0);
    expect(redundantQueueIds).toContain('queue-create');
    expect(redundantQueueIds).toContain('queue-delete');
  });

  it('keeps independent operations intact for concurrent processing', () => {
    const rawQueue: SyncQueueItem[] = [
      {
        id: 'queue-1',
        action: 'create',
        entity: 'transaction',
        data: { id: 'tx-1', amount: 100, description: 'Tea' },
        timestamp: 1000
      },
      {
        id: 'queue-2',
        action: 'create',
        entity: 'transaction',
        data: { id: 'tx-2', amount: 300, description: 'Taxi' },
        timestamp: 1005
      },
      {
        id: 'queue-3',
        action: 'update',
        entity: 'settings',
        data: { starting_balance: 5000 },
        timestamp: 1010
      }
    ];

    const { collapsedItems, redundantQueueIds } = collapseSyncQueue(rawQueue);

    expect(collapsedItems.length).toBe(3);
    expect(redundantQueueIds.length).toBe(0);
  });
});
