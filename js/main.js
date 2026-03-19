import { createCombinedField } from './ui/combinedField.js';
import { createControls } from './ui/controls.js';
import { createResults } from './ui/results.js';
import { parseTime, parseTimeSeconds, formatDurationFromSeconds } from './utils/time.js';
import { formatMoney, pluralizeDays } from './utils/format.js';

const els = {
  timeInput: document.getElementById('timeRange'),
  timeGhost: document.getElementById('timeGhost'),
  timeClear: document.getElementById('timeClear'),
  liveTag: document.getElementById('liveTag'),
  measure: document.getElementById('measure'),
  rateInput: document.getElementById('rate'),
  minusBtn: document.getElementById('minusBtn'),
  plusBtn: document.getElementById('plusBtn'),
  daysInput: document.getElementById('days'),
  minusDaysBtn: document.getElementById('minusDaysBtn'),
  plusDaysBtn: document.getElementById('plusDaysBtn'),
  daysSuffix: document.getElementById('daysSuffix'),
  durationText: document.getElementById('durationText'),
  amountText: document.getElementById('amountText'),
  copyAmountBtn: document.getElementById('copyAmountBtn'),
  errorText: document.getElementById('error')
};

let combined;
let controls;
let results;

function recalc() {
  if (!combined || !controls || !results) return;
  if (els.errorText) els.errorText.textContent = '';

  combined.render();

  const allDigits = combined.getDigits();
  const leftDigits = allDigits.slice(0, 4);
  const rightDigits = allDigits.slice(4);

  const startValue = leftDigits ? (combined.getStartValue() || '') : '';
  const rateValue = controls.getRate();
  const daysValue = controls.getDays() ?? 1;
  if (els.daysSuffix) els.daysSuffix.textContent = pluralizeDays(daysValue);

  if (!startValue) { results.clear(); return; }

  const isFocused = (document.activeElement === els.timeInput);
  const rightAbsent = rightDigits.length === 0;
  const live = rightAbsent;

  if (live) {
    const startSeconds = parseTimeSeconds(startValue);
    if (startSeconds === null) { results.clear(); if (els.errorText) els.errorText.textContent = 'Проверьте время начала.'; return; }
    const now = new Date();
    const endSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let diffSeconds = endSeconds - startSeconds; if (diffSeconds < 0) diffSeconds += 24 * 3600;
    if (rateValue === null) { results.clear(); if (els.errorText) els.errorText.textContent = 'Проверьте стоимость часа.'; return; }
    results.setDuration(formatDurationFromSeconds(diffSeconds, true));
    results.setAmount(formatMoney((diffSeconds / 3600) * rateValue * daysValue));
    return;
  }

  const endValue = rightDigits.length ? combined.getEndValue() : '00:00';
  const startMinutes = parseTime(startValue);
  if (startMinutes === null) { results.clear(); if (els.errorText) els.errorText.textContent = 'Проверьте время начала.'; return; }
  const endMinutes = parseTime(endValue);
  if (endMinutes === null) { results.clear(); if (els.errorText) els.errorText.textContent = 'Проверьте время окончания.'; return; }
  if (rateValue === null) { results.clear(); if (els.errorText) els.errorText.textContent = 'Проверьте стоимость часа.'; return; }

  let diff = endMinutes - startMinutes; if (diff < 0) diff += 24 * 60;
  results.setDuration(formatDurationFromSeconds(diff * 60, false));
  results.setAmount(formatMoney((diff / 60) * rateValue * daysValue));
}

function init() {
  combined = createCombinedField({ input: els.timeInput, ghost: els.timeGhost, clearBtn: els.timeClear, liveTag: els.liveTag, measure: els.measure }, recalc);
  controls = createControls({ rateInput: els.rateInput, minusBtn: els.minusBtn, plusBtn: els.plusBtn, daysInput: els.daysInput, minusDaysBtn: els.minusDaysBtn, plusDaysBtn: els.plusDaysBtn }, recalc);
  results = createResults({ durationEl: els.durationText, amountEl: els.amountText, copyBtn: els.copyAmountBtn });

  // periodic recalc when in live mode (right absent)
  setInterval(() => {
    const allDigits = combined.getDigits();
    const rightDigits = allDigits.slice(4);
    if (rightDigits.length === 0) recalc();
  }, 1000);

  window.addEventListener('resize', recalc);
  recalc();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
