# Tareas — Spec 012 · Listado compacto con selector de campos

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md` (aprobada), `plan.md` y este `tasks.md`.
  - **RF:** RF-1001, RF-1002, RF-1003, RF-1004, RF-1005, RF-1006.
  - **Hecho cuando:** el usuario aprueba plan y tareas. *(Hecho: 2026-10-16)*

- [x] **T-02 — Lógica pura y tests (`logica.js` + `test-logica.js`)**
  - **Descripción:** `CATALOGO_CAMPOS`, `normalizarSeleccion`, `alternarCampo`, `fechaTextoLocal(fecha, hoy)` con `dosDigitos()` reutilizada y exportada, `construirCeldas`/`construirFilas(clientes, campos, hoy)` con las convenciones de celdas; tests en rojo→verde.
  - **RF:** RF-1002, RF-1004, RF-1005.
  - **Hecho cuando:** `node --test` en verde con los tests nuevos, sin DOM y sin tocar `app.js`. *(Hecho: 2026-10-16 — 59 tests en verde. **Ajuste posterior aprobado por el usuario (2026-10-16):** el límite de fecha inválida pasó de «hoy + 1 día a la misma hora» a **día completo de mañana** — «—» solo para no numéricas o de pasado mañana (00:00 local) en adelante; test de frontera adaptado y test de fuente conservado)*

- [x] **T-03 — Conmutador y chips (`index.html` + `styles.css` + estado/eventos en `app.js`)**
  - **Descripción:** conmutador «Tarjetas» ↔ «Listado» («Tarjetas» activo por defecto) en la cabecera de la lista y contenedor `#selector-campos` oculto en tarjetas; estilos de conmutador y chips con estado de casilla, foco visible y ≥ 44 px. Estado en memoria `vistaActual`/`camposSeleccionados` con `pintarConmutador`/`pintarChips`, listener del conmutador y de chips (`alternarCampo`), y hueco discreto en `pintarLista` para el modo listado (las filas llegan en T-04).
  - **RF:** RF-1001, RF-1002, RF-1004, RF-1006 (estado solo en memoria).
  - **Hecho cuando:** la vista y los chips se ven y se operan con teclado (Tab/Intro/Espacio) y su estado activo se distingue sin depender solo del color. *(Hecho: 2026-10-16 — verificado en navegador: cambio de vista instantáneo sin tocar filtro/búsqueda/contador, 11 chips con «Empresa» marcada, desmarcar el último vuelve a «solo Empresa», estados vacíos idénticos, móvil 375 sin desbordes, objetivos ≥ 44 px, consola limpia, sin claves nuevas de `localStorage`)*

- [x] **T-04 — Pintado de filas y estados vacíos (`app.js`)**
  - **Descripción:** estado en memoria `vistaActual`/`camposSeleccionados` (sin ninguna escritura nueva), `pintarConmutador`/`pintarChips`, ramificación en `pintarLista` con los **mismos** estados vacíos y contador que hoy, y tabla del listado (`crearTablaListado`, en lugar de `crearFila`: la cabecera cuelga de las celdas de la primera fila) a partir de `construirFilas`: celdas etiqueta+valor con `title`, canto de color por tipo, `data-id` en la fila, sin mapa ni iframes.
  - **RF:** RF-1001, RF-1003 (estados vacíos y contador), RF-1004.
  - **Hecho cuando:** el listado muestra exactamente los mismos clientes/orden/contador que las tarjetas, con «Sin nombre»/«Sin tipo»/texto libre/«—», texto cortado con «…» y los mensajes vacíos idénticos. *(Hecho: 2026-10-16 — verificado en navegador: filas con los 11 campos, coherencia con filtro «Espuma» y búsqueda, fecha «—» para pasado mañana, filas apiladas a 375 sin desbordes ni scroll horizontal, sin acciones aún, consola limpia, sin claves nuevas de `localStorage`)*

- [x] **T-05 — Acciones en la fila (`app.js` + `styles.css`)**
  - **Descripción:** celda de acciones con «Editar»/«Eliminar» y con «¿Seguro? · Sí, eliminar / No» reutilizando el listener delegado y `clienteEditandoId`/`confirmandoEliminarId`; marca de edición en la fila entera (anillo + bordes en tinta).
  - **RF:** RF-1003.
  - **Hecho cuando:** al eliminar, la confirmación ocupa solo la celda de acciones y el resto de la fila permanece visible e intacta; al editar, la marca cubre toda la fila; sin `confirm()` nativo y con el aviso «Cliente eliminado». *(Hecho: 2026-10-16 — verificado en navegador: editar desde fila marca la fila + formulario en modo edición + guardar actualiza y quita la marca; «¿Seguro?» solo en su celda (11 celdas de datos intactas), «No» restaura, «Sí» borra con toast y contador; cambiar de vista con confirmación o edición abiertas conserva el estado y se muestra en la vista destino (caso límite §4 de la spec); móvil 375 sin desbordes, botones ≥ 44 px, consola limpia, sin claves nuevas de `localStorage`)*

- [x] **T-06 — Selector de campos conectado (`app.js`)**
  - **Descripción:** clic en chips → `alternarCampo` + repintado de chips **y filas** (columnas al instante con la cabecera); «Fecha de alta» en dd/mm/aaaa local; desmarcar el último vuelve a «solo Empresa».
  - **RF:** RF-1002.
  - **Hecho cuando:** marcar/desmarcar cambia las columnas en seguida, la selección vacía se recupera sola y sin error, y la fecha aparece en formato local correcto. *(Hecho: 2026-10-16 — verificado en navegador: columnas al instante a 1/4/11 campos en orden del catálogo con «Fecha de alta» última en dd/mm/aaaa; desmarcar todo → «solo Empresa»; filtro+úsqueda y edición/confirmación en curso conservados; foco del teclado restituido en el chip pulsado; móvil 375 y escritorio sin desbordes; consola limpia, sin claves nuevas)*

- [x] **T-07 — Integración con filtro, búsqueda y ciclo de vida (`app.js`)**
  - **Descripción:** cambios de pestaña/buscador repintan también el listado; alta, edición, borrado e importación (spec 011) dejando la vista y la selección de la sesión intactas; cambiar de vista no altera filtro, búsqueda ni datos.
  - **RF:** RF-1001, RF-1003.
  - **Hecho cuando:** con filtro «Espuma» y una búsqueda, ambas vistas coinciden cliente a cliente y en contador, y un alta/borrado desde el listado se refleja con el mismo orden y avisos de siempre. *(Hecho: 2026-10-16 — verificado en navegador SIN cambios de código: pestañas/buscador repintan el listado (ids, contador y estados vacíos idénticos); alta en Listado con filtro+búsqueda → fila nueva primera con «Cliente guardado», filtro «Todos» y buscador limpio pero vista y selección intactas; editar/borrar en Listado se refleja en Tarjetas; importar basura (JSON inválido o no-lista) avisa sin tocar nada y válido muestra las filas con filtro «Todos», buscador limpio y vista/selección conservadas; cambio de vista con filtro+úsqueda no altera nada; 375 sin desbordes, consola limpia, sin claves nuevas)*

- [x] **T-08 — Responsive 375 px, teclado y RF-1006**
  - **Descripción:** filas apiladas etiqueta+valor sin desbordes; recorrido de teclado completo; comprobación de que no se crea ninguna clave nueva de `localStorage` y de que la recarga vuelve al inicio.
  - **RF:** RF-1004, RF-1006.
  - **Hecho cuando:** a 375 px con los 11 campos no hay scroll horizontal ni desbordes, Tab/Intro/Espacio funcionan, `Object.keys(localStorage)` solo muestra `gestorClientes` y al recargar se arranca en «Tarjetas» con solo «Empresa». *(Hecho: 2026-10-16 — SIN cambios de código; endurecido con `emulate` 375×740 mobile+touch y `press_key` de teclas REALES: 375 sin scroll horizontal en 11/1 campos y con confirmación/edición abiertas (scrollWidth == 375 siempre), chips 46 / conmutador 44 / botones de fila y «Sí/No» 45 / formulario ≥46 px, filas apiladas etiqueta+valor legibles (captura); recorrido Tab completo con `outline: solid` en todo (buscador → filtros → Exportar/Importar → chips → Editar/Eliminar → Sí/No, y Shift+Tab al formulario con controles ≥45 px), Intro/Espacio alternan chips con foco conservado, Intro en Editar entra en modo edición, Espacio en «Sí, eliminar» borra; RF-1006: solo `gestorClientes` es nuestra y tras recarga «Tarjetas» + solo «Empresa» + selector oculto + aria-pressed correcto; consola limpia en todas las navegaciones)*

- [x] **T-09 — Verificación completa en navegador**
  - **Descripción:** checklist del plan con Chrome DevTools: conmutador, chips, coherencia filtro/búsqueda/contador, edición/borrado desde filas, estados vacíos, celdas, fecha local, mapa ausente, móvil 375, consola limpia y datos de prueba borrados.
  - **RF:** RF-1001, RF-1002, RF-1003, RF-1004, RF-1005, RF-1006.
  - **Hecho cuando:** todos los criterios de aceptación de la spec cumplidos, `node --test` en verde y consola sin errores. *(Hecho: 2026-10-16 — acta completa SIN cambios de código: RF-1001 mismo clic sin recarga (marcador JS vivo) e intactos datos/filtro/búsqueda/orden; RF-1002 11 chips sin `id`, orden de catálogo, «Fecha de alta» última dd/mm/aaaa con fronteras (mañana 00:30 = 17/10/2026, pasado mañana = «—», 1-oct-00:30 local = 01/10/2026) y desmarcar todo → «Empresa»; RF-1003 coherencia y estados vacíos idénticos byte a byte, marca en la fila entera, «¿Seguro?» solo en la celda con resto intacto y conservación de edición/confirmación en la vista destino; RF-1004 375 sin desbordes (11 campos + edición + confirmación), «…»+`title` completo, «Sin nombre»/«Sin tipo»/«—»/tipo libre, sin celdas en blanco, sin iframes ni enlaces (mapa exclusivo de tarjetas: iframe + enlace `rel=noopener`), ≥44 px, teclado real; RF-1005 59/59; RF-1006 solo `gestorClientes` y recarga → «Tarjetas»+«Empresa»; regresiones 010/011 (alta/edición/borrado/importar válido y basura) intactas; consola limpia (el único `[debug] Search endpoint` es del navegador/MCP, la app no tiene ni una llamada `console.*`); app borrada y arranque vacío verificado)*

- [x] **T-10 — Documentación y cierre**
  - **Descripción:** `AGENTS.md` (funcionalidad 012), línea en `MEMORY.md` con el número de tests, marcar la spec/plan como implementados y commits por fases.
  - **RF:** RF-1005.
  - **Hecho cuando:** docs al día, `node --test` en verde y commits hechos. *(Hecho: 2026-10-16 — AGENTS.md con la entrada «Listado compacto (spec 012)» en «Funcionalidades implementadas»; `plan.md` en estado «aprobado e implementado»; MEMORY.md línea 012 cerrada como IMPLEMENTADA (59 tests, decisiones y commit) y «Próximos pasos» con 013/014/015; `node --check` OK y `node --test` → 59/59; commits hechos y árbol limpio)*

---

## Corrección posterior (ronda 1 del reviewer, 2026-10-16)

- **RF-1004 — `title` de las celdas y del mapa sin escapar comillas** (bloqueante): `escapar()` de `app.js` (textContent/innerHTML) no escapa `"`/`'`, así que un valor con comillas rompía el atributo `title` y permitía **inyectar atributos** (p. ej. notas `x" onmouseover="…`, demostrado). **Arreglo:** nueva ayuda pura **`escaparAtributo()` en `logica.js`** (escapa `& < > " '`, exportada, RF-1005 intacta) + **5 tests** nuevos en `test-logica.js` (título con comillas íntegro, payload neutralizado, `&` primero, comillas simples, nulos) y uso en **todos los contextos de atributo** de `app.js` (celdas y cabecera del listado `title`/`data-etiqueta`, título del iframe del mapa —corrección secundaria heredada de la 004—, `href`/`src` y `data-campo` por defensa en profundidad); el contenido de texto sigue con `escapar()`. Verificado en navegador: title íntegro con `"` y `<b>`, payload importado → 2 atributos, sin `onmouseover`, `window.__inyectado` indefinido tras `mouseover` real, dirección `C/ "Los Olivos" 3` → título del mapa íntegro, 375 sin desbordes, consola limpia, datos borrados. **64/64 tests.** Commit: «Spec 012-listado: corrige title de celdas y tarjeta — escape de atributos (reviewer)».
