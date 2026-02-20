# Actividad: Biblioteca de interfaz personalizada con Custom Elements y Shadow DOM

| Campo              | Valor                                          |
|--------------------|------------------------------------------------|
| **Alumno**         | Luis Adolfo Roces Dávila — 53945291X           |
| **Ciclo**          | DAM2 — Desarrollo de Aplicaciones Multiplataforma |
| **Módulo**         | Desarrollo de Interfaces                       |
| **Proyecto**       | NousUI Lab                                     |
| **Repositorio**    | <https://github.com/luisrocedev/NousUI-Lab>    |
| **Fecha de entrega** | 2025                                         |

---

## 1. Introducción

**NousUI Lab** es una librería gráfica personalizada construida desde cero con **Web Components** (Custom Elements v1 + Shadow DOM), **CSS Custom Properties** y una SPA de demostración que utiliza **IndexedDB** como persistencia local. El proyecto demuestra la capacidad de diseñar, encapsular y distribuir componentes de interfaz reutilizables sin depender de frameworks externos.

### Objetivos didácticos

- Dominar la API de Custom Elements y Shadow DOM.
- Aplicar CSS Custom Properties para crear un sistema de diseño (design tokens) con temas dinámicos.
- Utilizar IndexedDB como almacén local para operaciones CRUD completas.
- Diseñar una SPA funcional con navegación declarativa por tabs.
- Desarrollar un catálogo visual interactivo de componentes.

---

## 2. Arquitectura del proyecto

```
NousUI-Lab/
├── index.html          ← SPA demo con tabs, KPIs, catálogo y CRUD
├── assets/
│   ├── app.js          ← Lógica: CRUD IndexedDB, tabs, temas, dark mode, export
│   └── styles.css      ← Design system: dark mode, animaciones, responsive
├── lib/
│   └── nousui.js       ← Librería: 6 Custom Elements + SearchableSelect + theme utils
└── README.md
```

### Flujo de datos

```
index.html  →  import app.js  →  import nousui.js
                                    ├── initNousUI() → registra 6 Custom Elements
                                    ├── applyTheme() → CSS vars + localStorage
                                    └── SearchableSelect → mejora <select>
                   ↓
            IndexedDB (nousui_lab_db / components)
```

---

## 3. Componentes de la librería (`lib/nousui.js`)

### 3.1 `<nous-card>`

Tarjeta contenedora con **Shadow DOM**, barra de acento configurable (`accent`), hover con elevación y slots para título y contenido.

```html
<nous-card accent="#2a85ff">
  <span slot="title">Título</span>
  <p>Contenido encapsulado en Shadow DOM.</p>
</nous-card>
```

**Características:**
- Atributo `accent` inyecta estilo `::before` con color de barra superior.
- `observedAttributes` permite reactividad al cambiar el acento dinámicamente.
- Hover: `translateY(-3px)` + sombra `0 8px 20px`.

### 3.2 `<nous-badge>`

Indicador visual inline con **6 tonos cromáticos**: `neutral`, `success`, `warning`, `danger`, `info`, `accent`.

```html
<nous-badge tone="success">Listo</nous-badge>
```

**Características:**
- Punto indicador `::before` (dot) con color correspondiente al tono.
- Paleta mapeada internamente: cada tono asigna `background`, `color` y `dotColor`.
- Shadow DOM con fuente heredada vía `:host`.

### 3.3 `<nous-modal>`

Diálogo modal con backdrop blur, animación `slideUp`, cierre por clic en overlay, botón × y tecla `Escape`.

```html
<nous-modal id="myModal">
  <span slot="title">Título del diálogo</span>
  <p>Contenido del panel.</p>
</nous-modal>
```

**API programática:**
- `.open()` — Muestra el modal, bloquea `body` con `overflow: hidden`.
- `.close()` — Oculta el modal, restaura el overflow del body.
- Listener `keydown Escape` se registra al abrir y se elimina al cerrar (sin memory leaks).

### 3.4 `<nous-toast>`

Notificación efímera con 4 tonos (`success`, `danger`, `warning`, `info`, `accent`) e iconos automáticos SVG.

```js
document.getElementById('toast').show('Guardado correctamente', 'success');
```

**Características:**
- Paleta: fondo, color de texto e icono SVG por tono.
- Animación `fadeIn 0.3s` + `fadeOut 0.3s` antes de ocultar.
- Duración configurable (default 2800 ms).

### 3.5 `<nous-progress>`

Barra de progreso con valor numérico (0-100), 5 tonos (`success`, `warning`, `danger`, `info`, `accent`) y ARIA progressbar.

```html
<nous-progress value="73" tone="accent"></nous-progress>
```

**Características:**
- Valor renderizado como texto porcentual superpuesto.
- Animación de anchura con `transition: width 0.5s ease`.
- Atributos ARIA: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

### 3.6 `<nous-tooltip>`

Tooltip flotante con flecha CSS que aparece al hacer hover sobre el elemento hijo.

```html
<nous-tooltip text="Información útil">
  <button>Hover aquí</button>
</nous-tooltip>
```

**Características:**
- Posicionamiento absoluto encima del slot con `bottom: 120%`.
- Flecha CSS generada con `::after` (triángulo invertido).
- Transición `opacity 0.2s` + `transform translateY(-4px)`.

### 3.7 `SearchableSelect`

Clase utilitaria que reemplaza `<select data-nous="searchable">` por un input con panel desplegable de búsqueda en tiempo real.

**Características:**
- Filtra opciones por `includes()` (case-insensitive).
- Navegación por teclado: `ArrowUp`, `ArrowDown`, `Enter`, `Escape`.
- Cierre al hacer clic fuera (`document.click`).
- Sincroniza valor con el `<select>` nativo oculto (accesibilidad de formularios).

---

## 4. Sistema de temas

### 4.1 Design tokens (CSS Custom Properties)

| Token       | Default (light) | Descripción              |
|-------------|-----------------|--------------------------|
| `--accent`  | `#2a85ff`       | Color de énfasis/acento  |
| `--bg`      | `#f7f7f5`       | Fondo general            |
| `--text`    | `#1e1e1e`       | Color de texto principal  |
| `--panel`   | `#ffffff`       | Fondo de paneles/cards   |

### 4.2 Funciones de tema

- **`applyTheme(obj)`** — Convierte claves camelCase a `--kebab-case`, inyecta en `document.documentElement.style` y persiste en `localStorage`.
- **`loadTheme()`** — Recupera el objeto de tema guardado en `localStorage`.

### 4.3 Editor interactivo (tab Tema)

4 inputs `type="color"` conectados a `accent`, `bg`, `text` y `panel`. Botones "Guardar tema" y "Resetear a defaults".

### 4.4 Dark mode

- CSS: `@media (prefers-color-scheme: dark)` + clase `.dark` en `<body>`.
- JS: Toggle con botón 🌓, estado persistido en `localStorage('nous_dark')`.

---

## 5. SPA de demostración

### 5.1 Navegación por tabs

3 tabs declarativos con ARIA roles (`tablist`, `tab`, `aria-selected`):

| Tab           | Contenido                                                |
|---------------|----------------------------------------------------------|
| Componentes   | KPIs, filtros, tabla CRUD, catálogo preview grid         |
| Insignias     | Catálogo de 6 tonos de badge, progress, tooltip          |
| Tema          | Editor de 4 colores, guardar/resetear, info de tokens    |

### 5.2 KPIs

4 indicadores en tiempo real:

| KPI         | Color       | Fuente                         |
|-------------|-------------|--------------------------------|
| Total       | `--accent`  | `rows.length`                  |
| Listos      | `#22c55e`   | `status === 'ready'`           |
| En pruebas  | `#3b82f6`   | `status === 'testing'`         |
| Borradores  | `#f59e0b`   | `status === 'draft'`           |

### 5.3 CRUD con IndexedDB

| Operación | Función       | Descripción                              |
|-----------|---------------|------------------------------------------|
| Create    | `insertRow()` | Añade componente con timestamp ISO       |
| Read      | `listAll()`   | Recupera todos los registros             |
| Update    | `updateRow()` | Promueve estado (draft→testing→ready→deprecated) |
| Delete    | `deleteRow()` | Elimina tras confirmación personalizada  |
| Clear     | `clearStore()` | Vacía toda la BD tras confirmación      |

**Singleton de conexión:** La conexión a IndexedDB se cachea en `_dbCached` para evitar abrir/cerrar la BD en cada operación.

### 5.4 Confirmación personalizada

Función `nousConfirm(msg, title)` que devuelve una **Promise<boolean>**:

- Muestra overlay con `backdrop-filter: blur(4px)`.
- Botones "Confirmar" y "Cancelar".
- Cierre por `Escape`.
- Reemplaza todos los `window.confirm()` nativos.

### 5.5 Exportación JSON

Botón "Exportar JSON" genera un archivo descargable `nousui_components_{timestamp}.json` con todos los componentes almacenados.

### 5.6 Catálogo preview grid

Grid responsive (`auto-fill, minmax(260px, 1fr)`) con demos en vivo de los 6 componentes: Card, Badge, Modal, Toast, Progress y Tooltip.

---

## 6. Estilos y diseño (`assets/styles.css`)

### 6.1 Filosofía de diseño

- **Mobile-first** con breakpoints a 600px y 960px.
- **Sin colores hardcoded**: todos los valores usan CSS Custom Properties.
- **Transiciones suaves**: `.18s ease` en interacciones, `fadeIn` y `slideUp` para entradas.
- **Tipografía**: Inter (Google Fonts) con pesos 400-700.

### 6.2 Componentes CSS principales

| Selector           | Descripción                                         |
|--------------------|-----------------------------------------------------|
| `.tabs`            | Barra de navegación con pills activas               |
| `.kpi-bar`         | Grid de 4 columnas para indicadores                 |
| `.preview-grid`    | Grid responsive para catálogo de componentes         |
| `.confirm-overlay` | Overlay con blur + dialog centrado                   |
| `.footer`          | Pie de página con separador superior                 |
| `body.dark`        | Override de custom properties para modo oscuro        |

### 6.3 Responsive

| Breakpoint | Cambios                                              |
|------------|------------------------------------------------------|
| ≤ 960px    | Preview grid 2 cols, KPIs 2 cols, row 1 col          |
| ≤ 600px    | Todo 1 col, tabs wrap, header vertical                |

---

## 7. Tecnologías utilizadas

| Tecnología               | Uso                                              |
|--------------------------|--------------------------------------------------|
| Custom Elements v1       | Definición de los 6 componentes web               |
| Shadow DOM               | Encapsulación de estilos y markup                 |
| CSS Custom Properties    | Sistema de diseño con tokens dinámicos            |
| IndexedDB                | Persistencia local CRUD                           |
| ES Modules               | Organización modular con import/export            |
| localStorage             | Persistencia de tema y preferencia dark mode       |
| Google Fonts (Inter)     | Tipografía del design system                      |
| ARIA roles               | Accesibilidad en tabs, progress, modal            |

---

## 8. Instrucciones de uso

### 8.1 Requisitos

- Navegador moderno (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+).
- Servidor local para ES Modules (MAMP, Live Server, `python -m http.server`).

### 8.2 Ejecución

```bash
git clone https://github.com/luisrocedev/NousUI-Lab.git
cd NousUI-Lab
# Abrir con Live Server o:
python3 -m http.server 8000
# Navegar a http://localhost:8000
```

### 8.3 Uso de la librería en otros proyectos

```html
<script type="module">
  import { initNousUI, applyTheme } from './lib/nousui.js';
  initNousUI();
  applyTheme({ accent: '#e63946', bg: '#f1faee' });
</script>

<nous-card accent="#e63946">
  <span slot="title">Mi componente</span>
  <nous-badge tone="success">Activo</nous-badge>
  <nous-progress value="80" tone="success"></nous-progress>
</nous-card>
```

---

## 9. Capturas de pantalla

> Las capturas se incluyen en la presentación del proyecto.

| Vista               | Descripción                                    |
|---------------------|------------------------------------------------|
| Tab Componentes     | KPIs + tabla CRUD + catálogo preview grid       |
| Tab Insignias       | 6 tonos de badge + progress + tooltip           |
| Tab Tema            | Editor de 4 colores + modo oscuro               |
| Modal               | Diálogo con blur y slide-up                     |
| Confirm             | Overlay personalizado con Promise               |
| Dark mode           | Interfaz completa en modo oscuro                |
| Responsive          | Vista mobile ≤ 600px                            |

---

## 10. Conclusiones

NousUI Lab demuestra que es posible construir un **design system completo** utilizando exclusivamente APIs nativas del navegador. Los 6 Web Components con Shadow DOM garantizan encapsulación real, el sistema de temas con CSS Custom Properties permite personalización dinámica, e IndexedDB proporciona persistencia robusta sin backend.

La SPA de demostración integra todas las piezas en una experiencia cohesiva con tabs declarativos, KPIs en tiempo real, catálogo interactivo, exportación de datos y un editor visual de tema con dark mode — todo ello sin ninguna dependencia externa.

---

## Anexo A — Custom Elements registrados

| Tag                | Clase              | Shadow DOM | Slots          |
|--------------------|--------------------|------------|----------------|
| `<nous-card>`      | `NousCard`         | ✅          | title, default |
| `<nous-badge>`     | `NousBadge`        | ✅          | default        |
| `<nous-modal>`     | `NousModal`        | ✅          | title, default |
| `<nous-toast>`     | `NousToast`        | ✅          | —              |
| `<nous-progress>`  | `NousProgress`     | ✅          | —              |
| `<nous-tooltip>`   | `NousTooltip`      | ✅          | default        |

## Anexo B — Schema IndexedDB

```
Database: nousui_lab_db (v1)
└── ObjectStore: components
    ├── keyPath: id (autoIncrement)
    ├── Index: status
    ├── Index: createdAt
    └── Fields: name, type, status, notes, createdAt
```

## Anexo C — Funciones exportadas de `nousui.js`

| Función            | Descripción                                      |
|--------------------|--------------------------------------------------|
| `initNousUI()`     | Registra los 6 Custom Elements                   |
| `applyTheme(obj)`  | Aplica y persiste un objeto de tema               |
| `loadTheme()`      | Recupera el tema guardado en localStorage         |
| `SearchableSelect` | Clase para upgrade de `<select>` a buscable       |
