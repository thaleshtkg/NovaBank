const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      account_number TEXT NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 1000000,
      account_type TEXT NOT NULL DEFAULT 'Savings',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      routing_number TEXT NOT NULL,
      nickname TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('credit','debit')),
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      reference_number TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'transfer',
      balance_after REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fixed_deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      maturity_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','matured','broken')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      biller_name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','overdue')),
      due_date TEXT NOT NULL,
      paid_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}

function seedTestDb(db) {
  const passwordHash = bcrypt.hashSync('Test@1234', 10);

  db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, account_number, balance, account_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('John Doe', 'john@novabank.com', '555-0101', passwordHash, '2000000001', 1000000, 'Savings');

  db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, account_number, balance, account_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Jane Smith', 'jane@novabank.com', '555-0102', passwordHash, '2000000002', 1000000, 'Checking');

  const john = db.prepare('SELECT id FROM users WHERE email = ?').get('john@novabank.com');
  const jane = db.prepare('SELECT id FROM users WHERE email = ?').get('jane@novabank.com');

  db.prepare(`
    INSERT INTO payees (user_id, name, account_number, bank_name, routing_number, nickname)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(john.id, 'Jane Smith', '2000000002', 'NovaBank', '021000021', 'Jane');

  db.prepare(`
    INSERT INTO payees (user_id, name, account_number, bank_name, routing_number, nickname)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(john.id, 'Alice Johnson', '3000000001', 'Chase Bank', '021000089', 'Alice');

  db.prepare(`
    INSERT INTO payees (user_id, name, account_number, bank_name, routing_number, nickname)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(jane.id, 'John Doe', '2000000001', 'NovaBank', '021000021', 'John');

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(john.id, 'credit', 1000000, 'Initial deposit', 'NB-WELCOME-001', 'opening', 1000000);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(john.id, 'debit', 500, 'Transfer to Jane', 'NB-TXN-001', 'transfer', 999500);

  db.prepare(`
    INSERT INTO bills (user_id, biller_name, category, amount, status, due_date)
    VALUES (?, ?, ?, ?, ?, date('now', '+5 days'))
  `).run(john.id, 'PowerGrid Co', 'electricity', 145.00, 'pending');

  db.prepare(`
    INSERT INTO bills (user_id, biller_name, category, amount, status, due_date)
    VALUES (?, ?, ?, ?, ?, date('now', '+10 days'))
  `).run(john.id, 'FastNet ISP', 'internet', 79.99, 'pending');

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, is_read)
    VALUES (?, ?, ?, ?)
  `).run(john.id, 'Welcome!', 'Welcome to NovaBank', 1);

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, is_read)
    VALUES (?, ?, ?, ?)
  `).run(john.id, 'Bill Due', 'Electricity bill due soon', 0);

  return { john, jane };
}

function createTestApp(db) {
  const connectionPath = require.resolve('../src/db/connection');
  require.cache[connectionPath] = {
    id: connectionPath,
    filename: connectionPath,
    loaded: true,
    exports: db,
  };

  const routeModules = [
    '../src/routes/auth',
    '../src/routes/account',
    '../src/routes/payees',
    '../src/routes/transfers',
    '../src/routes/transactions',
    '../src/routes/bills',
    '../src/routes/fixedDeposits',
    '../src/routes/notifications',
    '../src/routes/admin',
    '../src/db/schema',
  ];

  for (const mod of routeModules) {
    delete require.cache[require.resolve(mod)];
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', require('../src/routes/auth'));
  app.use('/api/account', require('../src/routes/account'));
  app.use('/api/payees', require('../src/routes/payees'));
  app.use('/api/transfers', require('../src/routes/transfers'));
  app.use('/api/transactions', require('../src/routes/transactions'));
  app.use('/api/bills', require('../src/routes/bills'));
  app.use('/api/fixed-deposits', require('../src/routes/fixedDeposits'));
  app.use('/api/notifications', require('../src/routes/notifications'));
  app.use('/api/admin', require('../src/routes/admin'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'NovaBank API', version: '1.0.0' });
  });

  app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

function getAuthToken(app) {
  const request = require('supertest');
  return request(app)
    .post('/api/auth/login')
    .send({ email: 'john@novabank.com', password: 'Test@1234' })
    .then(res => res.body.token);
}

module.exports = { createTestDb, seedTestDb, createTestApp, getAuthToken };
