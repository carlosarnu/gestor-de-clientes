# Plan — Spec 014 · Tipos de cliente múltiples

**Estado:** aprobado por el usuario (2026-10-16, autorización de fase) e implementado (2026-10-17)

---

## 1. `logica.js` — lógica pura nueva/modificada (RF-1201, RF-1202, RF-1204, RF-1205, RF-1206, RF-1208, RF-1209)

| Función / constante | Detalle | RF |
|---|---|---|
| `TIPOS_FIJOS` (constante nueva) | `["Tela", "Espuma", "Estructuras"]`: **única** fuente de los tipos fijos, de la que pende `esTipoFijo` y de la que se generan los chips del formulario. | RF-1203 |
| `esTipoFijo(tipo)` | Sin cambio de firma: pasa a comparar contra `TIPOS_FIJOS` (sigue recortando con `texto`, o sea « Tela » cuenta como fijo). | RF-1203 |
| `normalizarTipos(valor)` | Devuelve array normalizado: si `valor` no es array → `[]`; cada elemento se convierte a texto, se recorta, se quitan **vacíos** y **duplicados exactos**, **conservando el orden** y **sin truncar** (41+ caracteres intactos). No aplica FOAM (eso es de migración, D-4). | RF-1202, RF-1204 |
| `tiposCliente(cliente)` | **Única puerta de lectura** de los tipos efectivos, con la prioridad de la Decisión 12: si `tipos` es array **con elementos tras normalizar** → esos («FOAM» dentro → «Espuma») y `tipo` se ignora por completo; si `tipos` no es array o acaba vacío → reconstruir desde `tipo` («FOAM» → «Espuma»; vacío → `[]`). | RF-1201, RF-1202 |
| `migrarTipos(lista)` | **Ampliada** (mismo nombre y contrato que la 009): por cada cliente escribe `tipos` = `tiposCliente(cliente)` y `tipo` = `tipos[0] ?? ""`, conservando el resto de campos; devuelve **la MISMA lista** si nada cambia (idempotente). Ya no migra solo FOAM: migra TODO el RF-1202. Las tres rutas de carga actuales (web, escritorio, importar) ya la llaman. | RF-1202 |
| `alternarTipoFijo(tipos, tipo)` | Devuelve lista nueva con el chip fijo alternado: si estaba, se quita; si no, se añade **al final** del orden (Decisión 5; QA 8). | RF-1203 |
| `añadirTipoLibre(tipos, escrito)` | Devuelve lista nueva: texto **recortado**; vacío o solo espacios → sin cambios (sin «Otros» automático); si tras recortar coincide **exactamente** con un tipo fijo → se marca ese fijo (si no estaba) en lugar de crear libre; si coincide con un libre ya añadido → sin duplicado; si es «FOAM» escrito a mano, queda como texto libre (lo migrará «Espuma» al recargar, igual que desde la 009). **No trunca** los 40+ caracteres (D-5). | RF-1203 |
| `quitarTipoLibre(tipos, tipo)` | Devuelve lista nueva sin ese texto exacto (el «×» del chip libre); si no estaba, sin cambios. | RF-1203 |
| `construirCliente(datos, id, fecha, tipos)` / `actualizarCliente(actual, datos, tipos)` / `aplicarEdicion(lista, id, datos, tipos)` | **`tipos` es un parámetro opcional** (array ya elegido en el formulario): si viene, se normaliza y se escribe `tipos` + `tipo` = `tipos[0] ?? ""`; si **no** viene (o no es array), se deriva del `dato` string `datos.get("tipo")` (formato legado: `[tipo]` o `[]`), de modo que los 72 tests actuales y la migración siguen válidos. Conservan `id`/`fecha` y el resto de campos intactos. | RF-1204 |
| `filtrarClientes(lista, filtro)` | **Por pertenencia**: «Todos» → toda la lista; un tipo concreto → clientes que lo tengan **entre sus `tiposCliente`** («Tela» incluye a `["Tela","Espuma"]`); «Otros» → clientes con **algún tipo no fijo**. Los «Sin tipos» solo en «Todos». | RF-1205 |
| `textoBusquedaCliente(cliente)` | Incorpora **todos** los tipos efectivos (`tiposCliente` unidos) además de los campos de siempre; si no tiene tipos, sigue añadiendo «Sin tipo» (convención 005 intacta). | RF-1206 |
| `unirTiposTexto(tipos)` | Texto plano de la celda: tipos unidos con **« + »** (`Tela + Espuma`), o **«Sin tipo»** si la lista está vacía. Sin HTML. | RF-1208 |
| `construirCeldas(…)` | La celda `tipo` pasa de `nombreTipo(cliente.tipo)` a `unirTiposTexto(tiposCliente(cliente))`. El resto de celdas, intacto. | RF-1208 |
| `importarClientes(textoJson)` | Además de los 12 campos, **copia `tipos` tal cual** del elemento (cualquier valor JSON) y delega normalización/FOAM/reescritura de `tipo` en `migrarTipos` (que ya llama al final). **Literales de error intactos**; un fichero con errores no toca datos. | RF-1209 |
| `module.exports` | Se añaden `TIPOS_FIJOS`, `normalizarTipos`, `tiposCliente`, `alternarTipoFijo`, `añadirTipoLibre`, `quitarTipoLibre`, `unirTiposTexto`. `nombreTipo` se mantiene (sigue para el «Sin tipo» de la ficha y para el mensaje de filtro). | RF-1211 |

- **Sin `hoy`**: ninguna función nueva depende del reloj (`fechaTextoLocal` de la 012 no se
  toca; el esquema no cambia el campo `fecha`).
- **Migración solo si hay cambio** (RF-1202): `migrarTipos` sigue devolviendo la MISMA
  referencia de lista cuando todo ya está migrado, de modo que `app.js` no escribe nada
  (`localStorage` / `clientes.json` intactos en cada arranque normal).

## 2. `test-logica.js` — tests nuevos en rojo→verde (RF-1211)

`node --test`, **sin DOM** (hoy **72 tests** en verde). Se **actualizan** los pocos tests
actuales que fijan la lista exacta de claves (`construirCliente … Object.keys`, y el
equivalente de `importarClientes`) para incluir `tipos` — cambio previsto por la spec,
no regresión—; el resto de los 72 queda intacto. Grupos nuevos:

- `normalizarTipos`: no array → `[]`; recorte; vacíos fuera; duplicados exactos fuera
  («Tela»/«Tela» → uno); «tela» vs «Tela» **no** se unifican; orden de entrada
  conservado; texto de 41+ caracteres **sin truncar**.
- `tiposCliente`: solo `tipo: "Tela"` → `["Tela"]`; `tipos` con elementos → normalizados y
  `tipo` ignorado (incluso `tipo: "FOAM"` no pisa); `tipos` no es array → desde `tipo`;
  `tipos: []` + `tipo: "Tela"` → reconstruido `["Tela"]`; `tipos: []` + `tipo: ""` → `[]`;
  `tipos: ["  "]` + `tipo: "Tela"` → reconstruido; «FOAM» **dentro de `tipos`** → «Espuma».
- `migrarTipos` (ampliada): cliente de 12 campos → gana `tipos: [tipo]` y `tipo` intacto;
  «FOAM» → `tipos: ["Espuma"]`; idempotente (**misma referencia** la segunda pasada);
  nada que migrar → MISMA lista; cliente ya nuevo sin reescribir; número/nulo dentro de
  `tipos` → texto/vacío descartado; `tipo` se reescribe = `tipos[0]`.
- `alternarTipoFijo`: marcar/desmarcar; **alternar off/on mueve el chip al final** (puede
  cambiar `tipos[0]`).
- `añadirTipoLibre`: «  Toldos » → `["Toldos"]`; «Tela» (fijo tras recortar) → marca el
  fijo, sin libre duplicado; «tela» minúscula → libre; repetido → sin duplicado; vacío o
  solo espacios → nada; «Toldos de lona y toldos cortina…» largo → **sin truncar**.
- `quitarTipoLibre`: quita el exacto; ausente → sin cambios.
- `filtrarClientes` por pertenencia: `["Tela","Espuma"]` aparece en «Tela» y en
  «Espuma», no en «Estructuras»; «Tela + Toldos» entra en «Tela» **y** en «Otros»;
  sin tipos → solo «Todos»; cliente legado (solo `tipo`) filtra igual que antes.
- `textoBusquedaCliente`/`buscarClientes`: «espuma» encuentra a `["Tela","Espuma"]`;
  «tela toldos» repartido entre tipos; «Sin tipo» sigue buscable.
- `construirCeldas`: celda tipo = `Tela + Espuma + Toldos`; sin tipos → «Sin tipo».
- `construirCliente`/`aplicarEdicion` con `tipos`: normaliza, escribe `tipo` = `tipos[0]`,
  sin tipos → `tipos: []` y `tipo: ""`; **sin** el parámetro → deriva del `tipo` string
  (compatibilidad, D-3).
- `importarClientes`: fichero **con `tipos` array** → se conserva y normaliza; fichero
  **antiguo** (solo `tipo`) → `tipos: [tipo]`; `tipos` no array → desde `tipo`; FOAM
  migrado; los dos literales de error intactos.

## 3. `index.html` (RF-1203)

- **Fuera**: el `<select id="tipo">` y el bloque `#campo-tipo-otro` de la 008 (el
  desplegable y su campo condicional).
- **Dentro**, en su sitio del formulario:
  - `<div class="chips" id="chips-tipos" role="group" aria-label="Tipos de cliente">`:
    contenedor de **todos** los chips (fijos y libres); los tres fijos los genera
    `app.js` desde `TIPOS_FIJOS` como `<button type="button" class="chip"
    role="checkbox" aria-checked="false" data-tipo="Tela">` (patrón 012), y los libres
    con su botón «×».
  - Campo **«Añadir otro tipo»**: `<input type="text" id="tipo-otro" maxlength="40"
    placeholder="p. ej. Toldos">` (**`maxlength` solo aquí**: la lógica no trunca) y
    `<button type="button" class="boton-secundario" id="boton-anadir-tipo">Añadir</button>`
    (el Intro del input hará lo mismo, gestionado en `app.js`).

## 4. `styles.css` (RF-1203, RF-1207)

| Cambio | Detalle |
|---|---|
| Chips del formulario | Reutiliza `.chips`/`.chip`/`.chip.marcado`/`:focus-visible` **tal cual** de la 012 (mismo estado de casilla: palomita/estado visible, ≥ 44 px); solo si hiciera falta, un ajuste de separación con el resto de campos del formulario. |
| `.chip-quitar` | La «×» del chip libre: botón pequeño dentro del chip, con objetivo táctil y foco visibles; no depende solo del color. |
| Badges de la tarjeta | Reutiliza `.etiqueta` y `.etiqueta-tela/-espuma/-estructuras/-otros` **existentes**; se pintan **varias** en la cabecera con un `gap` (si `.tarjeta-cabecera` ya es flex, solo añadir `gap`; si no, hacerla flex). Un cliente de un solo tipo queda idéntico al actual. |
| 375 px | Los chips envuelven (`.chips` ya envuelve en la 012) y los badges también, sin desbordes. |

## 5. `app.js` (RF-1203, RF-1204, RF-1207, RF-1210)

| Cambio | Detalle |
|---|---|
| Estado en memoria | `let tiposFormulario = []` junto a `filtroActivo`/`camposSeleccionados`: la selección de chips del formulario **no se persiste** (ninguna clave nueva, RF-1210). |
| `pintarChipsTipos()` | Pinta los fijos (marcados según `tiposFormulario`, `aria-checked`) y los libres con «×»; se repinta tras cada alternar/añadir/quitar, al resetear y al cargar la edición. |
| Listeners | Clic en chip fijo → `alternarTipoFijo` + pintar; clic en «×» → `quitarTipoLibre` + pintar; clic en «Añadir» **y** Intro en `#tipo-otro` → `añadirTipoLibre` con el valor crudo del input (recorta la lógica), limpiar el input y pintar. Se **eliminan** `sincronizarTipoOtro`, `cargarTipoEnFormulario` y su listener `change` del desplegable (la 008). |
| `resetearFormulario()` | Además de `formulario.reset()`, `tiposFormulario = []` y repinta chips. |
| `iniciarEdicion(id)` | `tiposFormulario = tiposCliente(cliente).slice()` (los tipos efectivos ya migrados) y repinta chips; el resto de campos igual que hoy. |
| Submit | Pasa `tiposFormulario` como cuarto/tercer argumento a `construirCliente(…)` / `aplicarEdicion(…)`; **ambas ramas de `guardarClientes`** (web `localStorage` / escritorio `clientes.json`) siguen sin tocar: serializan `clientes` completos, ya con `tipos`. |
| `crearTarjeta` | Canto: `claseTipo(tiposCliente(cliente)[0])` (vacío → sin canto, como hoy). Cabecera: **un `<span class="etiqueta etiqueta-…">` por cada tipo** (`tiposCliente` + `claseTipo`); sin tipos → una sola «Sin tipo» (aspecto actual). |
| Fila del listado | Canto por el **primer tipo** efectivo (hoy usa `cliente.tipo`); la celda Tipo ya viene unida de `construirCeldas`. |
| `cargarClientes` | **Sin cambios de código**: web y escritorio ya llaman `migrarTipos` y escriben solo si hubo cambio; ahora esa llamada cubre el RF-1202 completo en las **tres rutas** (web, escritorio, importación). |
| Sin cambios | `guardarClientes`, claves, pestañas (los `data-filtro` siguen siendo «Tela»/«Espuma»/«Estructuras»/«Otros»/«Todos»), contador, estados vacíos («No hay clientes de tipo X» usa la etiqueta de la pestaña), exportar, importar, imprimir (`textoContextoImpresion` no depende de tipos) y el resto de la 012. |

## 6. Decisiones (con alternativa descartada)

1. **Ampliar `migrarTipos` (mismo nombre y contrato) en lugar de crear una función
   nueva.** Las **tres rutas** que migran (web, escritorio e importar) ya la llaman:
   así el RF-1202 entero llega a las tres sin tocar `app.js` en ese punto. *Descartada:*
   `migrarTiposMultiples` aparte — exige cambiar tres puntos de llamada que
   divergirían, y dejaría la migración FOAM duplicada.
2. **`tiposCliente(cliente)` como única puerta de lectura de los tipos efectivos**, con
   la tolerancia entera dentro (no array → desde `tipo`; vacío + `tipo` → reconstruido;
   con elementos → normalizados e `tipo` ignorado). *Descartada:* leer `cliente.tipos`
   directamente en filtro, búsqueda, celda, tarjeta y formulario — duplicaría los casos
   del QA (puntos 2 y 3) en cinco sitios y alguno se olvidaría.
3. **El estado de los chips del formulario vive en memoria (`tiposFormulario`) y se pasa
   como parámetro opcional** a `construirCliente`/`actualizarCliente`/`aplicarEdicion`;
   sin parámetro, se deriva del `tipo` string del formulario (dato legado). *Descartados:*
   **campo oculto `tipos` en el `FormData`** (mezclaría DOM con chips que no son campos
   nativos, y habría que serializar el array a string) y **romper la firma** (tumbaría los
   72 tests actuales sin necesidad; el parámetro opcional los mantiene en verde).
4. **«FOAM» → «Espuma» vive SOLO en la migración** (`migrarTipos`: carga e importación),
   no en `normalizarTipos` ni en el guardado: un «FOAM» escrito a mano se guarda como
   texto libre y se migra al recargar, **igual que desde la 009**. *Descartada:* aplicar
   la regla también al guardar (cambiaría un comportamiento vigente sin pedirlo).
5. **El límite de 40 caracteres es solo del formulario** (el `maxlength` del input); ni
   `añadirTipoLibre` ni `normalizarTipos` truncan. *Descartada:* truncar en lógica —
   rompería RF-1202/RF-1209: una migración o una importación con un tipo largo deben
   conservarlo íntegro.
6. **Un chip fijo alternado off/on vuelve al FINAL del orden** (Decisión 5 de la spec):
   puede cambiar `tipos[0]`, el canto y el `tipo` visible en lectores antiguos.
   *Descartada:* restaurar la posición anterior — exigiría guardar índices en el estado
   sin beneficio comercial; el orden es de adición.
7. **La celda «Tipo» la produce `unirTiposTexto` en lógica pura** (texto plano « + »,
   «Sin tipo» si vacío). *Descartadas:* unir el texto en `app.js` (RF-1211 exige lógica
   pura testeable sin DOM) y badges con HTML en la celda (RF-1004 exige solo texto y la
   013 imprime texto).
8. **Los chips fijos del formulario se generan desde `TIPOS_FIJOS`** (constante única de
   la que pende `esTipoFijo`). *Descartada:* escribir los tres chips a mano en
   `index.html` — dos fuentes que divergirían al tocar la 015.

## 7. Cobertura de RF

| Parte | RF |
|---|---|
| §1 `TIPOS_FIJOS`, `normalizarTipos`, `tiposCliente`, `migrarTipos` | RF-1201, RF-1202 |
| §1 `alternarTipoFijo`/`añadirTipoLibre`/`quitarTipoLibre` | RF-1203 |
| §1 `construirCliente`/`actualizarCliente`/`aplicarEdicion` con `tipos` | RF-1204 |
| §1 `filtrarClientes` por pertenencia | RF-1205 |
| §1 `textoBusquedaCliente` con todos los tipos | RF-1206 |
| §1 `unirTiposTexto` + `construirCeldas` | RF-1208 |
| §1 `importarClientes` conserva `tipos` | RF-1209 |
| §2 tests | RF-1211 (y todos por cobertura) |
| §3 + §4 chips del formulario y badges | RF-1203, RF-1207 |
| §5 estado en memoria, pintado, guardar en ambas ramas | RF-1203, RF-1204, RF-1210 |
| §5 tarjeta: badges + canto del primer tipo | RF-1207 |
| §5 fila del listado | RF-1208 |
| §8 verificación | todos |

## 8. Verificación

- `node --check logica.js app.js` + **`node --test` en verde** (72 actuales — con los de
  claves actualizados para incluir `tipos` — más los nuevos de §2), **sin DOM**, en
  rojo→verde por fase.
- **Chrome DevTools** (abriendo `index.html`):
  - **Formulario con chips**: los tres fijos alternan (marcado visible sin depender solo
    del color, `aria-checked`); «Añadir» y Intro crean chips libres; «Tela» escrita a
    mano marca el fijo (sin libre duplicado); «tela» minúscula crea libre; «×» quita
    libres; texto > 40 caracteres truncado **solo** por el `maxlength` del input;
    edición carga los tipos del cliente (fijos marcados, libres con «×»); guardar y
    reabrir no cambia nada; guardar sin tipos → `tipos: []` y `tipo: ""`.
  - **Filtros por pertenencia**: pestañas intactas (textos/colores); «Tela+Espuma»
    aparece en «Tela» y «Espuma»; «Tela+Toldos» en «Tela» y «Otros»; sin tipos solo en
    «Todos»; contador correcto; «No hay clientes de tipo X» cuando corresponde.
  - **Tarjeta**: un badge por tipo en su color (fijos paleta, libres violeta), canto =
    **primer tipo**, «Sin tipo» sin canto; cliente de un tipo idéntico al actual.
  - **Listado (012) e impresión (013)**: celda Tipo = `Tela + Espuma + Toldos` con «…» +
    `title` si es larga; imprimir (botón y `beforeprint` despachado) reproduce ese texto;
    regresión de la 013: sin chrome, cabecera de contexto.
  - **Copia de seguridad (011)**: exportar → JSON con `tipos` **y** `tipo`; importar un
    fichero **antiguo** (solo `tipo`, con «FOAM») → migrado; importar un fichero **nuevo**
    (con `tipos` array y con `tipos` no array) → normalizado; basura → literales de error
    intactos y datos sin tocar.
  - **Migración en las tres rutas**: (a) **web** — `localStorage` sembrado con clientes de
    12 campos («FOAM» incluido), recargar → migrados y clave con `tipos`; segunda recarga
    → sin escritura (comparar el string antes/después); (b) **escritorio simulado** — en
    consola, montar un doble de `window.gestorDatos` (`leer`/`escribir` sobre un array en
    memoria que hace de `clientes.json`) y reejecutar la rama de carga → mismas
    garantías; (c) **importar** — cubierta arriba.
  - **Teclado**: Tabulador alcanza chips y «Añadir» con foco visible; Intro/Espacio
    alternan; Intro en el campo añade.
  - Móvil **375 px**: chips envueltos y badges envueltos, sin desbordes ni scroll
    horizontal; objetivos ≥ 44 px.
  - **Sin claves nuevas**: `Object.keys(localStorage)` ⇒ solo `gestorClientes`;
    `clientes.json` solo cambia con altas/ediciones/migración.
  - **Consola limpia**; regresiones 002/005/011/012/013 (editar, buscar, filtros,
    exportar/importar, listado, imprimir).
- Datos de prueba borrados (`localStorage.removeItem("gestorClientes")`); commits por
  fases.

## 9. Documentación y cierre

- `AGENTS.md`: esquema de datos con `tipos`, formulario con **chips** (fin del
  desplegable/«Otros» de la 008), filtros **por pertenencia** y nota de compatibilidad
  «solo lectura» de `tipo` (RF-1211).
- `MEMORY.md`: línea de la 014 con el número de tests y las decisiones clave; marcar
  spec, plan y tasks como implementados **al cierre** (el estado «implementado» lo pondrá
  el cierre, no este plan).
