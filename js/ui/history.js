const STORAGE_KEY = 'work-time-calculator-history';
const MAX_ITEMS = 20;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore
  }
}

function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const months = ['янв', 'фев', 'март', 'апр', 'май', 'июнь', 'июль', 'авг', 'сент', 'окт', 'ноя', 'дек'];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    return `${dayName}, ${day} ${monthName}`;
  } catch {
    return '';
  }
}

function formatTimeRange(entry) {
  const start = entry.start || '';
  const end = entry.end || '';
  if (!start) return '';
  if (!end) return start;
  return `${start} — ${end}`;
}

function formatLabel(entry) {
  const range = formatTimeRange(entry);
  const rate = entry.rate != null ? `${entry.rate}€/ч` : '';
  const days = entry.days != null ? `${entry.days} дн.` : '';
  const amount = entry.amount || '';
  const parts = [range, days, rate, amount].filter(Boolean);
  return parts.join(' · ');
}

function extractAmount(entry) {
  const amountStr = entry.amount || '';
  const match = amountStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export function createHistory({ listEl, clearBtn, deselectBtn, summaryEl, summaryHeaderEl, onSelect }) {
  const items = loadFromStorage();
  const selected = new Set();

  function updateHeaderSummary() {
    if (!summaryHeaderEl) return;
    const count = items.length;
    const plural = count === 1 ? 'запись' : count >= 2 && count <= 4 ? 'записи' : 'записей';
    summaryHeaderEl.textContent = `История расчётов (${count} ${plural})`;
  }

  function render() {
    if (!listEl) return;
    listEl.innerHTML = '';
    updateHeaderSummary();

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'historyEmpty';
      empty.textContent = 'Пока нет сохранённых расчётов.';
      listEl.appendChild(empty);
      return;
    }

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'historyItem' + (selected.has(item.id) ? ' selected' : '');

      const dateEl = document.createElement('div');
      dateEl.className = 'historyItemDate';
      dateEl.textContent = formatDate(item.createdAt);

      const contentEl = document.createElement('div');
      contentEl.className = 'historyItemContent';
      contentEl.textContent = formatLabel(item);

      row.appendChild(dateEl);
      row.appendChild(contentEl);

      row.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selected.has(item.id)) {
          selected.delete(item.id);
        } else {
          selected.add(item.id);
        }
        render();
        updateSummary();
      });

      row.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (typeof onSelect === 'function') onSelect(item);
      });

      listEl.appendChild(row);
    }
  }

  function updateSummary() {
    if (!summaryEl) return;
    if (!selected.size) {
      summaryEl.textContent = '';
      summaryEl.style.display = 'none';
      return;
    }

    let total = 0;
    for (const item of items) {
      if (selected.has(item.id)) {
        total += extractAmount(item);
      }
    }

    const rounded = Math.round((total + Number.EPSILON) * 100) / 100;
    summaryEl.textContent = `${rounded.toFixed(2)}€`;
    summaryEl.style.display = 'block';
  }

  function deselect() {
    selected.clear();
    render();
    updateSummary();
  }

  function updateDeselectButton() {
    if (!deselectBtn) return;
    deselectBtn.classList.toggle('visible', selected.size > 0);
  }

  function add(entry) {
    if (!entry) return;
    const now = Date.now();
    const next = {
      id: now,
      createdAt: new Date(now).toISOString(),
      ...entry
    };

    const isSame = (a, b) =>
      a.digits === b.digits &&
      a.rate === b.rate &&
      a.days === b.days &&
      a.amount === b.amount;

    const existingIndex = items.findIndex((it) => isSame(it, next));
    if (existingIndex >= 0) {
      items.splice(existingIndex, 1);
    }

    items.unshift(next);
    if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;

    saveToStorage(items);
    render();
    updateHeaderSummary();
  }

  function clear() {
    items.length = 0;
    selected.clear();
    saveToStorage(items);
    render();
    updateSummary();
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clear();
    });
  }

  if (deselectBtn) {
    deselectBtn.addEventListener('click', () => {
      deselect();
      updateDeselectButton();
    });
  }

  render();
  updateSummary();

  return {
    add,
    clear,
    getItems: () => [...items],
    deselect,
    getSelected: () => Array.from(selected),
    renderSummary: updateSummary
  };
}
