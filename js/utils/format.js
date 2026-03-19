export function formatMoney(value) {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return `${rounded.toFixed(2)}€`;
}

export function parseRate(value) {
  const cleaned = String(value || '').replace(',', '.').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

export function parseDays(value) {
  const cleaned = String(value || '').replace(',', '.').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 1 ? num : null;
}
