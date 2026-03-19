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

export function pluralizeDays(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'дней';

  const abs = Math.abs(num);
  if (!Number.isFinite(abs)) return 'дней';

  // Для дробных значений принимаем форму, используемую, например, в «1,5 дня».
  if (abs % 1 !== 0) return 'дня';

  const intVal = Math.floor(abs);
  const rem100 = intVal % 100;
  if (rem100 >= 11 && rem100 <= 14) return 'дней';

  const rem10 = intVal % 10;
  if (rem10 === 1) return 'день';
  if (rem10 >= 2 && rem10 <= 4) return 'дня';
  return 'дней';
}

export function pluralizeEntries(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'записей';

  const abs = Math.floor(Math.abs(num));
  const rem100 = abs % 100;
  if (rem100 >= 11 && rem100 <= 14) return 'записей';

  const rem10 = abs % 10;
  if (rem10 === 1) return 'запись';
  if (rem10 >= 2 && rem10 <= 4) return 'записи';
  return 'записей';
}
