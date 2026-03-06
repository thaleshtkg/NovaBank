const { transferRateLimiter } = require('../../src/middleware/rateLimiter');

describe('Transfer Rate Limiter', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: Date.now() + Math.random() } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('allows first request through', () => {
    transferRateLimiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('allows up to 5 requests per minute', () => {
    for (let i = 0; i < 5; i++) {
      next.mockClear();
      transferRateLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  test('blocks 6th request within 1 minute', () => {
    for (let i = 0; i < 5; i++) {
      transferRateLimiter(req, res, next);
    }
    next.mockClear();
    transferRateLimiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Rate limit') })
    );
  });

  test('different users have separate rate limits', () => {
    const req2 = { user: { id: 99999 } };
    for (let i = 0; i < 5; i++) {
      transferRateLimiter(req, res, next);
    }
    next.mockClear();
    transferRateLimiter(req2, res, next);
    expect(next).toHaveBeenCalled();
  });
});
