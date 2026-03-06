const express = require('express');
const { z } = require('zod');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { transferRateLimiter } = require('../middleware/rateLimiter');
const { generateReferenceNumber } = require('../utils/helpers');

const router = express.Router();

const transferSchema = z.object({
  payee_id: z.number().int().positive(),
  amount: z.number().positive().max(1000, 'Maximum transfer amount is $1,000'),
  description: z.string().min(1).max(200).optional(),
  otp: z.string().length(6),
});

const VALID_OTP = '123456';

router.post('/', authenticateToken, transferRateLimiter, (req, res) => {
  try {
    const data = transferSchema.parse(req.body);

    if (data.otp !== VALID_OTP) {
      return res.status(400).json({ error: 'Invalid OTP. Use 123456 for testing.' });
    }

    const payee = db.prepare('SELECT * FROM payees WHERE id = ? AND user_id = ?').get(data.payee_id, req.user.id);
    if (!payee) {
      return res.status(404).json({ error: 'Payee not found' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (user.balance < data.amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const newBalance = Math.round((user.balance - data.amount) * 100) / 100;
    const refNumber = generateReferenceNumber();
    const description = data.description || `Transfer to ${payee.name}`;

    const transfer = db.transaction(() => {
      db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, req.user.id);

      db.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after)
        VALUES (?, 'debit', ?, ?, ?, 'transfer', ?)
      `).run(req.user.id, data.amount, description, refNumber, newBalance);

      const recipientUser = db.prepare('SELECT * FROM users WHERE account_number = ?').get(payee.account_number);
      if (recipientUser) {
        const recipientNewBalance = Math.round((recipientUser.balance + data.amount) * 100) / 100;
        db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(recipientNewBalance, recipientUser.id);
        db.prepare(`
          INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after)
          VALUES (?, 'credit', ?, ?, ?, 'transfer', ?)
        `).run(recipientUser.id, data.amount, `Transfer from ${user.name}`, generateReferenceNumber(), recipientNewBalance);

        db.prepare(`INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`).run(
          recipientUser.id,
          'Money Received',
          `You received $${data.amount.toFixed(2)} from ${user.name}.`
        );
      }

      db.prepare(`INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`).run(
        req.user.id,
        'Transfer Successful',
        `You transferred $${data.amount.toFixed(2)} to ${payee.name}.`
      );
    });

    transfer();

    res.json({
      message: 'Transfer successful',
      referenceNumber: refNumber,
      amount: data.amount,
      newBalance,
      payee: payee.name,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Transfer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
