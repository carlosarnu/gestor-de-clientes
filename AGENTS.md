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
  `logica.js` (lógica pura, sin DOM ni localStorage). El orden de los `<script>` importa:
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
- **Filtros (Todos / Tela / Espuma / Estructuras / Otros)**: pestañas con `data-filtro` =
  valor interno (`"Espuma"` para la pestaña Espuma), con filtrado **por pertenencia**
  (spec 014): un cliente de varios tipos sale en la pestaña de cada uno de sus tipos.
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
- ~~Desplegable de tipo con «Otros» (spec 008)~~: el desplegable «Tipo de cliente» y su
  campo condicional **retirados por la spec 014** — ahora son **chips de selección
  múltiple** con texto libre sin límite. Sigue vigente lo demás de la 008: los tipos no
  fijos se agrupan en la pestaña de filtro **Otros** (violeta) y comparten ese color en la
  ficha; los «Sin tipo» siguen solo en «Todos».
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
  pura (`@media print`).
- **Tipos múltiples (spec 014)**: un cliente admite **varios tipos a la vez**. El
  formulario usa **chips de selección múltiple** en lugar del desplegable: los tres tipos
  fijos como casillas generadas desde `TIPOS_FIJOS` (marcado visible con `aria-checked`,
  no solo color) + campo **«Añadir otro tipo»** para texto libre **sin límite** (el
  `maxlength="40"` es solo del input; la lógica no trunca), con «×» para quitar cada chip
  libre; **nada es obligatorio** y la selección vive solo en memoria (**sin claves
  nuevas**). Los filtros son **por pertenencia**: un multi-tipo sale en cada pestaña de
  sus tipos y en **«Otros»** si tiene tipos libres (los sin tipos solo en «Todos»). La
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
  provincia** (desplegable «Todas las provincias» + una opción por provincia de los
  clientes del **tipo activo**, variantes homófonas unificadas normalizando acentos y
  mayúsculas, y vuelta a «Todas» si la selección desaparece) que se combina en **Y** con
  el filtro de tipo y la búsqueda; la cabecera de impresión gana la 3ª pieza
  «Provincia: X». **Sin claves nuevas** de `localStorage` y **sin escritura de
  migración** (los clientes antiguos sin `provincia` se leen como `""` y no se
  reescriben).

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
