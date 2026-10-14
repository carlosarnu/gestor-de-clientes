# Plan — Spec 010 · Alta con feedback

**Estado:** aprobado (spec 010 aprobada 2026-10-14)

---

## 1. `logica.js`

| Cambio | Detalle |
|---|---|
| `mensajeAviso(operacion)` | `"guardado"` → «Cliente guardado» (RF-801); «eliminado» y el resto igual |

## 2. `test-logica.js` (+1 test = 35)

- `mensajeAviso("guardado")` → «Cliente guardado» (RF-801).

## 3. `app.js`

| Cambio | Detalle |
|---|---|
| Submit de **alta** | Tras guardar: `textoBusqueda = ""`, `campoBuscador.value = ""` y `pintarAviso(mensajeAviso("guardado"))` (RF-801). La rama de edición no cambia. |
| `cargarClientes` | Dos `try`: lectura/parseo (fallo → `[]`) y escritura de la migración (fallo → seguir en memoria) (RF-802). |

## 4. Documentación

- `AGENTS.md`: «sobreviene» → «sobrevive» (RF-803).
- `MEMORY.md`: línea de la 010 al terminar.

## 5. Verificación

`node --check` + `node --test` (35) + Chrome DevTools: alta con búsqueda previa (queda limpia
y aviso «Cliente guardado»), edición sigue con «Cliente actualizado» y sin limpiar la
búsqueda, inyectando un `localStorage.setItem` que lance la lista se ve migrada en memoria
sin escritura, consola limpia, móvil 375 y datos de prueba borrados.