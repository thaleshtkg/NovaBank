const request = require('supertest');
const { createTestDb, seedTestDb, createTestApp } = require('../../helpers/backend-setup');

let db, app;

beforeAll(() => {
  db = createTestDb();
  seedTestDb(db);
  app = createTestApp(db);
});

afterAll(() => {
  db.close();
  jest.restoreAllMocks();
});

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    test('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@novabank.com', password: 'Test@1234' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('john@novabank.com');
      expect(res.body.user.name).toBe('John Doe');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    test('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@novabank.com', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    test('rejects non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@novabank.com', password: 'Test@1234' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    test('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Test@1234' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    test('rejects empty password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@novabank.com', password: '' });
      expect(res.status).toBe(400);
    });

    test('rejects missing body fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    test('registers a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'new@novabank.com',
          phone: '555-9999',
          password: 'NewPass123',
        });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.name).toBe('New User');
      expect(res.body.user.account_number).toBeDefined();
    });

    test('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: 'john@novabank.com',
          phone: '555-1111',
          password: 'Test@1234',
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });

    test('rejects short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@novabank.com',
          phone: '555-2222',
          password: '123',
        });
      expect(res.status).toBe(400);
    });

    test('rejects invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email',
          email: 'not-email',
          phone: '555-3333',
          password: 'ValidPass123',
        });
      expect(res.status).toBe(400);
    });

    test('rejects missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@novabank.com',
          phone: '555-4444',
          password: 'ValidPass123',
        });
      expect(res.status).toBe(400);
    });

    test('rejects short name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A',
          email: 'shortname@novabank.com',
          phone: '555-5555',
          password: 'ValidPass123',
        });
      expect(res.status).toBe(400);
    });
  });
});
