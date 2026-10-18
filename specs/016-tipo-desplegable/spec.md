# Spec 016 — Desplegable «Tipo de cliente» con «Otros» de texto (vuelta al selector de la 008)

| Campo | Valor |
|---|---|
| **ID** | `016-tipo-desplegable` |
| **Título** | Revertir el formulario de tipos de los chips (spec 014) al desplegable «Tipo de cliente» + campo condicional «Otros» de la spec 008 |
| **Estado** | **Cerrada — APROBADA** (QA previo 2026-10-17; implementación y validación RF por RF el 2026-10-17 con 1 corrección aplicada: RF-1404, literal «Otros» deja el campo vacío) |
| **Fecha** | 2026-10-17 |
| **Dependencia** | Se implementa sobre el estado cerrado de las specs **014** (tipos múltiples) y **015** (provincia); **no modifica ninguna spec cerrada** |

---

## 1. Contexto y objetivo

El usuario pide, con sus palabras: *«no me gusta el formato del tipo de cliente y el apartado
de otros. Me gustaba más el desplegable, y que cuando seleccionaba el apartado otros me saliera
el cuadro de texto»*.

La spec 014 sustituyó el desplegable «Tipo de cliente» de la spec 008 por **chips de selección
múltiple**. Al usuario le gusta más el patrón anterior: un **desplegable** con las opciones
Tela / Espuma / Estructuras / Otros y un **cuadro de texto** que aparece solo al elegir «Otros».

**Objetivo:** recuperar la **interfaz del formulario** de la spec 008 (desplegable + campo
condicional de texto libre) **sin tocar el modelo de datos de la spec 014**: el cliente sigue
guardando `tipos` (array canónico) + `tipo` (= `tipos[0] ?? ""`, solo lectura para versiones
antiguas), y siguen **intactos** la migración, el filtro por pertenencia, la búsqueda, la ficha
(badges + canto del primer tipo), el listado (celda «Tela + Espuma») y la impresión. **Es un
cambio de interfaz del formulario, nada más.**

**Usuarios:** el comercial (usuario directo) que da de alta y edita clientes; el padre del
usuario, con **datos reales ya guardados** (web y `Documentos\Gestor de Clientes\clientes.json`),
que no debe ver alterados sus datos; y los **lectores antiguos** del JSON (compatibilidad de
`tipo`, solo lectura).

**Historias de usuario:**

- **HU-1.** Como comercial, quiero elegir el tipo de cliente en un **desplegable** (como antes
  de la 014) para clasificar a cada cliente deprisa y sin chips.
- **HU-2.** Como comercial, quiero que al elegir **«Otros»** aparezca un **cuadro de texto**
  donde escribir el tipo («Toldos», «Cortinas»…) para etiquetar clientes que no encajan en los
  tres fijos.
- **HU-3.** Como usuario con datos reales, quiero que al editar un cliente se cargue su tipo en
  el desplegable (y su texto si es libre) para no perderlo ni reescribirlo.
- **HU-4.** Como usuario del filtro, la ficha, el listado y el papel, quiero que todo siga
  funcionando igual que con la 014 (filtros por pertenencia, badges, celda unida, impresión).

## 2. Requisitos funcionales (EARS)

- **RF-1401 — El desplegable «Tipo de cliente» sustituye a los chips.** EL SISTEMA SHALL
  sustituir el conjunto de chips de tipos del formulario por un **desplegable «Tipo de cliente»**
  con, en este orden: una opción **«Sin tipo»** (valor vacío, **seleccionada por defecto en el
  alta**), **«Tela»**, **«Espuma»**, **«Estructuras»** y **«Otros»**. El desplegable SHALL ser un
  control nativo operable con teclado y ratón, con etiqueta visible en español y objetivo
  táctil ≥ 44 px; nada SHALL ser obligatorio (spec 007): dejarlo en «Sin tipo» SHALL ser válido y
  SHALL guardar al cliente **sin tipos**.
- **RF-1402 — Campo condicional de texto libre («Otros»).** CUANDO el desplegable esté en
  **«Otros»**, EL SISTEMA SHALL mostrar, justo debajo, un **campo de texto** etiquetado
  **«Escribe el tipo de cliente»**, con texto de ayuda **«p. ej. Toldos»** y límite de **40
  caracteres solo en el formulario** (la lógica y la importación **no truncan**, RF-1209).
  CUANDO el desplegable esté en cualquier otra opción, EL SISTEMA SHALL ocultar ese campo y
  SHALL hacer que **no ocupe espacio** ni se envíe al guardar: el texto que pudiera quedar
  escrito SHALL descartarse.
- **RF-1403 — Guardado: el desplegable y su texto se guardan como `tipos` (array).** CUANDO se
  guarde una alta o una edición, EL SISTEMA SHALL escribir **`tipos` como un array** y
  `tipo` = `tipos[0] ?? ""`, con este mapeo:
  - «Sin tipo» → `tipos: []` y `tipo: ""`.
  - «Tela» / «Espuma» / «Estructuras» → `tipos: [eseTipo]`.
  - «Otros» → `tipos: [textoEscrito recortado]`; SI el texto queda vacío o son solo espacios,
    ENTONCES `tipos: ["Otros"]` (regla de la spec 008, RF-602). CUANDO el texto escrito, tras
    recortar, coincida **exactamente** con un tipo fijo (p. ej. «Tela»), ENTONCES SHALL
    guardarse como **ese tipo fijo** (`["Tela"]`), sin crear un tipo libre duplicado (regla de la
    008, RF-604).
  El guardado SHALL conservar `id` y `fecha` en la edición (spec 002) y SHALL seguir sin exigir
  ningún campo (spec 007).
- **RF-1404 — Edición: el desplegable y su campo se cargan desde `tipos`.** MIENTRAS se edite
  un cliente, EL SISTEMA SHALL cargar su **primer tipo efectivo** (`tipos[0]` según la lectura
  canónica de la 014) en el desplegable y el campo condicional, con esta regla: SI el primer tipo
  es uno de los tres fijos, ENTONCES el desplegable SHALL quedar en ese tipo y el campo oculto; SI
  el primer tipo es un texto libre **o** el literal «Otros», ENTONCES el desplegable SHALL quedar
  en «Otros» y el campo SHALL mostrar ese texto (el literal «Otros» deja el campo **vacío**); SI
  el cliente no tiene tipos, ENTONCES el desplegable SHALL quedar en «Sin tipo» y el campo
  oculto.
- **RF-1405 — Invariante: la lógica de tipos y el resto de la app no cambian.** EL SISTEMA SHALL
  mantener **intactos** el esquema de datos (`tipos` + `tipo`, 14 campos), la migración idempotente,
  la lectura canónica de tipos, los **filtros por pertenencia** (pestañas Todos / Tela / Espuma /
  Estructuras / Otros, con textos, colores y contador sin cambios), la búsqueda por tipos, la
  **ficha** (un badge por tipo y canto del primer tipo), el **listado** (celda «Tela + Espuma»)
  y la **impresión** (spec 013). El sistema NO SHALL crear ninguna clave nueva de `localStorage`
  y `clientes.json` SHALL seguir siendo **el mismo array de clientes**.
- **RF-1406 — Presentación y accesibilidad del desplegable y su campo.** El desplegable y el
  campo condicional SHALL seguir la paleta de la app (tinta y superficie, borde y radio de
  siempre, **sin sombras**, spec 003), con foco visible, objetivo táctil ≥ 44 px y **sin
  desbordes ni scroll horizontal a 375 px**. Todo el texto nuevo SHALL estar en español
  (regla 5).
- **RF-1407 — Cierre: lógica intacta y verificación en navegador.** La lógica pura de tipos SHALL
  quedar **sin cambios** (no se añaden ni se eliminan funciones puras; el mapeo del desplegable a
  `tipos` se hace en la capa de interfaz reutilizando las funciones puras existentes) y los tests
  de `node --test` SHALL seguir **en verde sin añadir tests nuevos**. La interfaz se SHALL
  verificar en navegador (alta con cada opción, edición *round-trip*, filtros, ficha, listado,
  impresión, móvil 375 px, consola limpia) y, al cierre, `AGENTS.md` y `MEMORY.md` SHALL
  actualizarse.

## 3. Criterios de aceptación

- **Given** el formulario en blanco, **when** se elige «Tela» y se guarda, **then** el cliente
  tiene `tipos: ["Tela"]` y `tipo: "Tela"`, y su ficha muestra el badge «Tela» con el canto
  índigo.
- **Given** el formulario, **when** se elige «Otros», **then** aparece el campo «Escribe el tipo
  de cliente»; **when** se escribe «Toldos» y se guarda, **then** `tipos: ["Toldos"]`,
  `tipo: "Toldos"`, la ficha muestra el badge «Toldos» en violeta y la pestaña «Otros» lo lista.
- **Given** «Otros» con el campo vacío, **when** se guarda, **then** `tipos: ["Otros"]` y
  `tipo: "Otros"` (RF-602 de la 008).
- **Given** «Otros» con el campo «Tela», **when** se guarda, **then** `tipos: ["Tela"]`, sale en
  la pestaña «Tela» con su color y **no** en «Otros».
- **Given** el desplegable en «Sin tipo», **when** se guarda, **then** `tipos: []`, `tipo: ""`, la
  ficha muestra «Sin tipo» y el cliente aparece **solo** en «Todos».
- **Given** un cliente «Tela», **when** se edita, **then** el desplegable queda en «Tela» y el
  campo condicional está oculto.
- **Given** un cliente «Toldos», **when** se edita, **then** el desplegable queda en «Otros» y el
  campo muestra «Toldos».
- **Given** un cliente sin tipos, **when** se edita, **then** el desplegable queda en «Sin tipo» y
  el campo oculto.
- **Given** un cliente con `tipos: ["Otros"]` (libre literal), **when** se edita, **then** el
  desplegable queda en «Otros» y el campo **vacío**.
- **Given** «Otros» con texto escrito, **when** se cambia a «Espuma» y se guarda, **then**
  `tipos: ["Espuma"]` (el texto se descarta) y el campo estaba oculto en ese momento.
- **Given** «Otros» con solo espacios, **when** se guarda, **then** `tipos: ["Otros"]`.
- **Given** `node --test`, **then** los **122** tests existentes siguen en verde **sin tests
  nuevos** de lógica.
- **Given** el navegador, **then** consola limpia, móvil **375 px** sin desbordes, teclado
  operable y regresiones de 002/005/010/011/012/013/014/015 intactas.

## 4. Casos límite

- **Editar un cliente multi-tipo** (p. ej. `["Tela","Espuma"]`, creado antes o importado): el
  desplegable muestra su **primer** tipo («Tela»); al guardar se conserva **solo** el elegido
  (se pierden los demás). Limitación **aceptada** de la selección única (Decisión 4): el
  formulario elige un tipo principal, mientras el array `tipos` sigue permitiendo varios por
  migración/importación.
- **Editar un cliente con `tipos: ["Otros"]` literal** (guardado por la 008): desplegable en
  «Otros», campo **vacío**.
- **Texto de «Otros» de más de 40 caracteres**: el input no deja escribirlo (`maxlength`); un
  importado con un tipo largo se conserva **íntegro** (RF-1209 intacto).
- **Texto libre que contiene « + »** («Toldos + Lonas»): la celda del listado queda ambigua
  (comportamiento ya documentado en la 014, inofensivo e intacto).
- **El campo condicional oculto** no se envía al guardar ni ocupa espacio en el formulario.
- **Cambiar de «Otros» a un tipo fijo sin escribir**: el campo se oculta y no se guarda nada.
- **El desplegable no es obligatorio**: dejarlo en «Sin tipo» guarda `tipos: []` y `tipo: ""`.
- **Filtros por pertenencia intactos**: un cliente de un solo tipo sale **solo** en su pestaña;
  la pestaña «Otros» agrupa tipos libres y excluye «Sin tipo»; el contador refleja tipo +
  provincia + búsqueda (spec 015 intacta).
- **Importar/exportar sin cambios**: el JSON sigue llevando `tipos` **y** `tipo` y los literales
  de error de siempre quedan intactos.
- **Provincia (015), listado (012) e impresión (013)**: sin cambios.

## 5. Fuera de alcance

- El **modelo de datos** (`tipos`/`tipo`), la migración, la lectura canónica, los **filtros por
  pertenencia**, la **ficha** (badges y canto), el **listado**, la **impresión** y la
  **búsqueda**.
- Volver a los **chips** de la 014.
- Permitir elegir **varios tipos** desde el formulario (el array sigue soportándolo por
  migración/importación, pero el formulario elige **uno**).
- Cambiar la interfaz de las pestañas de filtro, del listado o del papel.
- Modificar las specs cerradas **002–015** (la 008 queda **retirada** en la 014 y ahora solo se
  **recupera su interfaz**, no su spec cerrada; la 016 es la spec nueva que la reintegra).

## 6. Decisiones

1. **El desplegable incluye una primera opción vacía «Sin tipo», seleccionada por defecto en el
   alta.** Respeta la spec 007 («nada es obligatorio») y la convención de la ficha «Sin tipo»
   (RF-504), y evita obligar a elegir un tipo en cada alta. *Alternativas descartadas:* **sin
   opción vacía** (obligaría a elegir un tipo, contra la 007 y contra los clientes que hoy se
   guardan «Sin tipo») y **un *placeholder* «— Tipo —»** (texto menos claro y distinto de la
   convención «Sin tipo» que ya usa la ficha y el listado).
2. **Mapeo al guardar (RF-1403), restaurando la regla «Otros» vacío = «Otros» de la 008.** El
   usuario pidió explícitamente recuperar el cuadro de texto de la 008, cuyo RF-602 es «vacío =
   Otros»; además «Sin tipo» ya cubre el «sin tipos», así que «Otros» vacío puede quedar como el
   literal «Otros». *Alternativa descartada:* **«Otros» vacío = `[]` sin tipos** (como decidió la
   014): contradeciría el RF-602 que el usuario quiere recuperar y daría un «Otros» sin etiqueta.
3. **El campo condicional se muestra solo en «Otros» y no cuenta si no está.** El usuario lo pidió
   literalmente («que cuando seleccionaba el apartado otros me saliera el cuadro de texto»);
   mostrarlo siempre añadiría ruido y un campo que no se usa. *Alternativa descartada:* **campo
   siempre visible** (desentona con la petición y obliga a mirarlo en cada alta).
4. **Selección única en el formulario (un tipo por cliente al guardar desde el formulario).** El
   usuario pidió «el desplegable» (singular) y el gestor de un comercial clasifica a cada cliente
   en un tipo principal; el array `tipos` sigue permitiendo varios por migración/importación.
   *Alternativa descartada:* **`<select multiple>` o chips** (incómodo en táctil, no admite el
   texto libre integrado y va contra la petición literal). La consecuencia (editar un cliente
   multi-tipo guarda solo el tipo elegido) queda documentada como caso límite.
5. **Estilos: reutilizar el aire de los campos del formulario y del desplegable de provincia**
   (tinta y superficie, borde y radio de siempre, foco visible, objetivo ≥ 44 px, **sin sombras**,
   spec 003), de modo que el `<select>` desentone lo menos posible con el resto del formulario; el
   campo condicional, cuando está oculto, **no ocupa espacio**. *Alternativa descartada:* **dejar
   el `<select>` nativo sin estilizar** (rompe la paleta retro y el objetivo táctil de la app).
6. **Tests y lógica intacta: no se añaden ni se eliminan funciones puras; los 122 tests siguen en
   verde.** El mapeo desplegable → `tipos` se resuelve en la capa de interfaz reutilizando las
   funciones puras existentes, de modo que no hace falta ninguna función nueva que testear. Las
   ayudas exclusivas de los chips (`alternarTipoFijo`, `quitarTipoLibre`) quedan en `logica.js`
   (ya sin consumidor desde la interfaz, pero puras y cubiertas por tests). *Alternativa
   descartada:* **eliminarlas con sus tests** (borraría cobertura y tocaría la superficie de la
   spec 014 cerrada sin beneficio en una spec de interfaz).

**Dudas abiertas:** ninguna pendiente; la petición del usuario es explícita y el resto de
decisiones se resolvió aquí con la opción recomendada.
