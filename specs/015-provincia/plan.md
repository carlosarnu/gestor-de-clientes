# Plan — Spec 015 · Provincia del cliente

| Campo | Valor |
|---|---|
| **Spec** | `specs/015-provincia/spec.md` (borrador) |
| **Fecha** | 2026-10-17 |
| **Dependencia** | Empieza **después** de cerrar la **014-tipos-multiples**: comparte `logica.js`, `app.js`, `index.html` y `CATALOGO_CAMPOS`. Todo lo de este plan está redactado para el estado **post-014** (esquema `…, codigoPostal, provincia, tipos, tipo, notas` y formulario con chips de tipos). |
| **Verificación** | `node --test` (nuevos tests en `test-provincia.js`) + Chrome DevTools (pantalla, 375 px, consola limpia) + `npm start` en `escritorio/` |

---

## 1. Archivos y responsabilidades

| Archivo | Qué se toca | RF |
|---|---|---|
| `logica.js` | **Solo lógica pura**: tolerancia de lectura de `provincia`, provincias existentes/únicas, coincidencia normalizada, filtro por provincia, selección válida, `provincia` en el catálogo, en la búsqueda, en la construcción/edición/importación y en la cabecera de impresión | RF-1301, 1302, 1304, 1305, 1307, 1308, 1309 |
| `test-provincia.js` | **Archivo nuevo** de tests (`node --test` descubre `test-*.js`); no se toca `test-logica.js` (lo tiene la 014) | RF-1310 |
| `index.html` | Campo «Provincia» en el formulario; `<select id="filtro-provincia">` junto a las pestañas de tipo | RF-1302, RF-1305 |
| `styles.css` | Estilos del desplegable de provincia (objetivo táctil ≥ 44 px, hereda la estética de `.filtros`; envuelve a 375 px) | RF-1305 |
| `app.js` | Estado en memoria `filtroProvincia`, repoblado del desplegable, combinación en `visiblesActuales()`, línea de la ficha, alta/edición con `provincia`, mensajes vacíos, cabecera de impresión con provincia | RF-1302, 1303, 1305, 1306, 1308 |
| `AGENTS.md`, `MEMORY.md` | Documentación al cierre (esquema con `provincia`, filtro por provincia) | RF-1310 |

`escritorio/` **no se toca**: `provincia` viaja sola dentro del mismo array de
`clientes.json` (RF-1309). `docs/constitution.md` **no se toca** (no hay cambio de
principios).

## 2. Funciones puras nuevas o ampliadas (`logica.js`, sin DOM ni localStorage)

Todas trabajan sobre el texto recortado; ninguna escribe nada.

### 2.1 Tolerancia de lectura — `provinciaCliente(cliente)` (RF-1301)

```js
// «» si no hay cliente, no hay campo, no es texto o queda vacío tras recortar.
function provinciaCliente(cliente) {
  if (!cliente || typeof cliente !== "object") return "";
  return texto(cliente.provincia);   // texto() ya convierte a string y recorta
}
```

Se usa en la ficha, en el filtro, en la búsqueda y en el catálogo: **una sola** regla
de lectura para todos los caminos (web, escritorio e importación).

### 2.2 Provincias existentes — `provinciasExistentes(lista)` (RF-1305)

```js
// [{ valor, normalizada }] únicas por `normalizar()` (acentos/mayúsculas fuera),
// sin vacíos, mostrando la PRIMERA forma guardada, en orden alfabético (localeCompare "es").
function provinciasExistentes(lista) {
  const únicas = new Map();
  for (const cliente of lista) {
    const valor = provinciaCliente(cliente);
    if (valor === "") continue;
    const clave = normalizar(valor);
    if (!unicas.has(clave)) unicas.set(clave, valor);
  }
  return Array.from(unicas.values())
    .sort(function (a, b) { return a.localeCompare(b, "es"); });
}
```

### 2.3 Coincidencia y filtro (RF-1305)

```js
// true si la provincia del cliente normaliza igual que la pedida.
function coincideProvincia(cliente, provincia) {
  const pedida = normalizar(provincia);
  return pedida !== "" && normalizar(provinciaCliente(cliente)) === pedida;
}

// Filtro en Y con el tipo: vacío o «Todas» ("" o "Todos") → la lista tal cual.
function filtrarPorProvincia(lista, provincia) {
  const pedida = texto(provincia);
  if (pedida === "") return lista;
  return lista.filter(function (c) { return coincideProvincia(c, pedida); });
}
```

### 2.4 Selección válida — `provinciaValida(lista, seleccion)` (RF-1305)

```js
// La selección si sigue existiendo en la lista; si no, "" («Todas las provincias»).
function provinciaValida(lista, seleccion) {
  const pedida = texto(seleccion);
  if (pedida === "") return "";
  return lista.some(function (c) { return coincideProvincia(c, pedida); })
    ? pedida : "";
}
```

### 2.5 Ampliaciones de funciones existentes

| Función | Cambio | RF |
|---|---|---|
| `textoBusquedaCliente(cliente)` | añadir `provinciaCliente(cliente)` a la cadena que se normaliza y se busca (multi-palabra «y» de la 005 queda gratis) | RF-1304 |
| `CATALOGO_CAMPOS` | entrada `{ clave: "provincia", etiqueta: "Provincia" }` **entre «Código postal» y «Tipo»**; `construirCeldas` **no necesita rama nueva** (el `else` ya hace `texto(cliente[clave]) \|\| "—"`) | RF-1307 |
| `construirCliente(datos, id, fecha)` / `actualizarCliente(actual, datos)` | añadir `provincia: texto(datos.get("provincia"))` (recortado; vacío = `""`) | RF-1302 |
| `importarClientes(textoJson)` | normalizar `provincia` con `texto()` en el mapeo (ausente → `""`); los literales de error quedan intactos | RF-1309 |
| `textoContextoImpresion(filtro, busqueda, provincia)` | **tercer parámetro opcional**: `if (provinciaLimpia !== "") piezas.splice(-1 o push)` → «Provincia: X» entre «Filtro: …» y «Búsqueda: …»; sin provincia el texto es idéntico al actual (test de regresión) | RF-1308 |

`module.exports` ampliado con `provinciaCliente`, `provinciasExistentes`,
`coincideProvincia`, `filtrarPorProvincia`, `provinciaValida`.

## 3. Interfaz (`index.html`, `styles.css`, `app.js`)

### 3.1 Formulario (RF-1302)

```html
<div class="campo">
  <label for="provincia">Provincia</label>
  <input type="text" id="provincia" name="provincia" autocomplete="address-level2">
</div>
```

- Se coloca **después de «Código postal»** y antes de «Tipo de cliente» (014: los
  chips). Sin `required`, sin `maxlength`.
- `app.js`: el `FormData` del submit ya lo recoge (mismo patrón que el resto);
  `iniciarEdicion` carga `formulario.provincia.value = provinciaCliente(cliente)`;
  `resetearFormulario` no necesita nada extra (el `reset()` del formulario lo limpia,
  igual que el resto).

### 3.2 Filtro por provincia (RF-1305)

```html
<label class="filtro-provincia" for="filtro-provincia">Provincia</label>
<select id="filtro-provincia" class="filtro-provincia-select">
  <option value="" selected>Todas las provincias</option>
</select>
```

- Junto al bloque `.filtros` (pestañas de tipo), como un control más de la misma
  cabecera; en `styles.css` se le da altura mínima 44 px y los colores de la paleta
  (tinta sobre el mismo fondo de los botones), sin sombras (spec 003).
- **Estado en memoria**: `let filtroProvincia = ""` (junto a `filtroActivo`,
  `vistaActual`, `textoBusqueda`). No se persiste nada.
- **Pintado** `pintarFiltroProvincia()`:
  1. `const provincias = provinciasExistentes(filtrarClientes(clientes, filtroActivo))`
     (provincias del tipo activo: al cambiar de pestaña el desplegable enseña lo que
     hay **ahora**);
  2. `filtroProvincia = provinciaValida(provincias, filtroProvincia)` (si ya no existe,
     vuelve a `""`);
  3. se reconstruye el `<select>`: la opción «Todas las provincias» + una por provincia
     (selección conservada si existe).
- **Eventos**: `change` del desplegable → `pintarFiltroProvincia(); pintarLista();`.
- **Dónde se llama** `pintarFiltroProvincia()`: al arrancar, en el `click` de las
  pestañas de tipo (tras actualizar `filtroActivo`), en el `submit` de alta (tras volver
  a «Todos», **y** limpiando `filtroProvincia = ""` como la 010 limpia la búsqueda), en
  `guardarEdicion`, en `eliminarCliente` y en la importación. La orden es siempre
  **antes** de `pintarLista()`.

### 3.3 Lista, contador y estados vacíos (RF-1305, RF-1306)

```js
function visiblesActuales() {
  const porTipo = filtrarClientes(clientes, filtroActivo);
  const porProvincia = filtrarPorProvincia(porTipo, filtroProvincia);
  return buscarClientes(porProvincia, textoBusqueda);
}
```

- El contador usa `visibles.length` (ya refleja tipo + provincia + búsqueda).
- Estados vacíos en `pintarLista()`, **insertando la rama de provincia entre la de
  búsqueda y la de tipo** (prioridad búsqueda → provincia → tipo → vacío):

```js
} else if (filtroProvincia.trim() !== "") {
  mensaje = "No hay clientes en «" + escapar(filtroProvincia.trim()) +
    "». Prueba con «Todas las provincias» o con la pestaña «Todos».";
}
```

  Los textos actuales quedan **literales e intactos**.

### 3.4 Ficha y listado (RF-1303, RF-1307)

- `crearTarjeta()`: una línea más en el `<dl>`, justo tras «Código postal»:
  `fila("Provincia", cliente.provincia)` — `fila()` ya devuelve `""` con valor vacío,
  así que **no se muestra** en las fichas antiguas.
- Listado: sin cambios de código (el catálogo manda); la celda vacía ya sale «—» y el
  texto largo ya aplica «…» + `title`.

### 3.5 Impresión (RF-1308)

- `beforeprint`: `textoContextoImpresion(filtroActivo, textoBusqueda, filtroProvincia)`.
- El `@media print` **no se toca**: la columna se imprime porque 013 ya imprime lo que
  se ve.

## 4. Decisiones del plan (por qué, y qué se descarta)

1. **Provincia comparada con `normalizar()`** (mismo normalizador que el buscador de la
   005). *Descartado:* comparación exacta → «Cádiz» y «cadiz» serían dos provincias.
2. **Desplegable repoblado desde la lista filtrada por tipo**, con selección estable.
   *Descartado:* repoblar desde **toda** la lista enseñaría provincias sin clientes del
   tipo activo (filtros sin salida).
3. **Una sola regla de lectura (`provinciaCliente`) para ficha, filtro, búsqueda,
   catálogo e importación.** *Descartado:* `cliente.provincia || ""` suelto por
   `app.js` (con `0` o `false` daría comportamientos distintos según el sitio).
4. **Estado en memoria, sin clave nueva** (RF-1006 de la 012 intacta). *Descartado:*
   persistir el filtro en `localStorage` (prohibido por la propia spec y cambia el
   arranque del padre).
5. **La rama de provincia en el mensaje vacío va después de la de búsqueda** (si el
   usuario está buscando, eso es lo que quiere resolver). *Descartado:* provincia
   primero (escondería el error de la búsqueda).
6. **`test-provincia.js` aparte.** *Descartado:* `test-logica.js` (en manos de la 014).

## 5. Estrategia de tests (`node --test`, puro, sin DOM)

Archivo `test-provincia.js` (requiere `logica.js` con `require("./logica.js")`, mismo
patrón que `test-logica.js`). Casos mínimos (rojo → verde):

1. **Lectura tolerante**: sin `provincia`, `provincia: undefined`, `null`, número `29`,
   `false`, objeto, `  Málaga  ` → `["", "", "", "29", "false", "[object Object]",
   "Málaga"]`.
2. **Provincias existentes**: lista con `["Cádiz", "cadiz", " MÁLAGA ", "", "Málaga",
   undefined]` → `["Cádiz", "MÁLAGA"]` (únicas por normalización, primera forma, orden
   alfabético «es», vacíos fuera) y **orden** comprobado.
3. **`coincideProvincia`**: «Cádiz» vs «cadiz» → `true`; sin provincia → `false`;
   filtro vacío → sin filtrar.
4. **`filtrarPorProvincia`**: `""`/`"Todos"` → lista completa; con provincia → solo
   coincidentes; combinado con `filtrarClientes` (tipo) → intersección.
5. **`provinciaValida`**: sigue → se conserva; no sigue → `""`.
6. **Búsqueda**: `textoBusquedaCliente` de un cliente con provincia encuentra «malaga»
   para `provincia: "Málaga"`; multi-palabra repartida entre provincia y otro campo.
7. **Catálogo**: `CATALOGO_CAMPOS` tiene 12 entradas (11 + «Provincia»), con «Provincia»
   **entre** `codigoPostal` y `tipo`, y `normalizarSeleccion` la acepta.
8. **Celdas**: cliente sin provincia → celda «—»; con provincia → su texto.
9. **Alta/edición**: `construirCliente` escribe `provincia: "Málaga"` con el campo
   `  Málaga  ` y `""` vacío; `actualizarCliente` cambia solo `provincia` y conserva
   `id`/`fecha` y el resto.
10. **Importación**: JSON antiguo sin `provincia` → todos con `""`; con `provincia`
    presente → recortada; JSON inválido → literales de error intactos.
11. **Impresión**: `textoContextoImpresion("Tela", "", "")` es **idéntico** al texto
    actual («Gestor de Clientes · Filtro: Tela»); con provincia → «Gestor de Clientes ·
    Filtro: Tela · Provincia: Málaga»; provincia sola → «Gestor de Clientes ·
    Provincia: Málaga».

## 6. Checklist de verificación final (§8 del flujo)

- [ ] `node --test` en verde (tests de `test-provincia.js` + los existentes intactos).
- [ ] Web en navegador: alta con provincia (ficha con línea), edición (cambia solo
      provincia), borrado, **filtro por provincia** solo y **combinado con tipo**,
      buscador por provincia, contador, los cuatro mensajes vacíos, listado con la
      columna elegida, impresión (cabecera con «Provincia: X» y columna en papel),
      regresiones 005/012/013 y 014 (si ya está cerrada).
- [ ] Datos antiguos: importar un JSON sin `provincia` → nada cambia y **no se reescribe
      el almacenamiento** (comprobar en Application → localStorage que no aparece el
      campo en los clientes que no lo llevaban).
- [ ] Móvil 375 px sin desbordes (desplegable incluido); teclado (Tab/Intro en el
      desplegable); consola **limpia**.
- [ ] `cd escritorio && npm start`: un cliente con provincia aparece en
      `Documentos\Gestor de Clientes\clientes.json` y un `clientes.json` antiguo se abre
      sin tocar nada.
- [ ] Al terminar: borrar los datos de prueba
      (`localStorage.removeItem("gestorClientes")`).
- [ ] `AGENTS.md` (esquema con `provincia`, campo de formulario, filtro por provincia) y
      `MEMORY.md` al día; spec/plan/tasks marcados como implementados; commits por
      fases; **regenerar el instalador** (`cd escritorio && npm run build`) cuando
      cierren la 014 y la 015.
