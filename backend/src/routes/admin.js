const express = require('express');
const db = require('../db/connection');
const { initializeDatabase, seedDatabase } = require('../db/schema');

const router = express.Router();

router.post('/reset', (req, res) => {
  try {
    db.exec(`
      DELETE FROM notifications;
      DELETE FROM bills;
      DELETE FROM fixed_deposits;
      DELETE FROM transactions;
      DELETE FROM payees;
      DELETE FROM users;
    `);

    seedDatabase();

    res.json({ message: 'Database reset to initial state successfully' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

module.exports = router;
