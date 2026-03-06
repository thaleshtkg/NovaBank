export function formatBalance(amount) {
  if (amount == null) return '0.00';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString();
}

export function formatMemberSince(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
