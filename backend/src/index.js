const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, seedDatabase } = require('./db/schema');

initializeDatabase();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/account', require('./routes/account'));
app.use('/api/payees', require('./routes/payees'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/fixed-deposits', require('./routes/fixedDeposits'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'NovaBank API', version: '1.0.0' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`NovaBank API running on http://localhost:${PORT}`);
});
