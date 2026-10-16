# Spec 013 — Impresión del listado de clientes

| Campo | Valor |
|---|---|
| **ID** | `013-imprimir` |
| **Título** | Botón «Imprimir»: hoja de papel con lo que se ve en la lista (vista actual, filtrada y buscada) |
| **Estado** | **Aprobada** |
| **Fecha** | 2026-10-16 |

---

## 1. Contexto y objetivo

El usuario pide, con sus palabras, *«Vamos a añadir un botón para que pueda imprimir el
listado de los clientes»*. Hoy la lista vive solo en pantalla: se puede exportar a JSON
(spec 011) para copia de seguridad, pero no hay manera de llevarse el listado en papel a
una visita (revisar clientes de un tipo, enseñar datos de contacto, archivar una
selección del buscador…).

La spec 012 dejó la impresión **expresamente fuera de alcance** y apuntó a esta spec 013.

**Objetivo:** un botón **«Imprimir»** en la zona de lista que imprima **lo que el usuario
está viendo en ese momento**: la vista activa (tarjetas o listado), con el filtro de tipo
y la búsqueda que tenga puestos, y —en listado— solo los campos elegidos. La hoja impresa
debe ser **limpia y con contexto**: solo los datos de los clientes, con una cabecera que
diga de qué se trata (filtro y búsqueda), **sin** los controles interactivos de la
aplicación (formulario, pestañas, buscador, botones, mapa…).

## 2. Requisitos funcionales (EARS)

- **RF-1101 — Botón «Imprimir».** EL SISTEMA SHALL mostrar un botón **«Imprimir»** en la
  cabecera de la zona de lista, **junto al conmutador de vista**, **visible en las dos
  vistas** («Tarjetas» y «Listado»). El botón SHALL ser operable con teclado (alcanzable
  con Tabulador y activable con Intro o Espacio, con foco visible), con objetivo táctil
  ≥ 44 px y con texto en español. Pulsarlo NO SHALL crear, modificar ni borrar clientes,
  ni alterar filtro, búsqueda, vista ni selección de campos.
- **RF-1102 — Ruta del botón y ruta del navegador (Ctrl+P).** CUANDO el usuario pulse
  «Imprimir» **y la lista muestre al menos un cliente visible** (tras filtro de tipo y
  búsqueda), EL SISTEMA SHALL abrir el **diálogo de impresión del navegador** (nunca una
  ventana nueva ni un PDF pregenerado). CUANDO pulse «Imprimir» y **no haya ningún
  cliente visible** (lista vacía, filtro sin resultados o búsqueda sin coincidencias),
  EL SISTEMA SHALL mostrar el aviso breve habitual (toast) con el texto
  **«No hay clientes para imprimir»** y **NO** SHALL abrir el diálogo de impresión: este
  guardia aplica **solo al botón**. EL SISTEMA SHALL tolerar además la **ruta nativa del
  navegador** (Ctrl+P o el menú «Imprimir…»), que no pasa por el botón ni por el
  guardia: con cero clientes visibles esa ruta SHALL imprimir la lista en su **estado
  vacío** (el mensaje de estado que corresponda en pantalla), **sin** aviso previo. El
  sistema SHALL usar exclusivamente el diálogo nativo del navegador: **`window.print()`
  está permitido** (la prohibición constitucional es `confirm()`/`alert()`, que aquí no
  se usan).
- **RF-1103 — Se imprime lo que se ve, sin chrome de la aplicación.** CUANDO se abra el
  diálogo de impresión (**por el botón o por Ctrl+P/menú del navegador**), EL SISTEMA
  SHALL imprimir **exactamente los clientes visibles en ese momento**: la **vista
  activa** (tarjetas o filas del listado), el **mismo orden** (más reciente primero), y
  en listado **solo los campos elegidos** (las mismas columnas de la selección de la
  012), con las mismas convenciones de siempre («Sin nombre», «Sin tipo», «—», tipo
  libre). La hoja impresa **NO** SHALL contener ningún elemento interactivo ni decorativo
  de pantalla: formulario de alta/edición, pestañas de filtro, buscador, conmutador de
  vista, chips del selector de campos, el **título «Campos del listado»**, el
  **contador «N clientes»**, los botones Exportar/Importar/Imprimir, **toda la columna
  «Acciones» del listado (su cabecera y su celda)**, las acciones de las tarjetas
  («Editar»/«Eliminar» y los «¿Seguro? · Sí, eliminar / No»), las marcas visuales de
  edición, el panel de confirmación de importación, el toast, la cabecera decorativa de
  la página **ni el mapa** (ni el iframe ni el enlace «Ver en Google Maps»: **los
  iframes y los enlaces de mapa NO se imprimen**). La hoja SHALL llevar una **cabecera
  de contexto visible solo al imprimir** con el título **«Gestor de Clientes»** y, cuando
  corresponda, el **filtro activo** (si no es «Todos») y la **búsqueda** (si hay texto);
  si filtro es «Todos» y no hay búsqueda, la cabecera SHALL ser solo «Gestor de
  Clientes»; esa cabecera SHALL reflejar **siempre el filtro y la búsqueda vigentes en
  el momento de imprimir**, también cuando se llegue por Ctrl+P/menú (el texto se
  refresca **en el propio momento de imprimir**, no solo al pulsar el botón). En papel,
  **el listado SHALL imprimirse SIEMPRE como tabla con su cabecera de columnas
  visible**: los estilos de impresión SHALL anular la variante apilada de móvil, porque
  **el ancho de lo impreso lo decide el papel, no la pantalla**. CUANDO la lista ocupe
  varias páginas, las **tarjetas SHALL imprimirse en una sola columna y NO SHALL
  cortarse entre páginas**, y la **cabecera de columnas de la tabla del listado SHALL
  repetirse** en cada página. La impresión NO SHALL escribir datos ni claves
  (`gestorClientes` y `clientes.json` quedan intactos; no se crea ninguna clave nueva).
- **RF-1104 — Cierre: texto de contexto en lógica pura.** El texto de la cabecera de
  contexto (título + filtro + búsqueda, con las piezas vacías omitidas) SHALL construirse
  en **lógica pura**, con los valores recibidos por parámetro, de modo que sea verificable
  con `node --test` **sin DOM** y en verde; el resto de la impresión (ocultar chrome,
  cortes de página) es presentación pura de hoja de estilo. `MEMORY.md` se actualizará al
  cierre.

## 3. Criterios de aceptación

- **Given** la lista con clientes visibles, **when** se pulsa «Imprimir», **then** se abre
  el diálogo de impresión del navegador con la vista actual; **when** no hay clientes
  visibles (lista vacía, filtro sin resultados o búsqueda sin coincidencias), **then**
  aparece el toast «No hay clientes para imprimir» y **no** se abre ningún diálogo.
- **Given** filtro «Tela», búsqueda «vega» y vista «Listado» con Empresa + Teléfono
  marcados, **when** se imprime, **then** la hoja lleva la cabecera con el **formato
  literal exacto** `Gestor de Clientes · Filtro: Tela · Búsqueda: «vega»`, las filas de
  exactamente esos clientes con esas dos columnas (mismo orden de siempre), y **no**
  aparece ningún botón, chip, pestaña, caja de búsqueda, contador ni columna
  «Acciones».
- **Given** vista «Tarjetas» con clientes que tienen dirección (mapa cargado), **when** se
  imprime, **then** en el papel **no** hay ni iframe ni enlace de mapa, pero sí los datos
  de Dirección y Código postal de la ficha.
- **Given** filtro «Todos» y buscador vacío, **when** se imprime, **then** la cabecera es
  solo «Gestor de Clientes» (sin piezas de contexto sobrantes); **given** filtro «Otros»,
  **when** se imprime, **then** la pieza del filtro es «· Filtro: Otros» (la etiqueta de
  la pestaña, nunca «Todos»).
- **Given** filtro y búsqueda puestos, **when** se cambian **sin tocar el botón** y se
  imprime con **Ctrl+P** (ruta del navegador), **then** la cabecera impresa refleja el
  filtro y la búsqueda **vigentes en ese momento**; **given** cero clientes visibles,
  **when** se usa Ctrl+P, **then** se imprime la lista en su estado vacío (el mensaje de
  estado que corresponda) **sin** el toast «No hay clientes para imprimir» y **sin**
  bloquear el diálogo (el guardia es solo del botón).
- **Given** una fila o tarjeta con la confirmación «¿Seguro? · Sí, eliminar / No» abierta,
  **when** se imprime, **then** el cliente sale con sus datos y **sin** los botones de la
  confirmación (ni «Editar»/«Eliminar»); la marca de edición de pantalla tampoco aparece.
- **Given** una celda de texto largo en listado (en pantalla, una línea con «…»),
  **when** se imprime, **then** el valor sale **completo** (el «…» y el título emergente
  no viajan al papel).
- **Given** muchos clientes (varias páginas), **when** se imprimen tarjetas, **then** salen
  en **una sola columna** y ninguna queda partida entre dos páginas; **when** se imprime
  el listado, **then** la cabecera de columnas se repite arriba de cada página.
- **Given** la app abierta en un móvil (375 px) con el listado en la variante apilada,
  **when** se imprime, **then** en papel el listado sale **como tabla con su cabecera de
  columnas visible** (sin etiquetas apiladas ni `::before`), porque el ancho lo decide el
  papel.
- **Given** la app con el botón «Imprimir», **when** se usa con teclado o en 375 px,
  **then** el botón es alcanzable, activable y con objetivo táctil ≥ 44 px.
- `node --test` en verde con los tests nuevos del texto de contexto **anclados al formato
  literal** de la Decisión 6: filtro «Todos» + búsqueda vacía → `Gestor de Clientes`;
  filtro «Tela» + búsqueda vacía → `Gestor de Clientes · Filtro: Tela`; «Todos» +
  búsqueda «vega» → `Gestor de Clientes · Búsqueda: «vega»`; filtro «Tela» + búsqueda
  «vega» → `Gestor de Clientes · Filtro: Tela · Búsqueda: «vega»`; búsqueda con espacios
  sobrantes (p. ej. `"  vega "`) → **recortada** (trim) dentro de los guillemets; filtro
  «Otros» → `Gestor de Clientes · Filtro: Otros` (etiqueta de la pestaña; «Todos» nunca
  se muestra); consola del navegador limpia; al imprimir **ni** `gestorClientes` **ni**
  `clientes.json` cambian y **no** aparece ninguna clave nueva en `localStorage`; interfaz
  en español.

## 4. Casos límite

- **Cero clientes visibles** (lista vacía, filtro sin resultados, búsqueda sin
  coincidencias): **por el botón**, toast «No hay clientes para imprimir» y sin diálogo;
  **por Ctrl+P/menú del navegador** (ruta que no pasa por el botón), se imprime la lista
  en su estado vacío (el mensaje de estado que corresponda) sin aviso previo. Nunca un
  diálogo que muestre una hoja en blanco.
- **Confirmación de borrado o edición en curso al imprimir**: se imprimen solo los datos
  del cliente; los botones de confirmación, las acciones y las marcas de edición de
  pantalla quedan fuera del papel.
- **Texto que en pantalla va cortado con «…»** (celdas del listado): en el papel sale
  completo; la fila puede crecer (el papel admite que la fila crezca, no así la densidad
  en pantalla).
- **Muchos clientes**: varias páginas; en tarjetas, **una sola columna** y sin cortes; en
  listado, cabecera de columnas repetida.
- **Móvil (375 px)**: el botón se ve y funciona; aunque en pantalla el listado esté en la
  variante apilada, **en papel SIEMPRE se imprime como tabla con su `thead` visible**
  (los estilos de impresión anulan el apilado), porque el ancho de lo impreso lo decide
  el papel, no el viewport.
- **App de escritorio (Electron)**: «Imprimir» funciona igual, con el diálogo de
  impresión del sistema.
- **Búsqueda o filtro con acentos, mayúsculas o caracteres especiales**: la cabecera
  imprime el texto tal cual lo escribió el usuario (recortado de espacios sobrantes), se
  pinta como **contenido de texto escapado**; si alguna pieza acabara pintándose dentro
  de un atributo HTML, se usará **`escaparAtributo`** (comillas incluidas, igual que en
  la 012).
- **Sin conexión a internet**: la impresión no depende de la red (el mapa, además, ya no
  se imprime).

## 5. Fuera de alcance

- **Generación de PDF** por la aplicación (si el navegador ofrece «Guardar como PDF» en su
  propio diálogo, el usuario puede usarlo, pero la app no genera ni guarda archivos PDF).
- **Configuración de página** (márgenes, orientación, tamaño, escala, encabezados y pies
  del navegador): se usa la que tenga el navegador/sistema por defecto.
- **Logotipos, marcas, fecha/hora de impresión, contador de clientes en la cabecera o
  numeración de páginas** propios (la paginación es la del navegador).
- **Imprimir una sola ficha o un cliente suelto** (se imprime siempre la lista visible).
- Exportar a CSV/Excel u otros formatos.
- **Tipos múltiples de cliente (spec 014) y campo «Provincia» (spec 015)**: no se
  implementan aquí; la impresión no añade campos nuevos (imprime los que ya existan en la
  vista actual).
- Cambios en la spec 012 (vista, selector de campos, acciones) ni en el esquema de datos
  o las claves de almacenamiento.

## 6. Decisiones

1. **Botón «Imprimir» en la cabecera de la lista, junto al conmutador, visible en las dos
   vistas.** Es donde ya están los controles de la lista (conmutador, contador) y sirve
   igual en tarjetas que en listado. *Descartados:* meterlo junto a Exportar/Importar
   (son copia de seguridad en fichero; imprimir es otra cosa) y un botón flotante (ruido
   visual y peor en móvil).
2. **Diálogo de impresión nativo con `window.print()`.** Es la vía portátil que funciona
   con doble clic (`file://`), en cualquier navegador y también en Electron, sin
   dependencias. *Descartados:* generar el PDF nosotros mismos (librerías → rompe la
   constitución) y cargar un documento propio en un iframe oculto para imprimirlo (doble
   mantenimiento del HTML y más frágil).
3. **Se imprime lo que se ve: vista actual + filtro + búsqueda + campos elegidos.**
   Coherente con el lema de la 012 («lo que se ve es lo que hay») y con el pedido del
   usuario (imprimir «el listado» tal como lo tiene). *Descartados:* imprimir siempre
   tarjetas (desaprovecharía el listado compacto, pensado para papel) e imprimir siempre
   el listado completo con todos los campos (imprimiría datos que el usuario quiso
   ocultar).
4. **Sin clientes visibles → aviso «No hay clientes para imprimir», sin abrir el
   diálogo — pero SOLO en la ruta del botón.** Evita imprimir una hoja en blanco o con
   el mensaje vacío de pantalla. La ruta nativa del navegador (Ctrl+P/menú «Imprimir…»)
   no se intercepta: con cero visibles imprime la lista en su estado vacío. *Descartados:*
   abrir el diálogo igual desde el botón (hoja inútil en papel), imprimir el mensaje
   vacío de la pantalla y **bloquear/instrumentar Ctrl+P** (insertando un iframe de
   impresión con `contentWindow.print()`: frágil, no cubre el menú del navegador y
   complica el comportamiento con el foco y el historial).
5. **La hoja impresa se define con presentación (estilos de impresión) sobre el mismo
   HTML que ya se ve**, ocultando el chrome y añadiendo la cabecera de contexto (que solo
   existe al imprimir). *Descartado:* construir un HTML nuevo de impresión al pulsar el
   botón (duplicaría el pintado de tarjetas/filas y se desincronizaría con las specs 008,
   012, 014…).
6. **Cabecera de contexto = «Gestor de Clientes» + «· Filtro: X» (si el filtro no es
   «Todos») + «· Búsqueda: «texto»» (si hay búsqueda)**, con las piezas unidas por « · »,
   las piezas vacías omitidas (filtro «Todos» y búsqueda vacía → solo el título), la
   **búsqueda recortada** (trim) y la etiqueta del filtro **igual a la de la pestaña**
   («Todos» nunca se muestra; «Otros» se muestra literalmente como «Otros»). Ejemplo
   completo del formato literal: `Gestor de Clientes · Filtro: Tela · Búsqueda: «vega»`.
   El texto lo produce **lógica pura** con filtro y búsqueda por parámetro (anotación para
   la plantilla del plan: función `textoContextoImpresion(filtro, busqueda)` en
   `logica.js`, con sus tests). El **contador «N clientes», el título «Campos del
   listado» y la columna «Acciones» (cabecera y celda) tampoco se imprimen**: son chrome
   de pantalla y el contador, además, sería dato redundante con la propia cabecera de
   contexto (coherente con lo descartado aquí mismo). *Descartadas:* cabecera fija solo
   con el título (un papel archivado pierde el contexto del filtro/búsqueda que lo
   originó) y añadir fecha de impresión o contador de clientes (información que ya da el
   navegador en sus propios encabezados/pies y que ensancha el alcance).
7. **El mapa no se imprime: ni el iframe ni el enlace «Ver en Google Maps».** En papel el
   mapa no aporta (no es navegable) y los iframes no se imprimen de forma fiable; los
   datos de Dirección y Código postal ya están en la ficha. *Descartado:* intentar
   imprimir el mapa (hojas con imágenes rotas o en blanco).
8. **En impresión, el texto de las celdas del listado sale completo (sin «…»).** El
   corte con «…» y el título emergente son recursos de pantalla (el `title` no se imprime):
   en papel, cortar texto dejaría la información a medias. *Descartado:* imprimir el «…»
   (dato incompleto y confuso en un documento en papel).
9. **Tarjetas en papel a una sola columna y sin cortarse entre páginas; cabecera de
   columnas de la tabla del listado repetida en cada página.** Una tarjeta partida por
   la mitad o repartida en varias columnas estrechas es ilegible, y la tabla sin cabecera
   obliga a adivinar columnas. *Descartados:* dejar el corte al azar del navegador (rompe
   la lectura), paginar a mano con solapes (complejidad innecesaria; el navegador ya
   pagina) y varias columnas de tarjetas en papel (más densidad, pero celdas estrechas
   que cortarían datos justo donde el papel sí puede crecer).
10. **La cabecera decorativa de la página (con la cinta retro) y el título «Clientes» del
    panel no se imprimen: la cabecera impresa ya lleva «Gestor de Clientes» + contexto.**
    *Descartado:* mantener ambos títulos (duplicado redundante en papel).
11. **La impresión es presentación pura: nunca escribe datos ni claves.** `window.print()`
    solo abre el diálogo; ni `gestorClientes` ni `clientes.json` cambian y no se crea
    ninguna clave nueva (mismo criterio de no-persistencia que la spec 012, RF-1006).
12. **La cabecera de contexto se refresca SIEMPRE en el momento de imprimir** (en el
    evento `beforeprint`, que el navegador dispara tanto con `window.print()` del botón
    como con Ctrl+P/menú), de modo que el papel refleje el filtro y la búsqueda
    vigentes aunque el usuario no haya tocado el botón. *Descartados:* rellenar el texto
    solo en el clic del botón (Ctrl+P dejaría la cabecera desfasada o vacía) y mantener
    la cabecera siempre sincronizada en cada repintado de lista (trabajo inútil en
    pantalla, donde nunca se ve: solo se necesita fresca al imprimir).
