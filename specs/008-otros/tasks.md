# Tareas — Spec 008 · Tipo «Otros»

---

- [x] **T-01 — Lógica de tipos (`../../logica.js`)**
  - **Descripción:** `esTipoFijo`, `claseTipo` (libres → `otros`) y el caso `Otros` en
    `filtrarClientes`.
  - **RF:** RF-603, RF-604.
  - **Hecho cuando:** `node --check logica.js` OK.

- [x] **T-02 — Tests (`../../test-logica.js`)**
  - **Descripción:** los 4 casos de la sección 5 del plan.
  - **RF:** RF-603, RF-604, RF-606.
  - **Hecho cuando:** `node --test` pasa todo.

- [x] **T-03 — HTML: opción y campo (`../../index.html`)**
  - **Descripción:** opción «Otros», campo `tipo-otro` oculto y pestaña «Otros».
  - **RF:** RF-601, RF-603.
  - **Hecho cuando:** el desplegable tiene 4 opciones y la pestaña existe.

- [x] **T-04 — Integración (`../../app.js` + `styles.css`)**
  - **Descripción:** mostrar/oculta campo, guardado del texto, edición round-trip,
    `resetearFormulario`, color violeta y `.campo[hidden]`.
  - **RF:** RF-602, RF-604, RF-605.
  - **Hecho cuando:** alta/edición/filtro usan el tipo libre.

- [x] **T-05 — Verificación y cierre**
  - **Descripción:** `node --test` + navegador (casos de la spec y regresión), limpieza,
    `../../AGENTS.md`/`MEMORY.md` y commit.
  - **RF:** RF-606.
  - **Hecho cuando:** todo verde, consola limpia, docs actualizados.
