# AGENTS.md — Gestor de Clientes

Web estática y portable para que un comercial autónomo gestione sus clientes
(empresa, CIF, contacto, teléfono, email, dirección, tipo: Tela, FOAM o Estructuras,
y notas) mediante almacenamiento local. Pensada para abrirse con doble clic y
funcionar sin servidor.

## Stack y estructura

- HTML5, CSS3 y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
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
- `tipo` se guarda como `"Tela" | "FOAM" | "Estructuras"`. La interfaz muestra
  **«Espuma»** para FOAM (función `nombreTipo`), pero **el valor guardado no cambia**:
  no hay migraciones de datos.
- `fecha` es timestamp de época (`Date.now()`); la lista se ordena del más reciente
  al más antiguo (ver skill `local-dates` al tocar fechas).
- Claves de acceso (spec 006): `gestorAcceso` (localStorage, hashes SHA-256
  `{ usuario, administrador }`, opcional), `gestorSesion` (sessionStorage, rol) y
  `gestorSesionPersistente` (localStorage, rol). Claves por defecto **2468** (usuario) y
  **9753** (administrador): el administrador debe cambiarlas en «Herramientas».
- Nunca se cambia la clave ni el esquema sin actualizar `docs/constitution.md` y los tests.

## Funcionalidades implementadas

- **Alta, edición y borrado (spec 002)**: el mismo formulario sirve para editar; se
  conservan `id`, `fecha` y el filtro activo. El borrado pide confirmación dentro de la
  tarjeta («¿Seguro? · Sí, eliminar / No»), sin `confirm()` nativo. Avisos breves en un
  toast de 2,5 s.
- **Filtros (Todos / Tela / Espuma / Estructuras)**: pestañas con `data-filtro` = valor
  interno (`"FOAM"` para la pestaña Espuma). El desplegable del formulario funciona igual.
- **Buscador por texto (spec 005)**: campo «Buscar cliente» que filtra en vivo mientras
  se escribe, con todas las palabras («y») repartidas entre los campos, ignorando
  acentos y mayúsculas. Se combina con el filtro de tipo y sobreviene a cambios de
  filtro y ediciones. Estado vacío contextual: «No hay coincidencias para «X»…».
- **Mapa (spec 004)**: si `direccion` no está vacía, la tarjeta muestra un cuadro de
  Google Maps (iframe embed sin API key) y el enlace «Ver en Google Maps»; sin
  conexión solo queda el enlace (`target="_blank" rel="noopener"`). Los listeners
  `online`/`offline` refrescan la lista.
- **Diseño retro (spec 003)**: paleta de materiales (índigo Tela, mostaza Espuma,
  acero Estructuras), banda tricolor, espina de color por tarjeta, tinta `#1d241f`,
  sin sombras.
- **Acceso con clave y permisos (spec 006)**: al abrir hay una pantalla de clave con dos
  perfiles — **usuario** (añade, edita, busca y filtra) y **administrador** (además borra,
  exporta, importa y cambia las claves). Las claves se guardan **solo como hash
  SHA-256 en JS puro** (sin WebCrypto: funciona en cualquier navegador, nunca en claro);
  la sesión vive en `sessionStorage` (o `localStorage` si se
  marca «mantener sesión iniciada») y «Salir» la cierra. La exportación descarga
  `clientes-AAAA-MM-DD.json` y la importación reemplaza los datos tras confirmar. Es una
  protección **disuasoria** (la app funciona sin servidor, RF-409).
- **Formulario libre y campos nuevos (spec 007)**: nada es obligatorio; la ficha muestra
  «Sin nombre»/«Sin tipo» cuando faltan. Campos **Móvil** y **Código postal** en
  formulario, ficha, buscador e importar/exportar; el mapa usa dirección + código postal.

## Forma de trabajar (SDD)

- No escribas código a lo ciego: sigue Spec-Driven Development (skill `sdd`) —
  constitución → especificación (`spec.md`) → plan (`plan.md`) → tareas (`tasks.md`) →
  implementación. Las specs viven en `docs/specs/NNN-nombre/`.
- Para el flujo SDD completo, selecciona `coordinator` como **agente principal** (selector
  de agentes del TUI, p. ej. `/agent coordinator`) — él orquesta a los subagentes
  `@planner`, `@reviewer` e `@implementer`. Para cambios pequeños que no merecen spec,
  usa `/feature`.
- NOTA free tier: si un agente nuevo falla con «free tier can only be used from within
  OpenCode», es el límite de sesiones de la free tier (mensaje engañoso); se recupera
  solo al pasar la ventana y no es configuración del proyecto.

## Memoria

- Al empezar, lee `MEMORY.md`. Al terminar una tarea, actualízala (máximo 50 líneas).

## Comandos

- Tests de la lógica: `node --test` (descubre los archivos `test-*.js`). No es un
  indicador de salud si no hay tests.
- Sin `package.json`: no hay scripts de build, ni dependencias que instalar.

## Reglas

- Lee `docs/constitution.md` antes de tocar código (5 reglas innegociables).

## Límites

- ✅ Permitido: JS nativo, CSS puro, `localStorage`, iframe de Google Maps, tests con
  `node --test`, MCP de Chrome DevTools para verificar la interfaz.
- ⚠️ Cuidado: tocar `localStorage` (datos reales del usuario), el orden de los
  `<script>` en `index.html`, los valores internos guardados (`"FOAM"`), las specs ya
  cerradas en `docs/specs/` y las fechas (`fecha`).
- 🚫 Prohibido: frameworks, bundlers, npm, módulos ES, claves de API en texto plano,
  `confirm()`/`alert()` nativos, exigir un servidor para funcionar.

## Verificación

La lógica pura se verifica con `node --test`. La interfaz se verifica con el MCP de
Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola (debe
quedar limpia) y comprueba la vista móvil (375 px, sin desbordamiento). Al terminar,
borra los datos de prueba
(`localStorage.removeItem("gestorClientes")`) para que la app arranque vacía.
