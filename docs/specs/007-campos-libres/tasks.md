# Tareas — Spec 007 · Campos libres, móvil/código postal + acceso robusto

---

- [x] **T-01 — Lógica de campos y acceso puro (`logica.js`)**
  - **Descripción:** `actualizarCliente` (+movil, +codigoPostal), `nombreTipo("Sin tipo")`,
    `textoBusquedaCliente` ampliado, nueva `direccionCompleta`, `hashTexto` en JS puro
    síncrona y `validarImportacion` relajada con los campos nuevos.
  - **RF:** RF-501, RF-502, RF-503, RF-504, RF-506.
  - **Hecho cuando:** `node --check logica.js` OK.

- [x] **T-02 — Tests actualizados (`test-logica.js`)**
  - **Descripción:** vectores de paridad del hash (2468/9753), sin shim WebCrypto,
    12 campos, «Sin tipo», `direccionCompleta`, importación relajada y búsqueda por
    móvil/CP.
  - **RF:** RF-501, RF-502, RF-504, RF-506, RF-507.
  - **Hecho cuando:** `node --test` pasa todo.

- [x] **T-03 — Formulario libre y campos nuevos (`index.html`)**
  - **Descripción:** quitar `required` de empresa/teléfono/tipo y los `*`; añadir
    «Móvil» y «Código postal».
  - **RF:** RF-501, RF-502.
  - **Hecho cuando:** se puede guardar sin rellenar nada.

- [x] **T-04 — Integración (`app.js`)**
  - **Descripción:** login y guardar-claves síncronos con error visible, edición con
    campos nuevos, «Sin nombre» en la ficha, filas Móvil/CP y mapa con
    `direccionCompleta`.
  - **RF:** RF-502, RF-503, RF-505, RF-506.
  - **Hecho cuando:** alta/edición/búsqueda/mapa usan los campos nuevos.

- [x] **T-05 — Verificación y cierre**
  - **Descripción:** `node --test` + Chrome DevTools (casos de la spec y regresión
    006), limpieza de datos de prueba, `AGENTS.md`/`MEMORY.md` y commit.
  - **RF:** RF-507.
  - **Hecho cuando:** todo verde, consola limpia y la app arranca en la pantalla de acceso.
