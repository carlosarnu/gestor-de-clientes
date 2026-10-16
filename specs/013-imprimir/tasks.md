# Tareas — Spec 013 · Impresión del listado de clientes

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md` (aprobada, con las 6 correcciones del QA aplicadas),
    `plan.md` y este `tasks.md`.
  - **RF:** RF-1101, RF-1102, RF-1103, RF-1104.
  - **Hecho cuando:** el usuario aprueba spec, plan y tareas. *(Hecho: 2026-10-16 —
    autorización de fase del usuario; correcciones del QA aplicadas al spec)*

- [x] **T-02 — Lógica pura y tests (`logica.js` + `test-logica.js`)**
  - **Descripción:** `textoContextoImpresion(filtro, busqueda)` con el formato literal de
    la Decisión 6 de la spec (título + «Filtro: X» si ≠ «Todos» + «Búsqueda: «texto»»
    recortada, unidas por « · »; «Otros» literal; sin piezas → solo el título), exportada
    en `module.exports`; tests en rojo→verde.
  - **RF:** RF-1104.
  - **Hecho cuando:** `node --test` en verde con los tests nuevos (los 64 actuales
    intactos), sin DOM y sin tocar `app.js`. *(Hecho: 2026-10-16 — `textoContextoImpresion`
    en `logica.js` (sección «Impresión del listado», usa `texto()` para recortar y
    manejar nulos; etiqueta del filtro = valor de la pestaña tal cual, sin `nombreTipo`)
    y exportada; 8 tests nuevos anclados al formato literal (solo título, «Tela»,
    «Todos» omitido, cadena completa del criterio, «Otros» literal, trim de búsqueda +
    solo-espacios omitida, filtro vacío/ausente/nulo = «Todos», acentos/mayúsculas/
    comillas/«<x>» intactos sin marcado); rojo verificado (8 fallos) → verde 72/72;
    `node --check logica.js` OK; `app.js`, `index.html` y `styles.css` sin tocar)*

- [x] **T-03 — Botón «Imprimir» y guardia (`index.html` + `app.js`)**
  - **Descripción:** botón `#boton-imprimir` en `.lista-cabecera` (tras el conmutador,
    visible en las dos vistas); `visiblesActuales()` extraída de `pintarLista` y
    compartida; cero visibles → `pintarAviso("No hay clientes para imprimir")` (literal
    en `app.js`, sin `mensajeAviso`); con visibles → `window.print()`.
  - **RF:** RF-1101, RF-1102.
  - **Hecho cuando:** el botón se ve y se opera en ambas vistas (teclado y ≥ 44 px), con
    visibles abre el diálogo nativo y con cero visibles (vacío, filtro sin resultados o
    búsqueda sin coincidencias) muestra el toast **sin** abrir el diálogo. *(Ctrl+P no se
    intercepta.)* *(Hecho: 2026-10-16 — botón `#boton-imprimir` clase `boton-secundario`
    tras el conmutador y antes del contador en `.lista-cabecera` (sin tocar `styles.css`:
    hereda los ≥ 44 px del estilo existente, medido 50 px); `visiblesActuales()` extraída
    de `pintarLista` (misma expresión orden→filtro→búsqueda, un solo cálculo para pintado
    y guardia) y listener tras el de «Cancelar importación»: 0 visibles →
    `pintarAviso("No hay clientes para imprimir")` sin print, con visibles → `window.print()`
    (espía temporal: 1 llamada en Tarjetas y 2 acumuladas en Listado); los 3 casos del
    guardia verificados (búsqueda «zzzz», pestaña Estructuras vacía y lista vacía) → 0
    llamadas + toast correcto; teclado real Tab → foco en el botón con `outline: solid 2px`
    e Intro → print; `window.onbeforeprint === null` (Ctrl+P sin interceptar, T-04 lo
    cubre); 375 sin desbordes en las dos vistas; estado (vista/selección/datos) intacto
    tras los clics; consola limpia, sin claves nuevas, datos borrados y arranque vacío;
    `node --check app.js` OK y `node --test` 72/72)*

- [x] **T-04 — Cabecera de contexto y `beforeprint` (`index.html` + `app.js`)**
  - **Descripción:** `<p id="cabecera-impresion" aria-hidden="true">` oculto en pantalla
    (`display: none`), primer elemento del panel de lista; listener `beforeprint` que lo
    rellena con `textContent = textoContextoImpresion(filtroActivo, textoBusqueda)`
    (cubre el botón y Ctrl+P/menú).
  - **RF:** RF-1103.
  - **Hecho cuando:** despachando `beforeprint` con distintos filtro/búsqueda, el
    elemento queda con el texto literal exacto (p. ej. `Gestor de Clientes · Filtro: Tela
    · Búsqueda: «vega»`), en pantalla no ocupa sitio y la consola sigue limpia. *(Hecho:
    2026-10-16 — `<p class="cabecera-impresion" id="cabecera-impresion"
    aria-hidden="true">` primer elemento de `section.panel` (antes de `.lista-cabecera`);
    oculto en pantalla con **regla CSS `display: none`** en estilo de pantalla (decidido
    frente al atributo `hidden` del HTML: `hidden` exigiría `[hidden] !important` y
    complicaría el `display: block` de T-05; con CSS es una regla simple y la posición en
    el fichero queda en la sección de lista); listener único `beforeprint` en `window`
    (sin relleno duplicado en el clic: el navegador lo dispara en el botón Y en
    Ctrl+P/menú, Decisión 12). Verificado: 5 combos con texto literal exacto
    (Todos+vacío → solo título, Tela+«vega» cadena completa del criterio, Todos+«vega»,
    «Otros» literal, búsqueda con espacios → recortada en vivo); display:none/0 px/
    offsetParent nulo/aria-hidden; cadena REAL botón → `window.print()` → `beforeprint`
    (espía: 1 disparo y cabecera «Gestor de Clientes · Filtro: Tela»; el diálogo abierto
    por el print real llegó a bloquear un evaluate — prueba de que la ruta real se abre);
    guardia sin visibles → toast correcto, `beforeprint` NO disparado y cabecera sin
    cambiar; arranque vacío → cabecera «Gestor de Clientes»; consola limpia, sin claves
    nuevas, datos borrados; `node --check app.js` OK y `node --test` 72/72)*

- [x] **T-05 — CSS de impresión: chrome oculto y contexto visible (`styles.css`)**
  - **Descripción:** bloque `@media print` con `display: none` en toda la lista del plan
    §4 — incluidos el contador «N clientes», el título «Campos del listado» y **toda la
    columna «Acciones»** (`th` y `td`, clase `.acciones-celda`), el mapa (iframe y
    enlace) y el toast — y `.cabecera-impresion { display: block }`.
  - **RF:** RF-1103.
  - **Hecho cuando:** cada elemento de la lista está oculto y la cabecera visible solo en
    el bloque de impresión, y en pantalla **no cambia nada** de lo que había. *(Hecho:
    2026-10-16 — bloque `@media print` al final de `styles.css` (tras
    `prefers-reduced-motion`); ocultos: `.cabecera` (cinta decorativa), `#panel-formulario`,
    `.filtros`, `.buscador`, `.conmutador`, `.contador`, `#boton-imprimir`,
    `.copia-seguridad`, `.confirmacion-importacion`, `.selector-campos` (chips + título
    «Campos del listado»), `.tarjeta-acciones`, `.confirmacion`, `.acciones-celda`
    (th y td), `.mapa-caja` (iframe y enlace) y `.toast`; visibles:
    `.cabecera-impresion { display: block }` (tipografía de título un punto menor que el
    `<h2>`) **y el `<h2> «Clientes» de la lista** — este último por instrucción directa del
    usuario en T-05, que se apartaba del plan §4/Decisión 10; **CORREGIDO en T-06: la
    spec manda y el `<h2>` ahora también se oculta** (ver anotación de T-06); marca de
    edición restaurada en papel (bordes/tinte de fila o tarjeta normales, `box-shadow:
    none`, canto de color del tipo conservado). Verificado sin emular el medio `print`
    (el MCP no lo permite, ya anotado en el plan §8): (1) **relevo con `querySelector`:
    cada selector del bloque apunta a un elemento real** en sus estados (tarjetas,
    listado, confirmación abierta dentro de `td.acciones-celda`); (2) **regla temporal
    `@media all` idéntica** inyectada → los 15 ocultos con `display:none`/0 px y los
    visibles con altura real (cabecera impresa 25 px, h2 22, lista 92, fila 45, mapa
    194→0, marcas de edición restauradas); (3) **retirada** → todo restaurado (contador
    21, botón Imprimir 50, th 41, mapa 194, cabecera impresa otra vez oculta) y la hoja
    de prueba fuera del DOM (`document.querySelectorAll("style").length === 0`). Nota:
    durante la verificación un selector demasiado genérico de MI guión (`[data-accion]`)
    pulsó «Sí, eliminar» y borró un cliente de prueba — error del guión (usado después
    `confirmar-no` explícito), datos resiembrados, la app no intervino. `node --test`
    72/72, consola limpia, datos borrados y arranque vacío)*

- [x] **T-06 — CSS de papel: listado siempre tabla, tarjetas 1 columna, paginación (`styles.css`)**
  - **Descripción:** bloque apilado de la 012 restringido a `@media screen and (max-width:
    768px)`; en print `.lista-clientes` a `grid-template-columns: 1fr` (anula las 2/3
    columnas de `min-width`), celdas sin `nowrap`/«…» y `break-inside: avoid` en
    `.tarjeta` y `tr` (`thead` repetido por `table-header-group`).
  - **RF:** RF-1103.
  - **Hecho cuando:** en la vista previa de impresión (Ctrl+P) el listado sale **como
    tabla con su `thead`** aunque el viewport sea 375 px, el texto de las celdas sale
    completo, las tarjetas salen en una sola columna y ninguna tarjeta ni fila queda
    partida entre páginas. *(Hecho: 2026-10-16 — **corrección de la ronda aplicada**:
    `.lista-cabecera h2` añadido a la lista de ocultos del `@media print` (Decisión 10
    de la spec y plan §4 mandan: en papel basta la cabecera de contexto) y anotación de
    T-05 corregida; comentario del bloque actualizado. **T-06**: bloque apilado de la 012
    (thead oculto, td::before, filas apiladas) restringido a **`@media screen and
    (max-width: 768px)`** —en papel nunca aplica, sin duplicar reglas (Decisión 2)—;
    dentro del `@media print`: `.listado thead { display: table-header-group }`,
    `.listado th/td { white-space: normal; overflow: visible; text-overflow: clip }`
    (Decisión 8, texto completo), `.lista-clientes { grid-template-columns: 1fr }`
    (gana por orden a los `min-width` de 2/3 columnas) y
    `.tarjeta/.listado tr { break-inside: avoid; page-break-inside: avoid }`.
    Verificado con la técnica de regla temporal de T-05: **desktop** → 1 columna
    (1026 px), thead `table-header-group` visible, nota larga 416/416 sin «…»,
    break-inside avoid, h2 oculto; retirada → 3 columnas restauradas, nota cortada con
    «…», break-inside auto, h2 visible. **375 intacto** (scroll 375, thead clipped
    `position:absolute`, td block con etiqueta `::before`, nota cortada) y **papel
    emulado a 375** (reglas de papel + apilado no aplicado) → thead visible, nota
    294/294 completa, grid 1 columna, break-inside avoid, h2 oculto; retirada →
    apilado de vuelta y sin desbordes. Hoja de prueba fuera del DOM, `node --test`
    72/72, consola limpia, datos borrados y arranque vacío)*

- [x] **T-07 — Integración y verificación completa (navegador)**
  - **Descripción:** checklist del plan §8: rutas botón y Ctrl+P, cabecera literal
    fresca en ambas, cero visibles en cada ruta (toast solo en botón; estado vacío en
    Ctrl+P), chrome no impreso, teclado, 375 px, **cero escrituras** (`Object.keys(localStorage)`
    ⇒ solo `gestorClientes`; `clientes.json` intacto en escritorio), regresiones 012
    (conmutador, chips, acciones de fila, estados vacíos) y consola limpia; datos de
    prueba borrados.
  - **RF:** RF-1101, RF-1102, RF-1103.
  - **Hecho cuando:** todos los criterios de aceptación de la spec cumplidos,
    `node --test` en verde y consola sin errores. *(Hecho: 2026-10-16 — **acta completa
    SIN cambios de código** (los fallos del recorrido fueron siempre de mis guiones:
    chips desenganchados tras repintar, `thead` consultado antes de entrar en listado,
    caso de filtro «Otros» que NO estaba vacío porque el tipo libre «Toldos y lonas»
    entra en esa pestaña, y espía armado a propósito antes del chequeo de print nativo):
    **RF-1101** botón visible en ambas vistas/tras el conmutador, 50 px, Tab → foco con
    `outline solid 2px` e Intro → print (1 llamada) con beforeprint → cabecera fresca,
    sin tocar vista/selección/datos; **RF-1102** ruta botón (1 print + cabecera literal
    `Gestor de Clientes · Filtro: Tela · Búsqueda: «vega»`), ruta Ctrl+P sin interceptar
    (cero handlers de teclado en `app.js`, `onbeforeprint` nulo, Ctrl+P sintético sin
    efecto; cambio de filtro/búsqueda sin tocar el botón → cabecera fresca al despachar
    beforeprint), guardia SOLO del botón en los 3 casos (vacío total, filtro Otros ya
    sin clientes y filtro+busqueda → 0 prints + toast correcto) y control positivo con
    visibles (imprime); Ctrl+P con 0 visibles → estado vacío en la hoja sin toast;
    **RF-1103** hoja (regla temporal print) con los 14 ocultos + h2, cabecera de
    contexto visible (25 px), listado tabla con thead `table-header-group` visible,
    11 columnas (etiquetas del catálogo) y 5 columnas según selección con Acciones
    (th y td) oculta, tarjetas 1 columna y break-inside avoid, celdas completas
    (white-space normal / text-overflow clip; nota larga con celda de 282 px y texto
    íntegro — el único desborde es la palabra «anticorrosión.» en columna estrecha,
    matiz aceptado), «¿Seguro?» y edición abiertas sin estorbar (marca restaurada,
    confirmación oculta, datos visibles); **375 intacto** (sin desbordes, apilado,
    thead clipado, botón 50 px); **regresiones 010/011/012** (conmutador+aria-pressed,
    chips, alta en listado conservando la vista y storage, borrado con confirmación en
    fila → «Cliente eliminado», edición y guardado desde fila, estados vacíos,
    importar basura → «El archivo no tiene un formato JSON válido» sin tocar datos,
    importar válida → panel + «Clientes importados», exportar sin errores); **cero
    escrituras** (solo `gestorClientes`, claves sin cambios); print nativo restaurado
    tras los espías; **consola limpia** (sin mensajes de la app); datos borrados y
    arranque vacío; `node --test` 72/72)*

- [x] **T-08 — Documentación y cierre**
  - **Descripción:** `AGENTS.md` (funcionalidad 013), línea en `MEMORY.md` con el número
    de tests, marcar spec/plan/tasks como implementados y commits por fases.
  - **RF:** RF-1104.
  - **Hecho cuando:** docs al día, `node --test` en verde y commits hechos. *(Hecho:
    2026-10-16 — entrada «Impresión del listado (spec 013)» en `AGENTS.md`; `plan.md`
    con estado «aprobado … e implementado»; línea de la 013 en `MEMORY.md` (72 tests,
    decisiones clave) y «Próximos pasos» actualizados (quedan 014 y 015; después,
    regenerar el `.exe`); `node --check logica.js app.js` OK; `node --test` 72/72;
    commit de fase)*
