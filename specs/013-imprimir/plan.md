# Plan — Spec 013 · Impresión del listado de clientes

**Estado:** aprobado por el usuario (2026-10-16, autorización de fase) e implementado

---

## 1. `logica.js` — lógica pura nueva (RF-1104)

| Función | Detalle | RF |
|---|---|---|
| `textoContextoImpresion(filtro, busqueda)` | Devuelve la cabecera de contexto como **cadena** (texto plano, sin HTML): piezas en orden «Gestor de Clientes» → «Filtro: X» (solo si `filtro` no es «Todos» y no viene vacío) → «Búsqueda: «texto»» (solo si la búsqueda **recortada** no está vacía), unidas por « · »; si no hay piezas de contexto, solo el título. | RF-1104 |

- **Entradas:** `filtro` y `busqueda` (texto entrante del estado actual). **Sin `hoy`**: a
  diferencia de `fechaTextoLocal(fecha, hoy)` (spec 012), la cabecera no lleva fecha, así
  que no hay reloj que inyectar.
- La etiqueta del filtro es **el valor de la pestaña tal cual** (`data-filtro`: «Tela»,
  «Espuma», «Estructuras»; «Otros» se muestra literalmente como «Otros»; «Todos» nunca se
  muestra). **`nombreTipo` NO interviene** (eso son tipos de cliente, no pestañas).
- La búsqueda entra con sus espacios sobrantes y la función la **recorta** (trim) dentro
  de los guillemets; conserva acentos, mayúsculas y comillas tal cual.
- **`module.exports`:** se añade `textoContextoImpresion` (nada más cambia).

## 2. `test-logica.js` — tests nuevos en rojo→verde (RF-1104)

`node --test`, **sin DOM** (hoy 64 tests en verde). Anclados al **formato literal** de la
Decisión 6 de la spec:

- «Todos» + «» → `Gestor de Clientes`
- «Tela» + «» → `Gestor de Clientes · Filtro: Tela`
- «Todos» + «vega» → `Gestor de Clientes · Búsqueda: «vega»`
- «Tela» + «vega» → `Gestor de Clientes · Filtro: Tela · Búsqueda: «vega»` (cadena de
  ejemplo completa del criterio de aceptación)
- «Otros» + «» → `Gestor de Clientes · Filtro: Otros` (etiqueta de la pestaña)
- Búsqueda con espacios sobrantes (`"  vega "`) → recortada (trim)
- Filtro vacío o ausente → como «Todos» (solo título); búsqueda solo espacios → omitida
- Búsqueda con acentos, comillas y mayúsculas → texto plano intacto (sin marcado HTML)

## 3. `index.html` (RF-1101, RF-1103)

- **Botón «Imprimir»**: `<button type="button" class="boton-secundario" id="boton-imprimir">Imprimir</button>`
  dentro de `.lista-cabecera`, **tras el conmutador y antes del contador** (visible en las
  dos vistas; misma familia de estilo que Exportar/Importar).
- **Cabecera de contexto**: `<p class="cabecera-impresion" id="cabecera-impresion" aria-hidden="true"></p>`
  como primer elemento del panel de lista (antes de `.lista-cabecera`). En pantalla es
  `display: none` (es decoración de papel); `aria-hidden="true"` porque en pantalla el
  estado real ya lo dan el contador y los estados vacíos. El texto lo rellena `app.js`.

## 4. `styles.css` (RF-1103)

Bloque nuevo **`@media print` al final del fichero** (después de los `min-width` y del
bloque apilado, para ganar por orden a igual especificidad):

| Cambio | Detalle |
|---|---|
| Chrome oculto | `display: none` en: `.cabecera` (cabecera decorativa con cinta), `#panel-formulario`, `.lista-cabecera h2` (título «Clientes»), `.contador`, `.conmutador`, `.buscador`, `.filtros`, `.copia-seguridad`, `.confirmacion-importacion`, `.selector-campos` (chips **y** su título «Campos del listado»), `.tarjeta-acciones`, `.confirmacion` («¿Seguro?» de tarjeta y de fila), `.acciones-celda` (**toda la columna «Acciones»: el `th` y el `td` comparten la clase**), `.mapa-caja` (iframe + enlace) y `.toast` |
| Contexto visible | `.cabecera-impresion { display: block }` con tipografía de título (mismo género que `.lista-cabecera h2`) |
| Listado **siempre tabla** | El bloque apilado de la 012 pasa a `@media screen and (max-width: 768px)` (Decisión 2): en papel la tabla nunca se apila ni muestra `td::before` |
| Tarjetas a **una columna** | `.lista-clientes { grid-template-columns: 1fr }` (en A4 ≈ 794 px CSS se activan hoy las reglas `min-width: 700px`/`1000px` de 2 y 3 columnas: hay que anularlas) |
| Texto completo | `.listado td, .listado th { white-space: normal; overflow: visible; text-overflow: clip }` (sin «…» en papel, Decisión 8 de la spec) |
| Paginación | `.tarjeta { break-inside: avoid; page-break-inside: avoid }` y `.listado tr { break-inside: avoid }`; la cabecera de la tabla se repite por ser `thead` (`display: table-header-group`, se deja explícito por claridad) |

- La hoja impresa pierde también el fondo/estética de pantalla solo donde estorbe; **no**
  se fuerza `color-adjust` (los bordes y cantos de color ya imprimen en la mayoría de
  navegadores y, si el navegador omite fondos, el documento sigue legible: texto y bordes).

## 5. `app.js` (RF-1101, RF-1102, RF-1103)

| Cambio | Detalle |
|---|---|
| Elementos nuevos | `const botonImprimir = document.getElementById("boton-imprimir")` y `const cabeceraImpresion = document.getElementById("cabecera-impresion")` (junto a los demás, arriba) |
| `visiblesActuales()` | Extrae el cálculo **ya existente** de `pintarLista()` → `buscarClientes(filtrarClientes(ordenarClientes(clientes), filtroActivo), textoBusqueda)`; `pintarLista` la reutiliza sin cambio de comportamiento y el botón la usa para su guardia. *Alternativa descartada:* recalcular la expresión en el listener del botón (dos sitios que divergirían). |
| Listener del botón | Si `visiblesActuales().length === 0` → `pintarAviso("No hay clientes para imprimir")` (**literal en `app.js`**, Decisión 3); si hay visibles → `window.print()`. No toca vista, filtro, búsqueda ni datos. |
| `beforeprint` | `window.addEventListener("beforeprint", …)` → `cabeceraImpresion.textContent = textoContextoImpresion(filtroActivo, textoBusqueda)`. Cubre el botón **y** Ctrl+P/menú (Decisión 4 de la spec; el navegador dispara `beforeprint` en ambas rutas). |
| Sin cambios | `guardarClientes`, claves, `pintarAviso` (se reutiliza), estados vacíos, tarjetas y tabla de la 012. **Cero escrituras nuevas** (ni `localStorage` ni `clientes.json`). |

- **Seguridad**: la cabecera se pinta con **`textContent`** (seguro por construcción, sin
  `innerHTML`); si alguna pieza acabara dentro de un atributo HTML se usaría
  `escaparAtributo` (defensa heredada de la 012).

## 6. Decisiones (con alternativa descartada)

1. **El guardia «No hay clientes para imprimir» es solo del botón; Ctrl+P no se
   intercepta.** *Descartada:* iframe de impresión oculto con `contentWindow.print()`
   para instrumentar Ctrl+P (frágil, no cubre el menú del navegador y arrastra efectos
   secundarios con foco e historial).
2. **El bloque apilado móvil de la 012 se restringe a `@media screen and (max-width: 768px)`**
   para que en papel la tabla nunca se apile. *Descartada:* duplicar dentro de
   `@media print` todas las reglas de tabla (`display: table/table-row/table-cell`,
   quitar `td::before`, restaurar bordes y thead…): dos juegos de reglas que divergirían
   con cada cambio de la 012.
3. **El toast «No hay clientes para imprimir» es un literal en `app.js`; NO pasa por
   `mensajeAviso`.** `mensajeAviso` responde a operaciones de datos
   (guardado/actualizado/eliminado); meter ahí un caso de interfaz la acoplaría
   innecesariamente y obligaría a ampliar sus tests sin reutilización real (el texto es
   único y fijo). *Descartada:* añadir la rama «imprimir» a `mensajeAviso`.
4. **El texto de contexto se rellena en `beforeprint`** (lo dispara el navegador con el
   botón y con Ctrl+P). *Descartadas:* rellenarlo solo en el clic del botón (Ctrl+P
   dejaría la cabecera desfasada o vacía) y repintarlo en cada cambio de filtro/búsqueda
   (trabajo inútil en pantalla, donde nunca se ve).
5. **La cabecera de contexto es un elemento del DOM oculto en pantalla**
   (`display: none` + `aria-hidden="true"`), no algo creado al imprimir. *Descartada:*
   generarla dinámicamente en el handler de impresión (más estados que desincronizarse;
   además el mismo HTML impreso que se ve es el modelo de la 012).
6. **`visiblesActuales()` compartida** entre `pintarLista` y el guardia del botón.
   *Descartada:* duplicar el filtro+búsqueda en el listener (podría divergir y dejar
   pasar una impresión vacía o bloquear una válida).
7. **Sin `hoy` en `textoContextoImpresion`**: la cabecera no lleva fecha ni contador.
   *Descartada:* incluir la fecha de impresión (fuera de alcance de la spec; ya la
   ofrecen los encabezados/pies del navegador).

## 7. Cobertura de RF

| Parte | RF |
|---|---|
| §1 + §2 (lógica pura y tests) | RF-1104 |
| §3 (botón + elemento de cabecera) | RF-1101, RF-1103 |
| §4 (CSS print: chrome oculto, listado siempre tabla, tarjetas 1 columna, paginación) | RF-1103 |
| §5 (botón + guardia + `beforeprint` + sin escrituras) | RF-1101, RF-1102, RF-1103 |
| §8 verificación | todos |

## 8. Verificación

- `node --check logica.js app.js` + **`node --test` en verde** (64 actuales + los nuevos
  de §2), **sin DOM**.
- **Chrome DevTools** (abriendo `index.html`):
  - **Nota sobre el medio `print`: el MCP NO permite emularlo** (verificado en el
    catálogo: `emulate` solo ofrece viewport, colorScheme, forcedColors,
    prefersContrast/prefersReducedMotion, red, CPU, geolocation, user agent y
    extraHttpHeaders — **sin** parámetro de medio de impresión). Por tanto, la evidencia
    en el MCP es:
    - **`beforeprint` + `matchMedia`**: despachar `window.dispatchEvent(new
      Event("beforeprint"))` y comprobar que `#cabecera-impresion` queda con el texto
      **literal** esperado para el filtro/búsqueda de turno (p. ej. con filtro «Tela» y
      búsqueda «vega», `Gestor de Clientes · Filtro: Tela · Búsqueda: «vega»`); que
      `window.matchMedia("print").matches === false` en pantalla (la cabecera no consume
      sitio) y que el listener está registrado.
    - **Reglas CSS**: inspeccionar (lectura del fichero y, si hace falta,
      `get_css_styles`) que el bloque `@media print` contiene **cada** regla de la §4
      (ocultos: formulario, cabecera, «Clientes», contador, conmutador, buscador,
      filtros, copia-seguridad, confirmación de importación, selector-campos, acciones
      de tarjeta, `.acciones-celda`, mapa y toast; `.cabecera-impresion` en `block`;
      `grid-template-columns: 1fr`; `break-inside: avoid`; celdas sin `nowrap`), y que
      el bloque apilado quedó restringido a `screen`.
    - **Comprobación en la vista previa real (Ctrl+P)**, que el MCP no captura: checklist
      de la spec — cabecera literal fresca, sin chrome, listado como **tabla con `thead`
      aunque el viewport sea 375 px**, tarjetas en una columna y sin cortes, columna
      «Acciones» ausente, mapa ausente, texto de celdas completo, `«Sin
      nombre»`/`«Sin tipo»`/«—» conservados.
  - **Botón**: con visibles → se abre el diálogo nativo (al cancelar, la app queda
    intacta); con cero visibles (vacío, filtro sin resultados, búsqueda sin
    coincidencias) → toast «No hay clientes para imprimir» **sin** diálogo.
  - **Ctrl+P**: cambiar filtro/búsqueda **sin tocar el botón** → cabecera fresca; con
    cero visibles → estado vacío impreso **sin** toast.
  - Teclado (Tabulador/Intro/Espacio) y objetivo ≥ 44 px en el botón; móvil 375 px sin
    desbordes.
  - **RF-1103 (sin escrituras)**: tras usar «Imprimir», `Object.keys(localStorage)` ⇒
    solo `gestorClientes`; en escritorio, `clientes.json` intacto.
  - Regresiones 012: conmutador, chips, acciones de fila y estados vacíos intactos.
  - **Consola limpia**.
- Datos de prueba borrados (`localStorage.removeItem("gestorClientes")`); commits por
  fases.

## 9. Documentación y cierre

- `AGENTS.md`: funcionalidad 013 en «Funcionalidades implementadas».
- `MEMORY.md`: línea de la 013 con el número de tests y decisiones; marcar spec, plan y
  tasks como implementados **al cierre** (el estado «implementado» lo pondrá el cierre,
  no este plan).
