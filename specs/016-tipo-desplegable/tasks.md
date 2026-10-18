# Tareas — Spec 016 · Desplegable «Tipo de cliente» con «Otros» de texto

> **Dependencia:** empezar solo **después de cerrar la 015-provincia** (comparte
> `index.html`, `app.js` y `styles.css`; `logica.js` y `test-*.js` se tocan **cero**
> veces). Orden de dependencia estricto: T-01 → T-02 → … → T-07.
> **Fase especial:** sin consultar al usuario (spec ya aprobada por QA, 2026-10-17).

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md` en `specs/016-tipo-desplegable/` con las 6 decisiones
    del usuario y los opcionales del QA aplicados.
  - **RF:** RF-1401 a RF-1407.
  - **Hecho cuando:** el QA del reviewer la aprueba. *(Hecho: 2026-10-17 —
    **APROBADO**, solo opcionales no bloqueantes, todos recogidos en el plan.)*

- [x] **T-02 — `index.html`: sustituir los chips por el `<select>` + campo condicional**
  - *(Hecho: 2026-10-17 — bloque de chips (128-145) sustituido por `<select id="tipo"
    name="tipo">` con las 5 opciones en orden («Sin tipo» `selected`) + campo
    condicional `#campo-tipo-otro` con `hidden`, etiqueta «Escribe el tipo de
    cliente», `placeholder="p. ej. Toldos"` y `maxlength="40"`; humo en navegador:
    5 opciones correctas, campo oculto al cargar; `node --test` 122/122.)*
  - **Descripción:** sustituir el bloque de tipos (líneas 128-145: título
    «Tipos de cliente», `<div class="chips" id="chips-tipos">` y el campo
    «Añadir otro tipo» con `#tipo-otro` + `#boton-anadir-tipo`) por:
    `<select id="tipo" name="tipo">` con las 5 opciones en orden — vacía
    **«Sin tipo»** (`selected`, por defecto en alta), **«Tela»**, **«Espuma»**,
    **«Estructuras»**, **«Otros»** — y, justo debajo, el campo condicional
    `<div class="campo campo-condicional" id="campo-tipo-otro" hidden>` con
    `<input type="text" id="tipo-otro" name="tipo-otro" autocomplete="off"
    maxlength="40" placeholder="p. ej. Toldos">` y su etiqueta
    «Escribe el tipo de cliente». **Se elimina el campo «Añadir otro tipo»**
    actual (opcional QA 1). Mismo hueco que hoy los chips (tras «Provincia», antes
    de «Información adicional»).
  - **RF:** RF-1401, RF-1402.
  - **Hecho cuando:** el formulario muestra el desplegable con las 5 opciones en el
    orden pedido y «Sin tipo» seleccionada; el campo condicional existe en el DOM,
    oculto (`hidden`), con su etiqueta, `placeholder` y `maxlength="40"`; el bloque
    de chips y el campo «Añadir otro tipo» han desaparecido del HTML; el resto del
    formulario no cambia.

- [x] **T-03 — `app.js`: quitar los chips y añadir la lógica del desplegable (submit + `change`)**
  - *(Hecho: 2026-10-17 — eliminados `tiposFormulario`, `pintarChipsTipos`,
    `anadirTipoDelCampo`, listeners de chips/botón/Enter y la llamada de arranque;
    añadidos `campoTipo`/`campoTipoOtro`/`campoTipoOtroContenedor`,
    `alternarCampoOtro()` (oculta **y vacía** el campo), listener `change`,
    `tiposDesdeFormulario()` y su uso en alta y `guardarEdicion`;
    `resetearFormulario()` llama a `alternarCampoOtro()`. Mapeo verificado en
    `localStorage`: «Sin tipo»→`[]`+`tipo:""`; «Otros»+«Toldos»→`["Toldos"]`;
    «Otros» vacío→`["Otros"]`; «Otros»+espacios→`["Otros"]`; «Otros»+«Tela»→`["Tela"]`;
    cambio «Otros»→«Espuma» descarta el texto. `node --check` OK y 122/122.)*
  - **Descripción:** **eliminar** el bloque de tipos de la 014: `let tiposFormulario`
    (línea 67), los `getElementById` de `#chips-tipos`/`#tipo-otro`/`#boton-anadir-tipo`
    (150-152), `pintarChipsTipos` (156-183), `anadirTipoDelCampo` (188-193), el
    listener `click` de chips (196-214), `quitarTipoDelFormulario` (219-232), los
    listeners de `#boton-anadir-tipo` y del `Enter` (234-242) y la llamada
    `pintarChipsTipos()` del arranque (949). **Añadir**: `const selectorTipo =
    document.getElementById("tipo")` y `const campoTipoOtro =
    document.getElementById("campo-tipo-otro")`; `alternarCampoOtro()` (si el
    select vale «Otros» → `hidden = false`; si no → `hidden = true` **y**
    `formulario.tipoOtro.value = ""`, descartando el texto); listener `change` del
    select → `alternarCampoOtro()`; helper `tiposDesdeFormulario()` (plan §2.2:
    `[]` / `[fijo]` / `[texto]` / `["Otros"]`); en el `submit`, sustituir
    `tiposFormulario` por `tiposDesdeFormulario()` en **alta** (línea 270) y en
    `guardarEdicion` (línea 487); en `resetearFormulario`, ocultar el campo
    condicional tras el `formulario.reset()`.
  - **RF:** RF-1401, RF-1402, RF-1403.
  - **Hecho cuando:** `node --check app.js` OK; al elegir «Otros» aparece el campo
    justo debajo y al elegir cualquier otra opción se oculta **y no ocupa espacio**
    (altura del formulario medida antes/después); el alta guarda según el mapeo
    (verificado en `localStorage`: «Tela» → `["Tela"]`; «Otros» vacío → `["Otros"]`;
    «Otros»+«Toldos» → `["Toldos"]`; «Otros»+«Tela» → `["Tela"]`; «Sin tipo» → `[]`
    y `tipo: ""`); el alta con «Otros»+texto y cambio a «Espuma» guarda `["Espuma"]`
    (texto descartado); `node --test` sigue **122/122**.

- [x] **T-04 — `app.js`: `iniciarEdicion` carga desplegable + campo según `tiposCliente`**
  - *(Hecho: 2026-10-17 — carga por `tiposCliente(cliente)[0]`: fijo → select en ese
    valor y campo oculto; libre → select «Otros» + texto; **literal «Otros» → select
    «Otros» con campo VACÍO** (corrección aplicada en la validación RF: la primera
    versión cargaba «Otros» en el campo, contra RF-1404); vacío → «Sin tipo» y
    oculto; multi-tipo → su **primer** tipo. Round-trips byte-idénticos
    (literal 1652 bytes antes/después y «Toldos»).)*
  - **Descripción:** sustituir las líneas 447-450 (`tiposFormulario =
    tiposCliente(cliente).slice(); pintarChipsTipos();`) por la carga del
    desplegable según RF-1404 (plan §3.3): `tiposCliente(cliente)[0] ?? ""` →
    vacío: select en `""` («Sin tipo») y campo oculto; fijo: select en ese valor y
    campo oculto; texto libre o literal «Otros»: select en `"Otros"`, campo con el
    texto (vacío si es el literal «Otros») y visible.
  - **RF:** RF-1404.
  - **Hecho cuando:** editar un cliente «Tela» deja el select en «Tela» y el campo
    oculto; editar uno «Toldos» lo deja en «Otros» con «Toldos» en el campo; editar
    uno con `tipos: ["Otros"]` lo deja en «Otros» con el campo **vacío**; editar uno
    sin tipos lo deja en «Sin tipo» y oculto; editar un multi-tipo (sembrado a
    mano) muestra su **primer** tipo y al guardar se conserva **solo** ese
    (limitación documentada); guardar sin tocar es byte-idéntico.

- [x] **T-05 — `styles.css`: estilos del `<select>` y del campo condicional; limpieza de chips**
  - *(Hecho: 2026-10-17 — `.campo select` (ancho 100%, 49 px de alto, tinta/superficie,
    borde y radio de siempre, sin sombras) y `.campo-condicional[hidden]{display:none}`
    sustituyen a `.campo-titulo`/`.anadir-tipo`; borrados `.chip-libre`, `.chip-texto`,
    `.chip-quitar*` (y el comentario que citaba `.chip-texto`); **no** se tocaron
    `.chips`, `.chip`, `.chip-marca`, `.chip.marcado*` ni `.chip:focus-visible`
    (selector de campos de la 012, verificado: 12 chips, 1 marcado).)*
  - **Descripción:** añadir `.campo select` (ancho completo, `min-height: 44px`,
    tinta/superficie, borde y radio de siempre, **sin sombras**, foco visible con
    `outline`), `.campo-condicional[hidden] { display: none; }` (garantía de que no
    ocupe espacio, opcional QA 3) y `.campo-condicional { margin-top: 8px; }`.
    **Borrar** los estilos de chips de tipos sin uso: `.anadir-tipo` (154-170),
    `.chip-libre`, `.chip-texto`, `.chip-libre:hover`, `.chip-quitar`,
    `.chip-quitar:hover`, `.chip-quitar:focus-visible` (481-537). **No tocar**
    `.chips`, `.chip`, `.chip-marca`, `.chip.marcado*` ni `.chip:focus-visible` (el
    selector de campos del listado, spec 012, los usa).
  - **RF:** RF-1406.
  - **Hecho cuando:** el desplegable y el campo condicional siguen la paleta (tinta y
    superficie, borde de siempre), tienen foco visible y objetivo táctil ≥ 44 px; a
    **375 px** no hay desbordes ni scroll horizontal con el campo visible; los chips
    del listado (012) siguen viéndose igual que antes.

- [x] **T-06 — Verificación completa en navegador (Chrome DevTools)**
  - *(Hecho: 2026-10-17 — checklist completo: desplegable (5 opciones, «Sin tipo» por
    defecto, `change`), campo condicional (solo en «Otros», `hidden` sin espacio,
    placeholder y maxlength 40), las 6 ramas del mapeo guardadas y leídas en
    `localStorage`, edición round-trip (fijo / libre / literal «Otros» / sin tipos /
    multi-tipo → primer tipo) byte-idéntica, cambio «Otros»→fijo descarta el texto,
    filtros por pertenencia (Tela: 2 con el multi visible; Otros: 2; Todos: 4→10),
    buscador («multi»→1), mapa (iframe + enlace en «Con Mapa»), listado (filas +
    selector de 12 chips con 1 marcado), impresión (`beforeprint` → cabecera
    «Gestor de Clientes»), botones exportar/importar, borrado con «¿Seguro? · Sí,
    eliminar / No» y cancelación sin pérdida, alta con filtro de provincia activo
    (reset documentado a «Todos»+«Todas» y el cliente nuevo visible), sin claves
    nuevas de `localStorage` (solo `gestorClientes`), **375 px sin desbordes con el
    campo visible** (375/375, select 49 px, input 46 px), consola limpia,
    `node --test` **122/122** y datos de prueba borrados.)*
  - **Descripción:** checklist del plan §7: desplegable (5 opciones, «Sin tipo» por
    defecto, teclado), campo condicional (solo en «Otros», sin espacio oculto,
    placeholder, maxlength 40), guardado de cada opción comprobado en `localStorage`,
    edición *round-trip* (fijo / libre / literal «Otros» / sin tipos / multi-tipo),
    cambio «Otros»→fijo descartando texto, filtros por pertenencia, buscador, mapa,
    listado y selector de campos (chips del listado intactos), impresión, exportar/
    importar, borrado con «¿Seguro?», alta con filtro de provincia activo, datos
    antiguos sin reescribir, 375 px, consola limpia.
  - **RF:** RF-1401 a RF-1407 (interfaz y regresiones).
  - **Hecho cuando:** todos los criterios de aceptación de la spec cumplidos en
    Chrome DevTools; `node --test` **122/122**; consola limpia; datos de prueba
    borrados (`localStorage.removeItem("gestorClientes")`); `escritorio/` sin
    cambios en `git status`.

- [x] **T-07 — Documentación y cierre**
  - *(Hecho: 2026-10-17 — `AGENTS.md` (entrada «Desplegable de tipo (spec 016)» +
    avisos en las entradas 008 y 014), `MEMORY.md` (línea 016 + «001–016 cerradas»,
    líneas ≤ 50), spec/plan/tasks marcados **Cerrada — APROBADO / implementado y
    validado**, `node --test` **122/122** y commit único con árbol limpio.)*
  - **Descripción:** `AGENTS.md` (el formulario de tipos vuelve al desplegable
    «Tipo de cliente» + campo condicional «Otros» de la 008; el modelo de datos, la
    lógica y el esquema de la 014/015 quedan intactos), línea de la 016 en
    `MEMORY.md` (con la nota de que el instalador sigue pendiente de regenerar, ahora
    con 014+015+016 dentro), marcar spec/plan/tasks como implementados y commit
    único con árbol limpio.
  - **RF:** RF-1407.
  - **Hecho cuando:** docs al día, `node --test` en verde (122/122), commit hecho y
    árbol limpio.
