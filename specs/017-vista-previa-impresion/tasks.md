# Tareas — Spec 017 · Vista previa de impresión dentro de la app y «Guardar como PDF»

> **Dependencia:** empezar solo **después de cerrar la 016-tipo-desplegable**
> (estado actual: `node --test` 122/122, git limpio, commit `e150771`). Comparte
> `index.html`, `styles.css`, `app.js`, `logica.js`, `test-logica.js` y — por
> primera vez desde la 011 — `escritorio/main.js` y `escritorio/preload.js`.
> Orden de dependencia estricto: T-01 → T-02 → … → T-08.
> **Fase especial:** sin consultar al usuario (spec aprobada 2026-10-18;
> «Dudas abiertas: ninguna»).

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md` en `specs/017-vista-previa-impresion/` con los 12 RF
    (RF-1501…1512) y las 11 decisiones, incorporando las respuestas del usuario
    (2026-10-18): cuadro nativo de Windows aceptado en la .exe, PDF
    `listado-AAAA-MM-DD.pdf` (fecha local) solo en escritorio, Ctrl+P intacto y
    «Guardar como PDF» también en la web.
  - **RF:** RF-1501 a RF-1512.
  - **Hecho cuando:** la spec está aprobada. *(Hecho: 2026-10-18 — aprobada por el
    usuario; sin dudas abiertas.)*

- [x] **T-02 — `logica.js` + `test-logica.js`: `nombreArchivoPdf(fecha)` (rojo→verde)**
  - **Descripción:** añadir `nombreArchivoPdf(fecha)` en la sección de
    exportación/importación (junto a `nombreArchivoExportacion`), espejo exacto
    de esta con prefijo `listado` y extensión `.pdf`, usando `dosDigitos` y la
    fecha **LOCAL** (`getFullYear`/`getMonth`/`getDate`, nunca `toISOString`);
    exportarla en `module.exports`. Test nuevo en `test-logica.js` (plan §2) con
    los tres casos: `new Date(2026, 0, 5)` → `listado-2026-01-05.pdf`,
    `new Date(2026, 11, 31)` → `listado-2026-12-31.pdf` y medianoche
    `new Date(2026, 0, 1, 0, 30)` → `listado-2026-01-01.pdf`.
  - **RF:** RF-1512.
  - **Hecho cuando:** `node --check logica.js` OK; `node --test` en rojo→verde con
    el test nuevo y **123/123** totales; los 122 tests existentes intactos (ni una
    sola línea de los ya escritos modificada).

- [x] **T-03 — Hoja única conmutable: `hoja-impresion.css` + `<link media="print">` + refactor de `styles.css`**
  - **Descripción:** (a) crear **`hoja-impresion.css`** con las reglas **visuales**
    del bloque `@media print` actual de `styles.css` (1075-1175), **sin** envoltorio
    `@media` y **una sola copia** de cada regla: chrome oculto, `.cabecera-impresion`
    visible, marcas de edición restauradas, celdas/badge con texto completo y
    `.lista-clientes` a 1 columna; (b) en `index.html`, añadir
    `<link rel="stylesheet" href="hoja-impresion.css" media="print" id="estilo-hoja">`
    **después** de `styles.css`, y **quitar `aria-hidden="true"`** de
    `#cabecera-impresion` (act. línea 166) actualizando su comentario; (c) en
    `styles.css`, dejar en `@media print` **solo** las mecánicas del papel
    (`thead` repetido, `break-inside: avoid` y la nueva
    `#barra-vista-previa { display: none }`), condicionar el bloque apilado móvil
    (913-987) con el prefijo `body:not(.modo-vista-previa)` en **todos** sus
    selectores, y añadir los estilos base de `.barra-vista-previa` (flex, hueco)
    con `.barra-vista-previa[hidden] { display: none }`. La barra en sí se añade
    en T-04; esta tarea solo deja su estilo base y su regla mecánica.
  - **RF:** RF-1503, RF-1510.
  - **Hecho cuando:** con la vista previa aún inexistente la app se ve **idéntica**
    a hoy (humo en navegador + Ctrl+P con la cabecera de la 013 intacta); inspección
    del CSS: cada regla visual de la hoja está escrita **una sola vez**
    (`hoja-impresion.css`) y `styles.css` no contiene **ningún** selector de la
    hoja salvo las mecánicas de `@media print`; el bloque apilado ya no aplica con
    `body.modo-vista-previa` (verificable poniendo la clase a mano en DevTools:
    el `.listado` vuelve a tabla); `#cabecera-impresion` ya sin `aria-hidden`.
    *(Hecho: 2026-10-18 — **8 reglas visuales movidas** (chrome display:none,
    `.cabecera-impresion`, 3 de marcas de edición, celdas, `.etiqueta`,
    `.lista-clientes` 1fr) sin envoltorio `@media`; `@media print` de `styles.css`
    reducido a **3 mecánicas** (`thead`, `break-inside` y `#barra-vista-previa`
    nueva) + estilos base de la barra + prefijo `body:not(.modo-vista-previa)` en
    los 15 selectores apilados; `<link id="estilo-hoja" media="print">` después de
    `styles.css`; `aria-hidden` quitado (decisión 3.3: `display:none` ya la saca
    de lectores en pantalla y en la vista previa queda legible). **Cero
    duplicados** — `file://` da `SecurityError` al leer `cssRules` (documentado),
    así que la inspección fue por **texto**: parser Node de ambos `.css` → 8
    reglas en la hoja, **0 exactas** compartidas con `styles.css` (los selectores
    comunes tienen declaraciones distintas: base pantalla vs hoja) + en página:
    `document.styleSheets` con la hoja en `media=print`, y toggling temporal
    `media="all"` → chrome `display:none`, cabecera visible, 1 columna, tabla con
    `thead`, columna Acciones y mapa ocultos, badge completo; al restaurar,
    aspecto de pantalla idéntico (capturas: pestañas/tarjetas/listado iguales);
    a 375 px sin clase el apilado sigue funcionando y **con la clase a mano** el
    `.listado` pasa `block`→`table` (thead `absolute`→`static`), sin desbordes;
    consola sin errores/warnings; `node --test` **123/123**; datos de prueba
    borrados.)*

- [x] **T-04 — `index.html` + `app.js`: barra y vista previa completos (ruta web)**
  - **Descripción:** añadir en el panel de lista, antes de `#cabecera-impresion`,
    `<div class="barra-vista-previa" id="barra-vista-previa" hidden>` con los tres
    botones: `#boton-vp-imprimir` («Imprimir», `.boton-principal`),
    `#boton-vp-pdf` («Guardar como PDF») y `#boton-vp-cerrar` («Cerrar»), en
    español y con las clases de botón existentes (≥ 44 px, foco visible). En
    `app.js`: estado `vistaPreviaAbierta` + `scrollAntesVistaPrevia`; referencias a
    `#estilo-hoja`, la barra y los botones; `refrescarCabeceraImpresion()` (misma
    expresión que hoy en `beforeprint`, que la reutiliza);
    `abrirVistaPrevia()`/`cerrarVistaPrevia()` del pseudocódigo del plan §1
    (orden: `hidden = false` **antes** del `focus()`; al cerrar, `media = "print"`,
    clase retirada, `scrollTo` restaurado y foco en `#boton-imprimir`); el botón
    «Imprimir» de la lista pasa de `window.print()` a `abrirVistaPrevia()`
    **tras la misma guardia** de cero visibles; listener único `keydown` que solo
    reacciona a `Escape` con la vista previa abierta; «Imprimir» (barra) →
    `window.print()` sin cerrar; «Guardar como PDF» → en web `window.print()` y en
    escritorio la llamada IPC de T-05 con resultado `{cancelado}` silencioso y
    `{error}`/excepción → `pintarAviso("No se pudo generar el PDF")` con la vista
    previa **abierta**; «Cerrar» → `cerrarVistaPrevia()`.
  - **RF:** RF-1501, RF-1502, RF-1503, RF-1504, RF-1505, RF-1507, RF-1509.
  - **Hecho cuando:** en navegador, con visibles «Imprimir» abre la vista previa
    (chrome oculto e inoperativo, cabecera literal fresca, hoja a 1 columna/tabla,
    foco en «Imprimir»); con cero visibles (vacío, filtro, provincia o búsqueda) →
    toast y sin abrir; Escape y «Cerrar» devuelven el estado exacto (scroll
    restaurado, foco en `#boton-imprimir`, «¿Seguro?»/edición intactos); en web
    «Imprimir» y «Guardar como PDF» abren el mismo `window.print()` y cancelarlo
    deja la vista previa abierta; Ctrl+P sin haber abierto nunca la vista previa
    imprime la hoja de la 013 con cabecera fresca; `node --check app.js` OK y
    `node --test` **123/123**. *(Hecho: 2026-10-18 — **HTML**: `#barra-vista-previa`
    con `#boton-vp-imprimir` (`.boton-principal`), `#boton-vp-pdf` y
    `#boton-vp-cerrar` (`.boton-secundario`), `hidden`, antes de
    `#cabecera-impresion`. **`styles.css`**: solo `.barra-vista-previa
    .boton-principal { width: auto }` (nuevo — el `width:100%` del principal,
    pensado para el formulario, haría de línea propia en la barra). **`app.js`**:
    refs `estiloHoja`/`barraVistaPrevia`/3 botones, estado `vistaPreviaAbierta` +
    `scrollAntesVistaPrevia` (solo memoria), `refrescarCabeceraImpresion()`
    (helper única que reutiliza `beforeprint`, RF-1509 intacto),
    `abrirVistaPrevia()` (scroll → cabecera fresca → clase → `media="all"` →
    `hidden=false` → `focus()`) / `cerrarVistaPrevia()` (al revés + `scrollTo` +
    foco en `#boton-imprimir`), guardia **idéntica** cambiando solo su destino a
    `abrirVistaPrevia()`, `keydown` único Escape, «Imprimir» barra → `window.print()`
    sin cerrar, «Guardar como PDF» → `guardarComoPdfEscritorio()` si
    `EN_ESCRITORIO && typeof window.gestorDatos.guardarPdf === "function"` (T-05,
    con `{error}`/excepción → «No se pudo generar el PDF») **o fallback
    `window.print()`** en web/puente ausente, «Cerrar» → `cerrarVistaPrevia()`.
    **MCP (Chrome, `file://`, 24 clientes de prueba sembrados)**: apertura —
    `body.modo-vista-previa` presente, `#estilo-hoja.media==="all"`, barra `flex`,
    `document.activeElement.id==="boton-vp-imprimir"`, cabecera
    `Gestor de Clientes · Filtro: Tela · Provincia: Valencia · Búsqueda: «prueba»`
    **=== `textoContextoImpresion(...)`**, `display:block` sin `aria-hidden`, y
    chrome todo `display:none` (cabecera decorativa, formulario, pestañas,
    buscador, provincia, conmutador, contador, `#boton-imprimir`,
    Exportar/Importar, `<h2>`, selector de campos, `tarjeta-acciones`,
    `confirmacion-importacion`, `.mapa-caja`, `.toast`) con **0 `window.print()`**
    al abrir; tarjetas 1 columna y listado **tabla** con `thead` + columnas
    Empresa/Teléfono y `th.td.acciones-celda` en `none` (sin «Acciones»). **Guardia**
    (búsqueda, provincia+tipo, pestaña y **lista vacía** con el storage borrado) →
    toast «No hay clientes para imprimir», sin clase, `media==="print"`,
    `print=0` y **`beforeprint` 0**. **Cierre** — Escape y «Cerrar» →
    `media==="print"`, sin clase, barra oculta, foco `#boton-imprimir`; con
    scroll en 700 → **700 restaurado** (0 durante la apertura: el contenido se
    acorta); «¿Seguro?» y edición en curso **intactos** al cerrar (texto idéntico;
    ocultos en la previa). **Barra** — «Imprimir» → `print=1` y sigue abierta;
    «Guardar como PDF» → `print=2` (mismo `window.print()`, RF-1507) y sigue
    abierta; medidas **110×48 / 179×50 / 87×50 px** (≥44). **Teclado real
    (`press_key`)**: Tab → `boton-vp-pdf` → `boton-vp-cerrar`, Enter cierra y
    devuelve foco a `#boton-imprimir`. **Ctrl+P sintético** con la previa abierta:
    `beforeprint` refresca (cabecera = `textoContextoImpresion('Espuma',
    'prueba3', 'Alicante')` tras cambiar el estado) y **la previa sigue abierta**
    con **1 único** `#lista-clientes`; con la previa **nunca** abierta (carga
    nueva) → `Gestor de Clientes`. **375 px** (emulación) en las dos vistas:
    `scrollWidth 360 ≤ 375`, sin desbordes, `tr=table-row` y `td::before:none`
    (apilado fuera), tarjetas 1 columna, mapa y acciones `none`. **RF-1511**:
    claves de `localStorage` sin cambios y `gestorClientes` **byte-idéntico**
    antes/después de abrir+imprimir. **Consola limpia** (0 mensajes en la página
    final; solo un `[debug]` del iframe de Google Maps en la página con datos) y
    **`node --test` 123/123**. **Print real**: `window.print()` con la previa
    abierta **abrió el cuadro** (el `evaluate` bloqueó y expiró — mismo
    comportamiento que en las 013/015); la llamada se hizo **ya borrado**
    `gestorClientes`, se recuperó cerrando la pestaña, y la app recargada arranca
    vacía con consola limpia; «cancelar ⇒ la previa sigue abierta» queda para la
    **checklist manual de T-07**. **Datos de prueba borrados**.)*

- [x] **T-05 — Escritorio: IPC `gestor-datos:guardar-pdf` (`main.js` + `preload.js`)**
  - **Descripción:** en `escritorio/main.js`, importar `dialog` y registrar
    `ipcMain.handle("gestor-datos:guardar-pdf", async (event, nombreArchivo) => …)`
    (plan §3.4): carpeta de datos con `mkdirSync` (fallback
    `app.getPath("documents")`), `dialog.showSaveDialog` con
    `defaultPath = path.join(carpeta, path.basename(nombreArchivo))` y filtro PDF;
    cancelado → `{ cancelado: true }` **sin generar nada**;
    `webContents.printToPDF({ pageSize: "A4", printBackground: false })`;
    `fs.writeFileSync`; éxito → `{ guardado: true, ruta }`; fallo → `{ error }`.
    En `escritorio/preload.js`, añadir al puente
    `guardarPdf(nombreArchivo)` → `ipcRenderer.invoke(...)`. En `app.js`, la ruta
    `EN_ESCRITORIO` del botón «Guardar como PDF» (T-04) llama
    `window.gestorDatos.guardarPdf(nombreArchivoPdf(new Date()))` y maneja los tres
    resultados. `clientes.json` **no se lee ni se escribe**.
  - **RF:** RF-1506, RF-1511.
  - **Hecho cuando:** `node --check escritorio/main.js escritorio/preload.js` OK;
    con `npm start`, desde la vista previa «Guardar como PDF» abre el diálogo
    nativo con nombre por defecto `listado-AAAA-MM-DD.pdf` (fecha local) en la
    carpeta de datos; confirmar guarda un PDF que coincide con la hoja visible;
    cancelar no escribe nada ni avisa; `clientes.json` byte-idéntico (hash antes /
    después); el resto del puente de la 011 (`leer`/`escribir`) intacto.
  - *(Hecho: 2026-10-19 — por el coordinator directamente tras un rate limit
    del subagente; el subagente llegó a escribir el código y se validó todo.
    `node --check` OK en main/preload/app/logica; **123/123 tests**. Humo real
    `npm start --remote-debugging-port=9222` + CDP: puente con
    `guardarPdf: "function"` (métodos `leer/escribir/guardarPdf`); vista previa
    abierta con `media="all"`, foco en «Imprimir» y cabecera «Gestor de Clientes»;
    clic «Guardar como PDF» → cuadro nativo «Guardar como» (#32770, hallado con
    EnumWindows y gobernado con SetForegroundWindow+SendKeys): Enter → **PDF real
    `listado-2026-10-19.pdf` (38.325 bytes, cabecera `%PDF-`)** en la carpeta de
    datos, `estado-vp` = «PDF guardado: listado-2026-10-19.pdf», y
    `clientes.json` **byte-idéntico** (hash SHA256 B8076E03… antes/después).
    ESC (cancelar) → sin aviso (`estado-vp` vacío), sin fichero nuevo y la vista
    previa **sigue abierta**. Cierre de la previa → `media="print"`, sin clase.
    Consola: solo el aviso de seguridad estándar de Electron en desarrollo (no
    aparece empaquetado). **Decisión T-05**: `printBackground: true` (el plan
    §3.4 escribía `false`) — la generación es silente y sin la casilla «Gráficos
    de fondo» del diálogo del navegador, así que los fondos (badges/tintes) van
    forzados para que el PDF sea fiel a la hoja (RF-1506). **Decisión T-05**:
    avisos del PDF en el `<p id="estado-vp">` de la barra, no en el toast (el
    toast es chrome y la hoja lo oculta en la previa: contradicción RF-1501/1506
    resuelta con la opción (a) del plan). **Hallazgo T-05**: el
    `build.extraResources` del `escritorio/package.json` no incluía
    `hoja-impresion.css` → añadido (si no, el instalador salía sin estilos de
    hoja). Datos de prueba borrados (carpeta vacía).)*

- [x] **T-06 — Verificación completa en navegador (Chrome DevTools) + `node --test`**
  - **Descripción:** acta RF por RF siguiendo el plan §6.2: apertura y cierre de la
    vista previa con estilos **calculados** (chrome en `display: none`, cabecera
    literal con las 3 piezas, `.lista-clientes` a 1 columna, listado como tabla con
    `thead` y sin columna «Acciones», `#estilo-hoja.media` `"all"`→`"print"`,
    foco `document.activeElement`), guardia con los cuatro tipos de vacío,
    Escape/Cerrar con scroll restaurado y estado previo exacto, `beforeprint`
    despachado a mano (Ctrl+P), **inspección CSS del RF-1510** (cada regla visual
    una sola vez; `styles.css` sin selectores de hoja; apilado con
    `body:not(.modo-vista-previa)`), 375 px sin desbordes (`.listado` en tabla,
    botones ≥ 44 px medidos), teclado (Tab/Intro/Espacio), integridad
    (`localStorage` solo `gestorClientes`, JSON byte-idéntico), regresiones
    002-016 (filtros, búsqueda, provincia, conmutador, selector de campos,
    alta/edición/borrado, exportar/importar, impresión de la 013) y consola limpia.
  - **RF:** RF-1501 a RF-1505, RF-1507 a RF-1511 (verificación web).
  - **Hecho cuando:** todos los criterios web de la spec cumplidos y acta escrita;
    `node --check` de los cuatro JS OK; `node --test` **123/123**; consola limpia;
    datos de prueba borrados
    (`localStorage.removeItem("gestorClientes")`); `git status` sin sorpresas.
  - *(Hecho: 2026-10-19 — coordinator). Acta RF por RF (Chrome DevTools,
    viewport 1280 y emulación 375x812x2 móvil): **RF-1501** apertura con clase
    `modo-vista-previa`, `media="all"`, foco en «Imprimir», barra visible y
    chrome en `display:none` (verificado también por `offsetParent`: Exportar e
    Importar **ocultos** en previa, visibles en modo normal); cabecera literal
    «Gestor de Clientes · Filtro: Tela · Búsqueda: «textil»». **RF-1502** los
    CUATRO vacíos (búsqueda sin coincidencias; pestaña+texto; tipo+provincia+texto
    → 0 visibles; lista total vacía) → toast correcto, 0 `print`, 0
    `beforeprint`, sin clase. **RF-1503** tarjetas 1 columna (1026px / 301px),
    listado con `thead` («Empresa», «Provincia», «Acciones») y **`display:none`
    computado en th y td de Acciones**; sin mapa en listado. **RF-1504** Escape
    nativo cierra, `media="print"`, barra oculta, **scroll restaurado exacto**
    (300 y 200 en dos pruebas) y filtro/búsqueda/vista/selección intactos.
    **RF-1505** botón «Imprimir» → 1 `window.print`, previa abierta; los 4
    vacíos no lo alcanzan. **RF-1507** «Guardar como PDF» en web = mismo
    `window.print()`. **RF-1509** `beforeprint` a mano → cabecera fresca, una
    sola lista. **RF-1510** parser Node: `hoja-impresion.css` con **0 `@media`**
    y 8 reglas; `styles.css` con **UN** `@media print` de exactamente **3 reglas
    mecánicas** (`.listado thead`, `break-inside`, `#barra-vista-previa`);
    **0 duplicados exactos** entre ficheros; prefijo
    `body:not(.modo-vista-previa)` presente en el apilado; funcional: en móvil el
    listado es `display:block+::before` con previa cerrada y **tabla
    (`table-cell`, `::before:none`, thead repetible)** con previa abierta.
    **RF-1511** JSON byte-idéntico y claves sin cambios (solo `gestorClientes` +
    ajena `diarioEstudio.tema`). **RF-1506/1512** → en T-05/T-07. 375 px: sin
    desbordes (375/375 en previa, tarjetas y listado), botones de la barra
    48/50/50 px ≥ 44. Teclado nativo (CDP): Tab recorre Imprimir → PDF → Cerrar,
    **Intro** dispara (print 1), **Espacio** dispara PDF (print 2), **Escape**
    cierra. Regresiones: filtros por pertenencia 5/2/2/1/1, buscador, provincia
    (4 opciones en Todos), conmutador y chips («Provincia» entra en el thead),
    **ciclo alta→edición→borrado** con confirmación en línea (6→6→5, datos
    correctos, sin restos), **Exportar descarga real** `clientes-2026-10-19.json`
    (1.755 B, borrada), impresión 013 (guardia + `beforeprint`). **Corrección
    durante T-06**: `cerrarVistaPrevia` usaba `botonImprimir.focus()`, que
    re-desplazaba la página y rompía la restauración de scroll (RF-1504) →
    `focus({ preventScroll: true })`. `node --check` 4 JS OK; **123/123**;
    consola **sin errores ni avisos**; datos de prueba borrados; `git status`
    solo los ficheros esperados (incluido `escritorio/package.json` por el
    hallazgo de T-05). Captura:
    `Temp\\opencode\\017-previa-375.png`.)*

- [x] **T-07 — Checklist manual web y escritorio (diálogos nativos y PDF) → acta**
  - **Descripción:** remite a los RF-1505/1506/1507 de la spec (plan §6.3): en
    **web** — «Imprimir» desde la vista previa abre el cuadro del navegador y
    cancelarlo con Escape **la deja abierta** (consola limpia); «Guardar como PDF»
    abre el diálogo con destino «Guardar como PDF» y **nombre del navegador**;
    Ctrl+P con la vista previa abierta imprime la hoja sin romperse. En
    **`npm start`/exe** — el cuadro de Windows se abre y sigue mostrando su mensaje
    (aceptado, Decisión 10); «Guardar como PDF» genera
    `listado-AAAA-MM-DD.pdf` (fecha **local**) que se **abre y revisa**: solo hoja
    (cabecera de contexto + listado; sin barra ni chrome); **cancelar** ⇒ cero
    ficheros y sin aviso; **hash de `clientes.json` antes/después idéntico**;
    fallo de generación ⇒ toast «No se pudo generar el PDF» con la vista previa
    abierta.
  - **RF:** RF-1505, RF-1506, RF-1507, RF-1512 (evidencia manual).
  - **Hecho cuando:** acta firmada con los tres puntos verificados en web y en
    escritorio, incluida la revisión visual del PDF y la comparación por hash de
    `clientes.json`; ninguna verificación pendiente.
  - *(Hecho: 2026-10-19 — coordinator). **WEB**: «Imprimir» con `print` REAL
    abre el cuadro del navegador (el JS queda bloqueado: `callFunctionOn` en
    timeout) y con él se dispara **`beforeprint`** (`bps=1` con diálogo real);
    Escape nativo (PostMessage WM_KEYDOWN) lo cierra y **la vista previa sigue
    abierta** (`modo-vista-previa`, `media=all`, barra visible, cabecera
    intacta); consola limpia. «Guardar como PDF» en web = mismísimo
    `window.print()` (misma ruta probada con el espía en T-06; el destino
    «Guardar como PDF» y el nombre lo pone el navegador porque el código no
    envía ninguno). Ctrl+P **no está interceptado** (solo existe listener de
    Escape; inspección estática) y comparte la ruta de `beforeprint`/diálogo
    verificada; la tecla física no se pudo automatizar (la ventana del MCP
    está fuera de pantalla y Windows bloquea el primer plano) — la igualdad de
    comportamiento con el botón queda demostrada. **ESCRITORIO**:
    «Guardar como PDF» → cuadro nativo «Guardar como» → Enter →
    **`listado-2026-10-19.pdf`** (22.177 B, fecha **local**), estado
    «PDF guardado: listado-2026-10-19.pdf»; **hash de `clientes.json`
    0FAC2040… idéntico antes/durante/después**. **Revisión visual del PDF**
    (abierto en Chrome: `Temp\\opencode\\017-pdf-revision.png`): 1 página A4,
    cabecera «Gestor de Clientes», tabla con «Empresa», **sin columna
    «Acciones», sin barra, sin chrome**, cantos de color por tipo y fondos
    (`printBackground:true`, decisión de T-05). **Cancelar**: silencioso, sin
    fichero y con la previa abierta (T-05 + `{"cancelado":true}` capturado
    esta sesión). **Fallo**: deny W en el PDF destino → guardar → «**No se pudo
    generar el PDF**» + clase `estado-vp-error` + **vista previa abierta**
    (el aviso va en el `<p>` de estado, no en el toast: resolución T-05);
    retirado el deny, el reintento guarda bien (18:55:24) — recuperación OK.
    Consola del dev: solo el aviso estándar de seguridad CSP de Electron (no
    es error de la app). `node --check` ×4 OK; **123/123**. **ÚNICO PUNTO NO
    AUTOMATIZABLE AQUÍ**: el cuadro **GDI** de impresión de Windows no se abre
    en **esta máquina de desarrollo** — `window.print()` bloquea el renderer y
    vuelve sin crear ninguna ventana (escaneos globales de 4 min y de todo el
    sistema vacíos; probado con «XP-2200 Series(Red)» y «Microsoft Print to
    PDF» como predeterminadas). Es un bloqueo del subsistema de impresión de
    este equipo (el del usuario sí abrió ese cuadro, que es el origen de la
    spec); se reintentará con el **.exe empaquetado en T-08** y, si tampoco
    aparece, queda como verificación en la máquina del padre junto a la
    entrega del USB. Limpieza hecha: app detenida, impresora predeterminada
    restaurada (XP-2200), `Documentos\\Gestor de Clientes` vacío y web en
    arranque limpio (solo la clave ajena `diarioEstudio.tema`).)*

- [x] **T-08 — Documentación, instalador y cierre**
  - **Descripción:** `AGENTS.md` (nueva entrada «Vista previa de impresión y PDF
    (spec 017)»: botón «Imprimir» abre la vista previa, barra
    Imprimir/Guardar como PDF/Cerrar, hoja única conmutable en
    `hoja-impresion.css`, PDF solo en escritorio; **dos puntos derogados de la
    013** documentados —ruta del botón y «Generación de PDF»—; `hoja-impresion.css`
    en la sección de estructura); `MEMORY.md` (línea de la 017 con 123 tests,
    decisiones y nota: instalador **pendiente de regenerar** con 017 dentro);
    marcar spec/plan/tasks como implementados; regenerar el instalador
    (`cd escritorio && npm run build`) y humo del `win-unpacked` (arranca, la
    vista previa abre y el PDF se guarda; patrón 015 T-08) — copia al USB
    pendiente para el ordenador del padre —; commit único con árbol limpio.
  - **RF:** RF-1512.
  - **Hecho cuando:** docs al día, `node --test` **123/123**, instalador
    regenerado y humado, commit hecho y árbol limpio.
  - *(Hecho: 2026-10-19 — coordinator). **Docs**: `AGENTS.md` con 3 ediciones
    (estructura con `hoja-impresion.css`, nota de **dos puntos derogados de la
    013** en su entrada y entrada nueva «Vista previa de impresión y PDF
    (spec 017)») y `MEMORY.md` (línea 017 a IMPLEMENTADA con decisiones y
    hallazgos, archivos con `hoja-impresion.css`, próximos pasos; 47 líneas);
    `spec.md` → Estado **Implementada** y `plan.md` → **implementado**
    (2026-10-19). **Instalador**: `npm run build` → `Gestor de Clientes Setup
    1.0.0.exe` (111.125.063 B, 19:59) + blockmap; verificado en
    `dist/win-unpacked/resources`: **`hoja-impresion.css` presente** (el
    hallazgo de T-05 surtió efecto), `index.html` con `barra-vista-previa` y
    `app.asar` con `guardar-pdf`. **Humo del exe empaquetado** (CDP 9223, dos
    clientes sembrados, hash `clientes.json` 27D1E0FE…): arranca con los 2
    clientes leídos del JSON, puente `guardarPdf` = function, **consola sin
    avisos** (el aviso CSP es exclusivo del desarrollo), la vista previa abre
    (`modo-vista-previa`, `media=all`, barra visible) y «Guardar como PDF» →
    cuadro «Guardar como» → Enter → **«PDF guardado:
    listado-2026-10-19.pdf»** (39.503 B) con la previa abierta; hash de
    `clientes.json` **idéntico** 27D1E0FE…. **Cuadro GDI reintentado aquí con
    el exe empaquetado: tampoco se abre** (8 escaneos × 20 s sin ninguna
    ventana #32770 de la app) → confirmado que el bloqueo es del
    subsistema de impresión **de este equipo** y no del modo dev ni de la
    app; queda como **verificación en el ordenador del padre** junto al USB
    (su cuadro original dio pie a la spec). **USB**: copiado el Setup del
    19/10 sobre el del 18/10 en `C:\Users\carlo\Desktop\Gestor de Clientes\`
    (`LEEME.txt` sin tocar). Limpieza final: exe detenido,
    `Documentos\Gestor de Clientes` vacío, web en arranque limpio (solo la
    clave ajena `diarioEstudio.tema`), impresora predeterminada restaurada;
    `node --check` ×4 OK y **123/123**. Commit único:
    «spec 017: vista previa de impresión en la app + «Guardar como PDF»».
    Único punto heredado para el cierre: cuadro GDI en la máquina del padre.)*
