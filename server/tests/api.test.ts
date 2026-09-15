import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { StoreService } from '../src/services/store.js';

describe('HISAB Backend API Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    StoreService.clearMemory();
  });

  it('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('POST /api/parse returns parsed transaction data', async () => {
    const res = await request(app)
      .post('/api/parse')
      .send({ text: 'Momo Rs 250' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(250);
    expect(res.body.data.category).toBe('Food & Drinks');
    expect(res.body.data.type).toBe('expense');
  });

  it('POST /api/parse rejects empty text with 400', async () => {
    const res = await request(app)
      .post('/api/parse')
      .send({ text: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects protected routes without Authorization header with 401', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows full Transaction CRUD lifecycle for authenticated user', async () => {
    const userToken = 'Bearer mock-user-alice';

    // 1. Create expense
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', userToken)
      .send({
        type: 'expense',
        amount: 300,
        description: 'Chiya and snacks',
        category_name: 'Food & Drinks',
        date: '2025-01-15'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const txId = createRes.body.data.id;
    expect(txId).toBeDefined();
    expect(createRes.body.data.amount).toBe(300);

    // 2. Fetch transactions list
    const listRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', userToken);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].id).toBe(txId);

    // 3. Fetch single transaction by ID
    const getSingleRes = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', userToken);

    expect(getSingleRes.status).toBe(200);
    expect(getSingleRes.body.data.description).toBe('Chiya and snacks');

    // 4. Update transaction
    const updateRes = await request(app)
      .put(`/api/transactions/${txId}`)
      .set('Authorization', userToken)
      .send({
        amount: 350,
        description: 'Chiya, snacks and biscuits'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.amount).toBe(350);
    expect(updateRes.body.data.description).toBe('Chiya, snacks and biscuits');

    // 5. Delete transaction
    const deleteRes = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', userToken);

    expect(deleteRes.status).toBe(200);

    // 6. Verify empty list after deletion
    const afterDeleteList = await request(app)
      .get('/api/transactions')
      .set('Authorization', userToken);

    expect(afterDeleteList.body.data.length).toBe(0);
  });

  it('enforces user data ownership isolation (User B cannot access User A data)', async () => {
    const userA = 'Bearer mock-user-alice';
    const userB = 'Bearer mock-user-bob';

    // Alice creates transaction
    const aliceCreate = await request(app)
      .post('/api/transactions')
      .set('Authorization', userA)
      .send({
        type: 'income',
        amount: 50000,
        description: 'Alice Salary',
        category_name: 'Salary'
      });

    const txId = aliceCreate.body.data.id;

    // Bob tries to read all transactions
    const bobList = await request(app)
      .get('/api/transactions')
      .set('Authorization', userB);

    expect(bobList.status).toBe(200);
    expect(bobList.body.data.length).toBe(0); // Bob sees none of Alice's records

    // Bob tries to fetch Alice's transaction by ID
    const bobFetch = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', userB);

    expect(bobFetch.status).toBe(404);

    // Bob tries to update Alice's transaction
    const bobUpdate = await request(app)
      .put(`/api/transactions/${txId}`)
      .set('Authorization', userB)
      .send({ amount: 10 });

    expect(bobUpdate.status).toBe(404);

    // Bob tries to delete Alice's transaction
    const bobDelete = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', userB);

    expect(bobDelete.status).toBe(404);
  });

  it('handles user settings GET and PUT correctly', async () => {
    const userToken = 'Bearer mock-user-alice';

    // Default settings
    const getRes = await request(app)
      .get('/api/settings')
      .set('Authorization', userToken);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.starting_balance).toBe(0);
    expect(getRes.body.data.currency).toBe('NPR');

    // Update starting balance
    const updateRes = await request(app)
      .put('/api/settings')
      .set('Authorization', userToken)
      .send({
        starting_balance: 10000,
        theme: 'dark'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.starting_balance).toBe(10000);
    expect(updateRes.body.data.theme).toBe('dark');
  });

  it('returns categories list', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(5);
  });

  it('supports custom category creation and authenticated retrieval', async () => {
    const userToken = 'Bearer mock-user-alice';

    // Alice creates custom category
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', userToken)
      .send({
        name: 'Investment',
        type: 'expense',
        keywords: ['shares', 'stocks', 'crypto', 'nepse'],
        icon: 'TrendingUp',
        color: '#10B981'
      });

    expect(catRes.status).toBe(201);
    expect(catRes.body.data.name).toBe('Investment');

    // Alice fetches categories (should include Investment)
    const aliceCats = await request(app)
      .get('/api/categories')
      .set('Authorization', userToken);

    expect(aliceCats.status).toBe(200);
    const hasInvestment = aliceCats.body.data.some((c: any) => c.name === 'Investment');
    expect(hasInvestment).toBe(true);

    // Unauthenticated user fetches categories (should NOT include Alice's custom category)
    const publicCats = await request(app).get('/api/categories');
    expect(publicCats.status).toBe(200);
    const publicHasInvestment = publicCats.body.data.some((c: any) => c.name === 'Investment');
    expect(publicHasInvestment).toBe(false);
  });

  it('supports delta sync with since query parameter', async () => {
    const userToken = 'Bearer mock-user-delta';

    // 1. Create initial transaction
    await request(app)
      .post('/api/transactions')
      .set('Authorization', userToken)
      .send({
        type: 'expense',
        amount: 100,
        description: 'First Coffee'
      });

    const checkpoint = new Date().toISOString();

    // Small delay to ensure timestamp difference
    await new Promise(r => setTimeout(r, 20));

    // 2. Create second transaction after checkpoint
    await request(app)
      .post('/api/transactions')
      .set('Authorization', userToken)
      .send({
        type: 'expense',
        amount: 200,
        description: 'Second Coffee'
      });

    // 3. Query delta with since=checkpoint
    const deltaRes = await request(app)
      .get(`/api/transactions?since=${encodeURIComponent(checkpoint)}`)
      .set('Authorization', userToken);

    expect(deltaRes.status).toBe(200);
    expect(deltaRes.body.data.length).toBe(1);
    expect(deltaRes.body.data[0].description).toBe('Second Coffee');
  });
});
