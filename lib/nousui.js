/* ══════════════════════════════════════════════
   NousUI — Librería de Web Components (v2)
   6 Custom Elements + SearchableSelect + Temas
   ══════════════════════════════════════════════ */

const THEME_KEY = 'nousui-theme';

function getThemeTokens() {
  return {
    accent: '#2a85ff',
    bg: '#f7f7f5',
    text: '#1e1e1e',
    panel: '#ffffff',
    muted: '#6b7280',
    border: '#e4e7eb',
    borderStrong: '#d9dde2',
  };
}

export function loadTheme() {
  const defaults = getThemeTokens();
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function applyTheme(tokens) {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([k, v]) => {
    const prop = k.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${prop}`, v);
  });
  localStorage.setItem(THEME_KEY, JSON.stringify(tokens));
}

/* ── 1. <nous-card> ── */
class NousCard extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const accent = this.getAttribute('accent') || 'var(--accent, #2a85ff)';
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:block; }
        article {
          position:relative; border:1px solid var(--border, #e4e7eb);
          background:var(--panel, #fff); border-radius:12px; padding:14px 14px 14px 18px;
          transition: box-shadow .2s, transform .2s; overflow:hidden;
        }
        article::before {
          content:''; position:absolute; left:0; top:0; bottom:0; width:4px;
          background:${accent}; border-radius:12px 0 0 12px;
        }
        article:hover { box-shadow:0 6px 16px rgba(0,0,0,.08); transform:translateY(-2px); }
        header { font-weight:600; margin-bottom:10px; color:var(--text, #2f3437); }
      </style>
      <article>
        <header><slot name="title"></slot></header>
        <section><slot></slot></section>
      </article>
    `;
  }
}

/* ── 2. <nous-badge> — 6 tonos ── */
class NousBadge extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const tone = this.getAttribute('tone') || 'neutral';
    const palette = {
      neutral: ['#e8e8e8', '#555', '#d5d5d5'],
      success: ['#dff5e3', '#1b7d36', '#bbf7d0'],
      warning: ['#fff3cd', '#856404', '#fde68a'],
      danger:  ['#fde2e2', '#c0392b', '#fecaca'],
      info:    ['#d0e7ff', '#1a5fb4', '#93c5fd'],
      accent:  ['#d9ebff', '#2a85ff', '#93c5fd'],
    };
    const [bg, fg, border] = palette[tone] || palette.neutral;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        span {
          display:inline-flex; align-items:center; gap:6px;
          padding:2px 9px; border-radius:999px; font-size:.75rem; font-weight:600;
          background:${bg}; color:${fg}; border:1px solid ${border};
        }
        span::before {
          content:''; width:6px; height:6px; border-radius:50%; background:${fg};
        }
      </style>
      <span><slot></slot></span>
    `;
  }
}

/* ── 3. <nous-modal> — backdrop blur + ESC ── */
class NousModal extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:none; position:fixed; inset:0; z-index:9999; }
        :host([open]) { display:block; }
        .backdrop {
          position:absolute; inset:0;
          background:rgba(15,23,42,.28); backdrop-filter:blur(4px);
        }
        .panel {
          position:relative; max-width:560px; margin:8vh auto 0;
          background:var(--panel, #fff); border:1px solid var(--border, #e5e7eb);
          border-radius:14px; padding:16px;
          box-shadow:0 18px 40px rgba(15,23,42,.14);
          animation:slideUp .25s ease;
        }
        .top { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .title { font-weight:700; color:var(--text, #2f3437); }
        .close {
          border:1px solid var(--border-strong, #d7dbe0); background:var(--panel, #fff);
          border-radius:10px; cursor:pointer; padding:6px 10px; color:var(--text, #2f3437);
          transition:background .15s;
        }
        .close:hover { background:var(--bg, #f8f8f7); }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(12px); }
          to { opacity:1; transform:translateY(0); }
        }
      </style>
      <div class="backdrop" part="backdrop"></div>
      <section class="panel" part="panel">
        <div class="top">
          <div class="title"><slot name="title">Modal</slot></div>
          <button class="close" type="button">✕</button>
        </div>
        <div class="body"><slot></slot></div>
      </section>
    `;

    shadow.querySelector('.backdrop').addEventListener('click', () => this.close());
    shadow.querySelector('.close').addEventListener('click', () => this.close());
    this._onKey = (e) => { if (e.key === 'Escape' && this.hasAttribute('open')) this.close(); };
    document.addEventListener('keydown', this._onKey);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKey);
  }

  open() {
    this.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.removeAttribute('open');
    document.body.style.overflow = '';
  }
}

/* ── 4. <nous-toast> — 4 tonos + iconos ── */
class NousToast extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { position:fixed; right:16px; bottom:16px; z-index:10000; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
        .toast {
          display:flex; align-items:center; gap:8px;
          border-radius:10px; padding:10px 16px; font-size:.88rem; font-weight:500;
          color:#fff; pointer-events:auto;
          box-shadow:0 8px 20px rgba(0,0,0,.16);
          animation:slideUp .3s ease;
        }
        .toast.fadeOut { animation:fadeOut .4s ease forwards; }
        .icon { font-size:1.1rem; }
        .success { background:#16a34a; }
        .error   { background:#dc2626; }
        .info    { background:#2563eb; }
        .warning { background:#d97706; }
        .default { background:#2f3437; border:1px solid #1f2326; }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeOut { to { opacity:0; transform:translateY(-6px); } }
      </style>
      <div id="container"></div>
    `;
    this._container = shadow.getElementById('container');
  }

  show(message, opts = {}) {
    const tone = opts.tone || 'default';
    const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠', default: '' };
    const div = document.createElement('div');
    div.className = `toast ${tone}`;
    const icon = icons[tone] || '';
    div.innerHTML = (icon ? `<span class="icon">${icon}</span> ` : '') + this._esc(message);
    this._container.appendChild(div);
    setTimeout(() => {
      div.classList.add('fadeOut');
      div.addEventListener('animationend', () => div.remove());
    }, opts.timeout || 3000);
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

/* ── 5. <nous-progress> — barra accesible con 5 tonos ── */
class NousProgress extends HTMLElement {
  static get observedAttributes() { return ['value', 'tone']; }

  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:block; }
        .track {
          position:relative; height:22px; border-radius:10px; overflow:hidden;
          background:var(--bg, #f3f4f6); border:1px solid var(--border, #e4e7eb);
        }
        .fill {
          height:100%; border-radius:10px; transition:width .4s ease;
          display:flex; align-items:center; justify-content:center;
          font-size:.72rem; font-weight:700; color:#fff; min-width:28px;
        }
        .accent  { background:var(--accent, #2a85ff); }
        .success { background:#22c55e; }
        .warning { background:#f59e0b; }
        .danger  { background:#ef4444; }
        .neutral { background:#6b7280; }
      </style>
      <div class="track" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div class="fill accent" id="fill" style="width:0%"></div>
      </div>
    `;
    this._fill = shadow.getElementById('fill');
    this._track = shadow.querySelector('.track');
    this._update();
  }

  attributeChangedCallback() { this._update(); }

  _update() {
    if (!this._fill) return;
    const val = Math.max(0, Math.min(100, parseInt(this.getAttribute('value') || '0')));
    const tone = this.getAttribute('tone') || 'accent';
    this._fill.style.width = val + '%';
    this._fill.className = 'fill ' + tone;
    this._fill.textContent = val + '%';
    this._track.setAttribute('aria-valuenow', val);
  }
}

/* ── 6. <nous-tooltip> — hover flotante con flecha ── */
class NousTooltip extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const text = this.getAttribute('text') || '';
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { position:relative; display:inline-block; }
        .tip {
          position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);
          background:#1f2937; color:#fff; font-size:.78rem; padding:5px 10px;
          border-radius:8px; white-space:nowrap; pointer-events:none;
          opacity:0; transition:opacity .2s;
        }
        .tip::after {
          content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%);
          border:5px solid transparent; border-top-color:#1f2937;
        }
        :host(:hover) .tip { opacity:1; }
      </style>
      <div class="tip">${text}</div>
      <slot></slot>
    `;
  }
}

/* ── SearchableSelect ── */
export class SearchableSelect {
  constructor(selectEl, options = {}) {
    if (!selectEl || selectEl.tagName !== 'SELECT') {
      throw new Error('SearchableSelect requiere un <select> válido');
    }
    this.select = selectEl;
    this.options = { placeholder: 'Filtrar opciones...', minChars: 0, ...options };
    this.activeIndex = -1;
    this.setup();
    this.bind();
  }

  setup() {
    this.root = document.createElement('div');
    this.root.className = 'nous-search';
    this.select.parentNode.insertBefore(this.root, this.select);
    this.root.appendChild(this.select);
    this.select.classList.add('nous-search-native');

    this.input = document.createElement('input');
    this.input.type = 'search';
    this.input.className = 'nous-search-input';
    this.input.placeholder = this.options.placeholder;
    this.root.appendChild(this.input);

    this.panel = document.createElement('div');
    this.panel.className = 'nous-search-panel';
    this.root.appendChild(this.panel);

    this.allItems = Array.from(this.select.options).map((opt) => ({
      text: opt.text.trim(),
      value: opt.value,
    }));
    this.render(this.allItems);
  }

  bind() {
    this.input.addEventListener('input', () => this.filter());
    this.input.addEventListener('focus', () => this.root.classList.add('open'));
    document.addEventListener('click', (e) => {
      if (!this.root.contains(e.target)) this.root.classList.remove('open');
    });
    this.input.addEventListener('keydown', (e) => this.onKey(e));
  }

  onKey(e) {
    const items = Array.from(this.panel.querySelectorAll('.nous-search-item'));
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % items.length;
      this.mark(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
      this.mark(items);
    } else if (e.key === 'Enter' && this.activeIndex >= 0) {
      e.preventDefault();
      items[this.activeIndex].click();
    } else if (e.key === 'Escape') {
      this.root.classList.remove('open');
    }
  }

  mark(items) {
    items.forEach((el, i) => el.setAttribute('aria-selected', i === this.activeIndex ? 'true' : 'false'));
    if (this.activeIndex >= 0) items[this.activeIndex].scrollIntoView({ block: 'nearest' });
  }

  filter() {
    const q = this.input.value.trim().toLowerCase();
    const list = q.length < this.options.minChars
      ? this.allItems
      : this.allItems.filter((r) => r.text.toLowerCase().includes(q));
    this.activeIndex = -1;
    this.render(list);
    this.root.classList.add('open');
  }

  render(items) {
    this.panel.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'nous-search-empty';
      empty.textContent = 'Sin resultados';
      this.panel.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'nous-search-item';
      row.textContent = item.text;
      row.addEventListener('click', () => {
        this.select.value = item.value;
        this.select.dispatchEvent(new Event('change', { bubbles: true }));
        this.input.value = item.text;
        this.root.classList.remove('open');
      });
      this.panel.appendChild(row);
    });
  }
}

/* ── Bootstrap ── */
export function initNousUI() {
  customElements.define('nous-card', NousCard);
  customElements.define('nous-badge', NousBadge);
  customElements.define('nous-modal', NousModal);
  customElements.define('nous-toast', NousToast);
  customElements.define('nous-progress', NousProgress);
  customElements.define('nous-tooltip', NousTooltip);

  document.querySelectorAll('select[data-nous="searchable"]').forEach((sel) => {
    if (!sel.__nousSearchable) sel.__nousSearchable = new SearchableSelect(sel);
  });
}
