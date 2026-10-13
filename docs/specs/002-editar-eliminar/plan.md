# Plan técnico — Spec 002: Editar y eliminar clientes

| Campo | Valor |
|---|---|
| **Spec** | `002-editar-eliminar` (aprobada) |
| **Archivo** | `docs/specs/002-editar-eliminar/plan.md` |
| **Archivos a modificar** | `index.html`, `styles.css`, `app.js` |
| **Reglas** | Constitución: sin frameworks, sin librerías, funciona con doble clic (`file://`), interfaz en español, código/variables en inglés y comentarios en español. |

Este documento dice **qué** cambiar y **dónde**, sin escribir el código completo. Los fragmentos son
mínimos, solo para ilustrar. El desglose paso a paso está en `tasks.md`.

---

## 1. Estado nuevo en JavaScript

Se añaden **dos variables globales** junto a las existentes (`clientes`, `filtroActivo`):

```js
let clienteEditandoId = null;      // id del cliente en edición, o null si no se está editando
let confirmandoEliminarId = null;  // id de la tarjeta mostrando "¿Seguro?", o null si no hay ninguna
```

Y tres referencias nuevas a elementos del DOM (junto a `formulario`, `listaClientes`, etc.):

```js
const tituloFormulario = document.getElementById("titulo-formulario");
const botonCancelar     = document.getElementById("boton-cancelar");
const toast             = document.getElementById("toast");
```

### Tabla de vida del estado

| Momento | `clienteEditandoId` | `confirmandoEliminarId` |
|---|---|---|
| Página recargada / primer pintado | `null` | `null` |
| Pulsar **«Editar»** en una tarjeta | `= id` del cliente | `null` (se limpia) |
| Pulsar **«Guardar»** en modo edición | `null` (sale del modo) | — |
| Pulsar **«Cancelar»** | `null` (sale del modo) | — |
| Pulsar **«Eliminar»** en una tarjeta | sin cambios | `= id` de esa tarjeta |
| Pulsar **«No»** en «¿Seguro?» | sin cambios | `null` |
| Pulsar **«Sí, eliminar»** en «¿Seguro?» | `null` **solo si** era el cliente editado | `null` |
| Cambiar de filtro | **sin cambios** (RF-013) | sin cambios |

Regla de oro: el modo edición **solo** termina al guardar, al cancelar o al eliminar al cliente
editado. Cambiar de filtro nunca lo toca.

---

## 2. Cambios en `index.html`

Los botones de la tarjeta **no** se tocan aquí: se generan desde JS en `crearTarjeta`. El HTML solo
cambia en el bloque del formulario y añade el contenedor del toast.

| # | Dónde (línea aprox.) | Qué se cambia | Por qué |
|---|---|---|---|
| 1 | `<section class="panel">` del formulario (línea 21) | Añadir `id="panel-formulario"` | Para que JS pueda marcar visualmente el panel en modo edición. |
| 2 | `<h2>Nuevo cliente</h2>` (línea 22) | Añadir `id="titulo-formulario"` | JS cambiará el texto a «Editar cliente» y lo restaurará (RF-003). |
| 3 | Botón `type="submit"` (línea 71) | Añadir `id="boton-guardar"` | JS cambiará su texto entre «Guardar cliente» y «Guardar cambios». |
| 4 | Dentro del `.campo.campo-completo` del botón Guardar | Envolver el submit en `<div class="acciones-formulario">` y añadir tras él: `<button type="button" class="boton-secundario" id="boton-cancelar" hidden>Cancelar</button>` | Botón Cancelar oculto por defecto (`hidden`), visible solo en modo edición (RF-003). `type="button"` para que no dispare el `submit`. |
| 5 | Antes de `<script src="app.js"></script>` (línea 94) | Añadir: `<div class="toast" id="toast" role="status" aria-live="polite"></div>` | Contenedor fijo del aviso breve (RF-012). Sin `hidden`: se muestra/oculta con CSS. |

Ningún otro bloque del HTML cambia. La lista, los filtros y los campos del formulario se mantienen
idénticos: el formulario es el mismo para crear y para editar (decisión P1).

---

## 3. Cambios en `app.js`

### 3.1 Funciones nuevas

| Función | Responsabilidad |
|---|---|
| `buscarCliente(id)` | Devuelve el objeto cliente con ese `id` o `null`. Se usa desde edición y eliminación. |
| `iniciarEdicion(id)` | Pone `clienteEditandoId = id`, limpia `confirmandoEliminarId`, rellena **todos** los campos del formulario con los datos del cliente, llama a `pintarFormularioModo()` y `pintarLista()`, y hace scroll suave hasta el formulario. |
| `pintarFormularioModo()` | **Único** punto que sincroniza la UI del formulario con el estado: si `clienteEditandoId === null` → título «Nuevo cliente», botón «Guardar cliente», `botonCancelar.hidden = true`, quita la clase `modo-edicion` al panel; si no → «Editar cliente», «Guardar cambios», `botonCancelar.hidden = false`, añade `modo-edicion`. Centralizarlo aquí evita estados a medias (riesgo 6). |
| `cancelarEdicion()` | `clienteEditandoId = null`, `formulario.reset()`, `pintarFormularioModo()`. No toca `localStorage` ni muestra toast (RF-006). |
| `guardarEdicion(datos)` | Camino de edición del `submit`: busca el cliente; si no existe, cancela. Reescribe solo los campos de datos conservando `id` y `fecha` (RF-007); `guardarClientes()`; sale del modo (reset + `pintarFormularioModo()`); `pintarLista()`; `pintarAviso("Cliente actualizado")` (RF-012). |
| `eliminarCliente(id)` | `clientes = clientes.filter(c => c.id !== id)`; si el eliminado era el editado, sale del modo edición; limpia `confirmandoEliminarId`; `guardarClientes()`; `pintarLista()` (recalcula contador y filtro, RF-010); `pintarAviso("Cliente eliminado")`. |
| `pintarAviso(mensaje)` | Muestra el `<div id="toast">` con el texto, usando `classList.add("visible")`. Limpia el temporizador anterior (`clearTimeout`) y oculta a los ~2,5 s con `setTimeout`. Ver sección 5. |

### 3.2 Funciones modificadas

**a) Listener `submit` de `#formulario-cliente`** — se convierte en un bifurcador al principio:

```js
evento.preventDefault();
if (!formulario.checkValidity()) { formulario.reportValidity(); return; }
const datos = new FormData(formulario);

if (clienteEditandoId !== null) { guardarEdicion(datos); return; }
// ... resto del camino de creación actual, SIN cambios
```

El camino de creación (alta de v1) queda intacto: mismos campos, mismo `push`, mismo `reset()`.

**b) `crearTarjeta(cliente)`** — se le añade el pie de la tarjeta. El HTML pasa a ser:

```
<article class="tarjeta [editando]">          ← clase "editando" si cliente.id === clienteEditandoId
  <div class="tarjeta-cabecera">…</div>        ← sin cambios
  <dl class="datos-cliente">…</dl>             ← sin cambios
  <p class="notas">…</p>                       ← sin cambios
  ┌ si confirmandoEliminarId === cliente.id ────────────────┐
  │ <div class="confirmacion">                              │
  │   <span>¿Seguro?</span>                                 │
  │   <button data-accion="confirmar-si"  data-id="…">Sí</button>   │
  │   <button data-accion="confirmar-no"  data-id="…">No</button>   │
  │ </div>                                                  │
  └─────────────────────────────────────────────────────────┘
  ┌ si no ──────────────────────────────────────────────────┐
  │ <div class="tarjeta-acciones">                          │
  │   <button class="boton-tarjeta boton-editar"   data-accion="editar" data-id="…">Editar</button> │
  │   <button class="boton-tarjeta boton-eliminar" data-accion="eliminar" data-id="…">Eliminar</button> │
  │ </div>                                                  │
  └─────────────────────────────────────────────────────────┘
</article>
```

Es decir: **o** los botones normales **o** el paso de confirmación, nunca a la vez (RF-008). El
`data-id` se rellena con `cliente.id` (siempre numérico) y **todos** los textos pasan por `escapar()`
como ya hace la función.

**c) Delegación de clics en la lista** — nuevo listener en `listaClientes` (mismo patrón que el de
`#filtros`, que ya funciona con `evento.target.closest`):

```js
listaClientes.addEventListener("click", function (evento) {
  const boton = evento.target.closest("[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  // editar → iniciarEdicion(id)
  // eliminar → confirmandoEliminarId = id; pintarLista();
  // confirmar-si → eliminarCliente(id)
  // confirmar-no → confirmandoEliminarId = null; pintarLista();
});
```

El estado de confirmación vive en la variable global y **se regenera en cada pintado**, así que el
re-pintado con `innerHTML` no pierde nada.

**d) Listener de clics en `#filtros`** — **sin cambios**. Simplemente no se añade ninguna línea que
toque `clienteEditandoId`: así se cumple RF-013 de forma automática.

**e) `pintarFiltros()` y `pintarLista()`** — sin cambios de lógica. `pintarLista` ya recalcula
contador y visibles en cada llamada, por lo que basta con llamarla tras cada operación.

### 3.3 Flujo completo de la edición

1. «Editar» → `iniciarEdicion(id)` → formulario relleno + título «Editar cliente» + Cancelar visible.
2. El comercial modifica campos.
3. «Guardar» → validación del navegador (mismas reglas: empresa, teléfono y tipo) → `guardarEdicion(datos)`.
   - Validación falla → `reportValidity()` y **no se toca nada** (RF-005): se sigue en modo edición.
   - Validación OK → cliente actualizado con `id`/`fecha` originales → modo cerrado → toast.
4. «Cancelar» → `cancelarEdicion()` → formulario vacío, `localStorage` intacto (RF-006).

---

## 4. Cambios en `styles.css`

Todas las clases nuevas siguen el diseño actual (tras el rediseño de la spec `003-retrovisual`:
paneles blancos con borde `--linea` y radio 6-8 px, tinta `#1d241f` como color de acción, colores de
material en `--tela`/`--foam`/`--estructuras`, tipografía heredada con `font: inherit`).

| Clase | Qué es | Estilo resumido |
|---|---|---|
| `.acciones-formulario` | Contenedor de Guardar + Cancelar | `display: flex; gap: 10px; flex-wrap: wrap;` En móvil cada botón puede ocupar su fila; a partir de 700 px se ven en línea. |
| `.boton-secundario` | Botón «Cancelar» | Gris (`background #f3f4f6`, borde `#d1d5db`), mismo padding/radio que `.boton-principal`. |
| `.tarjeta-acciones` | Pie de la tarjeta con Editar/Eliminar | `display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e7eb` (mismo recurso visual que `.notas`). |
| `.boton-tarjeta` | Base de ambos botones | `font: inherit; flex: 1; padding: 10px; border-radius: 8px; cursor: pointer;` → ambos botones a ancho repartido, cómodos con el pulgar (mobile-first, P5). |
| `.boton-editar` / `.boton-eliminar` | Variantes | Editar: fondo blanco, texto y borde en tinta. Eliminar: fondo blanco, texto `--peligro` y borde `--peligro-linea`. |
| `.confirmacion` | Paso «¿Seguro?» dentro de la tarjeta | `display: flex; align-items: center; gap: 8px;` sin fondo: separada por `border-top: 1px solid var(--linea-suave)`. El texto «¿Seguro?» en `font-weight: 700` con color `--peligro`. |
| `.boton-si` / `.boton-no` | «Sí, eliminar» (rojo sólido con texto blanco) y «No» (gris) | Reutilizan el aspecto de los botones existentes. |
| `.tarjeta.editando` | Resaltado de la tarjeta en edición | Cambia los bordes superior/derecho/inferior a `var(--tinta)` (el canto izquierdo conserva el color del material) + `box-shadow: 0 0 0 3px rgba(29,36,31,.12)`. |
| `#panel-formulario.modo-edicion` | Indicación de modo edición en el formulario | `border-color: var(--tinta); box-shadow: 0 0 0 3px rgba(29,36,31,.12);` Refuerzo visual junto al cambio de título (RF-003). |
| `.toast` | Aviso flotante | `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(8px);` fondo `var(--tinta)`, texto blanco, radio 999 px, `max-width: calc(100% - 32px); opacity: 0; visibility: hidden; transition: .25s; z-index: 10; pointer-events: none;` |
| `.toast.visible` | Estado mostrado | `opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0);` |

**Nota sobre el toast:** no se usa el atributo `hidden` (que tiene `display: none` por CSS y
obligaría a alternarlo desde JS); se controla solo con `opacity`/`visibility` + la clase `visible`.

---

## 5. Toast: implementación nativa simple

- Un único `<div class="toast" id="toast" role="status" aria-live="polite">` fijo en `index.html`
  (sin librerías, sin dependencias).
- `pintarAviso(mensaje)` escribe `mensaje` con `textContent` (nunca `innerHTML` → sin riesgo XSS),
  añade `visible`, y con `setTimeout(..., 2550)` la quita.
- Un `setTimeout` global (`let temporizadorAviso = null`) se limpia con `clearTimeout` en cada
  llamada: si llegan dos avisos seguidos, el segundo reinicia el reloz y no parpadea.
- `role="status"` + `aria-live="polite"` hacen que los lectores de pantalla lo anuncien sin robar el
  foco. No bloquea nada: la app sigue siendo usable mientras se ve.
- Textos: «Cliente actualizado» (RF-012) y «Cliente eliminado». Cancelar **no** muestra toast (la
  spec solo lo pide tras guardar edición o eliminar).

---

## 6. Casos límite

| Caso | Comportamiento previsto |
|---|---|
| **Cliente editado no visible con el filtro activo** (RF-013) | El modo edición vive en el **formulario** (arriba), no en la tarjeta: cambiar de filtro solo vuelve a pintar la lista. El formulario conserva título, datos y Cancelar. Al guardar, `pintarLista()` muestra lo que corresponda al filtro (el cliente puede no estar visible; es correcto). |
| **Se elimina al cliente que se está editando** | `eliminarCliente(id)` detecta `clienteEditandoId === id` → sale del modo edición (reset del formulario + `pintarFormularioModo()`). No queda un formulario «editando» un cliente que ya no existe. |
| **Doble clic en «Eliminar»** | El segundo clic vuelve a poner `confirmandoEliminarId = id` (el mismo) y repintar: la tarjeta ya mostraba la confirmación, así que el resultado es idempotente (un solo paso «¿Seguro?»). |
| **Doble clic en «Sí» / «Guardar»** | Tras el primer clic la operación se ejecuta, se limpia el estado y se repinta: el botón ya no existe, el segundo clic no encuentra `[data-accion]`/no está en modo edición. Además, tras guardar, `formulario.reset()` deja los campos obligatorios vacíos, de modo que un segundo `submit` falla la validación y **no** crea un registro duplicado. |
| **Doble clic en «Editar»** | `iniciarEdicion(id)` con el mismo id es idempotente (vuelve a cargar los mismos datos). |
| **Notas vacías** | `texto("")` → `""` → la tarjeta no pinta `.notas` (igual que hoy). Al editar, el `textarea` queda vacío y se guarda `""` sin romper nada. |
| **Campos ausentes en clientes v1 / antiguos** | Tolerancia de lectura: `cliente.notas || ""`, `texto(cliente.email)`, etc. Si algún campo es `undefined`, el formulario se rellena con cadena vacía; `fila()` ya omite los vacíos. Nunca se escribe `undefined` en el formulario. |
| **El cliente a editar ya no existe** (borrado desde otra pestaña, datos manipulados) | `buscarCliente()` devuelve `null` → `iniciarEdicion`/`guardarEdicion` hacen `return` con salida limpia a modo registro, sin excepción. |
| **Filtro activo ≠ «Todos» al eliminar** | `pintarLista()` recalcula visibles y contador en el mismo ciclo (RF-010). |
| **Alta de clientes sin tocar** | El `if (clienteEditandoId !== null)` se sitúa **después** de la validación y antes de la lógica de creación; si no hay edición, el flujo es idéntico al de v1. |

---

## 7. Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Romper la compatibilidad con `localStorage` de v1 | **Alto**: pérdida de datos del comercial | No se añaden, renombran ni eliminan campos; mismo objeto `{ id, fecha, empresa, cif, contacto, telefono, email, direccion, tipo, notas }` y misma clave `CLAVE_STORAGE`. Tarea T-08 de prueba explícita con datos de v1. |
| Romper el alta de clientes existente (regresión) | Alto | El camino de creación no se reescribe: solo se le antepone una bifurcación. T-09 recorre alta + filtros antes de cerrar. |
| XSS al pintar datos del usuario | Alto | Se mantiene `escapar()` en todo texto de tarjeta; el toast usa `textContent` con mensajes literales. |
| Estado de confirmación/edición perdido por el re-pintado con `innerHTML` | Medio | Todo el estado vive en variables globales y se regenera en `crearTarjeta()`; no hay estado solo en el DOM. |
| Estados a medias del formulario (título «Editar» pero botón «Guardar cliente», etc.) | Medio | Toda la sincronización pasa por una única función `pintarFormularioModo()`. |
| Doble clic creando registros duplicados | Medio | Ver casos límite: `reset()` + `checkValidity()` impiden el duplicado. |
| Romper el funcionamiento en `file://` | Alto (constitución) | Solo HTML/CSS/JS nativos, sin fetch, sin módulos ES, sin dependencias. |
| Pantallas pequeñas: botones de tarjeta apretados | Bajo | `.boton-tarjeta { flex: 1 }` y `flex-wrap` en la confirmación; se comprueba en la revisión T-09. |

---

## 8. Detalles menores cerrados con el usuario (2026-10-12)

1. **Filtro al guardar una edición:** se **respeta el filtro activo** (no se salta a «Todos»); el
   contador se recalcula igual. Se mantiene el salto a «Todos» solo al crear un cliente (comportamiento v1).
2. **Resaltar la tarjeta del cliente en edición:** **sí**, con borde azul (`.tarjeta.editando`) para
   que el comercial vea de dónde vino la edición.
3. **Scroll automático al formulario al pulsar «Editar»:** **sí**, con desplazamiento suave
   (`scrollIntoView({ behavior: "smooth" })`) tras cargar los datos; esencial en móvil.
