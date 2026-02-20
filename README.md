<div align="center">

# NousUI Lab

**Librería de Web Components personalizada con demo CRUD, temas dinámicos e IndexedDB**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/ES_Modules-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Web Components](https://img.shields.io/badge/Web_Components-29ABE2?style=flat&logo=webcomponents.org&logoColor=white)
![IndexedDB](https://img.shields.io/badge/IndexedDB-4A154B?style=flat)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

## Descripción

NousUI Lab es un **design system completo** construido desde cero con **Custom Elements v1 + Shadow DOM**, sin dependencias externas. Incluye 6 Web Components reutilizables, un motor de temas con CSS Custom Properties y una SPA de demostración con CRUD IndexedDB.

## Componentes de la librería

| Tag | Descripción | Shadow DOM |
|-----|-------------|:----------:|
| `<nous-card>` | Tarjeta con barra de acento, hover y slots | ✅ |
| `<nous-badge>` | Indicador inline con 6 tonos cromáticos | ✅ |
| `<nous-modal>` | Diálogo con backdrop blur, ESC y slideUp | ✅ |
| `<nous-toast>` | Notificación efímera con iconos por tono | ✅ |
| `<nous-progress>` | Barra de progreso con ARIA y 5 tonos | ✅ |
| `<nous-tooltip>` | Tooltip flotante con flecha CSS | ✅ |

Más: **SearchableSelect** (upgrade de `<select>` a buscable con teclado) y **motor de temas** con `applyTheme()` / `loadTheme()`.

## Arquitectura

```
NousUI-Lab/
├── index.html            ← SPA: tabs, KPIs, catálogo, CRUD
├── assets/
│   ├── app.js            ← Lógica: IndexedDB singleton, tabs, theme, dark mode, export
│   └── styles.css        ← Design system: dark mode, animaciones, responsive
├── lib/
│   └── nousui.js         ← 6 Custom Elements + SearchableSelect + theme utils
└── README.md
```

## Características principales

| Feature | Detalle |
|---------|---------|
| **6 Web Components** | Card, Badge, Modal, Toast, Progress, Tooltip — todos con Shadow DOM |
| **CRUD IndexedDB** | Create, Read, Update (promote), Delete con singleton de conexión |
| **4 KPIs en tiempo real** | Total, Listos, En pruebas, Borradores |
| **3 tabs declarativos** | Componentes, Insignias, Tema — con ARIA roles |
| **Catálogo preview grid** | Demos en vivo de los 6 componentes en grid responsive |
| **Editor de tema (4 colores)** | Accent, Background, Text, Panel — persistido en localStorage |
| **Dark mode** | Toggle + `prefers-color-scheme` + `.dark` class |
| **Confirm personalizado** | `nousConfirm()` → Promise, overlay blur, ESC |
| **Export JSON** | Descarga todos los componentes como archivo `.json` |
| **SearchableSelect** | Filtra opciones en tiempo real con navegación por teclado |
| **Responsive** | Breakpoints a 960px y 600px, mobile-first |

## Ejecución rápida

```bash
git clone https://github.com/luisrocedev/NousUI-Lab.git
cd NousUI-Lab

# Opción 1: Live Server (VS Code)
# Opción 2:
python3 -m http.server 8000
# → http://localhost:8000
```

> No requiere backend, build tools ni node_modules.

## Uso en otros proyectos

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

## Tecnologías

| Stack | Uso |
|-------|-----|
| Custom Elements v1 | Definición de los 6 componentes |
| Shadow DOM | Encapsulación de estilos |
| CSS Custom Properties | Tokens de diseño dinámicos |
| IndexedDB | Persistencia local CRUD |
| ES Modules | Organización modular |
| localStorage | Tema + preferencia dark |
| Google Fonts (Inter) | Tipografía del design system |
| ARIA roles | Accesibilidad (tabs, progressbar, modal) |

## Autor

**Luis Roces** · DAM2 2025/26 · Desarrollo de Interfaces

---

<div align="center">
  <sub>Parte del ecosistema <strong>Nous Suite</strong></sub>
</div>
