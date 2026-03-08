const request = require('supertest');
const { createTestDb, seedTestDb, createTestApp } = require('../../helpers/backend-setup');
const { version: EXPECTED_VERSION } = require('../../../backend/package.json');

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

describe('Health Check', () => {
  test('GET /api/health returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.name).toBe('NovaBank API');
    expect(res.body.version).toBe(EXPECTED_VERSION);
  });
});
