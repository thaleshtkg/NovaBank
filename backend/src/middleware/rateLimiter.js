const transferLimits = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_TRANSFERS = 5;

function transferRateLimiter(req, res, next) {
  const userId = req.user.id;
  const now = Date.now();

  if (!transferLimits.has(userId)) {
    transferLimits.set(userId, []);
  }

  const timestamps = transferLimits.get(userId).filter(t => now - t < WINDOW_MS);
  transferLimits.set(userId, timestamps);

  if (timestamps.length >= MAX_TRANSFERS) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Maximum 5 transfers per minute.',
      retryAfter: Math.ceil((timestamps[0] + WINDOW_MS - now) / 1000)
    });
  }

  timestamps.push(now);
  next();
}

module.exports = { transferRateLimiter };
