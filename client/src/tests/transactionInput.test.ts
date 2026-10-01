import { describe, expect, it } from 'vitest';
import { applyPreferredType } from '../lib/transactionInput.js';
import { DEFAULT_CLIENT_CATEGORIES } from '../lib/parserLocal.js';

const parsedExpense = {
  type: 'expense' as const,
  amount: 150,
  description: 'Coffee',
  category: 'Food & Drinks',
  categoryId: null,
  confidence: 0.98,
  date: '2026-10-01',
  rawInput: 'Coffee 150'
};

describe('applyPreferredType', () => {
  it('lets the user force an income entry from an ambiguous phrase', () => {
    const result = applyPreferredType(parsedExpense, DEFAULT_CLIENT_CATEGORIES, 'income');

    expect(result.type).toBe('income');
    expect(result.category).toBe('Other Income');
    expect(result.amount).toBe(150);
  });

  it('keeps parser details when the selected type already matches', () => {
    expect(applyPreferredType(parsedExpense, DEFAULT_CLIENT_CATEGORIES, 'expense')).toBe(parsedExpense);
  });
});
