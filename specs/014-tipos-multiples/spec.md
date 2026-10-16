# Spec 014 — Tipos de cliente múltiples (varios tipos por cliente, sin límite)

| Campo | Valor |
|---|---|
| **ID** | `014-tipos-multiples` |
| **Título** | Un cliente puede tener varios tipos a la vez (chips de selección múltiple + tipos propios sin límite), con migración sin pérdida |
| **Estado** | **Implementada** (pedido directo del usuario; aprobación anticipada del 2026-10-16; correcciones del QA de fase aplicadas el 2026-10-17; cierre 2026-10-17 con 105 tests) |
| **Fecha** | 2026-10-16 |

---

## 1. Contexto y objetivo

El usuario pide arreglar una limitación real, con sus palabras: *«Hay clientes que son de
varios tipos. Hay clientes que pueden ser de tela + espuma, o espuma + estructuras, o tela
+ estructura, o todas las combinaciones posibles. Esto hay que arreglarlo porque solo
podemos elegir una variante de tipo de cliente. Quiero que se pueda añadir los tipos de
cliente que sea, sin límite de variedad, por si elige la opción "otro" y pone que es de
varias cosas distintas.»*

Hoy el campo `tipo` es **un único valor**: uno de los tres fijos (Tela, Espuma,
Estructuras), un texto libre de la opción «Otros» (spec 008) o vacío («Sin tipo», spec
007). Un cliente que trabaja tela **y** espuma no tiene dónde reflejarlo: al guardar, el
segundo tipo pisa al primero.

**Objetivo:** que un cliente admita **cuantos tipos quiera** (fijos y propios, sin límite
de cantidad), elegidos desde el mismo formulario con un patrón de **chips de selección
múltiple** (ya conocido por la spec 012), manteniendo **intactos** el filtro, la búsqueda,
la ficha, el listado, la impresión y la exportación/importación — y **migrando los datos
existentes sin la menor pérdida** (regla 3 de la constitución: el padre ya usa la app con
datos reales).

**Usuarios:** el comercial (usuario directo) que da de alta y edita clientes; el padre del
usuario, con **datos reales ya guardados** en la web y, en su futuro, en
`Documentos\Gestor de Clientes\clientes.json` de la app de escritorio; y los **lectores
antiguos** de los datos: cualquier versión previa de la app (web o escritorio) que abra el
mismo JSON/array después de esta spec.

**Historias de usuario:**

- **HU-1.** Como comercial, quiero marcar varios tipos en un cliente (p. ej. Tela y
  Espuma) para que su ficha refleje de verdad lo que fabrica.
- **HU-2.** Como comercial, quiero escribir tipos propios **sin límite de cantidad**
  («Toldos», «Cortinas», «Estructuras metálicas»…) para etiquetar a mis clientes como yo
  trabajo.
- **HU-3.** Como comercial, quiero que al filtrar por «Tela» aparezcan también los
  clientes «Tela + Espuma», para no perder de vista a nadie.
- **HU-4.** Como usuario con datos reales, quiero que la app convierta sola mis clientes
  antiguos al nuevo formato **al abrirla**, sin que desaparezca ni cambie de significado
  ninguno.
- **HU-5.** Como usuario que hace copias de seguridad, quiero que el JSON exportado
  importe igual de bien en esta versión y que un fichero antiguo (solo con `tipo`) se
  importe migrándolo.

## 2. Requisitos funcionales (EARS)

- **RF-1201 — Esquema: `tipos` canónico y `tipo` de compatibilidad (solo lectura).** EL
  SISTEMA SHALL considerar **`tipos` (array de textos) el campo canónico** del tipo de
  cliente, y SHALL escribir **siempre además** `tipo` = **primer elemento de `tipos`**
  (cadena vacía si no hay tipos). Un lector antiguo que solo conozca `tipo` SHALL ver el
  **primer tipo** del cliente (el más antiguo en orden de adición) al **leer**: la
  visibilidad del primer tipo en `tipo` es válida **solo para lectura** (ver casos límite:
  una versión antigua que **edite** no preserva `tipos`, y la migración la reconstruye
  desde `tipo`). Ambos campos SHALL convivir en el esquema junto a los 12 campos actuales
  (`id`, `fecha`, `empresa`, `cif`, `contacto`, `telefono`, `movil`, `email`, `direccion`,
  `codigoPostal`, `tipo`, `notas`); **ningún campo existente SHALL eliminarse ni
  renombrarse** y la clave `gestorClientes` y el formato de array del fichero de
  escritorio SHALL permanecer intactos.
- **RF-1202 — Migración idempotente y sin pérdida.** CUANDO la app cargue los datos (en
  la web o en la app de escritorio) o reciba una importación, EL SISTEMA SHALL migrar
  cada cliente con esta **prioridad**:

  1. SI `tipos` **no es un array** (dato corrupto o manipulado), ENTONCES se tratará como
     **ausente** y se usará `tipo`.
  2. El antiguo «FOAM» → «Espuma» (spec 009, sin perder su significado) SHALL aplicarse
     dentro de **cada elemento de `tipos`** y dentro de `tipo` **cuando `tipo` vaya a
     usarse** (paso 3).
  3. SI `tipos` está ausente o es un array **vacío** (o que queda vacío tras normalizar:
     todos sus elementos eran espacios o vacíos) Y `tipo` no está vacío, ENTONCES
     `tipos` SHALL **reconstruirse** desde `tipo` (ya migrado FOAM → «Espuma»): es la
     opción **más protectora del dato** (regla 3, Decisión 12). Un texto libre «Otros»
     guardado por la 008 migra así a chip libre «Otros», con el mismo comportamiento
     visible de siempre (violeta, pestaña «Otros»).
  4. SI `tipos` tiene **elementos** (que sobrevivan a la normalización), ENTONCES `tipo`
     se SHALL **ignorar por completo** (incluido un «FOAM» residual) y los elementos se
     SHALL normalizar: convertir a texto, recortar espacios, quitar vacíos y duplicados
     exactos, **sin truncar** y **conservando el orden**.
  5. Después, `tipo` se SHALL reescribir = `tipos[0] ?? ""`.

  SI tras migrar nada cambia, ENTONCES el sistema SHALL devolver la lista tal cual,
  **sin escritura alguna**; y si la escritura de la migración fallara, ENTONCES la lista
  cargada SHALL conservarse completa (mismo criterio de tolerancia que la spec 010). La
  migración SHALL ser **idempotente**: aplicarla dos o más veces deja exactamente el
  mismo resultado. **Ningún cliente se pierde, se duplica ni cambia de significado** (un
  cliente con `tipo: "Tela"` sigue siendo de Tela: ahora con `tipos: ["Tela"]`).
- **RF-1203 — Formulario con chips de selección múltiple.** EL SISTEMA SHALL sustituir el
  desplegable «Tipo de cliente» por un conjunto de **chips**: los **tres fijos** (Tela,
  Espuma, Estructuras — **tipo fijo**: coincidencia exacta **tras recortar espacios**, con
  su color propio de la paleta de materiales, spec 003) como chips que se **alternan**
  (marcado = seleccionado) y un campo de texto **«Añadir otro tipo»** con su botón, que
  SHALL añadir el texto como **chip libre** (**tipo libre**: cualquier otro texto escrito
  por el usuario, spec 008; comparte el color violeta «otros» y entra en la pestaña de
  filtro «Otros»); el campo SHALL aceptar también **Intro** y SHALL limitar cada texto a
  **40 caracteres SOLO en el formulario** (el `maxlength` del campo): la normalización y
  la importación **NO truncan** (solo recortan y quitan vacíos, RF-1202 y RF-1209). NO
  SHALL haber límite de cantidad de tipos (ni de fijos ni de libres). MIENTRAS se edite
  un cliente, EL SISTEMA SHALL mostrar sus tipos ya cargados (los fijos marcados y los
  libres como chips con su «×» de quitar). Cada chip libre SHALL poder quitarse con su
  «×»; **nada es obligatorio** (spec 007): sin ningún tipo marcado el cliente se guarda
  **sin tipos**. CUANDO el texto escrito, **tras recortar espacios**, coincida
  **exactamente** (mayúsculas y minúsculas incluidas) con un tipo fijo, EL SISTEMA SHALL
  marcar ese chip fijo en lugar de crear un chip libre (comportamiento ya decidido en la
  008: «Tela» escrita a mano es Tela); y CUANDO coincida con un chip libre ya añadido,
  SHALL evitar el duplicado. Los chips SHALL ser operables con teclado (Tabulador para
  alcanzarlos, Intro/Espacio para alternar, foco visible), con objetivo táctil ≥ 44 px,
  estado activo visible **sin depender solo del color** y texto en español (toda la
  interfaz nueva en español, regla 5); a 375 px los chips SHALL envolverse **sin
  desbordar**.
- **RF-1204 — Alta y edición guardan `tipos` y `tipo`.** CUANDO se guarde una alta o una
  edición, EL SISTEMA SHALL escribir `tipos` con los chips seleccionados **normalizados**
  (texto recortado, vacíos fuera, duplicados exactos fuera, **sin truncar**, orden de
  selección conservado) y `tipo` = `tipos[0] ?? ""`, conservando `id` y `fecha` en la
  edición (spec 002) y sin tocar el resto de campos. SI no hay ningún tipo, ENTONCES
  SHALL escribir `tipos: []` y `tipo: ""`. El formulario SHALL seguir sin exigir ningún
  campo.
- **RF-1205 — Filtro por pertenencia.** CUANDO el filtro activo sea un tipo concreto, EL
  SISTEMA SHALL mostrar los clientes que tengan **ese tipo entre sus tipos** (p. ej.
  `["Tela","Espuma"]` aparece en «Tela» **y** en «Espuma»). CUANDO el filtro sea «Otros»,
  SHALL mostrar los clientes con **algún tipo no fijo** (los fijos junto a libres también
  entran); los clientes **sin tipos** SHALL aparecer **solo en «Todos»**. Las pestañas
  (Todos / Tela / Espuma / Estructuras / Otros), sus textos, colores y el contador
  SHALL permanecer **sin cambios**.
- **RF-1206 — Búsqueda en todos los tipos.** CUANDO el usuario busque, EL SISTEMA SHALL
  poder encontrar al cliente por **cualquiera de sus tipos** (no solo por el primero), y
  las búsquedas multi-palabra SHALL poder repartirse entre tipos distintos del mismo
  cliente (p. ej. «tela espuma» encuentra al de `["Tela","Espuma"]`), con las reglas de
  siempre (ignorar acentos y mayúsculas, todas las palabras, combinado con el filtro).
  SI el cliente no tiene tipos, ENTONCES SHALL seguir con la convención actual de buscar
  también en el texto «Sin tipo» (sin cambiar el comportamiento existente).
- **RF-1207 — Ficha/tarjeta: un badge por tipo y canto del primer tipo.** CUANDO un
  cliente tenga uno o varios tipos, la tarjeta SHALL mostrar **un badge/etiqueta por cada
  tipo**, en su color: fijos con su paleta (índigo/mostaza/acero) y libres en **violeta**
  (spec 008); SI no tiene tipos, ENTONCES SHALL mostrar la etiqueta **«Sin tipo»** como
  hoy. El **canto de color de la tarjeta** SHALL ser el del **primer tipo** (`tipos[0]`,
  el mismo que se refleja en `tipo` para los lectores antiguos); SI no hay tipos, ENTONCES
  sin canto (igual que hoy). Un cliente con un solo tipo SHALL mostrarse **idéntico** al
  aspecto actual.
- **RF-1208 — Listado (012) y papel (013) con todos los tipos.** CUANDO el campo «Tipo»
  esté elegido en el listado, la celda SHALL mostrar **todos los tipos unidos** con el
  separador **« + »** en texto plano (p. ej. `Tela + Espuma`), o **«Sin tipo»** si no hay
  ninguno; SHALL seguir habiendo **una sola columna «Tipo»** (el catálogo de campos de la
  012 no cambia) y la celda SHALL seguir siendo **texto sin HTML**, con «…» + título
  emergente si es larga. La impresión (spec 013) SHALL reproducir **exactamente ese
  texto** con los mismos cambios ya previstos en su spec; ninguna otra regla de impresión
  cambia.
- **RF-1209 — Exportar e importar (011).** La exportación SHALL incluir en cada cliente
  **tanto `tipos` como `tipo`** (formato legible por versiones antiguas). La
  importación SHALL aceptar ficheros **antiguos** (solo `tipo`, convirtiéndolo a array) y
  **nuevos** (con `tipos`, normalizándolo igual que la carga, RF-1202, incluida la
  migración FOAM), **sin truncar** los textos, y SHALL escribir `tipo` = `tipos[0]`. Los
  **mensajes de error literales** existentes (JSON inválido / no es lista de clientes)
  SHALL quedar intactos, y un fichero con errores seguirá **sin tocar** los datos
  actuales.
- **RF-1210 — Sin claves nuevas, sin dependencias y sin cambios de formato del fichero de
  escritorio.** El sistema NO SHALL crear ninguna clave nueva de `localStorage`;
  `gestorClientes` (web) y `Documentos\Gestor de Clientes\clientes.json` (escritorio)
  SHALL seguir siendo **el mismo array de clientes** (los objetos llevan un campo más,
  `tipos`, y conservan los 12 actuales). NI el alta, la edición, el filtro, la búsqueda,
  el cambio de vista ni la impresión SHALL alterar la estructura de almacenamiento más
  allá de `tipo`/`tipos`. El sistema SHALL seguir funcionando **con doble clic**
  (`file://`), sin dependencias, frameworks ni módulos ES (regla 1).
- **RF-1211 — Cierre.** Toda la lógica nueva (migración, normalización de `tipos`,
  pertenencia a filtros, búsqueda por tipos, texto unido de la celda, nombre visible del
  primer tipo/canto) SHALL vivir en **lógica pura, sin DOM**, con sus tests en
  `node --test` **en verde**; la interfaz se SHALL verificar en navegador (consola limpia,
  móvil 375 px sin desbordes) y, al cierre, **`AGENTS.md` se actualizará** (esquema con
  `tipos`, formulario con chips, filtros por pertenencia) **junto a `MEMORY.md`**.

## 3. Criterios de aceptación

- **Given** `localStorage`/`clientes.json` con un cliente antiguo `tipo: "Tela"`, **when**
  se abre la app, **then** queda `tipos: ["Tela"]` y `tipo: "Tela"`, y se ve exactamente
  igual que antes (mismo badge, mismo canto, misma pestaña).
- **Given** un cliente `tipo: "FOAM"`, **when** se abre, **then** `tipos: ["Espuma"]` y
  `tipo: "Espuma"` (la 009 sigue cumpliéndose dentro de la nueva migración).
- **Given** un cliente `tipos: []` con `tipo: "Tela"`, **when** se abre, **then** `tipos`
  se reconstruye a `["Tela"]` (opción protectora del dato); **given** un cliente con
  `tipos: ["Toldos"]` y `tipo: "FOAM"`, **then** `tipos` se conserva íntegro y `tipo`
  queda `"Toldos"` (con `tipos` presente, `tipo` se ignora y se reescribe).
- **Given** la migración ya aplicada, **when** se vuelve a abrir la app, **then** no se
  reescribe nada (misma lista, sin escrituras — idempotente).
- **Given** un cliente sin tipos (`tipos: []`, `tipo: ""`), **when** se abre,
  **then** aparece con «Sin tipo», solo en «Todos» y la celda del listado dice «Sin
  tipo».
- **Given** el formulario, **when** se marcan «Tela» y «Espuma» y se añade el chip libre
  «Toldos» y se guarda, **then** el cliente tiene `tipos: ["Tela","Espuma","Toldos"]` y
  `tipo: "Tela"`.
- **Given** ese cliente, **when** se filtra «Tela» o «Espuma», **then** aparece en ambos;
  **when** se filtra «Otros», **then** también aparece (tiene «Toldos»); **when** se
  filtra «Estructuras», **then** no aparece.
- **Given** el mismo cliente, **when** se mira la tarjeta, **then** hay tres badges
  (índigo «Tela», mostaza «Espuma», violeta «Toldos») y el canto es **índigo** (primer
  tipo); en el listado, la celda Tipo dice **`Tela + Espuma + Toldos`** y al imprimir
  sale ese mismo texto.
- **Given** el buscador, **when** se escribe «espuma», **then** el cliente de
  `["Tela","Espuma"]` aparece; **when** se escribe «tela toldos», **then** también
  (multi-palabra repartida entre tipos).
- **Given** un cliente en edición, **when** se abre el formulario, **then** sus tipos
  están cargados (fijos marcados, libres como chips con «×»); **when** se quita un chip y
  se guarda, **then** `tipos` y `tipo` se reajustan y el resto de campos no cambian.
- **Given** un JSON exportado por esta versión, **when** se importa en esta versión,
  **then** los tipos quedan idénticos; **when** se importa un JSON antiguo (solo `tipo`),
  **then** se convierte a array sin perder nada; **when** el fichero es basura, **then**
  el error es el literal de siempre y los datos actuales no se tocan.
- **Given** un lector antiguo que solo lee `tipo`, **when** abre el JSON nuevo (solo
  lectura), **then** ve el primer tipo del cliente (nunca vacío si el cliente tiene
  tipos); si ese lector edita y guarda, **then** al reabrir esta versión `tipos` queda
  reconstruido desde `tipo` (pérdida aceptada y documentada, ver casos límite).
- `node --test` en verde con los tests nuevos (migración idempotente, normalización,
  filtros por pertenencia, búsqueda por tipos, celda unida, canto), **sin DOM**; consola
  del navegador limpia; móvil 375 sin desbordes; interfaz en español.

## 4. Casos límite

- **Datos antiguos**: solo `tipo` string (fijo, libre u «Otros») → `tipos: [tipo]`; un
  texto libre guardado como «Otros» por la 008 migra a **chip libre «Otros»** con el
  mismo comportamiento visible de siempre (violeta, pestaña «Otros»); cliente de los 12
  campos sin `tipos` → migrado sin tocar nada más; «FOAM» dentro de `tipos` (o dentro de
  `tipo` cuando `tipo` vaya a usarse) → «Espuma».
- **`tipos` presente pero no es array** (dato corrupto/manipulado) → se trata como
  **ausente** y se usa `tipo` (tolerancia, RF-1202); **`tipos` es un array vacío** (o
  queda vacío tras normalizar) **con `tipo` no vacío** → se **reconstruye** `tipos` desde
  `tipo` (tras migrar FOAM) — opción más protectora del dato (Decisión 12); **`tipos`
  tiene elementos** → `tipo` se **ignora por completo** (incluido un «FOAM» residual) y
  se reescribe = `tipos[0]`.
- **Lector antiguo que escribe**: quien edite un cliente con tipos múltiples en una
  versión antigua de la app **pierde `tipos`** (la versión vieja reconstruye el objeto
  con solo los 12 campos) **o ve revertido su `tipo`**; al volver a esta versión, la
  migración **reconstruye `tipos` desde `tipo`**. Pérdida aceptada y documentada: la
  compatibilidad de `tipo` es **solo de lectura** (RF-1201).
- **Elementos de `tipos` que no son texto** (números, nulos) → se convierten a texto y lo
  que quede vacío tras recortar se descarta; **duplicados exactos** → se quedan uno;
  **variantes por mayúsculas** («tela» vs «Tela») → **no se unifican**: «tela» minúscula
  sigue siendo tipo libre, igual que hoy.
- **Orden**: el orden del array se conserva siempre; `tipo` = `tipos[0]` puede cambiar de
  significado solo si el usuario quita el primer tipo (entonces manda el siguiente).
  **Alternar un chip fijo off/on** (desmarcarlo y volver a marcarlo) lo mueve al
  **final** del orden de tipos (Decisión 5): puede cambiar `tipos[0]` y, con él, el canto
  de la tarjeta y el `tipo` visible en lectores antiguos.
- **Texto libre = tipo fijo escrito a mano** («Tela», tras recortar espacios y coincidencia
  exacta) → se comporta fijo (color, pestaña), sin chip duplicado; **texto repetido** →
  no se duplica el chip; **solo espacios** o campo vacío → no se añade nada (sin «Otros»
  automático, ver Decisiones).
- **Texto de más de 40 caracteres**: el formulario no deja escribirlo (`maxlength`), pero
  la normalización y la importación **no truncan** (solo recortan y quitan vacíos): un
  fichero con un tipo de 60 caracteres se conserva íntegro.
- **Tipo libre que contiene literalmente « + »** (p. ej. «Toldos + Lonas»): la celda del
  listado y el texto impreso quedan **ambiguos** (no se distinguen de dos tipos unidos);
  es solo texto plano, inofensivo y sin efecto en los datos (el array sigue siendo la
  fuente).
- **Sin tipos + edición**: abrir la ficha y guardar sin tocar nada no cambia ningún dato.
- **Muchos tipos**: envoltura de chips en el formulario y badges en la tarjeta a 375 px,
  sin desbordes ni scroll horizontal; celda de listado larga → «…» + título.
- **Cliente con tipos y filtro/search activos** al editar: se conservan filtro y búsqueda
  (specs 002/005 intactas) y la lista se repinta con las reglas nuevas de pertenencia.
- Importar con la vista en listado o con filtro activo: lo de siempre (pestaña «Todos» y
  buscador limpio), ahora con los tipos normalizados.

## 5. Fuera de alcance

- Impresión (spec **013** no cambia: solo imprime el texto de la celda).
- Campo «Provincia» (spec **015**) y ampliaciones del catálogo de campos (012 intacta
  salvo el texto de la celda Tipo).
- Cambios en la clave `gestorClientes`, en el array del fichero de escritorio ni en el
  resto de campos del esquema.
- Renombrar/borrar tipos ya guardados, límite de tipos por cliente, colores propios para
  tipos libres (comparten violeta), estadísticas por tipo.
- La migración FOAM → Espuma ya cerrada (spec 009): aquí solo se reutiliza su regla.
- Modificar specs históricas 002–013 (la 008 se **supera** en el punto «vacío = Otros»,
  como la 005 fue superada por la 009; queda anotado en Decisiones).

## 6. Decisiones

1. **`tipos` (array) es el campo canónico y `tipo` se escribe SIEMPRE igual a
   `tipos[0] ?? ""`.** La doble escritura es de **compatibilidad**: un lector antiguo
   **lee** el primer tipo; la garantía es **solo de lectura** (una versión antigua que
   edite puede perder `tipos`, ver casos límite). *Alternativas descartadas:*
   **eliminar `tipo` y dejar solo `tipos`** — el padre abriría su JSON con la versión
   vieja y vería clientes «sin tipo» (pérdida aparente, riesgo real de la regla 3);
   **`tipo` como unión en un solo string** («Tela, Espuma») — un solo string no distingue
   tipos compuestos («Estructuras metálicas» llevaría coma), rompe los valores fijos de
   filtro y no permite recorrer los tipos uno a uno.
2. **Migración idempotente al cargar (web y escritorio) y al importar**, con la regla
   FOAM primero y escritura **solo si hay cambio** (patrón ya probado en 009/010).
   *Descartadas:* **migración perezosa al editar** (los datos quedarían en formato viejo
   hasta que se editen y el formulario nuevo ya no escribe el formato viejo) y **marca de
   migración en una clave nueva** (una clave nueva de `localStorage` está prohibida por la
   propia spec y una marca se pierde; la idempotencia la hace innecesaria).
3. **Formulario con chips de selección múltiple** (patrón de la 012): tres fijos que se
   alternan + campo «Añadir otro tipo» con botón y Intro, `maxlength` 40 **solo en el
   formulario** (la lógica no trunca), sin límite de cantidad. *Descartados:*
   **`<select multiple>` nativo** (incómodo en táctil y no admite el texto libre
   integrado) y **seguir con el desplegable + «Otros» añadiendo más campos de texto** (no
   escala a «sin límite» ni a combinar fijos entre sí).
4. **Vacío = sin tipos («Sin tipo»); se supera el «vacío = Otros» de la 008** (decisión de
   esta spec, siguiendo la 007 «nada es obligatorio»). *Descartado:* **mantener «Otros»
   automático** dejaría un chip que el usuario no pidió y contradice que nada sea
   obligatorio.
5. **El orden de `tipos` es el orden de adición (y el del array ya guardado se
   conserva).** Un chip fijo alternado off/on vuelve **al final** del orden. *Descartado:*
   **reordenar siempre a orden fijo de catálogo** (Tela, Espuma, Estructuras…):
   reordenaría los arrays migrados, cambiaría `tipos[0]` → `tipo` visible en lectores
   antiguos y haría variar el canto tras cada edición.
6. **Canto de la tarjeta = color del primer tipo** (`tipos[0]`, el mismo que `tipo`).
   *Descartados:* **canto multicolor** (rompe el diseño de una sola espina de la 003) y
   **preferencia por el tipo fijo si existe** (haría saltar el canto según la combinación
   y no coincidiría con `tipo`, que es lo que ve una versión antigua).
7. **Filtro «Otros» = tiene algún tipo no fijo** (quien tenga fijos **y** libres entra en
   ambas pestañas). *Descartado:* **excluir de «Otros» a quien también tenga fijos**
   (un «Tela + Toldos» dejaría de aparecer pese a tener tipo libre).
8. **Celda de Tipo unida con « + » en texto plano** (una sola columna; la ambigüedad con
   un tipo libre que contenga « + » literal es inofensiva, ver casos límite). *Descartadas:*
   **una columna por tipo** (rompería el catálogo único de la 012 y el número de columnas
   variaría por fila) y **badges con HTML en la celda** (RF-1004 exige solo texto y la
   013 imprime texto).
9. **Búsqueda sobre todos los tipos** (y conservar la inclusión actual de «Sin tipo»).
   *Descartado:* **buscar solo en `tipos[0]`** ocultaría coincidencias evidentes.
10. **Exportar `tipos` + `tipo`** en el JSON. *Descartada:* **exportar solo `tipos`**
    (un fichero así no abriría bien en la versión actual ni en la app de escritorio ya
    instalada).
11. **Normalización: recorte, vacíos fuera, duplicados exactos fuera, sin plegar
    mayúsculas y sin truncar.** *Descartado:* **unificar «tela» con «Tela»** modificaría
    datos escritos por el usuario y cambiaría su significado actual (desde la 008, la
    minúscula es tipo libre).
12. **Datos contradictorios: opción más protectora del dato (regla 3).** SI `tipos` es un
    array **vacío** (o queda vacío tras normalizar) Y `tipo` no está vacío, ENTONCES se
    **reconstruye** `tipos` desde `tipo` (ya migrado FOAM); SI `tipos` tiene elementos,
    ENTONCES `tipo` se **ignora por completo** (incluido FOAM) y se reescribe =
    `tipos[0]`. «Vacío» incluye el array cuyos elementos se descartan al normalizar (todo
    espacios o vacíos). *Descartada:* **`tipos` canónico a ultranza** (`tipos: []` manda y
    el cliente queda sin tipos aunque `tipo` traiga texto) — borraría el dato que dejó en
    `tipo` una versión antigua al editar, contra la regla 1 (pérdida aceptada solo en
    lectura) y contra la protección decidida por el QA de fase.

## Apéndice — Decisiones tomadas por falta de consulta

Instrucción explícita del usuario en la Fase 1 (2026-10-16): no se devuelven preguntas;
donde había duda, se adopta la opción recomendada. Resueltas aquí:

1. Esquema: `tipos` array canónico + `tipo` = `tipos[0] ?? ""` escrito siempre (Decisión 1).
2. Migración: idempotente al cargar e importar, FOAM primero, escritura solo si cambia
   (Decisión 2).
3. Formulario: chips (tres fijos + texto libre con botón/Intro, `maxlength` 40 **solo en
   el formulario**, sin límite de chips) (Decisión 3).
4. Sin tipos = «Sin tipo»: se supera «vacío = Otros» de la 008 (Decisión 4).
5. Orden = orden de adición, estable; el chip fijo alternado off/on va al final
   (Decisión 5).
6. Canto = color del primer tipo (Decisión 6).
7. «Otros» agrupa a quien tenga algún tipo libre, aunque también tenga fijos (Decisión 7).
8. Unión en listado/impresión con **« + »** y una sola columna «Tipo» (Decisión 8).
9. Búsqueda sobre todos los tipos (Decisión 9).
10. Exportación con `tipos` + `tipo`; importación acepta ambos formatos con los mismos
    literales de error (Decisión 10).
11. Duplicados exactos fuera, mayúsculas sin unificar, sin truncar; texto libre con 40
    caracteres solo en el formulario (Decisión 11 y RF-1203).
12. Datos contradictorios: opción protectora del dato (Decisión 12).
13. Sin claves nuevas de `localStorage`; fichero de escritorio = mismo array con un campo
    más (RF-1210).

**Dudas abiertas:** ninguna: todas las dudas de esta spec quedaron resueltas en
«Decisiones» y en este apéndice (Fase 1 sin consulta, 2026-10-16; correcciones del QA de
fase, 2026-10-17).
