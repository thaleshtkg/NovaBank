const { authenticateToken, generateToken, JWT_SECRET } = require('../../src/middleware/auth');
const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  describe('generateToken', () => {
    test('generates a valid JWT token', () => {
      const user = { id: 1, email: 'test@test.com', name: 'Test User' };
      const token = generateToken(user);
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(1);
      expect(decoded.email).toBe('test@test.com');
      expect(decoded.name).toBe('Test User');
    });

    test('token expires in 24h', () => {
      const user = { id: 1, email: 'test@test.com', name: 'Test' };
      const token = generateToken(user);
      const decoded = jwt.decode(token);
      const diff = decoded.exp - decoded.iat;
      expect(diff).toBe(86400);
    });
  });

  describe('authenticateToken', () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    test('returns 401 when no token provided', () => {
      authenticateToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 for invalid token', () => {
      req.headers['authorization'] = 'Bearer invalid-token';
      authenticateToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next() with valid token', () => {
      const user = { id: 1, email: 'test@test.com', name: 'Test' };
      const token = generateToken(user);
      req.headers['authorization'] = `Bearer ${token}`;
      authenticateToken(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe(1);
      expect(req.user.email).toBe('test@test.com');
    });

    test('returns 403 for expired token', () => {
      const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '0s' });
      req.headers['authorization'] = `Bearer ${token}`;
      authenticateToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
