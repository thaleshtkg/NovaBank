export function calculateDaysUntilDue(dueDateStr) {
  return Math.ceil((new Date(dueDateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

export function getBillBadgeVariant(daysUntilDue) {
  return daysUntilDue <= 5 ? 'danger' : 'warning';
}

export function getBillDueLabel(daysUntilDue) {
  if (daysUntilDue <= 0) return 'Overdue';
  return `Due in ${daysUntilDue}d`;
}

export function calculateEstimatedFDReturn(amount, interestRatePercent, tenureMonths) {
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt < 0) return 0;
  return amt * (interestRatePercent / 100) * (tenureMonths / 12);
}

export function validateTransferAmount(amount, userBalance, maxAmount = 1000) {
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) return { valid: false, error: 'Enter a valid amount' };
  if (amt > maxAmount) return { valid: false, error: `Maximum transfer is $${maxAmount.toLocaleString()} per transaction` };
  if (amt > userBalance) return { valid: false, error: 'Insufficient balance' };
  return { valid: true, error: null };
}
