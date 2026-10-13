# Tareas — Spec 005 · Buscador de texto y etiqueta «Espuma»

---

- [x] **T-01 — Lógica del buscador y de la etiqueta (`logica.js`)**
  - **Descripción:** añadir `nombreTipo(tipo)`, `normalizar(valor)` y `buscarClientes(lista, consulta)`,
    puras y sin DOM, y exportarlas.
  - **RF:** RF-301, RF-302, RF-303.
  - **Hecho cuando:** `node --check logica.js` OK y las 3 funciones están en `module.exports`.

- [x] **T-02 — Tests del buscador (`test-logica.js`)**
  - **Descripción:** los casos de la sección 5 del plan (mínimo 8 tests).
  - **RF:** RF-301, RF-302, RF-303.
  - **Hecho cuando:** `node --test` pasa todo (los tests previos siguen en verde).

- [x] **T-03 — Campo de búsqueda en `index.html` + etiquetas «Espuma»**
  - **Descripción:** label+input `type="search"` entre cabecera y filtros; texto «Espuma» en el
    botón de filtro (sin tocar `data-filtro`), en la opción del desplegable (sin tocar `value`) y
    en el subtítulo de la cabecera.
  - **RF:** RF-301, RF-306.
  - **Hecho cuando:** el filtro «Espuma» sigue filtrando a los `"FOAM"` guardados.

- [x] **T-04 — Integración en `app.js` + estilos (`styles.css`)**
  - **Descripción:** estado `textoBusqueda`, listener `input`, aplicación en `pintarLista()`,
    mensajes de lista vacía contextuales con `nombreTipo`, badge con `nombreTipo`; estilos
    `.buscador` (≥44 px, responsive).
  - **RF:** RF-301, RF-302, RF-304, RF-305, RF-306.
  - **Hecho cuando:** escribir filtra en vivo, el contador refleja coincidencias, la búsqueda
    sobrevive a cambios de filtro y ediciones.

- [x] **T-05 — Verificación integral**
  - **Descripción:** `node --test` + Chrome DevTools (casos de la spec, regresión 002/004,
    móvil 375, consola) y limpieza de datos de prueba; `MEMORY.md` actualizado.
  - **RF:** RF-307.
  - **Hecho cuando:** todo verde y la app arranca vacía y sin errores.
