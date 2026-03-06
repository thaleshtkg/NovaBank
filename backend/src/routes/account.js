const express = require('express');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, phone, account_number, balance, account_type, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

router.get('/balance', authenticateToken, (req, res) => {
  const row = db.prepare('SELECT balance, account_number FROM users WHERE id = ?').get(req.user.id);
  if (!row) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ balance: row.balance, accountNumber: row.account_number });
});

router.put('/profile', authenticateToken, (req, res) => {
  const { name, phone } = req.body;
  if (!name && !phone) {
    return res.status(400).json({ error: 'Provide name or phone to update' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(
    name || user.name,
    phone || user.phone,
    req.user.id
  );

  const updated = db.prepare(
    'SELECT id, name, email, phone, account_number, balance, account_type, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  res.json({ message: 'Profile updated', user: updated });
});

module.exports = router;
