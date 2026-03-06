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

describe('Transfers Routes', () => {
  describe('POST /api/transfers', () => {
    let payeeId;

    beforeAll(async () => {
      const res = await request(app)
        .get('/api/payees')
        .set('Authorization', `Bearer ${token}`);
      payeeId = res.body.payees[0].id;
    });

    test('transfers money with valid OTP', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          payee_id: payeeId,
          amount: 100,
          description: 'Test transfer',
          otp: '123456',
        });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Transfer successful');
      expect(res.body.referenceNumber).toBeDefined();
      expect(res.body.amount).toBe(100);
      expect(typeof res.body.newBalance).toBe('number');
    });

    test('rejects invalid OTP', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          payee_id: payeeId,
          amount: 50,
          otp: '000000',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid OTP');
    });

    test('rejects transfer to non-existent payee', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          payee_id: 99999,
          amount: 50,
          otp: '123456',
        });
      expect(res.status).toBe(404);
    });

    test('rejects amount exceeding $1,000 limit', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          payee_id: payeeId,
          amount: 1500,
          otp: '123456',
        });
      expect(res.status).toBe(400);
    });

    test('rejects negative amount', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          payee_id: payeeId,
          amount: -100,
          otp: '123456',
        });
      expect(res.status).toBe(400);
    });

    test('rejects zero amount', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          payee_id: payeeId,
          amount: 0,
          otp: '123456',
        });
      expect([400, 429]).toContain(res.status);
    });

    test('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .send({
          payee_id: payeeId,
          amount: 50,
          otp: '123456',
        });
      expect(res.status).toBe(401);
    });

    test('rejects OTP with wrong length', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          payee_id: payeeId,
          amount: 50,
          otp: '12345',
        });
      expect([400, 429]).toContain(res.status);
    });
  });
});
