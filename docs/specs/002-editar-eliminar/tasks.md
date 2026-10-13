# Tareas — Spec 002: Editar y eliminar clientes

| Campo | Valor |
|---|---|
| **Spec** | `002-editar-eliminar` (aprobada) |
| **Plan** | `docs/specs/002-editar-eliminar/plan.md` |
| **Archivos** | `index.html`, `styles.css`, `app.js` (nada más) |
| **Verificación** | Manual en el navegador vía MCP de Chrome DevTools: abrir `index.html`, probar la funcionalidad, revisar la consola (sin errores) y comprobar la vista móvil. |

Cada tarea dura ~20-30 min, toca un alcance cerrado y tiene un criterio de "hecho" verificable.
Se ejecutan **en orden**. No se empieza una tarea dejando la anterior sin verificar.

---

- [x] **T-01 — Estructura HTML del formulario y del toast**
  - **Descripción:** En el panel del formulario: añadir `id="panel-formulario"` a la `<section>`, `id="titulo-formulario"` al `<h2>` de «Nuevo cliente», `id="boton-guardar"` al botón submit, envolver los botones en un `div.acciones-formulario` y añadir el botón `#boton-cancelar` (`type="button"`, clase `boton-secundario`, atributo `hidden`). Añadir antes del `<script>` el `<div class="toast" id="toast" role="status" aria-live="polite">`.
  - **Archivos:** `index.html`.
  - **Hecho cuando:** cargada la página se ve **exactamente igual** que la v1 (mismo formulario, sin Cancelar visible, sin toast visible), no hay errores en consola y, en DevTools, los 5 ids nuevos existen en el DOM.

- [x] **T-02 — Botones «Editar» y «Eliminar» en la tarjeta + su CSS**
  - **Descripción:** En `crearTarjeta`, añadir el pie `div.tarjeta-acciones` con los dos botones (`data-accion`, `data-id`, clases `boton-tarjeta`, `boton-editar`, `boton-eliminar`). Añadir el listener delegado de clics en `listaClientes` con ramas `editar` y `eliminar` (de momento solo un `console.log` provisional en cada rama). CSS nuevo: `.tarjeta-acciones`, `.boton-tarjeta` (`flex: 1`, `font: inherit`), `.boton-editar`, `.boton-eliminar`.
  - **Archivos:** `app.js`, `styles.css`.
  - **Hecho cuando:** cada tarjeta muestra los dos botones siempre visibles (RF-003/P5), repartidos a ancho en móvil y alineados bajo los datos con separador; al pulsarlos aparece el mensaje provisional en consola con el `id` correcto; la consola no muestra errores.

- [x] **T-03 — Estado y modo edición: `buscarCliente` + `iniciarEdicion` + `pintarFormularioModo`**
  - **Descripción:** Declarar `clienteEditandoId` y `confirmandoEliminarId` (ambos `null`) junto a `filtroActivo`, más las referencias DOM nuevas. Implementar `buscarCliente(id)`, `iniciarEdicion(id)` (rellena los 8 campos con `texto(...)`, marca `editando`, llama a `pintarFormularioModo()`, `pintarLista()` y scroll al formulario) y `pintarFormularioModo()` (título «Editar cliente», botón «Guardar cambios», muestra Cancelar, clase `modo-edicion` en el panel; o todo a registro cuando es `null`). Conectar la rama `editar` del listener de T-02 a `iniciarEdicion`.
  - **Archivos:** `app.js`.
  - **Hecho cuando:** al pulsar «Editar» el formulario aparece relleno con **todos** los datos de ese cliente, el título dice «Editar cliente», el botón dice «Guardar cambios», Cancelar es visible, el panel y la tarjeta quedan resaltados en azul (RF-001, RF-002, RF-003) y no hay errores en consola.

- [x] **T-04 — Toast `pintarToast`**
  - **Descripción:** Añadir `pintarToast(mensaje)` con `textContent`, clase `visible`, `clearTimeout` del temporizador global y `setTimeout` de ~2500 ms. CSS: `.toast` (fijo abajo centrado, fondo oscuro, opacidad 0/`visibility: hidden` por defecto, transición) y `.toast.visible`. De momento se puede probar con un mensaje temporal.
  - **Archivos:** `app.js`, `styles.css`.
  - **Hecho cuando:** llamando `pintarToast("Prueba")` desde consola, el aviso aparece abajo en móvil y en escritorio, desaparece solo a los ~2,5 s, dos llamadas seguidas no lo hacen parpadear, y **no** tapa botones mientras se ve (`pointer-events: none`).

- [x] **T-05 — Guardar edición (refactor del `submit`)**
  - **Descripción:** En el listener `submit`, tras la validación, bifurcar: `if (clienteEditandoId !== null) { guardarEdicion(datos); return; }` dejando el camino de creación intacto. Implementar `guardarEdicion(datos)`: buscar cliente (si no existe, cancelar), reescribir los 8 campos **conservando `id` y `fecha`**, `guardarClientes()`, salir del modo (`clienteEditandoId = null`, `formulario.reset()`, `pintarFormularioModo()`), `pintarLista()` y `pintarToast("Cliente actualizado")`.
  - **Archivos:** `app.js`.
  - **Hecho cuando:** (RF-004/005/007/012) con un campo obligatorio vacío aparece el error del navegador y **no** cambia nada en `localStorage`; con datos válidos, la tarjeta muestra lo nuevo, el `id`/`fecha` son los originales (comprobar en Application → `localStorage`), no hay duplicados ni reordenación, vuelve a modo registro y aparece el toast «Cliente actualizado».

- [x] **T-06 — Cancelar edición**
  - **Descripción:** Implementar `cancelarEdicion()` (`clienteEditandoId = null`, `formulario.reset()`, `pintarFormularioModo()`) y conectar el botón `#boton-cancelar`. CSS: `.acciones-formulario` y `.boton-secundario`.
  - **Archivos:** `app.js`, `styles.css`.
  - **Hecho cuando:** (RF-006) con campos modificados, «Cancelar» deja el formulario vacío en modo registro (título y botón restaurados, panel sin resaltar, Cancelar oculto), el cliente en `localStorage` conserva sus valores originales y la lista no cambia; el botón Cancelar se ve bien en móvil y escritorio.

- [x] **T-07 — Eliminar con confirmación dentro de la tarjeta**
  - **Descripción:** Rama `eliminar` → `confirmandoEliminarId = id; pintarLista();`. En `crearTarjeta`, si `confirmandoEliminarId === cliente.id` pintar el bloque `div.confirmacion` («¿Seguro?» + botones `confirmar-si`/`confirmar-no`) **en lugar de** `.tarjeta-acciones`; si no, los botones normales. Ramas `confirmar-si` → `eliminarCliente(id)` y `confirmar-no` → `confirmandoEliminarId = null; pintarLista();`. Implementar `eliminarCliente(id)` (filter, salida de modo edición si corresponde, limpiar confirmación, `guardarClientes()`, `pintarLista()`, `pintarToast("Cliente eliminado")`). CSS: `.confirmacion`, `.boton-si`, `.boton-no`.
  - **Archivos:** `app.js`, `styles.css`.
  - **Hecho cuando:** (RF-008/009/010/012) «Eliminar» muestra «¿Seguro?» con «Sí»/«No» escondiendo los botones normales; «No» restaura la tarjeta sin cambios; «Sí» borra solo ese cliente de la lista y de `localStorage` y muestra «Cliente eliminado»; con un filtro activo el contador pasa de N a N-1 sin errores.

- [x] **T-08 — Casos límite y compatibilidad con datos v1**
  - **Descripción:** Comprobar y corregir si hace falta: (a) editar un cliente con campos vacíos/ausentes de v1 (tolerancia, sin `undefined` en el formulario); (b) RF-013, cambiar de filtro con la edición abierta: el formulario no se resetea aunque el cliente editado no sea visible; (c) eliminar al cliente que se está editando → sale del modo edición; (d) dobles clics en «Eliminar», «Sí» y «Guardar» (idempotentes, sin duplicados); (e) notas vacías al editar; (f) seguir viendo y creando clientes de v1 sin cambios.
  - **Archivos:** `app.js` (solo ajustes puntuales), `localStorage` de prueba.
  - **Hecho cuando:** las 6 comprobaciones pasan en el navegador con clientes creados en v1 (sin editar) y con la consola limpia; ningún dato de v1 pierde campos.

- [x] **T-09 — Revisión completa de los criterios de aceptación + vista móvil**
  - **Descripción:** Recorrer uno a uno los 10 bloques de criterios de aceptación de `spec.md` (sección 3) anotando el resultado, revisar la consola en toda la pasada, verificar responsive (≈375 px y escritorio) y actualizar `MEMORY.md` (máx. 50 líneas). No se cierra la feature sin esta pasada.
  - **Archivos:** `app.js`/`styles.css`/`index.html` (solo correcciones), `MEMORY.md`.
  - **Hecho cuando:** los 10 criterios de aceptación de la spec quedan marcados como cumplidos en el navegador, la consola está limpia, la vista móvil no tiene botones cortados ni desbordes, y `MEMORY.md` refleja que 002 está implementada.

---

**Orden sugerido:** T-01 → T-02 → T-03 → T-04 → T-05 → T-06 → T-07 → T-08 → T-09.
T-04 (toast) va antes de T-05 porque guardar edición ya lo usa.
