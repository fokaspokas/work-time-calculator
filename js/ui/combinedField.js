import { nowHHMM, nowHHMMSS } from '../utils/time.js';

function digitsFromValue(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8);
}

function normalizeDigitsSequential(digits) {
  digits = String(digits || '').replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  if (digits.length === 1 && digits[0] >= '3') return '0' + digits[0];
  if (digits.length >= 2 && digits[0] === '0' && digits[1] >= '3') {
    return ('0' + digits[1] + digits.slice(2)).slice(0, 4);
  }
  if (digits[0] >= '3') return ('0' + digits).slice(0, 4);
  return digits;
}

function formatSequentialFromDigits(digits) {
  digits = normalizeDigitsSequential(digits);
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

function finalizeDisplaySegment(valueDigits) {
  const digits = normalizeDigitsSequential(valueDigits);
  if (!digits) return '';
  const padded = (digits + '0000').slice(0, 4);
  return padded.slice(0, 2) + ':' + padded.slice(2, 4);
}

function segmentIsValid(raw) {
  if (!raw) return true;
  const padded = finalizeDisplaySegment(raw);
  if (!padded) return true;
  const parts = padded.split(':');
  if (parts.length !== 2) return false;
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return false;
  if (hh < 0 || hh > 23) return false;
  if (mm < 0 || mm > 59) return false;
  return true;
}

export function createCombinedField({ input, ghost, clearBtn, liveTag, measure }, onChange) {
  if (!input) throw new Error('input required');

  function updateGhostPosition() {
    if (!measure) return;
    measure.style.font = getComputedStyle(input).font;
    measure.style.letterSpacing = getComputedStyle(input).letterSpacing;
    measure.textContent = input.value || '';
    if (ghost) ghost.style.left = (16 + measure.getBoundingClientRect().width) + 'px';
  }

  function render() {
    const digits = digitsFromValue(input.value);
    const hasValue = digits.length > 0;
    if (clearBtn) clearBtn.classList.toggle('visible', hasValue);

    if (!hasValue) {
      input.placeholder = '00:00 - 00:00';
      if (ghost) ghost.textContent = '';
      if (liveTag) liveTag.style.display = 'none';
      input.value = '';
      updateGhostPosition();
      return;
    }

    const totalDigits = digits.length;
    const leftRaw = digits.slice(0, Math.min(4, totalDigits));
    const rightRaw = digits.slice(4);
    const left = formatSequentialFromDigits(leftRaw);
    const right = formatSequentialFromDigits(rightRaw);

    input.placeholder = '';
    const isFocused = (document.activeElement === input);
    let display;

    if (isFocused) {
      if (totalDigits < 4) {
        display = left;
        if (liveTag) liveTag.style.display = 'flex';
      } else {
        display = left + (right ? (' - ' + right) : ' - ');
        if (liveTag) liveTag.style.display = 'none';
      }
    } else {
      if (rightRaw.length === 0) {
        display = left;
        if (liveTag) liveTag.style.display = 'flex';
      } else {
        display = left + (right ? (' - ' + right) : ' - ');
        if (liveTag) liveTag.style.display = 'none';
      }
    }

    input.value = display;

    // ghost
    let template;
    if (!left) {
      if (ghost) ghost.textContent = '';
    } else if (isFocused) {
      if (totalDigits < 4) {
        template = (finalizeDisplaySegment(leftRaw) || '00:00') + ' - ' + nowHHMMSS();
        const current = left;
        if (ghost) ghost.textContent = template.slice(current.length);
      } else {
        template = (finalizeDisplaySegment(leftRaw) || '00:00') + ' - 00:00';
        const current = finalizeDisplaySegment(leftRaw) + (right ? (' - ' + right) : ' - ');
        if (ghost) ghost.textContent = template.slice(current.length);
      }
    } else {
      if (rightRaw.length === 0) {
        template = (finalizeDisplaySegment(leftRaw) || '00:00') + ' - ' + nowHHMMSS();
        const current = display;
        if (ghost) ghost.textContent = template.slice(current.length);
      } else {
        template = (finalizeDisplaySegment(leftRaw) || '00:00') + ' - 00:00';
        const current = display;
        if (ghost) ghost.textContent = template.slice(current.length);
      }
    }

    updateGhostPosition();
  }

  function normalizeWholeField() {
    const allDigits = digitsFromValue(input.value);
    const left = finalizeDisplaySegment(allDigits.slice(0, 4));
    const right = finalizeDisplaySegment(allDigits.slice(4));
    input.value = left + (right ? (' - ' + right) : '');
    if (onChange) onChange();
  }

  function appendDigit(digit) {
    const currentDigits = digitsFromValue(input.value);
    const next = (currentDigits + digit).slice(0, 8);
    const leftRaw = next.slice(0, 4);
    const rightRaw = next.slice(4);
    if (!segmentIsValid(leftRaw)) return;
    if (rightRaw && !segmentIsValid(rightRaw)) return;
    input.value = next;
    render();
    if (onChange) onChange();
  }

  function removeLast() {
    const currentDigits = digitsFromValue(input.value);
    const next = currentDigits.slice(0, -1);
    input.value = next;
    render();
    if (onChange) onChange();
  }

  function onBeforeInput(e) {
    const type = e.inputType || '';
    const data = (e.data || '').replace(/\D/g, '');
    if (type === 'insertText' && data) {
      e.preventDefault();
      appendDigit(data[0]);
      return;
    }
    if (type === 'deleteContentBackward' || type === 'deleteContentForward') {
      e.preventDefault();
      removeLast();
      return;
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      normalizeWholeField();
      input.blur();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      removeLast();
      return;
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      appendDigit(e.key);
    }
  }

  function onPaste(e) {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const digits = digitsFromValue(pasted);
    let acc = digitsFromValue(input.value);
    for (const ch of digits) {
      const cand = (acc + ch).slice(0, 8);
      const l = cand.slice(0, 4);
      const r = cand.slice(4);
      if (!segmentIsValid(l)) break;
      if (r && !segmentIsValid(r)) break;
      acc = cand;
    }
    input.value = acc;
    render();
    if (onChange) onChange();
  }

  function bind() {
    input.addEventListener('beforeinput', onBeforeInput);
    input.addEventListener('keydown', onKeyDown);
    input.addEventListener('paste', onPaste);
    input.addEventListener('blur', () => { if (input.value) normalizeWholeField(); else { if (onChange) onChange(); } });
    input.addEventListener('focus', () => { if (onChange) onChange(); });
    if (clearBtn) clearBtn.addEventListener('click', () => { input.value = ''; render(); if (onChange) onChange(); input.focus(); });
  }

  bind();
  render();

  return {
    getDigits() { return digitsFromValue(input.value); },
    getStartValue() { const d = digitsFromValue(input.value).slice(0,4); return finalizeDisplaySegment(d); },
    getEndValue() { const d = digitsFromValue(input.value).slice(4); return finalizeDisplaySegment(d); },
    render,
    destroy() {
      input.removeEventListener('beforeinput', onBeforeInput);
      input.removeEventListener('keydown', onKeyDown);
      input.removeEventListener('paste', onPaste);
      input.removeEventListener('blur', normalizeWholeField);
    }
  };
}
