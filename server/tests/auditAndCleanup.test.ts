import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { StoreService } from '../src/services/store.js';

describe('Backend Data Audit, Cleanup & Financial Integrity Tests', () => {
  const app = createApp();
  const alice = 'Bearer mock-user-alice';
  const bob = 'Bearer mock-user-bob';

  beforeEach(() => {
    StoreService.clearMemory();
  });

  describe('1. Confirmed Deduplication vs. Legitimate Transactions', () => {
    it('prevents rapid duplicate transaction submissions (< 3 seconds window)', async () => {
      // First transaction submission
      const txPayload = {
        type: 'expense',
        amount: 250,
        description: 'Momo at local shop',
        category_name: 'Food & Drinks',
        date: '2026-10-11'
      };

      const res1 = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send(txPayload);

      expect(res1.status).toBe(201);
      expect(res1.body.success).toBe(true);
      const firstId = res1.body.data.id;

      // Rapid duplicate submission (e.g. offline sync retry or double click)
      const res2 = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send(txPayload);

      expect(res2.status).toBe(201);
      expect(res2.body.success).toBe(true);
      // Deduplication returns the existing transaction rather than inserting a duplicate
      expect(res2.body.data.id).toBe(firstId);

      // Verify transactions list has exactly 1 entry
      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', alice);

      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].amount).toBe(250);
    });

    it('preserves legitimate multiple purchases with same amount or same category', async () => {
      // Morning tea
      const tx1 = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'expense',
          amount: 50,
          description: 'Morning chiya',
          category_name: 'Food & Drinks',
          date: '2026-10-11'
        });
      expect(tx1.status).toBe(201);

      // Evening tea (different description)
      const tx2 = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'expense',
          amount: 50,
          description: 'Evening chiya with biscuits',
          category_name: 'Food & Drinks',
          date: '2026-10-11'
        });
      expect(tx2.status).toBe(201);

      const listRes = await request(app)
        .get('/api/transactions')
        .set('Authorization', alice);

      expect(listRes.body.data.length).toBe(2);
      expect(listRes.body.data[0].id).not.toBe(listRes.body.data[1].id);
      const totalExpense = listRes.body.data.reduce((sum: number, t: any) => sum + t.amount, 0);
      expect(totalExpense).toBe(100);
    });
  });

  describe('2. Financial Integrity & Balance Protection', () => {
    it('maintains exact financial balance without altering starting balance', async () => {
      // 1. Set user starting balance to Rs. 15,000
      await request(app)
        .put('/api/settings')
        .set('Authorization', alice)
        .send({
          starting_balance: 15000,
          currency: 'NPR'
        });

      // 2. Add income of Rs. 50,000
      await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'income',
          amount: 50000,
          description: 'Monthly salary',
          category_name: 'Salary',
          date: '2026-10-01'
        });

      // 3. Add expenses of Rs. 12,000 (Rent) and Rs. 3,000 (Groceries)
      await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'expense',
          amount: 12000,
          description: 'Room rent',
          category_name: 'Home',
          date: '2026-10-02'
        });

      await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'expense',
          amount: 3000,
          description: 'Groceries at supermarket',
          category_name: 'Shopping',
          date: '2026-10-05'
        });

      // Fetch transactions & settings to compute balance
      const txRes = await request(app).get('/api/transactions').set('Authorization', alice);
      const settingsRes = await request(app).get('/api/settings').set('Authorization', alice);

      expect(settingsRes.status).toBe(200);
      expect(txRes.status).toBe(200);

      const startingBalance = settingsRes.body.data.starting_balance;
      const transactions = txRes.body.data;

      const totalIncome = transactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const availableBalance = startingBalance + totalIncome - totalExpenses;

      expect(startingBalance).toBe(15000);
      expect(totalIncome).toBe(50000);
      expect(totalExpenses).toBe(15000);
      // Net balance: 15,000 + 50,000 - 15,000 = 50,000
      expect(availableBalance).toBe(50000);
    });

    it('rejects negative starting balance', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', alice)
        .send({
          starting_balance: -500
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Orphan Handling & Referential Safety', () => {
    it('preserves transactions and falls back gracefully when category is missing or deleted', async () => {
      // Create transaction with non-existent or deleted category
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'expense',
          amount: 700,
          description: 'Online book purchase',
          category_id: 'non-existent-cat-uuid',
          category_name: 'Education',
          date: '2026-10-10'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.category_name).toBe('Education');
      // Transaction survives and retains its description and amount
      expect(res.body.data.amount).toBe(700);
    });

    it('cascades friend deletion to friend money entries without leaving orphans', async () => {
      // 1. Create friend
      const friendRes = await request(app)
        .post('/api/friends')
        .set('Authorization', alice)
        .send({ name: 'Ramesh Sharma' });

      expect(friendRes.status).toBe(201);
      const friendId = friendRes.body.data.id;

      // 2. Add money entries
      await request(app)
        .post(`/api/friends/${friendId}/entries`)
        .set('Authorization', alice)
        .send({
          type: 'given',
          amount: 2000,
          date: '2026-10-08',
          note: 'Loan for festival'
        });

      // 3. Delete friend
      const delRes = await request(app)
        .delete(`/api/friends/${friendId}`)
        .set('Authorization', alice);

      expect(delRes.status).toBe(200);

      // 4. Verify friend entries are removed (no orphans)
      const entriesRes = await request(app)
        .get(`/api/friends/${friendId}/entries`)
        .set('Authorization', alice);

      expect(entriesRes.body.data.length).toBe(0);
    });

    it('retains shopping item when linked transaction is deleted', async () => {
      // 1. Create shopping list & item
      const listRes = await request(app)
        .post('/api/shopping/lists')
        .set('Authorization', alice)
        .send({ title: 'Hardware items' });
      const listId = listRes.body.data.id;

      const itemRes = await request(app)
        .post(`/api/shopping/lists/${listId}/items`)
        .set('Authorization', alice)
        .send({
          name: 'LED Bulb 15W',
          quantity: 2,
          actual_unit_price: 250,
          status: 'purchased'
        });
      const itemId = itemRes.body.data.id;

      // 2. Create linked transaction
      const txRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'expense',
          amount: 500,
          description: 'LED Bulb 15W (2 pcs)',
          category_name: 'Home'
        });
      const txId = txRes.body.data.id;

      // Link item to transaction
      await request(app)
        .put(`/api/shopping/items/${itemId}`)
        .set('Authorization', alice)
        .send({ transaction_id: txId });

      // 3. Delete the transaction
      await request(app)
        .delete(`/api/transactions/${txId}`)
        .set('Authorization', alice);

      // 4. Item still exists in the shopping list
      const getItems = await request(app)
        .get(`/api/shopping/lists/${listId}/items`)
        .set('Authorization', alice);

      expect(getItems.body.data.length).toBe(1);
      expect(getItems.body.data[0].name).toBe('LED Bulb 15W');
      expect(getItems.body.data[0].actual_unit_price).toBe(250);
    });
  });

  describe('4. User Isolation & Security', () => {
    it('completely isolates records between Alice and Bob', async () => {
      // Alice creates a transaction and a shopping list
      const aliceTx = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'expense',
          amount: 1200,
          description: 'Alice Private Expense',
          category_name: 'Other'
        });

      const aliceList = await request(app)
        .post('/api/shopping/lists')
        .set('Authorization', alice)
        .send({ title: 'Alice Secret Shopping List' });

      const aliceTxId = aliceTx.body.data.id;
      const aliceListId = aliceList.body.data.id;

      // Bob tries to fetch transactions -> must NOT see Alice's transaction
      const bobTxs = await request(app)
        .get('/api/transactions')
        .set('Authorization', bob);
      expect(bobTxs.body.data.length).toBe(0);

      // Bob tries to fetch Alice's transaction by ID -> 404
      const bobGetAliceTx = await request(app)
        .get(`/api/transactions/${aliceTxId}`)
        .set('Authorization', bob);
      expect(bobGetAliceTx.status).toBe(404);

      // Bob tries to modify Alice's transaction -> 404
      const bobUpdateAliceTx = await request(app)
        .put(`/api/transactions/${aliceTxId}`)
        .set('Authorization', bob)
        .send({ amount: 99999 });
      expect(bobUpdateAliceTx.status).toBe(404);

      // Bob tries to fetch Alice's shopping list -> 404
      const bobGetAliceList = await request(app)
        .get(`/api/shopping/lists/${aliceListId}`)
        .set('Authorization', bob);
      expect(bobGetAliceList.status).toBe(404);

      // Bob's shopping lists must be empty
      const bobLists = await request(app)
        .get('/api/shopping/lists')
        .set('Authorization', bob);
      expect(bobLists.body.data.length).toBe(0);
    });
  });

  describe('5. Input Validation & Robustness', () => {
    it('rejects empty or whitespace-only transaction descriptions', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          type: 'expense',
          amount: 100,
          description: '   ',
          category_name: 'Other'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects empty shopping list titles', async () => {
      const res = await request(app)
        .post('/api/shopping/lists')
        .set('Authorization', alice)
        .send({
          title: '   '
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('accepts non-UUID client temporary IDs gracefully without crashing', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', alice)
        .send({
          id: 'tx-client-offline-temp-12345',
          type: 'expense',
          amount: 350,
          description: 'Grocery with temp id',
          category_name: 'Food & Drinks'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeTruthy();
      expect(res.body.data.amount).toBe(350);
    });
  });
});
