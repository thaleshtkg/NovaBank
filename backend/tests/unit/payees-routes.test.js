const request = require('supertest');
const { createTestDb, seedTestDb, createTestApp, getAuthToken } = require('../setup');

let db, app, token, janeToken;

beforeAll(async () => {
  db = createTestDb();
  seedTestDb(db);
  app = createTestApp(db);
  token = await getAuthToken(app);
  const janeRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jane@novabank.com', password: 'Test@1234' });
  janeToken = janeRes.body.token;
});

afterAll(() => {
  db.close();
  jest.restoreAllMocks();
});

describe('Payees Routes', () => {
  describe('GET /api/payees', () => {
    test('returns payees for authenticated user', async () => {
      const res = await request(app)
        .get('/api/payees')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.payees)).toBe(true);
      expect(res.body.payees.length).toBeGreaterThanOrEqual(2);
    });

    test('returns only payees belonging to the user', async () => {
      const johnRes = await request(app)
        .get('/api/payees')
        .set('Authorization', `Bearer ${token}`);
      const janeRes = await request(app)
        .get('/api/payees')
        .set('Authorization', `Bearer ${janeToken}`);

      const johnPayeeNames = johnRes.body.payees.map(p => p.name);
      expect(johnPayeeNames).toContain('Jane Smith');
      expect(johnPayeeNames).not.toContain('Charlie Brown');

      const janePayeeNames = janeRes.body.payees.map(p => p.name);
      expect(janePayeeNames).toContain('John Doe');
    });

    test('supports search query', async () => {
      const res = await request(app)
        .get('/api/payees?search=Jane')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.payees.length).toBeGreaterThanOrEqual(1);
      expect(res.body.payees[0].name).toContain('Jane');
    });

    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/payees');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/payees', () => {
    test('adds a new payee', async () => {
      const res = await request(app)
        .post('/api/payees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Payee',
          account_number: '9999900001',
          bank_name: 'Test Bank',
          routing_number: '099000099',
          nickname: 'Testy',
        });
      expect(res.status).toBe(201);
      expect(res.body.payee.name).toBe('Test Payee');
    });

    test('rejects duplicate account number', async () => {
      const res = await request(app)
        .post('/api/payees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Duplicate',
          account_number: '2000000002',
          bank_name: 'NovaBank',
          routing_number: '021000021',
        });
      expect(res.status).toBe(409);
    });

    test('rejects invalid data - short name', async () => {
      const res = await request(app)
        .post('/api/payees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'A',
          account_number: '9999900002',
          bank_name: 'Test Bank',
          routing_number: '099000099',
        });
      expect(res.status).toBe(400);
    });

    test('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/payees')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Only Name' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/payees/:id', () => {
    test('deletes a payee belonging to user', async () => {
      const addRes = await request(app)
        .post('/api/payees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Deletable Payee',
          account_number: '8888800001',
          bank_name: 'Delete Bank',
          routing_number: '088000088',
        });

      const res = await request(app)
        .delete(`/api/payees/${addRes.body.payee.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Payee removed successfully');
    });

    test('returns 404 for non-existent payee', async () => {
      const res = await request(app)
        .delete('/api/payees/99999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    test('cannot delete another user payee', async () => {
      const janePayees = await request(app)
        .get('/api/payees')
        .set('Authorization', `Bearer ${janeToken}`);
      const janePayeeId = janePayees.body.payees[0].id;

      const res = await request(app)
        .delete(`/api/payees/${janePayeeId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
