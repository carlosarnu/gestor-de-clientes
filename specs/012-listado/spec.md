# Spec 012 — Listado compacto de clientes con selector de campos

| Campo | Valor |
|---|---|
| **ID** | `012-listado` |
| **Título** | Conmutador «Tarjetas» ↔ «Listado»: vista compacta con los campos que el usuario elija |
| **Estado** | **Aprobada** |
| **Fecha** | 2026-10-16 |

---

## 1. Contexto y objetivo

La lista muestra hoy cada cliente como una **tarjeta** con todos sus datos (más mapa y botones).
Eso «está muy guay», pero con muchos clientes no se aprecia de un vistazo y, quien no quiere
usar el buscador, tiene que ir tarjeta a tarjeta buscando. El usuario pide *«un botón que
muestre un listado con todos los nombres de clientes, o un listado solo de los nombres de las
empresas, o que pueda elegir nuestro usuario los datos que quiera mostrar, ya sea un solo dato
o varios»*.

**Objetivo:** una vista de **listado compacto**, conmutable con las tarjetas, donde cada
cliente es una fila con **solo los campos que el usuario seleccione** (por defecto, «Empresa»),
respetando **siempre** lo que ya existe: filtro activo, búsqueda, orden (más reciente primero),
contador, estados vacíos contextuales y las acciones de editar/eliminar.

Las tres dudas de UX se resolvieron con el usuario el 2026-10-16: **acciones en la fila**
(igual que en la tarjeta), **texto largo en una línea cortada con «…»** (título emergente) y
**campo «Fecha de alta» elegible** (dd/mm/aaaa, fecha local).

Esta spec queda **diseñada para absorber después** las specs futuras **014 (tipos múltiples de
cliente)** y **015 (campo provincia)**: el selector de campos debe ser fácil de ampliar, con la
lista de campos disponible **en un único sitio** del que penda tanto el selector como las
columnas. Aquí **no** se implementa nada de esas specs.

## 2. Requisitos funcionales (EARS)

- **RF-1001 — Conmutador de vista.** El sistema SHALL mostrar en la zona de lista un
  conmutador **«Tarjetas» ↔ «Listado»**, con **«Tarjetas» como vista por defecto** (el diseño
  actual, intacto; es siempre el punto de partida porque no se guarda la última vista, RF-1006).
  CUANDO el usuario elija
  «Listado», EL SISTEMA SHALL mostrar la misma lista convertida en filas compactas **en ese
  mismo clic** (sin recarga de página ni espera), y CUANDO vuelva a «Tarjetas» SHALL recuperar
  exactamente el aspecto anterior. Cambiar de vista NO SHALL crear, modificar ni borrar
  clientes, ni alterar filtro, búsqueda ni orden.
- **RF-1002 — Selector de campos.** MIENTRAS la vista sea «Listado», EL SISTEMA SHALL mostrar
  un selector de campos como **chips/controles de selección múltiple con estado de casilla**
  (varios a la vez, no exclusivos) con **«Empresa» marcada por defecto**;
  CUANDO el usuario marque o desmarque campos, EL SISTEMA SHALL actualizar las filas en
  seguida, mostrando **uno o varios** campos por cliente. El sistema SHALL ofrecer solo campos
  existentes del **esquema actual** (12 campos), tomados de **un único catálogo** del que penda
  tanto el selector como el orden de las columnas (orden fijo = orden del formulario, con
  «Fecha de alta» al final por ser dato de alta); como campos elegibles SHALL figurar: Empresa,
  CIF, Contacto, Teléfono, Móvil, Correo electrónico, Dirección, Código postal, Tipo, Notas y
  **Fecha de alta** (11); el campo `id` **nunca** SHALL ofrecerse. La «Fecha de alta» SHALL
  mostrarse con **formato dd/mm/aaaa de la fecha local** (nunca el día en UTC/Horario de
  Greenwich vía ISO, que desplazaría el día). Ese catálogo SHALL poder ampliarse sin rediseñar
  el selector (preparado para «Provincia» de la 015 y para el campo «Tipo» con varios valores
  de la 014). SI la selección quedara vacía (desmarcar el último campo), ENTONCES EL SISTEMA
  SHALL volver automáticamente a «solo Empresa», sin mostrar ningún error.
- **RF-1003 — Coherencia con las tarjetas.** CUANDO la vista sea «Listado», EL SISTEMA SHALL
  mostrar exactamente los **mismos clientes visibles** que «Tarjetas» para el mismo estado
  (filtro activo + texto de búsqueda), en el **mismo orden** (más reciente primero) y con el
  **mismo contador**; el mismo cliente SHALL ocupar la misma posición relativa en ambas vistas.
  Cada fila SHALL ofrecer las **mismas acciones que la tarjeta** («Editar» y «Eliminar») con la
  misma mecánica que hoy usa la tarjeta: al pulsar «Eliminar», la confirmación **en línea**
  «¿Seguro? · Sí, eliminar / No» (nunca `confirm()` nativo) **ocupa la celda de acciones**
  (sustituye a los botones «Editar»/«Eliminar», como hoy el pie de la tarjeta sustituye a sus
  botones) mientras **el resto de la fila permanece visible e intacto** (todas las celdas de
  datos siguen ahí); el cliente en edición SHALL quedar **marcado en toda la fila** (la marca de
  edición cubre la fila entera, con su canto y su resaltado, como hoy la marca `editando` rodea
  la tarjeta completa), no solo en la celda de acciones.
  Los estados vacíos SHALL ser idénticos a los actuales: «Aún no hay clientes…», «No hay
  coincidencias para «X»…», «No hay clientes de tipo …» y el aviso de migración de la spec 011
  en escritorio. Cambiar de vista o de selección NO SHALL alterar filtro, búsqueda, datos ni el
  estado de edición/confirmación en curso; los cambios de pestaña o de buscador SHALL repintar
  el listado igual que repintan las tarjetas.
- **RF-1004 — Responsive, accesibilidad y solo texto.** El listado SHALL verse a 375 px **sin
  desbordes ni scroll horizontal** (en pantalla estrecha, etiqueta y valor apilados dentro de
  cada fila). Las celdas de **texto largo** (Empresa, Dirección, Notas…) SHALL mostrarse en
  **una sola línea cortada con «…»**, con el texto completo como **título emergente**
  (`title`); la fila NO SHALL crecer con el texto ni haberá expandir. El conmutador, el
  selector y las acciones de fila SHALL tener objetivo táctil ≥ 44 px, ser operables con teclado
  (alcanzables con Tabulador y activables con Intro o Espacio, con foco visible) e indicar su
  estado activo de forma accesible (texto/estado visible, no solo color). Cada fila SHALL llevar
  el **canto de color por tipo** con el mismo criterio que las tarjetas (`claseTipo`), para
  conservar el escaneo visual (ver Decisión 7). Las celdas SHALL seguir las **convenciones
  visibles de la app**: empresa vacía → **«Sin nombre»**, tipo vacío → **«Sin tipo»** (los
  mismos textos que hoy muestran las tarjetas), tipo libre (spec 008) → **su texto** y el resto
  de celdas vacías → **«—»**; ninguna celda SHALL quedarse en blanco. Toda la interfaz del
  listado SHALL estar en español. El listado SHALL mostrar **solo texto** de los
  campos elegidos: **sin mapa, sin iframe ni enlaces externos** (el mapa de la spec 004 sigue
  siendo exclusivo de las tarjetas).
- **RF-1005 — Cierre.** La lógica reusable del listado (catálogo de campos, selección válida,
  normalización de la selección, construcción de la **estructura de datos de las filas —etiqueta
  y valor por celda—, no HTML** y formato de fecha local dd/mm/aaaa) SHALL vivir en lógica pura
  con sus tests en `node --test` en verde **sin necesidad de DOM**; `MEMORY.md` se actualizará al
  cierre.
- **RF-1006 — La interfaz NO se persiste (decisión del usuario, 2026-10-16).** NI la vista NI la
  selección de campos SHALL persistirse: el sistema SHALL arrancar **siempre en «Tarjetas» con
  solo «Empresa» marcada**, y CUANDO el usuario cambie de vista o de campos y recargue la
  página (o cierre y vuelva a abrir la app), EL SISTEMA SHALL volver a ese inicio, sin avisos
  ni errores. El sistema NO SHALL crear ninguna clave nueva de `localStorage` (ni en la web ni
  en la app de escritorio): `gestorClientes` (web) y `Documentos\Gestor de Clientes\clientes.json`
  (escritorio) SHALL quedar intactos al cambiar de vista o de campos. MIENTRAS dure la sesión,
  el cambio de vista o de campos SHALL mantenerse hasta que se recargue.

## 3. Criterios de aceptación

- **Given** la lista en tarjetas con filtro «Espuma» y búsqueda «vega», **when** se pulsa
  «Listado», **then** aparecen las filas de exactamente esos mismos clientes, en el mismo orden
  y con el mismo contador; **when** se vuelve a «Tarjetas», **then** filtro, búsqueda y
  tarjetas quedan como estaban.
- **Given** una sesión en la que se usó «Listado» con Empresa + Correo, **when** se recarga la
  página (o se cierra y se vuelve a abrir la app), **then** se arranca en «Tarjetas» con
  **solo «Empresa»** marcada y sin ningún error en consola.
- **Given** en listado con Empresa + Teléfono, **when** se desmarca Teléfono, **then** la fila
  solo muestra Empresa; **when** se desmarca también el último campo, **then** vuelve a
  marcarse «Empresa» automáticamente y sin ningún mensaje de error.
- **Given** en listado, **when** se pulsa «Editar» en una fila, **then** el formulario se carga
  con ese cliente y **la marca de edición cubre toda la fila** (no solo la celda de acciones),
  del mismo modo que hoy la marca `editando` rodea la tarjeta entera; **when** se pulsa
  «Eliminar», **then** la **celda de acciones** sustituye «Editar»/«Eliminar» por «¿Seguro? ·
  Sí, eliminar / No» (sin `confirm()`) **mientras el resto de la fila —todas sus celdas de
  datos— permanece visible e intacta**, y, tras confirmar, la fila desaparece con el aviso
  «Cliente eliminado».
- **Given** una fila con Notas o Dirección largas, **when** se mira, **then** la fila no crece:
  una sola línea con «…» y el texto completo en el título emergente; a 375 px la fila **no**
  desborda.
- **Given** una fila de un cliente sin empresa, sin tipo y sin teléfono, **when** se mira,
  **then** la celda Empresa muestra «Sin nombre», la de Tipo «Sin tipo» y la de Teléfono «—»
  (ninguna celda en blanco); **when** el cliente tiene un tipo libre (spec 008, p. ej.
  «Toldos»), **then** la celda de Tipo muestra ese texto.
- **Given** «Fecha de alta» marcada, **when** se mira una celda, **then** muestra dd/mm/aaaa de
  la fecha **local** (p. ej. un alta de las 00:30 del día 1 aparece como ese mismo día, no como
  el día siguiente ni el anterior); `id` no aparece en el selector.
- **Given** el listado, **when** se recorre con el teclado (Tabulador), **then** se alcanzan el
  conmutador, los chips del selector y las acciones de fila con foco visible, y **when** se
  activan con Intro o Espacio, **then** producen el mismo efecto que con el ratón (cambiar de
  vista, marcar/desmarcar campo, editar, eliminar); el estado activo se distingue también sin
  depender solo del color.
- **Given** lista vacía, búsqueda sin coincidencias o filtro sin resultados, **when** se está
  en listado, **then** aparecen exactamente los mismos mensajes que en tarjetas (y el mismo
  contador).
- **Given** la app a 375 px con los 11 campos marcados, **when** se mira el listado, **then** no
  hay desbordes ni scroll horizontal, cada fila apila etiqueta y valor, y los objetivos táctiles
  son ≥ 44 px.
- **Given** el listado activo, **when** se inspecciona, **then** no contiene iframes ni enlaces
  de mapa; al cambiar de vista o de selección, **then** ni `gestorClientes` ni `clientes.json`
  cambian de contenido **y no aparece ninguna clave nueva en `localStorage`** (solo existe la de
  siempre, `gestorClientes`, en la web).
- `node --test` en verde con los tests nuevos (catálogo de campos, selección válida, estructura
  de datos de las filas etiqueta/valor y fecha local dd/mm/aaaa), **sin DOM**; consola del
  navegador limpia; interfaz en español.

## 4. Casos límite

- Cliente al que le faltan datos en **todos** los campos elegidos: la fila sigue visible e
  identificable con las convenciones de siempre (empresa vacía = «Sin nombre», tipo vacío =
  «Sin tipo» y tipo libre = su texto, igual que hoy en la tarjeta; resto de celdas vacías =
  «—»); nunca una fila muda ni una celda en blanco.
- **Texto que no cabe**: se corta con «…» en la celda; el título emergente no siempre es
  visible en táctil, así que el texto completo sigue disponible en la tarjeta y en el
  formulario al editar.
- **Edición o «¿Seguro?» en curso al cambiar de vista**: el estado se conserva y se muestra en
  la vista destino (la fila queda marcada o con su confirmación, igual que la tarjeta).
- **«Fecha de alta» con fecha ausente o inválida**: la celda muestra «—» sin romper el listado
  (los clientes de siempre tienen fecha; la importación de la 011 ya normaliza).
- **Recarga o reapertura con la vista cambiada**: se vuelve al inicio («Tarjetas», «solo
  Empresa»); no existe ninguna clave de preferencias que pueda faltar, estar corrupta o contener
  campos obsoletos, porque no se guarda nada de interfaz.
- Importar (spec 011): mantiene la vista y la selección de campos **de la sesión en curso**; solo
  se resetea lo de siempre (pestaña «Todos» y buscador vacío).
- Alta o borrado desde el formulario estando en listado: la fila aparece/desaparece con el
  mismo orden, contador y avisos de siempre.
- 11 campos marcados en 375 px: filas apiladas, sin scroll horizontal.

## 5. Fuera de alcance

- Impresión o exportación del listado (spec **013**).
- Tipos múltiples de cliente (spec **014**): aquí «Tipo» muestra un solo valor, el de siempre.
- Campo «Provincia» (spec **015**).
- Cambios en el **esquema de datos de clientes** ni en la clave `gestorClientes` (los mismos 12
  campos; además, la 012 no escribe nada: ni datos ni claves nuevas de `localStorage`, RF-1006).
- Mapa, iframe o enlaces en el listado (solo texto).
- Resaltado de coincidencias del buscador, paginación, elegir el orden de las columnas o el
  orden de la lista (sigue siendo «más reciente primero»), edición inline sin pasar por el
  formulario, expandir texto en la fila y **persistir la vista o la selección de campos entre
  sesiones** (descartado por el usuario, RF-1006).

## 6. Decisiones

1. **La interfaz NO se persiste** (decisión del usuario, 2026-10-16): ni la vista ni la selección
   de campos se recuerdan; **cada arranque comienza en «Tarjetas» con solo «Empresa» marcada**
   y **no se crea ninguna clave nueva de `localStorage`** (ni en web ni en escritorio). Si el
   usuario cambia de vista y recarga, vuelve al inicio. *Alternativa descartada:* **recordar
   la vista y los campos entre sesiones** — descartada a petición del usuario. Con ello la 012
   tampoco toca datos: `gestorClientes` y `clientes.json` quedan intactos, y no hace falta
   reinterpretar el RF-902 de la 011 (nota sin efectos: ese RF habla de la fuente de datos de
   escritorio y aquí simplemente no se escribe nada nuevo). *También descartada:* guardar la
   preferencia dentro de `clientes.json` (mezclaría interfaz con los datos sagrados).
2. **Vista por defecto «Tarjetas»** y selector de campos **visible solo en modo listado** (la
   selección se conserva al volver a tarjetas **dentro de la misma sesión**; al recargar se
   vuelve al inicio, RF-1006). *Descartada:* mantener el selector siempre
   visible (ruido innecesario en la vista de tarjetas, que es la habitual).
3. **Selección vacía → vuelve a «solo Empresa»** automáticamente. *Descartada:* mostrar un
   mensaje de error (dejaría la lista sin columnas y añade un texto más que recordar).
4. **Catálogo único de campos** del que penda tanto el selector como el orden de las columnas:
   **orden fijo = orden del formulario, con la excepción «Fecha de alta al final»** (es un dato
   de alta, no del formulario). *Descartada:* lista de campos escrita a mano en varios
   sitios (con la 015 y la 014 habría que tocarla en cada uno; la 012 queda diseñada para
   absorberlas ampliando un solo sitio) y ordenar por otro criterio (rompería la correspondencia
   con el formulario que el usuario ya conoce).
5. **Diseño responsive:** tabla con cabecera de columnas en pantalla ancha y filas
   etiqueta+valor apiladas en pantalla estrecha. *Descartada:* scroll horizontal (a 375 px
   rompe los objetivos táctiles y escale mal con muchos campos).
6. **Celdas siempre con valor:** empresa vacía = **«Sin nombre»**, tipo vacío = **«Sin tipo»**,
   tipo libre = **su texto** (los mismos textos visibles de siempre en la app) y **el resto de
   celdas vacías = «—»**. *Razón real:* **no** es la misma regla que las tarjetas (la tarjeta
   **omite** la fila de un campo vacío porque su ficha se lee sola), pero en el listado la celda
   es una posición fija de una columna: si se queda en blanco, **se desalinea** con las demás
   filas y se pierde la lectura por columna. *Descartadas:* dejarla en blanco (desalinea) y
   ocultar la celda (rompe el orden de columnas).
7. **Canto de color por fila** con el mismo criterio de tipo que las tarjetas (`claseTipo`),
   para conservar el escaneo visual de la pestaña activa — **requisito verificable en el
   RF-1004**. *Descartada:* filas sin color (se
   pierde la lectura rápida por tipo).
8. **El listado es presentación pura:** cambiar de vista o de campos nunca escribe datos ni
   crea claves nuevas (verificable: ni `gestorClientes` ni `clientes.json` cambian y en
   `localStorage` solo sigue existiendo `gestorClientes`).
9. **Acciones en la fila idénticas a la tarjeta** («Editar» y «Eliminar» con «¿Seguro?» en
   línea, nunca `confirm()` nativo, y cliente en edición marcado) — opción (a) elegida por el
   usuario. *Descartada:* listado solo de consulta (obligaría a saltar a «Tarjetas» para cada
   edición) y solo «Editar» (dejaría el borrado a medias).
10. **Texto largo en una sola línea con «…» + título emergente** (`title`) en Notas, Dirección,
    Empresa y el resto de celdas de texto — opción (a) elegida por el usuario. *Descartadas:*
    la fila que crece con el texto (rompe la densidad del listado) y el expandir al pulsar
    (gesto extra en móvil).
11. **«Fecha de alta» sí es elegible**, con formato **dd/mm/aaaa de fecha local** (siguiendo la
    skill `local-dates`: usar los métodos locales del `Date`, nunca `toISOString` para el día;
    el formateador **debe reutilizar `dosDigitos()` de `logica.js`**, que ya rellena a dos
    dígitos para el nombre del fichero de exportación — anotación para la plantilla del plan,
    no reimplementar el relleno de ceros)
    y colocada **al final** del catálogo por ser un dato de alta, no del formulario; `id`
    nunca se ofrece. *Descartadas:* mostrar `id` (ruido técnico sin valor comercial) y la fecha
    en ISO/UTC (ilegible y con riesgo de día desplazado).
