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
      // brief click feedback
      copyBtn.classList.add('clicked');
      setTimeout(() => copyBtn.classList.remove('clicked'), 180);

      const prev = copyBtn.textContent;
      // lock width to avoid jumps when changing text
      const currentWidth = copyBtn.offsetWidth;
      copyBtn.style.width = currentWidth + 'px';

      try {
        await navigator.clipboard.writeText(text);
        copyBtn.classList.add('copied');
        copyBtn.textContent = 'Скопировано';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.textContent = prev;
          copyBtn.style.width = '';
        }, 1200);
      } catch (e) {
        // fallback copy
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } finally { document.body.removeChild(ta); copyBtn.style.width = ''; }
      }
    });
  }

  return { setDuration, setAmount, clear, getAmountText, updateCopyVisibility };
}
