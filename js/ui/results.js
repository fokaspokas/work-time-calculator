export function createResults({ durationEl, amountEl, copyBtn }) {
  function setDuration(text) { if (durationEl) durationEl.textContent = text; }
  function setAmount(text) { if (amountEl) amountEl.textContent = text; updateCopyVisibility(); }
  function clear() { setDuration('—'); setAmount('—'); }
  function getAmountText() { return amountEl ? amountEl.textContent.trim() : ''; }

  function updateCopyVisibility() {
    if (!copyBtn) return;
    const has = amountEl && amountEl.textContent && amountEl.textContent.trim() !== '—';
    copyBtn.classList.toggle('visible', !!has);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = getAmountText();
      if (!text) return;

      copyBtn.classList.add('clicked');
      setTimeout(() => copyBtn.classList.remove('clicked'), 220);

      const prev = copyBtn.textContent;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.classList.add('copied');
        copyBtn.textContent = 'Скопировано';
        setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.textContent = prev; }, 1200);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
      }
    });
  }

  return { setDuration, setAmount, clear, getAmountText, updateCopyVisibility };
}
