import { applyTheme, initNousUI, loadTheme } from '../lib/nousui.js';

const DB_NAME = 'nousui_lab_db';
const DB_VERSION = 1;
const STORE = 'components';

const el = {
  openModalBtn: document.getElementById('openModalBtn'),
  resetDbBtn: document.getElementById('resetDbBtn'),
  statusFilter: document.getElementById('statusFilter'),
  searchInput: document.getElementById('searchInput'),
  componentsTable: document.getElementById('componentsTable'),
  emptyState: document.getElementById('emptyState'),
  componentModal: document.getElementById('componentModal'),
  componentForm: document.getElementById('componentForm'),
  compName: document.getElementById('compName'),
  compType: document.getElementById('compType'),
  compStatus: document.getElementById('compStatus'),
  compNotes: document.getElementById('compNotes'),
  statsBox: document.getElementById('statsBox'),
  toast: document.getElementById('toast'),
  accentInput: document.getElementById('accentInput'),
  bgInput: document.getElementById('bgInput'),
  saveThemeBtn: document.getElementById('saveThemeBtn'),
};

const state = {
  rows: [],
  filterStatus: 'all',
  search: '',
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

async function dbAction(mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = callback(store);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    tx.oncomplete = () => db.close();
  });
}

function listAll() {
  return dbAction('readonly', (store) => store.getAll());
}

function insertRow(payload) {
  return dbAction('readwrite', (store) => store.add(payload));
}

function updateRow(payload) {
  return dbAction('readwrite', (store) => store.put(payload));
}

function deleteRow(id) {
  return dbAction('readwrite', (store) => store.delete(id));
}

function clearStore() {
  return dbAction('readwrite', (store) => store.clear());
}

function showToast(message) {
  el.toast.show(message);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('es-ES');
  } catch {
    return iso;
  }
}

function statusBadge(status) {
  const toneByStatus = {
    draft: 'warning',
    testing: 'neutral',
    ready: 'success',
    deprecated: 'danger',
  };
  const labelByStatus = {
    draft: 'Borrador',
    testing: 'En pruebas',
    ready: 'Listo',
    deprecated: 'Deprecated',
  };
  const tone = toneByStatus[status] || 'neutral';
  const label = labelByStatus[status] || status;
  return `<nous-badge tone="${tone}">${label}</nous-badge>`;
}

function renderStats(rows) {
  const total = rows.length;
  const ready = rows.filter((row) => row.status === 'ready').length;
  const testing = rows.filter((row) => row.status === 'testing').length;

  el.statsBox.innerHTML = `
    <article class="kpi"><strong>${total}</strong><span>Total componentes</span></article>
    <article class="kpi"><strong>${ready}</strong><span>Listos para uso</span></article>
    <article class="kpi"><strong>${testing}</strong><span>En pruebas</span></article>
  `;
}

function filteredRows() {
  return state.rows
    .filter((row) => state.filterStatus === 'all' ? true : row.status === state.filterStatus)
    .filter((row) => row.name.toLowerCase().includes(state.search.toLowerCase()));
}

function renderTable() {
  const rows = filteredRows();
  renderStats(state.rows);

  if (!rows.length) {
    el.componentsTable.innerHTML = '';
    el.emptyState.hidden = false;
    return;
  }

  el.emptyState.hidden = true;

  el.componentsTable.innerHTML = rows.map((row) => `
    <tr data-id="${row.id}">
      <td><strong>${escapeHtml(row.name)}</strong></td>
      <td>${escapeHtml(row.type)}</td>
      <td>${statusBadge(row.status)}</td>
      <td>${escapeHtml(row.notes || '')}</td>
      <td>${formatDate(row.createdAt)}</td>
      <td>
        <div class="actions">
          <button class="secondary" data-action="promote">Siguiente estado</button>
          <button class="secondary" data-action="delete">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function nextStatus(current) {
  const flow = ['draft', 'testing', 'ready', 'deprecated'];
  const index = flow.indexOf(current);
  if (index < 0) return 'draft';
  return flow[(index + 1) % flow.length];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function refresh() {
  state.rows = await listAll();
  state.rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  renderTable();
}

el.openModalBtn.addEventListener('click', () => el.componentModal.open());

el.componentForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    name: el.compName.value.trim(),
    type: el.compType.value,
    status: el.compStatus.value,
    notes: el.compNotes.value.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!payload.name) {
    showToast('El nombre es obligatorio');
    return;
  }

  await insertRow(payload);
  el.componentForm.reset();
  el.componentModal.close();
  await refresh();
  showToast('Componente guardado en IndexedDB');
});

el.componentsTable.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const rowEl = event.target.closest('tr[data-id]');
  if (!rowEl) return;

  const id = Number(rowEl.dataset.id);
  const current = state.rows.find((row) => row.id === id);
  if (!current) return;

  const action = button.dataset.action;

  if (action === 'delete') {
    await deleteRow(id);
    await refresh();
    showToast('Componente eliminado');
    return;
  }

  if (action === 'promote') {
    current.status = nextStatus(current.status);
    await updateRow(current);
    await refresh();
    showToast('Estado actualizado');
  }
});

el.statusFilter.addEventListener('change', () => {
  state.filterStatus = el.statusFilter.value;
  renderTable();
});

el.searchInput.addEventListener('input', () => {
  state.search = el.searchInput.value.trim();
  renderTable();
});

el.resetDbBtn.addEventListener('click', async () => {
  const ok = confirm('¿Seguro que quieres vaciar la base de datos local de componentes?');
  if (!ok) return;
  await clearStore();
  await refresh();
  showToast('Base de datos local reiniciada');
});

el.saveThemeBtn.addEventListener('click', () => {
  const current = loadTheme();
  applyTheme({
    ...current,
    accent: el.accentInput.value,
    bg: el.bgInput.value,
  });
  showToast('Tema guardado');
});

function bootTheme() {
  const theme = loadTheme();
  applyTheme(theme);
  if (theme.accent) el.accentInput.value = theme.accent;
  if (theme.bg) el.bgInput.value = theme.bg;
}

async function init() {
  bootTheme();
  initNousUI();
  state.filterStatus = el.statusFilter.value;
  await refresh();
}

init().catch((error) => {
  console.error(error);
  showToast(`Error al iniciar: ${error.message}`);
});
