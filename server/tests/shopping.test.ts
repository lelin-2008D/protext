import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { StoreService } from '../src/services/store.js';

describe('Shopping Planner API Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    StoreService.clearMemory();
  });

  it('rejects unauthenticated requests to /api/shopping/lists', async () => {
    const res = await request(app).get('/api/shopping/lists');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows authenticated CRUD for shopping lists', async () => {
    const userToken = 'Bearer mock-user-alice';

    // 1. Create shopping list
    const createRes = await request(app)
      .post('/api/shopping/lists')
      .set('Authorization', userToken)
      .send({
        title: 'Weekly Groceries',
        description: 'Bhatbhateni & Local Sabji Mandi'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toBe('Weekly Groceries');
    expect(createRes.body.data.status).toBe('active');
    const listId = createRes.body.data.id;

    // 2. Fetch lists
    const getRes = await request(app)
      .get('/api/shopping/lists')
      .set('Authorization', userToken);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].id).toBe(listId);

    // 3. Update list (rename & complete)
    const updateRes = await request(app)
      .put(`/api/shopping/lists/${listId}`)
      .set('Authorization', userToken)
      .send({
        title: 'Weekly Groceries - Done',
        status: 'completed'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Weekly Groceries - Done');
    expect(updateRes.body.data.status).toBe('completed');

    // 4. Delete list
    const delRes = await request(app)
      .delete(`/api/shopping/lists/${listId}`)
      .set('Authorization', userToken);

    expect(delRes.status).toBe(200);

    const checkList = await request(app)
      .get('/api/shopping/lists')
      .set('Authorization', userToken);
    expect(checkList.body.data.length).toBe(0);
  });

  it('allows authenticated CRUD for shopping items with Nepal units', async () => {
    const userToken = 'Bearer mock-user-bob';

    // Create a list first
    const listRes = await request(app)
      .post('/api/shopping/lists')
      .set('Authorization', userToken)
      .send({ title: 'Bazaar Run' });
    const listId = listRes.body.data.id;

    // 1. Add item without prices (rice)
    const item1Res = await request(app)
      .post(`/api/shopping/lists/${listId}/items`)
      .set('Authorization', userToken)
      .send({
        name: 'Basmati Rice',
        quantity: 5,
        unit: 'kg'
      });

    expect(item1Res.status).toBe(201);
    expect(item1Res.body.data.name).toBe('Basmati Rice');
    expect(item1Res.body.data.quantity).toBe(5);
    expect(item1Res.body.data.unit).toBe('kg');
    expect(item1Res.body.data.estimated_unit_price).toBeNull();
    expect(item1Res.body.data.actual_unit_price).toBeNull();
    expect(item1Res.body.data.status).toBe('pending');
    const item1Id = item1Res.body.data.id;

    // 2. Add item with estimated price (oil)
    const item2Res = await request(app)
      .post(`/api/shopping/lists/${listId}/items`)
      .set('Authorization', userToken)
      .send({
        name: 'Mustard Oil',
        quantity: 2,
        unit: 'litre',
        estimated_unit_price: 250,
        category_name: 'Food & Drinks'
      });

    expect(item2Res.status).toBe(201);
    expect(item2Res.body.data.quantity).toBe(2);
    expect(item2Res.body.data.unit).toBe('litre');
    expect(item2Res.body.data.estimated_unit_price).toBe(250);

    // 3. Fetch items for list
    const getItemsRes = await request(app)
      .get(`/api/shopping/lists/${listId}/items`)
      .set('Authorization', userToken);

    expect(getItemsRes.status).toBe(200);
    expect(getItemsRes.body.data.length).toBe(2);

    // 4. Update item when purchased (enter actual unit price 80 for rice)
    const updateItemRes = await request(app)
      .put(`/api/shopping/items/${item1Id}`)
      .set('Authorization', userToken)
      .send({
        actual_unit_price: 80,
        status: 'purchased',
        purchase_date: '2026-10-10'
      });

    expect(updateItemRes.status).toBe(200);
    expect(updateItemRes.body.data.actual_unit_price).toBe(80);
    expect(updateItemRes.body.data.status).toBe('purchased');

    // 5. Delete item
    const delItemRes = await request(app)
      .delete(`/api/shopping/items/${item1Id}`)
      .set('Authorization', userToken);

    expect(delItemRes.status).toBe(200);

    const checkItems = await request(app)
      .get(`/api/shopping/lists/${listId}/items`)
      .set('Authorization', userToken);
    expect(checkItems.body.data.length).toBe(1);
    expect(checkItems.body.data[0].name).toBe('Mustard Oil');
  });

  it('validates user inputs strictly on create and update', async () => {
    const userToken = 'Bearer mock-user-charlie';

    // Empty list title rejected
    const badList = await request(app)
      .post('/api/shopping/lists')
      .set('Authorization', userToken)
      .send({ title: '' });
    expect(badList.status).toBe(400);

    // Create valid list
    const listRes = await request(app)
      .post('/api/shopping/lists')
      .set('Authorization', userToken)
      .send({ title: 'Valid List' });
    const listId = listRes.body.data.id;

    // Negative quantity rejected
    const badQty = await request(app)
      .post(`/api/shopping/lists/${listId}/items`)
      .set('Authorization', userToken)
      .send({ name: 'Salt', quantity: -2 });
    expect(badQty.status).toBe(400);

    // Negative estimated price rejected
    const badPrice = await request(app)
      .post(`/api/shopping/lists/${listId}/items`)
      .set('Authorization', userToken)
      .send({ name: 'Salt', quantity: 1, estimated_unit_price: -50 });
    expect(badPrice.status).toBe(400);
  });

  it('enforces strict user isolation between different user accounts (Journey 7)', async () => {
    const user1Token = 'Bearer mock-user-user1';
    const user2Token = 'Bearer mock-user-user2';

    // User 1 creates a list and item
    const list1Res = await request(app)
      .post('/api/shopping/lists')
      .set('Authorization', user1Token)
      .send({ title: 'User 1 Secret Shopping' });
    const list1Id = list1Res.body.data.id;

    const item1Res = await request(app)
      .post(`/api/shopping/lists/${list1Id}/items`)
      .set('Authorization', user1Token)
      .send({ name: 'Secret Item', quantity: 1, estimated_unit_price: 100 });
    const item1Id = item1Res.body.data.id;

    // User 2 cannot see User 1's lists
    const user2Lists = await request(app)
      .get('/api/shopping/lists')
      .set('Authorization', user2Token);
    expect(user2Lists.body.data.length).toBe(0);

    // User 2 cannot get User 1's list by ID
    const user2GetList = await request(app)
      .get(`/api/shopping/lists/${list1Id}`)
      .set('Authorization', user2Token);
    expect(user2GetList.status).toBe(404);

    // User 2 cannot update User 1's list
    const user2UpdateList = await request(app)
      .put(`/api/shopping/lists/${list1Id}`)
      .set('Authorization', user2Token)
      .send({ title: 'Hacked Title' });
    expect(user2UpdateList.status).toBe(404);

    // User 2 cannot delete User 1's list
    const user2DeleteList = await request(app)
      .delete(`/api/shopping/lists/${list1Id}`)
      .set('Authorization', user2Token);
    expect(user2DeleteList.status).toBe(404);

    // User 2 cannot access or update User 1's items
    const user2GetItem = await request(app)
      .get(`/api/shopping/items/${item1Id}`)
      .set('Authorization', user2Token);
    expect(user2GetItem.status).toBe(404);

    const user2UpdateItem = await request(app)
      .put(`/api/shopping/items/${item1Id}`)
      .set('Authorization', user2Token)
      .send({ actual_unit_price: 999 });
    expect(user2UpdateItem.status).toBe(404);

    const user2DeleteItem = await request(app)
      .delete(`/api/shopping/items/${item1Id}`)
      .set('Authorization', user2Token);
    expect(user2DeleteItem.status).toBe(404);
  });
});
