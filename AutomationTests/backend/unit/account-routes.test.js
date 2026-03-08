const request = require('supertest');
const { createTestDb, seedTestDb, createTestApp, getAuthToken } = require('../../helpers/backend-setup');

let db, app, token;

beforeAll(async () => {
  db = createTestDb();
  seedTestDb(db);
  app = createTestApp(db);
  token = await getAuthToken(app);
});

afterAll(() => {
  db.close();
  jest.restoreAllMocks();
});

describe('Account Routes', () => {
  describe('GET /api/account/profile', () => {
    test('returns user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/account/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('John Doe');
      expect(res.body.user.email).toBe('john@novabank.com');
      expect(res.body.user.account_number).toBe('2000000001');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    test('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/account/profile');
      expect(res.status).toBe(401);
    });

    test('returns 403 with invalid token', async () => {
      const res = await request(app)
        .get('/api/account/profile')
        .set('Authorization', 'Bearer invalid');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/account/balance', () => {
    test('returns balance and account number', async () => {
      const res = await request(app)
        .get('/api/account/balance')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.balance).toBe('number');
      expect(res.body.accountNumber).toBe('2000000001');
    });

    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/account/balance');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/account/profile', () => {
    afterEach(async () => {
      // Restore the seeded defaults after each mutation test so later tests
      // see a clean baseline regardless of whether the previous test passed.
      await request(app)
        .put('/api/account/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'John Doe', phone: '555-0101' });
    });

    test('updates name', async () => {
      const res = await request(app)
        .put('/api/account/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'John Updated' });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('John Updated');
    });

    test('updates phone', async () => {
      const res = await request(app)
        .put('/api/account/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '555-9999' });
      expect(res.status).toBe(200);
      expect(res.body.user.phone).toBe('555-9999');
    });

    test('rejects empty body', async () => {
      const res = await request(app)
        .put('/api/account/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
