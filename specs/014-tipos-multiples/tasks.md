# Tareas — Spec 014 · Tipos de cliente múltiples

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md` (aprobada, con las 6 correcciones + 4 opcionales del QA de
    fase aplicados y reordenada a secciones 1–6 al estilo 012/013), `plan.md` y este
    `tasks.md`.
  - **RF:** RF-1201 a RF-1211.
  - **Hecho cuando:** el usuario aprueba spec, plan y tareas. *(Hecho: 2026-10-16 —
    autorización de fase del usuario; correcciones del QA aplicadas al spec)*

- [x] **T-02 — Lógica pura: migración, tipos efectivos, guardado, filtros y búsqueda + tests (`logica.js` + `test-logica.js`)**
  - **Descripción:** `TIPOS_FIJOS`, `normalizarTipos`, `tiposCliente` (prioridad
    Decisión 12: no array → desde `tipo`; vacío + `tipo` → reconstruido; con elementos →
    `tipo` ignorado), `migrarTipos` ampliada (mismo nombre/contrato,FOAM dentro de
    `tipos`, reescribe `tipo` = `tipos[0] ?? ""`, sin escritura si no cambia),
    `alternarTipoFijo` (off/on → al final), `añadirTipoLibre` (recorta, fijo exacto →
    marca fijo, sin duplicados, **sin truncar**), `quitarTipoLibre`,
    `construirCliente`/`actualizarCliente`/`aplicarEdicion` con `tipos` opcional
    (sin él, deriva del `tipo` string legado), `filtrarClientes` por pertenencia,
    `textoBusquedaCliente` con todos los tipos, `unirTiposTexto` (« + » / «Sin tipo»),
    `construirCeldas` con la celda unida e `importarClientes` conservando `tipos`;
    exportar todo en `module.exports`; tests en rojo→verde (incluidos los de claves
    actualizados a 13 campos).
  - **RF:** RF-1201, RF-1202, RF-1203 (lógica), RF-1204, RF-1205, RF-1206, RF-1208,
    RF-1209, RF-1211.
  - **Hecho cuando:** `node --test` en verde con los tests nuevos (72 actuales intactos
    salvo los de claves, que pasan a incluir `tipos`), sin DOM y sin tocar `app.js`;
    cubiertos los casos: migración idempotente por referencia, `tipos: []` + `tipo: "Tela"`
    reconstruido, `tipos` con elementos ignora `tipo` (FOAM incluido), no array → desde
    `tipo`, alternar off/on al final, «Tela» escrita marca el fijo, 41+ caracteres sin
    truncar, pertenencia en filtros, búsqueda multi-palabra entre tipos, celda
    `Tela + Espuma`, importar con ambos formatos y literales de error intactos.
    *(Hecho: 2026-10-17 — **105 tests en verde** (`node --test`), `node --check` limpio;
    rojo verificado con 34 fallos previos a implementar)*

- [x] **T-03 — Chips del formulario en HTML y CSS (`index.html` + `styles.css`)**
  - **Descripción:** fuera el `<select id="tipo">` y `#campo-tipo-otro` (008); dentro,
    `#chips-tipos` (contenedor; los fijos los genera `app.js` desde `TIPOS_FIJOS`) y el
    campo «Añadir otro tipo» (`#tipo-otro` con `maxlength="40"` **solo aquí** +
    `#boton-anadir-tipo`). CSS: reutilizar `.chips`/`.chip`/`.chip.marcado` de la 012,
    `.chip-quitar` para la «×», badges de tarjeta con `.etiqueta-*` existentes y `gap`;
    envoltura a 375 px.
  - **RF:** RF-1203, RF-1207 (estos badges).
  - **Hecho cuando:** el formulario muestra los tres chips fijos como casillas y el campo
    de añadir; sin desplegable ni campo «Otros»; a 375 px los chips envuelven sin
    desbordes; en pantalla no cambia nada más y la consola no da errores del cambio de
    HTML (el JS de la 008 aún se retira en T-04).
    *(Hecho: 2026-10-17 — **105 tests en verde**, `node --check` limpio; verificado en
    navegador: 3 chips fijos pintados desde `TIPOS_FIJOS` (`role=checkbox`,
    `aria-checked`, `data-tipo`, 46 px), campo `#tipo-otro` con `maxlength="40"` y botón
    «Añadir», sin `<select>` ni `#campo-tipo-otro`, móvil 375 sin desbordes, consola
    limpia, datos de prueba borrados. `app.js` tocado lo mínimo: retirado el JS de la 008
    que rompía la carga y añadido `pintarChipsTipos()` provisional sin estado ni
    listeners —T-04 la completa—; edición interina conserva los tipos existentes)*

- [x] **T-04 — `app.js`: recoger y guardar los tipos del formulario (web y escritorio)**
  - **Descripción:** `let tiposFormulario = []` en memoria; `pintarChipsTipos()` (fijos
    con `aria-checked`, libres con «×»); listeners de alternar/añadir (clic **y** Intro)/
    quitar; `resetearFormulario` limpia `tiposFormulario`; `iniciarEdicion` carga
    `tiposCliente(cliente).slice()`; submit pasa `tiposFormulario` a
    `construirCliente`/`aplicarEdicion`; **fuera** `sincronizarTipoOtro`,
    `cargarTipoEnFormulario` y el listener `change` del desplegable. `guardarClientes`
    no se toca: ambas ramas (web/escritorio) serializan `clientes` completos con `tipos`.
  - **RF:** RF-1203, RF-1204, RF-1210.
  - **Hecho cuando:** alta con «Tela»+«Espuma»+libre «Toldos» guarda
    `tipos: ["Tela","Espuma","Toldos"]` y `tipo: "Tela"` en `localStorage` (y en la rama
    escritorio); guardar sin tipos escribe `tipos: []` y `tipo: ""`; editar carga los
    chips (fijos marcados, libres con «×») y quitar un chip guarda los cambios sin tocar
    el resto de campos; teclado (Tab/Intro/Espacio) operable con foco visible; no se
    crea ninguna clave nueva.
    *(Hecho: 2026-10-17 — **105 tests en verde** (`node --test`) y `node --check` limpio.
    Verificado en navegador: alta [Tela, Toldos, Espuma] → `tipos: ["Tela","Toldos","Espuma"]`
    y `tipo: "Tela"` (orden de adición, Decisión 5; «Espuma» escrita a mano marca el fijo,
    «tela» minúscula crea libre, repetido no duplica); alta sin tipos → `tipos: []` y
    `tipo: ""`; edición carga fijos marcados (`aria-checked`) y libres con «×»
    (`aria-label`), quitar + «Guardar cambios» → `tipos`/`tipo` reajustados con `id`,
    `fecha` y demás campos intactos, guardar sin tocar = JSON idéntico y cancelar deja
    el cliente sin dañar (estado en memoria descartado); **rama escritorio** con
    `window.gestorDatos` simulado por `initScript` (espías `leer`/`escribir`): 1 lectura
    + 1 escritura con `tipos` y `tipo` derivado, `localStorage` de la web intacta;
    teclado: Shift+Tab hasta el chip con `:focus-visible`, Espacio alterna dos veces con
    el foco conservado en el chip repintado, Intro en «Añadir otro tipo» añade **sin**
    disparar el submit; 375 px: 7 chips en 4 líneas, `scrollWidth` 375 (sin desbordes),
    chips 46 px y «×» 44×44 **con etiquetas cortas** (la medición con tipos de 40+
    caracteres se corrigió en la ronda del reviewer: ver «Corrección reviewer» abajo);
    sin claves nuevas (solo `gestorClientes`), consola limpia y
    datos de prueba borrados. Retirada la guarda interina de T-03
    (`aplicarEdicion(…, tiposCliente(cliente))` → `tiposFormulario`); `sincronizarTipoOtro`,
    `cargarTipoEnFormulario` y el `change` del desplegable ya no existían en `app.js`
    (se retiraron al eliminar el JS de la 008 en T-03). `styles.css` sin cambios:
    `.chip-libre`/`.chip-quitar` cubrían todo lo necesario)*
  - **Corrección reviewer (ronda 1, 2026-10-17)**: la medición anterior solo
    valía con etiquetas cortas — con un tipo libre de 40 caracteres (el
    `maxlength` del input) la «×» se estrechaba a **40,56 px** y con uno
    importado de 47 a **36,19 px** (flex-shrink dentro del chip). Arreglo en
    CSS + el pintado del chip: el texto del chip libre va ahora en
    `<span class="chip-texto">` con `title` (muestra el tipo completo);
    `styles.css` añade `.chip-texto` (`min-width: 0` + `overflow: hidden` +
    `text-overflow: ellipsis` + `white-space: nowrap`), `flex-shrink: 0` en
    `.chip-quitar`, y `min-width: 0` en `.chip-libre` y `.campo` (el track grid
    `1fr` puede ser más estrecho que el contenido sin desbordar). Re-verificado
    a 375 px con chips de 40 y 47 caracteres: «×» **44×44** en ambos,
    `scrollWidth` 375 (sin desbordes), recorte con «…» + `title` completo, foco
    `:focus-visible` intacto, etiqueta a 14,4 px legible, chips cortos sin
    recorte («Toldos» 106,41 px) y escritorio 1280 sin cambios. `node --test`
    105/105. Commit: «Spec 014-tipos-multiples: asegura la X de 44px en chips
    largos (reviewer)»*

- [x] **T-05 — Tarjeta con badges y canto del primer tipo + celda del listado (`app.js`)**
  - **Descripción:** `crearTarjeta` pinta **un badge por tipo** (`tiposCliente` +
    `claseTipo`; sin tipos → «Sin tipo» de siempre) y el canto con el **primer tipo**;
    la fila del listado usa el canto del primer tipo efectivo; la celda Tipo ya viene
    unida de `construirCeldas` (sin cambios aquí).
  - **RF:** RF-1207, RF-1208.
  - **Hecho cuando:** `["Tela","Espuma","Toldos"]` muestra tres badges (índigo, mostaza,
    violeta) con canto **índigo**; la celda del listado dice `Tela + Espuma + Toldos`
    (con «…» + `title` si es larga); un cliente de un tipo se ve **idéntico** al actual
    y sin tipos sigue con «Sin tipo» y sin canto.
    *(Hecho: 2026-10-17 — **105 tests en verde** (`node --test`), `node --check` limpio,
    `logica.js` intacto. Verificado en navegador: `["Tela","Toldos"]` → 2 badges
    (`.etiqueta-tela` índigo + `.etiqueta-otros` violeta) con canto **índigo**;
    `["Toldos","Tela"]` → canto **violeta**; 6 tipos → 6 badges que envuelven en 2
    líneas; 1 tipo → badge único a la derecha (aspecto actual); 0 tipos → «Sin tipo»
    sin canto (`tarjeta-`); listado con los 11 campos → **una sola columna «Tipo»**
    con `Tela + Toldos` (texto plano, «…»+`title` intactos) y canto por el primer
    tipo; tipo importado con comillas/etiquetas (`Lona "especial" <b>x</b>`) →
    escapado con `escapar()` en los badges (sin `data-*`/`title` en ellos, no hace
    falta `escaparAtributo`) y sin atributos rotos; impresión con las reglas reales
    del `@media print` inyectadas como proxy → tarjetas a una columna, badges
    legibles y cantos conservados; 375 px sin desbordes (`scrollWidth` 375) en las
    dos vistas; regresiones de filtro («Tela» incluye a los multis) y búsqueda
    («espuma») intactas; consola limpia y datos de prueba borrados. `styles.css`
    solo añade `.etiquetas` (grupo flex de los badges en la cabecera))*

- [x] **T-06 — Filtros por pertenencia, contador y estados vacíos (`app.js`, integración)**
  - **Descripción:** verificar/ajustar el pintado para que las pestañas usen el
    `filtrarClientes` por pertenencia de T-02 sin tocar textos, colores ni `data-filtro`;
    contador y estados vacíos («No hay clientes de tipo X» con la etiqueta de la
    pestaña; búsqueda sigue mandando sobre el filtro) intactos.
  - **RF:** RF-1205, RF-1206.
  - **Hecho cuando:** «Tela+Espuma» aparece en «Tela» y «Espuma»; «Tela+Toldos» en «Tela»
    y «Otros»; los sin tipos solo en «Todos»; el contador refleja filtro + búsqueda como
    siempre; «espuma» y «tela toldos» encuentran al cliente por el buscador; los mensajes
    vacíos y sus textos no han cambiado.
    *(Hecho: 2026-10-17 — **105 tests en verde** (`node --test`), `node --check app.js`
    limpio. **`app.js` y `styles.css` sin cambios**: `visiblesActuales()` ya componía
    `filtrarClientes` (pertinencia de T-02) + `buscarClientes` + `ordenarClientes`, y los
    estados vacíos/contador se pintan ANTES de ramificar tarjetas/listado (comunes a las
    dos vistas). Verificado en navegador con 5 clientes sembrados (fijo simple, multi
    fijo `Tela+Espuma`, multi con libre `Tela+Toldos`, solo libre `Toldos`, sin tipos):
    pestaña «Tela» → 3 (incluye los dos multis), «Espuma» → 1, «Estructuras» → 0 con
    «No hay clientes de tipo Estructuras…», «Otros» → 2 (solo libre + Tela+Toldos),
    «Todos» → 5 — **mismo número y mismos nombres en tarjetas y listado**; el sin tipos
    solo en «Todos». Búsqueda: «tela vega» → 1 (tipo + otro campo), «espuma» → 1 (segundo
    tipo), «toldos» → 2 (libre), «tela toldos» → 1 (multi-palabra entre tipos); filtro
    Espuma + «vega» → vacío con «No hay coincidencias para «vega»…» idéntico en las dos
    vistas. Pestañas intactas (textos y `data-filtro`). Regresiones: 011 exportar con
    `tipos` + `tipo` en los 5; 013 guardia de imprimir (0 visibles → aviso sin
    `window.print`, con visibles → imprime); 012 conmutador, chips (columna «Tipo» con
    `Tela + Toldos`), editar desde la fila (marca de edición, cancelar, filtro
    conservado); alta desde filtro Espuma → pestaña «Todos», buscador limpio, **vista
    intacta** (listado) y `tipos: ["Estructuras"]` guardado. Móvil 375 px (emulación
    viewport): `scrollWidth` 375 en las dos vistas. Consola sin errores ni avisos;
    `gestorClientes` borrada al terminar)*

- [x] **T-07 — Integración y verificación completa (navegador)**
  - **Descripción:** checklist del plan §8: exportar/importar con ambos formatos (antiguo
    solo `tipo`, nuevo con `tipos` array y no array, FOAM), migración en las **tres
    rutas** (web localStorage, escritorio `clientes.json` simulado con un doble de
    `window.gestorDatos`, importación), idempotencia sin escritura, impresión (013) con
    la celda unida, listado (012), regresiones 002/005/011, teclado, 375 px, sin claves
    nuevas y consola limpia; datos de prueba borrados.
  - **RF:** RF-1201, RF-1202, RF-1209, RF-1210 (y regresión de todos).
  - **Hecho cuando:** todos los criterios de aceptación de la spec cumplidos en Chrome
    DevTools, `node --test` en verde y consola sin errores.
    *(Hecho: 2026-10-17 — acta de integración 10/10, **sin tocar código** (ni un solo
    fallo que arreglar): (1) **web** — `localStorage` sembrada con 4 clientes viejos de
    12 campos («Tela», «FOAM», libre «Toldos», vacío) → migrados (`tipos` array,
    `tipo` = primero, FOAM→Espuma, 13 campos) y **reescritos en storage**; 2ª recarga
    byte-idéntica (mismo length + hash). (2) **escritorio simulado** (`initScript` con
    doble `window.gestorDatos` espía): `leer()` con JSON viejo → 1 lectura + 1
    escritura con `tipos`+`tipo`, badges en pantalla correctos, `localStorage` de la web
    sin usarse; archivo dañado (`clientes: null`) → arranca vacía sin escrituras (el
    renombrado vive en `escritorio/main.js` de la 011, no simulable sin Electron; misma
    rama de lectura). (3) **importar** — viejo (solo `tipo` con FOAM) → migrado; nuevo
    (`tipos`+`tipo`) → intacto; mixto → RF-1202 («tipos» manda sobre `tipo: "FOAM"`,
    `tipos: []`+`tipo` → reconstruido, `tipos` no array → desde `tipo`); basura →
    literales intactos y datos sin tocar; flujo UI con contadores + «Sí, reemplazar» +
    reset de filtro/búsqueda. (4) **formulario** — 3 fijos desde `TIPOS_FIJOS`
    (`role=checkbox`/`aria-checked`), «Toldos» por botón, «Tela» escrita + Intro marca
    el fijo sin libre **y sin disparar submit**, «tela» minúscula → libre, repetido sin
    duplicado, «   » nada, «×» quita, `maxlength="40"`, sin `<select>` ni 008; alta
    `[Tela, Espuma]` → `tipo: "Tela"`, alta sin tipos → `[]`/`""`, edición carga chips,
    cancelar deja el cliente byte-idéntico y guardar conserva `id`/`fecha`/teléfono;
    importación con tipo de **51 caracteres llega completo**. (5–6) **filtros/tarjeta/
    listado/papel** — pertenencia («Tela»→3 incl. multis, «Otros»→3, «Estructuras»→0
    con su mensaje), buscador («espuma», «tela toldos» multi-palabra entre tipos),
    badges por tipo en su color con canto del **primer** tipo («Sin tipo» sin canto),
    celda `Tela + Toldos` con «…»+`title`, `beforeprint` fresco («Gestor de Clientes ·
    Filtro: Tela · Búsqueda: «toldos»»), botón con guardia (0 visibles → aviso sin
    `window.print`) y reglas `@media print` 013 intactas (thead, 1 columna, sin «…»,
    `break-inside`). (7) **exportar** — JSON con `tipos`+`tipo` en los 6,
    `clientes-2026-10-17.json`, **ida y vuelta idéntica**. (8) **375 px** (`emulate
    375x812x2,mobile,touch`) — `scrollWidth` 375 en formulario (9 chips en 6 líneas,
    chip 46 px, «×» 44), tarjetas y listado; teclado: Tab alcanza los 3 chips tras los
    inputs del form, Espacio/Intro alternan con el foco conservado en el chip
    repintado. (9) **regresiones** — 002 alta/edición/borrado «¿Seguro? · Sí/No» con
    toasts, 004 mapa iframe+enlace, 005, 010 «Cliente guardado», 011, 012 conmutador,
    013. (10) **cero claves nuevas** (`Object.keys(localStorage)` ⇒ solo
    `gestorClientes`; `diarioEstudio.tema` es ajena de otra app `file://` compartida,
    no la crea esta app), `sessionStorage` vacía, **`node --test` 105/105**,
    `node --check` limpio, consola sin errores de la app y datos de prueba borrados
    (arranque limpio verificado tras recarga)*

- [x] **T-08 — Documentación y cierre**
  - **Descripción:** `AGENTS.md` (esquema con `tipos`, formulario con chips, filtros por
    pertenencia, `tipo` como compatibilidad solo de lectura), línea de la 014 en
    `MEMORY.md`, marcar spec/plan/tasks como implementados y commits por fases.
  - **RF:** RF-1211.
  - **Hecho cuando:** docs al día, `node --test` en verde y commits hechos.
    *(Hecho: 2026-10-17 — **8/8 tareas**; `AGENTS.md` («Datos» con esquema de 13 campos
    `tipos`+`tipo`, entradas de filtros/008/014), `plan.md` («…e implementado»),
    `spec.md` (Estado → Implementada) y `MEMORY.md` (014 cerrada, 105 tests, próximos
    pasos) al día; `node --check logica.js app.js` limpio, **`node --test` 105/105** y
    commit «Spec 014-tipos-multiples: esquema tipos + migracion, chips en formulario,
    filtros por pertenencia y cierre»)*
