const request = require('supertest');
const { createTestDb, seedTestDb, createTestApp, getAuthToken } = require('../setup');

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

describe('Transactions Routes', () => {
  describe('GET /api/transactions', () => {
    test('returns paginated transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    test('supports pagination parameters', async () => {
      const res = await request(app)
        .get('/api/transactions?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.transactions.length).toBeLessThanOrEqual(1);
      expect(res.body.pagination.limit).toBe(1);
    });

    test('filters by type=credit', async () => {
      const res = await request(app)
        .get('/api/transactions?type=credit')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      res.body.transactions.forEach(t => {
        expect(t.type).toBe('credit');
      });
    });

    test('filters by type=debit', async () => {
      const res = await request(app)
        .get('/api/transactions?type=debit')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      res.body.transactions.forEach(t => {
        expect(t.type).toBe('debit');
      });
    });

    test('filters by category', async () => {
      const res = await request(app)
        .get('/api/transactions?category=opening')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      res.body.transactions.forEach(t => {
        expect(t.category).toBe('opening');
      });
    });

    test('supports search', async () => {
      const res = await request(app)
        .get('/api/transactions?search=deposit')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.transactions.length).toBeGreaterThanOrEqual(1);
    });

    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/transactions/recent', () => {
    test('returns recent transactions (max 5)', async () => {
      const res = await request(app)
        .get('/api/transactions/recent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/transactions/summary', () => {
    test('returns spending summary', async () => {
      const res = await request(app)
        .get('/api/transactions/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(typeof res.body.totalCredit).toBe('number');
      expect(typeof res.body.totalDebit).toBe('number');
      expect(Array.isArray(res.body.categories)).toBe(true);
    });
  });

  describe('GET /api/transactions/export', () => {
    test('exports transactions as CSV', async () => {
      const res = await request(app)
        .get('/api/transactions/export')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Date,Type,Amount');
    });
  });
});
