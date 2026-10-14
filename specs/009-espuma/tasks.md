# Tareas — Spec 009 · FOAM → Espuma y depuración

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md`, `plan.md` y este `tasks.md`.
  - **RF:** RF-701, RF-702, RF-703.
  - **Hecho cuando:** el usuario aprueba el enfoque (2026-10-14).

- [x] **T-02 — Lógica y tests (`logica.js` + `test-logica.js`)**
  - **Descripción:** `esTipoFijo`/`nombreTipo` con «Espuma», `migrarTipos` + export,
    tests de migración, fixtures con los 12 campos y renombrados FOAM→Espuma, erratas de
    comentarios.
  - **RF:** RF-701, RF-702, RF-703.1, RF-703.2, RF-703.6.
  - **Hecho cuando:** `node --check` OK y `node --test` en verde (34).

- [x] **T-03 — Interfaz (`index.html` + `styles.css`)**
  - **Descripción:** `value`/`data-filtro` a «Espuma», variables y clases CSS a
    `espuma`, cinta de 4 franjas.
  - **RF:** RF-701, RF-703.5.
  - **Hecho cuando:** no queda «foam» en HTML/CSS.

- [x] **T-04 — Integración (`app.js`)**
  - **Descripción:** migración en `cargarClientes` (persistida solo si cambia), comentario
    de 12 campos y «Correo electrónico» en la ficha.
  - **RF:** RF-702, RF-703.1, RF-703.7.
  - **Hecho cuando:** los datos con «FOAM» abren ya como «Espuma».

- [x] **T-05 — Documentación y cierre**
  - **Descripción:** corregir la spec 008, `AGENTS.md` y `MEMORY.md`; verificar en
    navegador (migración, colores, cinta, móvil, consola) y commit.
  - **RF:** RF-703.3, RF-703.4.
  - **Hecho cuando:** docs al día, navegador limpio y commit hecho.
