# Tareas — Spec 015 · Provincia del cliente

> **Dependencia:** empezar solo **después de cerrar la 014-tipos-multiples**
> (comparte `logica.js`, `app.js`, `index.html` y `CATALOGO_CAMPOS`).
> Orden de dependencia estricto: T-01 → T-02 → … → T-08.

---

- [x] **T-01 — Especificación aprobada**
  - **Descripción:** `spec.md`, `plan.md` y este `tasks.md` en `specs/015-provincia/`.
  - **RF:** RF-1301 a RF-1310.
  - **Hecho cuando:** el usuario aprueba spec, plan y tareas. *(Hecho: 2026-10-17 —
    «campo + filtro por provincia» pedido por el usuario y aprobación explícita del
    conjunto: «apruebo»)*

- [ ] **T-02 — Lógica pura: lectura tolerante, provincias, filtro, catálogo, búsqueda e impresión + tests (`logica.js` + `test-provincia.js`)**
  - **Descripción:** nuevas `provinciaCliente`, `provinciasExistentes` (únicas por
    `normalizar()`, primera forma, orden alfabético «es», vacíos fuera),
    `coincideProvincia`, `filtrarPorProvincia` (vacío/`"Todos"` = sin filtrar),
    `provinciaValida`; ampliaciones: `provincia` en `CATALOGO_CAMPOS` (entre
    `codigoPostal` y `tipo`, **12 entradas**), en `textoBusquedaCliente`, en
    `construirCliente`/`actualizarCliente` (texto recortado, vacío = `""`), en
    `importarClientes` (ausente → `""`, literales de error intactos) y
    `textoContextoImpresion(filtro, busqueda, provincia)` con el **tercer parámetro
    opcional**; todo exportado en `module.exports`. Tests en rojo→verde en el archivo
    **nuevo** `test-provincia.js` (los 11 bloques del plan §5), sin DOM y **sin tocar
    `test-logica.js` ni `app.js`**.
  - **RF:** RF-1301, RF-1302 (lógica), RF-1304, RF-1305 (lógica), RF-1307 (catálogo),
    RF-1308 (lógica), RF-1309 (lógica), RF-1310 (tests).
  - **Hecho cuando:** `node --test` en verde (tests nuevos + los existentes intactos);
    cubiertos: `provincia` ausente/no texto/espacios, únicas normalizadas y ordenadas,
    «Cádiz»≈«cadiz» solo en el filtro, filtro vacío sin filtrar, combinación con tipo,
    selección que desaparece, búsqueda multi-palabra con provincia, celda «—»,
    `construirCliente`/`actualizarCliente` recortando, importar con/sin `provincia`,
    literales de error intactos y cabecera de impresión **idéntica a la actual** cuando
    no hay provincia.

- [ ] **T-03 — HTML y CSS: campo «Provincia» y desplegable de filtro (`index.html` + `styles.css`)**
  - **Descripción:** campo `#provincia` (texto, `autocomplete="address-level2"`, sin
    `required` ni `maxlength`) **entre «Código postal» y «Tipo de cliente»**; junto a
    `.filtros`, `<select id="filtro-provincia">` con la única opción
    `<option value="" selected>Todas las provincias</option>`; CSS con objetivo táctil
    ≥ 44 px, tinta sobre el mismo fondo de los botones, sin sombras (003) y sin
    desbordes a 375 px.
  - **RF:** RF-1302, RF-1305 (markup/estilos).
  - **Hecho cuando:** el formulario muestra el campo en su posición y el filtro de
    provincia aparece junto a las pestañas; a 375 px no hay desbordes ni scroll
    horizontal; en pantalla no cambia nada más (el JS nuevo llega en T-04/T-05).

- [ ] **T-04 — `app.js`: provincia en el formulario (alta y edición)**
  - **Descripción:** el `submit` ya manda el campo vía `FormData` →
    `construirCliente`/`aplicarEdicion`; `iniciarEdicion` carga
    `formulario.provincia.value = provinciaCliente(cliente)`; el alta **vuelve a
    «Todos» y limpia `filtroProvincia = ""`** (coherencia con la limpieza de búsqueda
    de la 010). Sin claves nuevas de `localStorage`.
  - **RF:** RF-1302.
  - **Hecho cuando:** alta con «Málaga» guarda `provincia: "Málaga"` (con los espacios
    de los bordes recortados) y `""` si se deja vacío; la edición cambia **solo**
    `provincia` conservando `id`, `fecha` y el resto de campos; al editar se carga el
    valor; el filtro de provincia activo vuelve a «Todas» tras el alta.

- [ ] **T-05 — `app.js`: filtro por provincia (pintado, combinación, contador y estados vacíos)**
  - **Descripción:** `let filtroProvincia = ""`; `pintarFiltroProvincia()` (provincias
    de `filtrarClientes(clientes, filtroActivo)`, selección validada con
    `provinciaValida`, reconstrucción del `<select>`); `change` → repintar lista;
    `visiblesActuales()` = tipo → provincia → búsqueda; `pintarFiltroProvincia()`
    llamada al arrancar, al cambiar de pestaña, al alta, al editar, al borrar y al
    importar; rama de provincia en los estados vacíos **entre la de búsqueda y la de
    tipo**, con el texto literal de la spec (RF-1306).
  - **RF:** RF-1305, RF-1306.
  - **Hecho cuando:** «Cádiz»+tipo «Tela» muestra solo la intersección; los sin
    provincia solo en «Todas»; el contador refleja tipo + provincia + búsqueda; borrar
    el último cliente de la provincia activa repuebla y **vuelve solo a «Todas»**;
    cambiar de pestaña conserva la provincia si sigue existiendo; el mensaje vacío con
    provincia es el de la spec y los textos actuales quedan intactos.

- [ ] **T-06 — `app.js`: ficha con línea «Provincia» + verificación del listado (012)**
  - **Descripción:** `fila("Provincia", cliente.provincia)` en `crearTarjeta` justo
    tras «Código postal» (con `fila()` vacío no se pinta nada); el listado y la
    impresión no necesitan código (catálogo + «lo que se ve»); comprobar en navegador
    la columna y el papel.
  - **RF:** RF-1303, RF-1307, RF-1308 (interfaz).
  - **Hecho cuando:** la ficha con provincia muestra la línea tras «Código postal» y la
    sin provincia no la muestra; en el listado «Provincia» se puede elegir entre
    «Código postal» y «Tipo» con «—» si falta; al imprimir la columna sale y la
    cabecera dice «… · Provincia: Málaga · …».

- [ ] **T-07 — Integración y verificación completa (navegador + escritorio)**
  - **Descripción:** checklist del plan §6: regresiones 005/012/013/014, datos antiguos
    sin `provincia` (**comprobando que NO se reescribe** el almacenamiento al abrir),
    importar JSON con y sin `provincia`, escritorio con `npm start` (alta con provincia
    → `clientes.json`) y `clientes.json` antiguo sin tocar, teclado (Tab/Intro en el
    desplegable), móvil 375 px, consola limpia y datos de prueba borrados.
  - **RF:** RF-1301, RF-1309, RF-1310 (y regresión de todas).
  - **Hecho cuando:** todos los criterios de aceptación de la spec cumplidos en Chrome
    DevTools, `node --test` en verde y consola sin errores.

- [ ] **T-08 — Documentación y cierre**
  - **Descripción:** `AGENTS.md` (esquema con `provincia`, campo en el formulario,
    filtro por provincia y su repoblado, «provincia» como columna más del catálogo),
    línea de la 015 en `MEMORY.md` (y nota de **regenerar el instalador** cuando cierren
    014 y 015), marcar spec/plan/tasks como implementados y commits por fases.
  - **RF:** RF-1310.
  - **Hecho cuando:** docs al día, `node --test` en verde y commits hechos.
