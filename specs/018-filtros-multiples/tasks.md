# Tareas — Spec 018 · Filtros múltiples por tipo y provincia (dos desplegables con casillas)

> **Dependencia:** empezar solo **después de la 016-casillas (2026-10-20)** y de la
> 017 (estado actual: `node --test` **141/141**, git limpio, commit `b98ff29`).
> Comparte `index.html`, `styles.css`, `app.js`, `logica.js`, `hoja-impresion.css`,
> `test-logica.js` y `test-provincia.js`. `escritorio/` **no se toca** (solo se
> regenera el instalador en T-08). Orden de dependencia estricto: T-01 → T-02 →
> … → T-08.
> **Fase especial:** sin consultar al usuario (spec aprobada 2026-10-21;
> «Dudas abiertas: ninguna»). Decisiones del usuario ya tomadas y no reabribles:
> dos desplegables con casillas, pestañas fuera, buscador intacto, casilla
> «Sin provincia» incluida.
> **Enmienda 2026-10-22 (aprobada por el usuario durante T-07):** la semántica
> del grupo tipo pasa de **«o» a «y»** (intersección, el «filtro exacto» de la
> HU-1): `filtrarClientes` y sus tests adaptados (1 test nuevo → **166**); las
> descripciones de T-02/T-03 que dicen «o» para el grupo tipo se leen como «y».

---

- [ ] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md` en `specs/018-filtros-multiples/` con los 10 RF
    (RF-1601…1610) y las 11 decisiones, incorporando las decisiones del usuario
    (2026-10-21): dos desplegables con casillas (Tipo + Provincia), pestañas
    fuera, buscador intacto y casilla fija «Sin provincia».
  - **RF:** RF-1601 a RF-1610.
  - **Hecho cuando:** la spec está aprobada. *(Hecho: 2026-10-21 — aprobada por
    el usuario; sin dudas abiertas.)*

- [x] **T-02 — `logica.js` + tests: filtrado por listas y validación de marcas (rojo→verde)**
  - **Descripción:** (a) **`filtrarClientes(lista, marcasTipos)`** con firma de
    array (plan §2 y D1): `[]` o entrada no-array → lista completa; «o» entre
    marcas — fijo por pertenencia (`tiposCliente`), «Otros» → algún tipo no fijo
    (los que también llevan fijos entran), «Sin tipo» → `tiposCliente` vacío—;
    (b) **`filtrarPorProvincia(lista, provincias)`** con array y la constante
    **`SIN_PROVINCIA = ""`** como marca de la casilla fija: `[]` → todos, nombre
    real → `coincideProvincia` (normaliza), `""` → provincia vacía o ausente, y
    provincia escrita literalmente «Sin provincia» que pasa **solo** por su
    coincidencia de texto (nunca por la fija; colisión del RF-1603); (c)
    **`marcasProvinciaValidas(opciones, marcas)`** que sustituye a
    `provinciaValida` (**retirada** con sus tests): conserva marcas que siguen
    entre las opciones por `normalizar` alineadas a la primera forma guardada y
    **conserva siempre `""`**; (d) **`nombreMarcasProvincias(marcas)`** (`""` →
    «Sin provincia»); (e) `module.exports` al día. Tests: adaptar las ~10 llamadas
    existentes a `filtrarClientes` a listas (`test-logica.js` 198-221/917-925,
    `test-provincia.js` 123) y los de `provinciaValida`; añadir los nuevos del
    plan §2 áreas (a)(b)(c) — «o» con 1 y N, «Otros», «Sin tipo», cinco marcados,
    normalización, sin-provincia con `[]`/`[""]`/reales sin `""`, colisión, huérfanas
    y fija inmutable—. **Nada más se toca en `logica.js`** (buscador, saneado,
    fechas, catálogo, casillas del formulario, PDF, importación intactos).
  - **RF:** RF-1602, RF-1603, RF-1604, RF-1605 (lógica), RF-1610(a)(b)(c).
  - **Hecho cuando:** `node --check logica.js` OK; `node --test` en rojo→verde y
    **≥ 141** totales; los tests ajenos (buscador, saneado, fechas, catálogo,
    casillas del formulario, `nombreArchivoPdf`…) **intactos**; ninguna llamada
    vieja con string queda sin adaptar (grep de `filtrarClientes(` y
    `provinciaValida(` sin restos). *(Hecho: 2026-10-21 — **155/155** en verde
    (+14 tests nuevos); SIN_PROVINCIA, marcasProvinciaValidas y
    nombreMarcasProvincias añadidas. **Nota de transición**: `provinciaValida`
    NO se retira todavía — es un adaptador temporal delegando en
    `marcasProvinciaValidas` para no romper `app.js` viejo (T-04 la retira con el
    `<select>`); `filtrarClientes`/`filtrarPorProvincia` ya son solo arrays, así
    que el filtro de la app vieja queda sin efecto (sin crashes) hasta T-04.)*

- [x] **T-03 — `logica.js` + tests: cabecera de impresión y estados vacíos (rojo→verde)**
  - **Descripción:** (a) **`textoContextoImpresion(marcasTipos, busqueda, marcasProvincias)`**
    con las dos listas (plan §2 y D-de-plan 1): piezas en orden **Filtro ·
    Provincia · Búsqueda**, cada grupo unido con «, » (provincias con
    `nombreMarcasProvincias`, «Sin provincia» impreso tal cual), piezas vacías
    omitidas, texto plano sin HTML; (b) **`mensajeEstadoVacio(busqueda, marcasTipos,
    marcasProvincias, total)`** con las ramas 1-3 del RF-1607 (prioridad búsqueda
    → filtros → vacío; variante «…o desmarca alguna casilla.» solo con marcas;
    piezas del ramo 2 «(Tipo: … · Provincia: …)» con solo las activas); (c)
    exports. Tests: adaptar los ~16 de `textoContextoImpresion` existentes a
    listas (`test-logica.js` 647-695, `test-provincia.js` 241-262) y añadir los
    nuevos del plan §2 área (d) — ambos grupos vacíos, 1 y N marcas por grupo,
    «Sin provincia» en la pieza Provincia, orden literal, comillas y acentos— y
    los de `mensajeEstadoVacio` (área (e)).
  - **RF:** RF-1607, RF-1608, RF-1610(d).
  - **Hecho cuando:** `node --check logica.js` OK; `node --test` **≥ 141** en
    verde con los tests nuevos; los literales del RF-1607 están **tal cual** en
    los tests (incluida la ausencia de «la pestaña "Todos"» y de «"Todas las
    provincias"»); `textoContextoImpresion` devuelve texto plano (sin marcas HTML).
    *(Hecho: 2026-10-21 — **165/165** en verde (+10 tests nuevos: 7 de
    `mensajeEstadoVacio`, 3 de RF-1608 en `test-provincia.js`; los ~16
    existentes adaptados a listas). Firmas: `textoContextoImpresion` ahora es
    **solo arrays** en los dos grupos — entrada no-array (strings del `app.js`
    viejo) degrada a «sin marcas»/pieza ausente **sin lanzar**, nunca como marca
    literal; `mensajeEstadoVacio(busqueda, marcasTipos, marcasProvincias, total)`
    nueva y exportada (`total` = clientes guardados, nombra la rama 3 «lista
    realmente vacía»; la rama de migración 011 la decide `app.js` sobre el
    literal devuelto). **Nota de transición para T-04/T-06**: `app.js` viejo
    sigue llamando a `textoContextoImpresion` con strings → la cabecera impresa
    pierde las piezas Filtro/Provincia (sin crash) hasta que T-04/T-06 pasen
    arrays; `app.js` aún no usa `mensajeEstadoVacio` (se conecta en T-05).)*

- [x] **T-04 — Barra completa: `index.html` + `styles.css` + `hoja-impresion.css` + `app.js`**
  - **Descripción:** (a) **`index.html`**: nuevo `<div class="barra-filtros">`
    **antes** del `.buscador` con los dos desplegables — `#filtro-tipo`
    (trigger `#trigger-tipo`, texto inicial «Tipo: Todos», panel `hidden` con las
    **cinco** casillas fijas Tela/Espuma/Estructuras/Otros/Sin tipo y «Limpiar»)
    y `#filtro-provincia` (trigger `#trigger-provincia`, «Provincia: Todas»,
    panel `hidden` vacío + «Limpiar»)—; **retirados** `<div class="filtros">` y
    el `<select id="filtro-provincia">` viejo; paneles con `role="group"` y
    `aria-label`. (b) **`styles.css`**: estilos de `.barra-filtros`, triggers
    (≥ 44 px, `ellipsis`+`min-width:0`), paneles (`max-height` + `overflow-y`,
    retro sin sombras) reutilizando el patrón de casillas del formulario,
    `hidden` con `display:none`, apilado 375 px; **retirados** `.filtros`,
    `.filtro`, `.filtro.activo`, `.filtro-provincia*` y la referencia muerta del
    comentario de la línea 130. (c) **`hoja-impresion.css`**: selectores de chrome
    oculto `.filtros`/`.filtro-provincia-bloque` → `.barra-filtros`. (d)
    **`app.js`**: estado `tiposFiltro`/`provinciasFiltro` (arrays en memoria) en
    lugar de `filtroActivo`/`filtroProvincia`; `pintarPanelTipo()` y
    `pintarPanelProvincia()` (casillas generadas con `escaparAtributo`, «Sin
    provincia» fija al final, **sin** validación todavía — T-05);
    `actualizarEtiquetas()` («Tipo: Tela, Espuma (2)», `title` completo y «…» si
    no cabe); abrir/cerrar panel (trigger, Escape en listener acotado, clic fuera,
    cerrar el otro, foco al trigger con `focus({preventScroll:true})`); «Limpiar»
    sin cerrar; `visiblesActuales()` con las firmas nuevas; contador intacto;
    borrado del handler de pestañas, del `<select>` viejo y de
    `pintarFiltroProvincia`.
  - **RF:** RF-1601, RF-1602, RF-1603, RF-1604, RF-1606 (interfaz), RF-1609
    (presentación pura: sin claves nuevas).
  - **Hecho cuando:** en navegador, la barra tiene **exactamente dos** controles y
    **cero** botones `data-filtro`; marcando casillas la lista/contador/etiqueta
    cambian al instante con el panel **abierto**; el escenario del acta
    tipo {Tela, Espuma} + provincia {Castellón} → solo B; «Limpiar» vacía el
    grupo sin cerrar; Escape y clic fuera cierran devolviendo el foco al trigger
    y sin mover el scroll; dos paneles nunca a la vez; el buscador, el listado,
    el mapa y la vista previa de la 017 siguen intactos; 375 px sin desbordes;
    `node --check app.js` OK y `node --test` **≥ 141**; consola limpia.
    *(Hecho: 2026-10-21 — **165/165** intactos (cero tests tocados) y
    `node --check app.js` OK. Navegador (Chrome MCP): **exactamente 2**
    controles en `.barra-filtros` y **0** botones `data-filtro` (0 `<select>` en
    la página; la barra va **antes** del `.buscador`); con el **panel abierto**
    la lista/contador/etiqueta cambian al instante — escenario del acta tipo
    {Tela, Espuma} + {Castellón} → **solo B**, y además {Tela, Espuma}+{Valencia,
    Castellón} → A,B,C con búsqueda «b» → B; combinación en **Y** entre grupos
    y «o» dentro (fija `""` + Valencia → A,C,E,F; sin fija → F desaparece;
    colisión normal→G / fija→F / ambas→F,G); «Limpiar» por grupo **vacia sin
    cerrar** el panel; Escape y clic **fuera** cierran devolviendo el foco al
    trigger **sin mover el scroll** (y en cadena con la vista previa de la 017:
    1.ª cierra panel / 2.ª cierra previa); dos paneles **nunca** a la vez;
    buscador, listado, mapa y vista previa intactos (cabecera literal
    «… · Provincia: … · Búsqueda: «toldos»» + `beforeprint`, `.barra-filtros`
    con `display:none` en la hoja, así que **el panel abierto no se imprime**);
    375 px sin desbordes (scrollWidth 360 ≤ 375, apilado, panel dentro del
    viewport, trigger 45,6 px, casilla objetivo 44 px con caja 20 px,
    `ellipsis`+`title` con 15 marcas, scroll interno del panel); consola limpia
    (solo el `[debug] Search endpoint` de siempre, del navegador/MCP) y
    `localStorage` **byte-idéntico** al marcar/desmarcar/limpiar (solo la clave
    `gestorClientes`, sin claves nuevas) y borrado al terminar (arranque vacío
    verificado). **Decisiones/notas para T-05/T-06** (el plan usaba otros
    nombres): (1) el estado se llama `marcasTipos`/`marcasProvincias` +
    `panelAbierto` (no `tiposFiltro`/`provinciasFiltro` — las descripciones de
    T-05/T-06 hay que leerlas con esos nombres); (2) el contenedor de los paneles
    es **`.panel-casillas`, no `.casillas-tipos`** (esa clase es del formulario y
    sigue viva); (3) **RF-1605 ya está cableado aquí** (`pintarPanelProvincia`
    valida con `marcasProvinciaValidas` en cada repueblado: la huérfana se
    desmarca sola y la fija **nunca**) y los **resets RF-1609 de alta e
    importación** también (los dos grupos a `[]`); T-05 solo tendrá que
    completar repintados/edición-borrado y conectar `mensajeEstadoVacio`;
    (4) **`provinciaValida` NO se retira** en T-04 (sigue exportada y testeada en
    `test-provincia.js:165`; `app.js` ya no la usa) — discrepancia con la nota
    de T-02 que decía «T-04 la retira»: tocarla obligaría a cambiar
    `logica.js`/tests, fuera del alcance de esta tarea; resolverlo en T-05/T-08;
    (5) el **estado vacío degrada** (mensaje clásico sin pestañas) hasta T-05;
    (6) `refrescarCabeceraImpresion` ya pasa **arrays** a `textoContextoImpresion`
    (la formalización del acta RF-1608 queda en T-06).)*

- [x] **T-05 — Validación, resets y estados vacíos en `app.js`**
  - **Descripción:** (a) **RF-1605**: `pintarPanelProvincia()` llama a
    `marcasProvinciaValidas(opciones, provinciasFiltro)` en **cada** repueblado —
    al cargar, al cambiar **cualquier** marca del grupo tipo, al marcar/desmarcar
    provincia y tras **alta, edición, borrado e importación**—; la fija «Sin
    provincia» **nunca** se desmarca sola; el repintado refresca panel y etiqueta
    **sin cerrarlo**; (b) **RF-1609**: el **alta** deja `tiposFiltro = []`,
    `provinciasFiltro = []` y búsqueda limpia (como hoy); la **importación**
    ahora **deja ambos grupos sin marcas** (nota de cambio sobre la 011, que solo
    revalidaba); edición y borrado **no** resetean (solo repueblan); la
    confirmación de borrado y la edición en curso **sobreviven** a cambios de
    filtro (RF-013); (c) **RF-1607**: `pintarLista()` usa `mensajeEstadoVacio`
    pintado con **`textContent`**, añadiendo sobre la rama 3 el mensaje de
    migración en 2 clics de la 011 (`EN_ESCRITORIO && !archivoInicialExiste`)
    como se hacía hasta ahora.
  - **RF:** RF-1605, RF-1607, RF-1609.
  - **Hecho cuando:** con tipo {Espuma} marcada provincia «Castellón», cambiar a
    tipo {Tela} ⇒ «Castellón» **se desmarca sola** y la lista se repinta; borrando
    el último cliente de una provincia marcada esa opción **desaparece desmarcada**;
    «Sin provincia» marcada **se queda** marcada aunque no quede ningún
    sin-provincia (y si el resultado queda vacío, sale el estado vacío del
    RF-1607); alta e importación dejan **ambos grupos y la búsqueda limpios**;
    los tres estados vacíos muestran los literales **tal cual** del RF-1607 (los
    viejos con «la pestaña "Todos"» ya no existen); `node --check app.js` OK,
    `node --test` **≥ 141**, consola limpia.
    *(Hecho: 2026-10-21 — **165/165** en verde (cero tests tocados; solo el
    título del test de `provinciaValida` en `test-provincia.js` renombrado) y
    `node --check app.js` + `logica.js` OK. **Cambios en `app.js`**: (c)
    **RF-1607** — `pintarLista()` conecta
    `mensajeEstadoVacio(textoBusqueda, marcasTipos, marcasProvincias,
    clientes.length)` pintado con **`textContent`** (párrafo `p.vacio-lista` con
    `createElement`; el bloque degradado de T-04 retirado); la **rama de
    migración 011** se decide en `app.js` SOBRE la rama 3 con la misma condición
    (`sinCriterios && EN_ESCRITORIO && !archivoInicialExiste && clientes.length
    === 0`) y el texto literal de la 011 («¿Vienes de la web? Exporta la copia
    allí e impórtala aquí con «Importar».»). (b) **RF-1609** — el reset mínimo de
    T-04 (ambos grupos `[]` + búsqueda vacía en alta e importación) **ya
    cumplía** el literal; se añade `cerrarPanel(false)` en ambos flujos para que
    el cierre de panel no dependa del clic fuera (panel dejado abierto por
    teclado). Exportar no toca estado; edición/borrado **no** resetean (solo
    `repintarFiltros`). (a) **RF-1605** — ya cableado en T-04 y **verificado** en
    navegador (abajo); el **grupo tipo nunca** se auto-desmarca. (d)
    `refrescarCabeceraImpresion()` ya pasaba **arrays** (T-04). **Decisión
    `provinciaValida`** (discrepancia T-02/T-04): se **MANTIENE** exportada en
    `logica.js` — la testea `test-provincia.js:165`, delega en
    `marcasProvinciaValidas` (una sola ruta de validación, D3) y `app.js` ya no
    la usa desde la 018—; se retiró el comentario obsoleto «TEMPORAL… se retira
    en T-04» por uno que documenta la decisión (y el de `module.exports` y el
    título del test), sin cambiar semántica ni recuento. **Navegador (Chrome
    MCP, `file://…/index.html`, 7 clientes del acta A-F + H Gandía)**: RF-1605 —
    tipo {Espuma} + «Castellón» → solo B; cambiar a tipo {Tela} ⇒ opciones
    {Valencia}, «Castellón» **desmarcada sola**, etiqueta «Provincia: Todas» y
    lista repintada con el panel **sin cerrarse por validación**; marcando
    «Gandía» (panel abierto, NO se cierra al marcar) y borrando a su único
    cliente (H) ⇒ opción desaparece **desmarcada**; «Sin provincia» marcada y
    borrado de F (único sin provincia) ⇒ **sigue marcada**
    (`marcasProvincias=[""]`) y estado vacío «No hay clientes con estos filtros
    (Provincia: Sin provincia). Desmarca alguna casilla.». RF-1607 — literales
    **tal cual**: (1) «zzzz» sin marcas → variante corta; «zzzz» con tipo {Tela}
    → variante «…o desmarca alguna casilla.» (**la búsqueda manda**); (2)
    «(Tipo: Tela · Provincia: Castellón)» con ambas piezas (forzado defensivo
    tipo+provincia imposible, **restaurado después sin restos**), «(Provincia:
    Alicante)» solo provincia y «(Tipo: Estructuras)» solo tipo REAL (marcar
    Estructuras y borrar a H: la marca tipo **no** se desmarca sola); (3)
    «Aún no hay clientes. Rellena el formulario de arriba para añadir el
    primero.». RF-1609 — alta con tipo {Tela} + provincia {Valencia} + búsqueda
    «valen» y un panel **forzado abierto** ⇒ tras guardar: ambos grupos `[]`,
    búsqueda vacía, panel **cerrado**, etiquetas «Tipo: Todos»/«Provincia:
    Todas» y lista completa (8); edición de A (→«A editada») y borrado de C
    **conservan** tipo {Tela} con el listado coherente; importar 2 clientes
    (confirmación «¿Reemplazar 7 clientes actuales por 2 clientes del archivo?»)
    ⇒ mismo estado limpio. Integridad: `localStorage` **byte-idéntico** al
    filtrar/abrir/limpiar paneles y **sin claves nuevas**; **375 px sin
    desbordes** (scrollWidth 375 = viewport, panel dentro con scroll interno);
    consola **limpia** (solo el `[debug] Search endpoint` del navegador/MCP);
    datos de prueba borrados y arranque vacío verificado.)*

- [x] **T-06 — Impresión RF-1608: cabecera con listas en vista previa y `beforeprint`**
  - **Descripción:** `refrescarCabeceraImpresion()` pasa a llamar
    `textoContextoImpresion(tiposFiltro, textoBusqueda, provinciasFiltro)`
    (piezas omitidas y orden Filtro · Provincia · Búsqueda intactos); comprobar
    que la **guardia de cero visibles** de la 013/017 sigue compartiendo
    `visiblesActuales()`; que el panel **abierto** no viaja a la hoja (los paneles
    son hijos de `.barra-filtros`, oculta por la hoja); que la vista previa, la
    barra, el «Guardar como PDF», Escape y el `focus({preventScroll:true})` de la
    017 quedan **intactos**. Sin tocar nada más de `hoja-impresion.css` salvo el
    cambio de selectores ya hecho en T-04.
  - **RF:** RF-1608, RF-1606 (panel ausente en la hoja), RF-1609 (JSON de
    clientes byte-idéntico al imprimir).
  - **Hecho cuando:** con filtros {Tela, Espuma} + {Valencia, Castellón} y
    búsqueda «toldos», abrir la vista previa muestra la cabecera literal
    `Gestor de Clientes · Filtro: Tela, Espuma · Provincia: Valencia, Castellón ·
    Búsqueda: «toldos»` (y «Sin provincia» tal cual si está marcada); despachar
    `beforeprint` a mano (Ctrl+P) refresca igual; con cero visibles el botón
    «Imprimir» sigue avisando sin abrir la vista previa; el panel abierto no
    aparece en la hoja; `node --check app.js` OK y `node --test` **≥ 141**.
    *(Hecho: 2026-10-21 — **165/165** en verde (cero tests tocados) y
    `node --check app.js` OK. **Auditoría: SIN cambios de código** — `app.js`,
    `hoja-impresion.css` y `styles.css` intactos: la T-04 ya pasaba arrays a
    `textoContextoImpresion` y ocultaba `.barra-filtros`, y la T-05 dejó todo
    conectado; solo hizo falta verificar. **Navegador (Chrome MCP,
    `file://…/index.html`, 9 clientes A-I: multi-tipo C/I, «Sin provincia»
    escrita en G, vacía en F, Gandía y «Toldos Vega»):**
    **(a) RF-1608 · vista previa** — tipo {Tela, Espuma} + provincia + búsqueda
    «toldos» → `#cabecera-impresion` = `Gestor de Clientes · Filtro: Tela,
    Espuma · Provincia: Castellón, Valencia · Búsqueda: «toldos»` (orden de
    piezas **Filtro · Provincia · Búsqueda**, juntado «, », texto plano,
    `display:block`, pintado fresco al abrir). **(b)** solo la marca fija →
    `Gestor de Clientes · Provincia: Sin provincia` («Sin provincia» tal cual;
    1 visible: F). **(c)** sin marcas ni búsqueda → solo `Gestor de Clientes`
    (9 visibles). **(d) panel ABIERTO** (forzado de estado, como en T-05) con la
    previa abierta → `.barra-filtros` `display:none` y `checkVisibility=false` /
    **0 cajas** en trigger, panel, casillas y fija (`.panel-filtro` lo oculta la
    hoja aparte); también ocultos `.buscador`, `.contador`, `#boton-imprimir`,
    `.conmutador`, `.selector-campos`, `.toast`, `.cabecera`,
    `#panel-formulario`, `.lista-cabecera h2` y `.acciones-celda` (th y td);
    `thead` = `table-header-group`; la barra de la previa sí se ve en pantalla.
    **`beforeprint` (Ctrl+P sin previa)**: refresca fresco — tras despacharlo
    con {Tela}+«alfa» → `Gestor de Clientes · Filtro: Tela · Búsqueda: «alfa»`,
    y tras marcar Valencia → `… · Filtro: Tela · Provincia: Valencia ·
    Búsqueda: «alfa»` (con `media="print"` y la previa **cerrada**). **Guardia
    de 0 visibles (013/017)**: con0 visibles, «Imprimir» → toast «No hay
    clientes para imprimir» y **no** abre la previa (`media` sigue `print`);
    comparte `visiblesActuales()` con `pintarLista`. **Conservación 017**:
    Escape 1.º cierra el panel (jerarquía 016/018) y 2.º la previa; al cerrar →
    foco `#boton-imprimir`, scroll restaurado (1057), `#estilo-hoja` vuelve a
    `print` y la barra queda `hidden`; «Guardar como PDF» y sus avisos intactos.
    **RF-1609**: JSON `gestorClientes` **byte-idéntico** (hash+longitud
    `2559702103:2462`, igual que al sembrar) antes/después de filtrar, abrir y
    cerrar paneles, previa y `beforeprint`; solo la clave `gestorClientes` más
    `diarioEstudio.tema` (**ajena**, de otro proyecto en el mismo origen
    `file://`; no aparece en nuestro código); datos borrados y arranque vacío
    («Aún no hay clientes…», «Tipo: Todos»/«Provincia: Todas», previa cerrada).
    **Consola limpia** (cero mensajes tras la recarga final).
    **DIVERGENCIA para T-07/T-08 (no es de código, es de spec)**: la spec cita
    los ejemplos «Provincia: Valencia, Castellón» (RF-1608 p. ej., criterio de
    aceptación y etiqueta del RF-1601), pero **no fija ningún orden intra-grupo**
    y el panel es **alfabético** (RF-1603) → `casillasMarcadas()` lee en orden
    de panel, así que con {Valencia, Castellón} la pieza sale **«Provincia:
    Castellón, Valencia»** (orden visible y determinista, idéntico al de la
    etiqueta del trigger). Las **reglas** del RF-1608 sí cumplen todas: orden de
    piezas, «, », piezas vacías omitidas, texto plano y «Sin provincia» tal cual
    (marcando Valencia + fija → `Provincia: Valencia, Sin provincia`, literal
    exacto). Si el criterio exige literalmente «Valencia, Castellón» haría falta
    una **enmienda de spec** que fije el orden (alfabético o de adición) — no se
    improvisa en código. **Nota 2**: el RF-1610 no tiene parte (f) (sus grupos
    son (a)-(d); (d) = `textoContextoImpresion`, tests en verde — la (f) del
    plan §3 es «estados vacíos», T-05). **Nota 3**: el cuadro nativo de
    impresión no abre en este equipo (limitación ya anotada en la 017); la hoja
    de Ctrl+P comparte exactamente las mismas reglas (`hoja-impresion.css`
    conmutado), la prueba con cuadro real queda para T-07/T-08.)*

- [x] **T-07 — Verificación completa en navegador (Chrome DevTools) + `node --test`**
  - **Descripción:** acta RF por RF siguiendo el plan §6.2 con los clientes del
    acta de la spec (A-E + F sin tipos ni provincia + G con la provincia escrita
    «Sin provincia» + «CÁDIZ»/«cadiz» + «Gandía»): dos controles y cero
    `data-filtro` (RF-1601); semántica «o» y «Sin tipo»/«Otros» (RF-1602);
    provincias espejo únicas normalizadas, fija «Sin provincia» al final y
    **colisión** (normal → G, fija → F, ambas → F y G) (RF-1603); combinación en
    Y de los tres criterios sin límite (RF-1604); repueblado y desmarcado
    automático, fija inmutable con forzado de estado **y restauración** (RF-1605);
    teclado real Tab/Intro/Escape con foco de vuelta y `preventScroll`, clic
    fuera, «Limpiar», un solo panel, 375 px con 15+ provincias sin desborde
    (`scrollWidth` ≤ viewport), panel abierto + Ctrl+P sin viajar a la hoja
    (RF-1606); contador y los tres estados vacíos literales (RF-1607); cabecera
    fresca en vista previa y en `beforeprint` (RF-1608); integridad —
    `localStorage` solo `gestorClientes`, JSON byte-idéntico antes/después de
    filtrar y abrir paneles, recarga con filtros vacíos, regresiones 002-017
    (alta/edición/borrado, exportar/importar, listado y chips, mapa, búsqueda,
    vista previa) (RF-1609); consola limpia y datos de prueba borrados al final.
  - **RF:** RF-1601 a RF-1609 (verificación web).
  - **Hecho cuando:** todos los criterios web de la spec cumplidos y acta escrita
    en `tasks.md`; `node --check` de los dos JS OK; `node --test` **≥ 141**;
    consola limpia; datos de prueba borrados
    (`localStorage.removeItem("gestorClientes")`); `git status` sin sorpresas.
    *(Hecho: 2026-10-24 — **166/166** en verde y `node --check app.js` /
    `node --check logica.js` OK. **Enmienda «y» aprobada y aplicada durante el
    acta** (ver cabecera): `filtrarClientes` con intersección + 1 test nuevo.
    **Navegador (Chrome MCP, `file://…/index.html`, acta canónica A–I + 18
    clientes «Prov …» para la prueba de 375 px):**
    **RF-1601** — `.barra-filtros` con **exactamente 2** `.panel-filtro`, **0**
    `[data-filtro]`, **0** `<select>`, ambos triggers etiquetados «Tipo: Todos» /
    «Provincia: Todas», paneles `hidden` al arrancar, barra ANTES del buscador,
    contador «9 clientes». **RF-1602 («y»)** — {Tela}→A,C · **{Tela, Espuma}→solo
    C** · {Otros}→E,I · **{Otros, Espuma}→solo I** · {Sin tipo}→D,F,G ·
    **{Sin tipo, Tela}→0** y **{Sin tipo, Otros}→0** con ambas casillas
    intactas · **5 marcados→0** · 0 marcas→9; etiqueta con conmutación en vivo
    («Tipo: Tela, Espuma (2)») y panel abierto durante todo el recorrido.
    **RF-1603** — espejo de datos: 6 opciones (CÁDIZ, Castellón, Gandía,
    **Sin provincia** normal de G en posición alfabética, Valencia) + **fija
    «Sin provincia» al final**; fija sola→**F** · fija+Valencia→F,E,C,A ·
    solo Valencia→E,C,A (F fuera) · **colisión**: normal→**G**, fija→**F**,
    ambas→**F y G** · «Limpiar»→9 y el panel **sin cerrarse**. **RF-1604** —
    {Tela, Espuma}+{Valencia}→**solo C** (opciones espejo sin Castellón);
    {Otros}+{CÁDIZ}→**solo I**; **{Espuma}+{CÁDIZ}+búsqueda «vega»→solo I,
    «1 cliente»**. **RF-1605** — {Espuma}→opciones {CÁDIZ, Castellón,
    Valencia}+fija; marcar Castellón→solo B; añadir «Tela»→opciones {Valencia}
    +fija, **«Castellón» se desmarca SOLA**, panel **sin cerrarse** y etiqueta
    refrescada; quitar «Tela»→recupera 3 opciones pero **Castellón NO se
    vuelve a marcar**; borrar a I con «CÁDIZ» marcada (UI real «Eliminar»→«Sí,
    eliminar»)→opción **desaparece sin marcarse otra**; **la fija «Sin
    provincia» nunca se desmarca sola**: con {Espuma}+fija+Castellón, añadir
    «Tela» deja Castellón fuera y **la fija intacta**. **RF-1606** — teclado
    **real**: Tab desde «Imprimir»→`#trigger-tipo` (scroll 400 intacto);
    Intro→abre (`aria-expanded=true`); Tab→primera casilla; **Espacio**→marca
    Tela sin cerrar (etiqueta/contador en vivo); **Escape**→cierra y
    `document.activeElement` **vuelve al trigger** con `scrollY=400` (sin
    salto); clic fuera→cierra; abrir tipo y luego provincia→**nunca dos a la
    vez**; «Limpiar» de cada grupo **sin cerrar** su panel. **375 px**
    (`emulate viewport 375x732`, 20 provincias): `scrollWidth` **375 =
    viewport** (sin desborde), triggers **apilados 301×46** (≥44 px), casilla
    **44 px** de alto y panel con **scroll interno** (20 casillas). Panel
    abierto (forzado) + vista previa→`.barra-filtros`
    **`display:none`/`checkVisibility=false`** con 0 cajas en trigger, panel,
    casilla y fija; barra de la previa **sí** visible. **RF-1607** — rama 1 sin
    marcas: «No hay coincidencias para «zzzz». Prueba con otras palabras.»;
    rama 1 con marcas: «…o desmarca alguna casilla.»; rama 2 ambos grupos:
    «No hay clientes con estos filtros (Tipo: Tela · Provincia: Sin
    provincia). Desmarca alguna casilla.»; **rama 2 solo provincia** (forzado +
    restauración): «…(Provincia: Provincia Inexistente).…»; **imposible
    alcanzable** «Sin tipo»+«Tela»: «…(Tipo: Tela, Sin tipo).…» con **las dos
    casillas aún marcadas**; rama 3: «Aún no hay clientes. Rellena el
    formulario de arriba para añadir el primero.» (sin frase de migración en
    web). **RF-1608** — con {Espuma}+{CÁDIZ, Castellón, Valencia}+«vega» (1
    visible) la vista previa muestra **fresco**
    `Gestor de Clientes · Filtro: Espuma · Provincia: CÁDIZ, Castellón,
    Valencia · Búsqueda: «vega»` (orden Filtro · Provincia · Búsqueda, «, »
    entre marcas); **`beforeprint`** refresca el mismo literal con Ctrl+P sin
    previa; al cerrar, `#estilo-hoja` vuelve a `print`. **RF-1609** —
    **byte-idéntico** (`hash 1529662252`, len 1859) antes/después de marcar,
    abrir/cerrar paneles, «Limpiar», previa y `beforeprint`; **sin claves
    nuevas** (solo `gestorClientes` + `diarioEstudio.tema`, ajena); recarga→
    filtros y búsqueda **vacíos**, 9 visibles. Regresiones: **alta con filtros
    activos**→ambos grupos «Todos/Todas», buscador vacío y toast «Cliente
    guardado»; **edición** con cambio de filtro a mitad→empresa conservada,
    notas persisten en tarjeta y JSON con **id/fecha intactos**; **borrado**
    con «¿Seguro?·Sí, eliminar»→fuera de lista y JSON; **importación** real
    (File inyectado, 10 clientes) con filtros activos→toast «Clientes
    importados», **ambos grupos sin marcas y búsqueda vacía** (nota de cambio
    del RF-1609) y **mapa intacto** (iframe + enlace en «Mapa SL»);
    **listado/chips**→tabla filtra (Mapa SL, C, A), acciones en fila, chip
    «Provincia» round-trip (añade y quita la columna); **búsqueda**→«vega»→I,
    «gandia» (sin acento)→H. **Cierre**: consola **limpia** (solo el debug del
    MCP), datos borrados y **arranque vacío** con el literal de la rama 3;
    `git status`: solo los archivos esperados de la 018.)*

- [x] **T-08 — Checklist manual escritorio, documentación e instalador**
  - **Descripción:** (a) **checklist en `npm start`** (plan §6.3): los filtros
    funcionan igual en la app; alta con filtros activos ⇒ estado limpio;
    **hash de `clientes.json` idéntico** antes/después de filtrar y abrir
    paneles; vista previa y PDF muestran la cabecera con las marcas («Sin
    provincia» tal cual); consola limpia; (b) **`AGENTS.md`**: entrada nueva
    «Filtros múltiples (spec 018)» (dos desplegables con casillas, semántica
    «o»/«y», «Sin tipo»/«Sin provincia», pestañas fuera) + notas de sustitución
    en las entradas **014** (la frase final del RF-1205: las pestañas
    desaparecen) y **015** (el desplegable único, el RF-1306 y la pieza
    «Provincia: X» de un único valor pasan a listas); (c) **`MEMORY.md`**: línea
    de la 018 con el total de tests y decisiones; (d) marcar spec/plan/tasks como
    implementados; (e) **regenerar el instalador** (`cd escritorio && npm run
    build`) y humo del `win-unpacked` (arranca, filtra, PDF con cabecera,
    `clientes.json` intacto); (f) **commit único** con árbol limpio.
  - **Hecho cuando:** app de escritorio verificada, docs al día, instalador
    regenerado y commit hecho.
    *(Hecho: 2026-10-24 — **(a) `npm start` (CDP nativo, Node WebSocket)**: con
    el acta A–I en `clientes.json` → **{Sin tipo}→G,F,D** y **+ fija
    «Sin provincia»→solo F** (misma semántica que la web); **hash byte-idéntico
    (`2371887400:2756`) antes/después de filtrar**; vista previa con cabecera
    **`Gestor de Clientes · Filtro: Sin tipo · Provincia: Sin provincia`**
    («Sin provincia» **tal cual**) y `.barra-filtros` **oculta en la hoja**;
    **alta con filtros activos**→«Tipo: Todos / Provincia: Todas», buscador
    vacío, toast «Cliente guardado» y cliente **en el JSON**; **borrado** con
    «¿Seguro?»→fuera del JSON; recarga→filtros vacíos y 9 visibles. *(Un solo
    falso positivo del acta: `Page.printToPDF` **no existe vía CDP en Electron**
    —es API del proceso principal (`webContents.printToPDF`)—, así que el PDF
    comparte render con la vista previa ya verificada, como en la 017.)*
    **(e) Instalador regenerado 2026-10-24 12:31** (`Gestor de Clientes Setup
    1.0.0.exe`, 106 MB) con los **6 recursos** (incluye `hoja-impresion.css`);
    **humo del `win-unpacked`**: arranca (`EN_ESCRITORIO=true`, 9 visibles),
    **{Tela, Espuma}→solo C** y **{Otros}→I,E** (intersección también en el
    empaquetado), **hash idéntico** tras filtrar y cabecera
    **`… · Filtro: Espuma · Provincia: CÁDIZ`**; datos de prueba borrados y
    carpeta `Documents\Gestor de Clientes` vacía como al inicio (en este equipo
    no hay dato real). **(b/c/d)** AGENTS.md con la entrada «Filtros múltiples
    (spec 018)» + notas en 014/015 y la entrada de pestañas tachada; MEMORY.md
    y spec/tasks al día.)*
  - **RF:** RF-1609, RF-1610 (evidencia manual y cierre).
  - **Hecho cuando:** acta del escritorio firmada (incluido el hash de
    `clientes.json`); docs al día; `node --test` **≥ 141**; instalador
    regenerado y humado; commit hecho y árbol limpio.
