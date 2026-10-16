# Plan — Spec 012 · Listado compacto con selector de campos

**Estado:** aprobado por el usuario (2026-10-16) e implementado

---

## 1. `logica.js` — lógica pura nueva (RF-1002, RF-1004, RF-1005)

| Función / constante | Detalle | RF |
|---|---|---|
| `CATALOGO_CAMPOS` (constante) | **Única** lista `{ clave, etiqueta }` con los 11 campos elegibles, en orden del formulario y con «Fecha de alta» al final; `id` nunca aparece. De ella penden el selector y las columnas (preparada para «Provincia» de la 015 y «Tipo» múltiple de la 014). | RF-1002 |
| `normalizarSeleccion(claves)` | Filtra lo que no esté en el catálogo, quita duplicados y respeta el orden del catálogo; si queda vacía → `["empresa"]`. | RF-1002, RF-1005 |
| `alternarCampo(seleccion, clave)` | Devuelve una selección nueva con `clave` alternada y normalizada (si queda vacía → «solo Empresa»), sin mensajes de error. | RF-1002 |
| `fechaTextoLocal(fecha, hoy)` | `dd/mm/aaaa` con los **métodos locales** del `Date` (nunca `toISOString`) reutilizando **`dosDigitos()`** de `logica.js` (Decisión 11 de la spec); devuelve `""` si la fecha no es un número finito o es posterior a `hoy` + 1 día (fecha inválida). | RF-1002, RF-1005 |
| `construirCeldas(cliente, campos, hoy)` | `[{ clave, etiqueta, valor }]` aplicando las convenciones: empresa → **«Sin nombre»**, tipo → **`nombreTipo`** («Sin tipo» o el texto libre de la 008), fecha → `fechaTextoLocal`, resto → `texto(...) || "—"`. **Solo datos: sin HTML**. | RF-1004, RF-1005 |
| `construirFilas(clientes, campos, hoy)` | `[{ id, celdas }]` conservando el orden de entrada (más reciente primero). | RF-1003, RF-1005 |

- **`hoy` (Date) se inyecta** como reloj: hace la lógica determinista en tests y define la fecha inválida (skill `local-dates`: métodos locales, ceros con `dosDigitos`).
- **`module.exports`:** se añaden las funciones nuevas **y `dosDigitos`** (hoy no está exportada; sin exportarla los tests no cubren el relleno de ceros que ya usa `nombreArchivoExportacion`). *Alternativa descartada:* replicar el relleno de ceros en `app.js` (código duplicado con la función ya existente).

## 2. `test-logica.js` — tests nuevos en rojo→verde (RF-1005)

`node --test`, **sin DOM** (solo se importa `logica.js`; ningún test toca `document`):

- `CATALOGO_CAMPOS`: 11 campos, «Fecha de alta» al final, `id` ausente, sin duplicados.
- `normalizarSeleccion`: desconocidos fuera, vacío o todo inválido → `["empresa"]`, orden del catálogo.
- `alternarCampo`: marcar/desmarcar y el último en desmarcarse vuelve a «solo Empresa».
- `fechaTextoLocal`: dd/mm/aaaa con ceros, fecha local (alta de las 00:30 del día 1 ⇒ ese día), no finita o futura respecto a `hoy` → `""`.
- `construirCeldas`: «Sin nombre», «Sin tipo», texto libre («Toldos») y «—» en el resto; etiqueta y valor por celda, sin marcas HTML.
- `construirFilas`: mismo número y orden que la lista de entrada; `id` conservado.
- `dosDigitos`: exportada y probada directamente.

## 3. `index.html` (RF-1001, RF-1002)

- **Conmutador** en la cabecera de la lista (`lista-cabecera`): dos `<button data-vista>` «Tarjetas» (activo por defecto, `aria-pressed`) ↔ «Listado».
- **`#selector-campos`**: contenedor de los chips, generado desde el catálogo y **oculto** mientras la vista sea «Tarjetas», entre los filtros y la lista.
- El `<table class="listado">` (cabecera de columnas + filas) lo genera `app.js` dentro de `#lista-clientes`.

## 4. `styles.css` (RF-1001, RF-1002, RF-1003, RF-1004)

| Cambio | Detalle |
|---|---|
| `.conmutador` / `.vista-activa` | Dos botones con estado activo visible (texto + fondo, no solo color), objetivo ≥ 44 px y `:focus-visible`. |
| `.chips` / `.chip` / `.chip.marcado` | Chips con «estado de casilla» (`aria-checked` + palomita/estado visible), ≥ 44 px, foco visible. |
| `.listado`, cabecera y `.fila` | Tabla en pantalla ancha; celdas en **una sola línea** con `text-overflow: ellipsis` y `title`. |
| Canto de color por fila | `.fila-tela` / `.fila-espuma` / `.fila-estructuras` / `.fila-otros` con las variables de materiales ya existentes (RF-1004, Decisión 7). |
| `.fila.editando` | Mismo resaltado que `.tarjeta.editando`: anillo `var(--anillo)` + bordes en tinta **alrededor de la fila entera** (RF-1003). |
| `.confirmacion` en la celda de acciones | Reutiliza el estilo actual de «¿Seguro?» de la tarjeta; solo cambia el contenido de la celda de acciones, el resto de la fila no se toca (RF-1003). |
| `@media (max-width: 768px)` | Filas apiladas etiqueta+valor dentro de cada celda, sin scroll horizontal a 375 px. |

## 5. `app.js` (RF-1001 a RF-1004, RF-1006)

| Cambio | Detalle |
|---|---|
| Estado de vista (solo memoria) | `let vistaActual = "tarjetas"` y `let camposSeleccionados = ["empresa"]` junto a `filtroActivo`. **Cero escrituras nuevas:** no hay ninguna `localStorage.setItem` fuera de `guardarClientes` (RF-1006); al recargar el estado vuelve solo a estos valores. |
| `pintarConmutador()` / `pintarChips()` | Pintan el conmutador y los chips desde `CATALOGO_CAMPOS`; los chips solo se pintan/enseñan en listado. |
| Listeners nuevos | Clic en el conmutador → cambia `vistaActual` + `pintarLista()`; clic en un chip → `alternarCampo()` + `pintarChips()` + `pintarLista()`. |
| `pintarLista()` | Antes de ramificar reutiliza **el mismo** bloque de estados vacíos y el contador (mensajes idénticos a los de hoy, RF-1003); después: `vistaActual === "tarjetas"` → `crearTarjeta` como hoy; si no → `crearFila` a partir de `construirFilas(visibles, camposSeleccionados, new Date())`. |
| `crearFila(filaDatos)` | `<table>` con cabecera del catálogo + una fila por cliente: celdas (etiqueta + valor, `title`, escapado con `escapar()`) y **celda de acciones** con los mismos `data-accion`/`data-id` de la tarjeta: «Editar»/«Eliminar» o la confirmación «¿Seguro? · Sí, eliminar / No», y clase `editando` en la fila entera. |
| Sin cambios | El listener delegado de `listaClientes` («editar», «eliminar», «confirmar-si», «confirmar-no»), `iniciarEdicion`, `eliminarCliente` y `clienteEditandoId`/`confirmandoEliminarId` se reutilizan **tal cual**: misma mecánica que la tarjeta (RF-1003). |

## 6. Decisiones (con alternativa descartada)

1. **Sin persistencia:** la vista y la selección viven solo en memoria (`vistaActual`, `camposSeleccionados`). *Descartada:* clave nueva de `localStorage` para preferencias — descartada por el usuario (RF-1006, sin claves nuevas en web ni escritorio).
2. **Filas como `<table>` real** con `<thead>` y `<tbody>`; a ≤ 768 px el CSS la convierte en bloques etiqueta+valor. *Descartada:* `div` con `role="table"` (más marcas y peor semántica sin ganancia).
3. **Chips como `<button role="checkbox" aria-checked>`** (Tab/Intro/Espacio nativos del botón). *Descartada:* `input type="checkbox"` por chip (label y maquillaje del indicador nativo por cada chip, sin aportar más accesibilidad).
4. **Una sola ramificación en `pintarLista`:** estados vacíos, contador y filtro/búsqueda comunes a las dos vistas. *Descartada:* bloque de mensajes duplicado en la rama de listado (dos sitios que divergirían con la 013/014).
5. **Reutilizar el listener delegado existente** de `listaClientes` para las filas. *Descartada:* listener nuevo solo para filas (duplicaría la lógica de editar/eliminar y podría descincronizarse de la tarjeta).
6. **`dosDigitos` exportada y `fechaTextoLocal` en lógica pura** con `hoy` inyectado (Decisión 11 de la spec trasladada aquí). *Descartada:* formatear la fecha en `app.js` (rompería RF-1005: la fecha quedaría sin testear y con el reloj acoplado al DOM).
7. **Fecha inválida** = no numérica o posterior a `hoy` + 1 día → celda «—». *Descartada:* mostrar cualquier número (saldrían fechas absurdas como 01/01/1970 para un `id` mal importado) y rechazar solo lo no numérico (dejaría pasar saltos de reloj corruptos).

## 7. Cobertura de RF

| Parte | RF |
|---|---|
| §1 + §2 (lógica y tests) | RF-1002, RF-1004 (convenciones), RF-1005 |
| §3 + §4 (HTML/CSS conmutador, chips, responsive) | RF-1001, RF-1002, RF-1004 |
| §5 filas + estados vacíos | RF-1001, RF-1003, RF-1004 |
| §5 acciones en fila | RF-1003 |
| §5 estado en memoria sin escrituras | RF-1006 |
| §8 verificación | todos |

## 8. Verificación

- `node --check logica.js app.js` + **`node --test` en verde** con los tests nuevos (hoy 64), **sin DOM**.
- **Chrome DevTools** (abriendo `index.html`):
  - Conmutador: «Listado» pinta filas en el mismo clic y «Tarjetas» recupera el aspecto anterior; filtro, búsqueda y orden intactos.
  - Chips: marcar/desmarcar actualiza al instante; desmarcar el último vuelve a «solo Empresa» sin error.
  - Coherencia: mismo filtro + búsqueda ⇒ mismos clientes, mismo orden y mismo contador en ambas vistas.
  - Acciones en fila: «Editar» marca **toda la fila**; «Eliminar» pone «¿Seguro? · Sí, eliminar / No» **solo en la celda de acciones** con el resto visible; tras confirmar, fila fuera + «Cliente eliminado»; sin `confirm()`.
  - Celdas: «Sin nombre», «Sin tipo», texto libre y «—»; «Fecha de alta» en dd/mm/aaaa local; sin iframes ni enlaces de mapa en el listado.
  - Estados vacíos idénticos a los de tarjetas (lista vacía, búsqueda sin coincidencias, filtro sin resultados).
  - Teclado: Tabulador alcanza conmutador, chips y acciones con foco visible; Intro/Espacio actúan igual que el ratón.
  - Móvil 375 px con los 11 campos: sin desbordes ni scroll horizontal; objetivos ≥ 44 px.
  - **RF-1006:** `Object.keys(localStorage)` ⇒ solo `gestorClientes`; recarga ⇒ «Tarjetas» con solo «Empresa».
  - Consola limpia; en escritorio (`npm start`) se comprueba además que `clientes.json` solo cambia con altas/ediciones.
- Datos de prueba borrados (`localStorage.removeItem("gestorClientes")`); commits por fases.

## 9. Documentación y cierre

- `AGENTS.md`: funcionalidad 012 en «Funcionalidades implementadas» (conmutador, chips, sin persistencia).
- `MEMORY.md`: línea de la 012 con el número de tests.
