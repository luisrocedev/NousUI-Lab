# NousUI-Lab — Plantilla de Examen

**Alumno:** Luis Rodríguez Cedeño · **DNI:** 53945291X  
**Módulo:** Desarrollo de Interfaces · **Curso:** DAM2 2025/26

---

## 1. Introducción

- **Qué es:** Librería de 6 Web Components personalizados + demo CRUD con IndexedDB + editor de temas
- **Contexto:** Módulo de Desarrollo de Interfaces — componentes reutilizables, Shadow DOM, CSS custom properties
- **Objetivos principales:**
  - 6 Web Components: Card, Badge, Modal, Toast, Progress, Tooltip + SearchableSelect
  - Demo CRUD completa sobre IndexedDB (create, read, update, delete)
  - Editor de temas en vivo (CSS custom properties + localStorage)
  - Dark mode, tabs, toasts, custom confirm, KPIs, export/import JSON
- **Tecnologías clave:**
  - JavaScript vanilla, Custom Elements API, Shadow DOM, HTML templates
  - CSS Custom Properties (variables), IndexedDB, localStorage
- **Arquitectura:** `lib/nousui.js` (librería de componentes) → `assets/app.js` (demo/CRUD/temas) → `assets/styles.css` (Notion-inspired CSS) → `index.html` (SPA con tabs)

---

## 2. Desarrollo de las partes

### 2.1 Web Components con Shadow DOM

- `customElements.define()` → registra elemento personalizado
- `attachShadow({mode:'open'})` → encapsula estilos y markup
- `<slot>` → proyección de contenido externo al componente

```javascript
class NousCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    const accent = this.getAttribute("accent") || "var(--primary, #4b5563)";
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; border-radius: 12px; background: var(--card-bg, #fff);
                box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow: hidden; }
        .accent { height: 4px; background: ${accent}; }
        .body { padding: 20px; }
      </style>
      <div class="accent"></div>
      <div class="body"><slot></slot></div>
    `;
  }
}
customElements.define("nous-card", NousCard);
```

> **Explicación:** `NousCard` encapsula su HTML/CSS en Shadow DOM. La barra de color superior se configura con el atributo `accent`. `<slot>` permite inyectar contenido externo dentro del componente.

### 2.2 NousToast — Notificaciones animadas

- 4 tonos: success, error, info, warning
- Animación CSS fadeOut + auto-remove tras 3.5s
- Posicionamiento fijo abajo a la derecha

```javascript
class NousToast extends HTMLElement {
  connectedCallback() {
    const tone = this.getAttribute("tone") || "info";
    const colors = {
      success: "#22c55e",
      error: "#ef4444",
      info: "#3b82f6",
      warning: "#f59e0b",
    };
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: flex; align-items: center; gap: 10px; padding: 12px 18px;
                border-radius: 10px; border-left: 4px solid ${colors[tone]};
                background: var(--card-bg, #fff); animation: fadeOut .4s 3s forwards; }
        @keyframes fadeOut { to { opacity: 0; transform: translateX(30px); } }
      </style>
      <span>${icons[tone]}</span><slot></slot>
    `;
    setTimeout(() => this.remove(), 3500);
  }
}
customElements.define("nous-toast", NousToast);
```

> **Explicación:** Se auto-destruye a los 3.5 segundos. La animación `fadeOut` desplaza el toast hacia la derecha con opacidad 0. El tono determina el color del borde izquierdo y el icono.

### 2.3 NousProgress — Barra de progreso accesible

- Atributos: `value`, `max`, `tone` (5 colores), `label`
- `observedAttributes` → reacciona a cambios dinámicos
- ARIA: `role="progressbar"`, `aria-valuenow`, `aria-valuemax`

```javascript
class NousProgress extends HTMLElement {
  static get observedAttributes() {
    return ["value", "max", "tone", "label"];
  }

  attributeChangedCallback() {
    this._render();
  }
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this._render();
  }

  _render() {
    const value = Number(this.getAttribute("value") || 0);
    const max = Number(this.getAttribute("max") || 100);
    const pct = Math.min(100, (value / max) * 100);
    // ... renderiza barra con width: pct%
    this.setAttribute("role", "progressbar");
    this.setAttribute("aria-valuenow", value);
    this.setAttribute("aria-valuemax", max);
  }
}
customElements.define("nous-progress", NousProgress);
```

> **Explicación:** `observedAttributes` y `attributeChangedCallback` permiten que el componente se re-renderice al cambiar `value`. Incluye atributos ARIA para accesibilidad (lectores de pantalla).

### 2.4 IndexedDB CRUD — Patrón singleton

- `openDb()` → abre/crea la BD con objectStore e índices
- `dbAction(mode, callback)` → wrapper reutilizable para transacciones
- CRUD: `addItem()`, `updateItem()`, `deleteItem()`, `getAllItems()`

```javascript
const DB_NAME = "nousui_demo_db";
const DB_VERSION = 1;
const STORE = "items";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        s.createIndex("category", "category", { unique: false });
        s.createIndex("status", "status", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbAction(mode, cb) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const r = cb(store);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    tx.oncomplete = () => db.close();
  });
}
```

> **Explicación:** `openDb()` crea la BD con su objectStore e índices en `onupgradeneeded`. `dbAction()` abstrae la transacción: abre, ejecuta el callback en el store, y devuelve una Promise. Se cierra al completar.

### 2.5 Editor de temas con CSS Custom Properties

- Variables CSS: `--primary`, `--bg`, `--card-bg`, `--text`, `--radius`, etc.
- `applyTheme()` → aplica variables al `document.documentElement.style`
- Guardado en localStorage para persistencia

```javascript
function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--card-bg", theme.cardBg);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--radius", theme.radius + "px");
  localStorage.setItem("nousui-theme", JSON.stringify(theme));
}

function loadTheme() {
  const saved = localStorage.getItem("nousui-theme");
  if (saved) applyTheme(JSON.parse(saved));
}
```

> **Explicación:** Las CSS Custom Properties permiten tematizar toda la app cambiando variables en `:root`. El editor modifica estas variables en tiempo real. Se persiste en localStorage para mantener el tema entre sesiones.

---

## 3. Presentación del proyecto

- **Flujo:** Abrir index.html → Ver componentes en showcase → CRUD en pestaña Items → Editar tema → Export/Import
- **Puntos fuertes:** Shadow DOM encapsula estilos, componentes reutilizables, tema editable en vivo
- **Demo:** Abrir con Live Server → pestaña Items → añadir/editar/eliminar → cambiar tema → exportar JSON
- **7 componentes:** Card, Badge, Modal, Toast, Progress, Tooltip, SearchableSelect

---

## 4. Conclusión

- **Competencias:** Web Components, Shadow DOM, Custom Elements API, IndexedDB, CSS Custom Properties
- **Encapsulación:** Shadow DOM aísla estilos y markup del componente del DOM global
- **Accesibilidad:** ARIA attributes en Progress y Modal, ESC para cerrar Modal
- **Reutilización:** `<nous-card>`, `<nous-toast>`, etc. se usan como tags HTML nativos en cualquier proyecto
- **Valoración:** Librería profesional de componentes web con demo interactiva y persistencia local
