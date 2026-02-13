const THEME_KEY = 'nousui-theme';

function getThemeTokens() {
  return {
    bg: '#f6f6f4',
    panel: '#ffffff',
    text: '#2f3437',
    muted: '#6b7280',
    border: '#e4e7eb',
    accent: '#2f3437',
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
    root.style.setProperty(`--${k}`, v);
  });
  localStorage.setItem(THEME_KEY, JSON.stringify(tokens));
}

class NousCard extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:block; }
        article { border:1px solid var(--border, #e4e7eb); background: var(--panel,#fff); border-radius:12px; padding:14px; }
        header { font-weight:600; margin-bottom:10px; color: var(--text,#2f3437); }
      </style>
      <article>
        <header><slot name="title"></slot></header>
        <section><slot></slot></section>
      </article>
    `;
  }
}

class NousBadge extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const tone = this.getAttribute('tone') || 'neutral';
    const palette = {
      neutral: ['#f3f4f6', '#374151', '#e5e7eb'],
      success: ['#ecfdf3', '#166534', '#bbf7d0'],
      warning: ['#fffbeb', '#92400e', '#fde68a'],
      danger: ['#fef2f2', '#991b1b', '#fecaca'],
    };
    const [bg, fg, border] = palette[tone] || palette.neutral;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        span { display:inline-flex; align-items:center; gap:6px; padding:2px 9px; border-radius:999px; font-size:.75rem; font-weight:600; background:${bg}; color:${fg}; border:1px solid ${border}; }
      </style>
      <span><slot></slot></span>
    `;
  }
}

class NousModal extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:none; position:fixed; inset:0; z-index:9999; }
        :host([open]) { display:block; }
        .backdrop { position:absolute; inset:0; background: rgba(15,23,42,.28); }
        .panel { position:relative; max-width:560px; margin:8vh auto 0; background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:16px; box-shadow: 0 18px 40px rgba(15,23,42,.14); }
        .top { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .title { font-weight:700; }
        .close { border:1px solid #d7dbe0; background:#fff; border-radius:10px; cursor:pointer; padding:6px 10px; color:#2f3437; }
        .close:hover { background:#f8f8f7; }
      </style>
      <div class="backdrop" part="backdrop"></div>
      <section class="panel" part="panel">
        <div class="top">
          <div class="title"><slot name="title">Modal</slot></div>
          <button class="close" type="button">Cerrar</button>
        </div>
        <div class="body"><slot></slot></div>
      </section>
    `;

    shadow.querySelector('.backdrop').addEventListener('click', () => this.close());
    shadow.querySelector('.close').addEventListener('click', () => this.close());
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }
}

class NousToast extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { position:fixed; right:16px; bottom:16px; z-index:10000; display:none; }
        :host([show]) { display:block; }
        .toast { background:#2f3437; color:#fff; border-radius:10px; padding:10px 12px; font-size:.9rem; border:1px solid #1f2326; box-shadow:0 10px 20px rgba(0,0,0,.16); }
      </style>
      <div class="toast"><slot></slot></div>
    `;
  }

  show(message, timeout = 2400) {
    this.textContent = message;
    this.setAttribute('show', '');
    clearTimeout(this.__t);
    this.__t = setTimeout(() => this.removeAttribute('show'), timeout);
  }
}

export class SearchableSelect {
  constructor(selectEl, options = {}) {
    if (!selectEl || selectEl.tagName !== 'SELECT') {
      throw new Error('SearchableSelect requiere un <select> válido');
    }

    this.select = selectEl;
    this.options = {
      placeholder: 'Filtrar opciones...',
      minChars: 0,
      ...options,
    };
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

    this.allItems = Array.from(this.select.options).map((option) => ({
      text: option.text.trim(),
      value: option.value,
    }));

    this.render(this.allItems);
  }

  bind() {
    this.input.addEventListener('input', () => this.filter());
    this.input.addEventListener('focus', () => this.root.classList.add('open'));
    document.addEventListener('click', (event) => {
      if (!this.root.contains(event.target)) {
        this.root.classList.remove('open');
      }
    });

    this.input.addEventListener('keydown', (event) => this.onKey(event));
  }

  onKey(event) {
    const items = Array.from(this.panel.querySelectorAll('.nous-search-item'));
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % items.length;
      this.mark(items);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
      this.mark(items);
    } else if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      items[this.activeIndex].click();
    } else if (event.key === 'Escape') {
      this.root.classList.remove('open');
    }
  }

  mark(items) {
    items.forEach((element, idx) => {
      element.setAttribute('aria-selected', idx === this.activeIndex ? 'true' : 'false');
    });
    if (this.activeIndex >= 0) {
      items[this.activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  filter() {
    const query = this.input.value.trim().toLowerCase();
    const list = query.length < this.options.minChars
      ? this.allItems
      : this.allItems.filter((row) => row.text.toLowerCase().includes(query));

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

export function initNousUI() {
  customElements.define('nous-card', NousCard);
  customElements.define('nous-badge', NousBadge);
  customElements.define('nous-modal', NousModal);
  customElements.define('nous-toast', NousToast);

  document.querySelectorAll('select[data-nous="searchable"]').forEach((select) => {
    if (!select.__nousSearchable) {
      select.__nousSearchable = new SearchableSelect(select);
    }
  });
}
