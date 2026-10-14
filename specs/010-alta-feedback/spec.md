# Spec 010 — Alta con feedback (buscador limpio, aviso y carga robusta)

| Campo | Valor |
|---|---|
| **ID** | `010-alta-feedback` |
| **Título** | Al crear un cliente se limpia el buscador y se avisa; la carga no pierde clientes si falla una escritura |
| **Estado** | **Aprobada** (enfoque aprobado por el usuario el 2026-10-14) |
| **Fecha** | 2026-10-14 |

---

## 1. Contexto y objetivo

De la revisión de errores pedida por el usuario («quiero que busques errores») salieron tres
defectos ya aprobados para corregir:

- **E1**: al crear un cliente con el buscador activo, el filtro vuelve a «Todos» pero el texto
  de búsqueda **no se limpia**: el cliente nuevo puede no verse ni contarse, y el alta **no
  muestra ningún aviso** (el toast de la spec 002 es «actualizado»/«eliminado»). La spec 005
  solo decidía que la búsqueda sobreviva a pestañas y ediciones; el alta no estaba contemplada.
- **E2**: `cargarClientes` (`app.js`) comparte un `try` de lectura y de escritura: si
  fallara `localStorage.setItem` al persistir la migración (cuota llena), devolvería `[]` →
  la app arrancaría vacía y el primer guardado posterior pisaría los datos reales.
- **E3**: errata en `AGENTS.md`: «sobreviene a cambios de filtro».

**Objetivo:** que crear un cliente deje siempre constancia visible (búsqueda limpia + aviso)
y que ningún fallo de escritura pueda vaciar la lista (regla 3: los datos son sagrados).

## 2. Requisitos funcionales (EARS)

- **RF-801** — Al **crear** un cliente, el sistema SHALL limpiar el texto del buscador
  (campo e estado interno) y SHALL mostrar el aviso breve «Cliente guardado», con el filtro
  en «Todos». La edición seguirá mostrando «Cliente actualizado» y el borrado «Cliente
  eliminado». La edición NO limpia la búsqueda (se mantiene la spec 005).
- **RF-802** — Al cargar los datos, si la **lectura/parseo** de `localStorage` falla, el
  sistema SHALL empezar con la lista vacía; si falla **solo la escritura** de la migración,
  SHALL usar en memoria los datos leídos sin persistir (ningún cliente se pierde por un
  fallo de escritura).
- **RF-803** — Se SHALL corregir la errata de `AGENTS.md` («sobreviene» → «sobrevive»).

## 3. Criterios de aceptación

- **Given** hay una búsqueda activa («tela»), **when** se rellena y guarda un cliente nuevo,
  **then** el buscador queda vacío, el filtro en «Todos», el cliente aparece en la lista y el
  toast dice «Cliente guardado».
- **Given** sin búsqueda, **when** se crea un cliente, **then** se ve en la lista y aparece
  «Cliente guardado»; nada más del flujo cambia.
- **Given** un cliente en edición, **when** se guardan los cambios, **then** sigue apareciendo
  «Cliente actualizado» y la búsqueda NO se limpia (spec 005 intacta).
- **Given** `localStorage.setItem` lanza al abrir, **when** la app arranca con datos que
  incluyen tipos antiguos, **then** la lista muestra los clientes con la migración aplicada
  en memoria y no se escribe nada (verificación **en navegador** inyectando el fallo).
- `node --test` en verde con el test nuevo de `mensajeAviso("guardado")`.
- `grep -n "sobreviene" AGENTS.md` sin resultados.

## 4. Casos límite

- Búsqueda ya vacía al crear: no hay nada que limpiar; el aviso se muestra igual.
- Si además fallara un guardado normal posterior, no se modifica `guardarClientes`:
  fuera de alcance (solo aplica RF-802 a la escritura de la migración).

## 5. Fuera de alcance

- No se reescriben las specs 002 ni 005 (RF-801 enmienda el comportamiento del alta aquí,
  dejando sus ficheros intactos, igual que la 009 hizo con la 005).
- No se persiste el buscador entre sesiones; sin cambios de datos guardados ni de esquema.

## 6. Decisiones

1. Limpiar la búsqueda **solo en el alta** (en `app.js`, junto al reset del filtro a «Todos»).
2. Añadir la operación `"guardado"` a `mensajeAviso` (`logica.js`) con su test unitario.
3. `cargarClientes` con dos `try` separados (leer vs. persistir la migración).
4. La errata de AGENTS.md entra como RF-803 para cerrar la revisión de una vez.