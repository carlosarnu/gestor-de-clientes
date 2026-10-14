# Tareas — Spec 004 · Mapa de Google Maps

Formato: una tarea = un paso pequeño, con su «Hecho cuando». Se marca `[x]` al terminarla.

---

- [x] **T-01 — Lógica del mapa en `../../logica.js`**
  - **Descripción:** añadir `debeMostrarMapa(direccion)`, `urlMapa(direccion)`,
    `urlBusquedaMapa(direccion)` y `contenidoMapa(direccion, enLinea)`, puras y sin DOM/navigator.
  - **RF:** RF-201, RF-202, RF-203.
  - **Hecho cuando:** `node --check logica.js` no da error y las 4 funciones están exportadas.

- [x] **T-02 — Tests de la lógica del mapa**
  - **Descripción:** añadir a `../../test-logica.js` los casos de la sección 5 del plan (mínimo 4 tests).
  - **RF:** RF-201, RF-202, RF-203.
  - **Hecho cuando:** `node --test` pasa con todos los tests en verde (los previos siguen pasando).

- [x] **T-03 — Cuadro del mapa en la tarjeta (`../../app.js`)**
  - **Descripción:** en `crearTarjeta()`, tras la fila de dirección, inyectar `.mapa-caja` con
    iframe (`title`, `loading="lazy"`, referrerpolicy) o enlace de respaldo según
    `contenidoMapa(direccion, navigator.onLine !== false)`; URL por `urlMapa`/`urlBusquedaMapa`;
    texto por `escapar()`. Añadir listeners `online`/`offline` → `pintarLista()`.
  - **RF:** RF-201, RF-202, RF-203, RF-204, RF-206.
  - **Hecho cuando:** en navegador, una tarjeta con dirección muestra el cuadro y otra sin dirección
    no lo muestra; al editar la dirección el mapa cambia; al vaciarla desaparece.

- [x] **T-04 — Estilos `.mapa-caja` / `.mapa-mapa` / `.mapa-enlace` (`../../styles.css`)**
  - **Descripción:** estilos de la sección 4 del plan (aspect-ratio 16/9, borde `--linea`, radio
    `--radio`, sin sombras, enlace de respaldo como botón centrado).
  - **RF:** RF-205.
  - **Hecho cuando:** a 375 px no hay desbordamiento y el cuadro sigue la paleta de materiales.

- [x] **T-05 — Verificación integral**
  - **Descripción:** `node --test` + Chrome DevTools (regresión 002: alta, edición, borrado con
    confirmación, filtros, RF-013; mapa con/sin dirección; offline simulado → enlace; móvil 375;
    consola) y borrar datos de prueba.
  - **RF:** RF-206, RF-207.
  - **Hecho cuando:** todo verde, app sin errores y `../../MEMORY.md` actualizado.
