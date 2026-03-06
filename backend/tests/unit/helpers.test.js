const { generateAccountNumber, generateReferenceNumber, formatCurrency } = require('../../src/utils/helpers');

describe('Helper Utilities', () => {
  describe('generateAccountNumber', () => {
    test('returns a string starting with "20"', () => {
      const acct = generateAccountNumber();
      expect(acct).toMatch(/^20\d{8}$/);
    });

    test('returns a 10-digit string', () => {
      const acct = generateAccountNumber();
      expect(acct).toHaveLength(10);
    });

    test('generates unique numbers', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateAccountNumber());
      }
      expect(numbers.size).toBeGreaterThan(90);
    });
  });

  describe('generateReferenceNumber', () => {
    test('returns a string starting with "NB"', () => {
      const ref = generateReferenceNumber();
      expect(ref).toMatch(/^NB/);
    });

    test('generates unique references', () => {
      const refs = new Set();
      for (let i = 0; i < 50; i++) {
        refs.add(generateReferenceNumber());
      }
      expect(refs.size).toBe(50);
    });

    test('is a non-empty string', () => {
      const ref = generateReferenceNumber();
      expect(typeof ref).toBe('string');
      expect(ref.length).toBeGreaterThan(2);
    });
  });

  describe('formatCurrency', () => {
    test('formats a positive number', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    test('formats zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    test('formats decimal amounts', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    test('formats large amounts', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });
  });
});
