const request = require('supertest');
const { createTestDb, seedTestDb, createTestApp } = require('../setup');

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

describe('Admin Routes', () => {
  describe('POST /api/admin/reset', () => {
    test('resets database successfully', async () => {
      const res = await request(app).post('/api/admin/reset');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset');
    });
  });
});
