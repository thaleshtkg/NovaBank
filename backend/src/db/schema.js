const db = require('./connection');
const bcrypt = require('bcryptjs');
const { generateAccountNumber, generateReferenceNumber } = require('../utils/helpers');

function initializeDatabase() {
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

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_payees_user ON payees(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_id);
    CREATE INDEX IF NOT EXISTS idx_fd_user ON fixed_deposits(user_id);
  `);
}

function seedDatabase() {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('john@novabank.com');
  if (existingUser) return;

  const passwordHash = bcrypt.hashSync('Test@1234', 10);
  const johnAcct = '2000000001';
  const janeAcct = '2000000002';

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, account_number, balance, account_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertUser.run('John Doe', 'john@novabank.com', '555-0101', passwordHash, johnAcct, 1000000, 'Savings', '-30 days');
  insertUser.run('Jane Smith', 'jane@novabank.com', '555-0102', passwordHash, janeAcct, 1000000, 'Checking', '-25 days');

  const john = db.prepare('SELECT id FROM users WHERE email = ?').get('john@novabank.com');
  const jane = db.prepare('SELECT id FROM users WHERE email = ?').get('jane@novabank.com');

  const insertPayee = db.prepare(`
    INSERT INTO payees (user_id, name, account_number, bank_name, routing_number, nickname, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertPayee.run(john.id, 'Jane Smith', janeAcct, 'NovaBank', '021000021', 'Jane', '-20 days');
  insertPayee.run(john.id, 'Alice Johnson', '3000000001', 'Chase Bank', '021000089', 'Alice', '-15 days');
  insertPayee.run(john.id, 'Bob Williams', '3000000002', 'Bank of America', '026009593', 'Bob', '-10 days');
  insertPayee.run(jane.id, 'John Doe', johnAcct, 'NovaBank', '021000021', 'John', '-20 days');
  insertPayee.run(jane.id, 'Charlie Brown', '3000000003', 'Wells Fargo', '121000248', 'Charlie', '-12 days');

  const insertTxn = db.prepare(`
    INSERT INTO transactions (user_id, type, amount, description, reference_number, category, balance_after, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const johnTxns = [
    ['credit', 1000000, 'Initial deposit - Welcome bonus', 'opening', 1000000, '-30 days'],
    ['debit', 500, 'Transfer to Jane Smith', 'transfer', 999500, '-20 days'],
    ['debit', 150, 'Electricity Bill - PowerGrid Co', 'utilities', 999350, '-18 days'],
    ['debit', 75.50, 'Internet Bill - FastNet ISP', 'utilities', 999274.50, '-15 days'],
    ['credit', 250, 'Refund from Amazon', 'shopping', 999524.50, '-12 days'],
    ['debit', 1000, 'Transfer to Alice Johnson', 'transfer', 998524.50, '-10 days'],
    ['debit', 200, 'Phone Bill - Verizon', 'utilities', 998324.50, '-7 days'],
    ['debit', 45.99, 'Netflix Subscription', 'entertainment', 998278.51, '-5 days'],
    ['debit', 320, 'Grocery Store', 'shopping', 997958.51, '-3 days'],
    ['credit', 800, 'Transfer from Bob Williams', 'transfer', 998758.51, '-1 days'],
  ];

  let johnBalance = 998758.51;
  for (const txn of johnTxns) {
    insertTxn.run(john.id, txn[0], txn[1], txn[2], generateReferenceNumber(), txn[3], txn[4], txn[5]);
  }
  db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(johnBalance, john.id);

  const janeTxns = [
    ['credit', 1000000, 'Initial deposit - Welcome bonus', 'opening', 1000000, '-25 days'],
    ['credit', 500, 'Transfer from John Doe', 'transfer', 1000500, '-20 days'],
    ['debit', 89.99, 'Water Bill - CityWater', 'utilities', 1000410.01, '-16 days'],
    ['debit', 650, 'Transfer to Charlie Brown', 'transfer', 999760.01, '-13 days'],
    ['debit', 120, 'Electricity Bill - PowerGrid Co', 'utilities', 999640.01, '-10 days'],
    ['credit', 1000, 'Salary Bonus', 'income', 1000640.01, '-6 days'],
    ['debit', 55.00, 'Spotify + Hulu Bundle', 'entertainment', 1000585.01, '-4 days'],
    ['debit', 280, 'Grocery Store', 'shopping', 1000305.01, '-2 days'],
  ];

  let janeBalance = 1000305.01;
  for (const txn of janeTxns) {
    insertTxn.run(jane.id, txn[0], txn[1], txn[2], generateReferenceNumber(), txn[3], txn[4], txn[5]);
  }
  db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(janeBalance, jane.id);

  const insertBill = db.prepare(`
    INSERT INTO bills (user_id, biller_name, category, amount, status, due_date)
    VALUES (?, ?, ?, ?, ?, date('now', ?))
  `);

  insertBill.run(john.id, 'PowerGrid Co', 'electricity', 145.00, 'pending', '+5 days');
  insertBill.run(john.id, 'FastNet ISP', 'internet', 79.99, 'pending', '+10 days');
  insertBill.run(john.id, 'Verizon Wireless', 'phone', 185.00, 'pending', '+15 days');
  insertBill.run(john.id, 'CityWater', 'water', 52.30, 'pending', '+20 days');
  insertBill.run(jane.id, 'PowerGrid Co', 'electricity', 132.00, 'pending', '+7 days');
  insertBill.run(jane.id, 'CityWater', 'water', 48.75, 'pending', '+12 days');
  insertBill.run(jane.id, 'FastNet ISP', 'internet', 69.99, 'pending', '+18 days');
  insertBill.run(jane.id, 'T-Mobile', 'phone', 95.00, 'pending', '+22 days');

  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, is_read, created_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  insertNotif.run(john.id, 'Welcome to NovaBank!', 'Your account has been created successfully. Enjoy banking with us!', 1, '-30 days');
  insertNotif.run(john.id, 'Transfer Successful', 'You transferred $500.00 to Jane Smith.', 1, '-20 days');
  insertNotif.run(john.id, 'Bill Payment Due', 'Your electricity bill of $145.00 is due in 5 days.', 0, '-1 days');
  insertNotif.run(john.id, 'Security Alert', 'A new login was detected from your account.', 0, '-1 hours');
  insertNotif.run(jane.id, 'Welcome to NovaBank!', 'Your account has been created successfully. Enjoy banking with us!', 1, '-25 days');
  insertNotif.run(jane.id, 'Money Received', 'You received $500.00 from John Doe.', 0, '-20 days');
  insertNotif.run(jane.id, 'Bill Payment Due', 'Your electricity bill of $132.00 is due in 7 days.', 0, '-1 days');

  console.log('Database seeded successfully!');
}

module.exports = { initializeDatabase, seedDatabase };

if (require.main === module) {
  initializeDatabase();
  seedDatabase();
  console.log('Database initialized and seeded.');
}
