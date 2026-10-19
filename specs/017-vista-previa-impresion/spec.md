# Spec 017 — Vista previa de impresión dentro de la app y «Guardar como PDF»

| Campo | Valor |
|---|---|
| **ID** | `017-vista-previa-impresion` |
| **Título** | Botón «Imprimir»: pantalla de vista previa con la hoja tal como saldrá, más «Guardar como PDF» |
| **Estado** | **Implementada (2026-10-19)** |
| **Fecha** | 2026-10-18 |
| **Dependencia** | Se implementa sobre el estado cerrado de las specs **011** (app de escritorio), **012** (listado), **013** (impresión), **015** (provincia) y **016** (desplegable). Deroga **dos** puntos de la 013, expresamente: (a) la ruta del **botón** «Imprimir» (RF-1102: ahora abre la vista previa en vez del diálogo) y (b) su *Fuera de alcance* «**Generación de PDF**… la app no genera ni guarda archivos PDF» (specs/013-imprimir/spec.md:168-169): en escritorio la app **sí** genera y guarda el PDF de la hoja (RF-1506). **Todo lo demás de la 013 queda intacto** (guardia de cero visibles, Ctrl+P sin interceptar, hoja limpia, cabecera de contexto en `beforeprint`, exclusión del mapa). No se modifica ninguna otra spec cerrada. |

---

## 1. Contexto y objetivo

El usuario pide, con sus palabras: *«la aplicacion dice, cuando le doy al boton de imprimir,
"Esta aplicación no admite la vista previa de impresión". Yo quiero que sí se pueda»*, y aclara:
*«el mensaje aparece cuando le doy al botón de imprimir en la **app .exe**, sale un cuadro con
los ajustes para la impresión, y a la derecha del cuadro aparece la vista previa. En mi caso no
aparece la vista previa, sale ese mensaje de que no está disponible»*.

**Diagnóstico confirmado:** el cuadro es el **diálogo de impresión de Windows** y el mensaje lo
pone Windows. La app de escritorio (Electron, spec 011) imprime por la vía GDI antigua: Electron
**no soporta la vista previa de Windows ni la de Chrome** y **no hay ninguna bandera que la
active**. En la **web** (navegador) la vista previa del diálogo sí funciona. Nuestro código solo
llama a `window.print()` (botón «Imprimir», spec 013): el mensaje **no** es nuestro.

**Decisión del usuario (ya tomada):** quiere **las dos cosas**:

1. **Vista previa dentro de la app**: al pulsar «Imprimir» se abre una pantalla **dentro de la
   propia app** con la hoja **tal como saldrá impresa** (cabecera de contexto + listado en formato
   papel) y botones **«Imprimir»** y **«Cerrar»**. Debe comportarse **igual en la web y en la app
   de escritorio**.
2. **Botón «Guardar como PDF»**: además, la posibilidad de generar el PDF de esa misma hoja y
   guardarlo.

**Respuestas del usuario (2026-10-18)** a las dudas del borrador, ya incorporadas a los
requisitos, criterios, casos límite y Decisiones:

1. En la **.exe** el cuadro nativo de Windows **se abre igualmente** al imprimir desde la
   vista previa y el usuario **«sí, se conforma»**: allí se eligen impresora y copias, y la
   vista previa «visual» es la de la propia app (Decisión 10).
2. El PDF por defecto se llama **`listado-AAAA-MM-DD.pdf`** con **fecha local** (Decisión 6).
   **Solo en la .exe**: en la web el nombre lo propone el navegador (ver respuesta al QA más
   abajo).
3. **Ctrl+P sigue igual que hoy**: abre el cuadro del navegador directamente, sin pasar por la
   vista previa; la spec 013 queda intacta (Decisión 4).
4. **«Guardar como PDF» existe también en la web**: allí abre el diálogo de impresión del
   navegador (que ya ofrece «Guardar como PDF» como destino, con su vista previa); en la .exe
   genera el PDF vía IPC + `dialog.showSaveDialog` (Decisiones 5, 6 y 7).

**Respuesta del usuario al QA (2026-10-18):** *«Aceptar: nombre fijo solo en la .exe»* —
`listado-AAAA-MM-DD.pdf` aplica **solo** al PDF generado en escritorio (RF-1506); en la
**web** el nombre lo propone el navegador (sin dependencias no se puede imponer) y el usuario
puede cambiarlo en el cuadro (RF-1507). El botón «Guardar como PDF» **sigue existiendo en la
web**. No hace falta reconsultarle.

**Objetivo:** sustituir la ruta del botón «Imprimir» por una **vista previa en pantalla** que
muestre **exactamente la hoja que se imprimirá** (sin duplicar su definición: una sola fuente de
estilos, para que vista previa y papel **nunca divergan**), con una barra de acciones
**«Imprimir» / «Guardar como PDF» / «Cerrar»**, manteniendo intactos la guardia de cero
visibles, Ctrl+P, la hoja limpia de la 013 y los datos.

**Definiciones:**

- **Hoja**: la salida impresa definida por la spec 013 (cabecera de contexto + listado en
  formato papel, sin chrome ni mapa).
- **Vista previa**: la pantalla *dentro de la app* que muestra la hoja antes de imprimir;
  **no** es el panel de vista previa del cuadro de Windows.
- **Chrome**: todo lo interactivo o decorativo de la app que no viaja al papel (mismas
  exclusiones que la 013).

**Usuarios:** el comercial (usuario directo) que imprime o guarda el listado, sobre todo desde
la **app .exe** (donde el cuadro de Windows no muestra vista previa); el usuario de la **web**,
que debe tener la misma experiencia; y quien ya tiene **datos reales** guardados, que no debe
ver alterados ni un solo cliente (`localStorage` y `clientes.json` intactos).

**Historias de usuario:**

- **HU-1.** Como usuario de la app .exe, quiero que al pulsar «Imprimir» se abra una vista
  previa **dentro de la app** con la hoja tal como saldrá, para poder revisarla antes de imprimir
  (Windows no me la muestra).
- **HU-2.** Como usuario, quiero en la vista previa los botones **«Imprimir»** y **«Cerrar»**
  para pasar al cuadro de impresión o volver a la app.
- **HU-3.** Como usuario, quiero un botón **«Guardar como PDF»** para quedarme el listado en
  PDF (en el escritorio elijo dónde guardarlo; en la web con el diálogo del navegador).
- **HU-4.** Como usuario de la web, quiero que la vista previa y los botones funcionen **igual
  que en el escritorio** para no aprender dos apps.
- **HU-5.** Como usuario, quiero que la vista previa muestre **exactamente** lo que se
  imprimirá —filtro, provincia, búsqueda, vista y campos elegidos— para no llevarse sorpresas
  en papel.

## 2. Requisitos funcionales (EARS)

- **RF-1501 — El botón «Imprimir» abre la vista previa dentro de la app.** CUANDO el usuario
  pulse el botón **«Imprimir»** de la cabecera de la lista (en cualquiera de las dos vistas) y
  haya **al menos un cliente visible**, EL SISTEMA SHALL abrir una **vista previa dentro de la
  propia app** —misma pantalla, mismos textos y mismo comportamiento en la **web** y en la
  **app de escritorio**— que muestre **la hoja tal como se imprimirá** (cabecera de contexto +
  listado) junto a una barra con los botones **«Imprimir»**, **«Guardar como PDF»** y
  **«Cerrar»**. MIENTRAS la vista previa esté abierta, el chrome de la aplicación (cabecera
  decorativa, formulario, pestañas, buscador, filtro de provincia, conmutador, contador, botones
  Exportar/Importar/Imprimir, selector de campos, acciones de tarjeta y de fila, marcas de
  edición, confirmación de importación, mapa y toast) SHALL estar **oculto e inoperativo**. La
  vista previa SHALL mostrar **el mismo HTML de la lista en vivo** con el chrome oculto: **no
  se clona ni se repinta nada** (no SHALL existir una copia del listado ni de la cabecera de
  contexto para la vista previa).
  «Instantánea» es solo un **compromiso de comportamiento**: mientras la vista previa esté
  abierta no cambiarán datos, filtro, búsqueda, vista ni selección de campos desde dentro
  (para cambiar algo se cierra, se cambia y se vuelve a abrir).
  Abrir o cerrar la vista previa NO SHALL crear, modificar ni borrar
  clientes, ni alterar filtro, búsqueda, vista o selección, ni escribir ninguna clave.
- **RF-1502 — La guardia de cero visibles sigue intacta.** CUANDO no haya **ningún cliente
  visible** (lista vacía, filtro de tipo o de provincia sin resultados o búsqueda sin
  coincidencias), EL SISTEMA SHALL mostrar el toast **«No hay clientes para imprimir»** y **NO**
  SHALL abrir la vista previa: misma condición (compartida con el pintado de la lista) y mismo
  texto que la guardia del botón de la spec 013 (RF-1102). Esta guardia SHALL aplicar **solo al
  botón «Imprimir»**.
- **RF-1503 — La vista previa muestra exactamente lo que se imprimirá.** EL SISTEMA SHALL
  mostrar en la vista previa **los mismos clientes visibles en ese momento**, en el mismo orden
  (más reciente primero), con la **vista activa** (tarjetas o listado) y, en listado, **solo los
  campos elegidos**, con las convenciones de siempre («Sin nombre», «Sin tipo», «—», celda de
  tipos unida). La hoja de la vista previa SHALL llevar la **cabecera de contexto con el mismo
  texto literal** que se imprime — `textoContextoImpresion(filtroActivo, textoBusqueda,
  filtroProvincia)`, p. ej. `Gestor de Clientes · Filtro: Tela · Provincia: Valencia ·
  Búsqueda: «vega»`, con las piezas vacías omitidas—, rellenada **al abrir la vista previa** sobre **el mismo elemento en vivo** que refresca `beforeprint` para Ctrl+P (**una sola** cabecera, no una copia; y
  seguirá refrescándose en `beforeprint`, RF-1509). La hoja NO SHALL contener
  **ningún** elemento de chrome: mismas exclusiones que la spec 013 —sin formulario, pestañas,
  buscador, conmutador, contador, chips ni título «Campos del listado», sin columna «Acciones»
  ni acciones de tarjeta, sin «¿Seguro? · Sí, eliminar / No», sin marcas de edición, sin cabecera
  decorativa, **sin mapa** (ni iframe ni enlace) y sin toast—; el listado SHALL mostrarse
  **siempre como tabla con su cabecera de columnas**, las tarjetas **a una sola columna**, el
  texto de las celdas **completo sin «…»** y el `<h2>` «Clientes» **no** SHALL aparecer (lo
  sustituye la cabecera de contexto). La cabecera de contexto, mientras sea visible en la vista
  previa, SHALL ser **legible también para lectores de pantalla** (no SHALL quedar oculta para
  ellos). **Contradicción a resolver en el plan:** `#cabecera-impresion` tiene hoy
   `aria-hidden="true"` (index.html:166), que la oculta a los lectores de pantalla; el plan
   deberá levantar ese atributo de modo que en la vista previa sea accesible, sin que en la
   pantalla normal deje «leído» de más un elemento oculto. La vista previa y el papel SHALL regirse por **un único juego de reglas de hoja**
  (RF-1510, Decisión 2).
- **RF-1504 — Barra de acciones de la vista previa.** La vista previa SHALL mostrar una barra
  con **«Imprimir»**, **«Guardar como PDF»** y **«Cerrar»**, **en español**, con objetivo
  táctil ≥ 44 px, foco visible y operables con teclado (alcanzables con Tabulador y activables
  con Intro o Espacio); al abrir, el foco SHALL pasar a la barra, concretamente al **primer botón, «Imprimir»** (verificable con `document.activeElement`). CUANDO se pulse **«Cerrar»**
  —o la tecla **Escape**—, EL SISTEMA SHALL cerrar la vista previa y devolver la app a su estado
  anterior **exacto** (los mismos filtro, búsqueda, provincia, vista y selección de campos, la **posición de scroll** de la lista restaurada, con
  el foco de vuelta en el botón «Imprimir»). La barra de la vista previa **no SHALL imprimirse
  ni aparecer en el PDF**: es pantalla, no hoja.
- **RF-1505 — «Imprimir» dentro de la vista previa.** CUANDO se pulse **«Imprimir»** en la
  vista previa, EL SISTEMA SHALL abrir el **diálogo de impresión nativo** (el del navegador en
  la web, el del sistema operativo en el escritorio) con la hoja ya mostrada. CUANDO ese
  diálogo se **cancele o se cierre**, EL SISTEMA SHALL **seguir en la vista previa** (no se
  cierra). SI en Windows el cuadro del sistema **no admite su propio panel de vista previa**
  (limitación de Windows/Electron confirmada en el diagnóstico), ENTONCES **la vista previa de
  la app es la vista previa**: el usuario ya ha visto la hoja antes de llegar a ese cuadro.
  Usar el diálogo nativo SHALL seguir siendo obligatorio: **no** existe ninguna bandera que
  active la vista previa de Windows en la app de escritorio (aceptado por el usuario, Decisión 10). En la **web**, este botón y «Guardar como PDF» (RF-1507) SHALL abrir **literalmente el mismo** `window.print()`. **Evidencia** (el MCP de Chrome DevTools no puede interactuar con el diálogo nativo): **checklist manual** en web y en `npm start`/exe — abrir el diálogo, cancelarlo con Escape y constatar que la vista previa **sigue abierta** y la consola queda **limpia**.
- **RF-1506 — «Guardar como PDF» en la app de escritorio.** Este RF **deroga expresamente** el apartado «Generación de PDF» del *Fuera de alcance* de la spec 013 (specs/013-imprimir/spec.md:168-169: «la app no genera ni guarda archivos PDF»), igual que la 017 deroga la ruta del botón RF-1102. CUANDO se pulse **«Guardar como
  PDF»** en escritorio, EL SISTEMA SHALL generar el **PDF de la hoja actual** (mismo contenido
  que la vista previa: cabecera de contexto + listado, sin chrome ni barra) y SHALL abrir el
  **diálogo nativo de guardado** con nombre por defecto **`listado-AAAA-MM-DD.pdf`** con fecha
  **local** (mismo criterio de fecha local que la exportación de la 011). CUANDO el usuario
  **cancele** el diálogo, EL SISTEMA SHALL **no guardar nada y sin mostrar aviso** de error.
  SI la generación del PDF fallase, ENTONCES EL SISTEMA SHALL mostrar el toast **«No se pudo
  generar el PDF»** y la vista previa SHALL **permanecer abierta**. El PDF no SHALL tocar
  `clientes.json`. **Evidencia** (el MCP no puede abrir `showSaveDialog` ni inspeccionar el PDF): **checklist manual** con `npm start`/exe — generar el PDF, **abrirlo y revisarlo** (solo hoja: cabecera de contexto + listado, sin barra ni chrome), **cancelar** el diálogo y constatar que no se escribe ningún fichero y la vista previa sigue, y comparar `clientes.json` **por hash antes/después** (idéntico).
- **RF-1507 — «Guardar como PDF» en la web.** CUANDO se pulse **«Guardar como PDF»** en la web,
  EL SISTEMA SHALL abrir el **diálogo de impresión del navegador** —la única vía con que la web
  puede producir un PDF **sin dependencias** (regla 1 de la constitución)—, diálogo en el que
  el navegador **ofrece «Guardar como PDF» como destino** y **ya muestra su propia vista
  previa**. El nombre por defecto **`listado-AAAA-MM-DD.pdf` es SOLO de la app de escritorio** (RF-1506): en la web el nombre del fichero **lo decide el navegador** (sin dependencias no se puede imponer) y el usuario puede cambiarlo en su cuadro. El botón SHALL existir con el **mismo texto y posición** en web y escritorio
  (RF-1508); solo su destino difiere. **Evidencia** (el MCP no puede interactuar con el cuadro del navegador): **checklist manual** en web — pulsar el botón, constatar que se abre el cuadro con destino «Guardar como PDF» y que el nombre propuesto es el del navegador, cancelar con Escape y verificar que la vista previa **sigue abierta** y la consola queda **limpia**.
- **RF-1508 — Misma experiencia en web y escritorio.** EL SISTEMA SHALL comportarse de forma
  **idéntica** en la web y en la app de escritorio en la vista previa: misma hoja, mismos
  textos y literal de la cabecera, mismos tres botones, misma guardia y mismo «Cerrar»; **solo**
  el destino de «Guardar como PDF» (PDF real con diálogo de guardado en escritorio, diálogo del
  navegador en la web) SHALL diferir. El funcionamiento NO SHALL requerir red, servidor ni
  dependencias nuevas, y la web SHALL seguir funcionando con **doble clic (`file://`)**.
- **RF-1509 — Ctrl+P y el menú del navegador siguen intactos (spec 013).** EL SISTEMA SHALL
  tolerar la **ruta nativa** del navegador (Ctrl+P o menú «Imprimir…») **sin pasar por la vista
  previa**: esa ruta imprime directamente la hoja, con la cabecera de contexto **fresca** en
  `beforeprint`; y con **cero clientes visibles** imprime la lista en su estado vacío **sin**
  el toast (la guardia es solo del botón, RF-1102 intacto). Esta ruta SHALL seguir funcionando
  **aunque el usuario nunca abra la vista previa**, sin depender de que la vista previa se haya
  abierto alguna vez.
- **RF-1510 — Fuente única de la hoja: vista previa y papel no pueden divergir.** EL SISTEMA
  SHALL definir la hoja —vista previa **e** impresa— con **un único juego de reglas de
  presentación**, conmutado entre su medio de papel y su medio de pantalla **solo mientras dure
  la vista previa**, de modo que **no exista ninguna declaración de apariencia duplicada** («copia» = regla visual repetida: cada regla visual de la hoja —tipografías, tamaños, colores, disposición del listado, exclusiones de chrome…— SHALL estar escrita **una sola vez** en el CSS; la **condición de medio** que la activa —papel / pantalla-con-vista-previa— sí puede existir una vez por medio, porque no es apariencia sino conmutación). Criterio verificable: **cada regla visual de la hoja está escrita una sola vez en el CSS** (el mecanismo concreto queda para `plan.md`), de modo que ningún cambio futuro (012, 014, 015…) pueda desviar la vista previa del papel.
  Las reglas **puramente mecánicas del papel** (cortes de
  página, cabecera de columnas repetida y ocultado de la barra de la vista previa) SHALL quedar
  **solo** en el medio de papel: no afectan a la apariencia en pantalla. CUANDO la vista previa
  se cierre, EL SISTEMA SHALL devolver la pantalla **exactamente** a su estado anterior, sin
  restos de la hoja.
- **RF-1511 — Presentación pura: datos y claves intactos.** EL SISTEMA SHALL tratar la vista
  previa, la impresión y la generación del PDF como **presentación pura**: nunca escribirán
  clientes ni claves —`gestorClientes` y `clientes.json` quedan **byte a byte** intactos y **no
  se crea ninguna clave nueva** (mismo criterio que RF-1006 y RF-1103)—.
- **RF-1512 — Cierre: lógica mínima, tests y verificación.** El **único** comportamiento nuevo
  de **lógica pura** SHALL ser el **nombre del fichero PDF de escritorio** (`listado-AAAA-MM-DD.pdf` con fecha **local**; en la web el nombre lo da el navegador, RF-1507),
  resuelto en `logica.js` **reutilizando la ayuda de fecha local ya existente** (`nombreArchivoExportacion`, sus tests de fecha **local** de `test-logica.js` —incluido el caso de medianoche— y `dosDigitos` para el relleno de ceros); en ningún caso se usará `toISOString()` para el día (devuelve UTC; skill `local-dates`). El resto de la vista previa es
  **presentación**. Los tests existentes (**122**) SHALL seguir **en verde** y solo se
  añadirán los del nombre del fichero. La interfaz se SHALL verificar en navegador (web y
  escritorio, móvil 375 px sin desbordes, teclado, consola limpia, sin claves nuevas). Como el MCP de Chrome DevTools **no puede** verificar los diálogos nativos (impresión, `showSaveDialog`), el contenido o el nombre del PDF, ni el cuadro de Windows de la .exe, esos puntos SHALL verificarse con la **checklist manual** documentada en los RF-1505, RF-1506 y RF-1507 (web y `npm start`/exe). Al cierre, `AGENTS.md` y `MEMORY.md` SHALL actualizarse.

## 3. Criterios de aceptación

- **Given** la lista con clientes visibles, **when** se pulsa «Imprimir», **then** se abre la
  vista previa dentro de la app con la hoja y los botones «Imprimir», «Guardar como PDF» y
  «Cerrar», y **no** se abre todavía ningún diálogo; **when** no hay visibles (lista vacía,
  filtro sin resultados, provincia sin resultados o búsqueda sin coincidencias), **then** el
  toast «No hay clientes para imprimir» y **sin** vista previa.
- **Given** filtro «Tela», provincia «Valencia», búsqueda «vega» y vista «Listado» con Empresa +
  Teléfono, **when** se abre la vista previa, **then** la cabecera es literal
  `Gestor de Clientes · Filtro: Tela · Provincia: Valencia · Búsqueda: «vega»` y la hoja lleva
  exactamente esos clientes y esas dos columnas, sin ningún botón, chip, pestaña, contador,
  columna «Acciones» ni mapa.
- **Given** la vista previa abierta, **then** el formulario, filtros, buscador, conmutador,
  contador, Exportar/Importar e Imprimir no están visibles ni son operables, y la hoja se ve igual
  en la **web** y en la **app .exe**.
- **Given** la vista previa abierta, **when** se pulsa «Imprimir», **then** se abre el diálogo
  nativo de impresión con la hoja; **when** se cancela ese diálogo, **then** se **sigue** en la
  vista previa (abierta e igual que antes).
- **Given** la vista previa en escritorio, **when** se pulsa «Guardar como PDF» y se confirma,
  **then** se guarda un PDF que contiene **solo** la hoja (cabecera de contexto + listado, sin
  barra ni chrome) con nombre por defecto `listado-2026-10-18.pdf` (fecha local, **solo en
  escritorio**); **when** se
  cancela el diálogo de guardado, **then** no se escribe ningún fichero y no hay aviso de error.
- **Given** la vista previa en la web, **when** se pulsa «Guardar como PDF», **then** se abre el
  diálogo de impresión del navegador, que ofrece «Guardar como PDF» como destino y muestra su
  vista previa, y el nombre propuesto es **el del navegador** (no `listado-…pdf`); además,
  «Imprimir» y «Guardar como PDF» abren **el mismo** `window.print()`.
- **Given** la vista previa abierta, **when** se pulsa «Cerrar» o **Escape**, **then** la app
  vuelve **exactamente** al estado anterior (filtro, búsqueda, provincia, vista y campos
  iguales, **posición de scroll restaurada**) y el foco queda en «Imprimir» (primer botón de la
  barra); **when** se abría con un «¿Seguro? · Sí, eliminar /
  No» o una edición en curso, **then** al cerrar siguen tal cual estaban.
- **Given** la vista previa abierta (o el PDF generado), **then** `gestorClientes` y
  `clientes.json` **no cambian** y no aparece ninguna clave nueva en `localStorage`.
- **Given** la app con la vista previa **nunca** abierta, **when** se imprime con **Ctrl+P**,
  **then** sale la hoja limpia con la cabecera fresca (sin pasar por la vista previa); **given**
  cero visibles, **when** se usa Ctrl+P, **then** se imprime el estado vacío **sin** toast y sin
  bloquear el diálogo.
- **Given** vista «Tarjetas» con mapa cargado, **when** se abre la vista previa, **then** la
  hoja muestra las tarjetas **en una columna**, con los datos completos (sin «…») y **sin** ni
  iframe ni enlace de mapa; **given** el listado, **then** se ve como **tabla** con su cabecera
  de columnas.
- **Given** la app a **375 px**, **when** se abre la vista previa, **then** los tres botones
  tienen objetivo ≥ 44 px, son operables con teclado y **no** hay desbordamiento horizontal de
  la página; la interfaz nueva está **100 % en español**.
- **Given** cualquier regla visual de la hoja (tipografías, tamaños, colores, disposición,
  exclusiones), **then** está escrita **una sola vez** en el CSS y se aplica igual en la vista
  previa y en el papel (RF-1510).
- `node --test`: los **122** tests existentes siguen en verde; el nombre del fichero PDF usa la
  ayuda de fecha **local** existente (`nombreArchivoExportacion`, con su caso de medianoche) y
  solo se añaden los tests de esa función nueva (`listado-2026-10-18.pdf`); consola del
  navegador limpia en web y escritorio.

## 4. Casos límite

- **Cero clientes visibles** (lista vacía, filtro de tipo sin resultados, filtro de provincia
  sin resultados, búsqueda sin coincidencias): por el **botón**, toast «No hay clientes para
  imprimir» y **sin** abrir la vista previa; por **Ctrl+P**, se imprime el estado vacío sin
  aviso (ruta de la 013 intacta). Nunca una hoja en blanco en la vista previa.
- **Confirmación de borrado o edición en curso** al abrir la vista previa: la hoja muestra solo
  los datos (sin «¿Seguro?», sin «Editar»/«Eliminar», sin marcas de edición); al cerrar, la
  confirmación o la edición siguen donde estaban.
- **Texto cortado con «…» en pantalla**: en la hoja de la vista previa (y en el papel) sale
  **completo**.
- **Muchos clientes**: en pantalla la vista previa **se desplaza** (scroll de la página) con la
  hoja a una columna (tarjetas) o en tabla (listado); la **paginación** es solo cosa del papel:
  cortes de página y cabecera de columnas repetida aplican **únicamente** al imprimir o al PDF.
- **Móvil (375 px)**: la vista previa y su barra se usan sin desbordamiento horizontal; las
  celdas del listado envuelven su texto (mismo criterio que el papel: el ancho lo decide el
  contenedor, no la pantalla).
- **App de escritorio (.exe)**: el cuadro de impresión de Windows **seguirá mostrando su
  mensaje** «Esta aplicación no admite la vista previa de impresión» (limitación de
  Windows/Electron, **sin bandera que la active**; **aceptado por el usuario** 2026-10-18,
  Decisión 10); la vista previa **dentro de la app** es la
  que sustituye a esa carencia y el usuario **ya ha revisado la hoja** antes de llegar al cuadro.
- **Cancelar el diálogo de impresión**: se permanece en la vista previa, sin cambios ni avisos.
  **Escape dentro del diálogo nativo** (atajo de «Cancelar» del cuadro) hace lo mismo: cierra
  el cuadro y la vista previa **sigue abierta**; en ningún caso Escape cierra la vista previa
  mientras el cuadro nativo tenga el foco.
- **Ctrl+P con la vista previa abierta**: se imprime la hoja (una sola lista, la del DOM en
  vivo —RF-1501—, con la cabecera refrescada en `beforeprint`); al cancelar el cuadro, la vista
  previa **permanece abierta** y la app no se rompe.
- **Cancelar el guardado del PDF**: no se escribe nada y **sin** aviso (convención de los
  diálogos nativos); **fallo real** de generación → toast «No se pudo generar el PDF» y vista
  previa abierta.
- **Ctrl+P tras cambiar filtro/búsqueda/provincia sin tocar el botón**: la cabecera se rellena
  fresca en `beforeprint` (RF-1509, comportamiento ya verificado en la 013).
- **Sin conexión a internet**: la vista previa, la impresión y el PDF no dependen de la red (el
  mapa, además, no forma parte de la hoja).
- **Búsqueda o filtro con acentos, mayúsculas o caracteres especiales**: el literal de la
  cabecera se pinta como texto escapado (igual que en 013/012), en pantalla y en el PDF.
- **Impresora no disponible o diálogo del sistema cerrado con error**: la app permanece en la
  vista previa, sin romperse y sin tocar datos.

## 5. Fuera de alcance

- **Activar el panel de vista previa del cuadro de impresión de Windows** en la app .exe:
  imposible con Electron (sin bandera que la habilite); la vista previa de la app lo sustituye.
- **Generar el PDF en la web con librería propia**: prohibido por la regla 1 (cero
  dependencias); en la web se usa el diálogo del navegador, que ya ofrece «Guardar como PDF».
- **Interceptar Ctrl+P** ni redirigirlo a la vista previa (decisión de la 013, intacta).
- **Configuración de página** (márgenes, orientación, tamaño, escala, encabezados y pies del
  navegador/sistema): la que tenga el usuario por defecto.
- **Logotipos, marcas, fecha/hora de impresión, contador de clientes en la cabecera o
  numeración de páginas** propios.
- **Imprimir una sola ficha o un cliente suelto** (se imprime siempre la hoja de la lista
  visible); **exportar a CSV/Excel** u otros formatos; **previsualizar la exportación/importación**
  de JSON.
- Cambios en el **esquema de datos**, en las claves de almacenamiento, en la interfaz de filtros,
  buscador, ficha o listado, o en specs cerradas distintas de los **dos puntos derogados** de la
  013 (ruta del botón RF-1102 y su «Generación de PDF» del fuera de alcance, RF-1506).

## 6. Decisiones

1. **El botón «Imprimir» pasa a abrir la vista previa (sustituye su ruta directa al diálogo de
   la 013); la guardia de cero visibles se conserva igual.** Es lo que pidió el usuario
   literalmente («al pulsar «Imprimir» se abre una pantalla dentro de la propia app») y es el
   único modo de ver la hoja en la .exe, donde Windows no la muestra. *Alternativas descartadas:*
   **mantener el botón directo y añadir otro «Vista previa»** (dos botones para lo mismo, ruido
   en la cabecera y confuso) y **quitar la guardia de cero visibles** (abriría una hoja inútil,
   contra el RF-1102 vigente).
2. **La vista previa enciende en pantalla el MISMO juego único de reglas de la hoja; no existe
   una copia de estilos («copia» = declaración de apariencia repetida).** La hoja (pantalla y
   papel) se define **una sola vez**: cada regla visual va escrita **una sola vez** en el CSS y
   solo se conmuta su medio (papel / pantalla-con-vista-previa) mientras dure la vista previa —
   la condición de medio sí puede existir una vez por medio, porque conmuta, no pinta—, de modo
   que pantalla y papel comparten
   literalmente las mismas reglas: cualquier cambio futuro de la 012/014/015 afecta a las dos a
   la vez y la divergencia es imposible. Las reglas puramente mecánicas del papel (cortes,
   cabecera de columnas repetida, ocultar la barra de la vista previa) quedan **solo** en el
   medio de papel, porque no cambian la apariencia. Además, con el medio de papel como estado
   por defecto, **Ctrl+P sigue imprimiendo la hoja correcta aunque la vista previa nunca se haya
   abierto** (RF-1509), sin depender de ningún evento. *Alternativas descartadas:* **duplicar el
   bloque `@media print` en un bloque para pantalla** (dos listas de selectores que se
   desincronizarán con cada cambio, el riesgo exacto que evitamos); **`window.open` de la misma
   página en modo impresión** (ventanas emergentes bloqueadas, hay que repintar la lista y
   pasarle el estado, doble arranque y doble memoria, peor con `file://`); **iframe oculto que
   imprima su propio documento** (ya descartado en la 013: doble mantenimiento de HTML y más
   frágil); **construir un HTML nuevo de hoja** (ya descartado en la 013: duplicaría el pintado
   de tarjetas/filas y se desincronizaría de las specs).
3. **La vista previa muestra EXACTAMENTE lo que se imprimirá: lo que se ve, con la cabecera de
   contexto literal de la 013/015.** Coherente con «lo que se ve es lo que hay» (012) y con la
   hoja ya validada en la 013: misma vista, mismo orden, mismos campos elegidos, mismo filtro de
   tipo, misma provincia, misma búsqueda y `textoContextoImpresion` de tres piezas. *Descartadas:*
   **un resumen propio de la vista previa** (divergiría de lo impreso, que es justo lo que el
   usuario quiere comprobar) y **mostrar siempre el listado con todos los campos** (ignoraría la
   vista y la selección que el usuario hizo).
4. **Ctrl+P y el menú del navegador siguen sin interceptar (013 intacta): no pasan por la vista
   previa (confirmado por el usuario 2026-10-18: «igual que hoy»).** Es la recomendación de la
   013 y evita comportamientos frágiles con foco e historial. *Alternativa descartada:*
   **forzar la vista previa también en Ctrl+P** (insertando
   un iframe o instrumentando la tecla): no cubre el menú del navegador, es frágil y ya se
   descartó en la 013.
5. **«Guardar como PDF» vive DENTRO de la vista previa y se muestra también en la web
   (decisión del usuario 2026-10-18: el botón existe en web y .exe).** Junto
   a «Imprimir» y «Cerrar» es donde el usuario está mirando la hoja; el mismo texto y sitio en
   las dos apps evita aprender dos interfaces. *Descartadas:* **botón en la cabecera de la
   lista** (habría que abrir la vista previa de todos modos para decidir qué se guarda, y
   abarrotaría la cabecera) y **ocultarlo en la web** (decisión contraria del usuario: la web
   sí puede ofrecerla, vía el diálogo del navegador).
6. **Escritorio: PDF real generado por el proceso principal (`webContents.printToPDF` vía IPC
   nuevo en `escritorio/main.js` + `preload.js`; excepción permitida
   solo en `escritorio/` por la spec 011) + `dialog.showSaveDialog` NATIVO de guardado, con
   nombre por defecto `listado-AAAA-MM-DD.pdf` de fecha local (confirmado por el usuario
   2026-10-18; **solo en la .exe** — en la web el nombre lo propone el navegador, ver Decisión 7 y la respuesta al QA del Contexto—).** Es la única vía sin dependencias para producir un
   PDF en Electron; el diálogo nativo deja al usuario elegir dónde guardarlo (como ya hace
   Windows en cualquier app), y el nombre sigue el patrón de fecha **local** de
   `nombreArchivoExportacion` (`clientes-AAAA-MM-DD.json`), distinto para no confundir la copia
   de datos (JSON) con la hoja impresa (PDF). El nombre lo construye **lógica pura con tests**
   (RF-1512). *Descartados:* **destino fijo sin diálogo** (no podría elegir carpeta; es peor que
   el estándar del sistema), **estirar `nombreArchivoExportacion` cambiándole la extensión**
   (es la función de la copia JSON, con sus tests y su significado) y **impresión en silencio** a
   la impresora por defecto (imprimiría sin elegir impresora ni copias: peligroso).
7. **Web: «Guardar como PDF» abre el diálogo de impresión del navegador —el MISMO `window.print()` que «Imprimir»—, y allí el nombre lo propone el navegador (confirmado por el usuario 2026-10-18 y por su respuesta al QA: el nombre fijo `listado-…pdf` es solo de la .exe).** Es la única vía para
   producir un PDF **sin dependencias** (regla 1): el navegador ya ofrece «Guardar como PDF»
   como destino **y** allí sí aparece su vista previa — el usuario web además no tiene el
   problema de la .exe. *Descartadas:* **librería generadora de PDF** (dependencias prohibidas),
   **ocultar el botón en la web** (pierde la funcionalidad pedida y rompe la simetría) y
   **inventar una descarga «PDF» desde JavaScript** (no existe API nativa de PDF en el
   navegador).
8. **La vista previa es una instantánea —compromiso de comportamiento sobre el MISMO HTML en
   vivo, sin clonar—, el diálogo de impresión no la cierra y la barra no
   viaja a la hoja.** Mientras está abierta, el chrome está oculto e inoperativo, así que no
   puede cambiar nada: no hace falta reactividad. Que «Imprimir» no la cierre permite repetir
   la impresión o guardar el PDF sin reabrirla. *Descartadas:* **vista previa reactiva** (ruido
   de complejidad para un estado donde nada puede cambiar) y **cerrar la vista previa al
   imprimir** (perderías el sitio desde el que repetir o guardar, y «Cancelar» te dejaría en una
   app con la hoja desmontada).
9. **Tests: solo el nombre del fichero es lógica pura nueva (con tests); el resto es
   presentación, con los 122 tests existentes en verde.** Mismo criterio que la 016: la hoja la
   definen las reglas de presentación y el comportamiento de la vista previa se verifica en
   navegador (web y escritorio), no con tests unitarios. *Descartado:* **extraer más lógica a
   `logica.js` para testearla** (no aportaría: duplicaría decisiones de presentación que ya
   verifican navegador y PDF).
10. **En la .exe el cuadro nativo de Windows se abre igualmente al imprimir desde la vista
    previa: el usuario lo aceptó («Sí, me conformo», 2026-10-18).** Electron no puede mostrar
    la vista previa del cuadro de Windows (límite sin bandera) y ese cuadro es además donde se
    eligen impresora y copias; la vista previa «visual» que el usuario pidió es la de la propia
    app, que ya ha visto antes de llegar al cuadro. *Alternativas descartadas:* **no usar el
    diálogo nativo en .exe y generar el PDF directamente al pulsar «Imprimir»** (imprimiría sin
    elegir impresora ni copias, contra lo que el usuario espera del botón «Imprimir») y
    **suprimir o parchear el cuadro de Windows** (imposible desde Electron, ya descartado en el
    diagnóstico).
11. **Al cerrar la vista previa se restaura la posición de scroll de la lista.** Es parte del
    «estado anterior exacto» (RF-1504): abrir la vista previa puede desplazar la página y el
    usuario espera volver a donde estaba; es barato (guardar y reponer un número) y evita la
    sensación de haber perdido el sitio en listas largas. *Alternativa descartada:* **no
    restaurar el scroll** («no aplica»): dejaría al usuario arriba del todo tras cada impresión,
    una molestia real sin compensación alguna.

**Dudas abiertas:** ninguna. El borrador planteó 4 preguntas al usuario, respondidas el
**2026-10-18** y reflejadas en el Contexto, los RF-1505/1506/1507/1509, los criterios de
aceptación, los casos límite y las Decisiones 4, 5, 6, 7 y 10: (1) en la .exe el cuadro
nativo de Windows **se abre igualmente** y el usuario «sí, se conforma» —la vista previa
«visual» es la de la app—; (2) el PDF por defecto se llama **`listado-AAAA-MM-DD.pdf`** con
fecha **local**, **solo en la .exe** (en la web el nombre lo propone el navegador; decisión
del usuario en el QA, 2026-10-18); (3) **Ctrl+P sigue igual que hoy**, sin pasar por la vista
previa (013 intacta); (4) **«Guardar como PDF» existe en web y .exe** —en la web abre el
diálogo del navegador (mismo `window.print()` que «Imprimir»), en la .exe genera el PDF vía
IPC y `dialog.showSaveDialog`—. Tras el **QA de la spec** (2026-10-18) se aplicaron sus
correcciones: derogación expresa del fuera de alcance de la 013 (RF-1506), evidencia manual
por RF (1505/1506/1507/1512), nombre acotado al escritorio, «instantánea» = mismo HTML en
 vivo sin clonar (RF-1501/1503), definición de «copia» (RF-1510/Decisión 2) y typo del
criterio. **Spec lista para la segunda ronda de QA.**
