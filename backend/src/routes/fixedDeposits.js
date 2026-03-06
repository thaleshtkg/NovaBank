const express = require('express');
const { z } = require('zod');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { generateReferenceNumber } = require('../utils/helpers');

const router = express.Router();

const INTEREST_RATES = {
  3: 4.5,
  6: 5.5,
  12: 6.5,
  24: 7.0,
  36: 7.5,
};

const fdSchema = z.object({
  amount: z.number().positive().min(1000, 'Minimum FD amount is $1,000'),
  tenure_months: z.number().int().refine(val => val in INTEREST_RATES, 'Invalid tenure. Choose 3, 6, 12, 24, or 36 months'),
});

router.get('/', authenticateToken, (req, res) => {
  const fds = db.prepare('SELECT * FROM fixed_deposits WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ fixedDeposits: fds, interestRates: INTEREST_RATES });
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const data = fdSchema.parse(req.body);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (user.balance < data.amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const interestRate = INTEREST_RATES[data.tenure_months];
    const newBalance = Math.round((user.balance - data.amount) * 100) / 100;
    const refNumber = generateReferenceNumber();

    const createFD = db.transaction(() => {
      db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, req.user.id);

      const result = db.prepare(`
        INSERT INTO fixed_deposits (user_id, amount, interest_rate, tenure_months, maturity_date, status)
        VALUES (?, ?, ?, ?, date('now', '+' || ? || ' months'), 'active')
      `).run(req.user.id, data.amount, interestRate, data.tenure_months, data.tenure_months);

      db.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after)
        VALUES (?, 'debit', ?, ?, ?, 'fixed_deposit', ?)
      `).run(req.user.id, data.amount, `Fixed Deposit - ${data.tenure_months} months @ ${interestRate}%`, refNumber, newBalance);

      db.prepare(`INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`).run(
        req.user.id,
        'Fixed Deposit Created',
        `Your FD of $${data.amount.toFixed(2)} for ${data.tenure_months} months at ${interestRate}% has been created.`
      );

      return result.lastInsertRowid;
    });

    const fdId = createFD();
    const fd = db.prepare('SELECT * FROM fixed_deposits WHERE id = ?').get(fdId);

    res.status(201).json({
      message: 'Fixed deposit created',
      fixedDeposit: fd,
      newBalance,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('FD creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/break', authenticateToken, (req, res) => {
  const fd = db.prepare('SELECT * FROM fixed_deposits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!fd) return res.status(404).json({ error: 'Fixed deposit not found' });
  if (fd.status !== 'active') return res.status(400).json({ error: 'Fixed deposit is not active' });

  const penaltyRate = 1.0;
  const effectiveRate = fd.interest_rate - penaltyRate;
  const daysHeld = Math.max(1, Math.floor((Date.now() - new Date(fd.created_at).getTime()) / (1000 * 60 * 60 * 24)));
  const interest = Math.round((fd.amount * (effectiveRate / 100) * (daysHeld / 365)) * 100) / 100;
  const totalReturn = Math.round((fd.amount + interest) * 100) / 100;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const newBalance = Math.round((user.balance + totalReturn) * 100) / 100;
  const refNumber = generateReferenceNumber();

  const breakFD = db.transaction(() => {
    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, req.user.id);
    db.prepare("UPDATE fixed_deposits SET status = 'broken' WHERE id = ?").run(fd.id);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after)
      VALUES (?, 'credit', ?, ?, ?, 'fixed_deposit', ?)
    `).run(req.user.id, totalReturn, `FD Premature Withdrawal (Penalty: ${penaltyRate}%)`, refNumber, newBalance);

    db.prepare(`INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`).run(
      req.user.id,
      'Fixed Deposit Broken',
      `Your FD of $${fd.amount.toFixed(2)} has been broken. Interest earned: $${interest.toFixed(2)} (after ${penaltyRate}% penalty).`
    );
  });

  breakFD();

  res.json({
    message: 'Fixed deposit broken successfully',
    interest,
    penaltyRate,
    totalReturn,
    newBalance,
  });
});

module.exports = router;
