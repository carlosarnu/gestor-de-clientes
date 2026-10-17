# Tareas — Spec 015 · Provincia del cliente

> **Dependencia:** empezar solo **después de cerrar la 014-tipos-multiples**
> (comparte `logica.js`, `app.js`, `index.html` y `CATALOGO_CAMPOS`).
> Orden de dependencia estricto: T-01 → T-02 → … → T-08.

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md`, `plan.md` y este `tasks.md` en `specs/015-provincia/`.
  - **RF:** RF-1301 a RF-1310.
  - **Hecho cuando:** el usuario aprueba spec, plan y tareas. *(Hecho: 2026-10-17 —
    bajo la **autorización de fase del usuario** (2026-10-16: «hazlo todo… hazlas
    todas», sin preguntas, specs 013/014/015); «campo + filtro por provincia» pedido
    por el usuario. **Corregido 2026-10-17** al campo combinado con `datalist`
    (desplegable nativo + escritura libre) según su petición literal. **Revisado
    2026-10-17 tras QA**: 7 correcciones + opcionales aplicadas en spec/plan/tasks.)*

- [x] **T-02 — Lógica pura: lectura tolerante, provincias, filtro, catálogo, búsqueda e impresión + tests (`logica.js` + `test-provincia.js` + tres aserciones de `test-logica.js`)**
  - **Descripción:** nuevas `provinciaCliente`, `provinciasExistentes` (únicas por
    `normalizar()`, primera forma, orden alfabético «es», vacíos fuera),
    `coincideProvincia`, `filtrarPorProvincia` (vacío = sin filtrar; el `<select>` solo
    emite `""` o nombres de provincia), `provinciaValida` (sobre el **array de strings**
    de salida de `provinciasExistentes`); ampliaciones: `provincia` en
    `CATALOGO_CAMPOS` (entre `codigoPostal` y `tipo`, **12 entradas**), en
    `textoBusquedaCliente`, en `construirCliente`/`actualizarCliente` (texto recortado,
    vacío = `""`), en `importarClientes` (ausente → `""`, literales de error intactos) y
    `textoContextoImpresion(filtro, busqueda, provincia)` con el **tercer parámetro
    opcional**; todo exportado en `module.exports`. Tests en rojo→verde en el archivo
    **nuevo** `test-provincia.js` (los 11 bloques del plan §5), sin DOM; `app.js` sin
    tocar (llega en T-04…T-06). De `test-logica.js` **solo se actualizan tres
    aserciones** que el campo nuevo rompe por diseño: **`test-logica.js:121`** (13 →
    **14** claves de `construirCliente`), **`test-logica.js:447-459`** (catálogo **11 →
    12**, añadiendo clave/etiqueta «provincia» entre `codigoPostal` y `tipo`) y
    **`test-logica.js:465`** (`normalizarSeleccion(["id", "provincia", "empresa"]) →
    ["empresa", "provincia"]`); **el resto de `test-logica.js` queda intacto** (105
    tests en verde con esas tres actualizaciones).
  - **RF:** RF-1301, RF-1302 (lógica), RF-1304, RF-1305 (lógica), RF-1307 (catálogo),
    RF-1308 (lógica), RF-1309 (lógica), RF-1310 (tests).
  - **Hecho cuando:** `node --test` en verde (tests nuevos + `test-logica.js` con solo
    las tres aserciones actualizadas); cubiertos: `provincia` ausente/no texto/espacios
    (falsy → `""`, nunca «false»), únicas normalizadas y ordenadas, «Cádiz»≈«cadiz»
    solo en el filtro, filtro vacío sin filtrar, combinación con tipo, selección que
    desaparece (sobre el array de strings), búsqueda multi-palabra con provincia, celda
    «—», `construirCliente`/`actualizarCliente` recortando, importar con/sin
    `provincia`, literales de error intactos y cabecera de impresión **idéntica a la
    actual** cuando no hay provincia. *(Hecho: 2026-10-17 — `node --check` OK y
    **122/122 tests en verde** (105 previos + 17 nuevos en `test-provincia.js`).
    **Ampliada la licencia a una 4ª aserción** que el plan §2.5 no contempló:
    `test-logica.js:402` (claves del cliente importado, 13 → 14, la misma naturaleza
    que `:121` — si no, el test quedaba en rojo imposible de apagar). El resto de
    `test-logica.js` intacto.)*

- [x] **T-03 — HTML y CSS: campo combinado «Provincia» (datalist) y desplegable de filtro (`index.html` + `styles.css`)**
  - **Descripción:** campo combinado `#provincia` (`<input type="text"
    list="lista-provincias" autocomplete="address-level2">`, sin `required` ni
    `maxlength`) **entre «Código postal» y «Tipo de cliente»**, con
    `<datalist id="lista-provincias">` **estático en `index.html`** (contenido, sin
    lógica ni tests de Node) que contiene las **52 provincias/ciudades de España**
    (50 provincias + Ceuta + Melilla, nombres oficiales en español): **primero
    Valencia, Alicante, Castellón y Murcia** (las principales del usuario; al vacío el
    navegador muestra las primeras) y **después el resto en orden alfabético**;
    junto a
    `.filtros`, `<select id="filtro-provincia">` con la única opción
    `<option value="" selected>Todas las provincias</option>`; CSS con objetivo táctil
    ≥ 44 px, tinta sobre el mismo fondo de los botones, sin sombras (003) y sin
    desbordes a 375 px.
  - **RF:** RF-1302, RF-1305 (markup/estilos), RF-1310 (datalist verificado en
    navegador).
  - **Hecho cuando:** el formulario muestra el campo en su posición y el filtro de
    provincia aparece junto a las pestañas; verificado **en navegador**: el datalist
    ofrece las **52 entradas** con **las 4 principales en el orden pedido** y el resto
    alfabético, sugiere al escribir y **permite escribir texto libre sin bloquear ni
    autocorregir** («Todas», «Valencia Sur»…); a 375 px no hay desbordes ni scroll
    horizontal; en pantalla no cambia nada más (el JS nuevo llega en T-04/T-05).
    *(Hecho: 2026-10-17 — `node --test` **122/122** y `node --check app.js` OK con
    **cero toques en `app.js`**. Verificado en navegador: 52 `<option>` (DOM:
    `totalOpciones: 52`), primeras 4 = Valencia, Alicante, Castellón, Murcia; el resto
    **idéntico a `localeCompare("es")`** — la misma colación que usa
    `provinciasExistentes`—, escritura libre válida (`checkValidity()` en true con
    «Valencia Sur») y `FormData` recoge `provincia` («  Málaga  ») sin tocar el JS;
    desplegable visible con «Todas las provincias»; emulación 375 px **sin desborde
    horizontal** y select de 46 px; consola limpia; `localStorage` sin datos de prueba.
    Nota: el orden alfabético del datalist sigue la colación ICU de Chrome («Álava»
    tras «A Coruña», antes de «Albacete»), coherente con `provinciasExistentes` del
    plan §2.2.)*

- [x] **T-04 — `app.js`: provincia en el formulario (alta y edición)**
  - **Descripción:** el `submit` ya manda el campo vía `FormData` →
    `construirCliente`/`aplicarEdicion`; `iniciarEdicion` carga
    `formulario.provincia.value = provinciaCliente(cliente)`; el alta **vuelve a
    «Todos» y limpia `filtroProvincia = ""`** (coherencia con la limpieza de búsqueda
    de la 010). Sin claves nuevas de `localStorage`.
  - **RF:** RF-1302.
  - **Hecho cuando:** alta con «Málaga» guarda `provincia: "Málaga"` (con los espacios
    de los bordes recortados) y `""` si se deja vacío; la edición cambia **solo**
    `provincia` conservando `id`, `fecha` y el resto de campos; al editar se carga el
    valor; el filtro de provincia activo vuelve a «Todas» tras el alta.
    *(Hecho: 2026-10-17 — 3 toques en `app.js` y **cero** en `submit`/`aplicarEdicion`
    (el `name="provincia"` del HTML ya lo recogía el `FormData` y
    `actualizarCliente` ya lo escribía recortado; el `reset()` ya limpia el campo):
    (1) `iniciarEdicion` carga `formulario.provincia.value = provinciaCliente(cliente)`;
    (2) alta: `filtroProvincia = ""` junto a la limpieza de la 010; (3) **nuevo
    `let filtroProvincia = ""` en el bloque de estado** — T-05 **NO debe
    redeclararlo**, solo repintar/usarlo (constancia en el comentario del código);
    hoy solo se limpia el estado porque T-05 aún no pinta el `<select>` ni filtra.
    Verificado en navegador: alta «  Málaga  » → `"Málaga"` y vacío/espacios → `""`
    (14 claves), edición que carga el campo y al guardar sin tocar queda
    **byte-idéntica** (el bug de la nota cerrado: la provincia **no se borra**),
    cambiar provincia cambia **solo** `provincia` (`id`/`fecha` intactos), cliente
    antiguo sin `provincia` en la lista **no se reescribe al cargar** (se completa
    `""` solo al guardar), reset limpia, filtro/búsqueda/pestaña a «Todos» en el
    alta, 375 px sin desbordes, consola limpia y `localStorage` sin datos de prueba;
    `node --check app.js` OK y **`node --test` 122/122**.)*

- [x] **T-05 — `app.js`: filtro por provincia (pintado, combinación, contador y estados vacíos)**
  - **Descripción:** `let filtroProvincia = ""`; `pintarFiltroProvincia()` (provincias
    de `filtrarClientes(clientes, filtroActivo)`, selección validada con
    `provinciaValida`, reconstrucción del `<select>`); `change` → repintar lista;
    `visiblesActuales()` = tipo → provincia → búsqueda (**conservando el
    `ordenarClientes` real**, ver plan §3.3); `pintarFiltroProvincia()`
    llamada al arrancar, al cambiar de pestaña, al alta, al editar, al borrar y al
    importar; rama de provincia en los estados vacíos **entre la de búsqueda y la de
    tipo**, con el texto literal de la spec (RF-1306).
  - **RF:** RF-1305, RF-1306.
  - **Hecho cuando:** «Cádiz»+tipo «Tela» muestra solo la intersección; los sin
    provincia solo en «Todas»; el contador refleja tipo + provincia + búsqueda; borrar
    el último cliente de la provincia activa repuebla y **vuelve solo a «Todas»**;
    cambiar de pestaña conserva la provincia si sigue existiendo; el mensaje vacío con
    provincia es el de la spec y los textos actuales quedan intactos.
    *(Hecho: 2026-10-17 — `node --check app.js` OK y **`node --test` 122/122**. En
    `app.js`: referencia `#filtro-provincia`, `pintarFiltroProvincia()` (opciones
    «Todas» + provincias del tipo activo, selección validada y **alineada a la forma
    de la opción mostrada** — caso «Cádiz» en «Todos» vs «CÁDIZ» en «Espuma», donde
    el `<select>` solo admite valores-existentes; el filtrado, que normaliza, no
    cambia), listener `change` → estado + `pintarLista()`, `visiblesActuales()` con la
    Y tipo→provincia→búsqueda y llamadas **antes** de `pintarLista()` en arranque,
    pestañas, alta, `guardarEdicion`, `eliminarCliente` e importación. Verificado en
    navegador: opciones por pestaña (Todos: Cádiz/Málaga/Murcia/Valencia; Tela y
    Espuma: Cádiz/Málaga —con la forma «CÁDIZ» en Espuma—; Estructuras: solo
    «Todas»; Otros: Valencia) con contadores 8/4/3/0/1; Y en Cádiz+Tela (2) +«beta»
    (1); sin provincias solo en «Todas» (el cliente sin tipo con Murcia sale solo en
    «Todos»); conservación al cambiar de pestaña y vuelta a «Todas» cuando la
    provincia no existe en la nueva (Murcia→Tela); borrar el último de CÁDIZ en
    Espuma → repuebla y «Todas» (contador 2); importar JSON antiguo con Huelva
    activa → «Todas» y opciones solo «Todas»; alta con Tela+Cádiz → «Todas»+«Todos»
    y Huelva ya en opciones; mensaje de provincia **literal** («No hay clientes en
    «Inventada». Prueba con «Todas las provincias» o con la pestaña «Todos».» — rama
    defensiva: la UI no deja filtros imposibles, verificada forzando el estado);
    mensajes de búsqueda/tipo/vacío intactos; 375 px sin desbordes (select 190×46);
    consola limpia; `localStorage` sin datos de prueba y sin claves nuevas.)*

- [x] **T-06 — `app.js`: ficha con línea «Provincia» + verificación del listado (012) e impresión (013)**
  - **Descripción:** `fila("Provincia", provinciaCliente(cliente))` en `crearTarjeta`
    justo tras «Código postal» (con la **única regla de lectura**; `fila()` vacío no se
    pinta nada); el listado y la impresión no necesitan código (catálogo + «lo que se
    ve»); comprobar en navegador la columna y el papel.
  - **RF:** RF-1303, RF-1307, RF-1308 (interfaz).
  - **Hecho cuando:** la ficha con provincia muestra la línea tras «Código postal» y la
    sin provincia no la muestra; en el listado «Provincia» se puede elegir entre
    «Código postal» y «Tipo» con «—» si falta; al imprimir la columna sale y la
    cabecera dice «… · Provincia: Málaga · …».
    *(Hecho: 2026-10-17 — `node --check app.js` OK y **`node --test` 122/122**. En el
    código **solo 2 toques en `app.js`** + 1 comentario en `index.html`: (1)
    `crearTarjeta` añade `fila("Provincia", provinciaCliente(cliente))` tras
    «Código postal» — con la única regla de lectura, `fila()` oculta lo vacío;
    (2) **`beforeprint` SÍ necesitaba el tercer argumento**: pasaba
    `textoContextoImpresion(filtroActivo, textoBusqueda)` → ahora
    `…(filtroActivo, textoBusqueda, filtroProvincia)`; (3) comentario de
    `index.html` («el repoblado… llega en T-05» → ya lo hace `app.js`).
    Listado y `styles.css` **sin cambios** (catálogo + «lo que se ve» mandan).
    Verificado en navegador (5 clientes sembrados): ficha con la línea **tras CP**
    en Málaga/Cádiz, **sin línea** en el vacío, el antiguo **sin `provincia`** y el
    de provincia larga (que va tras el CP visible que tenga); listado con selector
    de **12** chips y cabecera `Empresa · Código postal · Provincia · Tipo ·
    Acciones` (Provincia entre CP y Tipo), «—» en los 3 sin valor, celda larga
    cortada (582→208 px) con `title` completo; impresión con **regla temporal
    `@media all`** (técnica de la 013; el MCP no emula el medio `print`):
    `#cabecera-impresion` visible con las 3 piezas
    «Gestor de Clientes · Filtro: Tela · Provincia: Málaga · Búsqueda: «casa»»,
    `.filtro-provincia-bloque`/`<h2>`/contador/chips/acciones `display:none`,
    columna «Provincia» impresa con su valor; **retirada la regla → todo
    restaurado** (0 `<style>` temporales). **Sin provincia: cabecera idéntica
    byte a byte** a `textoContextoImpresion("Tela","casa")` (firma de 2 args de la
    013). 375 px sin desbordes (scroll 360/375 en las dos vistas), consola limpia
    (solo el `[debug] Search endpoint` de siempre, del navegador/MCP) y
    `localStorage` sin `gestorClientes` al terminar.)*

- [x] **T-07 — Integración y verificación completa (navegador + escritorio)**
  - **Descripción:** checklist del plan §6: regresiones 005/012/013/014, datos antiguos
    sin `provincia` (**comprobando que NO se reescribe** el almacenamiento al abrir),
    importar JSON con y sin `provincia`, escritorio con `npm start` (alta con provincia
    → `clientes.json`) y `clientes.json` antiguo sin tocar, teclado (Tab/Intro en el
    desplegable), móvil 375 px, consola limpia y datos de prueba borrados.
  - **RF:** RF-1301, RF-1309, RF-1310 (y regresión de todas).
  - **Hecho cuando:** todos los criterios de aceptación de la spec cumplidos en Chrome
    DevTools, `node --test` en verde y consola sin errores.
  - *(Hecho: 2026-10-17 — **verificación integral en navegador** con Chrome DevTools MCP
    sobre `file://index.html`, datos sembrados y **borrados al final**. **Cero cambios de
    código**: la verificación no destapó ningún fallo en `logica.js`, `app.js`,
    `index.html`, `styles.css` ni `escritorio/`; `node --check app.js/logica.js` OK.)*

  ### Acta T-07 — RF → evidencia

  | RF | Evidencia en navegador (Chrome DevTools, `file://index.html`) | OK |
  |---|---|---|
  | **RF-1301** (esquema/lectura, sin migración) | 2 siembras de datos antiguos **sin la clave `provincia`** (bytes **2486 → 2486**, **2453 → 2453**, **1876 → 1876** tras `reload`: **byte-idéntico**, ninguna escritura). `Object.keys` del cliente = **14** y la clave `gestorClientes` intacta; **sin claves nuevas** en `localStorage` (solo `gestorClientes`; `diarioEstudio.tema` es de otro proyecto). Lectura tolerante en ficha: `provincia: 12` → «Provincia: **12**»; `provincia: false` → **sin línea**; sin clave → sin línea y **«—»** en el listado. | ✔ |
  | **RF-1302** (campo combinado) | Campo **entre «Código postal» y los chips** (`compareDocumentPosition` ✓); `<input type="text" id="provincia" list="lista-provincias" autocomplete="address-level2">`, **sin `required` ni `maxlength`**; datalist **52 `<option>`**, primeras **Valencia, Alicante, Castellón, Murcia** y el resto **idéntico a `localeCompare("es")`** (48/48, sin duplicados); escritura libre: «Sevilla» `checkValidity()=true`, «valencia» en minúsculas **guardada tal cual** (`"valencia"`, sin autocorrección), «Valencia Sur»/texto de 42 caracteres **fuera del datalist** guardado íntegro; alta con `"   Sevilla   "` → `"Sevilla"` (**14 claves**); foco con anillo `outline: solid 2px` y **46 px** de alto (≥44); combobox a11y `haspopup="listbox"`; alta con solo espacios → `""` y **sin línea**. | ✔ |
  | **RF-1303** (ficha) | Línea **«Provincia» justo tras «Código postal»** en las fichas con valor (Textil Norte, Sur Mixto…); **oculta** en las 4 sin valor (clave ausente, `""`, `false`); provincia de 42 chars **sin desbordes** (tarjeta 334 px, `scrollWidth===clientWidth`, página 1265/1280 y 301/375). Nada más de la tarjeta cambia (badges, canto, acciones, notas). | ✔ |
  | **RF-1304** (búsqueda) | «malaga» → **2** (Málaga y MÁLAGA); «VALENCIA» → **2**; multi-palabra repartida: «norte cadiz» → **1** (empresa + provincia), «valencia sur» → **1**; combinada con filtro y pestaña. | ✔ |
  | **RF-1305** (filtro) | Repoblado por pestaña (Todos: `12, Cádiz, Málaga, Murcia, Provincia…, Valencia`; Tela: `Cádiz, Málaga` — **CÁDIZ+Cádiz → UNA opción** —; Espuma: `Málaga, Murcia`; Estructuras: `Valencia`; Otros: solo «Todas»). **Combinación en Y**: Tela+Cádiz = 2, +«casa» = 1; **sin provincia solo en «Todas»** (4 sin provincia ausentes con Cádiz). Conservación al cambiar de pestaña (Málaga Tela→Espuma→Tela **conservada**; Cádiz→Espuma y Málaga→Estructuras **vuelven a «Todas»**). **Borrar el último de Murcia** (confirmación «¿Seguro?» en línea, sin `confirm()`) → repoblado y **valor vuelve a `""`**. «Todas» = sin filtrar (11/11 y 12/12). Teclado real: `ArrowDown` Cádiz→Málaga, `ArrowUp`, `Tab` sale del control. Estado **solo en memoria** (ninguna clave nueva). | ✔ |
  | **RF-1306** (contador/estados) | Contador = tipo+provincia+búsqueda (11/4/2/1/2/0…). Rama de provincia con texto **literal**: `No hay clientes en «Cádiz». Prueba con «Todas las provincias» o con la pestaña «Todos».` (**rama defensiva: la UI no deja filtros imposibles; verificada forzando el estado** con un `filtrarPorProvincia` temporal en la página, **restaurado después**). Prioridad correcta: con búsqueda activa sale el mensaje de **búsqueda**. Literales previos intactos: `No hay coincidencias para «zzzz»…`, `No hay clientes de tipo Otros. Prueba con la pestaña «Todos».`, `Aún no hay clientes. Rellena el formulario de arriba para añadir el primero.` | ✔ |
  | **RF-1307** (listado) | Selector con **12 chips** y selección por defecto **solo «Empresa»**; chip/orden **`codigoPostal` → `provincia` → `tipo`**; cabecera `Empresa · Código postal · Provincia · Tipo · Acciones`; **«—»** en las 4 filas sin valor; celda larga **cortada con `title` completo** (42 chars, `scrollWidth>clientWidth`); acciones por fila y marca de edición en la fila; vuelta a Tarjetas deja el selector oculto; **RF-1006 intacta** (sin claves nuevas). | ✔ |
  | **RF-1308** (impresión) | `beforeprint` con Tela+Málaga+«casa» → cabecera **exacta** `Gestor de Clientes · Filtro: Tela · Provincia: Málaga · Búsqueda: «casa»` (y con 0 visibles el botón «Imprimir» avisa `No hay clientes para imprimir` **sin** llamar a `window.print()`); con resultados → `… · Provincia: Cádiz · Búsqueda: «casa»` **idéntica** a `textoContextoImpresion("Tela","casa","Cádiz")`; **sin provincia → texto byte-idéntico** a la firma de 2 args de la 013 (`textoContextoImpresion("Tela","")`). Hoja (reglas de `@media print` de `styles.css` inyectadas como `@media all`, **retiradas después**): `.filtro-provincia-bloque` → `display:none`, cabecera de contexto `block` con su texto, `<h2>`/contador/pestañas/buscador/conmutador/botones/selector/toast `none`, **tabla + `thead` + columna «Provincia» impresa con sus valores**, columna «Acciones» `none`, celdas sin «…» (`text-overflow: clip`), tarjetas a **1 columna** con la línea de provincia visible y acciones/mapa ocultos. | ✔ |
  | **RF-1309** (almacenamiento/export/import) | **Exportar**: `clientes-2026-10-17.json`, 12 clientes, **14 claves** con `provincia`, provincias **tal cual se guardaron**, los 2 antiguos **sin la clave** (no se añade). **Importar con provincia** (con el filtro de provincia **activo**): confirmación en línea `¿Reemplazar 12 clientes actuales por 2 clientes del archivo?`, tras «Sí, reemplazar» → `"  Asturias  "` → **`"Asturias"`**, 14 claves, toast `Clientes importados`, **filtro vuelve a «Todas» + «Todos»** y buscador vacío. **JSON antiguo sin `provincia`** → ambos con **`""`** (clave presente) y `tipos` migrados (`FOAM`→`Espuma`). **Basura**: `El archivo no tiene un formato JSON válido` y `El archivo no contiene una lista de clientes` — **datos intactos byte a byte**; «Cancelar» también intacto. `escritorio/` **sin tocar** (sin cambios en `git status`). | ✔ |
  | **RF-1310** (cierre) | **`node --test` → 122/122 en verde** (105 + 17 de `test-provincia.js`), sin DOM; verificación de interfaz en navegador hecha (consola **limpia**: solo el `[debug] Search endpoint` del navegador/MCP, sin errores ni warnings); móvil 375 px; interfaz en español. `AGENTS.md`/`MEMORY.md` al día los deja **T-08** (cierre). | ✔ |

  ### Regresiones 002–014

  - **002** alta/edición/borrado con «¿Seguro? · Sí, eliminar / No» en línea y toasts
    (`Cliente guardado`, `Cliente eliminado`); edición conserva `id`/`fecha` y
    **byte-idéntica** si no se toca nada.
  - **004** mapa: 3 tarjetas con `iframe` (`title` = dirección + CP, `loading="lazy"`) y
    enlace `target="_blank" rel="noopener"`.
  - **005** buscador en vivo, multi-palabra, acentos/mayúsculas y combinado con filtros.
  - **009** migración `FOAM`→`Espuma` al importar.
  - **010/011** aviso «Cliente guardado», exportar/importar con confirmación en línea y
    literales de error intactos; arranque vacío con `Aún no hay clientes…`.
  - **012** conmutador Tarjetas/Listado, selector de 12 campos, «…»+`title`, acciones en
    fila, marca de edición; **sin claves nuevas de `localStorage`** en ningún momento.
  - **013** botón «Imprimir» con su guardia de 0 visibles y cabecera de contexto fresca.
  - **014** chips de tipos multi («Sur Mixto» con Tela+Espuma aparece en **ambas**
    pestañas), filtros por pertenencia, badges por tipo y «Sin tipo».
  - **Consola limpia** en todas las fases; **móvil 375**: `document.scrollWidth === 375`
    en formulario (campo y select **46 px**), ficha, listado apilado y estado vacío —
    los 4 `TH` que «se salen» son el `thead` **oculto visualmente** del listado apilado
    (`clip-path: inset(50%)`, RF-1004), no un desborde real.
  - **Datos de prueba borrados al final**: `localStorage.removeItem("gestorClientes")` →
    arranque en 0 clientes.

  ### Decisiones y hallazgos (ninguno requirió tocar código)

  1. **`npm start` (escritorio) NO se ejecutó en T-07** por la orden directa de la tarea
     («no toques … Electron»), porque el MCP de Chrome DevTools **no puede gobernar una
     ventana Electron** y porque arrancarlo reescribiría (si acaso) el fichero real
     `Documentos\Gestor de Clientes\clientes.json`. RF-1309 de escritorio queda cubierto
     por los tests de `importarClientes`/`construirCliente` y por `git status` (**`escritorio/`
     intacto**): el `provincia` viaja **solo** dentro del mismo array. *Propuesta para
     T-08:* ejecutar `cd escritorio && npm start` (alta con provincia → `clientes.json`)
     antes de regenerar el instalador.
  2. **Los ids de prueba deben ser numéricos**: la app hace `Number(boton.dataset.id)`,
     así que una siembra con ids de texto (`"t6"`) no se podía editar/borrar. **No es un
     bug**: la 002 genera `id` numéricos (`Date.now()`); se re-sembró con ids numéricos.
  3. **`provincia: 12` (número) en los datos se normaliza a `"12"` al GUARDAR** (RF-1302:
     lo guardado es texto recortado). Es el comportamiento pedido; la lectura tolerante
     del RF-1301 cubre la mostrada en ficha/filtro/listado.
  4. **La rama de mensaje con provincia es inalcanzable desde la UI** (el desplegable solo
     ofrece provincias con clientes, así que la lista nunca queda vacía con provincia
     activa): verificada **forzando el estado** en la página, como en T-05, y **restaurando
     la función** tras la prueba.
  5. **Técnica de impresión adaptada**: para `file://` Chrome **bloquea `cssRules`**
     (`Cannot access rules`), así que la copia de `@media print` a `@media all` se hizo
     con el **literal de `styles.css`** leído desde disco (misma técnica de la 013/T-06) y
     se **retiró** al terminar (0 `<style>` temporales).
  6. **Una pestaña del navegador con la app se cerró a mitad de verificación** (sesión
     ajena): `localStorage` de `file://` es compartido, así que la verificación siguió en
     la pestaña restante sin pérdida de evidencia.

- [x] **T-08 — Documentación y cierre**
  - **Descripción:** `AGENTS.md` (esquema con `provincia`, campo en el formulario,
    filtro por provincia y su repoblado, «provincia» como columna más del catálogo),
    línea de la 015 en `MEMORY.md` (y nota de **regenerar el instalador** cuando cierren
    014 y 015), marcar spec/plan/tasks como implementados y commits por fases.
  - **RF:** RF-1310.
  - **Hecho cuando:** docs al día, `node --test` en verde y commits hechos.
  - *(Hecho: 2026-10-17 — ver acta de cierre abajo.)*

  ### Acta de cierre T-08

  1. **Humo de escritorio (`npm start`)** — arrancó la ventana «Gestor de Clientes»
     (`cd escritorio && npm start -- --remote-debugging-port=9222`, sin tocar
     `escritorio/`: `git status` sin cambios ahí). La ventana se gobernó por **CDP**
     (Node ≥ 22 con `WebSocket`/`fetch` nativos, script temporal ya borrado — el MCP de
     Chrome DevTools no gobierna ventanas Electron): alta de **«Empresa Prueba 015»**
     con provincia **«Alicante»** → `clientes.json` con **14 claves** incluida
     `provincia`; **edición**: el campo carga «Alicante», al guardar «Valencia» cambia
     **solo** `provincia` (conserva `id`/`fecha`, 14 claves); consola **sin
     excepciones**. La app se cerró por `taskkill` limpio (0 procesos electron).
  2. **Protección del dato real**: en **este ordenador no hay dato real** —
     `Documentos\Gestor de Clientes\clientes.json` **no existe** (la carpeta, que ya
     existía vacía, quedó vacía; los datos del padre siguen pendientes de migrar desde
     la web, ver MEMORY). Ni la copia temporal de `Temp\opencode\` ni la restauración
     fueron necesarias: tras el humo se **borró el `clientes.json` de prueba** para
     dejar el estado previo (carpeta sin fichero). Ruta real resuelta por Electron en
     este equipo: `C:\Users\carlo\Documents\Gestor de Clientes\clientes.json` (carpeta
     Documents conocida por Windows, **no** la `Documentos` española del perfil).
  3. **Docs**: `AGENTS.md` — intro con «provincia», esquema a **14 campos**
     (`…, codigoPostal, provincia, tipos, tipo, notas`), nota de `provincia` opcional
     **sin escritura de migración**, catálogo de la 012 a **12 campos** y nueva viñeta
     **Spec 015 Provincia** (campo combinado + datalist de 52 con las 4 primeras,
     ficha tras CP oculta si vacía, buscador/catálogo, filtro en Y con tipo y búsqueda
     —opciones por tipo activo, homófonas normalizadas, vuelta a «Todas»—, 3ª pieza de
     la cabecera de impresión, sin claves nuevas). `MEMORY.md` — 015 **cerrada**
     (122 tests), humo con backup/restore y **pendiente**: regenerar el instalador
     `.exe` + carpeta USB. `spec.md` → **Implementada** (fórmula de la 014, cierre con
     122 tests); `plan.md` → **Estado:** aprobado (autorización de fase) e implementado.
  4. **Tests**: `node --test` → **122/122 en verde** al final.
  5. **Commit único** «Spec 015-provincia: campo combinado con datalist de 52
     provincias, ficha, buscador, listado, filtro por provincia, impresion y cierre»
     con todo lo de la 015 (T-02…T-08 + spec/plan/tasks + AGENTS + MEMORY); árbol
     limpio después.
