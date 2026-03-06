/**
 * E2E API Sequence Tests — exercises every major API endpoint in a realistic
 * end-to-end user flow using a fresh in-memory DB for each run.
 *
 * Emails use Date.now() to ensure uniqueness even if the production DB leaks.
 */

const request = require('supertest');
const { createTestDb, seedTestDb, createTestApp } = require('../../helpers/backend-setup');

describe('E2E API sequence — Full user journey', () => {
  let db, app, token, payeeId, fdId, billId, billAmount;
  const RUN_ID = Date.now();
  const testEmail = `e2e-${RUN_ID}@test.com`;
  const testPassword = 'E2E@1234';

  beforeAll(() => {
    db = createTestDb();
    seedTestDb(db);
    app = createTestApp(db);
  });

  it('01 — health check returns OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('02 — register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'E2E User', email: testEmail, phone: '555-4444', password: testPassword });

    expect(res.status).toBe(201);
    token = res.body.token;
    expect(token).toBeTruthy();
    expect(res.body.user.email).toBe(testEmail);
  });

  it('03 — login with the new account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('04 — get profile returns correct user data', async () => {
    const res = await request(app)
      .get('/api/account/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('05 — get balance shows $1,000,000 starting balance', async () => {
    const res = await request(app)
      .get('/api/account/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(1000000);
  });

  it('06 — add a payee', async () => {
    const res = await request(app)
      .post('/api/payees')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Payee', account_number: '9999999999', bank_name: 'Test Bank', routing_number: '021000099' });

    expect(res.status).toBe(201);
    payeeId = res.body.payee.id;
    expect(payeeId).toBeTruthy();
  });

  it('07 — list payees includes the new payee', async () => {
    const res = await request(app)
      .get('/api/payees')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = res.body.payees.find(p => p.id === payeeId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Test Payee');
  });

  it('08 — transfer $500 to payee', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ payee_id: payeeId, amount: 500, otp: '123456', description: 'E2E test payment' });

    expect(res.status).toBe(200);
    expect(res.body.newBalance).toBe(999500);
    expect(res.body.referenceNumber).toMatch(/^NB/);
  });

  it('09 — transaction history shows the transfer debit', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const debit = res.body.transactions.find(t => t.description === 'E2E test payment');
    expect(debit).toBeDefined();
    expect(debit.type).toBe('debit');
    expect(debit.amount).toBe(500);
  });

  it('10 — recent transactions returns max 5 entries', async () => {
    const res = await request(app)
      .get('/api/transactions/recent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBeLessThanOrEqual(5);
  });

  it('11 — transaction summary includes debit total', async () => {
    const res = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalDebit).toBeGreaterThanOrEqual(500);
    expect(res.body.totalCredit).toBeGreaterThanOrEqual(1000000);
  });

  it('12 — get bills returns seeded bills for new account', async () => {
    const res = await request(app)
      .get('/api/bills')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const pending = res.body.bills.filter(b => b.status === 'pending');
    expect(pending.length).toBeGreaterThan(0);
    billId = pending[0].id;
    billAmount = pending[0].amount;
  });

  it('13 — pay a bill reduces balance correctly', async () => {
    const balBefore = (await request(app).get('/api/account/balance').set('Authorization', `Bearer ${token}`)).body.balance;

    const res = await request(app)
      .post(`/api/bills/${billId}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.newBalance).toBeCloseTo(balBefore - billAmount, 2);
  });

  it('14 — create a fixed deposit', async () => {
    const res = await request(app)
      .post('/api/fixed-deposits')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10000, tenure_months: 12 });

    expect(res.status).toBe(201);
    fdId = res.body.fixedDeposit.id;
    expect(res.body.fixedDeposit.status).toBe('active');
    expect(res.body.fixedDeposit.interest_rate).toBe(6.5);
  });

  it('15 — fixed deposit list shows the new FD', async () => {
    const res = await request(app)
      .get('/api/fixed-deposits')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const fd = res.body.fixedDeposits.find(f => f.id === fdId);
    expect(fd).toBeDefined();
    expect(fd.status).toBe('active');
    expect(res.body.interestRates).toHaveProperty('12');
  });

  it('16 — break the fixed deposit returns funds', async () => {
    const balBefore = (await request(app).get('/api/account/balance').set('Authorization', `Bearer ${token}`)).body.balance;

    const res = await request(app)
      .post(`/api/fixed-deposits/${fdId}/break`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalReturn).toBeGreaterThan(0);
    expect(res.body.newBalance).toBeGreaterThan(balBefore);
  });

  it('17 — notifications list has entries', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('unreadCount');
  });

  it('18 — mark all notifications as read', async () => {
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const notifRes = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(notifRes.body.unreadCount).toBe(0);
  });

  it('19 — export transactions as CSV', async () => {
    const res = await request(app)
      .get('/api/transactions/export')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    const lines = res.text.split('\n');
    expect(lines[0]).toMatch(/Date,Type,Amount/i);
    expect(lines.length).toBeGreaterThan(1);
  });

  it('20 — update profile and verify persistence', async () => {
    await request(app)
      .put('/api/account/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Updated', phone: '555-8888' });

    const profileRes = await request(app)
      .get('/api/account/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.body.user.name).toBe('E2E Updated');
  });

  it('21 — delete the payee', async () => {
    const res = await request(app)
      .delete(`/api/payees/${payeeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const payeesRes = await request(app).get('/api/payees').set('Authorization', `Bearer ${token}`);
    const deleted = payeesRes.body.payees.find(p => p.id === payeeId);
    expect(deleted).toBeUndefined();
  });
});
