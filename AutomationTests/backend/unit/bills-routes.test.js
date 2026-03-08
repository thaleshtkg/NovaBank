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

describe('Bills Routes', () => {
  describe('GET /api/bills', () => {
    test('returns user bills', async () => {
      const res = await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.bills)).toBe(true);
      expect(res.body.bills.length).toBeGreaterThanOrEqual(2);
    });

    test('bills have required fields', async () => {
      const res = await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${token}`);
      const bill = res.body.bills[0];
      expect(bill.biller_name).toBeDefined();
      expect(bill.category).toBeDefined();
      expect(bill.amount).toBeDefined();
      expect(bill.status).toBeDefined();
      expect(bill.due_date).toBeDefined();
    });

    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/bills');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/bills/:id/pay', () => {
    test('pays a pending bill', async () => {
      const billsRes = await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${token}`);
      const pendingBill = billsRes.body.bills.find(b => b.status === 'pending');

      const res = await request(app)
        .post(`/api/bills/${pendingBill.id}/pay`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Bill paid successfully');
      expect(res.body.referenceNumber).toBeDefined();
      expect(typeof res.body.newBalance).toBe('number');
    });

    test('rejects paying an already paid bill', async () => {
      const billsRes = await request(app)
        .get('/api/bills')
        .set('Authorization', `Bearer ${token}`);
      const paidBill = billsRes.body.bills.find(b => b.status === 'paid');
      expect(paidBill, 'Expected a paid bill to exist after the previous test paid one — check test ordering').toBeDefined();

      const res = await request(app)
        .post(`/api/bills/${paidBill.id}/pay`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bill already paid');
    });

    test('returns 404 for non-existent bill', async () => {
      const res = await request(app)
        .post('/api/bills/99999/pay')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
