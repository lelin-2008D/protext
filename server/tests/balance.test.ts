import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { StoreService } from '../src/services/store.js';

describe('Financial Balance Calculations', () => {
  const app = createApp();
  const token = 'Bearer mock-user-balance-test';

  beforeEach(() => {
    StoreService.clearMemory();
  });

  it('calculates available balance correctly as Starting Balance + Income - Expenses', async () => {
    // 1. Set Starting Balance = 10,000
    await request(app)
      .put('/api/settings')
      .set('Authorization', token)
      .send({ starting_balance: 10000 });

    // 2. Add Income = 5,000 (Freelance)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', token)
      .send({
        type: 'income',
        amount: 5000,
        description: 'Freelance project',
        category_name: 'Freelance'
      });

    // 3. Add Expense = 1,500 (Groceries)
    await request(app)
      .post('/api/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amount: 1500,
        description: 'Groceries',
        category_name: 'Food & Drinks'
      });

    // Fetch transactions & settings to compute balance
    const txRes = await request(app).get('/api/transactions').set('Authorization', token);
    const settingsRes = await request(app).get('/api/settings').set('Authorization', token);

    const startingBalance = settingsRes.body.data.starting_balance;
    const transactions = txRes.body.data;

    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const availableBalance = startingBalance + totalIncome - totalExpenses;

    expect(startingBalance).toBe(10000);
    expect(totalIncome).toBe(5000);
    expect(totalExpenses).toBe(1500);
    expect(availableBalance).toBe(13500); // 10000 + 5000 - 1500 = 13500
  });

  it('correctly updates available balance after editing and deleting transactions', async () => {
    // Set Starting Balance = 5000
    await request(app)
      .put('/api/settings')
      .set('Authorization', token)
      .send({ starting_balance: 5000 });

    // Add Expense 1 = 1000
    const tx1 = await request(app)
      .post('/api/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amount: 1000,
        description: 'Shoes',
        category_name: 'Shopping'
      });

    // Add Expense 2 = 500
    const tx2 = await request(app)
      .post('/api/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amount: 500,
        description: 'Bus fare',
        category_name: 'Transport'
      });

    // Edit Expense 1 from 1000 to 800
    await request(app)
      .put(`/api/transactions/${tx1.body.data.id}`)
      .set('Authorization', token)
      .send({ amount: 800 });

    // Delete Expense 2 (500)
    await request(app)
      .delete(`/api/transactions/${tx2.body.data.id}`)
      .set('Authorization', token);

    // Verify recalculated balance: 5000 - 800 = 4200
    const txRes = await request(app).get('/api/transactions').set('Authorization', token);
    const settingsRes = await request(app).get('/api/settings').set('Authorization', token);

    const startingBalance = settingsRes.body.data.starting_balance;
    const transactions = txRes.body.data;

    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const availableBalance = startingBalance + totalIncome - totalExpenses;

    expect(totalExpenses).toBe(800);
    expect(availableBalance).toBe(4200);
  });
});
