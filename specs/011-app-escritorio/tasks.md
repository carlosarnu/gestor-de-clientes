# Tareas — Spec 011 · App de escritorio (Electron)

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md`, `plan.md` y este `tasks.md`.
  - **RF:** RF-901…RF-905.
  - **Hecho cuando:** el usuario aprueba spec y plan.

- [x] **T-02 — Lógica pura y tests**
  - **Descripción:** `importarClientes` + `nombreArchivoExportacion` en `logica.js`, con tests.
  - **RF:** RF-905.
  - **Hecho cuando:** `node --test` en verde con los tests nuevos.

- [x] **T-03 — Web: exportar e importar**
  - **Descripción:** botones, descarga, lectura de fichero, confirmación en línea con contadores; verificado en `file://`.
  - **RF:** RF-901.
  - **Hecho cuando:** exporta, importa y rechaza basura sin tocar datos (navegador).

- [x] **T-04 — Punto de datos único en `app.js`**
  - **Descripción:** `cargar()`/`guardar()` con puente o `localStorage`; mensaje de migración 2 clics; renombrado de archivo dañado.
  - **RF:** RF-902, RF-903.
  - **Hecho cuando:** la web sigue idéntica y el modo escritorio queda cableado.

- [x] **T-05 — Carpeta `escritorio/` (Electron)**
  - **Descripción:** `main.js`, `preload.js`, `package.json`, `.gitignore`; `npm start` y build NSIS.
  - **RF:** RF-902.
  - **Hecho cuando:** la app arranca en ventana propia y escribe/lee `Documentos\Gestor de Clientes\clientes.json`.

- [x] **T-06 — Documentación, verificación y cierre**
  - **Descripción:** enmienda de la constitución, `AGENTS.md`, `MEMORY.md`, verificación completa y commits.
  - **RF:** RF-904, RF-905.
  - **Hecho cuando:** docs al día, verificación verde y commits hechos.