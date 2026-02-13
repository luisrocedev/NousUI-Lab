# NousUI Lab

Actividad de Desarrollo de Interfaces: creación de una librería gráfica personalizada y una demo funcional con persistencia en base de datos local (IndexedDB).

## Incluye

- Librería propia `lib/nousui.js` con:
  - Web Components: `nous-card`, `nous-badge`, `nous-modal`, `nous-toast`
  - Componente funcional `SearchableSelect` para `<select>`
  - Motor de tematización con persistencia (localStorage)
- Aplicación demo en `index.html` + `assets/app.js` con:
  - CRUD de componentes visuales
  - Filtros y buscador en tiempo real
  - Flujo de estados del componente (borrador, pruebas, listo, deprecated)
  - KPIs de estado
  - Persistencia en `IndexedDB` (`nousui_lab_db`)

## Ejecutar

No requiere backend. Abre `index.html` en navegador moderno (Chrome/Edge/Firefox).

## Estructura

- `index.html` → interfaz de demostración
- `assets/styles.css` → estilos base de la demo
- `assets/app.js` → lógica funcional + IndexedDB
- `lib/nousui.js` → librería UI personalizada
