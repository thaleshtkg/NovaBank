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

describe('Notifications Routes', () => {
  describe('GET /api/notifications', () => {
    test('returns notifications and unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(typeof res.body.unreadCount).toBe('number');
    });

    test('notifications have correct structure', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      const notif = res.body.notifications[0];
      expect(notif.title).toBeDefined();
      expect(notif.message).toBeDefined();
      expect(notif.created_at).toBeDefined();
      expect(typeof notif.is_read).toBe('number');
    });

    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    test('marks a notification as read', async () => {
      const notifsRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      const unread = notifsRes.body.notifications.find(n => !n.is_read);
      if (!unread) return;

      const res = await request(app)
        .put(`/api/notifications/${unread.id}/read`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    test('marks all notifications as read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const notifsRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      expect(notifsRes.body.unreadCount).toBe(0);
    });
  });
});
