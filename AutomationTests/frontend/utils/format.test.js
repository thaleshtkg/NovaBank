import { describe, it, expect } from 'vitest';
import { formatBalance, formatDate, formatTime, formatMemberSince } from '@/utils/format';

describe('formatBalance', () => {
  it('formats a whole number with two decimal places', () => {
    expect(formatBalance(1000)).toBe('1,000.00');
  });

  it('formats zero', () => {
    expect(formatBalance(0)).toBe('0.00');
  });

  it('formats a decimal amount', () => {
    expect(formatBalance(1234.5)).toBe('1,234.50');
  });

  it('formats a large number with commas', () => {
    expect(formatBalance(1000000)).toBe('1,000,000.00');
  });

  it('returns "0.00" for null', () => {
    expect(formatBalance(null)).toBe('0.00');
  });

  it('returns "0.00" for undefined', () => {
    expect(formatBalance(undefined)).toBe('0.00');
  });

  it('preserves existing decimal precision up to 2 places', () => {
    expect(formatBalance(99.99)).toBe('99.99');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate('2025-01-15T00:00:00Z');
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatDate('')).toBe('');
  });
});

describe('formatTime', () => {
  it('formats a valid ISO date-time string', () => {
    const result = formatTime('2025-01-15T10:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty string for null', () => {
    expect(formatTime(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatTime(undefined)).toBe('');
  });
});

describe('formatMemberSince', () => {
  it('formats a date in long format', () => {
    const result = formatMemberSince('2024-03-15T00:00:00Z');
    expect(result).toMatch(/\d{4}/);
    expect(result.length).toBeGreaterThan(5);
  });

  it('returns empty string for null', () => {
    expect(formatMemberSince(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatMemberSince(undefined)).toBe('');
  });
});
