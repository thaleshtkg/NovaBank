const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const db = require('../db/connection');
const { generateToken } = require('../middleware/auth');
const { generateAccountNumber } = require('../utils/helpers');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = bcrypt.hashSync(data.password, 10);
    let accountNumber;
    do {
      accountNumber = generateAccountNumber();
    } while (db.prepare('SELECT id FROM users WHERE account_number = ?').get(accountNumber));

    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, account_number, balance, account_type)
      VALUES (?, ?, ?, ?, ?, 1000000, 'Savings')
    `).run(data.name, data.email, data.phone, passwordHash, accountNumber);

    const user = db.prepare('SELECT id, name, email, account_number, balance, account_type, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after)
      VALUES (?, 'credit', 1000000, 'Initial deposit - Welcome bonus', ?, 'opening', 1000000)
    `).run(user.id, 'NB-WELCOME-' + accountNumber);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, 'Welcome to NovaBank!', 'Your account has been created successfully with a $1,000,000 welcome bonus!')
    `).run(user.id);

    const seedBills = [
      ['PowerGrid Co', 'electricity', 145.00, '+10 days'],
      ['FastNet ISP', 'internet', 79.99, '+15 days'],
      ['Verizon Wireless', 'phone', 125.00, '+20 days'],
      ['CityWater', 'water', 55.00, '+25 days'],
    ];
    const insertBill = db.prepare(`INSERT INTO bills (user_id, biller_name, category, amount, status, due_date) VALUES (?, ?, ?, ?, 'pending', date('now', ?))`);
    for (const bill of seedBills) {
      insertBill.run(user.id, ...bill);
    }

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = bcrypt.compareSync(data.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
