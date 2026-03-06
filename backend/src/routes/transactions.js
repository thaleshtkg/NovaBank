const express = require('express');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, limit = 20, type, category, search, startDate, endDate, minAmount, maxAmount } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = ['user_id = ?'];
  let params = [req.user.id];

  if (type && (type === 'credit' || type === 'debit')) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  if (search) {
    conditions.push('(description LIKE ? OR reference_number LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (startDate) {
    conditions.push('created_at >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('created_at <= ?');
    params.push(endDate + 'T23:59:59');
  }

  if (minAmount) {
    conditions.push('amount >= ?');
    params.push(parseFloat(minAmount));
  }

  if (maxAmount) {
    conditions.push('amount <= ?');
    params.push(parseFloat(maxAmount));
  }

  const where = conditions.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) as count FROM transactions WHERE ${where}`).get(...params).count;
  const transactions = db.prepare(
    `SELECT * FROM transactions WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

router.get('/export', authenticateToken, (req, res) => {
  const { type, category, startDate, endDate } = req.query;

  let conditions = ['user_id = ?'];
  let params = [req.user.id];

  if (type) { conditions.push('type = ?'); params.push(type); }
  if (category) { conditions.push('category = ?'); params.push(category); }
  if (startDate) { conditions.push('created_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('created_at <= ?'); params.push(endDate + 'T23:59:59'); }

  const where = conditions.join(' AND ');
  const transactions = db.prepare(
    `SELECT * FROM transactions WHERE ${where} ORDER BY created_at DESC`
  ).all(...params);

  let csv = 'Date,Type,Amount,Description,Reference,Category,Balance After\n';
  for (const t of transactions) {
    csv += `"${t.created_at}","${t.type}","${t.amount}","${t.description}","${t.reference_number}","${t.category}","${t.balance_after}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
  res.send(csv);
});

router.get('/recent', authenticateToken, (req, res) => {
  const transactions = db.prepare(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
  ).all(req.user.id);
  res.json({ transactions });
});

router.get('/summary', authenticateToken, (req, res) => {
  const categories = db.prepare(`
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM transactions WHERE user_id = ? AND type = 'debit'
    GROUP BY category ORDER BY total DESC
  `).all(req.user.id);

  const monthlySpend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total
    FROM transactions WHERE user_id = ? AND type = 'debit'
    GROUP BY month ORDER BY month DESC LIMIT 6
  `).all(req.user.id);

  const totalCredit = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'credit'`).get(req.user.id).total;
  const totalDebit = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'debit'`).get(req.user.id).total;

  res.json({ categories, monthlySpend, totalCredit, totalDebit });
});

module.exports = router;
