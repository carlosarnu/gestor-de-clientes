# AGENTS.md — Gestor de Clientes

Web estática y portable para que un comercial autónomo gestione sus clientes
(empresa, CIF, contacto, teléfono, email, dirección, tipo: Tela, Espuma, Estructuras u Otros,
y notas) mediante almacenamiento local. Pensada para abrirse con doble clic y
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
- Esquema del cliente: `{ id, fecha, empresa, cif, contacto, telefono, movil, email,
  direccion, codigoPostal, tipo, notas }`. **Ningún campo es obligatorio** (spec 007):
  lo vacío se muestra como «Sin nombre»/«Sin tipo».
- `tipo` se guarda como uno de los tres fijos (`"Tela" | "Espuma" | "Estructuras"`), como
  `"Otros"` o como el **texto libre** escrito al elegir «Otros» (spec 008). El valor
  antiguo «FOAM» se convierte en «Espuma» al cargar (`migrarTipos`, spec 009): ningún
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
  valor interno (`"Espuma"` para la pestaña Espuma). El desplegable funciona igual.
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
- **Tipo «Otros» (spec 008)**: el desplegable tiene una cuarta opción «Otros» que abre
  un campo para escribir el tipo («Toldos»…; vacío = «Otros»). Los tipos no fijos se
  agrupan en la pestaña de filtro **Otros** (violeta) y comparten ese color en la ficha;
  los «Sin tipo» siguen solo en «Todos».
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
  selección múltiple (por defecto solo «Empresa»; catálogo único `CATALOGO_CAMPOS` de 11
  campos, «Fecha de alta» la última en dd/mm/aaaa local). Cada fila tiene **las mismas
  acciones que la tarjeta** («Editar»/«Eliminar» con «¿Seguro? · Sí, eliminar / No» dentro
  de la celda de acciones y marca de edición en toda la fila), el mismo filtro, búsqueda,
  contador y estados vacíos, canto de color por tipo y **sin mapa ni iframes**; texto largo
  en una línea cortada con «…» + `title`. **La vista y la selección NO se persisten**
  (RF-1006): cada arranque empieza en «Tarjetas» con solo «Empresa» y no se crea ninguna
  clave nueva de `localStorage`.

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
