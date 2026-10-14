# Spec 002 — Editar y eliminar clientes

| Campo | Valor |
|---|---|
| **ID** | `002-editar-eliminar` |
| **Título** | Editar y eliminar clientes existentes |
| **Estado** | Aprobada por el usuario (2026-10-12) |
| **Fecha** | 2026-10-12 |

---

## 1. Contexto y objetivo

La versión 1 de la aplicación permite registrar clientes, filtrarlos por tipo y consultarlos en una
lista ordenada, pero una vez guardados sus datos no pueden modificarse ni borrarse: cualquier error
de escritura obliga a vivir con él o a eliminar manualmente la clave de `localStorage`.

**Objetivo:** permitir al comercial **editar** los datos de un cliente ya registrado y **eliminarlo**
de forma definitiva de la lista guardada en `localStorage`, manteniendo intactos los clientes ya
existentes de la v1, el orden actual de la lista y la experiencia mobile-first de la aplicación.

---

## 2. Requisitos funcionales (sintaxis EARS)

### Edición

- **RF-001** — Dado que un cliente existe en la lista, cuando el comercial pulse la acción
  «Editar» de su tarjeta, el sistema SHALL iniciar el modo de edición de ese cliente
  identificado por su `id`.

- **RF-002** — Cuando se inicie el modo de edición, el sistema SHALL cargar en el formulario
  todos los datos actuales del cliente seleccionado (empresa, cif, contacto, telefono, email,
  direccion, tipo y notas) para que el comercial pueda modificarlos.

- **RF-003** — Mientras el sistema esté en modo de edición, la interfaz SHALL indicar claramente
  que se está editando un cliente existente (y no creando uno nuevo) y SHALL ofrecer la opción
  de cancelar la edición.

- **RF-004** — Cuando el comercial pulse «Guardar» estando en modo de edición, el sistema SHALL
  validar los campos con las mismas reglas que el registro (empresa, telefono y tipo obligatorios;
  resto opcionales) y, si la validación es correcta, SHALL persistir los cambios en
  `localStorage` actualizando únicamente el cliente editado.

- **RF-005** — Si la validación del formulario falla al guardar los cambios, entonces el sistema
  SHALL mostrar el mismo aviso de error que en el registro y NO SHALL modificar ningún cliente
  guardado.

- **RF-006** — Cuando el comercial pulse «Cancelar» estando en modo de edición, el sistema SHALL
  descartar los cambios introducidos, SHALL volver al modo de registro y SHALL conservar los
  datos originales del cliente intactos en `localStorage`.

- **RF-007** — Al guardar una edición, el sistema SHALL conservar el `id` y la `fecha` originales
  del cliente, de modo que no se pierda ni altere el orden existente de la lista y no se creen
  registros duplicados.

### Eliminación

- **RF-008** — Dado que un cliente existe en la lista, cuando el comercial pulse la acción
  «Eliminar» de su tarjeta, el sistema SHALL mostrar dentro de esa misma tarjeta un paso de
  confirmación («¿Seguro?» con las opciones «Sí, eliminar» y «No»); solo si el comercial confirma con
  «Sí, eliminar», el sistema SHALL eliminar ese cliente de `localStorage`. No se usarán diálogos
  nativos del navegador (`confirm()`).

- **RF-009** — Si el comercial pulsa «No» en el paso de confirmación, entonces el sistema
  SHALL conservar el cliente en la lista sin realizar ningún cambio y SHALL ocultar el paso
  de confirmación, restaurando los botones normales de la tarjeta.

- **RF-010** — Cuando un cliente sea eliminado, el sistema SHALL reflejarlo de inmediato en la
  lista visible y SHALL recalcular el filtro activo para que el contador y los resultados
  permanezcan coherentes.

### Compatibilidad y feedback

- **RF-011** — El sistema SHALL operar sobre el formato de datos existente
  (`{ id, fecha, empresa, cif, contacto, telefono, email, direccion, tipo, notas }`) sin añadir,
  renombrar ni eliminar campos, de modo que los clientes guardados con la v1 puedan editarse y
  eliminarse sin migraciones ni pérdida de datos.

- **RF-012** — Cuando una edición se guarde correctamente o un cliente se elimine, el sistema
  SHALL mostrar al comercial un aviso breve de confirmación en español (p. ej. «Cliente
  actualizado» / «Cliente eliminado»).

### Modo edición y filtros

- **RF-013** — Mientras el sistema esté en modo de edición, cambiar el filtro activo NO SHALL
  cancelar la edición: el formulario permanecerá en modo edición con los datos cargados,
  aunque el cliente editado no resulte visible con el filtro activo.

---

## 3. Criterios de aceptación

### RF-001 / RF-002 — Iniciar edición y cargar datos
- **Given** existen clientes guardados, **when** el comercial pulsa «Editar» en una tarjeta,
  **then** el formulario aparece relleno con los datos exactos de ese cliente (todos los campos)
  y la aplicación entra en modo edición.

### RF-003 / RF-006 — Cancelar edición
- **Given** el sistema está en modo edición con campos modificados, **when** el comercial pulsa
  «Cancelar», **then** el formulario vuelve a estado de registro vacío, el cliente en
  `localStorage` conserva sus valores originales y la lista no cambia.

### RF-004 / RF-005 — Guardar cambios con validación
- **Given** modo edición con un campo obligatorio (empresa, telefono o tipo) vacío, **when**
  el comercial pulsa «Guardar», **then** se muestra el error de validación y en
  `localStorage` no hay ningún cambio.
- **Given** modo edición con datos válidos, **when** pulsa «Guardar», **then** el cliente queda
  actualizado en `localStorage` con los nuevos valores y la lista lo refleja.

### RF-007 — Integridad de id, fecha y orden
- **Given** un cliente con `id` = X y `fecha` = Y, **when** se guarda su edición, **then** sigue
  teniendo `id` = X y `fecha` = Y, no aparece duplicado y su posición relativa en la lista no
  cambia.

### RF-008 / RF-009 — Eliminar con confirmación en la tarjeta
- **Given** un cliente en la lista, **when** el comercial pulsa «Eliminar», **then** aparece
  dentro de la tarjeta un paso de confirmación «¿Seguro?» con «Sí, eliminar» y «No», y los botones
  normales dejan de mostrarse.
- **Given** el paso de confirmación visible, **when** el comercial pulsa «Sí, eliminar», **then** el
  cliente desaparece de la lista y de `localStorage`, y los demás clientes quedan intactos.
- **Given** el paso de confirmación visible, **when** el comercial pulsa «No», **then** el
  cliente sigue en la lista y en `localStorage`, y la tarjeta vuelve a su estado normal.

### RF-010 — Coherencia tras eliminar con filtro activo
- **Given** el filtro «Tela» activo con N clientes, **when** se elimina uno de ellos,
  **then** la lista muestra N-1 clientes y el recuento/filtros se actualizan sin errores.

### RF-011 — Compatibilidad con datos de v1
- **Given** `localStorage` contiene clientes creados en la v1 (sin ninguna edición previa),
  **when** el comercial los edita o elimina, **then** la operación funciona correctamente y los
  clientes no afectados conservan todos sus campos.

### RF-012 — Avisos al usuario
- **Given** una edición exitosa o una eliminación confirmada, **when** la operación finaliza,
  **then** el comercial ve un aviso en español de que la operación se completó (y el aviso no
  bloquea el uso posterior de la aplicación más de lo necesario).

### RF-013 — Edición persistente al cambiar de filtro
- **Given** el sistema en modo edición con datos cargados, **when** el comercial cambia de
  pestaña de filtro, **then** el formulario sigue en modo edición con los mismos datos y el
  título/indicación de edición intactos.

---

## 4. Reglas de negocio y datos

1. **`id` al editar:** se conserva el `id` original. Nunca se genera un nuevo `id` al guardar
   cambios (evita duplicados y rompe relaciones futuras).
2. **`fecha` al editar:** se conserva la `fecha` original (fecha de creación). Es la opción más
   segura porque la lista se ordena por `fecha` y cambiarla reordenaría la lista y podría
   "esconder" el cliente editado al principio o al final de forma sorprendente.
3. **Orden de la lista:** no cambia por el solo hecho de editar; se mantiene el orden existente
   (más reciente a más antiguo por `fecha` de creación).
4. **Eliminar:** borra el objeto completo del array y regraba `localStorage` con los clientes
   restantes, respetando el mismo formato.
5. **Formato de datos:** se conserva íntegro
   `{ id, fecha, empresa, cif, contacto, telefono, email, direccion, tipo, notas }`. Esta feature
   NO añade campos nuevos (si en el futuro se quisiera registrar "fecha de última modificación",
   requeriría spec propia con migración compatible hacia atrás).
6. **Compatibilidad v1:** los clientes guardados antes de esta feature se leen, editan y eliminan
   sin ninguna migración; si algún campo antiguo viniera vacío o ausente, la edición debe
   tratarlo como valor vacío sin fallar (tolerancia de lectura).
7. **Modo edición persistente:** cambiar de filtro NO cancela la edición en curso; el modo
   edición solo termina al guardar, al cancelar o al eliminar el cliente editado.

---

## 5. Decisiones tomadas (aprobadas por el usuario, 2026-10-12)

| # | Pregunta | Decisión | Justificación |
|---|---|---|---|
| P1 | ¿Editar reutiliza el mismo formulario o se abre un modal? | **Reutilizar el mismo formulario** en modo edición (título/cambios visibles y botón «Cancelar»). | Reutiliza la validación y el HTML existentes, mantiene la spec mínima y es más fiable en móvil que un modal nuevo. |
| P2 | ¿Eliminar pide confirmación con `confirm()` nativo o con un paso extra en la tarjeta? | **Paso extra dentro de la tarjeta** («¿Seguro?» con «Sí» / «No»). No se usa `confirm()`. | Experiencia más cuidada y coherente con el diseño; la confirmación vive en el contexto del cliente que se va a borrar. |
| P3 | ¿Al editar, el cliente pasa al principio de la lista o conserva su posición? | **Conserva su posición** (no se toca `fecha`). | Evita reordenaciones sorpresivas y es lo más seguro para no perder el orden existente. |
| P4 | ¿Se muestra aviso "cliente actualizado"/"cliente eliminado"? | **Sí**, mensaje breve tipo *toast* automático. | Da certeza al comercial de que la operación crítica se guardó, sin bloquear el flujo. El mecanismo exacto se define en `plan.md`. |
| P5 | ¿Botones «Editar» y «Eliminar» siempre visibles en cada tarjeta? | **Sí, siempre visibles.** | En móvil no hay *hover*; visibles = descubribles y accesibles con el pulgar. |
| P6 | ¿Qué pasa con el modo edición si el comercial cambia de filtro? | **La edición sigue activa** (RF-013): el formulario no se resetea al cambiar de pestaña. | Evita perder trabajo en curso por un toque accidental en un filtro. |

---

## 6. Fuera de alcance

- Buscar / filtrar clientes por texto.
- Exportar o importar datos (CSV, JSON, copias de seguridad).
- Login, usuarios o multi-dispositivo; sincronización en la nube.
- Campos nuevos en la ficha (por ejemplo fecha de última modificación, historial de cambios).
- Deshacer/reenumera operaciones (papelera, "deshacer" tras eliminar).
- Cambiar el orden predeterminado de la lista o la estrategia de ordenación.
- Notificaciones push, emails o integraciones externas.
- Refactorizaciones que no sean necesarias para esta feature.
