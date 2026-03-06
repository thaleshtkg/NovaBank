const express = require('express');
const { z } = require('zod');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const payeeSchema = z.object({
  name: z.string().min(2).max(100),
  account_number: z.string().min(5).max(20),
  bank_name: z.string().min(2).max(100),
  routing_number: z.string().min(5).max(20),
  nickname: z.string().max(50).optional(),
});

router.get('/', authenticateToken, (req, res) => {
  const { search } = req.query;
  let payees;

  if (search) {
    payees = db.prepare(
      `SELECT * FROM payees WHERE user_id = ? AND (name LIKE ? OR nickname LIKE ? OR account_number LIKE ?) ORDER BY created_at DESC`
    ).all(req.user.id, `%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    payees = db.prepare('SELECT * FROM payees WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  }

  res.json({ payees });
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const data = payeeSchema.parse(req.body);

    const existing = db.prepare(
      'SELECT id FROM payees WHERE user_id = ? AND account_number = ?'
    ).get(req.user.id, data.account_number);

    if (existing) {
      return res.status(409).json({ error: 'Payee with this account number already exists' });
    }

    const result = db.prepare(`
      INSERT INTO payees (user_id, name, account_number, bank_name, routing_number, nickname)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, data.name, data.account_number, data.bank_name, data.routing_number, data.nickname || null);

    const payee = db.prepare('SELECT * FROM payees WHERE id = ?').get(result.lastInsertRowid);

    db.prepare(`INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`).run(
      req.user.id,
      'Payee Added',
      `${data.name} has been added as a payee.`
    );

    res.status(201).json({ message: 'Payee added successfully', payee });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Add payee error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  const payee = db.prepare('SELECT * FROM payees WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!payee) {
    return res.status(404).json({ error: 'Payee not found' });
  }

  db.prepare('DELETE FROM payees WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

  db.prepare(`INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`).run(
    req.user.id,
    'Payee Removed',
    `${payee.name} has been removed from your payees.`
  );

  res.json({ message: 'Payee removed successfully' });
});

module.exports = router;
