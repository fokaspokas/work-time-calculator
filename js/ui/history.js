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
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
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
  const amount = entry.amount || '';
  // days and rate are shown in meta (date line). Label keeps range and amount.
  const parts = [range, amount].filter(Boolean);
  return parts.join(' · ');
}

function formatMeta(entry) {
  const rate = entry.rate != null ? `${entry.rate}€/ч` : '';
  const days = entry.days != null ? `${entry.days} дн.` : '';
  const parts = [days, rate].filter(Boolean);
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
  let pending = null;

  function updateHeaderSummary() {
    if (!summaryHeaderEl) return;
    const count = items.length;
    const plural = count === 1 ? 'запись' : count >= 2 && count <= 4 ? 'записи' : 'записей';
    summaryHeaderEl.textContent = `История расчётов (${count} ${plural})`;
  }

  function updateClearButton() {
    if (!clearBtn) return;
    clearBtn.style.display = items.length ? 'inline-block' : 'none';
  }

  function setPending(entry) {
    const next = entry || null;

    // If previously there was a pending entry and now there is another pending
    // entry, skip re-render — the "Добавить" block is already visible and
    // doesn't need to update every second. We still want to render when
    // transitioning between null <-> non-null.
    if (pending && next) {
      pending = next;
      return;
    }

    function isSamePending(a, b) {
      if (!a && !b) return true;
      if (!a || !b) return false;
      const keys = ['digits', 'start', 'end', 'rate', 'days', 'amount'];
      for (const k of keys) {
        const va = a[k] == null ? null : a[k];
        const vb = b[k] == null ? null : b[k];
        if (va !== vb) return false;
      }
      return true;
    }

    if (isSamePending(pending, next)) {
      pending = next; // still set reference but skip render
      return;
    }

    pending = next;
    render();
  }

  function render() {
    if (!listEl) return;
    listEl.innerHTML = '';
    updateHeaderSummary();
    updateClearButton();
    updateDeselectButton();

    // If there's a pending entry (data ready to be added) show the add-block first
    if (pending) {
      const addRow = document.createElement('div');
      addRow.className = 'historyItem historyItemAdd';
      addRow.tabIndex = 0;

      const addIcon = document.createElement('div');
      addIcon.className = 'historyItemAddIcon';
      addIcon.textContent = '+';

      const addLabel = document.createElement('div');
      addLabel.className = 'historyItemContent';
      addLabel.textContent = 'Добавить';

      addRow.appendChild(addIcon);
      addRow.appendChild(addLabel);

      function doAdd() {
        if (!pending) return;
        add(pending);
        setPending(null);
      }

      addRow.addEventListener('click', (e) => { e.stopPropagation(); doAdd(); });
      addRow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doAdd(); } });

      listEl.appendChild(addRow);
    }

    if (!items.length) {
      if (!pending) {
        const empty = document.createElement('div');
        empty.className = 'historyEmpty';
        empty.textContent = 'Пока нет сохранённых расчётов.';
        listEl.appendChild(empty);
        return;
      }
      // if pending exists but no items, continue to render only the addRow
      return;
    }

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'historyItem' + (selected.has(item.id) ? ' selected' : '');


      const headerEl = document.createElement('div');
      headerEl.className = 'historyItemHeader';

      const dateEl = document.createElement('div');
      dateEl.className = 'historyItemDate';
      dateEl.textContent = formatDate(item.createdAt);

      const metaEl = document.createElement('div');
      metaEl.className = 'historyItemMeta';
      metaEl.textContent = formatMeta(item);

      headerEl.appendChild(dateEl);
      if (metaEl.textContent) headerEl.appendChild(metaEl);

      // content: left = time range, right = amount
      const contentEl = document.createElement('div');
      contentEl.className = 'historyItemContent';

      const contentLeft = document.createElement('div');
      contentLeft.className = 'historyItemContentLeft';
      contentLeft.textContent = formatTimeRange(item);

      const contentRight = document.createElement('div');
      contentRight.className = 'historyItemAmount';
      contentRight.textContent = item.amount || '';

      contentEl.appendChild(contentLeft);
      contentEl.appendChild(contentRight);

      row.appendChild(headerEl);
      row.appendChild(contentEl);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'historyItemDelete';
      deleteBtn.textContent = '×';
      deleteBtn.setAttribute('aria-label', 'Удалить');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        remove(item.id);
      });
      row.appendChild(deleteBtn);

      row.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selected.has(item.id)) {
          selected.delete(item.id);
        } else {
          selected.add(item.id);
        }
        render();
        updateSummary();
        updateDeselectButton();
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

  function remove(id) {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    items.splice(index, 1);
    selected.delete(id);
    saveToStorage(items);
    render();
    updateSummary();
    updateDeselectButton();
    updateClearButton();
  }

  function deselect() {
    selected.clear();
    render();
    updateSummary();
    updateDeselectButton();
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
    updateClearButton();
  }

  function clear() {
    items.length = 0;
    selected.clear();
    saveToStorage(items);
    render();
    updateSummary();
    updateDeselectButton();
    updateClearButton();
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
  updateDeselectButton();
  updateClearButton();

  return {
    add,
    clear,
    getItems: () => [...items],
    deselect,
    getSelected: () => Array.from(selected),
    renderSummary: updateSummary,
    setPending
  };
}
