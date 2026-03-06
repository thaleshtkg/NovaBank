const express = require('express');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { generateReferenceNumber } = require('../utils/helpers');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const bills = db.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC').all(req.user.id);
  res.json({ bills });
});

router.post('/:id/pay', authenticateToken, (req, res) => {
  const bill = db.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!bill) {
    return res.status(404).json({ error: 'Bill not found' });
  }

  if (bill.status === 'paid') {
    return res.status(400).json({ error: 'Bill already paid' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < bill.amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const newBalance = Math.round((user.balance - bill.amount) * 100) / 100;
  const refNumber = generateReferenceNumber();

  const payBill = db.transaction(() => {
    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, req.user.id);
    db.prepare("UPDATE bills SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(bill.id);
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after)
      VALUES (?, 'debit', ?, ?, ?, 'utilities', ?)
    `).run(req.user.id, bill.amount, `${bill.biller_name} - ${bill.category} bill`, refNumber, newBalance);

    db.prepare(`INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`).run(
      req.user.id,
      'Bill Paid',
      `Your ${bill.category} bill of $${bill.amount.toFixed(2)} to ${bill.biller_name} has been paid.`
    );
  });

  payBill();

  res.json({
    message: 'Bill paid successfully',
    referenceNumber: refNumber,
    newBalance,
  });
});

module.exports = router;
