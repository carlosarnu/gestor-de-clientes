# Tareas — Spec 010 · Alta con feedback

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md`, `plan.md` y este `tasks.md`.
  - **RF:** RF-801, RF-802, RF-803.
  - **Hecho cuando:** el usuario aprueba spec y plan.

- [x] **T-02 — Lógica y tests (`logica.js` + `test-logica.js`)**
  - **Descripción:** `mensajeAviso("guardado")` → «Cliente guardado» + test unitario.
  - **RF:** RF-801.
  - **Hecho cuando:** `node --test` en verde (35).

- [x] **T-03 — Integración (`app.js`)**
  - **Descripción:** limpieza de la búsqueda + aviso en el alta; `cargarClientes` con dos `try`.
  - **RF:** RF-801, RF-802.
  - **Hecho cuando:** el alta con búsqueda previa se ve con aviso y el fallo de escritura no vacía la lista.

- [x] **T-04 — Documentación y cierre**
  - **Descripción:** errata de `AGENTS.md`, línea en `MEMORY.md`, verificación en navegador y commit.
  - **RF:** RF-803.
  - **Hecho cuando:** docs al día, navegador limpio y commit hecho.