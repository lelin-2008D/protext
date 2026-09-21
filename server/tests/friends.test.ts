import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { StoreService } from '../src/services/store.js';

describe('Friend Money Calculator API Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    StoreService.clearMemory();
  });

  it('rejects unauthenticated requests to /api/friends', async () => {
    const res = await request(app).get('/api/friends');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows authenticated CRUD for friends', async () => {
    const userToken = 'Bearer mock-user-alice';

    // 1. Create friend
    const createRes = await request(app)
      .post('/api/friends')
      .set('Authorization', userToken)
      .send({
        name: 'Ram',
        note: 'College roommate'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name).toBe('Ram');
    const friendId = createRes.body.data.id;

    // 2. Fetch friends list
    const listRes = await request(app)
      .get('/api/friends')
      .set('Authorization', userToken);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].id).toBe(friendId);

    // 3. Update friend
    const updateRes = await request(app)
      .put(`/api/friends/${friendId}`)
      .set('Authorization', userToken)
      .send({
        name: 'Ram Sharma',
        note: 'Updated Note'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Ram Sharma');

    // 4. Delete friend
    const delRes = await request(app)
      .delete(`/api/friends/${friendId}`)
      .set('Authorization', userToken);

    expect(delRes.status).toBe(200);

    const checkList = await request(app)
      .get('/api/friends')
      .set('Authorization', userToken);
    expect(checkList.body.data.length).toBe(0);
  });

  it('allows authenticated CRUD for friend money entries', async () => {
    const userToken = 'Bearer mock-user-bob';

    // Create a friend
    const friendRes = await request(app)
      .post('/api/friends')
      .set('Authorization', userToken)
      .send({ name: 'Shyam' });
    const friendId = friendRes.body.data.id;

    // 1. Add "given" entry
    const entry1Res = await request(app)
      .post(`/api/friends/${friendId}/entries`)
      .set('Authorization', userToken)
      .send({
        type: 'given',
        amount: 3500,
        date: '2026-09-10',
        note: 'Dinner + ride'
      });

    expect(entry1Res.status).toBe(201);
    expect(entry1Res.body.data.amount).toBe(3500);
    expect(entry1Res.body.data.type).toBe('given');
    const entry1Id = entry1Res.body.data.id;

    // 2. Add "returned" entry
    const entry2Res = await request(app)
      .post(`/api/friends/${friendId}/entries`)
      .set('Authorization', userToken)
      .send({
        type: 'returned',
        amount: 1000,
        date: '2026-09-15',
        note: 'Esewa transfer'
      });

    expect(entry2Res.status).toBe(201);
    expect(entry2Res.body.data.amount).toBe(1000);

    // 3. Fetch friend entries
    const listRes = await request(app)
      .get(`/api/friends/${friendId}/entries`)
      .set('Authorization', userToken);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(2);

    // 4. Update entry
    const updateRes = await request(app)
      .put(`/api/friends/entries/${entry1Id}`)
      .set('Authorization', userToken)
      .send({ amount: 4000 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.amount).toBe(4000);

    // 5. Delete entry
    const delRes = await request(app)
      .delete(`/api/friends/entries/${entry1Id}`)
      .set('Authorization', userToken);

    expect(delRes.status).toBe(200);
  });

  it('enforces user data isolation between different users', async () => {
    const user1Token = 'Bearer mock-user-user1';
    const user2Token = 'Bearer mock-user-user2';

    // User 1 creates friend
    await request(app)
      .post('/api/friends')
      .set('Authorization', user1Token)
      .send({ name: 'User1 Secret Friend' });

    // User 2 cannot see User 1's friend
    const user2List = await request(app)
      .get('/api/friends')
      .set('Authorization', user2Token);

    expect(user2List.body.data.length).toBe(0);
  });
});
