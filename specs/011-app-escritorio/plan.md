# Plan — Spec 011 · App de escritorio (Electron)

**Estado:** pendiente de aprobación del usuario

---

## 1. `docs/constitution.md`

- Regla 1 enmendada: JS puro y doble clic para la web; **excepción**: Electron/build solo
  como embudo de escritorio (`escritorio/`), aprobada por el usuario el 2026-10-14.

## 2. `logica.js` + `test-logica.js` (TDD, +tests)

- `importarClientes(textoJson)`: parsea, valida que sea array de clientes, normaliza campos
  (12, texto) y devuelve `{ clientes, error }` — error sin tocar nada.
- `nombreArchivoExportacion(fecha)`: `clientes-AAAA-MM-DD.json` (fecha local).
- Tests de ambas (verde con `node --test`).

## 3. Web (`index.html`, `styles.css`, `app.js`)

- Botones **«Exportar»/«Importar»** (junto a la lista), descarga por Blob y lectura por
  `input type=file` (verificar en `file://`).
- Confirmación en línea de la importación (estilo «¿Seguro?» + contadores), sin
  `confirm()`/`alert()`.
- Punto único de datos: `cargar()`/`guardar()` → si `window.gestorDatos` existe (escritorio),
  puente; si no, `localStorage` como hoy. En escritorio, vacío inicial + mensaje de
  migración 2 clics; archivo dañado renombrado a `clientes-daños-…json`.

## 4. Escritorio (`escritorio/`)

- `main.js`: ventana «Gestor de Clientes», carga `../index.html`, IPC síncrono
  `leer`/`escribir` sobre `Documentos\Gestor de Clientes\clientes.json` (crear carpeta si no
  existe; renombrar dañado). `preload.js`: `contextBridge` con `window.gestorDatos`.
- `package.json`: `electron` + `electron-builder` (devDeps), scripts `start` y `build`
  (NSIS); `.gitignore` para `node_modules/` y `dist/`.

## 5. Documentación y cierre

- `AGENTS.md`: stack (carpeta `escritorio/`), comandos (`npm start`/`npm run build`), límite
  «dependencias solo en `escritorio/`», funcionalidad 011.
- `MEMORY.md`: línea de la 011.

## 6. Verificación

- `node --check` + `node --test` (verde con tests nuevos).
- Chrome DevTools (web): exportar descarga, importar restaura, basura no toca datos,
  móvil 375, consola limpia.
- Escritorio: `npm start` arranca con archivo creado; alta → línea en el JSON; flujo de
  migración 2 clics completo; `npm run build` genera el instalador NSIS.
- Datos de prueba borrados; commits por fases (web/puente, escritorio, docs).