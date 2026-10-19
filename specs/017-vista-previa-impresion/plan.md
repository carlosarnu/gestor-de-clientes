# Plan — Spec 017 · Vista previa de impresión dentro de la app y «Guardar como PDF»

**Estado:** **aprobado e implementado** (spec aprobada 2026-10-18; implementada 2026-10-19, 8/8 tareas, 123/123 tests)

| Campo | Valor |
|---|---|
| **Spec** | `specs/017-vista-previa-impresion/spec.md` (12 RF: RF-1501…1512, 11 decisiones; **Dudas abiertas: ninguna**) |
| **Fecha** | 2026-10-18 |
| **Dependencia** | Se implementa sobre el estado cerrado de las specs **011** (app de escritorio), **012** (listado), **013** (impresión), **014/015** (tipos múltiples y provincia) y **016** (desplegable). `node --test` hoy: **122/122**; git limpio (commit `e150771`). Deroga **solo** dos puntos de la 013 (ruta del botón RF-1102 y su *Fuera de alcance* «Generación de PDF»); el resto de la 013 (guardia, Ctrl+P, hoja limpia, `beforeprint`) queda **intacto**. |
| **Verificación** | `node --test` (**1 test nuevo**: nombre del PDF; 122 → 123) + Chrome DevTools (web) + checklist manual (diálogos nativos y PDF: web y `npm start`/exe, remite a los RF-1505/1506/1507 de la spec) |

---

## 1. Arquitectura de la vista previa

La vista previa es un **estado de la página**, no un documento nuevo ni un clon: el
mismo HTML en vivo de la lista, con el chrome oculto y **el único juego de reglas de
la hoja encendido en pantalla**. Tres piezas, ninguna duplicada:

1. **Clase de estado** `body.modo-vista-previa` (en memoria, sin persistencia).
2. **Hoja conmutable**: `hoja-impresion.css`, un `<link media="print">` nuevo cuyo
   atributo `media` se conmuta a `"all"` mientras dure la vista previa y vuelve a
   `"print"` al cerrar (**papel = estado por defecto**, sin depender de eventos:
   Ctrl+P funciona aunque la vista previa nunca se haya abierto, RF-1509).
3. **Barra** `#barra-vista-previa` en el propio panel (antes de la cabecera de
   contexto), oculta con el atributo `hidden` fuera de la vista previa y oculta en
   el papel por una regla mecánica de `@media print`.

Ciclo de vida (toda la lógica en `app.js`, presentación pura):

```
botón «Imprimir» de la lista
  └─ guardia visiblesActuales().length === 0 → toast «No hay clientes para imprimir» (RF-1502, intacta)
  └─ abrirVistaPrevia():
       scrollAntesVistaPrevia = window.scrollY
       refrescarCabeceraImpresion()               // textoContextoImpresion, fresco (RF-1503)
       body.classList.add("modo-vista-previa")
       estiloHoja.media = "all"                   // la hoja se enciende en pantalla (RF-1510)
       barra.hidden = false
       botonVpImprimir.focus()                    // foco al primer botón (RF-1504)

«Imprimir» (barra)      → window.print(); NO cierra la vista previa (RF-1505, Decisión 8)
«Guardar como PDF»      → web: window.print() (mismo diálogo, RF-1507)
                          escritorio: await window.gestorDatos.guardarPdf(nombreArchivoPdf(new Date())) (RF-1506)
«Cerrar» / Escape       → cerrarVistaPrevia():
       barra.hidden = true
       estiloHoja.media = "print"                 // el papel recupera su estado por defecto
       body.classList.remove("modo-vista-previa")
       window.scrollTo(0, scrollAntesVistaPrevia) // Decisión 11
       botonImprimir.focus()                      // foco de vuelta (RF-1504)

beforeprint (Ctrl+P y rutas de window.print) → refrescarCabeceraImpresion()  // RF-1509 intacto
```

Con `media="all"`, **las mismas reglas de la hoja** ocultan el chrome en pantalla
(`.cabecera`, `#panel-formulario`, `.filtros`, `.buscador`, `.conmutador`,
`.contador`, `#boton-imprimir`, `.copia-seguridad`, `.confirmacion-importacion`,
`.selector-campos`, `.tarjeta-acciones`, `.confirmacion`, `.acciones-celda`,
`.mapa-caja`, `.toast`), muestran la cabecera de contexto, dejan el listado como
tabla con `thead`, las tarjetas a una columna y el texto completo: **una sola
definición para pantalla-con-vista-previa y papel** (RF-1510). Como el chrome acaba
en `display: none`, queda **oculto e inoperativo** de forma natural (no focusable,
no clicable) y la instantánea no necesita reactividad (Decisión 8 de la spec).

## 2. Lógica pura (`logica.js`): una sola función nueva (RF-1512)

| Función | Detalle | RF |
|---|---|---|
| `nombreArchivoPdf(fecha)` | Devuelve `"listado-AAAA-MM-DD.pdf"` con la **fecha LOCAL** (`getFullYear`/`getMonth`/`getDate`, nunca `toISOString()`), rellenando mes y día con la **`dosDigitos`** ya existente. Espejo exacto de `nombreArchivoExportacion(fecha)` (spec 011), con otro prefijo y extensión. `module.exports`: se añade `nombreArchivoPdf` (nada más). | RF-1512 |

- **Entradas:** `fecha` (un `Date` inyectado por el llamante — `app.js` pasa
  `new Date()`; misma convención de pureza que `nombreArchivoExportacion`, sin
  reloj interno). **Sin `hoy`**: no hay lógica de días futuros (eso es de
  `fechaTextoLocal`, spec 012, que no interviene).
- **Consumidor único:** el botón «Guardar como PDF» en **escritorio** (el nombre se
  calcula en el renderer y se pasa como argumento al IPC; `escritorio/main.js` no
  duplica la fecha — allí `selloFechaLocal` es de la 011 y no se toca).

### Tests nuevos (`test-logica.js`, `node --test`, sin DOM — rojo→verde)

Un único test espejo de `test-logica.js:371-375` (mismos `Date`, otro literal):

```js
test("nombreArchivoPdf usa la fecha LOCAL con ceros (RF-1512)", () => {
  assert.equal(nombreArchivoPdf(new Date(2026, 0, 5)), "listado-2026-01-05.pdf");
  assert.equal(nombreArchivoPdf(new Date(2026, 11, 31)), "listado-2026-12-31.pdf");
  // Pasada la medianoche local el día es el LOCAL (con UTC se adelantaría)
  assert.equal(nombreArchivoPdf(new Date(2026, 0, 1, 0, 30)), "listado-2026-01-01.pdf");
});
```

Total: **122 → 123 tests**. Los 122 existentes siguen **intactos**.

## 3. Decisiones técnicas por archivo

| Archivo | Qué se toca | RF |
|---|---|---|
| `hoja-impresion.css` (**nuevo**) | **Único juego de reglas de la hoja**: se extraen aquí, **sin envoltorio `@media`** (la condición la da el atributo `media` del `<link>`), las reglas **visuales** del bloque `@media print` actual de `styles.css` (1075-1175): chrome oculto, `.cabecera-impresion` visible, marcas de edición restauradas, celdas/badge con texto completo, `.lista-clientes` a 1 columna | RF-1503, RF-1510 |
| `index.html` | (a) `<link rel="stylesheet" href="hoja-impresion.css" media="print" id="estilo-hoja">` **después** de `styles.css` (el orden importa: la hoja gana por orden a igual especificidad, p. ej. `.cabecera-impresion` sobre su `display:none` base y `.lista-clientes` sobre los `min-width`); (b) barra `#barra-vista-previa` con los 3 botones (`.boton-principal`/`.boton-secundario` de siempre), `hidden` por defecto, al principio del panel de lista; (c) **quitar `aria-hidden="true"`** de `#cabecera-impresion` (línea 166) y actualizar su comentario | RF-1501, RF-1503, RF-1504 |
| `styles.css` | (a) el bloque `@media print` **se queda SOLO con las reglas mecánicas** del papel: `thead` repetido, `break-inside: avoid` y **`#barra-vista-previa { display: none }`** (nueva); (b) el bloque apilado móvil pasa a `@media screen and (max-width: 768px) { body:not(.modo-vista-previa) … }` (prefijo en **todos** sus selectores); (c) estilos base de `.barra-vista-previa` (flex, hueco, `min-height: 44px` de sus botones vía clases ya existentes) + `.barra-vista-previa[hidden] { display: none }` (patrón 016); (d) comentario de `.cabecera-impresion` base actualizado | RF-1504, RF-1510 |
| `app.js` | Estado `vistaPreviaAbierta` + `scrollAntesVistaPrevia`; refs `estiloHoja`, `barraVistaPrevia` y los 3 botones; `refrescarCabeceraImpresion()` (extrae la expresión del listener `beforeprint`, que la reutiliza); `abrirVistaPrevia()`/`cerrarVistaPrevia()` (pseudocódigo §1); el botón «Imprimir» de la lista pasa de `window.print()` a `abrirVistaPrevia()` **tras la misma guardia**; listener único `keydown` (solo `Escape` y solo con la vista previa abierta; ninguna otra tecla ni atajo se intercepta); «Imprimir» barra → `window.print()`; «Guardar como PDF» → `EN_ESCRITORIO` ? IPC `guardarPdf` (`{cancelado}` → nada, `{error}` o excepción → toast «No se pudo generar el PDF», vista previa **abierta**) : `window.print()`; «Cerrar» → `cerrarVistaPrevia()` | RF-1501, RF-1502, RF-1504, RF-1505, RF-1506, RF-1507 |
| `logica.js` | `nombreArchivoPdf` + `module.exports` (§2). **Nada más se toca** | RF-1512 |
| `test-logica.js` | Test de `nombreArchivoPdf` (§2) + su import | RF-1512 |
| `escritorio/main.js` | **IPC asíncrono** `ipcMain.handle("gestor-datos:guardar-pdf", async (event, nombreArchivo) => …)` (los síncronos de la 011 no sirven: `printToPDF` y `showSaveDialog` son promesas): `fs.mkdirSync` de la carpeta de datos (si falla, se usa `app.getPath("documents")`); `dialog.showSaveDialog(ventana, { defaultPath: path.join(carpeta, path.basename(nombreArchivo)), filters: [{ name: "PDF", extensions: ["pdf"] }] })` → cancelado ⇒ `{ cancelado: true }`; `ventana.webContents.printToPDF({ pageSize: "A4", printBackground: true })` (A4 como el papel del navegador; **con fondos**: decisión T-05, la generación silenciosa no tiene casilla de «gráficos de fondo»); `fs.writeFileSync`; devuelve `{ guardado: true, ruta }` o `{ error }`. **`clientes.json` no se toca** | RF-1506 |
| `escritorio/preload.js` | `guardarPdf(nombreArchivo) { return ipcRenderer.invoke("gestor-datos:guardar-pdf", nombreArchivo); }` (async; el resto del puente intacto) | RF-1506 |
| `AGENTS.md`, `MEMORY.md` | Cierre: nueva funcionalidad, `hoja-impresion.css` en la estructura, dos puntos derogados de la 013, nota de instalador | RF-1512 |

`escritorio/package.json` **intacto** (cero dependencias nuevas);
`docs/constitution.md` **intacto**; specs 011-016 **intactas** (solo se documentan
los dos puntos derogados de la 013 en la 017).

### 3.1 La decisión clave (Decisión 2 de la spec): medio conmutable por el atributo `media`

**Elegida: opción (a)** — un `<link media="print">` dedicado cuyo atributo `media`
se conmuta a `"all"` mientras dura la vista previa. Es la única vía que cumple a la
vez: (1) **cada regla visual escrita una sola vez** (inspección trivial:
`hoja-impresion.css` las contiene una vez; `styles.css` no contiene ninguna), (2)
**papel por defecto sin depender de eventos** (`media="print"` es el estado
nacimiento; Ctrl+P y el papel funcionan aunque la vista previa nunca se abra,
RF-1509) y (3) **el papel y la vista previa comparten literalmente las reglas**
(cuando `media="all"`, el mismo stylesheet también hace *match* en impresión:
imprimir o generar el PDF **desde** la vista previa produce exactamente la hoja
visible, incluida la exclución de la barra por la regla mecánica).

*Alternativas descartadas:* **(b) envolver las reglas bajo `body.modo-vista-previa`
+ `@media print` con el mismo selector base** — exigiría escribir cada regla **dos
veces** (una por medio), que es exactamente la duplicación que RF-1510 prohíbe;
**clase añadida en `beforeprint` para el papel** — convertiría al papel en estado
dependiente de un evento, contra la Decisión 2 y el RF-1509; **(c) variables CSS** —
las variables conmutan valores, no selectores ni *media queries*: no pueden
expresar «esto solo en papel / solo en vista previa» sin duplicar las reglas que
las consumen; **duplicar el bloque para pantalla** — prohibido expresamente por la
spec; **`window.open`/iframe de impresión** — ya descartados en la 013/017.

### 3.2 `styles.css`: el bloque apilado móvil y la coherencia a 375 px

El bloque `@media screen and (max-width: 768px)` (líneas 913-987) convierte el
`.listado` apilado en bloques con `td::before`; **en papel nunca aplicó** (el medio
`print` no hace *match* con `screen`), pero **sí aplicaría en la vista previa a
375 px**, desviando la hoja de su definición (la 013 garantiza tabla siempre).
Por eso sus selectores reciben el prefijo `body:not(.modo-vista-previa)`: en la
vista previa el `.listado` vuelve a su estilo base de tabla (definido fuera del
bloque apilado), **igual que en papel**, sin añadir ni una regla a la hoja.
Los bloques `min-width: 700px/1000px` de `.lista-clientes` **no se tocan**: la
regla `1fr` de la hoja gana por orden de cascada (`hoja-impresion.css` va después).

### 3.3 `aria-hidden` de `#cabecera-impresion` (contradicción del RF-1503)

**Se quita el atributo.** En pantalla el elemento es `display: none` (regla base de
siempre), y `display: none` ya lo excluye del árbol de accesibilidad: sin
`aria-hidden` la pantalla normal **no lee nada de más**, y en la vista previa (donde
la hoja lo muestra) queda **legible** para lectores de pantalla. *Descartado:*
condicionar `aria-hidden` con JS al abrir/cerrar (más estado que puede
desincronizarse, para conseguir lo que `display: none` regala gratis).

### 3.4 Escritorio: IPC asíncrono y recorrido del PDF

Los IPC de la 011 son síncronos (`sendSync`) porque leer/escribir el JSON es
síncrono; `printToPDF` y `showSaveDialog` **son promesas**, así que el camino nuevo
es `ipcRenderer.invoke` / `ipcMain.handle` con un contrato de resultado explícito:
`{ guardado, ruta }` | `{ cancelado: true }` | `{ error }`. **Primero el diálogo,
después generar** (cancelar no gasta la generación; la convención es no avisar al
cancelar). `defaultPath` apunta a la **carpeta de los datos**
(`Documentos\Gestor de Clientes\`, creada si no existe — cobertura también del
flujo web→app donde aún no hay `clientes.json`). El nombre del PDF lo calcula
**`nombreArchivoPdf` en el renderer** (lógica pura testada, RF-1512) y `main.js`
solo hace `path.basename` (defensa: el proceso principal no confía el path del
renderer). El PDF captura el estado de la hoja **con la vista previa abierta**
(`media="all"`), así que sale idéntico a lo mostrado; la barra la oculta la regla
mecánica de `@media print`.

## 4. Decisiones del plan (con alternativa descartada)

1. **Medio conmutable por el atributo `media` del `<link>` (§3.1).** *Descartadas:*
   la (b) con reglas duplicadas por medio, la clase `beforeprint` para el papel y
   las variables CSS — ninguna permite una sola copia de cada regla visual con el
   papel como estado por defecto.
2. **La hoja vive en un fichero nuevo `hoja-impresion.css` (no en `styles.css` ni
   en línea).** No se puede conmutar el `media` de *mitad* de un fichero; y meter
   ~70 líneas de CSS en un `<style>` de `index.html` rompe la estructura del
   proyecto (HTML = estructura, CSS = ficheros `.css`). *Descartado:* `<style
   id="estilo-hoja" media="print">` inline (cero ficheros nuevos, pero mezcla
   estilos en el HTML).
3. **La guardia de cero visibles queda donde está y el botón cambia de destino**
   (de `window.print()` a `abrirVistaPrevia()`), consumando la derogación del
   RF-1102 solo en la ruta. *Descartado:* mover la guardia (riesgo de que diverja
   de `visiblesActuales()`; la 013 ya la compartió a propósito).
4. **La barra va en el flujo del panel (no `position: fixed`) y se oculta con
   `hidden`.** Sencillez y coherencia con el resto (la 016 ocultó el campo
   condicional igual); en el papel la oculta la regla mecánica. *Descartado:*
   barra fija (añade reglas de posicionamiento y z-index sin necesidad; con la
   hoja a scroll de página el usuario sube y la encuentra).
5. **`window.print()` con la vista previa abierta imprime la hoja correcta sin
   tocar nada**: `media="all"` hace *match* también en impresión. *Descartado:*
   volver a `media="print"` antes de imprimir (estado intermedio innecesario que
   podría capturar mal el PDF y rompería «Imprimir sin cerrar»).
6. **El texto de la cabecera se rellena al abrir con la misma helper que
   `beforeprint`** (`refrescarCabeceraImpresion()`). *Descartado:* confiar solo en
   `beforeprint` (Electron **no** garantiza ese evento con `printToPDF`: el PDF de
   escritorio debe salir correcto aunque no se dispare) y recalcular en dos sitios
   distintos (divergencia).
 7. **`printToPDF({ pageSize: "A4", printBackground: true })` sin forzar márgenes.**
    A4 como el papel por defecto en España; **fondos: sí** (*enmienda de la decisión
    T-05, documentada en acta*): la generación silenciosa no tiene la casilla
    «gráficos de fondo» del diálogo y la revisión visual del PDF confirma que los
    cantos de color por tipo sí se necesitan; márgenes = los del
    usuario/sistema (fuera de alcance: «Configuración de página»). *Descartado:*
    márgenes propios.
8. **Un único listener `keydown` permanente que solo reacciona a `Escape` con la
   vista previa abierta.** El cuadro nativo consume su propio Escape (nunca llega
   a la página); no se intercepta ninguna otra tecla ni Ctrl+P (Decisión 4 de la
   spec). *Descartado:* añadir/quitar el listener en cada apertura (más estados
   posiblemente mal equilibrados) y cualquier manejo de Ctrl+P.
9. **Los estilos de la barra son de pantalla, en `styles.css`** (no son reglas de
   hoja: no viajan al papel ni al PDF). *Descartado:* ponerlos en
   `hoja-impresion.css` (contaminaría la definición de la hoja con chrome).

## 5. Estructura de tareas (orden estricto)

| # | Tarea | Por qué en este sitio |
|---|---|---|
| T-01 | Spec aprobada | Ya hecha (2026-10-18) |
| T-02 | `nombreArchivoPdf` + tests (rojo→verde, 123/123) | Lógica independiente: se valida sola antes de tocar nada |
| T-03 | Hoja única conmutable: `hoja-impresion.css` + `<link media="print">` + refactor de `styles.css` (mecánicas, apilado condicionado, barra base) + quitar `aria-hidden` | Es la base sobre la que se apoya todo lo demás; dejando el `<link>` ya presente, el estado intermedio conserva la impresión de la 013 (`media="print"` = como hoy) |
| T-04 | Barra en `index.html` + vista previa en `app.js` (abrir/cerrar/Escape/foco/scroll + los 3 botones con destino **web**) | La app queda usable de punta a punta en web antes de tocar Electron |
| T-05 | Escritorio: IPC `guardar-pdf` (`main.js` + `preload.js`) + ruta `EN_ESCRITORIO` en `app.js` | Única parte que toca `escritorio/`; se apoya en T-02 (el nombre) y T-04 (la barra) |
| T-06 | Verificación completa en navegador (MCP, web) + `node --test` + inspección CSS RF-1510 | Evidencia automatizable antes de la manual |
| T-07 | Checklist manual web y `npm start`/exe (diálogos, PDF, hash de `clientes.json`, cuadro de Windows) → acta | Lo que el MCP no puede verificar (RF-1505/1506/1507) |
| T-08 | Documentación y cierre (AGENTS, MEMORY, regenerar instalador + humo, estados, commit) | Como en 015/016 |

Detalle de cada tarea (RF y «Hecho cuando»): `tasks.md`.

## 6. Estrategia de verificación

### 6.1 `node --test` y sintaxis

- `node --check logica.js app.js` y `node --check escritorio/main.js escritorio/preload.js`.
- **123/123** (los 122 intactos + el de `nombreArchivoPdf`); **cero** tests nuevos
  más allá de ese (Decisión 9 de la spec: el resto es presentación).

### 6.2 Chrome DevTools (web, `index.html`) — lo que SÍ verifica el MCP (acta en T-06)

- **Semilla** de clientes de prueba (multi-tipo, provincia, mapa, «Sin nombre»).
- **Apertura** (RF-1501/1503): tras «Imprimir» — `body.modo-vista-previa` presente;
  `#estilo-hoja.media === "all"`; **estilos calculados**: chrome en `display: none`
  (formulario, cabecera decorativa, pestañas, buscador, filtro de provincia,
  conmutador, contador, `#boton-imprimir`, Exportar/Importar, `<h2>Clientes`,
  selector de campos, acciones/«¿Seguro?», mapa y toast), `.cabecera-impresion`
  visible con el **literal** de `textoContextoImpresion(filtro, búsqueda,
  provincia)`; `.lista-clientes` a **1 columna**; en vista «Listado» el `<table>`
  con `thead` visible y columna «Acciones» ausente; barra con los 3 botones;
  `document.activeElement.id === "boton-vp-imprimir"`.
- **Guardia** (RF-1502): vacío / filtro sin resultados / provincia sin resultados /
  búsqueda sin coincidencias → toast y vista previa **sin abrir**.
- **Cierre** (RF-1504): «Cerrar» y `Escape` → `media` de vuelta a `"print"`, sin
  clase en `body`, chrome visible, **scroll restaurado** (sembrar lista larga),
  foco en `#boton-imprimir`; con «¿Seguro?» y edición en curso abiertas, al cerrar
  siguen tal cual.
- **Ctrl+P sin vista previa** (RF-1509): despachar `beforeprint` → cabecera fresca
  con las 3 piezas; listener intacto.
- **Inspección CSS RF-1510**: leer `hoja-impresion.css` — cada regla visual de la
  hoja **una sola vez**; `styles.css` **sin** ningún selector de la hoja (solo las
  mecánicas de `@media print`); bloque apilado con `body:not(.modo-vista-previa)`.
- **375 px**: vista previa sin desbordes horizontales; `.listado` como **tabla**
  (no apilado); botones con objetivo ≥ 44 px (medidos); teclado Tab/Intro/Espacio.
- **Integridad** (RF-1511): `Object.keys(localStorage)` ⇒ solo `gestorClientes`;
  el JSON de `gestorClientes` byte-idéntico antes/después de abrir e imprimir.
- **Regresiones** (RF-1508): filtros por pertenencia, búsqueda, provincia,
  conmutador, selector de campos, alta/edición/borrado, exportar/importar,
  impresión de la 013. **Consola limpia**; datos de prueba borrados al final.

### 6.3 Checklist manual — lo que el MCP NO puede verificar (acta en T-07; remite a la spec)

- **RF-1505** (web y `npm start`/exe): «Imprimir» en la vista previa abre el
  cuadro nativo; **cancelarlo con Escape deja la vista previa abierta** y la
  consola limpia; en la .exe el cuadro de Windows **seguirá** mostrando su mensaje
  (aceptado, Decisión 10).
- **RF-1507** (web): «Guardar como PDF» abre el diálogo del navegador con destino
  «Guardar como PDF» y **nombre propuesto por el navegador** (no `listado-…`);
  cancelar deja la vista previa abierta.
- **RF-1506** (`npm start`/exe): PDF guardado como `listado-AAAA-MM-DD.pdf`
  (fecha **local**), **abierto y revisado** (solo hoja: cabecera de contexto +
  listado; sin barra ni chrome); cancelar el diálogo ⇒ **cero ficheros** y sin
  aviso; **hash de `clientes.json` antes/después idéntico**; fallo simulado ⇒
  toast «No se pudo generar el PDF» y vista previa abierta; Ctrl+P con la vista
  previa abierta imprime sin romperse (caso límite de la spec).

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Un navegador no reaplicara el `media` cambiado dinámicamente | El CSSOM lo soporta desde siempre; T-06 verifica estilos **calculados** tras abrir y tras cerrar en Chrome (web) y en Chromium de Electron (T-07) |
| El PDF saliera con la barra o sin la hoja encendida | El PDF solo se genera con la vista previa abierta (`media="all"`) y la barra la oculta la regla mecánica `@media print`; el PDF se **abre y revisa** en T-07 |
| `printToPDF` no dispara `beforeprint` en Electron | La cabecera se rellena **al abrir** la vista previa (RF-1503) con la misma helper; no depende del evento |
| Escape del cuadro nativo llegara a la página y cerrara la vista previa | El cuadro consume su tecla; si la checklist lo detectara, se acota el listener al foco de la página (nota ya prevista en el caso límite de la spec) |
| El bloque apilado pisara la tabla en la vista previa a ≤ 768 px | Prefijo `body:not(.modo-vista-previa)` (§3.2) + prueba explícita a 375 px en T-06 |
| `focus()` sobre un botón aún `hidden` no enfocara | Orden fijado en el pseudocódigo §1: `barra.hidden = false` **antes** de `focus()` |
| El instalador del USB quedara desactualizado (017 toca `main.js`/`preload.js`) | T-08: `npm run build` + humo del `win-unpacked` + nota en `MEMORY.md` para recopiar al USB (patrón 015/016) |
