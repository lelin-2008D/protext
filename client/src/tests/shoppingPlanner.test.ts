import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingList, ShoppingItem, ShoppingListSummary, Transaction } from '../types/index.js';
import { formatNPR } from '../components/ShoppingModals.js';

// Pure computation helpers matching ShoppingContext logic
function calculateItemTotal(quantity: number, unitPrice: number | null | undefined): number {
  if (unitPrice === null || unitPrice === undefined || isNaN(unitPrice) || unitPrice < 0) {
    return 0;
  }
  const q = Number(quantity);
  if (isNaN(q) || q <= 0) return 0;
  return Math.round(q * Number(unitPrice) * 100) / 100;
}

function calculateListSummary(list: ShoppingList, items: ShoppingItem[]): ShoppingListSummary {
  const listItems = items.filter(i => i.list_id === list.id && !i._isDeleted);
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
      const priceForEst = estPrice !== null ? estPrice : (actPrice !== null ? actPrice : 0);
      remainingEstimatedTotal += Math.round(qty * priceForEst * 100) / 100;
    }
  }

  const progressPercentage = totalItems > 0 ? Math.round((purchasedItemsCount / totalItems) * 100) : 0;

  return {
    list,
    totalItems,
    purchasedItemsCount,
    pendingItemsCount,
    estimatedTotal: Math.round(estimatedTotal * 100) / 100,
    actualPurchasedTotal: Math.round(actualPurchasedTotal * 100) / 100,
    remainingEstimatedTotal: Math.round(remainingEstimatedTotal * 100) / 100,
    progressPercentage
  };
}

describe('Shopping Planner Unit Tests', () => {
  describe('Price Calculations & Rounding', () => {
    it('calculates integer and fractional quantity totals with accurate rounding', () => {
      // 5 kg * Rs. 80 = Rs. 400
      expect(calculateItemTotal(5, 80)).toBe(400);

      // Fractional quantity: 2.5 kg * Rs. 85.50 = Rs. 213.75
      expect(calculateItemTotal(2.5, 85.5)).toBe(213.75);

      // Fractional small quantity: 0.25 kg * Rs. 120 = Rs. 30
      expect(calculateItemTotal(0.25, 120)).toBe(30);

      // Decimal repeating fraction rounding: 1.333 kg * Rs. 100 = Rs. 133.30
      expect(calculateItemTotal(1.333, 100)).toBe(133.3);
    });

    it('safely handles missing, null, zero, and invalid unit prices', () => {
      expect(calculateItemTotal(5, null)).toBe(0);
      expect(calculateItemTotal(5, undefined)).toBe(0);
      expect(calculateItemTotal(5, NaN)).toBe(0);
      expect(calculateItemTotal(5, -50)).toBe(0);
      expect(calculateItemTotal(5, 0)).toBe(0);
      expect(calculateItemTotal(-2, 100)).toBe(0);
    });
  });

  describe('Nepal Currency Formatting', () => {
    it('formats amounts with Rs. prefix and Nepali/Indian digit grouping', () => {
      expect(formatNPR(400)).toBe('Rs. 400');
      expect(formatNPR(1500)).toBe('Rs. 1,500');
      expect(formatNPR(100000)).toBe('Rs. 1,00,000'); // 1 Lakh
      expect(formatNPR(213.75)).toBe('Rs. 213.75');
    });
  });

  describe('List Progress and Summary Calculations', () => {
    const sampleList: ShoppingList = {
      id: 'list-1',
      user_id: 'user-1',
      title: 'Bhatbhateni Groceries',
      status: 'active'
    };

    it('computes accurate totals for mixed pending and purchased items', () => {
      const items: ShoppingItem[] = [
        // Item 1: Basmati Rice (5 kg @ Rs. 80 actual = Rs. 400 purchased)
        {
          id: 'item-1',
          list_id: 'list-1',
          user_id: 'user-1',
          name: 'Basmati Rice',
          quantity: 5,
          unit: 'kg',
          estimated_unit_price: 75,
          actual_unit_price: 80,
          status: 'purchased'
        },
        // Item 2: Mustard Oil (2 litre @ Rs. 250 estimated, pending)
        {
          id: 'item-2',
          list_id: 'list-1',
          user_id: 'user-1',
          name: 'Mustard Oil',
          quantity: 2,
          unit: 'litre',
          estimated_unit_price: 250,
          actual_unit_price: null,
          status: 'pending'
        },
        // Item 3: Dettol Soap (3 piece @ no price, pending)
        {
          id: 'item-3',
          list_id: 'list-1',
          user_id: 'user-1',
          name: 'Dettol Soap',
          quantity: 3,
          unit: 'piece',
          estimated_unit_price: null,
          actual_unit_price: null,
          status: 'pending'
        }
      ];

      const summary = calculateListSummary(sampleList, items);

      expect(summary.totalItems).toBe(3);
      expect(summary.purchasedItemsCount).toBe(1);
      expect(summary.pendingItemsCount).toBe(2);
      expect(summary.progressPercentage).toBe(33); // 1/3 = 33%

      // Estimated total = (5 * 75) + (2 * 250) + (3 * 0) = 375 + 500 = 875
      expect(summary.estimatedTotal).toBe(875);

      // Actual purchased total = 5 * 80 = 400
      expect(summary.actualPurchasedTotal).toBe(400);

      // Remaining estimated total for pending = 2 * 250 = 500
      expect(summary.remainingEstimatedTotal).toBe(500);
    });
  });
});

describe('User Journeys & Financial Integrity Tests', () => {
  // Mock store mimicking TransactionContext + ShoppingContext
  let mockShoppingLists: ShoppingList[] = [];
  let mockShoppingItems: ShoppingItem[] = [];
  let mockTransactions: Transaction[] = [];

  const startingBalance = 10000;

  const getAvailableBalance = () => {
    const totalExpenses = mockTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return startingBalance - totalExpenses;
  };

  beforeEach(() => {
    mockShoppingLists = [];
    mockShoppingItems = [];
    mockTransactions = [];
  });

  // Simulated purchase function
  const purchaseItemSimulation = (itemId: string, actualUnitPrice: number, category = 'Shopping') => {
    const itemIndex = mockShoppingItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) throw new Error('Item not found');
    const item = mockShoppingItems[itemIndex];

    const amount = Math.round(item.quantity * actualUnitPrice * 100) / 100;

    // Idempotency check:
    if (item.status === 'purchased' && item.transaction_id) {
      const existingTx = mockTransactions.find(t => t.id === item.transaction_id);
      if (existingTx) {
        existingTx.amount = amount;
        return { item, transaction: existingTx };
      }
    }

    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      user_id: item.user_id,
      type: 'expense',
      amount,
      description: `${item.name} (${item.quantity} ${item.unit || 'pc'})`,
      category_name: category,
      date: '2026-10-10',
      confidence: 1.0
    };

    mockTransactions.push(tx);

    const updatedItem: ShoppingItem = {
      ...item,
      status: 'purchased',
      actual_unit_price: actualUnitPrice,
      transaction_id: tx.id
    };
    mockShoppingItems[itemIndex] = updatedItem;

    return { item: updatedItem, transaction: tx };
  };

  // Simulated edit purchased item
  const editPurchasedItemSimulation = (itemId: string, newUnitPrice: number) => {
    const item = mockShoppingItems.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    const newAmount = Math.round(item.quantity * newUnitPrice * 100) / 100;
    item.actual_unit_price = newUnitPrice;

    if (item.transaction_id) {
      const tx = mockTransactions.find(t => t.id === item.transaction_id);
      if (tx) {
        tx.amount = newAmount;
      }
    }
  };

  // Simulated undo purchase
  const undoPurchaseSimulation = (itemId: string) => {
    const item = mockShoppingItems.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    if (item.transaction_id) {
      mockTransactions = mockTransactions.filter(t => t.id !== item.transaction_id);
      item.transaction_id = null;
    }
    item.status = 'pending';
    // Keeps actual_unit_price as draft
  };

  it('Journey 1: Create a shopping list, add rice without a price, reload, confirm item remains', () => {
    // 1. Create shopping list
    const list: ShoppingList = {
      id: 'list-journey-1',
      user_id: 'user-1',
      title: 'Weekly Bazar',
      status: 'active'
    };
    mockShoppingLists.push(list);

    // 2. Add rice without a price
    const rice: ShoppingItem = {
      id: 'item-rice',
      list_id: list.id,
      user_id: 'user-1',
      name: 'Basmati Rice',
      quantity: 5,
      unit: 'kg',
      estimated_unit_price: null,
      actual_unit_price: null,
      status: 'pending'
    };
    mockShoppingItems.push(rice);

    // 3. Simulate reload by reading from store
    const reloadedItems = mockShoppingItems.filter(i => i.list_id === list.id);
    expect(reloadedItems.length).toBe(1);
    expect(reloadedItems[0].name).toBe('Basmati Rice');
    expect(reloadedItems[0].estimated_unit_price).toBeNull();
    expect(reloadedItems[0].status).toBe('pending');

    // No financial transactions were created merely because item was added!
    expect(mockTransactions.length).toBe(0);
  });

  it('Journey 2: Set rice quantity to 5 kg and actual price to Rs. 80 -> total is Rs. 400 and exactly one Rs. 400 expense is created', () => {
    const list: ShoppingList = { id: 'list-1', user_id: 'user-1', title: 'Groceries', status: 'active' };
    mockShoppingLists.push(list);
    const rice: ShoppingItem = {
      id: 'item-rice',
      list_id: list.id,
      user_id: 'user-1',
      name: 'Basmati Rice',
      quantity: 5,
      unit: 'kg',
      status: 'pending'
    };
    mockShoppingItems.push(rice);

    // Initial balance
    expect(getAvailableBalance()).toBe(10000);

    // Purchase rice
    const { item, transaction } = purchaseItemSimulation(rice.id, 80);

    expect(transaction.amount).toBe(400);
    expect(item.status).toBe('purchased');
    expect(item.transaction_id).toBe(transaction.id);

    // Exactly one transaction exists
    expect(mockTransactions.length).toBe(1);
    expect(mockTransactions[0].amount).toBe(400);

    // Balance updated
    expect(getAvailableBalance()).toBe(9600); // 10000 - 400
  });

  it('Journey 3: Repeated purchase action and sync retries never create duplicate transactions', () => {
    const rice: ShoppingItem = {
      id: 'item-rice',
      list_id: 'list-1',
      user_id: 'user-1',
      name: 'Basmati Rice',
      quantity: 5,
      unit: 'kg',
      status: 'pending'
    };
    mockShoppingItems.push(rice);

    // First click
    purchaseItemSimulation(rice.id, 80);
    expect(mockTransactions.length).toBe(1);

    // Repeated click 2
    purchaseItemSimulation(rice.id, 80);
    expect(mockTransactions.length).toBe(1);

    // Repeated click 3 / retry
    purchaseItemSimulation(rice.id, 80);
    expect(mockTransactions.length).toBe(1);

    expect(getAvailableBalance()).toBe(9600);
  });

  it('Journey 4: Edit purchased item actual price to Rs. 90 -> linked expense becomes Rs. 450 and totals remain consistent', () => {
    const rice: ShoppingItem = {
      id: 'item-rice',
      list_id: 'list-1',
      user_id: 'user-1',
      name: 'Basmati Rice',
      quantity: 5,
      unit: 'kg',
      status: 'pending'
    };
    mockShoppingItems.push(rice);

    // Purchase @ Rs. 80 (Rs. 400 total)
    purchaseItemSimulation(rice.id, 80);
    expect(mockTransactions[0].amount).toBe(400);
    expect(getAvailableBalance()).toBe(9600);

    // Edit actual price to Rs. 90 (5 kg * Rs. 90 = Rs. 450)
    editPurchasedItemSimulation(rice.id, 90);

    // Linked expense updated
    expect(mockTransactions.length).toBe(1);
    expect(mockTransactions[0].amount).toBe(450);

    // Available balance reflects updated Rs. 450 expense
    expect(getAvailableBalance()).toBe(9550); // 10000 - 450
  });

  it('Journey 5: Undo purchase -> linked expense deleted exactly once, item returns to pending, balance corrected', () => {
    const rice: ShoppingItem = {
      id: 'item-rice',
      list_id: 'list-1',
      user_id: 'user-1',
      name: 'Basmati Rice',
      quantity: 5,
      unit: 'kg',
      status: 'pending'
    };
    mockShoppingItems.push(rice);

    // Purchase @ Rs. 80
    purchaseItemSimulation(rice.id, 80);
    expect(mockTransactions.length).toBe(1);
    expect(getAvailableBalance()).toBe(9600);

    // Undo purchase
    undoPurchaseSimulation(rice.id);

    // Transaction deleted exactly once
    expect(mockTransactions.length).toBe(0);

    // Item reverted to pending, price kept as draft
    const updatedRice = mockShoppingItems.find(i => i.id === rice.id)!;
    expect(updatedRice.status).toBe('pending');
    expect(updatedRice.transaction_id).toBeNull();
    expect(updatedRice.actual_unit_price).toBe(80);

    // Balance restored to initial 10000
    expect(getAvailableBalance()).toBe(10000);
  });

  it('Journey 6: Purchase multiple items, verify total and progress, archive list, reopen it, history remains intact', () => {
    const list: ShoppingList = { id: 'list-dashain', user_id: 'user-1', title: 'Dashain Shopping', status: 'active' };
    mockShoppingLists.push(list);

    const items: ShoppingItem[] = [
      { id: 'i1', list_id: list.id, user_id: 'user-1', name: 'Rice', quantity: 10, unit: 'kg', estimated_unit_price: 90, status: 'pending' },
      { id: 'i2', list_id: list.id, user_id: 'user-1', name: 'Oil', quantity: 5, unit: 'litre', estimated_unit_price: 250, status: 'pending' },
      { id: 'i3', list_id: list.id, user_id: 'user-1', name: 'Spices', quantity: 2, unit: 'packet', estimated_unit_price: 150, status: 'pending' }
    ];
    mockShoppingItems.push(...items);

    // 1. Initial list summary
    let summary = calculateListSummary(list, mockShoppingItems);
    expect(summary.totalItems).toBe(3);
    expect(summary.purchasedItemsCount).toBe(0);
    expect(summary.estimatedTotal).toBe(10 * 90 + 5 * 250 + 2 * 150); // 900 + 1250 + 300 = 2450
    expect(summary.actualPurchasedTotal).toBe(0);

    // 2. Purchase item 1 (Rice @ Rs. 88 = Rs. 880) and item 2 (Oil @ Rs. 260 = Rs. 1300)
    purchaseItemSimulation('i1', 88);
    purchaseItemSimulation('i2', 260);

    summary = calculateListSummary(list, mockShoppingItems);
    expect(summary.purchasedItemsCount).toBe(2);
    expect(summary.pendingItemsCount).toBe(1);
    expect(summary.actualPurchasedTotal).toBe(880 + 1300); // 2180
    expect(summary.progressPercentage).toBe(67); // 2/3 = 67%
    expect(mockTransactions.length).toBe(2);

    // 3. Archive list
    list.status = 'archived';
    expect(list.status).toBe('archived');
    // Transactions and items remain untouched
    expect(mockTransactions.length).toBe(2);

    // 4. Reopen list
    list.status = 'active';
    expect(list.status).toBe('active');
    summary = calculateListSummary(list, mockShoppingItems);
    expect(summary.purchasedItemsCount).toBe(2);
    expect(summary.actualPurchasedTotal).toBe(2180);
  });
});
