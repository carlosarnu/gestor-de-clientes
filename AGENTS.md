# AGENTS.md — Gestor de Clientes

Web estática y portable para que un comercial autónomo gestione sus clientes
(empresa, CIF, contacto, teléfono, email, dirección, provincia, varios tipos de
cliente — Tela, Espuma, Estructuras u otros —, y notas) mediante almacenamiento local. Pensada para abrirse con doble clic y
funcionar sin servidor. La misma web se empaqueta como **aplicación de escritorio** (`escritorio/`, Electron, spec 011) guardando en `Documentos\Gestor de Clientes\clientes.json`.

## Stack y estructura

- HTML5, CSS3 y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `escritorio/`: embudo opcional de escritorio (**excepción aprobada** a la regla 1, spec 011):
  `main.js`, `preload.js` y `package.json` con `electron`/`electron-builder` **solo como
  devDependencies**; carga la misma web (`../index.html`) y en modo escritorio la fuente
  única es `Documentos\Gestor de Clientes\clientes.json` (mismo array; `localStorage`
  solo en la web).
- `index.html` (estructura), `styles.css` (estilos), `app.js` (interfaz y estado),
  `logica.js` (lógica pura, sin DOM ni localStorage) y `hoja-impresion.css` (la hoja
  de papel y vista previa: enlazada con `media="print"` y conmutada a `all` mientras
  la vista previa está abierta; spec 017). El orden de los `<script>` importa:
  `logica.js` se carga **antes** que `app.js`, que usa sus funciones globales
  (`filtrarClientes`, `buscarClientes`, `claseTipo`…).
- Tests: archivos `test-*.js` con el runner nativo de Node (`node --test`).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
  (`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Convenciones

- Interfaz 100% en español; identificadores, comentarios y documentación también en
  español (regla 5 de la constitución).
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio, retro-memphis (spec 003) y responsive; objetivos táctiles ≥ 44 px.
- Toda la lógica reusable va a `logica.js` con tests en `test-*.js`; `app.js` solo
  presenta, escucha eventos y orquesta.

## Datos

- `localStorage`, clave única `gestorClientes` (JSON con un array de clientes).
- Esquema del cliente (**14 campos**): `{ id, fecha, empresa, cif, contacto, telefono,
  movil, email, direccion, codigoPostal, provincia, tipos, tipo, notas }`. **Ningún campo es
  obligatorio** (spec 007): lo vacío se muestra como «Sin nombre»/«Sin tipo».
- `provincia` (spec 015) es **texto libre opcional**: si un cliente antiguo no la tiene
  se lee como `""` **sin ninguna escritura de migración** (a diferencia de `tipos`).
- `tipos` es un **array canónico** con todos los tipos del cliente (los tres fijos
  `"Tela" | "Espuma" | "Estructuras"` y **texto libre** sin límite, en orden de adición y
  sin duplicados; spec 014). `tipo` es un **string de compatibilidad, solo de lectura**:
  `tipos[0] ?? ""` (para lectores antiguos; la lectura efectiva pasa siempre por
  `tiposCliente`). **Migración idempotente** al cargar e importar (`migrarTipos`, spec
  014): añade `tipos` y reescribe `tipo`, y **no escribe nada** si ya está migrado; el
  valor antiguo «FOAM» se convierte en «Espuma» dentro de `tipos` (spec 009): ningún
  cliente guardado se pierde.
- `fecha` es timestamp de época (`Date.now()`); la lista se ordena del más reciente
  al más antiguo (ver skill `local-dates` al tocar fechas).
- Nunca se cambia la clave ni el esquema sin actualizar `docs/constitution.md` y los tests.
- **Modo escritorio (Electron)**: la fuente única es `Documentos\Gestor de Clientes\clientes.json`
  (mismo formato de array; se aplica `migrarTipos` al leer); no se usa `localStorage`.

## Funcionalidades implementadas

- **Alta, edición y borrado (spec 002)**: el mismo formulario sirve para editar; se
  conservan `id`, `fecha` y el filtro activo. El borrado pide confirmación dentro de la
  tarjeta («¿Seguro? · Sí, eliminar / No»), sin `confirm()` nativo. Avisos breves en un
  toast de 2,5 s.
- ~~Filtros (Todos / Tela / Espuma / Estructuras / Otros)~~: **las pestañas
  desaparecieron con la spec 018** (RF-1205/RF-104 derogados) y ahora son **dos
  desplegables con casillas** (Tipo + Provincia) — ver «Filtros múltiples (spec
  018)» abajo—. Sigue vigente el filtrado **por pertenencia** (spec 014): un cliente
  de varios tipos cumple cada una de sus marcas de tipo.
- **Buscador por texto (spec 005)**: campo «Buscar cliente» que filtra en vivo mientras
  se escribe, con todas las palabras («y») repartidas entre los campos, ignorando
  acentos y mayúsculas. Se combina con el filtro de tipo y sobrevive a cambios de
  filtro y ediciones. Estado vacío contextual: «No hay coincidencias para «X»…».
- **Mapa (spec 004)**: si `direccion` no está vacía, la tarjeta muestra un cuadro de
  Google Maps (iframe embed sin API key) y el enlace «Ver en Google Maps»; sin
  conexión solo queda el enlace (`target="_blank" rel="noopener"`). Los listeners
  `online`/`offline` refrescan la lista.
- **Diseño retro (spec 003)**: paleta de materiales (índigo Tela, mostaza Espuma,
  acero Estructuras), banda tricolor, espina de color por tarjeta, tinta `#1d241f`,
  sin sombras.
- ~~Acceso con clave y permisos (spec 006)~~: **retirado el 2026-10-13** a petición del
  usuario (no conseguía entrar y quiere ver la web antes de convertirla en app de
  escritorio). La app **no** tiene pantalla de clave, roles, panel de administrador (el exportar/importar libre lo trae la
  spec 011); al arrancar se borran los restos (`gestorAcceso`, `gestorSesion*`).
  La spec queda como historial en `specs`.
- **Formulario libre y campos nuevos (spec 007)**: nada es obligatorio; la ficha muestra
  «Sin nombre»/«Sin tipo» cuando faltan. Campos **Móvil** y **Código postal** en
  formulario, ficha y buscador; el mapa usa dirección + código postal.
- ~~Desplegable de tipo con «Otros» (spec 008)~~: retirado por la 014 y **su interfaz
  restaurada por la spec 016**, que a su vez **sustituyó el desplegable por casillas de
  selección múltiple (2026-10-20)** (ver «Desplegable de tipo (spec 016)» abajo). Sigue
  vigente lo demás de la 008: los tipos no fijos se agrupan en la pestaña de filtro
  **Otros** (violeta) y comparten ese color en la ficha; los «Sin tipo» siguen solo en
  «Todos».
- **Renombrado FOAM → Espuma (spec 009)**: el valor interno del tipo pasó a «Espuma»
  (HTML, CSS, JS y datos) con migración automática al abrir (`migrarTipos`); además
  cinta de la cabecera a 4 colores, «Correo electrónico» en la ficha y docs al día.
- **Copia de seguridad y app de escritorio (spec 011)**: botones **«Exportar»** (descarga
  `clientes-AAAA-MM-DD.json`) e **«Importar»** en la web (reemplaza con confirmación en
  línea y contadores; JSON inválido avisa sin tocar datos). Carpeta `escritorio/` con
  Electron: ventana «Gestor de Clientes» sin barra de navegador, datos en
  `Documentos\Gestor de Clientes\clientes.json` (dañado → se renombra a
  `clientes-daños-…json`, nunca se borra), arranque sin archivo → mensaje de migración
  en 2 clics («Exportar» en la web → «Importar» en la app).
- **Listado compacto (spec 012)**: conmutador **«Tarjetas» ↔ «Listado»** en la cabecera de
  la lista; el listado son filas con **solo los campos elegidos** mediante chips de
  selección múltiple (por defecto solo «Empresa»; catálogo único `CATALOGO_CAMPOS` de 12
  campos, «Fecha de alta» la última en dd/mm/aaaa local). Cada fila tiene **las mismas
  acciones que la tarjeta** («Editar»/«Eliminar» con «¿Seguro? · Sí, eliminar / No» dentro
  de la celda de acciones y marca de edición en toda la fila), el mismo filtro, búsqueda,
  contador y estados vacíos, canto de color por tipo y **sin mapa ni iframes**; texto largo
  en una línea cortada con «…» + `title`. **La vista y la selección NO se persisten**
  (RF-1006): cada arranque empieza en «Tarjetas» con solo «Empresa» y no se crea ninguna
  clave nueva de `localStorage`.
- **Impresión del listado (spec 013)**: botón **«Imprimir»** en la cabecera de la lista
  (visible en las dos vistas) que imprime **lo que se ve** —vista actual, filtro, búsqueda
  y campos elegidos— con `window.print()` (diálogo nativo del navegador); con cero
  clientes visibles avisa («No hay clientes para imprimir») **sin** abrir el diálogo (esa
  guardia es solo del botón; Ctrl+P / menú del navegador no se intercepta). La hoja sale
  limpia: solo la **cabecera de contexto** («Gestor de Clientes · Filtro: X ·
  Búsqueda: «texto»», texto puro de `textoContextoImpresion` en `logica.js`), rellenada
  **fresca en cada impresión** vía `beforeprint` (cubre el botón y Ctrl+P), y el listado
  de la vista activa —tabla con su cabecera de columnas repetida en cada página, tarjetas
  en una sola columna y sin cortes entre páginas, texto completo sin «…», sin mapa, sin
  columna «Acciones» ni chrome interactivo—; el `<h2>` de la lista no se imprime (la
  cabecera de contexto ya lo lleva). Sin claves nuevas ni dependencias: es presentación
  pura (`@media print`). **Dos puntos derogados por la 017**: el botón ya no llama a `window.print()` directamente (abre la vista previa) y la app de escritorio **sí** genera el PDF; la guardia de cero visibles, la cabecera de contexto en `beforeprint` y la hoja limpia siguen intactas (ahora en `hoja-impresion.css`).
- **Tipos múltiples (spec 014)**: un cliente admite **varios tipos a la vez**. *(La
  interfaz de chips que introdujo aquí **fue sustituida por la spec 016** —primero
  desplegable de selección única, hoy **casillas de selección múltiple**—; abajo solo
  queda lo que sigue vigente.)* Los filtros son
  **por pertenencia**: un multi-tipo cumple **cada una** de las marcas de sus tipos y
  **«Otros»** si tiene tipos libres (los sin tipos solo cumplen «Sin tipo») — *la frase
  final del RF-1205 sobre «las pestañas» quedó **derogada por la 018**: ya no hay
  pestañas, pero la pertenencia sigue intacta*—. La
  tarjeta pinta **un badge por tipo** con el **canto del primer tipo**; el listado y la
  impresión muestran la celda unida («Tela + Espuma»). Se guarda con `tipos` (array) +
  `tipo` = `tipos[0] ?? ""` (compatibilidad de lectura), con migración idempotente en las
  tres rutas de carga (web, escritorio, importar).
- **Provincia (spec 015)**: campo **`provincia`** opcional en el esquema. En el
  formulario es un **campo combinado** `<input list="lista-provincias">` + `<datalist>`
  estático con las **52 provincias/ciudades de España** (primero Valencia, Alicante,
  Castellón y Murcia, el resto alfabético): el navegador sugiere y **permite escribir
  libre** (se guarda lo escrito, recortado). La ficha muestra la línea **«Provincia»
  tras «Código postal»** (oculta si vacía); «Provincia» entra en el buscador y en el
  catálogo del listado (**12 campos**, entre CP y Tipo, «—» sin valor). **Filtro por
  provincia** — *(el desplegable **único** «Todas las provincias» y toda la mecánica de
  mensajes del RF-1306 quedaron **derogados por la 018**: ahora es un desplegable con
  **casillas** («o» dentro del grupo) con su casilla fija «Sin provincia»; las reglas de
  **opciones** de esta entrada siguen intactas: una opción por provincia de los clientes
  del **tipo activo**, variantes homófonas unificadas normalizando acentos y mayúsculas,
  y vuelta automática a «sin filtro» si desaparecen)* — que se combina en **Y** con
  el filtro de tipo y la búsqueda; la cabecera de impresión gana la 3ª pieza
  «Provincia: X» *(la 018 la convierte en **lista**: «Provincia: Valencia,
  Castellón»)*. **Sin claves nuevas** de `localStorage` y **sin escritura de
  migración** (los clientes antiguos sin `provincia` se leen como `""` y no se
  reescriben).
- **Desplegable de tipo (spec 016)**: la interfaz del formulario de tipos vuelve al
  patrón de la 008 **sin tocar el modelo de datos de la 014/015**: un **`<select>`
  «Tipo de cliente»** con 5 opciones — **«Sin tipo»** (vacía, por defecto en alta),
  **Tela**, **Espuma**, **Estructuras** y **«Otros»** — y un **campo condicional**
  «Escribe el tipo de cliente» (`placeholder` «p. ej. Toldos», `maxlength="40"` solo
  en el formulario) que **solo aparece en «Otros»** (oculto con `hidden`, sin espacio,
  y el texto se **descarta** al cambiar de opción). Mapeo al guardar
  (`tiposDesdeFormulario()` en `app.js`): «Sin tipo» → `[]`; fijo → `[fijo]`;
  «Otros» → `[texto]` o `["Otros"]` si vacío/espacios, y si el texto coincide con un
  fijo se guarda como fijo. Edición: carga el **primer** tipo de `tiposCliente` (el
  literal «Otros» deja el campo **vacío**); un multi-tipo editado conserva **solo**
  el tipo elegido (limitación aceptada de la **selección única**). `logica.js` y los
  tests **intactos** (122/122, cero tests nuevos); los chips del **listado** (spec 012)
  no cambian.
  *(**SUSTITUIDO el 2026-10-20** por **casillas de selección múltiple** a petición del
  usuario («Quita el desplegable y pon los tipos para que se puedan seleccionar de uno
  en uno»; cambio pequeño sin spec, misma fórmula que la revisión global). El `<select>`
  desapareció: ahora son **cuatro casillas** `Tela | Espuma | Estructuras | Otros` en
  `<div class="casillas-tipos" role="group" aria-label="Tipo de cliente">` (etiquetas
  `<label for>`, casilla 20 px dentro de un objetivo **≥44 px**, foco visible en la
  casilla entera vía `:focus-within`), marcables **varias a la vez o ninguna**. El
  **campo condicional sigue igual** (solo al marcar «Otros», texto descartado al
  desmarcar, RF-1402). El mapeo pasó a `app.js` (`tiposDesdeFormulario()` solo lee el
  DOM) → helper puro **`tiposDesdeCasillas(marcados, textoLibre)` en `logica.js`**
  (**+8 tests → 141/141**): nada → `[]`; fijos en **orden canónico**; el texto se
  **parte por «, », se recorta, se deduplica** y va tras los fijos; «Otros» marcado
  **sin texto** → `["Otros"]`; texto igual a un fijo (`normalizar`, RF-1403) → fijo.
  Edición: **cada** fijo marca su casilla y los tipos **libres** van al campo unidos
  por «, » con «Otros» marcado (literal «Otros» → campo **vacío**, RF-1404) → **los
  multi-tipo ya no pierden nada al editar** (se acabó la limitación de la selección
  única). Retirados `.campo select` y `.campo select:focus` (sin uso; el desplegable
  de provincia tiene los suyos). `tipo` = `tipos[0] ?? ""` intacto, sin claves nuevas y
  los chips del **listado** (spec 012) sin cambios.)*
- **Vista previa de impresión y PDF (spec 017)**: el botón **«Imprimir»** ya no abre el
  diálogo del navegador (deroga el RF-1102 de la 013): abre una **vista previa dentro
  de la app** (clase `modo-vista-previa` en `<body>` + `#estilo-hoja` conmutado de
  `media="print"` a `"all"`) con la hoja tal como saldrá. **Barra**
  `#barra-vista-previa` con **«Imprimir»** (mismo `window.print()`), **«Guardar como
  PDF»** —web: también `window.print()`; escritorio: IPC **asíncrono** `guardar-pdf`
  (`dialog.showSaveDialog` → `webContents.printToPDF` A4 con fondos →
  `fs.writeFile`) que guarda **`listado-AAAA-MM-DD.pdf`** con fecha **local**— y
  **«Cerrar»** (Escape también); al cerrar se restauran filtro, búsqueda, vista, scroll
  y foco (`focus({preventScroll:true})`). Guardia de la 013 intacta: con cero visibles
  no se abre nada. La hoja de **los dos caminos** de impresión (vista previa y
  Ctrl+P/imprimir nativo) vive en **`hoja-impresion.css`** (cada regla visual una sola
  vez; `styles.css` solo conserva 3 reglas mecánicas dentro de su `@media print`); el
  apilado móvil va con prefijo `body:not(.modo-vista-previa)`. Los avisos de PDF van en
  el `<p id="estado-vp">` de la barra (el toast lo oculta la hoja con la previa
  abierta): «PDF guardado: nombre» / «No se pudo generar el PDF» con la vista previa
  abierta. `logica.js` solo añade **`nombreArchivoPdf(fecha)`** → **123 tests**. Sin
  claves nuevas de `localStorage` y JSON de clientes byte-idéntico al imprimir o
  guardar PDF.
- **Filtros múltiples (spec 018)**: las pestañas de tipo y el `<select>` único de
  provincia desaparecen (RF-1205/RF-1305/RF-1306 y RF-104 derogados) y pasan a ser
  **dos desplegables con casillas** en `.barra-filtros` (antes del buscador): cada uno
  es un **trigger** `<button>` (`#trigger-tipo` / `#trigger-provincia`, etiqueta viva
  «Tipo: Tela, Espuma (2)» / «Provincia: Valencia (1)», `aria-expanded` + `aria-controls`)
  y un **panel** oculto por defecto con casillas del mismo patrón del formulario y su
  botón **«Limpiar»** (desmarca ese grupo **sin cerrar** el panel). Semántica: **«y»
  (intersección) dentro del grupo tipo** —enmienda aprobada por el usuario el
  2026-10-22: «Tela»+«Espuma» = **solo** los que son de las dos; **«Sin tipo» + cualquier
  otra marca = imposible lógico → 0 resultados sin desmarcar nada** (los cinco marcados
  ya **no** equivalen a «sin filtro»; eso solo lo es **cero marcas**)—, **«o» dentro del
  grupo provincia** y **«y» entre tipo, provincia y búsqueda**. El panel de tipo tiene
  las cinco casillas fijas (Tela, Espuma, Estructuras, Otros, Sin tipo); el de provincia
  es **espejo de los datos** (provincias únicas normalizadas de los clientes del tipo
  activo, «Gandía» y «CÁDIZ» incluidas) con la **casilla fija «Sin provincia»** (marca
  `""`, SIEMPRE al final, **nunca se desmarca sola**); las opciones se **repueblan** al
  cambiar el grupo tipo y las huérfanas **se desmarcan solas** (panel sin cerrarse).
  Foco: Tab/Intro/Espacio operan el trigger, Escape y el clic fuera cierran
  **devolviendo el foco al trigger** sin mover el scroll; **nunca dos paneles a la vez**.
  Estados vacíos nuevos (`mensajeEstadoVacio` en `logica.js`): prioridad búsqueda →
  filtros → lista vacía, con literales propios («…o desmarca alguna casilla.»,
  «No hay clientes con estos filtros (Tipo: … · Provincia: …).…»). Cabecera de
  impresión con **listas** (`textoContextoImpresion` con arrays; piezas Filtro ·
  Provincia · Búsqueda). Lógica nueva en `logica.js`: `filtrarClientes(lista,
  marcasTipos)` y `filtrarPorProvincia(lista, provincias)` con **firma de arrays**
  (`[]` = sin filtro), `marcasProvinciaValidas` y `mensajeEstadoVacio` →
  **166 tests**. **Sin claves nuevas** de `localStorage`: las marcas son estado de
  sesión en memoria; alta e importación dejan **ambos grupos sin marcas** y la búsqueda
  vacía. El modelo de datos (14 campos, `tipos`/`tipo`) **no cambia**.

## Forma de trabajar (SDD)

- No escribas código a lo ciego: sigue Spec-Driven Development (skill `sdd`) —
  constitución → especificación (`spec.md`) → plan (`plan.md`) → tareas (`tasks.md`) →
  implementación. Las specs viven en `specs`.
- Para el flujo SDD completo, selecciona `coordinator` como **agente principal** (selector
  de agentes del TUI, p. ej. `/agent coordinator`) — él orquesta a los subagentes
  `@planner`, `@reviewer` e `@implementer`. Para cambios pequeños que no merecen spec,
  usa `/feature`.
- NOTA free tier: si un agente nuevo falla con «free tier can only be used from within
  OpenCode», es el límite de sesiones de la free tier (mensaje engañoso); se recupera
  solo al pasar la ventana y no es configuración del proyecto.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
  tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
  porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
  dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Comandos

- Tests de la lógica: `node --test` (descubre los archivos `test-*.js`). No es un
  indicador de salud si no hay tests.
- Sin `package.json` en la raíz: la app no tiene dependencias ni build (el único
  `package.json` es el de `escritorio/`).
- App de escritorio: `cd escritorio && npm install` y `npm start` (arranca la app);
  `npm run build` genera el instalador NSIS en `escritorio/dist/`.

## Reglas

- Lee `docs/constitution.md` antes de tocar código (5 reglas innegociables).

## Límites

- ✅ Permitido: JS nativo, CSS puro, `localStorage`, iframe de Google Maps, tests con
  `node --test`, MCP de Chrome DevTools para verificar la interfaz.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Cuidado: tocar `localStorage` (datos reales del usuario), el orden de los
  `<script>` en `index.html`, los valores internos del campo `tipo`, las specs ya
  cerradas en `specs` y las fechas (`fecha`).
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build **al código de la app**
  (excepción única: devDependencies de Electron en `escritorio/`, spec 011).
- 🚫 Prohibido: frameworks, bundlers, npm (salvo en `escritorio/`), módulos ES, claves de API en texto plano,
  `confirm()`/`alert()` nativos, exigir un servidor para funcionar.

## Verificación

La lógica pura se verifica con `node --test`. La interfaz se verifica con el MCP de
Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola (debe
quedar limpia) y comprueba la vista móvil (375 px, sin desbordamiento). Al terminar,
borra los datos de prueba
(`localStorage.removeItem("gestorClientes")`) para que la app arranque vacía.
La app de escritorio se verifica con `npm start` (arranca, un alta aparece en
`clientes.json`) y con `npm run build` (instalador).
