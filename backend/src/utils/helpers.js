const crypto = require('crypto');

function generateAccountNumber() {
  const prefix = '20';
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + random;
}

function generateReferenceNumber() {
  return 'NB' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

module.exports = { generateAccountNumber, generateReferenceNumber, formatCurrency };
