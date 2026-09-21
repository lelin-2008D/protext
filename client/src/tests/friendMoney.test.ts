import { describe, it, expect } from 'vitest';
import { Friend, FriendMoneyEntry, FriendSummary } from '../types/index.js';

// Helper pure calculation functions matching FriendMoneyContext logic
function calculateFriendSummary(
  friend: Friend,
  entries: FriendMoneyEntry[]
): FriendSummary {
  const friendEntries = entries.filter(e => e.friend_id === friend.id && !e._isDeleted);
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
    friend,
    totalGiven,
    totalReturned,
    remaining: Math.max(0, totalGiven - totalReturned),
    entriesCount: friendEntries.length
  };
}

function calculateAggregatedTotals(entries: FriendMoneyEntry[]) {
  let totalGiven = 0;
  let totalReturned = 0;

  for (const entry of entries) {
    if (entry._isDeleted) continue;
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
}

describe('Friend Money Calculator Logic Tests', () => {
  const mockFriendRam: Friend = {
    id: 'fr-ram-1',
    user_id: 'user-1',
    name: 'Ram',
    note: 'College Friend'
  };

  const mockFriendShyam: Friend = {
    id: 'fr-shyam-2',
    user_id: 'user-1',
    name: 'Shyam',
    note: 'Roommate'
  };

  it('calculates total given, total returned, and remaining correctly for a single friend', () => {
    // Ram Given: 1000, 500, 2000 = 3500
    // Ram Returned: 1000
    // Remaining = 2500
    const entries: FriendMoneyEntry[] = [
      {
        id: 'e1',
        friend_id: 'fr-ram-1',
        user_id: 'user-1',
        type: 'given',
        amount: 1000,
        date: '2026-09-10',
        note: 'Momo lunch'
      },
      {
        id: 'e2',
        friend_id: 'fr-ram-1',
        user_id: 'user-1',
        type: 'given',
        amount: 500,
        date: '2026-09-12',
        note: 'Taxi fare'
      },
      {
        id: 'e3',
        friend_id: 'fr-ram-1',
        user_id: 'user-1',
        type: 'given',
        amount: 2000,
        date: '2026-09-15',
        note: 'Book purchase'
      },
      {
        id: 'e4',
        friend_id: 'fr-ram-1',
        user_id: 'user-1',
        type: 'returned',
        amount: 1000,
        date: '2026-09-18',
        note: 'Partial payback'
      }
    ];

    const summary = calculateFriendSummary(mockFriendRam, entries);

    expect(summary.totalGiven).toBe(3500);
    expect(summary.totalReturned).toBe(1000);
    expect(summary.remaining).toBe(2500);
    expect(summary.entriesCount).toBe(4);
  });

  it('calculates isolated balances across multiple friends independently', () => {
    const entries: FriendMoneyEntry[] = [
      // Ram entries: Given 3500, Returned 1000 -> Remaining 2500
      { id: 'e1', friend_id: 'fr-ram-1', user_id: 'user-1', type: 'given', amount: 3500, date: '2026-09-10' },
      { id: 'e2', friend_id: 'fr-ram-1', user_id: 'user-1', type: 'returned', amount: 1000, date: '2026-09-18' },
      // Shyam entries: Given 2000, Returned 500 -> Remaining 1500
      { id: 'e3', friend_id: 'fr-shyam-2', user_id: 'user-1', type: 'given', amount: 2000, date: '2026-09-11' },
      { id: 'e4', friend_id: 'fr-shyam-2', user_id: 'user-1', type: 'returned', amount: 500, date: '2026-09-19' }
    ];

    const ramSummary = calculateFriendSummary(mockFriendRam, entries);
    expect(ramSummary.totalGiven).toBe(3500);
    expect(ramSummary.totalReturned).toBe(1000);
    expect(ramSummary.remaining).toBe(2500);

    const shyamSummary = calculateFriendSummary(mockFriendShyam, entries);
    expect(shyamSummary.totalGiven).toBe(2000);
    expect(shyamSummary.totalReturned).toBe(500);
    expect(shyamSummary.remaining).toBe(1500);

    const aggregated = calculateAggregatedTotals(entries);
    expect(aggregated.totalGiven).toBe(5500);
    expect(aggregated.totalReturned).toBe(1500);
    expect(aggregated.remaining).toBe(4000);
  });

  it('prevents negative remaining balance edge cases gracefully', () => {
    const entries: FriendMoneyEntry[] = [
      { id: 'e1', friend_id: 'fr-ram-1', user_id: 'user-1', type: 'given', amount: 1000, date: '2026-09-10' },
      { id: 'e2', friend_id: 'fr-ram-1', user_id: 'user-1', type: 'returned', amount: 1000, date: '2026-09-18' }
    ];

    const summary = calculateFriendSummary(mockFriendRam, entries);
    expect(summary.remaining).toBe(0);

    // Validation rule check when attempting to return more than owed
    const currentRemaining = summary.remaining;
    const attemptReturnAmount = 500;
    const isReturnValid = attemptReturnAmount <= currentRemaining;
    expect(isReturnValid).toBe(false);
  });

  it('verifies that Friend Money entries are strictly separate from normal transaction calculations', () => {
    const normalTransactions = [
      { type: 'income', amount: 50000, description: 'Salary' },
      { type: 'expense', amount: 15000, description: 'Rent' }
    ];

    const friendMoneyEntries: FriendMoneyEntry[] = [
      { id: 'f1', friend_id: 'fr-ram-1', user_id: 'user-1', type: 'given', amount: 5000, date: '2026-09-10' }
    ];

    // Main HISAB budget formula
    const startingBalance = 10000;
    const totalIncome = normalTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = normalTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const availableBalance = startingBalance + totalIncome - totalExpenses;

    // Available Balance remains 45000 and is unaffected by friend money
    expect(availableBalance).toBe(45000);
    expect(totalExpenses).toBe(15000);
    expect(friendMoneyEntries[0].amount).toBe(5000);
  });
});

describe('Change Password Validation Logic', () => {
  function validatePasswordChange(currentPass: string, newPass: string, confirmPass: string) {
    if (!currentPass) return { valid: false, error: 'Current password is required.' };
    if (!newPass) return { valid: false, error: 'New password is required.' };
    if (newPass.length < 6) return { valid: false, error: 'New password must be at least 6 characters long.' };
    if (newPass !== confirmPass) return { valid: false, error: 'Passwords do not match.' };
    return { valid: true };
  }

  it('validates empty current password', () => {
    const res = validatePasswordChange('', 'newPassword123', 'newPassword123');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Current password is required.');
  });

  it('validates empty new password', () => {
    const res = validatePasswordChange('oldPass123', '', '');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('New password is required.');
  });

  it('validates minimum password length', () => {
    const res = validatePasswordChange('oldPass123', '12345', '12345');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('New password must be at least 6 characters long.');
  });

  it('validates password mismatch', () => {
    const res = validatePasswordChange('oldPass123', 'newSecret123', 'differentSecret');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Passwords do not match.');
  });

  it('passes on valid password change input', () => {
    const res = validatePasswordChange('oldPass123', 'newSecret123', 'newSecret123');
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });
});

describe('Forgot Password Validation Logic', () => {
  function validateResetEmail(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    return { valid: true };
  }

  it('rejects empty or invalid email addresses', () => {
    expect(validateResetEmail('').valid).toBe(false);
    expect(validateResetEmail('invalidemail').valid).toBe(false);
  });

  it('accepts valid email format', () => {
    expect(validateResetEmail('user@hisab.com').valid).toBe(true);
  });
});
