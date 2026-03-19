import { parseRate, parseDays } from '../utils/format.js';

export function createControls({ rateInput, minusBtn, plusBtn, daysInput, minusDaysBtn, plusDaysBtn }, onChange) {
  function getRate() { return parseRate(rateInput.value); }
  function getDays() { return parseDays(daysInput?.value) ?? 1; }

  rateInput.addEventListener('input', () => {
    rateInput.value = rateInput.value.replace(',', '.').replace(/[^\d.]/g, '');
    if (onChange) onChange();
  });

  minusBtn.addEventListener('click', () => {
    const current = getRate() ?? 20;
    const next = Math.max(0, Math.round((current - 1) * 100) / 100);
    rateInput.value = String(next).replace(/\.00$/, '');
    if (onChange) onChange();
  });

  plusBtn.addEventListener('click', () => {
    const current = getRate() ?? 20;
    const next = Math.round((current + 1) * 100) / 100;
    rateInput.value = String(next).replace(/\.00$/, '');
    if (onChange) onChange();
  });

  if (daysInput) {
    daysInput.addEventListener('input', () => {
      daysInput.value = daysInput.value.replace(',', '.').replace(/[^\d.]/g, '');
      if (onChange) onChange();
    });

    daysInput.addEventListener('blur', () => {
      const v = parseDays(daysInput.value);
      if (v === null || v < 1) daysInput.value = '1';
      if (onChange) onChange();
    });

    minusDaysBtn.addEventListener('click', () => {
      const current = getDays() ?? 1;
      const next = Math.max(1, Math.round((current - 1) * 100) / 100);
      daysInput.value = String(next).replace(/\.0+$/, '');
      if (onChange) onChange();
    });

    plusDaysBtn.addEventListener('click', () => {
      const current = getDays() ?? 1;
      const next = Math.round((current + 1) * 100) / 100;
      daysInput.value = String(next).replace(/\.0+$/, '');
      if (onChange) onChange();
    });
  }

  return { getRate, getDays };
}
