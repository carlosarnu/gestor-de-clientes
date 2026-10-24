# Plan — Spec 018 · Filtros múltiples por tipo y provincia (dos desplegables con casillas)

**Estado:** **implementado** (2026-10-24; spec aprobada 2026-10-21 con la enmienda «y» aprobada por el usuario el 2026-10-22; `node --test` 166/166, actas T-07/T-08 en `tasks.md`)

| Campo | Valor |
|---|---|
| **Spec** | `specs/018-filtros-multiples/spec.md` (10 RF: RF-1601…1610, 11 decisiones; **Dudas abiertas: ninguna**) |
| **Fecha** | 2026-10-21 |
| **Dependencia** | Se implementa sobre el estado cerrado de las specs **005** (buscador, intacto), **012** (listado), **013/017** (impresión y vista previa), **014** (tipos múltiples, pertenencia), **015** (provincia) y **016→casillas 2026-10-20** (patrón visual de casillas). `node --test` hoy: **141/141**; git limpio (commit `b98ff29`). Deroga, según la cabecera de la 018: la frase final del RF-1205 de la 014 (las pestañas permanecen), el RF-1305 (desplegable único), toda la mecánica de mensajes del RF-1306, el RF-104 de la 003 y la pestaña «Otros» de la 008. **No se tocan datos, claves ni esquema** (RF-1609). |
| **Verificación** | `node --test` (**tests adaptados + nuevos**, total **≥ 141**) + Chrome DevTools (web) + checklist manual (escritorio: PDF con cabecera multi, `clientes.json` intacto; patrón 017) |

---

## 1. Arquitectura de los filtros múltiples

Los filtros pasan a ser **estado de sesión en memoria** (dos arrays de marcas), como
ya lo eran `filtroActivo`/`filtroProvincia`; lo que cambia es la **forma de entrada**
(dos paneles con casillas) y la **semántica** («y» dentro del grupo tipo — enmienda
aprobada 2026-10-22: intersección, el «filtro exacto» —, «o» dentro del grupo
provincia, y «y» entre grupo tipo, grupo provincia y búsqueda). Nada se persiste: ni claves nuevas ni cambios en
`gestorClientes`/`clientes.json` (RF-1609, mismo criterio que RF-1006 de la 012).

Estado en `app.js`:

```
let tiposFiltro = [];       // marcas del grupo TIPO: [] = sin filtro; «Tela»/«Espuma»/
                            // «Estructuras» (pertencia), «Otros» (algún tipo no fijo),
                            // «Sin tipo» (tiposCliente vacío)
let provinciasFiltro = [];  // marcas del grupo PROVINCIA: [] = sin filtro; nombre de
                            // provincia (coincidencia normalizada); y "" = la casilla
                            // FIJA «Sin provincia» (provincia vacía o ausente)
```

Ciclo de vida (toda la lógica de filtrado en `logica.js`; `app.js` presenta y orquesta):

```
marca/desmarca casilla (listener `change` delegado en el panel)
  └─ grupo tipo    → tiposFiltro = marcas marcadas
  └─ grupo provincia → provinciasFiltro = marcas marcadas
  └─ repueblaPanelProvincia()                // RF-1605: opciones = provinciasExistentes
       provinciasFiltro = marcasProvinciaValidas(opciones, provinciasFiltro)   // huérfanas → desmarcadas SOLAS
  └─ actualizarEtiquetas()                   // «Tipo: Tela, Espuma (2)» + «…»/title
  └─ pintarLista() → visiblesActuales():
       filtrarClientes(ordenarClientes(clientes), tiposFiltro)      // «y» (intersección), vacío = todos
       └─ filtrarPorProvincia(_, provinciasFiltro)                  // «o», vacío = todos, "" = sin provincia
            └─ buscarClientes(_, textoBusqueda)                     // 005 intacta, en Y

«Limpiar» (dentro del panel) → ese grupo = [] sin cerrar el panel
Escape / clic fuera / segundo clic en el trigger → cierra el panel,
  cierra el otro si estuviera abierto, devuelve el foco al trigger
  con focus({preventScroll:true}) y sin mover el scroll de la página

Alta e importación (RF-1609) → tiposFiltro = []; provinciasFiltro = []; búsqueda limpia
Edición y borrado → repueblan/validan, NO resetean
Impresión → refrescarCabeceraImpresion():
  textoContextoImpresion(tiposFiltro, textoBusqueda, provinciasFiltro)   // RF-1608
```

La barra actual (`<div class="filtros">` con 5 botones `data-filtro` + `#filtro-provincia`)
desaparece y es sustituida por **un único contenedor `.barra-filtros`** con los dos
desplegables, colocado **antes** del buscador (que queda al final de la barra, RF-1601).
Cada desplegable es: un **trigger** `<button>` con su etiqueta de estado + un **panel**
`<div class="panel-filtro" hidden>` con un `role="group"`, las casillas (las 5 fijas del
tipo en el HTML; las provincias generadas en memoria con `escaparAtributo`, más la fija
«Sin provincia» **anclada al final**) y su botón **«Limpiar»**.

## 2. Lógica pura (`logica.js`): seis funciones (RF-1610)

| Función | Detalle | RF |
|---|---|---|
| `filtrarClientes(lista, marcasTipos)` | **Firma cambiada a arrays** (decisión D1): `[]` o entrada no-array → lista completa; **«y» entre marcas** (intersección, enmienda aprobada 2026-10-22): fijo → pertenencia (`tiposCliente`), «Otros» → algún tipo no fijo (fijos junto a libres también entran, Decisión 7 de la 014), «Sin tipo» → `tiposCliente` vacío; «Sin tipo» + cualquier otra marca → **imposible lógico → `[]`**. No muta la lista. | RF-1602, RF-1604 |
| `filtrarPorProvincia(lista, provincias)` | **Firma cambiada a arrays**: `[]` → lista completa; «o» entre marcas: nombre real → `coincideProvincia` (normaliza solo para el filtro); marca `""` (constante `SIN_PROVINCIA`) → `provincia` vacía o ausente. Un cliente con «Sin provincia» **escrito literalmente** pasa por su coincidencia de texto, **nunca** por la fija. Si hay provincias reales marcadas y la fija **no** está, los sin-provincia **no** pasan. | RF-1603, RF-1604 |
| `marcasProvinciaValidas(opciones, marcas)` | **Sustituye a `provinciaValida`** (que se elimina; D3): devuelve solo las marcas que siguen existiendo entre las `opciones` (por `normalizar`, **alineadas a la primera forma guardada**), entradas no-string o vacías aparte, y **conserva siempre `""`** (la fija nunca se desmarca sola por repueblado, RF-1605/Decisión 11). | RF-1605, RF-1610(c) |
| `nombreMarcasProvincias(marcas)` | Etiquetas de pintado: `""` → «Sin provincia», el resto tal cual. Única fuente del literal, usada por la etiqueta del trigger, la cabecera de impresión y el estado vacío (evita que los tres diverjan). | RF-1603, RF-1607, RF-1608 |
| `textoContextoImpresion(marcasTipos, busqueda, marcasProvincias)` | **Misma función de siempre con listas** (Decisión 8 de la 018, D-de-plan §4.8): piezas en orden **Filtro · Provincia · Búsqueda**, cada grupo unido con «, » (provincias vía `nombreMarcasProvincias`), piezas vacías omitidas, texto plano sin HTML. | RF-1608 |
| `mensajeEstadoVacio(busqueda, marcasTipos, marcasProvincias, total)` | Literal del RF-1607 en sus ramas 1-3: (1) búsqueda → «No hay coincidencias para «X». Prueba con otras palabras.» y si **hay** marcas la variante «…o desmarca alguna casilla.»; (2) sin búsqueda y con marcas → «No hay clientes con estos filtros (Tipo: … · Provincia: …). Desmarca alguna casilla.» con **solo las piezas activas**; (3) sin nada → «Aún no hay clientes…» (app.js añade el mensaje de migración de la 011 cuando corresponda). **Texto plano**: app.js lo pinta con `textContent`. | RF-1607, RF-1610(d) |

`module.exports`: se añaden `marcasProvinciaValidas`, `nombreMarcasProvincias` y
`mensajeEstadoVacio`; se **retira** `provinciaValida`. `provinciasExistentes`,
`coincideProvincia`, `tiposCliente`, `esTipoFijo` y `buscarClientes` quedan intactos
y son las piezas sobre las que se apoyan las nuevas.

### Tests (`test-logica.js` y `test-provincia.js`, rojo→verde)

- **Adaptación** (la firma cambia, RF-1610): las llamadas existentes pasan a listas —
  `filtrarClientes(LISTA, "Tela")` → `filtrarClientes(LISTA, ["Tela"])` (~10 llamadas
  en `test-logica.js` 198-221/917-925 y `test-provincia.js` 123); los tests de
  `textoContextoImpresion` (~16 aserciones) pasan a listas (`["Tela"]`, `[]`); los de
  `provinciaValida` se reescriben sobre `marcasProvinciaValidas`. Los tests que **no**
  tocan esta lógica (buscador, saneado, fechas, catálogo, casillas del formulario,
  `nombreArchivoPdf`…) quedan **intactos**.
- **Nuevos** (grupos del RF-1610): (a) tipo por lista —`[]`=todos, **«y»** con 1 y N,
  pertenencia multi-tipo, «Otros», «Sin tipo», imposibles «Sin tipo»+otra marca y
  cinco marcados = `[]`;
  (b) provincia por lista —`[]`=todos, «o», normalización, sin-provincia pasa con `[]`
  o con `[""]` y **no** pasa con provincias reales sin `""`, colisión (cliente con
  «Sin provincia» escrito: pasa por texto, no por la fija); (c) validación —huérfana
  desmarcada y alineada a la primera forma, `""` **nunca** se va; (d)
  `textoContextoImpresion` —listas de ambos grupos, piezas omitidas, orden, «, »,
  «Sin provincia» impreso tal cual, acentos/comillas; (e) `mensajeEstadoVacio` —
  prioridad búsqueda → filtros → vacío, las dos variantes del ramo 1, piezas del
  ramo 2 (solo tipo, solo provincia, ambas). Total previsto **~165 tests**; mínimo
  exigido **≥ 141**.

## 3. Decisiones técnicas por archivo

| Archivo | Qué se toca | RF |
|---|---|---|
| `index.html` | (a) **Nuevo `.barra-filtros`** con los dos desplegables **antes del `.buscador`**: `#filtro-tipo` (trigger `#trigger-tipo` con texto inicial «Tipo: Todos» + panel con las **cinco** casillas fijas Tela/Espuma/Estructuras/Otros/Sin tipo y «Limpiar») y `#filtro-provincia` (trigger `#trigger-provincia` «Provincia: Todas» + panel `#panel-provincias` **vacío** —se genera en memoria— + «Limpiar»); cada panel con `hidden` por defecto y `role="group"` con `aria-label`; (b) **se retiran** `<div class="filtros" id="filtros">` (los 5 botones) y el bloque `#filtro-provincia` viejo (`<select>`); (c) comentarios actualizados (sin «pestañas»). | RF-1601, RF-1602, RF-1603, RF-1606 |
| `styles.css` | (a) estilos de `.barra-filtros`, triggers (≥ 44 px, texto con `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` y `min-width:0`), paneles (borde/redondeado/tinta retro **sin sombras**, `max-height` + `overflow-y:auto` para 15+ provincias, `z-index` sobre la lista) y **reutilización del patrón de casillas del formulario** (`.casillas-tipos`: casilla 20 px en objetivo ≥ 44 px, foco visible en la casilla entera); «Limpiar» con las clases de botón existentes; (b) apilado 375 px de la barra sin desbordes; (c) **se retiran** `.filtros`, `.filtro`, `.filtro.activo`, `.filtro-provincia-bloque`, `.filtro-provincia`, `.filtro-provincia-select` (+ su `:hover`/`:focus-visible` y la referencia del comentario de la línea 130) y cualquier resto huérfano; (d) `.panel-filtro[hidden] { display:none }` (patrón 016). | RF-1601, RF-1606 |
| `hoja-impresion.css` | El chrome oculto de la hoja renombra sus selectores: `.filtros, .filtro-provincia-bloque` → `.barra-filtros` (`.buscador` y el resto intactos). Los paneles son hijos de la barra: **ocultos con ella**, así el panel abierto nunca viaja al papel/PDF (RF-1606). | RF-1606, RF-1608 |
| `logica.js` | Las seis funciones de la §2 (3 nuevas, 3 con firma adaptada), constante `SIN_PROVINCIA = ""` y `module.exports` al día (retirada de `provinciaValida`). **Nada más se toca**: buscador, saneado, fechas, catálogo, casillas del formulario, PDF e importación intactos. | RF-1602 a RF-1604, RF-1607, RF-1608, RF-1610 |
| `app.js` | (a) estado `tiposFiltro`/`provinciasFiltro` (arrays, memoria) en sustitución de `filtroActivo`/`filtroProvincia`; refs a los dos triggers y paneles; (b) `pintarPanelTipo()` (solo sincroniza `checked` + etiqueta; las 5 casillas son estáticas) y `pintarPanelProvincia()` (genera casillas con `escaparAtributo`, fija «Sin provincia» al final, **llama a `marcasProvinciaValidas`** y repinta; espejo de la actual `pintarFiltroProvincia`); (c) `actualizarEtiquetas()` («Tipo: Todos»/«Tipo: Tela, Espuma (2)», «Provincia: …», con `title` completo y «…» si no cabe); (d) abrir/cerrar panel: trigger, Escape (listener `keydown` **acotado** a paneles abiertos, sin pisar el de la vista previa de la 017), clic fuera, cerrar el otro panel, foco de vuelta con `focus({preventScroll:true})`; «Limpiar» sin cerrar; (e) `visiblesActuales()` con las firmas nuevas; contador intacto (`textoContador`); (f) estados vacíos con `mensajeEstadoVacio` + `textContent` (la migración de la 011 se añade sobre la rama 3, como hoy); (g) **repueblado** de provincias tras alta/edición/borrado/importación y al cambiar marcas de tipo (RF-1605); (h) **reset RF-1609**: alta e importación dejan `tiposFiltro=[]`, `provinciasFiltro=[]` y búsqueda limpia (la importación **hoy** solo revalidaba: nota de cambio); (i) `refrescarCabeceraImpresion()` → `textoContextoImpresion(tiposFiltro, textoBusqueda, provinciasFiltro)` (vista previa y `beforeprint` de la 017 intactos); (j) **borrado** del handler de pestañas (`contenedorFiltros`, `.filtro`), del listener del `<select>` viejo y de `pintarFiltroProvincia`. | RF-1601, RF-1604, RF-1605, RF-1606, RF-1607, RF-1609 |
| `test-logica.js`, `test-provincia.js` | Adaptación + tests nuevos (§2). Sin fichero de tests nuevo. | RF-1610 |
| `AGENTS.md`, `MEMORY.md` | Cierre: entrada nueva «Filtros múltiples (spec 018)»; notas de sustitución en las entradas 014 (las pestañas y el RF-1205 final mueren) y 015 (el desplegable único y los literales RF-1306/RF-1308 pasan a listas); línea de estado en MEMORY. | RF-1609, RF-1610 |
| `escritorio/` | **Intacto** (cero ficheros nuevos: no hay nada que añadir a `extraResources`; `main.js`, `preload.js` y `package.json` no se tocan). Solo se **regenera el instalador** al cierre (`npm run build`) para que lleve el cambio dentro. | RF-1609, RF-1610 |

`docs/constitution.md` **intacto**; specs 001-017 **intactas** (las derogaciones
documentadas quedan en la cabecera de la 018 y en AGENTS).

## 4. Decisiones del plan (con alternativa descartada)

1. **`filtrarClientes` y `filtrarPorProvincia` cambian de firma a arrays; no se
   conserva la entrada string.** Una sola ruta de filtrado por grupo (Decisión 10 de
   la 018: «dos rutas que divergirían» está descartada). *Descartadas:*
   **tolerancia string|array** (dos semánticas de entrada conviviendo: un `"Otros"`
   colgado de una llamada vieja pasaría silenciosamente como marca literal y los
   tests no lo delatarían), **mantener `filtrarClientes` y añadir `filtrarPorMarcas`**
   (funciones paralelas, la deriva prohibida por la spec) y **envolver la marca en un
   objeto** (complica todas las comparaciones por nada). El coste —adaptar ~10
   llamadas de tests— es menor que el riesgo de la doble firma.
2. **La casilla fija «Sin provincia» se codifica como la marca `""` dentro del array
   de provincias** (constante `SIN_PROVINCIA`). Es la única marca sin colisión
   posible: `provinciasExistentes` nunca devuelve vacíos, así que `""` no puede
   confundirse con una provincia escrita (ni siquiera con una literalmente llamada
   «Sin provincia»: esa es una marca de texto normal). *Descartadas:* **usar el
   literal «Sin provincia» como marca** (colisión indecidible con la provincia
   escrita homónima del RF-1603), **un token mágico** tipo `"__sin_provincia__"`
   (legible solo por iniciados y exportable a papel/estados), y **marcas-objeto**
   `{fija:true}` (rompe la uniformidad string de todas las demás marcas y de
   `textoContextoImpresion`).
3. **`provinciaValida` se sustituye por `marcasProvinciaValidas` (se retira la
   antigua).** Una sola ruta de validación, análoga y testada. *Descartada:*
   **mantener `provinciaValida(string)` y añadir la multi** (dos rutas de
   validación que divergirían, exactamente lo que evitó el cambio anterior).
4. **Los estados vacíos del RF-1607 pasan a lógica pura (`mensajeEstadoVacio`).**
   El RF-1610(d) exige probar **prioridad y juntado de piezas** con `node --test`;
   estando en `app.js` no habría forma de testearlos. *Descartada:* **dejarlos
   inline en `pintarLista`** (imposible de testear; la verificación sería solo
   manual y la prioridad búsqueda→filtros→vacío es fácil de romper).
5. **Las etiquetas de los triggers («Tipo: Tela, Espuma (2)») se construyen en
   `app.js`.** Son presentación (texto + paréntesis + «…»/title), no tienen
   requisito de test en la spec y su contenido literal ya lo cubren
   `nombreMarcasProvincias`, `textoContextoImpresion` y `mensajeEstadoVacio` en
   lógica. *Descartada:* **helper puro `etiquetaGrupo`** (más superficie de API para
   testear un texto que la spec no pide probar; si un día se pide, se extrae igual).
6. **`index.html` + `styles.css` + la parte de `app.js` que depende de ellos avanzan
   juntos en la misma tarea (T-04).** Quitar las pestañas del HTML con `app.js`
   aún apuntando a `contenedorFiltros` deja la app **rota** (`querySelector` → null)
   entre tareas; a diferencia de la 017, aquí el estado intermedio no puede
   conservar el comportamiento viejo. *Descartada:* **HTML/CSS primero y app.js
   después** (app inutilizable entre dos tareas; contra el «cada tarea deja la app
   usable» implícito en el flujo).
7. **El contenido del panel de provincia se genera en memoria con
   `innerHTML`+`escaparAtributo` (como ya hacía el `<select>` de la 015).** Las
   provincias son texto libre de los datos: fuera de escapado no hay garantía.
   *Descartada:* **construir con `createElement`/`textContent`** (más verbose sin
   aportar seguridad extra: el patrón escapado ya está probado en el proyecto).
8. **`escritorio/` queda intacto: cero ficheros nuevos.** A diferencia de la 017
   (que creó `hoja-impresion.css` y tuvo que tocar `extraResources`), la 018 solo
   modifica ficheros ya empaquetados: el instalador se regenera, no se reconfigura.
   *Descartado:* cualquier reflejo de añadir recursos «por si acaso».

## 5. Estructura de tareas (orden estricto)

| # | Tarea | Por qué en este sitio |
|---|---|---|
| T-01 | Spec aprobada | Ya hecha (2026-10-21) |
| T-02 | `logica.js` + tests: `filtrarClientes`/`filtrarPorProvincia` con arrays, `SIN_PROVINCIA`, `marcasProvinciaValidas`, `nombreMarcasProvincias` (rojo→verde) | Núcleo semántico: se valida solo con `node --test` antes de tocar interfaz |
| T-03 | `logica.js` + tests: `textoContextoImpresion` con listas + `mensajeEstadoVacio` (rojo→verde) | Presentación en papel y estados vacíos, también pura y testeable sin DOM |
| T-04 | Barra completa: `index.html` + `styles.css` + `hoja-impresion.css` + `app.js` (estado, paneles, marcas, etiquetas, Escape/foco, visibles, contador) | La app queda usable de punta a punta con los filtros múltiples en web |
| T-05 | Validación y flujos: repueblado RF-1605, reset RF-1609 (alta/importación), estados vacíos RF-1607, repintados tras edición/borrado | Se apoya en T-02 (`marcasProvinciaValidas`) y T-03 (`mensajeEstadoVacio`) |
| T-06 | Impresión RF-1608: cabecera con listas en vista previa + `beforeprint` + hoja limpia sin paneles | Toca `app.js` e `hoja-impresion.css` ya estables |
| T-07 | Verificación completa en navegador (MCP, web) + `node --test` + integridad de datos | Evidencia automatizable antes de la manual |
| T-08 | Checklist manual escritorio + documentación e instalador (AGENTS, MEMORY, `npm run build` + humo, estados, commit único) | Como en 015/016/017 |

Detalle de cada tarea (RF y «Hecho cuando»): `tasks.md`.

## 6. Estrategia de verificación

### 6.1 `node --test` y sintaxis

- `node --check logica.js app.js`.
- **≥ 141/141** con los tests adaptados a listas y los nuevos de la §2
  (áreas a-d del RF-1610); los tests ajenos intactos.

### 6.2 Chrome DevTools (web, `index.html`) — acta en T-07

- **Semilla** con los clientes del acta de la spec: `A: Tela/Valencia`,
  `B: Espuma/Castellón`, `C: Tela+Espuma/Valencia`, `D: sin tipos/Castellón`,
  `E: Toldos (libre)/Valencia`, `F: sin tipos y sin provincia`, más `G` con la
  provincia escrita literalmente «Sin provincia» (colisión) y variantes
  «CÁDIZ»/«cadiz»/«Gandía».
- **RF-1601**: exactamente dos controles, **cero** botones `data-filtro`, etiquetas
  al marcar, buscador intacto al final, sin claves nuevas en `localStorage`,
  consola limpia.
- **RF-1602/1603/1604**: los escenarios del acta (tipo {Tela, Espuma} → A, B, C;
  + {Castellón} → solo B; búsqueda «b» → solo B; {Otros, Sin tipo} → D y E;
  «Sin provincia» sola → solo F; colisión: normal → G, fija → F, ambas → F y G).
- **RF-1605**: cambio de tipos que desmarca «Castellón» sola; borrado del último
  cliente de una provincia marcada; «Sin provincia» **nunca** se desmarca sola
  (incluido forzado de estado para la rama defensiva, y restaurándolo).
- **RF-1606**: teclado real (Tab/Intro/Escape con foco de vuelta al trigger y
  `preventScroll`), clic fuera, «Limpiar» sin cerrar, dos paneles nunca a la vez,
  375 px con 15+ provincias sin desborde (`scrollWidth` ≤ viewport), panel abierto
  + Ctrl+P ⇒ ausente en la hoja.
- **RF-1607/1608**: los tres estados vacíos leyendo los literales **tal cual**;
  cabecera de `#cabecera-impresion` tras abrir la vista previa y tras despachar
  `beforeprint` = `textoContextoImpresion(...)`.
- **RF-1609**: hash de `gestorClientes` idéntico antes/después de filtrar, abrir y
  cerrar paneles; solo la clave `gestorClientes` en `localStorage`; recarga ⇒
  filtros vacíos; regresiones 002-017 (alta/edición/borrado/exportar/importar,
  listado, mapa, vista previa).

### 6.3 Checklist manual escritorio — acta en T-08 (remite a la spec)

- `npm start`: los mismos filtros funcionan en la app; un alta con filtros activos
  deja ambos grupos y la búsqueda limpios; **hash de `clientes.json` idéntico**
  antes/después de filtrar; la vista previa y el PDF muestran la cabecera con las
  piezas múltiples («Sin provincia» tal cual si está marcada); consola limpia.
- Instalador regenerado y humo del `win-unpacked`.

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| La doble semántica de «Sin provincia» (fija vs. escrita) se mezcle en el filtrado | Marca `""` exclusiva de la fija (D2) + tests de colisión en ambas direcciones (T-02) y escenario G en el acta del navegador (T-07) |
| Quedar la app rota al retirar las pestañas del HTML | T-04 integra HTML+CSS+app.js; no hay tarea intermedia con referencias huérfanas (D6) |
| Escape del panel pisar (o ser pisado por) el Escape de la vista previa de la 017 | Un listener `keydown` acotado: primero los paneles, y solo actúa si hay panel abierto; verificado en T-07 con ambos flujos |
| El panel abierto viaje a la impresión/PDF | Los paneles viven dentro de `.barra-filtros`, que la hoja oculta como chrome; prueba con panel abierto + Ctrl+P en T-07 y revisión del PDF en T-08 |
| Las provincias huérfanas queden marcadas sin efecto visible (filtro imposible) | `marcasProvinciaValidas` en **cada** repueblado (T-05), con forzado de estado para la rama defensiva |
| La etiqueta del trigger desborde la barra a 375 px | `ellipsis` + `title` obligatorio (RF-1601) y prueba con las cinco marcas y provincias largas en T-07 |
| Romper el comportamiento de la vista previa/PDF al cambiar `textoContextoImpresion` | T-03 adapta la función y sus tests; T-06 re-verifica vista previa, `beforeprint` y guardia de cero visibles de la 017 |
| El instalador quedara desactualizado | T-08: `npm run build` + humo del `win-unpacked` (cero cambios en `extraResources`, D8) |
