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

describe('API Smoke Tests', () => {
  test('Health endpoint responds', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('Login works with test credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@novabank.com', password: 'Test@1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('Profile endpoint responds with auth', async () => {
    const res = await request(app)
      .get('/api/account/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeTruthy();
  });

  test('Balance endpoint responds with auth', async () => {
    const res = await request(app)
      .get('/api/account/balance')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.balance).toBe('number');
  });

  test('Payees endpoint responds', async () => {
    const res = await request(app)
      .get('/api/payees')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.payees)).toBe(true);
  });

  test('Transactions endpoint responds', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  test('Recent transactions endpoint responds', async () => {
    const res = await request(app)
      .get('/api/transactions/recent')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  test('Transaction summary endpoint responds', async () => {
    const res = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.totalCredit).toBe('number');
  });

  test('Bills endpoint responds', async () => {
    const res = await request(app)
      .get('/api/bills')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bills)).toBe(true);
  });

  test('Fixed deposits endpoint responds', async () => {
    const res = await request(app)
      .get('/api/fixed-deposits')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.interestRates).toBeTruthy();
  });

  test('Notifications endpoint responds', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  test('Unauthenticated requests return 401', async () => {
    const endpoints = [
      '/api/account/profile',
      '/api/account/balance',
      '/api/payees',
      '/api/transactions',
      '/api/bills',
      '/api/fixed-deposits',
      '/api/notifications',
    ];
    for (const endpoint of endpoints) {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
    }
  });

  test('Transfer with valid data completes end-to-end', async () => {
    const payeesRes = await request(app)
      .get('/api/payees')
      .set('Authorization', `Bearer ${token}`);
    const payee = payeesRes.body.payees[0];

    const balBefore = await request(app)
      .get('/api/account/balance')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        payee_id: payee.id,
        amount: 10,
        otp: '123456',
        description: 'Smoke test transfer',
      });
    expect(res.status).toBe(200);

    const balAfter = await request(app)
      .get('/api/account/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balAfter.body.balance).toBeLessThan(balBefore.body.balance);
  });

  test('Registration creates new account end-to-end', async () => {
    const ts = Date.now();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Smoke Test',
        email: `smoke${ts}@test.com`,
        phone: '555-0000',
        password: 'SmokeTest123',
      });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();

    const profileRes = await request(app)
      .get('/api/account/profile')
      .set('Authorization', `Bearer ${res.body.token}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.user.name).toBe('Smoke Test');
    expect(profileRes.body.user.balance).toBe(1000000);
  });
});
