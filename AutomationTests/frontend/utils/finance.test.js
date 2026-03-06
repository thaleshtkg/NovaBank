import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateDaysUntilDue,
  getBillBadgeVariant,
  getBillDueLabel,
  calculateEstimatedFDReturn,
  validateTransferAmount,
} from '@/utils/finance';

describe('calculateDaysUntilDue', () => {
  it('returns a positive number for a future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const result = calculateDaysUntilDue(futureDate.toISOString());
    expect(result).toBeGreaterThan(0);
  });

  it('returns a negative number or zero for a past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = calculateDaysUntilDue(pastDate.toISOString());
    expect(result).toBeLessThanOrEqual(0);
  });

  it('returns approximately the correct number of days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const result = calculateDaysUntilDue(futureDate.toISOString());
    expect(result).toBeGreaterThanOrEqual(6);
    expect(result).toBeLessThanOrEqual(8);
  });
});

describe('getBillBadgeVariant', () => {
  it('returns "danger" when days until due is 5 or fewer', () => {
    expect(getBillBadgeVariant(5)).toBe('danger');
    expect(getBillBadgeVariant(1)).toBe('danger');
    expect(getBillBadgeVariant(0)).toBe('danger');
    expect(getBillBadgeVariant(-3)).toBe('danger');
  });

  it('returns "warning" when days until due is more than 5', () => {
    expect(getBillBadgeVariant(6)).toBe('warning');
    expect(getBillBadgeVariant(30)).toBe('warning');
  });
});

describe('getBillDueLabel', () => {
  it('returns "Overdue" when daysUntilDue is 0 or negative', () => {
    expect(getBillDueLabel(0)).toBe('Overdue');
    expect(getBillDueLabel(-1)).toBe('Overdue');
    expect(getBillDueLabel(-10)).toBe('Overdue');
  });

  it('returns "Due in Nd" for positive days', () => {
    expect(getBillDueLabel(1)).toBe('Due in 1d');
    expect(getBillDueLabel(10)).toBe('Due in 10d');
    expect(getBillDueLabel(30)).toBe('Due in 30d');
  });
});

describe('calculateEstimatedFDReturn', () => {
  it('calculates correct return for 12-month FD', () => {
    const result = calculateEstimatedFDReturn(10000, 6.5, 12);
    expect(result).toBeCloseTo(650, 2);
  });

  it('calculates correct return for 3-month FD', () => {
    const result = calculateEstimatedFDReturn(5000, 4.5, 3);
    expect(result).toBeCloseTo(56.25, 2);
  });

  it('calculates correct return for 36-month FD', () => {
    const result = calculateEstimatedFDReturn(1000, 7.5, 36);
    expect(result).toBeCloseTo(225, 2);
  });

  it('returns 0 for NaN amount', () => {
    expect(calculateEstimatedFDReturn('abc', 6.5, 12)).toBe(0);
  });

  it('returns 0 for negative amount', () => {
    expect(calculateEstimatedFDReturn(-1000, 6.5, 12)).toBe(0);
  });

  it('returns 0 for zero amount', () => {
    expect(calculateEstimatedFDReturn(0, 6.5, 12)).toBe(0);
  });

  it('handles string amount by parsing it', () => {
    const result = calculateEstimatedFDReturn('5000', 6.5, 12);
    expect(result).toBeCloseTo(325, 2);
  });
});

describe('validateTransferAmount', () => {
  it('accepts a valid amount within balance and limit', () => {
    const result = validateTransferAmount(500, 10000);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('rejects zero amount', () => {
    const result = validateTransferAmount(0, 10000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects negative amount', () => {
    const result = validateTransferAmount(-50, 10000);
    expect(result.valid).toBe(false);
  });

  it('rejects non-numeric string', () => {
    const result = validateTransferAmount('abc', 10000);
    expect(result.valid).toBe(false);
  });

  it('rejects amount exceeding $1000 default limit', () => {
    const result = validateTransferAmount(1001, 10000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Maximum transfer');
  });

  it('accepts exactly the maximum amount', () => {
    const result = validateTransferAmount(1000, 10000);
    expect(result.valid).toBe(true);
  });

  it('rejects amount exceeding user balance', () => {
    const result = validateTransferAmount(500, 200);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('balance');
  });

  it('accepts a custom maxAmount', () => {
    const result = validateTransferAmount(2000, 50000, 5000);
    expect(result.valid).toBe(true);
  });
});
