export function nowHHMM() {
  const now = new Date();
  return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

export function nowHHMMSS() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function parseTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export function parseTimeSeconds(value) {
  const minutes = parseTime(value);
  return minutes === null ? null : minutes * 60;
}

export function formatDurationFromSeconds(totalSeconds, includeSeconds) {
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const h = Math.floor(totalSeconds / 3600);
  const hWord = h === 1 ? 'час' : (h >= 2 && h <= 4 ? 'часа' : 'час');
  if (includeSeconds) return `${h} ${hWord} ${m} мин ${String(s).padStart(2, '0')} сек`;
  return `${h} ${hWord} ${m} мин`;
}
