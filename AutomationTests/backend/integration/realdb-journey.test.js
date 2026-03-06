/**
 * RealDB Integration Tests — all journeys share one in-memory DB + Express app.
 * Using a single beforeAll avoids multiple createTestApp() calls within one
 * Jest file which would cause Jest's module registry to return cached routes
 * from the first call on subsequent requires.
 */

const request = require('supertest');
const { createTestDb, seedTestDb, createTestApp, getAuthToken } = require('../../helpers/backend-setup');

const RUN_ID = Date.now();

describe('RealDB Integration — All journeys', () => {
  let db, app, token;

  beforeAll(async () => {
    db = createTestDb();
    seedTestDb(db);
    app = createTestApp(db);
    token = await getAuthToken(app);
  });

  // ── Registration ──────────────────────────────────────────────────────────

  it('registers a new user and returns a JWT + $1M balance', async () => {
    const email = `alice-${RUN_ID}@test.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice New', email, phone: '555-9999', password: 'Alice@1234' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(email);

    const balRes = await request(app)
      .get('/api/account/balance')
      .set('Authorization', `Bearer ${res.body.token}`);
    expect(balRes.body.balance).toBe(1000000);
  });

  it('new account welcome credit transaction exists', async () => {
    const txnRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(txnRes.status).toBe(200);
    const creditTxn = txnRes.body.transactions.find(t => t.type === 'credit');
    expect(creditTxn).toBeDefined();
  });

  // ── Transfer ──────────────────────────────────────────────────────────────

  it('transfer to existing payee reduces balance correctly', async () => {
    const balBefore = (await request(app).get('/api/account/balance').set('Authorization', `Bearer ${token}`)).body.balance;
    const payeesRes = await request(app).get('/api/payees').set('Authorization', `Bearer ${token}`);
    const payeeId = payeesRes.body.payees[0].id;

    const txnRes = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ payee_id: payeeId, amount: 250, otp: '123456', description: 'RealDB payment A' });

    expect(txnRes.status).toBe(200);
    expect(txnRes.body.newBalance).toBe(balBefore - 250);
  });

  it('transfer appears in transaction history', async () => {
    const txnRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    const txn = txnRes.body.transactions.find(t => t.description === 'RealDB payment A');
    expect(txn).toBeDefined();
    expect(txn.type).toBe('debit');
    expect(txn.amount).toBe(250);
  });

  // ── Bills ─────────────────────────────────────────────────────────────────

  it('paying a pending bill reduces balance and marks it paid', async () => {
    const billsRes = await request(app).get('/api/bills').set('Authorization', `Bearer ${token}`);
    const pending = billsRes.body.bills.find(b => b.status === 'pending');
    expect(pending).toBeDefined();

    const balBefore = (await request(app).get('/api/account/balance').set('Authorization', `Bearer ${token}`)).body.balance;

    const payRes = await request(app)
      .post(`/api/bills/${pending.id}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(payRes.status).toBe(200);
    expect(payRes.body.newBalance).toBeCloseTo(balBefore - pending.amount, 2);

    const updatedBills = await request(app).get('/api/bills').set('Authorization', `Bearer ${token}`);
    const updated = updatedBills.body.bills.find(b => b.id === pending.id);
    expect(updated.status).toBe('paid');
  });

  it('double-paying a bill returns 400', async () => {
    const billsRes = await request(app).get('/api/bills').set('Authorization', `Bearer ${token}`);
    const paid = billsRes.body.bills.find(b => b.status === 'paid');
    expect(paid).toBeDefined();

    const res = await request(app)
      .post(`/api/bills/${paid.id}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  // ── Fixed Deposits ────────────────────────────────────────────────────────

  it('creates a fixed deposit and deducts balance', async () => {
    const balBefore = (await request(app).get('/api/account/balance').set('Authorization', `Bearer ${token}`)).body.balance;

    const res = await request(app)
      .post('/api/fixed-deposits')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000, tenure_months: 12 });

    expect(res.status).toBe(201);
    expect(res.body.fixedDeposit.amount).toBe(5000);
    expect(res.body.newBalance).toBe(balBefore - 5000);
  });

  it('newly created FD appears in the list as active', async () => {
    const res = await request(app).get('/api/fixed-deposits').set('Authorization', `Bearer ${token}`);
    const active = res.body.fixedDeposits.filter(f => f.status === 'active');
    expect(active.length).toBeGreaterThan(0);
  });

  it('breaking an FD returns funds with interest', async () => {
    const fdsRes = await request(app).get('/api/fixed-deposits').set('Authorization', `Bearer ${token}`);
    const fd = fdsRes.body.fixedDeposits.find(f => f.status === 'active');
    expect(fd).toBeDefined();

    const balBefore = (await request(app).get('/api/account/balance').set('Authorization', `Bearer ${token}`)).body.balance;

    const res = await request(app)
      .post(`/api/fixed-deposits/${fd.id}/break`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalReturn).toBeGreaterThan(0);
    expect(res.body.newBalance).toBeGreaterThan(balBefore);
  });

  // ── Profile ───────────────────────────────────────────────────────────────

  it('updates name and phone in profile and persists the change', async () => {
    const res = await request(app)
      .put('/api/account/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John RealDB', phone: '555-7777' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('John RealDB');

    const profileRes = await request(app)
      .get('/api/account/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profileRes.body.user.name).toBe('John RealDB');
  });
});
