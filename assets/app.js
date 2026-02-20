/**
 * NousUI Lab — app.js v2
 * SPA con IndexedDB CRUD, tabs declarativos, 4 KPIs, confirmación
 * personalizada, exportación JSON, dark mode y tema de 4 colores.
 */
import { applyTheme, initNousUI, loadTheme } from '../lib/nousui.js';

/* ─── Config ────────────────────────────────────────────────── */
const DB_NAME    = 'nousui_lab_db';
const DB_VERSION = 1;
const STORE      = 'components';

/* ─── DOM refs ──────────────────────────────────────────────── */
const el = {
  openModalBtn   : document.getElementById('openModalBtn'),
  exportBtn      : document.getElementById('exportBtn'),
  resetDbBtn     : document.getElementById('resetDbBtn'),
  statusFilter   : document.getElementById('statusFilter'),
  searchInput    : document.getElementById('searchInput'),
  componentsTable: document.getElementById('componentsTable'),
  emptyState     : document.getElementById('emptyState'),
  componentModal : document.getElementById('componentModal'),
  demoModal      : document.getElementById('demoModal'),
  componentForm  : document.getElementById('componentForm'),
  compName       : document.getElementById('compName'),
  compType       : document.getElementById('compType'),
  compStatus     : document.getElementById('compStatus'),
  compNotes      : document.getElementById('compNotes'),
  toast          : document.getElementById('toast'),
  /* KPIs */
  kpiTotal       : document.getElementById('kpiTotal'),
  kpiReady       : document.getElementById('kpiReady'),
  kpiTesting     : document.getElementById('kpiTesting'),
  kpiDraft       : document.getElementById('kpiDraft'),
  /* Theme */
  accentInput    : document.getElementById('accentInput'),
  bgInput        : document.getElementById('bgInput'),
  textInput      : document.getElementById('textInput'),
  panelInput     : document.getElementById('panelInput'),
  saveThemeBtn   : document.getElementById('saveThemeBtn'),
  resetThemeBtn  : document.getElementById('resetThemeBtn'),
  darkModeBtn    : document.getElementById('darkModeBtn'),
  /* Confirm overlay */
  confirmOverlay : document.getElementById('confirmOverlay'),
  confirmTitle   : document.getElementById('confirmTitle'),
  confirmMsg     : document.getElementById('confirmMsg'),
  confirmYes     : document.getElementById('confirmYes'),
  confirmNo      : document.getElementById('confirmNo'),
  /* Demo */
  demoModalBtn   : document.getElementById('demoModalBtn'),
  demoToastBtn   : document.getElementById('demoToastBtn'),
};

/* ─── State ─────────────────────────────────────────────────── */
const state = { rows: [], filterStatus: 'all', search: '' };

/* ═══════════════════════════════════════════════════════════════
   IndexedDB — Singleton con caché de conexión
   ═══════════════════════════════════════════════════════════════ */
let _dbCached = null;

function openDb() {
  if (_dbCached) return Promise.resolve(_dbCached);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        s.createIndex('status', 'status', { unique: false });
        s.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => { _dbCached = req.result; resolve(_dbCached); };
  });
}

async function dbAction(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onerror  = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

const listAll    = ()  => dbAction('readonly',  s => s.getAll());
const insertRow  = (p) => dbAction('readwrite', s => s.add(p));
const updateRow  = (p) => dbAction('readwrite', s => s.put(p));
const deleteRow  = (id) => dbAction('readwrite', s => s.delete(id));
const clearStore = ()  => dbAction('readwrite', s => s.clear());

/* ═══════════════════════════════════════════════════════════════
   Utilidades
   ═══════════════════════════════════════════════════════════════ */
function showToast(msg, tone = 'success') { el.toast.show(msg, tone); }

function formatDate(iso) {
  try { return new Date(iso).toLocaleString('es-ES'); }
  catch { return iso; }
}

function escapeHtml(v) {
  return String(v)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ─── Confirm personalizado (Promise) ──────────────────────── */
function nousConfirm(msg, title = 'Confirmación') {
  return new Promise(resolve => {
    el.confirmTitle.textContent = title;
    el.confirmMsg.textContent   = msg;
    el.confirmOverlay.hidden    = false;

    function cleanup(val) {
      el.confirmOverlay.hidden = true;
      el.confirmYes.removeEventListener('click', onYes);
      el.confirmNo.removeEventListener('click', onNo);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    }
    const onYes = () => cleanup(true);
    const onNo  = () => cleanup(false);
    const onKey = (e) => { if (e.key === 'Escape') cleanup(false); };
    el.confirmYes.addEventListener('click', onYes);
    el.confirmNo.addEventListener('click', onNo);
    document.addEventListener('keydown', onKey);
  });
}

/* ═══════════════════════════════════════════════════════════════
   Tabs declarativos
   ═══════════════════════════════════════════════════════════════ */
function initTabs() {
  const tabs     = document.querySelectorAll('.tab[data-tab]');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      contents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   Rendering
   ═══════════════════════════════════════════════════════════════ */
const TONES = { draft: 'warning', testing: 'info', ready: 'success', deprecated: 'danger' };
const LABELS = { draft: 'Borrador', testing: 'En pruebas', ready: 'Listo', deprecated: 'Deprecated' };

function statusBadge(status) {
  const tone  = TONES[status]  || 'neutral';
  const label = LABELS[status] || status;
  return `<nous-badge tone="${escapeHtml(tone)}">${escapeHtml(label)}</nous-badge>`;
}

function renderKPIs(rows) {
  el.kpiTotal.textContent   = rows.length;
  el.kpiReady.textContent   = rows.filter(r => r.status === 'ready').length;
  el.kpiTesting.textContent = rows.filter(r => r.status === 'testing').length;
  el.kpiDraft.textContent   = rows.filter(r => r.status === 'draft').length;
}

function filteredRows() {
  return state.rows
    .filter(r => state.filterStatus === 'all' || r.status === state.filterStatus)
    .filter(r => r.name.toLowerCase().includes(state.search.toLowerCase()));
}

function renderTable() {
  const rows = filteredRows();
  renderKPIs(state.rows);

  if (!rows.length) {
    el.componentsTable.innerHTML = '';
    el.emptyState.hidden = false;
    return;
  }
  el.emptyState.hidden = true;

  el.componentsTable.innerHTML = rows.map(row => `
    <tr data-id="${row.id}">
      <td><strong>${escapeHtml(row.name)}</strong></td>
      <td>${escapeHtml(row.type)}</td>
      <td>${statusBadge(row.status)}</td>
      <td>${escapeHtml(row.notes || '')}</td>
      <td>${formatDate(row.createdAt)}</td>
      <td>
        <div class="actions">
          <button class="secondary" data-action="promote">↑ Estado</button>
          <button class="secondary" data-action="delete">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function nextStatus(cur) {
  const flow = ['draft', 'testing', 'ready', 'deprecated'];
  const i = flow.indexOf(cur);
  return i < 0 ? 'draft' : flow[(i + 1) % flow.length];
}

async function refresh() {
  state.rows = await listAll();
  state.rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  renderTable();
}

/* ═══════════════════════════════════════════════════════════════
   Exportación JSON
   ═══════════════════════════════════════════════════════════════ */
function exportJSON() {
  const data = JSON.stringify(state.rows, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `nousui_components_${Date.now()}.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
  showToast('Archivo JSON exportado', 'info');
}

/* ═══════════════════════════════════════════════════════════════
   Dark mode
   ═══════════════════════════════════════════════════════════════ */
function initDarkMode() {
  const saved = localStorage.getItem('nous_dark');
  if (saved === 'true') document.body.classList.add('dark');
  el.darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('nous_dark', document.body.classList.contains('dark'));
  });
}

/* ═══════════════════════════════════════════════════════════════
   Theme
   ═══════════════════════════════════════════════════════════════ */
const DEFAULT_THEME = { accent: '#2a85ff', bg: '#f7f7f5', text: '#1e1e1e', panel: '#ffffff' };

function bootTheme() {
  const theme = { ...DEFAULT_THEME, ...loadTheme() };
  applyTheme(theme);
  el.accentInput.value = theme.accent || DEFAULT_THEME.accent;
  el.bgInput.value     = theme.bg     || DEFAULT_THEME.bg;
  el.textInput.value   = theme.text   || DEFAULT_THEME.text;
  el.panelInput.value  = theme.panel  || DEFAULT_THEME.panel;
}

el.saveThemeBtn.addEventListener('click', () => {
  applyTheme({
    accent: el.accentInput.value,
    bg:     el.bgInput.value,
    text:   el.textInput.value,
    panel:  el.panelInput.value,
  });
  showToast('Tema guardado', 'success');
});

el.resetThemeBtn.addEventListener('click', () => {
  applyTheme(DEFAULT_THEME);
  bootTheme();
  showToast('Tema restaurado a defaults', 'info');
});

/* ═══════════════════════════════════════════════════════════════
   Event listeners
   ═══════════════════════════════════════════════════════════════ */
el.openModalBtn.addEventListener('click', () => el.componentModal.open());
el.exportBtn.addEventListener('click', exportJSON);

el.componentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: el.compName.value.trim(),
    type: el.compType.value,
    status: el.compStatus.value,
    notes: el.compNotes.value.trim(),
    createdAt: new Date().toISOString(),
  };
  if (!payload.name) { showToast('El nombre es obligatorio', 'warning'); return; }
  await insertRow(payload);
  el.componentForm.reset();
  el.componentModal.close();
  await refresh();
  showToast('Componente guardado en IndexedDB');
});

el.componentsTable.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const row = e.target.closest('tr[data-id]');
  if (!row) return;
  const id = Number(row.dataset.id);
  const item = state.rows.find(r => r.id === id);
  if (!item) return;

  if (btn.dataset.action === 'delete') {
    const ok = await nousConfirm(`¿Eliminar "${item.name}"?`, 'Eliminar componente');
    if (!ok) return;
    await deleteRow(id);
    await refresh();
    showToast('Componente eliminado', 'danger');
    return;
  }

  if (btn.dataset.action === 'promote') {
    item.status = nextStatus(item.status);
    await updateRow(item);
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
  const ok = await nousConfirm('¿Vaciar la base de datos local de componentes?', 'Reset BD');
  if (!ok) return;
  await clearStore();
  await refresh();
  showToast('Base de datos reiniciada', 'info');
});

/* Demo buttons */
el.demoModalBtn?.addEventListener('click', () => el.demoModal.open());
el.demoToastBtn?.addEventListener('click', () => showToast('Toast de demostración 🎉', 'accent'));

/* ═══════════════════════════════════════════════════════════════
   Boot
   ═══════════════════════════════════════════════════════════════ */
async function init() {
  initNousUI();
  bootTheme();
  initDarkMode();
  initTabs();
  state.filterStatus = el.statusFilter.value;
  await refresh();
}

init().catch(err => {
  console.error(err);
  showToast(`Error al iniciar: ${err.message}`, 'danger');
});
