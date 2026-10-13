# Tareas — Spec 006 · Acceso con clave y permisos

---

- [x] **T-01 — Lógica de acceso (`logica.js`)**
  - **Descripción:** `hashTexto` (async, SHA-256 hex), `esAdmin`, `validarImportacion` y
    `nombreArchivoExportacion`; exportarlas.
  - **RF:** RF-404, RF-406, RF-407.
  - **Hecho cuando:** `node --check logica.js` OK y las 4 funciones exportadas.

- [x] **T-02 — Tests de acceso (`test-logica.js`)**
  - **Descripción:** los 9+ casos de la sección 5 del plan (asegurar `globalThis.crypto`
    con `webcrypto` de `node:crypto` si falta).
  - **RF:** RF-404, RF-406, RF-407.
  - **Hecho cuando:** `node --test` pasa todo.

- [x] **T-03 — Pantalla de acceso y panel admin (`index.html`)**
  - **Descripción:** overlay de acceso, envoltorio `#contenido-app` oculto, botón Salir,
    panel de administrador (exportar/importar/confirmación/cambiar claves), nota RF-409.
  - **RF:** RF-401, RF-403, RF-405, RF-409.
  - **Hecho cuando:** sin sesión no se ve ni se usa nada de la app.

- [x] **T-04 — Integración de sesión y permisos (`app.js` + `styles.css`)**
  - **Descripción:** estado de rol, login/logout, sesión (sessionStorage/localStorage),
    permisos en UI (`crearTarjeta`, panel admin), exportar/importar/cambiar claves, estilos
    `.acceso`/`.panel-admin` (≥44 px, responsive).
  - **RF:** RF-401…RF-407, RF-409.
  - **Hecho cuando:** cada perfil ve solo sus acciones y exportar/importar funcionan.

- [x] **T-05 — Verificación integral y cierre**
  - **Descripción:** `node --test` + Chrome DevTools (casos de la spec, regresión
    002/004/005, móvil 375, consola), limpieza de datos de prueba (incluidas claves y
    sesiones), `AGENTS.md`/`MEMORY.md` actualizados y commit.
  - **RF:** RF-408.
  - **Hecho cuando:** todo verde, la app arranca en la pantalla de acceso y sin errores.
