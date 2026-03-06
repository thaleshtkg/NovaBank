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

describe('Fixed Deposits Routes', () => {
  describe('GET /api/fixed-deposits', () => {
    test('returns fixed deposits and interest rates', async () => {
      const res = await request(app)
        .get('/api/fixed-deposits')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.fixedDeposits)).toBe(true);
      expect(res.body.interestRates).toBeDefined();
      expect(res.body.interestRates['3']).toBe(4.5);
      expect(res.body.interestRates['12']).toBe(6.5);
    });

    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/fixed-deposits');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/fixed-deposits', () => {
    test('creates a fixed deposit', async () => {
      const res = await request(app)
        .post('/api/fixed-deposits')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 5000, tenure_months: 12 });
      expect(res.status).toBe(201);
      expect(res.body.fixedDeposit).toBeDefined();
      expect(res.body.fixedDeposit.amount).toBe(5000);
      expect(res.body.fixedDeposit.interest_rate).toBe(6.5);
      expect(res.body.fixedDeposit.status).toBe('active');
      expect(typeof res.body.newBalance).toBe('number');
    });

    test('rejects amount below $1,000', async () => {
      const res = await request(app)
        .post('/api/fixed-deposits')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 500, tenure_months: 12 });
      expect(res.status).toBe(400);
    });

    test('rejects invalid tenure', async () => {
      const res = await request(app)
        .post('/api/fixed-deposits')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 5000, tenure_months: 7 });
      expect(res.status).toBe(400);
    });

    test('rejects negative amount', async () => {
      const res = await request(app)
        .post('/api/fixed-deposits')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -1000, tenure_months: 12 });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/fixed-deposits/:id/break', () => {
    test('breaks an active FD', async () => {
      const createRes = await request(app)
        .post('/api/fixed-deposits')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 2000, tenure_months: 6 });
      const fdId = createRes.body.fixedDeposit.id;

      const res = await request(app)
        .post(`/api/fixed-deposits/${fdId}/break`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('broken successfully');
      expect(typeof res.body.totalReturn).toBe('number');
      expect(typeof res.body.interest).toBe('number');
    });

    test('cannot break same FD twice', async () => {
      const createRes = await request(app)
        .post('/api/fixed-deposits')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000, tenure_months: 3 });
      const fdId = createRes.body.fixedDeposit.id;

      await request(app)
        .post(`/api/fixed-deposits/${fdId}/break`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post(`/api/fixed-deposits/${fdId}/break`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    test('returns 404 for non-existent FD', async () => {
      const res = await request(app)
        .post('/api/fixed-deposits/99999/break')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
