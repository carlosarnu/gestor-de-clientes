# Plan — Spec 005 · Buscador de texto y etiqueta «Espuma»

**Estado:** aprobado (spec 005 aprobada 2026-10-13)

---

## 1. Cambios en `logica.js` (funciones puras, con tests)

| Función | Qué hace |
|---|---|
| `nombreTipo(tipo)` | `"FOAM"` → `"Espuma"`; cualquier otro tipo pasa tal cual (RF-301) |
| `normalizar(valor)` | minúsculas + quita acentos (NFD + `[\u0300-\u036f]`) y espacios (RF-303) |
| `buscarClientes(lista, consulta)` | consulta vacía → lista completa; si no, divide en palabras y **todas** deben aparecer en el texto normalizado del cliente (empresa, cif, contacto, telefono, email, direccion, notas, tipo **y** su nombre en español). No muta la lista (RF-302/303) |

## 2. Cambios en `index.html`

- Botón de filtro `data-filtro="FOAM"`: texto «FOAM» → **«Espuma»** (el `data-filtro` NO cambia).
- Opción del desplegable: `<option value="FOAM">Espuma</option>` (el `value` NO cambia).
- Subtítulo de cabecera: «Clientes de tela, foam y estructuras» → «… espuma …».
- Nuevo campo entre `.lista-cabecera` y `.filtros`:
  `<label for="buscador">Buscar cliente</label><input type="search" id="buscador" … autocomplete="off">`.

## 3. Cambios en `app.js` (solo presentación)

- Estado: `let textoBusqueda = "";` + elemento `buscador` + listener `input` →
  `textoBusqueda = buscador.value; pintarLista();` (sin reiniciar al cambiar de filtro ni al editar).
- `pintarLista()`: `visibles = buscarClientes(filtrarClientes(ordenarClientes(clientes), filtroActivo), textoBusqueda)`.
- Lista vacía: si `textoBusqueda` → «No hay coincidencias para «X». Prueba con otras palabras o
  pestaña «Todos».»; si no, los mensajes actuales pero usando `nombreTipo(filtroActivo)`.
- Badge de la tarjeta: texto con `nombreTipo(cliente.tipo)` (la clase CSS sigue siendo `claseTipo`).
- El contador ya usa `visibles.length`: refleja la búsqueda sin cambios.

## 4. Cambios en `styles.css`

| Clase | Estilo resumido |
|---|---|
| `.buscador` | `margin-bottom: 12px;` bloque completo |
| `.buscador label` | `font-size: .875rem; font-weight: 600; color: var(--tinta-media);` |
| `.buscador input` | `width: 100%; font: inherit; padding: 12px 14px;` (≥44 px) borde `--linea`, radio `--radio`, fondo `--superficie`, focus ring igual que el resto |

## 5. Tests nuevos (`test-logica.js`)

- `nombreTipo`: `"FOAM"`→`"Espuma"`, `"Tela"`→`"Tela"`, `"Estructuras"`→`"Estructuras"`.
- `normalizar`: mayúsculas, acentos, ñ, espacios sobrantes.
- `buscarClientes`: vacía → todo; por empresa (insensible a mayúsculas); multi-palabra «y»
  repartida entre campos; acentos; por teléfono; por tipo (encuentra «espuma» y «foam»);
  sin coincidencias → lista vacía; no muta la original.

## 6. Verificación obligatoria (RF-307)

1. `node --test` en verde.
2. Chrome DevTools: filtro/badge/desplegable dicen «Espuma» y `localStorage` conserva `"FOAM"`;
   búsqueda en tiempo real, multi-palabra y sin acentos; contador correcto; mensaje de
   «sin coincidencias»; búsqueda persiste al cambiar de filtro y al editar; regresión 002/004;
   móvil 375 px sin desbordamiento; consola limpia.
3. Borrar datos de prueba al terminar.
